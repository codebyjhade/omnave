"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, X, AlertCircle, Clock, CheckCircle, ChevronRight, Sparkles, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { useUploadContext } from "@/context/UploadContext";
import { useUserContext } from "@/context/UserContext";
import { motion } from "framer-motion";
import StaggerContainer from "@/components/ui/animation/StaggerContainer";
import StaggerItem from "@/components/ui/animation/StaggerItem";

import { Skeleton } from "@/components/Skeleton";
import { cleanDocumentTitle } from "@/utils/formatTitle";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import type { UsageSummary } from "@/types/usage";

export default function UploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const isOnline = useNetworkStatus();
  const { uploadStatus, processBackgroundUpload, jobs = [], removeJob, cancelJob, retryJob } = useUploadContext();
  const { user, loading } = useUserContext();

  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [usageState, setUsageState] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [pendingCancel, setPendingCancel] = useState<{ id: string; title: string } | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const confirmCancellation = async () => {
    if (!pendingCancel || isCancelling) return;
    setIsCancelling(true);
    try {
      await cancelJob(pendingCancel.id);
      setPendingCancel(null);
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    if (!isOnline || !user) {
      setUsageState(isOnline ? 'loading' : 'unavailable');
      return;
    }
    let active = true;
    setUsageState('loading');
    fetch('/api/usage/summary', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Usage unavailable');
        const nextUsage = await response.json() as UsageSummary;
        if (active) {
          setUsage(nextUsage);
          setUsageState('ready');
        }
      })
      .catch(() => {
        if (active) setUsageState('unavailable');
      });
    return () => { active = false; };
  }, [isOnline, user]);

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
      case 'queued': return 'Queued';
      case 'uploading': return 'Uploading';
      case 'processing': return 'AI Processing';
      case 'parsing':
      case 'parsing_document': return 'Reading PDF';
      case 'extracting': return 'Extracting';
      case 'generating':
      case 'generating_summary': return 'Creating Summary';
      case 'building_assessments': return 'Building Quiz';
      case 'finalizing': return 'Finalizing';
      case 'completed': return 'Ready';
      case 'failed': return 'Failed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col pt-4">
      <div className="w-full max-w-lg mx-auto flex flex-col items-center">
        <StaggerContainer staggerChildren={0.08} className="w-full flex flex-col items-center gap-6">
          
          {/* AI Pill Badge - Premium Design */}
          <StaggerItem className={`inline-flex items-center justify-center text-[11px] font-bold tracking-widest uppercase px-5 py-2 rounded-full border mb-1 select-none shadow-sm ${
            isOnline && usageState === 'ready'
              ? "bg-gradient-to-r from-[#6949a8]/10 to-[#86d1ff]/10 text-[#6949a8] border-[#6949a8]/20" 
              : usageState === 'loading' ? "bg-gray-50 text-gray-600 border-gray-200" : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            {!isOnline ? (
               <div className="flex items-center gap-2">
                 <AlertCircle size={14} />
                 OFFLINE — UPLOAD UNAVAILABLE
               </div>
            ) : usageState === 'loading' ? (
               <div className="flex items-center gap-2">
                 <RefreshCw size={14} className="animate-spin" />
                 CHECKING UPLOAD SERVICE
               </div>
            ) : usageState === 'ready' ? (
               <div className="flex items-center gap-2">
                 <Sparkles size={14} className="text-[#6949a8]" />
                 READY TO UPLOAD
               </div>
            ) : (
               <div className="flex items-center gap-2">
                 <AlertCircle size={14} />
                 LIMITS UNAVAILABLE — TRY AGAIN
               </div>
            )}
          </StaggerItem>

          {usage && (
            <StaggerItem className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2" aria-label="Current plan limits">
              {[
                { label: 'Pages left', value: usage.pages.remaining, hint: 'this week' },
                { label: 'Generations', value: usage.generation.remaining, hint: 'this month' },
                { label: 'Max pages', value: usage.maxPagesPerDocument, hint: 'per PDF' },
                { label: 'Max file', value: `${Math.round(usage.maxFileBytes / 1024 / 1024)}MB`, hint: usage.planType },
              ].map((item) => (
                <div key={item.label} className="rounded-[14px] border border-gray-100 bg-white px-3 py-2.5 text-left shadow-sm">
                  <p className="text-[10px] font-semibold text-gray-500 font-poppins">{item.label}</p>
                  <p className="text-[17px] leading-5 font-bold text-gray-900 font-poppins">{item.value}</p>
                  <p className="text-[10px] text-gray-500 font-poppins capitalize">{item.hint}</p>
                </div>
              ))}
            </StaggerItem>
          )}

          {/* Error Message */}
          {error && (
            <StaggerItem className="w-full mb-2 p-4 bg-red-50 border border-red-200 rounded-[16px] flex items-start space-x-3 text-red-700 shadow-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span className="text-[13px] font-semibold leading-relaxed text-left font-poppins">{error}</span>
            </StaggerItem>
          )}

          {/* Upload Dropzone Card / File Preview */}
          <StaggerItem className="w-full">
            {!file ? (
              <div className="relative w-full bg-white rounded-[24px] shadow-[0px_15px_30px_rgba(0,0,0,0.06)] p-2 border border-gray-100 overflow-hidden group">
                {/* Decorative background blob */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#6949a8]/5 to-[#86d1ff]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 z-0 pointer-events-none"></div>

                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`relative z-10 rounded-[20px] flex flex-col items-center justify-center py-12 px-6 transition-all duration-300 border-2 border-dashed ${
                    !isOnline 
                      ? "opacity-60 cursor-not-allowed pointer-events-none border-red-200 bg-red-50/50"
                      : isDragActive
                        ? "border-[#6949a8] bg-[#6949a8]/5 cursor-pointer scale-[0.98]"
                        : "border-gray-200 hover:border-[#6949a8]/50 hover:bg-gray-50 cursor-pointer"
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    disabled={!isOnline}
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-50"
                  />
                  
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 shadow-sm transition-transform duration-300 ${
                    !isOnline ? "bg-red-100 text-red-500" : "bg-white text-[#6949a8] group-hover:scale-110"
                  }`}>
                     {isOnline ? <UploadCloud strokeWidth={1.5} size={32} /> : <AlertCircle strokeWidth={1.5} size={32} />}
                  </div>
                  
                  <h3 className={`text-[20px] font-bold font-poppins mb-2 ${!isOnline ? "text-red-700" : "text-gray-900"}`}>
                    {isOnline ? "Upload a PDF" : "Uploads Require Connection"}
                  </h3>
                  
                  <p className="text-[13px] text-gray-500 font-poppins text-center max-w-[240px] mb-6">
                    {isOnline 
                      ? "Drop your study material here, or click to browse files."
                      : "You are currently offline. Please reconnect to the internet to upload new materials."}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 bg-white px-3 py-1.5 rounded-full border border-gray-100 font-poppins">
                      <FileText size={12} /> PDF Format Only
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 bg-white px-3 py-1.5 rounded-full border border-gray-100 font-poppins">
                      <CheckCircle size={12} /> {usage ? `${Math.round(usage.maxFileBytes / 1024 / 1024)}MB` : user?.plan_type === 'pro' ? '50MB' : '15MB'} Max Size
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full bg-white border border-gray-100 rounded-[24px] p-6 shadow-[0px_15px_30px_rgba(0,0,0,0.06)] flex flex-col gap-6 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#6949a8]/5 to-[#86d1ff]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                
                <div className="flex items-center space-x-4 relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#6949a8]/10 to-[#86d1ff]/20 rounded-[14px] flex items-center justify-center text-[#6949a8] shrink-0 mr-2 shadow-inner border border-white">
                    <FileText size={24} />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-bold text-gray-900 text-[15px] truncate font-poppins">{file.name}</span>
                    <span className="text-[11px] font-semibold text-gray-400 mt-1 uppercase tracking-wider font-poppins">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • PDF
                    </span>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-full transition-colors border border-gray-100 cursor-pointer"
                    aria-label="Remove selected file"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex flex-col items-center gap-3 relative z-10">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleUploadSubmit}
                    disabled={!isOnline || uploadStatus === "uploading"}
                    className="w-full bg-gradient-to-r from-[#6949a8] to-[#86d1ff] hover:opacity-90 disabled:from-gray-300 disabled:to-gray-300 text-white font-bold py-4 px-6 rounded-full text-[14px] transition-all shadow-[0_10px_25px_rgba(105,73,168,0.3)] disabled:shadow-none cursor-pointer border-none font-poppins disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none flex items-center justify-center gap-2"
                  >
                    {isOnline ? (
                      <>
                        <Sparkles size={18} className="text-white" />
                        Generate Study Kit
                      </>
                    ) : (
                      "Connection Required to Generate"
                    )}
                  </motion.button>
                </div>
              </div>
            )}
          </StaggerItem>

          {/* Active Processing List - Hidden completely if empty to fix UX Audit issue */}
          {jobs.length > 0 && (
            <StaggerItem className="w-full mt-6 flex flex-col gap-4 text-left">
              <h2 className="text-[14px] font-poppins font-bold text-gray-900 uppercase tracking-widest px-2 text-center">
                Processing Activity
              </h2>
              
              <div className="flex flex-col gap-4 w-full">
                {jobs.map((job) => {
                  const isCompleted = job.status === "completed";
                  const isFailed = job.status === "failed" || job.status === "cancelled";
                  const isInProgress = ['queued', 'uploading', 'processing', 'parsing', 'parsing_document', 'extracting', 'generating', 'generating_summary', 'building_assessments', 'finalizing'].includes(job.status);
                  return (
                    <div 
                      key={job.id} 
                      className="w-full bg-white border border-gray-100 rounded-[20px] p-5 shadow-[0px_10px_20px_rgba(0,0,0,0.05)] flex flex-col gap-4 font-poppins"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 border border-white shadow-inner ${
                            isCompleted ? 'bg-emerald-50 text-emerald-600' : isFailed ? 'bg-red-50 text-red-500' : 'bg-gradient-to-br from-[#6949a8]/10 to-[#86d1ff]/20 text-[#6949a8]'
                          }`}>
                            <FileText size={22} />
                          </div>
                          <div className="flex flex-col min-w-0 text-left">
                            <span className="font-bold text-[14px] text-gray-900 truncate block max-w-[200px]">
                              {cleanDocumentTitle(job.title)}
                            </span>
                            <span className={`text-[11px] font-semibold mt-1 block truncate ${
                              isCompleted ? 'text-emerald-600' : isFailed ? 'text-red-500' : 'text-[#6949a8]'
                            }`}>
                              {job.message}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase border shadow-sm ${
                            isCompleted 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : isFailed 
                                ? 'bg-red-50 text-red-500 border-red-100' 
                                : 'bg-purple-50 text-[#6949a8] border-purple-100 animate-pulse'
                          }`}>
                            {getStatusLabel(job.status)}
                          </span>
                          
                          {isFailed && job.retryable ? (
                            <button
                              onClick={() => retryJob(job.id)}
                              className="h-8 px-3 flex items-center gap-1.5 text-[11px] font-bold text-[#6949a8] bg-purple-50 hover:bg-purple-100 rounded-full transition-colors cursor-pointer border border-purple-100"
                              title="Retry processing"
                            >
                              <RefreshCw size={13} /> Retry
                            </button>
                          ) : (isCompleted || isFailed) ? (
                            <button
                              onClick={() => removeJob(job.id)}
                              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors cursor-pointer border border-gray-100"
                              title="Dismiss card"
                            >
                              <X size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => setPendingCancel({ id: job.id, title: cleanDocumentTitle(job.title) })}
                              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-full transition-colors cursor-pointer border border-gray-100"
                              title="Cancel processing"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="w-full px-1">
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden relative shadow-inner">
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

                      <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium px-1">
                        {isInProgress && (
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-gray-400" />
                            <span>
                              Active for {job.elapsedTime}s • {job.estimatedTime || 'Calculating...'}
                            </span>
                          </div>
                        )}

                        {isCompleted && (
                          <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                            <CheckCircle size={14} />
                            <span>Completed in {job.elapsedTime}s</span>
                          </div>
                        )}

                        {isFailed && (
                          <span className="text-red-500 font-bold">{job.retryable ? 'Quota refunded • Safe to retry' : 'Stopped • Quota refunded'}</span>
                        )}

                        {isCompleted && job.materialId && (
                          <button
                            onClick={() => router.push(`/lesson/${job.materialId}`)}
                            className="bg-gray-900 hover:bg-black text-white text-[11px] font-bold px-4 py-2 rounded-full transition-all duration-200 select-none active:scale-95 cursor-pointer border-none flex items-center gap-1 font-poppins shadow-md"
                          >
                            <span>Open Kit</span>
                            <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </StaggerItem>
          )}

        </StaggerContainer>
      </div>

      {pendingCancel && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 px-5" role="dialog" aria-modal="true" aria-labelledby="cancel-processing-title">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl font-poppins">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertCircle size={23} />
            </div>
            <h2 id="cancel-processing-title" className="mt-4 text-center text-lg font-bold text-gray-900">Cancel PDF processing?</h2>
            <p className="mt-2 text-center text-sm leading-6 text-gray-600">
              Are you sure you want to stop <strong className="text-gray-900">{pendingCancel.title}</strong>? Its reserved quota will be refunded, but the current generation work will be discarded.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" disabled={isCancelling} onClick={() => setPendingCancel(null)} className="min-h-11 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 disabled:opacity-50">
                Keep processing
              </button>
              <button type="button" disabled={isCancelling} onClick={confirmCancellation} className="min-h-11 rounded-xl bg-red-500 text-sm font-semibold text-white disabled:opacity-50">
                {isCancelling ? 'Cancelling…' : 'Yes, cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
