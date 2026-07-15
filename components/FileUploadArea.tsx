"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, AlertCircle, X, Loader2 } from "lucide-react";
import { useUploadContext } from "@/context/UploadContext";

export default function FileUploadArea() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const router = useRouter();
  const { processBackgroundUpload } = useUploadContext();

  const [isProcessing, setIsProcessing] = useState(false);

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
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start space-x-3 text-red-400 backdrop-blur-md">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span className="text-sm font-medium leading-relaxed">{error}</span>
        </div>
      )}

      {!file ? (
        <>
          {/* Ambient Environment Lighting */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-omnave-primary/10 blur-[100px] pointer-events-none rounded-full z-0" aria-hidden="true" />

          {/* Elevated Dropzone Container (Glassmorphism & Drag States) */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`bg-[#0f0a1c]/60 backdrop-blur-md border-2 border-dashed border-white/10 hover:border-omnave-primary/50 hover:bg-omnave-primary/5 rounded-3xl transition-all duration-300 ease-in-out flex flex-col items-center justify-center p-10 text-center max-w-md mx-auto w-full group relative cursor-pointer z-10 ${
              isDragActive
                ? "border-omnave-primary bg-omnave-primary/5 shadow-[0_0_30px_rgba(127,34,254,0.2)] scale-[1.02]"
                : ""
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {/* Polished Upload Icon */}
            <div className="w-16 h-16 rounded-full bg-omnave-primary/10 flex items-center justify-center mb-6 ring-1 ring-omnave-primary/30 shadow-[0_0_15px_rgba(127,34,254,0.2)] group-hover:scale-110 group-hover:bg-omnave-primary/20 group-hover:ring-omnave-primary/50 transition-all duration-300">
              <UploadCloud size={28} className="text-omnave-primary" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {isDragActive ? "Drop your PDF file here!" : "Tap or Drag a PDF"}
            </h3>
            <p className="text-sm text-white/40 font-medium max-w-[200px] leading-relaxed">
              Max file size 10MB. We'll handle the rest.
            </p>
          </div>
        </>
      ) : (
        <div className="bg-black/[0.4] border border-white/[0.1] backdrop-blur-2xl rounded-[24px] p-6 md:p-8 shadow-premium-glass">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-14 h-14 bg-omnave-primary/20 border border-omnave-primary/30 rounded-2xl flex items-center justify-center text-omnave-primary shrink-0">
              <FileText size={24} />
            </div>
            <div className="flex flex-col flex-1 truncate">
              <span className="font-bold text-white truncate">{file.name}</span>
              <span className="text-xs font-medium text-white/40 mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB • PDF Document
              </span>
            </div>
            {!isProcessing && (
              <button
                onClick={() => setFile(null)}
                className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors cursor-pointer z-10"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {isProcessing ? (
            <div className="flex flex-col w-full py-2">
              <div className="flex items-center justify-between mb-4 text-omnave-primary">
                <div className="flex items-center space-x-3">
                  <Loader2 className="animate-spin" size={18} />
                  <span className="text-sm font-bold tracking-wide text-white/80">Preparing your study kit…</span>
                </div>
              </div>

              <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden relative border border-white/5">
                <div className="absolute top-0 left-0 h-full bg-omnave-primary rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(127,34,254,0.6)]" style={{ width: "100%" }} />
              </div>

              <p className="text-xs text-center text-white/40 mt-6 font-medium">
                Please don't close this tab while the AI is thinking.
              </p>
            </div>
          ) : (
            <button
              onClick={handleUpload}
              className="w-full py-5 bg-omnave-primary text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(127,34,254,0.3)] hover:shadow-[0_0_30px_rgba(127,34,254,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer z-10 relative"
            >
              Generate Study Kit
            </button>
          )}
        </div>
      )}
    </div>
  );
}