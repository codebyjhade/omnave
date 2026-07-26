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
import BackgroundProcessingWidget from '@/components/BackgroundProcessingWidget';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UploadContextValue {
  processBackgroundUpload: (file: File) => Promise<void>;
  cancelUpload: () => void;
  uploadStatus: UploadStatus;
  uploadMessage: string | null;
  uploadProgress: number;
  clearUploadState: () => void;
  activeQueue: string[];
}

const UploadContext = createContext<UploadContextValue | undefined>(undefined);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { refreshUser, addNotification, removeNotification, updateNotification, addLessonToState, removeLessonFromState } = useUserContext();
  const { toast } = useToast();
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const targetProgressRef = useRef<number>(0);
  const [activeQueue, setActiveQueue] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeMaterialIdRef = useRef<string | null>(null);
  const displayedProgressRef = useRef<number>(0);

  useEffect(() => {
    displayedProgressRef.current = uploadProgress;
  }, [uploadProgress]);

  // Interpolated progress bar ticker
  useEffect(() => {
    if (uploadStatus !== 'uploading') return;

    const ticker = setInterval(() => {
      setUploadProgress((prev) => {
        const target = targetProgressRef.current;
        if (prev < target) {
          return prev + 1;
        } else if (prev < 90 && target < 100) {
          // Slow tick up to 90% cap
          return prev + 1;
        }
        return prev;
      });
    }, 150); // Tick every 150ms

    return () => clearInterval(ticker);
  }, [uploadStatus]);

  // Decoupled notification sync effect (avoids setState-in-render warning)
  useEffect(() => {
    const activeId = activeMaterialIdRef.current;
    if (activeId && uploadProgress > 0 && uploadStatus === 'uploading') {
      updateNotification(`processing-${activeId}`, { progress: uploadProgress });
    }
  }, [uploadProgress, uploadStatus, updateNotification]);

  const clearUploadState = useCallback(() => {
    setUploadStatus('idle');
    setUploadMessage(null);
    setUploadProgress(0);
  }, []);

  // Auto-hide the widget after success or error
  useEffect(() => {
    if (uploadStatus === 'idle' || uploadStatus === 'uploading') return;

    const timer = window.setTimeout(() => {
      clearUploadState();
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [clearUploadState, uploadStatus]);

  const cancelUpload = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    const targetId = activeMaterialIdRef.current;
    if (targetId) {
      activeMaterialIdRef.current = null;
      // 1. Remove the pending item from the global active queue array
      setActiveQueue((prev) => prev.filter((id) => id !== targetId));

      // 2. Optimistically remove from context state instantly
      removeLessonFromState(targetId);

      // 3. Fire background delete request to Supabase
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      try {
        await supabase.from('materials').delete().eq('id', targetId);
      } catch (err) {
        console.error('[UploadContext] cancelUpload db delete error:', err);
      }
    }

    setUploadStatus('idle');
    setUploadMessage(null);
    setUploadProgress(0);
    toast('Processing cancelled.', 'info');
  }, [toast, removeLessonFromState]);

  const processBackgroundUpload = useCallback(
    async (file: File) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Initialize AbortController for cancelable requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setUploadStatus('uploading');
      setUploadProgress(10);
      setUploadMessage('Initializing secure connection...');

      const fileExt = file.name.split('.').pop();
      const cleanTitle = file.name.replace(`.${fileExt}`, '');

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error('Please sign in to upload study material.');
        }

        if (signal.aborted) return;

        // STEP 1: Upload to Storage
        setUploadProgress(30);
        setUploadMessage('Uploading PDF to cloud storage...');
        
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const filePath = `${user.id}/${Date.now()}_${safeFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('study_materials')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        if (signal.aborted) return;

        // 1. Generate the temporary signed URL for the background worker to download
        const { data: signedData, error: signedError } = await supabase.storage
          .from('study_materials')
          .createSignedUrl(filePath, 60 * 15); // 15 minutes is more than enough for the queue to pick it up

        if (signedError) {
          console.error("Failed to generate signed URL:", signedError);
          throw signedError;
        }

        const fileUrl = signedData.signedUrl;

        // STEP 2: Database Registration
        setUploadProgress(50);
        setUploadMessage('Registering study material...');
        
        const { data: newMaterial, error: dbError } = await supabase
          .from('materials')
          .insert([
            {
              user_id: user.id,
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

        activeMaterialIdRef.current = newMaterial.id;
        setActiveQueue((prev) => [...prev, newMaterial.id]);

        if (signal.aborted) return;

        await refreshUser();

        // STEP 3: AI Generation Process
        setUploadProgress(70);
        setUploadMessage('AI is analyzing content and generating flashcards...');
        
        const response = await fetch('/api/process-material', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            materialId: newMaterial.id,
            fileUrl: fileUrl,
          }),
          signal,
        });

        let finalMaterialId = newMaterial.id;
        let finalStatus = 'PROCESSING';
        if (!response.ok) {
          let errMsg = 'The AI processing could not complete.';
          try {
            const json = await response.json();
            if (json?.message) errMsg = json.message;
            else if (json?.error) errMsg = json.error;
          } catch {}
          throw new Error(errMsg);
        } else {
          try {
            const json = await response.json();
            if (json?.materialId) {
              finalMaterialId = json.materialId;
              activeMaterialIdRef.current = finalMaterialId;
            }
            if (json?.status) {
              finalStatus = json.status;
            }
          } catch {}
        }

        if (signal.aborted) return;

        if (finalStatus === 'COMPLETED') {
          // STEP 4: Success (Cache Hit)
          setUploadProgress(100);
          setUploadStatus('success');
          setUploadMessage('Your study kit is explore-ready!');

          // Dispatch a triumphant notification to the user's notification center
          addNotification({
            id: `processed-${finalMaterialId}`,
            type: 'lesson',
            title: 'Material Processed',
            desc: `"${cleanTitle}" is ready.`,
            time: 'Just now',
          });
          
          await refreshUser();
          router.refresh(); 
        } else {
          // Background Processing (Cache Miss / New upload)
          setUploadProgress(0);
          targetProgressRef.current = 20;
          setUploadMessage('Parsing document text...');

          // Add a non-clickable processing notification in the dropdown
          addNotification({
            id: `processing-${finalMaterialId}`,
            type: 'processing',
            title: 'Analyzing Material',
            desc: `AI is analyzing "${cleanTitle}"...`,
            time: 'In progress',
            progress: 0,
            progressStatus: 'Parsing document text...'
          });

          const STATUS_PROGRESS: Record<string, number> = {
            'PARSING_DOCUMENT': 20,
            'GENERATING_SUMMARY': 50,
            'BUILDING_ASSESSMENTS': 90,
            'COMPLETED': 100,
          };

          const STATUS_TEXT: Record<string, string> = {
            'PARSING_DOCUMENT': 'Parsing document text...',
            'GENERATING_SUMMARY': 'Generating markdown summary...',
            'BUILDING_ASSESSMENTS': 'Building flashcards & quizzes...',
            'COMPLETED': 'Study kit ready!',
          };

          // Start polling the database
          const pollInterval = setInterval(async () => {
            if (signal.aborted) {
              clearInterval(pollInterval);
              return;
            }

            try {
              const { data: checkData, error: checkError } = await supabase
                .from('materials')
                .select('is_processed, status')
                .eq('id', finalMaterialId)
                .single();

              if (checkError) {
                console.error('[UploadContext] polling check error:', checkError.message);
                return;
              }

              if (checkData) {
                const status = checkData.status || 'PROCESSING';
                const progressNum = STATUS_PROGRESS[status] || 20;
                const statusMsg = STATUS_TEXT[status] || 'AI is analyzing content...';

                // Sync the target milestone progress and status message
                targetProgressRef.current = progressNum;
                setUploadMessage(statusMsg);

                updateNotification(`processing-${finalMaterialId}`, {
                  progressStatus: statusMsg,
                });

                if (checkData.is_processed || status === 'COMPLETED') {
                  targetProgressRef.current = 100;

                  // Double-interval/wait logic: Wait for displayedProgress to hit 100
                  const checkCompletionInterval = setInterval(async () => {
                    if (displayedProgressRef.current >= 100) {
                      clearInterval(checkCompletionInterval);
                      clearInterval(pollInterval);

                      // Wait 500ms and transition to final completed state
                      setTimeout(async () => {
                        removeNotification(`processing-${finalMaterialId}`);

                        // Fetch the fully populated row for the completed material
                        const { data: fullLesson } = await supabase
                          .from('materials')
                          .select('*')
                          .eq('id', finalMaterialId)
                          .single();

                        if (fullLesson) {
                          addLessonToState(fullLesson);
                        }
                        
                        addNotification({
                          id: `processed-${finalMaterialId}`,
                          type: 'lesson',
                          title: 'Material Processed',
                          desc: `"${cleanTitle}" is ready.`,
                          time: 'Just now',
                        });

                        setUploadProgress(100);
                        setUploadStatus('success');
                        setUploadMessage('Your study kit is ready to explore!');

                        await refreshUser();
                        router.refresh();
                      }, 500);
                    }
                  }, 100);
                  return;
                }
              }
            } catch (pollErr) {
              console.error('[UploadContext] polling catch error:', pollErr);
            }
          }, 3000);

          // Safe timeout to stop polling after 90 seconds
          setTimeout(() => {
            clearInterval(pollInterval);
            setUploadStatus((current) => {
              if (current === 'uploading') {
                return 'idle';
              }
              return current;
            });
          }, 90000);
        }

      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('[UploadContext] processBackgroundUpload aborted by user');
          return;
        }
        console.error('[UploadContext] processBackgroundUpload error:', error);
        setUploadStatus('error');
        setUploadMessage(error?.message || 'Failed to process the document. Please try again.');
      } finally {
        abortControllerRef.current = null;
        const targetId = activeMaterialIdRef.current;
        if (targetId) {
          setActiveQueue((prev) => prev.filter((id) => id !== targetId));
        }
        activeMaterialIdRef.current = null;
      }
    },
    [refreshUser, router, addNotification]
  );

  const value = useMemo(
    () => ({
      processBackgroundUpload,
      cancelUpload,
      uploadStatus,
      uploadMessage,
      uploadProgress,
      clearUploadState,
      activeQueue,
    }),
    [clearUploadState, processBackgroundUpload, cancelUpload, uploadMessage, uploadStatus, uploadProgress, activeQueue]
  );

  return (
    <UploadContext.Provider value={value}>
      {children}
      
      {/* Background Processing Manager Widget */}
      <BackgroundProcessingWidget
        uploadStatus={uploadStatus}
        uploadMessage={uploadMessage}
        uploadProgress={uploadProgress}
        onDismiss={clearUploadState}
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