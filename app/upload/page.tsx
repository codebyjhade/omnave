'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileText, AlertCircle, X, ChevronRight, Clock, CheckCircle } from 'lucide-react';
import { useUploadContext } from '@/context/UploadContext';
import { useUserContext } from '@/context/UserContext';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const router = useRouter();
  
  const { 
    processBackgroundUpload, 
    jobs, 
    removeJob, 
    cancelJob 
  } = useUploadContext();
  
  const { user } = useUserContext();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      setError("Only PDF files are supported right now.");
      return;
    }
    const planType = user?.plan_type || 'free';
    const maxSize = planType === 'pro' ? 50 * 1024 * 1024 : 15 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      if (planType === 'free') {
        setError("Free tier is limited to 15MB. Please upgrade to Pro.");
      } else {
        setError("Pro tier is limited to 50MB.");
      }
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    setError(null);

    const fileToUpload = file;
    // Clear preview state instantly to reset dropzone for potential concurrent uploads
    setFile(null);
    
    // Start background processing
    void processBackgroundUpload(fileToUpload);
  };

  // Helper to map DB status codes to user-friendly label tags
  const getStatusLabel = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'queued') return 'Queued';
    if (s === 'uploading') return 'Uploading';
    if (s === 'parsing' || s === 'parsing_document') return 'Extracting';
    if (s === 'generating_summary' || s === 'ai_processing') return 'AI Processing';
    if (s === 'building_assessments' || s === 'generating') return 'Generating Study Kit';
    if (s === 'finalizing') return 'Finalizing';
    if (s === 'completed') return 'Completed';
    if (s === 'failed') return 'Failed';
    return 'Processing';
  };

  return (
    <main className="w-full min-h-screen bg-[#6949a8] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] relative flex flex-col overflow-y-auto pwa-safe-root">
      {/* 1. THE PURPLE HEADER */}
      <header className="w-full bg-[#6949a8] pt-7 pb-23 relative flex-none">
        <div className="max-w-5xl mx-auto px-[25px] flex flex-col justify-center select-none relative z-30 text-left h-11">
          <h1 className="text-xl font-bold text-white leading-tight font-poppins">
            New Upload
          </h1>
          <p className="text-[11px] text-purple-200 font-poppins mt-0.5 leading-none">
            Convert PDFs into interactive lessons.
          </p>
        </div>
      </header>

      {/* 2. THE SCROLLABLE WHITE CANVAS */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-[25px] pt-8 pb-[120px] rounded-t-[40px] flex flex-col gap-[20px] bg-[#FFFFFF] -mt-12 relative z-20">
        <div className="w-full max-w-lg mx-auto flex flex-col items-center">
          
          {/* AI Pill Badge */}
          <div className="inline-flex items-center justify-center bg-purple-50 text-[#6949a8] text-[10px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full border border-purple-100 mb-6 select-none">
            ✨ AI ENGINE READY
          </div>

          {/* Error Message */}
          {error && (
            <div className="w-full mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-700">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span className="text-xs font-semibold leading-relaxed text-left font-poppins">{error}</span>
            </div>
          )}

          {/* Upload Dropzone Card / File Preview */}
          {!file ? (
            <div className="bg-white rounded-[15px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] p-3 w-full border border-gray-100">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`bg-[#6949a8]/5 border-2 border-dashed rounded-[15px] flex flex-col items-center py-10 px-6 relative cursor-pointer transition-all duration-300 ${
                  isDragActive
                    ? "border-[#6949a8] bg-[#6949a8]/10"
                    : "border-[#6949a8]/20 hover:border-[#6949a8]/40 hover:bg-[#6949a8]/8"
                }`}
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                
                {/* Cloud Upload Icon */}
                <UploadCloud className="w-14 h-14 text-[#6949a8] mb-4 transition-transform duration-300" />
                
                {/* Select Button */}
                <div className="bg-[#6949a8] hover:bg-[#563b8c] text-white font-semibold py-3 px-8 rounded-full shadow-[0_4px_15px_rgba(105,73,168,0.4)] active:scale-95 transition-transform text-sm select-none z-20 font-poppins">
                  Select PDF Document
                </div>

                {/* Helper text */}
                <p className="text-[11px] text-gray-400 mt-4 font-poppins">
                  Max file size {user?.plan_type === 'pro' ? '50MB' : '15MB'}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full bg-white border border-gray-100 rounded-[15px] p-6 shadow-[0px_10px_10px_rgba(0,0,0,0.09)] flex flex-col gap-6 text-left">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-[#6949a8]/10 rounded-xl flex items-center justify-center text-[#6949a8] shrink-0">
                  <FileText size={24} />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-bold text-gray-900 text-sm truncate font-poppins">{file.name}</span>
                  <span className="text-[11px] font-semibold text-gray-400 mt-1 uppercase tracking-wider font-poppins">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • PDF
                  </span>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="p-2 text-gray-400 hover:text-gray-650 rounded-lg hover:bg-gray-50 transition-colors border-none bg-transparent cursor-pointer"
                  aria-label="Remove selected file"
                >
                  <X size={18} />
                </button>
              </div>

              <button
                onClick={handleUpload}
                className="w-full py-4 bg-[#6949a8] text-white font-semibold rounded-full shadow-[0_4px_15px_rgba(105,73,168,0.4)] hover:bg-[#563b8c] active:scale-95 transition-transform border-none cursor-pointer text-sm font-poppins"
              >
                Generate Study Kit
              </button>
            </div>
          )}

          {/* Active Processing Center */}
          <div className="flex flex-col mt-8 w-full text-left gap-4">
            <h2 className="text-[18px] font-medium font-poppins text-gray-900">
              Active Processing
            </h2>
            
            {jobs.length === 0 ? (
              <div className="bg-transparent border-2 border-dashed border-gray-150 rounded-[15px] p-8 flex flex-col items-center justify-center text-center gap-2 font-poppins select-none">
                <div className="w-10 h-10 text-gray-400 flex items-center justify-center shrink-0">
                  <FileText size={22} strokeWidth={1.5} />
                </div>
                <span className="text-sm font-semibold text-gray-400">No active generations</span>
              </div>
            ) : (
              <div className="flex flex-col gap-4 w-full">
                {jobs.map((job) => {
                  const isCompleted = job.status === 'completed';
                  const isFailed = job.status === 'failed';
                  const isInProgress = !isCompleted && !isFailed;
                  
                  return (
                    <div 
                      key={job.id} 
                      className="w-full bg-white border border-gray-100 rounded-[15px] p-5 shadow-[0px_10px_10px_rgba(0,0,0,0.09)] flex flex-col gap-4 font-poppins"
                    >
                      {/* Top Row: File Icon + Info + Status Pill */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isCompleted ? 'bg-emerald-50 text-emerald-600' : isFailed ? 'bg-red-50 text-red-500' : 'bg-purple-50 text-[#6949a8]'
                          }`}>
                            <FileText size={20} />
                          </div>
                          <div className="flex flex-col min-w-0 text-left">
                            <span className="font-bold text-sm text-gray-900 truncate block">
                              {job.title}
                            </span>
                            <span className={`text-xs font-semibold mt-0.5 block truncate ${
                              isCompleted ? 'text-emerald-600' : isFailed ? 'text-red-500' : 'text-[#6949a8]'
                            }`}>
                              {job.message}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge Pill */}
                        <div className="shrink-0 flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                            isCompleted 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : isFailed 
                                ? 'bg-red-50 text-red-500 border-red-100' 
                                : 'bg-purple-50 text-[#6949a8] border-purple-100 animate-pulse'
                          }`}>
                            {getStatusLabel(job.status)}
                          </span>
                          
                          {/* Dismiss/Cancel action */}
                          {(isCompleted || isFailed) ? (
                            <button
                              onClick={() => removeJob(job.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors cursor-pointer border-none bg-transparent"
                              title="Dismiss card"
                            >
                              <X size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => cancelJob(job.id)}
                              className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors cursor-pointer border-none bg-transparent"
                              title="Cancel processing"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Middle: Progress Bar */}
                      <div className="w-full">
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden relative">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCompleted 
                                ? 'bg-emerald-500' 
                                : isFailed 
                                  ? 'bg-red-400' 
                                  : 'bg-gradient-to-r from-[#6949a8] to-[#86d1ff]'
                            }`}
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Bottom Row: Clock/Metrics or CTA button */}
                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
                        {isInProgress && (
                          <div className="flex items-center gap-1">
                            <Clock size={12} className="text-gray-400" />
                            <span>
                              Active for {job.elapsedTime}s • {job.estimatedTime || 'Calculating...'}
                            </span>
                          </div>
                        )}

                        {isCompleted && (
                          <div className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle size={12} />
                            <span>Completed in {job.elapsedTime}s</span>
                          </div>
                        )}

                        {isFailed && (
                          <span>Failed after {job.elapsedTime}s</span>
                        )}

                        {/* Open Study Kit Button for Completed Kits */}
                        {isCompleted && job.materialId && (
                          <button
                            onClick={() => router.push(`/lesson/${job.materialId}`)}
                            className="bg-[#6949a8] hover:bg-[#563b8c] text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-all duration-200 select-none active:scale-95 cursor-pointer border-none flex items-center gap-1 font-poppins"
                          >
                            <span>Open Study Kit</span>
                            <ChevronRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}