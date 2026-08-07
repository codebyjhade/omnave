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
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UploadContextValue {
  processBackgroundUpload: (file: File) => Promise<void>;
  cancelUpload: () => void;
  cancelJob: (jobId: string) => Promise<void>;
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
        const { data: checkData, error: checkError } = await supabase
          .from('materials')
          .select('is_processed, status')
          .eq('id', materialId)
          .single();

        // Guard Clause 2: Check if job was cancelled while fetch was in-flight
        if (!intervalsRef.current[materialId]) {
          clearInterval(pollInterval);
          if (elapsedIntervalsRef.current[materialId]) {
            clearInterval(elapsedIntervalsRef.current[materialId]);
            delete elapsedIntervalsRef.current[materialId];
          }
          return;
        }

        if (checkError) {
          console.error('[UploadContext] polling check error:', checkError.message);
          return;
        }

        if (checkData) {
          const status = checkData.status || 'PROCESSING';

          if (status === 'cancelled' || status === 'CANCELLED') {
            clearInterval(pollInterval);
            clearInterval(elapsedInterval);
            delete intervalsRef.current[materialId];
            delete elapsedIntervalsRef.current[materialId];
            setActiveQueue((prev) => prev.filter((id) => id !== materialId));
            setJobs((prev) => prev.filter((j) => j.id !== materialId));
            return;
          }
          
          if (status === 'failed' || status === 'FAILED') {
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
                      message: 'AI generation failed. Please try again.',
                      estimatedTime: 'Failed'
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

    // Timeout safety at 180s
    setTimeout(() => {
      if (intervalsRef.current[materialId]) {
        clearInterval(intervalsRef.current[materialId]);
        clearInterval(elapsedIntervalsRef.current[materialId]);
        delete intervalsRef.current[materialId];
        delete elapsedIntervalsRef.current[materialId];
        setActiveQueue((prev) => prev.filter((id) => id !== materialId));
        
        setJobs((prev) =>
          prev.map((j) =>
            j.id === materialId && j.status !== 'completed' && j.status !== 'failed'
              ? {
                  ...j,
                  status: 'failed',
                  message: 'Processing timed out. Please retry.',
                  estimatedTime: 'Timeout'
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
          .neq('status', 'failed');

        if (error) {
          console.error('[UploadContext] Error fetching active materials on mount:', error);
          return;
        }

        if (data && data.length > 0) {
          data.forEach((material) => {
            setJobs((prev) => {
              if (prev.some(j => j.id === material.id)) return prev;
              
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

    // FIX 3: Reset state variables completely
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setActiveQueue((prev) => prev.filter((item) => item !== id));
    removeLessonFromState(id);
    removeNotification(`processing-${id}`);

    if (!id.startsWith('temp-')) {
      try {
        await fetch("/api/process-material/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ materialId: id }),
        });
      } catch (err) {
        console.error('[UploadContext] Failed to delete material from database via API:', err);
      }
    }
  }, [removeLessonFromState, removeNotification]);

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
        // Primary: stamp the DB row immediately so the Python worker sees it cancelled
        // and stops processing even if the cancel API fetch below is slow or fails.
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        await supabase
          .from('materials')
          .update({ status: 'cancelled', is_processed: true })
          .eq('id', jobId);
      } catch (dbErr) {
        console.error('[UploadContext] cancelJob DB tombstone error:', dbErr);
      }
      try {
        // Secondary redundancy: also hit the cancel API endpoint.
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
      const fileSizeMB = file.size / (1024 * 1024);

      // Pre-flight check: V8 Weekly Page Quota Check
      if (user && planType === 'free') {
        const { data: usageData } = await supabase
          .from('user_usage')
          .select('weekly_pages_used')
          .eq('user_id', user.id)
          .single();

        const weeklyPagesUsed = usageData?.weekly_pages_used || 0;
        if (weeklyPagesUsed >= 100) {
          clearInterval(tempElapsedInterval);
          setShowUpgradeModal(true);
          setJobs((prev) =>
            prev.map((j) =>
              j.id === tempJobId
                ? { ...j, status: 'failed', progress: 0, targetProgress: 0, message: 'Weekly page limit reached (100 pages/week).', estimatedTime: 'Limit' }
                : j
            )
          );
          toast('Weekly page limit reached (100 pages/week).', 'error');
          return;
        }
      }

      if (planType === 'free' && fileSizeMB > 15) {
        clearInterval(tempElapsedInterval);
        setShowUpgradeModal(true);
        setJobs((prev) =>
          prev.map((j) =>
            j.id === tempJobId
              ? { ...j, status: 'failed', progress: 0, targetProgress: 0, message: 'Free tier limit is 15MB. Please upgrade.', estimatedTime: 'Limit' }
              : j
          )
        );
        return;
      }

      if (planType === 'pro' && fileSizeMB > 50) {
        clearInterval(tempElapsedInterval);
        setJobs((prev) =>
          prev.map((j) =>
            j.id === tempJobId
              ? { ...j, status: 'failed', progress: 0, targetProgress: 0, message: 'Pro limit is 50MB.', estimatedTime: 'Limit' }
              : j
          )
        );
        toast('Pro tier limit is 50MB.', 'error');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const cleanTitle = cleanDocumentTitle(file.name);
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const filePath = `${user?.id}/${Date.now()}_${safeFileName}`;

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

        // Create temporary signed link
        const { data: signedData, error: signedError } = await supabase.storage
          .from('study_materials')
          .createSignedUrl(filePath, 60 * 15);

        if (signedError) throw signedError;
        const fileUrl = signedData.signedUrl;

        if (signal.aborted) {
          clearInterval(tempElapsedInterval);
          return;
        }

        // STEP 2: Database registration
        setJobs((prev) =>
          prev.map((j) =>
            j.id === tempJobId
              ? { ...j, targetProgress: 35, message: 'Registering study material...' }
              : j
          )
        );

        const { data: newMaterial, error: dbError } = await supabase
          .from('materials')
          .insert([
            {
              user_id: currentUser.id,
              title: cleanTitle,
              material_type: 'pdf',
              content_url: filePath,
              is_processed: false,
            },
          ])
          .select()
          .single();

        if (dbError || !newMaterial) {
          throw dbError ?? new Error('Unable to register the study material.');
        }

        // Swap key registers from temp ID to registered material ID
        clearInterval(tempElapsedInterval);
        
        const finalMaterialId = newMaterial.id;
        registeredMaterialId = finalMaterialId;
        abortControllersRef.current[finalMaterialId] = abortController;
        delete abortControllersRef.current[tempJobId];

        setJobs((prev) =>
          prev.map((j) =>
            j.id === tempJobId
              ? { ...j, id: finalMaterialId, materialId: finalMaterialId, status: 'parsing', targetProgress: 45, message: 'Connecting to AI generator...' }
              : j
          )
        );
        setActiveQueue((prev) => [...prev, finalMaterialId]);

        if (signal.aborted) return;
        await refreshUser();

        // STEP 3: API Pipeline Initiation
        setJobs((prev) =>
          prev.map((j) =>
            j.id === finalMaterialId
              ? { ...j, targetProgress: 55, message: 'Initiating AI generation...' }
              : j
          )
        );

        const response = await fetch('/api/process-material', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            materialId: finalMaterialId,
            fileUrl: fileUrl,
          }),
          signal,
        });

        let apiStatus = 'PROCESSING';
        let succJson: any = null;
        if (!response.ok) {
          let apiErrMsg = 'AI processing request failed.';
          try {
            const errJson = await response.json();
            if (errJson?.message) apiErrMsg = errJson.message;
            else if (errJson?.error) apiErrMsg = errJson.error;
          } catch {}
          throw new Error(apiErrMsg);
        } else {
          try {
            succJson = await response.json();
            if (succJson?.status) apiStatus = succJson.status;
          } catch {}
        }

        if (signal.aborted) return;

        const actualId = succJson?.materialId || finalMaterialId;
        registeredMaterialId = actualId;

        if (actualId !== finalMaterialId) {
          // Update the jobs state to replace the old ID with the new actualId
          setJobs((prev) =>
            prev.map((j) =>
              j.id === finalMaterialId
                ? { ...j, id: actualId, materialId: actualId }
                : j
            )
          );

          // Update activeQueue to remove finalMaterialId and add actualId
          setActiveQueue((prev) =>
            prev.map((id) => (id === finalMaterialId ? actualId : id))
          );

          // Transfer abortControllersRef from old ID to new ID
          if (abortControllersRef.current[finalMaterialId]) {
            abortControllersRef.current[actualId] = abortControllersRef.current[finalMaterialId];
            delete abortControllersRef.current[finalMaterialId];
          }
        }

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
          // Stamp the DB tombstone on hard abort so the Python worker
          // does not continue processing a row the user already cancelled.
          const abortedId = registeredMaterialId || tempJobId;
          if (abortedId && !abortedId.startsWith('temp-')) {
            try {
              const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
              );
              await supabase
                .from('materials')
                .update({ status: 'cancelled', is_processed: true })
                .eq('id', abortedId);
            } catch (dbErr) {
              console.error('[UploadContext] AbortError DB tombstone error:', dbErr);
            }
          }
          return;
        }
        
        const errMsg = error instanceof Error ? error.message : 'Error processing document.';
        const activeId = registeredMaterialId || tempJobId;

        if (activeId && !activeId.startsWith('temp-')) {
          try {
            await supabase.from('materials').update({ status: 'failed', is_processed: true }).eq('id', activeId);
          } catch (dbErr) {
            console.error('[UploadContext] Silent DB update error in catch block:', dbErr);
          }
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
    [user, refreshUser, addNotification, addLessonToState, startPollingForMaterial, activeQueue, toast, router]
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