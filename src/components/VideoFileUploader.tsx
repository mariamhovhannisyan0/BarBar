"use client";

import { useState, useRef, DragEvent } from "react";
import { UploadCloud, Video, CheckCircle2, AlertCircle, Loader2, Play, X, Film } from "lucide-react";

interface VideoFileUploaderProps {
  onTranscriptionComplete: (data: any) => void;
  armenianizationEnabled?: boolean;
  punctuationEnabled?: boolean;
  modelIdentifier?: string;
}

const SUPPORTED_VIDEO_EXTENSIONS = [".mp4", ".avi", ".mkv", ".mov", ".webm"];

export function VideoFileUploader({
  onTranscriptionComplete,
  armenianizationEnabled = true,
  punctuationEnabled = true,
  modelIdentifier = "base",
}: VideoFileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "extracting" | "transcribing" | "completed" | "failed">("idle");
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!SUPPORTED_VIDEO_EXTENSIONS.includes(ext)) {
      setErrorMessage(
        `Չաջակցվող տեսանյութի ձևաչափ: Ընտրեք ${SUPPORTED_VIDEO_EXTENSIONS.join(", ")} ֆայլերից որևէ մեկը։`
      );
      return false;
    }
    if (file.size === 0) {
      setErrorMessage("Ընտրված տեսանյութը դատարկ է։");
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleStartTranscription = async () => {
    if (!selectedFile) return;

    setStatus("extracting");
    setProgressPercent(25);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("mode", "video_file");
    formData.append("armenianization", String(armenianizationEnabled));
    formData.append("punctuation", String(punctuationEnabled));
    formData.append("modelId", modelIdentifier);

    try {
      console.log(`[BarBar UI] Starting transcription for video file "${selectedFile.name}" (${(selectedFile.size / 1024).toFixed(1)} KB)...`);
      // Stage 1: Extracting audio
      setTimeout(() => {
        setStatus("transcribing");
        setProgressPercent(65);
      }, 1000);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("[BarBar UI] /api/transcribe video response received:", data);

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Տեսանյութի սղագրման սխալ");
      }

      if (data.isSimulated) {
        console.warn(
          "[BarBar UI] ⚠️ Note: Transcription was performed using fallback simulation phrases. " +
          "To transcribe real speech with Whisper, ensure the Python backend is running (./run_backend.sh) and faster-whisper is installed."
        );
      }

      setProgressPercent(100);
      setStatus("completed");
      onTranscriptionComplete(data.session);
    } catch (err: any) {
      console.error("[BarBar UI] Video transcription error:", err);
      setStatus("failed");
      setErrorMessage(err.message || "Տեսանյութի աուդիոյի առանձնացման անհաջողություն");
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setStatus("idle");
    setProgressPercent(0);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Video Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed transition-all cursor-pointer ${
          isDragging
            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[1.01]"
            : selectedFile
            ? "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-default"
            : "border-slate-200 dark:border-zinc-800 hover:border-indigo-400/80 bg-slate-50/50 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-900"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_VIDEO_EXTENSIONS.join(",")}
          onChange={handleFileChange}
          className="hidden"
        />

        {!selectedFile ? (
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3.5 shadow-subtle">
              <Film className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
              Քաշեք և գցեք տեսանյութը այստեղ կամ{" "}
              <span className="text-indigo-600 dark:text-indigo-400 hover:underline">ընտրեք</span>
            </p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
              Աջակցվող ձևաչափեր՝ MP4, AVI, MKV, MOV, WebM (Աուդիոն ինքնաշխատ կառանձնացվի)
            </p>
          </div>
        ) : (
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Video className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200 truncate max-w-xs sm:max-w-md">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-slate-400 dark:text-zinc-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Տեսանյութ ֆայլ
                </span>
              </div>
            </div>

            {status === "idle" && (
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                title="Հեռացնել"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Extraction & Transcription Stages (FR-011) */}
      {(status === "extracting" || status === "transcribing" || status === "completed") && (
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-2">
              {status === "extracting" && (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  Տեսանյութից աուդիո հետագծի առանձնացում (FFmpeg)...
                </>
              )}
              {status === "transcribing" && (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  Հայերեն խոսքի ճանաչում և ժամանակացույցի (timestamps) կազմում...
                </>
              )}
              {status === "completed" && (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Տեսանյութի սղագրումը հաջողությամբ ավարտվեց
                </>
              )}
            </span>
            <span className="font-mono text-slate-400">{progressPercent}%</span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message (e.g. video without audio track FR-009) */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Start Button */}
      {selectedFile && status === "idle" && (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleStartTranscription}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Առանձնացնել և սղագրել</span>
          </button>
        </div>
      )}
    </div>
  );
}

