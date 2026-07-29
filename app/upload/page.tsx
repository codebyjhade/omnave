"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, AlertCircle, X } from "lucide-react";
import { useUploadContext } from "@/context/UploadContext";
import { useUserContext } from "@/context/UserContext";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const router = useRouter();
  const { processBackgroundUpload, uploadStatus, uploadMessage, uploadProgress } = useUploadContext();
  const { user } = useUserContext();

  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    "Reading and parsing PDF document...",
    "Extracting core definitions and key concepts...",
    "Generating customized learning flashcards...",
    "Assembling practice assessments and quizzes...",
    "Polishing study kit dashboard..."
  ];

  useEffect(() => {
    if (!isProcessing) {
      setActiveStep(0);
      return;
    }
    
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2800);
    
    return () => clearInterval(interval);
  }, [isProcessing]);

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

    setIsProcessing(true);
    setError(null);

    void processBackgroundUpload(file);
    router.push("/library");
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
          
          {/* AI Pill relocated inside white canvas */}
          <div className="inline-flex items-center justify-center bg-purple-50 text-[#6949a8] text-[10px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full border border-purple-100 mb-6 select-none">
            ✨ AI ENGINE READY
          </div>

          {/* Error Message */}
          {error && (
            <div className="w-full mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-650">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span className="text-xs font-semibold leading-relaxed text-left font-poppins">{error}</span>
            </div>
          )}

          {/* Upload Dropzone Card / File Preview */}
          {!file ? (
            <div className="bg-white rounded-2xl shadow-[0px_10px_10px_rgba(0,0,0,0.09)] p-3 w-full border border-gray-50">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`bg-[#6949a8]/5 border-2 border-dashed rounded-xl flex flex-col items-center py-10 px-6 relative cursor-pointer transition-all duration-300 ${
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
                <div className="bg-[#6949a8] text-white font-semibold py-3 px-8 rounded-full shadow-[0_4px_15px_rgba(105,73,168,0.4)] active:scale-95 transition-transform text-sm select-none z-20 font-poppins">
                  Select PDF Document
                </div>

                {/* Helper text */}
                <p className="text-xs text-gray-400 mt-4 font-poppins">
                  Max file size {user?.plan_type === 'pro' ? '50MB' : '15MB'}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full bg-white border border-gray-100 rounded-[20px] p-6 shadow-[0px_10px_10px_rgba(0,0,0,0.09)] flex flex-col gap-6 text-left">
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
                {!isProcessing && (
                  <button
                    onClick={() => setFile(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors border-none bg-transparent cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {isProcessing ? (
                <div className="flex flex-col w-full py-2 space-y-5">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 font-poppins">Analyzing Document</h3>
                  <div className="space-y-3.5">
                    {steps.map((stepText, idx) => {
                      const isCompleted = idx < activeStep;
                      const isActive = idx === activeStep;
                      
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          {isCompleted ? (
                            <span className="text-xs font-bold text-emerald-500 shrink-0 select-none font-poppins">✓</span>
                          ) : isActive ? (
                            <span className="w-2 h-2 rounded-full bg-[#6949a8] animate-pulse shrink-0" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-gray-100 shrink-0" />
                          )}
                          <span className={`text-xs font-semibold font-poppins ${
                            isCompleted 
                              ? 'text-gray-500' 
                              : isActive 
                                ? 'text-[#6949a8] font-bold animate-pulse' 
                                : 'text-gray-300'
                          }`}>
                            {stepText}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden relative mt-4">
                    <div 
                      className="absolute top-0 left-0 h-full bg-[#6949a8] rounded-full transition-all duration-700 ease-out" 
                      style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }} 
                    />
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleUpload}
                  className="w-full py-4 bg-[#6949a8] text-white font-semibold rounded-full shadow-[0_4px_15px_rgba(105,73,168,0.4)] active:scale-95 transition-transform border-none cursor-pointer text-sm font-poppins"
                >
                  Generate Study Kit
                </button>
              )}
            </div>
          )}

          {/* Active Processing Section */}
          <div className="flex flex-col mt-8 w-full text-left">
            <h2 className="text-[16px] font-bold text-gray-800 mb-4 font-poppins">
              Active Processing
            </h2>
            {uploadStatus === 'uploading' ? (
              <div className="bg-[#F9F9FB] rounded-[16px] p-4 border border-gray-100 flex flex-col font-poppins">
                <div className="flex items-center justify-between">
                  {/* Left: glowing PDF icon */}
                  <div className="w-10 h-10 bg-purple-100 text-[#6949a8] rounded-lg flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  {/* Middle: text */}
                  <div className="flex-1 ml-3 min-w-0">
                    <span className="font-semibold text-sm text-[#1c1c1c] truncate block">
                      {file?.name || "Processing Document.pdf"}
                    </span>
                    <span className="text-xs text-[#6949a8] font-medium mt-0.5 block truncate">
                      {uploadMessage || "Extracting flashcards and quizzes..."}
                    </span>
                  </div>
                  {/* Right: percent */}
                  <div className="text-sm font-bold text-gray-700 shrink-0 pl-2">
                    {uploadProgress}%
                  </div>
                </div>
                {/* Bottom: progress bar */}
                <div className="h-1.5 w-full bg-gray-200 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="h-full bg-[#6949a8] rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-transparent border-2 border-dashed border-gray-200 rounded-[16px] p-6 flex flex-col items-center justify-center text-center gap-2 font-poppins">
                <div className="w-9 h-9 text-gray-400 flex items-center justify-center shrink-0">
                  <FileText size={20} strokeWidth={1.5} />
                </div>
                <span className="text-sm font-semibold text-gray-400">No active documents in queue</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}