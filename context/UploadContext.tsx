'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/context/UserContext';
import { useToast } from '@/components/ToastProvider';
import UpgradeModal from '@/components/UpgradeModal';
import { cleanDocumentTitle } from '@/utils/formatTitle';
import { normalizeMaterialStatus } from '@/lib/material-status';
import type { UsageSummary } from '@/types/usage';

export interface ProcessingJob {
  id: string;
  title: string;
  status: 'queued' | 'uploading' | 'parsing' | 'extracting' | 'generating' | 'finalizing' | 'completed' | 'failed' | string;
  progress: number;
  targetProgress: number;
  message: string;
  elapsedTime: number;
  estimatedTime?: string;
  materialId?: string;
  retryable?: boolean;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UploadContextValue {
  processBackgroundUpload: (file: File) => Promise<void>;
  cancelUpload: () => void;
  cancelJob: (jobId: string) => Promise<void>;
  retryJob: (jobId: string) => Promise<void>;
  uploadStatus: UploadStatus;
  uploadMessage: string | null;
  uploadProgress: number;
  clearUploadState: () => void;
  activeQueue: string[];
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
  jobs: ProcessingJob[];
  removeJob: (id: string) => Promise<void>;
}

const UploadContext = createContext<UploadContextValue | undefined>(undefined);

function friendlyProcessingFailure(code?: string | null, message?: string | null): string {
  const knownMessages: Record<string, string> = {
    DOCUMENT_PAGE_LIMIT: 'This PDF has more pages than your plan allows.',
    WEEKLY_PAGE_LIMIT: 'You have reached your weekly PDF page allowance.',
    GENERATION_LIMIT: 'You have reached your monthly study-kit allowance.',
    PROVIDER_TIMEOUT: 'The AI service took too long to respond. Please retry.',
    PROVIDER_RATE_LIMIT: 'The AI service is busy right now. Please retry shortly.',
    OUTPUT_VALIDATION_FAILED: 'The AI response did not meet Omnave quality checks. Please retry.',
  };
  return (code && knownMessages[code]) || message || 'AI generation failed. Please try again.';
}

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { 
    user, 
    refreshUser, 
    addNotification, 
    removeNotification, 
    addLessonToState, 
    removeLessonFromState 
  } = useUserContext();
  const { toast } = useToast();
  
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeQueue, setActiveQueue] = useState<string[]>([]);

  const abortControllersRef = useRef<Record<string, AbortController>>({});
  const intervalsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const elapsedIntervalsRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Ticker for interpolating progress bar fills for all active jobs
  useEffect(() => {
    const ticker = setInterval(() => {
      setJobs((prevJobs) => {
        let changed = false;
        const nextJobs = prevJobs.map((job) => {
          if (job.status === 'completed' || job.status === 'failed') return job;
          
          if (job.progress < job.targetProgress) {
            changed = true;
            return { ...job, progress: job.progress + 1 };
          } else if (job.progress < 99 && job.targetProgress < 100) {
            // Slow tick when target is not yet reached
            if (Math.random() > 0.75) {
              changed = true;
              return { ...job, progress: job.progress + 1 };
            }
          }
          return job;
        });
        return changed ? nextJobs : prevJobs;
      });
    }, 200);

    return () => clearInterval(ticker);
  }, []);

  // Cleanup all polling and elapsed intervals on provider unmount
  useEffect(() => {
    return () => {
      Object.values(intervalsRef.current).forEach((interval) => clearInterval(interval));
      Object.values(elapsedIntervalsRef.current).forEach((interval) => clearInterval(interval));
      intervalsRef.current = {};
      elapsedIntervalsRef.current = {};
    };
  }, []);

  // Real-time Database Polling function
  const startPollingForMaterial = useCallback((materialId: string, cleanTitle: string) => {
    if (intervalsRef.current[materialId]) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const STATUS_PROGRESS: Record<string, number> = {
      'PARSING_DOCUMENT': 35,
      'GENERATING_SUMMARY': 65,
      'BUILDING_ASSESSMENTS': 95,
      'COMPLETED': 100,
    };

    const STATUS_TEXT: Record<string, string> = {
      'PARSING_DOCUMENT': 'Parsing document text...',
      'GENERATING_SUMMARY': 'AI generating study flashcards...',
      'BUILDING_ASSESSMENTS': 'Assembling practice assessments...',
      'COMPLETED': 'Study kit ready!',
    };

    // Estimations based on average process duration (total: ~45-60s)
    const getEstimatedRemainingTime = (status: string, elapsed: number): string => {
      if (status === 'PARSING_DOCUMENT') return `~${Math.max(30 - elapsed, 10)}s remaining`;
      if (status === 'GENERATING_SUMMARY') return `~${Math.max(15 - (elapsed - 15), 5)}s remaining`;
      if (status === 'BUILDING_ASSESSMENTS') return '~5s remaining';
      return 'Finishing up...';
    };

    // Increment elapsed time count
    const elapsedInterval = setInterval(() => {
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id === materialId) {
            const newElapsed = j.elapsedTime + 1;
            const currentStatusText = j.status.toUpperCase();
            return { 
              ...j, 
              elapsedTime: newElapsed,
              estimatedTime: getEstimatedRemainingTime(currentStatusText, newElapsed)
            };
          }
          return j;
        })
      );
    }, 1000);
    elapsedIntervalsRef.current[materialId] = elapsedInterval;

    const pollInterval = setInterval(async () => {
      // Guard Clause 1: If polling interval was cancelled/deleted, terminate timer immediately
      if (!intervalsRef.current[materialId]) {
        clearInterval(pollInterval);
        if (elapsedIntervalsRef.current[materialId]) {
          clearInterval(elapsedIntervalsRef.current[materialId]);
          delete elapsedIntervalsRef.current[materialId];
        }
        return;
      }

      try {
        const statusResponse = await fetch(`/api/process-material/${materialId}`, { cache: 'no-store' });
        const statusPayload = await statusResponse.json() as {
          material?: { is_processed?: boolean; status?: string; failure_code?: string | null; failure_message?: string | null };
          attempt?: { status?: string; failure_code?: string | null; failure_message?: string | null; retryable?: boolean } | null;
        };
        const checkData = statusPayload.material;

        // Guard Clause 2: Check if job was cancelled while fetch was in-flight
        if (!intervalsRef.current[materialId]) {
          clearInterval(pollInterval);
          if (elapsedIntervalsRef.current[materialId]) {
            clearInterval(elapsedIntervalsRef.current[materialId]);
            delete elapsedIntervalsRef.current[materialId];
          }
          return;
        }

        if (!statusResponse.ok || !checkData) {
          console.error('[UploadContext] job status request failed');
          return;
        }

        if (checkData) {
          const status = normalizeMaterialStatus(checkData.status);

          if (status === 'CANCELLED') {
            clearInterval(pollInterval);
            clearInterval(elapsedInterval);
            delete intervalsRef.current[materialId];
            delete elapsedIntervalsRef.current[materialId];
            setActiveQueue((prev) => prev.filter((id) => id !== materialId));
            setJobs((prev) => prev.filter((j) => j.id !== materialId));
            return;
          }
          
          if (status === 'FAILED') {
            clearInterval(pollInterval);
            clearInterval(elapsedInterval);
            delete intervalsRef.current[materialId];
            delete elapsedIntervalsRef.current[materialId];

            removeLessonFromState(materialId);
            removeNotification(`processing-${materialId}`);
            setActiveQueue((prev) => prev.filter((id) => id !== materialId));

            setJobs((prev) =>
              prev.map((j) =>
                j.id === materialId
                  ? {
                      ...j,
                      status: 'failed',
                      progress: 0,
                      targetProgress: 0,
                      message: friendlyProcessingFailure(
                        statusPayload.attempt?.failure_code || checkData.failure_code,
                        statusPayload.attempt?.failure_message || checkData.failure_message,
                      ),
                      estimatedTime: 'Quota was refunded',
                      retryable: Boolean(statusPayload.attempt?.retryable)
                    }
                  : j
              )
            );
            toast(`AI generation failed for "${cleanTitle}".`, 'error');
            return;
          }

          const progressNum = STATUS_PROGRESS[status] || 25;
          const statusMsg = STATUS_TEXT[status] || 'Extracting core data...';

          setJobs((prev) =>
            prev.map((j) =>
              j.id === materialId
                ? {
                    ...j,
                    status: status.toLowerCase(),
                    targetProgress: progressNum,
                    message: statusMsg,
                  }
                : j
            )
          );

          if (checkData.is_processed || status === 'COMPLETED') {
            clearInterval(pollInterval);
            clearInterval(elapsedInterval);
            delete intervalsRef.current[materialId];
            delete elapsedIntervalsRef.current[materialId];
            setActiveQueue((prev) => prev.filter((id) => id !== materialId));

            // Small delay to let progress hit 100 before transition
            setTimeout(async () => {
              removeNotification(`processing-${materialId}`);

              // Fetch completed lesson
              const { data: fullLesson } = await supabase
                .from('materials')
                .select('*')
                .eq('id', materialId)
                .single();

              if (fullLesson) {
                addLessonToState(fullLesson);
              }
              
              addNotification({
                id: `processed-${materialId}`,
                type: 'lesson',
                title: 'Material Processed',
                desc: `"${cleanTitle}" is ready.`,
                time: 'Just now',
              });

              setJobs((prev) =>
                prev.map((j) =>
                  j.id === materialId
                    ? {
                        ...j,
                        status: 'completed',
                        progress: 100,
                        targetProgress: 100,
                        message: 'Study kit ready!',
                        estimatedTime: 'Completed'
                      }
                    : j
                )
              );

              toast(`"${cleanTitle}" processed successfully!`, 'success');
              await refreshUser();
              router.refresh();
            }, 1000);
          }
        }
      } catch (pollErr) {
        console.error('[UploadContext] polling catch error:', pollErr);
      }
    }, 3500);

    intervalsRef.current[materialId] = pollInterval;

    // A slow browser timer must not declare a durable server job failed.
    setTimeout(() => {
      if (intervalsRef.current[materialId]) {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === materialId && j.status !== 'completed' && j.status !== 'failed'
              ? {
                  ...j,
                  message: 'Still processing safely in the background...',
                  estimatedTime: 'Taking longer than usual'
                }
              : j
          )
        );
      }
    }, 180000);
  }, [addLessonToState, addNotification, removeNotification, removeLessonFromState, toast, refreshUser, router]);

  // Poll DB for re-connecting active jobs on mount or authentication
  useEffect(() => {
    if (!user) return;
    const fetchActiveMaterials = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      try {
        const { data, error } = await supabase
          .from('materials')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_processed', false)
          .not('status', 'in', '(FAILED,CANCELLED)');

        if (error) {
          console.error('[UploadContext] Error fetching active materials on mount:', error);
          return;
        }

        if (data && data.length > 0) {
          data.forEach((material) => {
            setJobs((prev) => {
              if (prev.some(j => j.id === material.id || j.materialId === material.id)) return prev;
              
              // Set initial target progress based on DB status
              let initProgress = 30;
              if (material.status === 'GENERATING_SUMMARY') initProgress = 60;
              if (material.status === 'BUILDING_ASSESSMENTS') initProgress = 90;

              startPollingForMaterial(material.id, material.title);
              
              return [
                ...prev,
                {
                  id: material.id,
                  title: material.title,
                  status: 'parsing', // fallback label
                  progress: initProgress - 10,
                  targetProgress: initProgress,
                  message: 'Reconnected to ongoing generation...',
                  elapsedTime: 0,
                  materialId: material.id
                }
              ];
            });
          });
        }
      } catch (err) {
        console.error('[UploadContext] Unexpected error fetching active materials:', err);
      }
    };
    fetchActiveMaterials();
  }, [user, startPollingForMaterial]);

  const removeJob = useCallback(async (id: string) => {
    // FIX 1: Immediately destroy interval timers
    if (intervalsRef.current[id]) {
      clearInterval(intervalsRef.current[id]);
      delete intervalsRef.current[id];
    }
    if (elapsedIntervalsRef.current[id]) {
      clearInterval(elapsedIntervalsRef.current[id]);
      delete elapsedIntervalsRef.current[id];
    }
    if (abortControllersRef.current[id]) {
      abortControllersRef.current[id].abort();
      delete abortControllersRef.current[id];
    }

    // Dismiss only the local activity card. Deleting a study kit belongs to the
    // explicit Library delete flow and must never be coupled to this close icon.
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setActiveQueue((prev) => prev.filter((item) => item !== id));
    removeNotification(`processing-${id}`);
  }, [removeNotification]);

  const cancelJob = useCallback(async (jobId: string) => {
    // Move local state mutations to the very top (optimistic UI)
    setJobs((prev) => prev.filter((job) => job.id !== jobId));
    setActiveQueue((prev) => prev.filter((id) => id !== jobId));
    removeLessonFromState(jobId);
    removeNotification(`processing-${jobId}`);

    // Abort HTTP upload request
    if (abortControllersRef.current[jobId]) {
      abortControllersRef.current[jobId].abort();
      delete abortControllersRef.current[jobId];
    }

    // Clear timers
    if (intervalsRef.current[jobId]) {
      clearInterval(intervalsRef.current[jobId]);
      delete intervalsRef.current[jobId];
    }
    
    if (elapsedIntervalsRef.current[jobId]) {
      clearInterval(elapsedIntervalsRef.current[jobId]);
      delete elapsedIntervalsRef.current[jobId];
    }

    // If registered, call backend cancellation API and stamp DB tombstone
    if (!jobId.startsWith('temp-')) {
      try {
        // The server owns lifecycle transitions and verifies material ownership.
        await fetch("/api/process-material/cancel", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ materialId: jobId }),
        });
        await refreshUser();
      } catch (err) {
        console.error('[UploadContext] cancelJob API error:', err);
      }
    }
 
    toast('Processing cancelled.', 'info');
  }, [removeLessonFromState, removeNotification, toast, refreshUser]);

  const retryJob = useCallback(async (jobId: string) => {
    const job = jobs.find((item) => item.id === jobId);
    if (!job || jobId.startsWith('temp-') || !job.retryable) return;

    setJobs((prev) => prev.map((item) => item.id === jobId ? {
      ...item,
      status: 'queued',
      progress: 5,
      targetProgress: 20,
      message: 'Requesting a safe retry...',
      estimatedTime: 'Queued',
      retryable: false,
    } : item));

    try {
      const response = await fetch('/api/process-material/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialId: jobId, idempotencyKey: crypto.randomUUID() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error?.message || payload?.message || payload?.error || 'Retry could not start');

      setActiveQueue((prev) => prev.includes(jobId) ? prev : [...prev, jobId]);
      setJobs((prev) => prev.map((item) => item.id === jobId ? {
        ...item,
        status: 'queued',
        message: 'Retry queued. Your allowance is reserved only while processing.',
      } : item));
      startPollingForMaterial(jobId, job.title);
      toast(`Retry started for "${job.title}".`, 'info');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Retry could not start';
      setJobs((prev) => prev.map((item) => item.id === jobId ? {
        ...item,
        status: 'failed',
        progress: 0,
        targetProgress: 0,
        message,
        estimatedTime: 'Retry available',
        retryable: true,
      } : item));
      toast(message, 'error');
    }
  }, [jobs, startPollingForMaterial, toast]);

  // Backward compatible cancelUpload trigger (cancels latest active job)
  const cancelUpload = useCallback(async () => {
    const activeJob = jobs.find(j => j.status !== 'completed' && j.status !== 'failed');
    if (activeJob) {
      await cancelJob(activeJob.id);
    }
  }, [jobs, cancelJob]);

  // Main Background Upload orchestrator
  const processBackgroundUpload = useCallback(
    async (file: File) => {
      const tempJobId = `temp-${Date.now()}`;
      let registeredMaterialId: string | null = null;
      
      const newJob: ProcessingJob = {
        id: tempJobId,
        title: file.name,
        status: 'uploading',
        progress: 5,
        targetProgress: 15,
        message: 'Initializing connection...',
        elapsedTime: 0,
        estimatedTime: 'Calculating...'
      };
      setJobs((prev) => [...prev, newJob]);

      // Temporary local elapsed counter before DB registration
      const tempElapsedInterval = setInterval(() => {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === tempJobId
              ? { ...j, elapsedTime: j.elapsedTime + 1 }
              : j
          )
        );
      }, 1000);

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const abortController = new AbortController();
      abortControllersRef.current[tempJobId] = abortController;
      const signal = abortController.signal;

      const planType = user?.plan_type || 'free';
      // Friendly preflight only; the database reservation remains authoritative.
      let usage: UsageSummary | null = null;
      try {
        const response = await fetch('/api/usage/summary', { cache: 'no-store' });
        if (response.ok) usage = await response.json() as UsageSummary;
      } catch (error) {
        console.warn('[UploadContext] Usage preflight unavailable:', error);
      }

      if (usage && usage.pages.remaining <= 0) {
          clearInterval(tempElapsedInterval);
          setShowUpgradeModal(true);
          setJobs((prev) =>
            prev.map((j) =>
              j.id === tempJobId
                ? { ...j, status: 'failed', progress: 0, targetProgress: 0, message: `Weekly page limit reached (${usage.pages.limit} pages/week).`, estimatedTime: 'Limit' }
                : j
            )
          );
          toast(`Weekly page limit reached (${usage.pages.limit} pages/week).`, 'error');
          return;
      }

      const maxFileBytes = usage?.maxFileBytes ?? (planType === 'pro' ? 50 : 15) * 1024 * 1024;
      const maxFileMB = Math.round(maxFileBytes / (1024 * 1024));
      if (file.size > maxFileBytes) {
        clearInterval(tempElapsedInterval);
        if (planType === 'free') setShowUpgradeModal(true);
        setJobs((prev) =>
          prev.map((j) =>
            j.id === tempJobId
              ? { ...j, status: 'failed', progress: 0, targetProgress: 0, message: `${planType === 'pro' ? 'Pro' : 'Free tier'} limit is ${maxFileMB}MB.`, estimatedTime: 'Limit' }
              : j
          )
        );
        toast(`${planType === 'pro' ? 'Pro' : 'Free tier'} limit is ${maxFileMB}MB.`, 'error');
        return;
      }

      const cleanTitle = cleanDocumentTitle(file.name);
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const idempotencyKey = crypto.randomUUID();
      const filePath = `${user?.id}/${idempotencyKey}_${safeFileName}`;

      try {
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !currentUser) {
          throw new Error('Please sign in to upload.');
        }

        if (signal.aborted) {
          clearInterval(tempElapsedInterval);
          return;
        }

        // STEP 1: Upload to Storage bucket
        setJobs((prev) =>
          prev.map((j) =>
            j.id === tempJobId
              ? { ...j, targetProgress: 25, message: 'Uploading PDF to cloud storage...' }
              : j
          )
        );

        const { error: uploadError } = await supabase.storage
          .from('study_materials')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        if (signal.aborted) {
          clearInterval(tempElapsedInterval);
          return;
        }

        if (signal.aborted) {
          clearInterval(tempElapsedInterval);
          return;
        }

        // STEP 2: Server-owned registration, validation, and queue reservation
        setJobs((prev) =>
          prev.map((j) =>
            j.id === tempJobId
              ? { ...j, targetProgress: 40, message: 'Validating and registering study material...' }
              : j
          )
        );

        const response = await fetch('/api/process-material', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idempotencyKey,
            storagePath: filePath,
            title: cleanTitle,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'application/pdf',
          }),
          signal,
        });

        let apiStatus = 'QUEUED';
        let succJson: { status?: string; materialId?: string } | null = null;
        if (!response.ok) {
          let apiErrMsg = 'AI processing request failed.';
          try {
            const errJson = await response.json();
            if (errJson?.message) apiErrMsg = errJson.message;
            else if (errJson?.error?.message) apiErrMsg = errJson.error.message;
            else if (typeof errJson?.error === 'string') apiErrMsg = errJson.error;
          } catch {}
          throw new Error(apiErrMsg);
        } else {
          try {
            succJson = await response.json() as { status?: string; materialId?: string };
            if (succJson?.status) apiStatus = succJson.status;
          } catch {}
        }

        if (signal.aborted) return;

        const actualId = succJson?.materialId;
        if (!actualId) throw new Error('The server did not return a material ID.');

        clearInterval(tempElapsedInterval);
        registeredMaterialId = actualId;
        abortControllersRef.current[actualId] = abortController;
        delete abortControllersRef.current[tempJobId];
        setJobs((prev) => {
          const registeredJob = prev.find((job) => job.id === tempJobId);
          const withoutDuplicates = prev.filter((job) =>
            job.id !== tempJobId && job.id !== actualId && job.materialId !== actualId
          );
          return [
            ...withoutDuplicates,
            {
              ...(registeredJob ?? newJob),
              id: actualId,
              materialId: actualId,
              status: 'parsing',
              targetProgress: 55,
              message: 'AI generation queued...',
            },
          ];
        });
        setActiveQueue((prev) => [...prev.filter((id) => id !== tempJobId), actualId]);
        await refreshUser();

        if (apiStatus === 'COMPLETED') {
          // Success (Cache hit)
          setJobs((prev) =>
            prev.map((j) =>
              j.id === actualId
                ? { ...j, status: 'completed', progress: 100, targetProgress: 100, message: 'Study kit ready!', estimatedTime: 'Completed' }
                : j
            )
          );
          setActiveQueue((prev) => prev.filter((id) => id !== actualId));

          addNotification({
            id: `processed-${actualId}`,
            type: 'lesson',
            title: 'Material Processed',
            desc: `"${cleanTitle}" is ready.`,
            time: 'Just now',
          });

          // Fetch completed lesson
          const { data: fullLesson } = await supabase
            .from('materials')
            .select('*')
            .eq('id', actualId)
            .single();

          if (fullLesson) {
            addLessonToState(fullLesson);
          }

          toast(`"${cleanTitle}" processed successfully!`, 'success');
          await refreshUser();
          router.refresh();
        } else {
          // Start live DB polling queue for document worker
          startPollingForMaterial(actualId, cleanTitle);
        }

      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('[UploadContext] processing aborted');
          // Ask the authenticated server route to cancel the durable job.
          const abortedId = registeredMaterialId || tempJobId;
          if (abortedId && !abortedId.startsWith('temp-')) {
            try {
              await fetch('/api/process-material/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ materialId: abortedId }),
              });
            } catch (dbErr) {
              console.error('[UploadContext] AbortError cancellation error:', dbErr);
            }
          } else {
            await supabase.storage.from('study_materials').remove([filePath]);
          }
          return;
        }
        
        const errMsg = error instanceof Error ? error.message : 'Error processing document.';
        const activeId = registeredMaterialId || tempJobId;

        if (activeId && !activeId.startsWith('temp-')) {
          try {
            await fetch('/api/process-material/cancel', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ materialId: activeId }),
            });
          } catch (dbErr) {
            console.error('[UploadContext] Processing cleanup cancellation error:', dbErr);
          }
        } else {
          await supabase.storage.from('study_materials').remove([filePath]);
        }

        setJobs((prev) =>
          prev.map((j) =>
            j.id === activeId
              ? { ...j, status: 'failed', progress: 0, targetProgress: 0, message: errMsg, estimatedTime: 'Failed' }
              : j
          )
        );
        toast(errMsg, 'error');
      }
    },
    [user, refreshUser, addNotification, addLessonToState, startPollingForMaterial, toast, router]
  );

  // Compute overall status variables for backwards compatibility
  const activeJobs = useMemo(() => jobs.filter(j => j.status !== 'completed' && j.status !== 'failed'), [jobs]);
  
  const uploadStatus = useMemo<UploadStatus>(() => {
    if (activeJobs.length === 0) return 'idle';
    if (activeJobs.some(j => j.status === 'failed')) return 'error';
    return 'uploading';
  }, [activeJobs]);

  const uploadProgress = useMemo(() => {
    if (activeJobs.length === 0) return 0;
    const totalProgress = activeJobs.reduce((acc, j) => acc + j.progress, 0);
    return Math.round(totalProgress / activeJobs.length);
  }, [activeJobs]);

  const uploadMessage = useMemo(() => {
    if (activeJobs.length === 0) return null;
    return activeJobs[activeJobs.length - 1].message;
  }, [activeJobs]);

  const clearUploadState = useCallback(() => {
    Object.values(intervalsRef.current).forEach((interval) => clearInterval(interval));
    Object.values(elapsedIntervalsRef.current).forEach((interval) => clearInterval(interval));
    Object.values(abortControllersRef.current).forEach((controller) => controller.abort());
    intervalsRef.current = {};
    elapsedIntervalsRef.current = {};
    abortControllersRef.current = {};
    setJobs([]);
    setActiveQueue([]);
  }, []);

  const value = useMemo(
    () => ({
      processBackgroundUpload,
      cancelUpload,
      cancelJob,
      retryJob,
      uploadStatus,
      uploadMessage,
      uploadProgress,
      clearUploadState,
      activeQueue,
      showUpgradeModal,
      setShowUpgradeModal,
      jobs,
      removeJob
    }),
    [
      clearUploadState,
      processBackgroundUpload,
      cancelUpload,
      cancelJob,
      retryJob,
      uploadMessage,
      uploadStatus,
      uploadProgress,
      activeQueue,
      showUpgradeModal,
      jobs,
      removeJob
    ]
  );

  return (
    <UploadContext.Provider value={value}>
      {children}
      
      {/* Psychological Upgrade Modal Paywall */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </UploadContext.Provider>
  );
}

export function useUploadContext() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUploadContext must be used within an UploadProvider');
  }
  return context;
}
