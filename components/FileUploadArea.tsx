"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, AlertCircle, X } from "lucide-react";
import { useUploadContext } from "@/context/UploadContext";

export default function FileUploadArea() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const router = useRouter();
  const { processBackgroundUpload } = useUploadContext();

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
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be under 10MB.");
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
    <div className="w-full flex flex-col relative z-20">
      {error && (
        <div className="mb-6 p-4 bg-[#2e1819] border border-red-500/20 rounded-xl flex items-start space-x-3 text-red-400">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span className="text-sm font-medium leading-relaxed text-left">{error}</span>
        </div>
      )}

      {!file ? (
        <>
          {/* Flat Dropzone Container (Minimal dashed design with depth) */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`bg-[#111111]/80 backdrop-blur-md border-2 border-dashed border-white/[0.15] rounded-3xl transition-all duration-300 flex flex-col items-center justify-center py-16 px-10 text-center max-w-md mx-auto w-full group relative cursor-pointer z-10 shadow-[0_0_100px_-20px_rgba(168,85,247,0.12)] hover:shadow-[0_0_100px_-10px_rgba(168,85,247,0.18)] ${
              isDragActive
                ? "border-[#a855f7]/50 bg-[#a855f7]/5"
                : "hover:border-white/20 hover:bg-white/[0.01]"
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {/* Sleek SVG floating upload icon */}
            <UploadCloud size={48} className="text-white mb-6 transition-colors duration-300 group-hover:scale-105" />
            
            {isDragActive ? (
              <h3 className="text-base font-bold text-white mb-2 select-none">
                Drop PDF document here
              </h3>
            ) : (
              <div className="bg-white text-black text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-zinc-200 transition-colors mb-3.5 inline-block shadow-md select-none">
                Select PDF Document
              </div>
            )}
            
            <p className="text-xs text-zinc-500 font-medium max-w-[220px] leading-normal group-hover:text-zinc-400 transition-colors">
              Drag & drop or browse. Max file size 10MB.
            </p>
          </div>
        </>
      ) : (
        <div className="bg-omnave-surface border border-white/5 rounded-2xl p-6 md:p-8">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-14 h-14 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-white/60 shrink-0">
              <FileText size={24} />
            </div>
            <div className="flex flex-col flex-1 truncate text-left">
              <span className="font-bold text-white text-sm truncate">{file.name}</span>
              <span className="text-[11px] font-medium text-white/40 mt-1 uppercase tracking-wider">
                {(file.size / 1024 / 1024).toFixed(2)} MB • PDF
              </span>
            </div>
            {!isProcessing && (
              <button
                onClick={() => setFile(null)}
                className="p-2 text-white/45 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer z-10"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {isProcessing ? (
            <div className="flex flex-col w-full py-2 text-left space-y-5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Analyzing Document</h3>
              <div className="space-y-3.5">
                {steps.map((stepText, idx) => {
                  const isCompleted = idx < activeStep;
                  const isActive = idx === activeStep;
                  
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      {isCompleted ? (
                        <span className="text-xs font-bold text-emerald-400 shrink-0 select-none">✓</span>
                      ) : isActive ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-omnave-primary animate-pulse shrink-0" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-white/10 shrink-0" />
                      )}
                      <span className={`text-xs font-semibold ${isCompleted ? 'text-white/65' : isActive ? 'text-white font-bold animate-pulse' : 'text-white/20'}`}>
                        {stepText}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden relative border border-white/5 mt-4">
                <div 
                  className="absolute top-0 left-0 h-full bg-omnave-primary rounded-full transition-all duration-700 ease-out" 
                  style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }} 
                />
              </div>
            </div>
          ) : (
            <button
              onClick={handleUpload}
              className="w-full py-5 bg-omnave-primary text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(127,34,254,0.3)] hover:shadow-[0_0_30px_rgba(127,34,254,0.5)] active:scale-[0.97] active:opacity-80 transition-[box-shadow,opacity] duration-100 cursor-pointer z-10 relative text-sm"
            >
              Generate Study Kit
            </button>
          )}
        </div>
      )}
    </div>
  );
}