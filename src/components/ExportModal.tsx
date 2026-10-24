"use client";

import { useState } from "react";
import { Download, FileText, Film, Check, X, AlertCircle } from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
  hasTimestamps: boolean;
}

export function ExportModal({ isOpen, onClose, sessionId, hasTimestamps }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<"txt" | "docx" | "srt">("txt");
  const [includeBom, setIncludeBom] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!sessionId) return;
    setIsExporting(true);

    const exportUrl = `/api/sessions/${sessionId}/export?format=${selectedFormat}&bom=${includeBom}`;
    window.location.href = exportUrl;

    setTimeout(() => {
      setIsExporting(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-slate-200/80 dark:border-zinc-800/80 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-800 dark:text-zinc-100 text-sm">
              Արտահանել սղագրությունը
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selection Cards */}
        <div className="space-y-2">
          {/* TXT Option */}
          <div
            onClick={() => setSelectedFormat("txt")}
            className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
              selectedFormat === "txt"
                ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30"
                : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
            }`}
          >
            <FileText className="w-5 h-5 text-indigo-600 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                  Պարզ տեքստ (.txt)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">UTF-8</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                Անկորուստ հայերեն տեքստ Windows Notepad-ի և ցանկացած խմբագրիչի համար։
              </p>
            </div>
          </div>

          {/* DOCX Option */}
          <div
            onClick={() => setSelectedFormat("docx")}
            className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
              selectedFormat === "docx"
                ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30"
                : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
            }`}
          >
            <FileText className="w-5 h-5 text-indigo-600 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                  Microsoft Word (.docx)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">DOCX</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                Ֆորմատավորված փաստաթուղթ Noto Sans Armenian և Sylfaen տառատեսակներով։
              </p>
            </div>
          </div>

          {/* SRT Option */}
          <div
            onClick={() => hasTimestamps && setSelectedFormat("srt")}
            className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${
              !hasTimestamps
                ? "opacity-50 cursor-not-allowed border-slate-200 dark:border-zinc-800"
                : selectedFormat === "srt"
                ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 cursor-pointer"
                : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 cursor-pointer"
            }`}
          >
            <Film className="w-5 h-5 text-indigo-600 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                  Ենթագրեր (.srt)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">SubRip</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                Տեսանյութերի և հաղորդումների համար ժամանակացույցով (timestamps) ենթագրեր։
              </p>
              {!hasTimestamps && (
                <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Անհասանելի է, քանի որ սղագրությունը չունի ժամանակացույց։</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TXT BOM Settings */}
        {selectedFormat === "txt" && (
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeBom}
              onChange={(e) => setIncludeBom(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Ավելացնել Byte Order Mark (BOM)՝ Windows-ում հայերեն տառերի ճիշտ բացման համար</span>
          </label>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            Չեղարկել
          </button>
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2 rounded-2xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? "Արտահանվում է..." : "Ներբեռնել ֆայլը"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

