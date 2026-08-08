"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, X, AlertCircle, Clock, CheckCircle, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { useUploadContext } from "@/context/UploadContext";
import { useUserContext } from "@/context/UserContext";
import { motion } from "framer-motion";
import StaggerContainer from "@/components/ui/animation/StaggerContainer";
import StaggerItem from "@/components/ui/animation/StaggerItem";

import { Skeleton } from "@/components/Skeleton";
import { cleanDocumentTitle } from "@/utils/formatTitle";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export default function UploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const isOnline = useNetworkStatus();
  const { uploadStatus, processBackgroundUpload, cancelUpload, jobs = [], removeJob, cancelJob } = useUploadContext();
  const { user, loading } = useUserContext();

  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="w-full flex-1 flex flex-col" aria-hidden="true">
        <div className="w-full max-w-lg mx-auto flex flex-col items-center">
          {/* AI Pill Badge Skeleton */}
          <Skeleton className="w-40 h-[30px] rounded-full mb-6" />

          {/* Upload Dropzone Card Skeleton */}
          <div className="bg-white rounded-[15px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] p-3 w-full border border-gray-100 mb-6">
            <div className="border-2 border-dashed border-gray-100 rounded-[15px] flex flex-col items-center py-10 px-6">
              <Skeleton className="w-14 h-14 rounded-full mb-4" />
              <Skeleton className="w-44 h-[44px] rounded-full animate-pulse" />
              <Skeleton className="w-28 h-3 mt-4 rounded-md" />
            </div>
          </div>

          {/* Active Processing List Skeleton */}
          <div className="w-full mt-4 flex flex-col gap-4 text-left">
            <Skeleton className="h-6 w-36 rounded-md" />
            <div className="bg-transparent border-2 border-dashed border-gray-200 rounded-[15px] p-8 flex flex-col items-center justify-center gap-2">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-4 w-40 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOnline) return;
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
    if (!isOnline) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOnline) return;
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    if (selectedFile.type !== "application/pdf") {
      setError("Please upload a valid PDF document.");
      return;
    }
    
    const limitMb = user?.plan_type === 'pro' ? 50 : 15;
    if (selectedFile.size > limitMb * 1024 * 1024) {
      setError(`File size exceeds the ${limitMb}MB limit for your account tier.`);
      return;
    }

    setFile(selectedFile);
  };

  const handleUploadSubmit = async () => {
    if (!file || !isOnline) return;
    try {
      toast(`Uploading ${file.name}...`, "info");
      await processBackgroundUpload(file);
      setFile(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to process the material.");
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'uploading': return 'Uploading';
      case 'processing': return 'AI Processing';
      case 'completed': return 'Ready';
      case 'failed': return 'Failed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col">
      <div className="w-full max-w-lg mx-auto flex flex-col items-center">
        <StaggerContainer staggerChildren={0.08} className="w-full flex flex-col items-center gap-6">
          
          {/* AI Pill Badge */}
          <StaggerItem className={`inline-flex items-center justify-center text-[10px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full border mb-6 select-none ${
            isOnline ? "bg-purple-50 text-[#6949a8] border-purple-100" : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            {isOnline ? "✨ AI ENGINE READY" : "⚡ AI ENGINE OFFLINE"}
          </StaggerItem>

          {/* Error Message */}
          {error && (
            <StaggerItem className="w-full mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-700">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span className="text-xs font-semibold leading-relaxed text-left font-poppins">{error}</span>
            </StaggerItem>
          )}

          {/* Upload Dropzone Card / File Preview */}
          <StaggerItem className="w-full">
            {!file ? (
              <div className="bg-white rounded-[15px] shadow-[0px_10px_10px_rgba(0,0,0,0.09)] p-3 w-full border border-gray-100">
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`bg-[#6949a8]/5 border-2 border-dashed rounded-[15px] flex flex-col items-center py-10 px-6 relative transition-all duration-300 ${
                    !isOnline 
                      ? "opacity-50 cursor-not-allowed pointer-events-none border-gray-300 bg-gray-50"
                      : isDragActive
                        ? "border-[#6949a8] bg-[#6949a8]/10 cursor-pointer"
                        : "border-[#6949a8]/20 hover:border-[#6949a8]/40 hover:bg-[#6949a8]/8 cursor-pointer"
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    disabled={!isOnline}
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-50"
                  />
                  
                  <UploadCloud className={`w-14 h-14 mb-4 transition-transform duration-300 ${isOnline ? "text-[#6949a8]" : "text-gray-400"}`} />
                  
                  <div className="bg-[#6949a8] text-white font-semibold py-3 px-8 rounded-full shadow-[0_4px_15px_rgba(105,73,168,0.4)] text-sm select-none z-20 font-poppins pointer-events-none disabled:opacity-50">
                    {isOnline ? "Select PDF Document" : "Upload Unavailable Offline"}
                  </div>

                  <p className="text-[11px] text-gray-400 mt-4 font-poppins">
                    {isOnline 
                      ? `Max file size ${user?.plan_type === 'pro' ? '50MB' : '15MB'}`
                      : "Connect to the internet to generate new study materials."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full bg-white border border-gray-100 rounded-[15px] p-6 shadow-[0px_10px_10px_rgba(0,0,0,0.09)] flex flex-col gap-6 text-left">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-[#6949a8]/10 rounded-xl flex items-center justify-center text-[#6949a8] shrink-0 mr-4">
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
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors border-none bg-transparent cursor-pointer"
                    aria-label="Remove selected file"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleUploadSubmit}
                    disabled={!isOnline || uploadStatus === "uploading"}
                    className="flex-1 bg-[#6949a8] hover:bg-[#563b8c] disabled:bg-gray-200 text-white font-semibold py-3.5 px-6 rounded-full text-xs transition-colors select-none shadow-[0_4px_15px_rgba(105,73,168,0.4)] disabled:shadow-none cursor-pointer border-none font-poppins disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                  >
                    {isOnline ? "Generate Lesson Material" : "Generation Unavailable Offline"}
                  </button>
                </div>
              </div>
            )}
          </StaggerItem>

          {/* Active Processing List */}
          <StaggerItem className="w-full mt-4 flex flex-col gap-4 text-left">
            <h2 className="text-[18px] font-poppins font-semibold text-gray-900">
              Active Processing
            </h2>
            
            {jobs.length === 0 ? (
              <div className="bg-transparent border-2 border-dashed border-gray-200 rounded-[15px] p-8 flex flex-col items-center justify-center text-center gap-2 font-poppins select-none text-gray-400">
                <div className="w-10 h-10 text-gray-400 flex items-center justify-center shrink-0">
                  <FileText size={22} strokeWidth={1.5} />
                </div>
                <span className="text-sm font-semibold text-gray-400">No active generations</span>
              </div>
            ) : (
              <div className="flex flex-col gap-4 w-full">
                {jobs.map((job) => {
                  const isCompleted = job.status === "completed";
                  const isFailed = job.status === "failed" || job.status === "cancelled";
                  const isInProgress = job.status === "uploading" || job.status === "processing";
                  return (
                    <div 
                      key={job.id} 
                      className="w-full bg-white border border-gray-100 rounded-[15px] p-5 shadow-[0px_10px_10px_rgba(0,0,0,0.09)] flex flex-col gap-4 font-poppins"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isCompleted ? 'bg-emerald-50 text-emerald-600' : isFailed ? 'bg-red-50 text-red-500' : 'bg-purple-50 text-[#6949a8]'
                          }`}>
                            <FileText size={20} />
                          </div>
                          <div className="flex flex-col min-w-0 text-left">
                            <span className="font-bold text-sm text-gray-900 truncate block max-w-[200px]">
                              {cleanDocumentTitle(job.title)}
                            </span>
                            <span className={`text-xs font-semibold mt-0.5 block truncate ${
                              isCompleted ? 'text-emerald-600' : isFailed ? 'text-red-500' : 'text-[#6949a8]'
                            }`}>
                              {job.message}
                            </span>
                          </div>
                        </div>

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
          </StaggerItem>

        </StaggerContainer>
      </div>
    </div>
  );
}