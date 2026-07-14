'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/context/UserContext';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UploadContextValue {
  processBackgroundUpload: (file: File) => Promise<void>;
  uploadStatus: UploadStatus;
  uploadMessage: string | null;
  clearUploadState: () => void;
}

const UploadContext = createContext<UploadContextValue | undefined>(undefined);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { refreshUser } = useUserContext();
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const processBackgroundUpload = useCallback(
    async (file: File) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      setUploadStatus('uploading');
      setUploadProgress(10);
      setUploadMessage('Initializing secure connection...');

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error('Please sign in to upload study material.');
        }

        // STEP 1: Upload to Storage
        setUploadProgress(30);
        setUploadMessage('Uploading PDF to cloud storage...');
        
        const fileExt = file.name.split('.').pop();
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const filePath = `${user.id}/${Date.now()}_${safeFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('study_materials')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // STEP 2: Database Registration
        setUploadProgress(50);
        setUploadMessage('Registering study material...');
        
        const { data: newMaterial, error: dbError } = await supabase
          .from('materials')
          .insert([
            {
              user_id: user.id,
              title: file.name.replace(`.${fileExt}`, ''),
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

        // STEP 4: Success
        setUploadProgress(100);
        setUploadStatus('success');
        setUploadMessage('Your study kit is ready to explore!');
        
        await refreshUser();
        // CRITICAL: Forces Next.js to pull the fresh data from Supabase so the library updates instantly!
        router.refresh(); 

      } catch (error: any) {
        console.error('[UploadContext] processBackgroundUpload error:', error);
        setUploadStatus('error');
        setUploadMessage(error?.message || 'Failed to process the document. Please try again.');
      }
    },
    [refreshUser, router]
  );

  const value = useMemo(
    () => ({
      processBackgroundUpload,
      uploadStatus,
      uploadMessage,
      clearUploadState,
    }),
    [clearUploadState, processBackgroundUpload, uploadMessage, uploadStatus]
  );

  return (
    <UploadContext.Provider value={value}>
      {children}
      
      {/* THE PREMIUM FLOATING WIDGET - TOP RIGHT ALIGNED */}
      {uploadStatus !== 'idle' && (
        <div className="fixed top-24 right-6 md:right-10 xl:right-12 z-[9999] w-80 bg-[#0A0A0A]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-2xl animate-in slide-in-from-right-8 duration-300 pointer-events-auto">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {uploadStatus === 'uploading' && <Loader2 className="animate-spin text-omnave-primary" size={18} />}
              {uploadStatus === 'success' && <CheckCircle className="text-emerald-400" size={18} />}
              {uploadStatus === 'error' && <AlertCircle className="text-red-400" size={18} />}
              
              <span className={`text-sm font-bold tracking-wide ${
                uploadStatus === 'error' ? 'text-red-400' : 
                uploadStatus === 'success' ? 'text-emerald-400' : 'text-white'
              }`}>
                {uploadStatus === 'uploading' ? 'Processing' : 
                 uploadStatus === 'success' ? 'Complete' : 'Failed'}
              </span>
            </div>
            
            {uploadStatus === 'uploading' && (
              <span className="text-sm font-black text-white">{uploadProgress}%</span>
            )}
          </div>
          
          {/* Status Message */}
          <div className="text-xs font-medium text-white/60 mb-3">
            {uploadMessage}
          </div>
          
          {/* Progress Bar (Only visible while uploading) */}
          {uploadStatus === 'uploading' && (
            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden relative border border-white/5">
              <div
                className="absolute top-0 left-0 h-full bg-omnave-primary rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(127,34,254,0.6)]"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

        </div>
      )}
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