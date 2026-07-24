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
import BackgroundProcessingWidget from '@/components/BackgroundProcessingWidget';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UploadContextValue {
  processBackgroundUpload: (file: File) => Promise<void>;
  cancelUpload: () => void;
  uploadStatus: UploadStatus;
  uploadMessage: string | null;
  uploadProgress: number;
  clearUploadState: () => void;
}

const UploadContext = createContext<UploadContextValue | undefined>(undefined);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { refreshUser, addNotification } = useUserContext();
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setUploadStatus('error');
    setUploadMessage('Processing cancelled by user.');
    setUploadProgress(0);
  }, []);

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
            filePath,
          }),
          signal,
        });

        if (!response.ok) {
          let errMsg = 'The AI processing could not complete.';
          try {
            const json = await response.json();
            if (json?.message) errMsg = json.message;
            else if (json?.error) errMsg = json.error;
          } catch {}
          throw new Error(errMsg);
        }

        if (signal.aborted) return;

        // STEP 4: Success
        setUploadProgress(100);
        setUploadStatus('success');
        setUploadMessage('Your study kit is ready to explore!');

        // Dispatch a triumphant notification to the user's notification center
        addNotification({
          id: `processed-${newMaterial.id}`,
          type: 'lesson',
          title: 'Material Processed',
          desc: `"${cleanTitle}" is ready.`,
          time: 'Just now',
        });
        
        await refreshUser();
        router.refresh(); 

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
    }),
    [clearUploadState, processBackgroundUpload, cancelUpload, uploadMessage, uploadStatus, uploadProgress]
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