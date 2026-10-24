"use client";

import { useState, useEffect, useRef } from "react";
import {
  Copy,
  Check,
  Download,
  RotateCcw,
  RotateCw,
  AlertCircle,
  Sparkles,
  Save,
  Volume2,
  Clock,
  FileText,
  Undo2,
  Redo2,
  Eye,
  Info,
} from "lucide-react";

export interface SpanMetadata {
  spanId: string;
  originalToken: string;
  replacedWith: string;
  lemma: string;
  confidence: number;
  state: "applied" | "reverted" | "customized";
}

export interface Segment {
  id?: string;
  sequenceOrder: number;
  startTime: number;
  endTime: number;
  rawText: string;
  finalizedText: string;
  isEdited?: boolean;
  replacements?: SpanMetadata[];
}

interface TranscriptEditorProps {
  sessionId?: string;
  title: string;
  segments: Segment[];
  interimText?: string;
  isLiveRecording?: boolean;
  onTextChange?: (updatedSegments: Segment[]) => void;
  onSave?: () => Promise<void>;
  onExportClick?: () => void;
  onSeekAudio?: (timeSeconds: number) => void;
  currentPlaybackTime?: number;
}

export function TranscriptEditor({
  sessionId,
  title,
  segments,
  interimText = "",
  isLiveRecording = false,
  onTextChange,
  onSave,
  onExportClick,
  onSeekAudio,
  currentPlaybackTime = 0,
}: TranscriptEditorProps) {
  const [copied, setCopied] = useState(false);
  const [activeSpanPopover, setActiveSpanPopover] = useState<{
    span: SpanMetadata;
    segmentIndex: number;
    rect: DOMRect;
  } | null>(null);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localSegments, setLocalSegments] = useState<Segment[]>(segments);

  // Sync incoming segments
  useEffect(() => {
    setLocalSegments(segments);
  }, [segments]);

  // Copy all text
  const handleCopyAll = async () => {
    const fullText = localSegments.map((s) => s.finalizedText).join(" ");
    if (interimText) {
      await navigator.clipboard.writeText(`${fullText} ${interimText}`);
    } else {
      await navigator.clipboard.writeText(fullText);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Revert Armenianized word
  const handleRevertSpan = async (span: SpanMetadata, segIndex: number) => {
    const targetSegment = localSegments[segIndex];
    if (!targetSegment) return;

    const isCurrentlyReverted = span.state === "reverted";
    const nextState: "applied" | "reverted" = isCurrentlyReverted ? "applied" : "reverted";

    let updatedText = targetSegment.finalizedText;
    if (nextState === "reverted") {
      updatedText = updatedText.replace(span.replacedWith, span.originalToken);
    } else {
      updatedText = updatedText.replace(span.originalToken, span.replacedWith);
    }

    const updatedReplacements: SpanMetadata[] = (targetSegment.replacements || []).map((r) =>
      r.spanId === span.spanId ? { ...r, state: nextState } : r
    );

    const updatedList = [...localSegments];
    updatedList[segIndex] = {
      ...targetSegment,
      finalizedText: updatedText,
      isEdited: true,
      replacements: updatedReplacements,
    };

    setLocalSegments(updatedList);
    setHasUnsavedChanges(true);
    if (onTextChange) onTextChange(updatedList);
    setActiveSpanPopover(null);

    // Call server to persist span revert
    if (sessionId) {
      try {
        await fetch(`/api/sessions/${sessionId}/revert-span`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spanId: span.spanId,
            segmentId: targetSegment.id,
          }),
        });
      } catch (err) {
        console.error("Revert error:", err);
      }
    }
  };

  // Direct segment text edit
  const handleSegmentEdit = (index: number, newText: string) => {
    const updated = [...localSegments];
    updated[index] = {
      ...updated[index],
      finalizedText: newText,
      isEdited: true,
    };
    setLocalSegments(updated);
    setHasUnsavedChanges(true);
    if (onTextChange) onTextChange(updated);
  };

  // Trigger Save
  const handleSaveClick = async () => {
    if (onSave) {
      setIsSaving(true);
      await onSave();
      setIsSaving(false);
      setHasUnsavedChanges(false);
    }
  };

  const totalWords = localSegments.reduce(
    (acc, seg) => acc + (seg.finalizedText.trim() ? seg.finalizedText.trim().split(/\s+/).length : 0),
    0
  );

  return (
    <div className="flex flex-col bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800/80 shadow-card overflow-hidden transition-all">
      {/* Editor Header Toolbar */}
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800/70 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
              {title || "Սղագրության տարածք"}
            </h2>
            {hasUnsavedChanges ? (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30">
                Չպահպանված փոփոխություններ
              </span>
            ) : (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                Պահպանված է
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 dark:text-zinc-500 hidden sm:inline">
            • {totalWords} բառ
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60 transition-all active:scale-95"
            title="Պատճենել ամբողջ տեքստը"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? "Պատճենված է" : "Պատճենել"}</span>
          </button>

          {onSave && (
            <button
              onClick={handleSaveClick}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60 transition-all active:scale-95 disabled:opacity-50"
              title="Պահպանել պատմության մեջ"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Պահպանվում է..." : "Պահպանել"}</span>
            </button>
          )}

          {onExportClick && (
            <button
              onClick={onExportClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all active:scale-95"
              title="Արտահանել TXT, DOCX կամ SRT ձևաչափով"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Արտահանել</span>
            </button>
          )}
        </div>
      </div>

      {/* Uncertainty Notice (FR-007: Mandatory quality review reminder) */}
      <div className="px-5 py-2 bg-indigo-50/40 dark:bg-indigo-950/20 border-b border-indigo-100/50 dark:border-indigo-900/30 flex items-center gap-2 text-xs text-indigo-900/70 dark:text-indigo-300/80">
        <Info className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
        <span>
          Ինքնաշխատ սղագրում. խնդրում ենք ստուգել արդյունքները և անհրաժեշտության դեպքում կատարել ճշգրտումներ։
        </span>
      </div>

      {/* Main Editable Workspace */}
      <div className="p-6 min-h-[320px] max-h-[550px] overflow-y-auto space-y-3.5 focus:outline-none">
        {localSegments.length === 0 && !interimText && (
          <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 dark:text-zinc-500">
            <FileText className="w-10 h-10 mb-2 stroke-1 text-slate-300 dark:text-zinc-600" />
            <p className="text-sm font-medium">Սղագրության տեքստը դեռ դատարկ է</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
              Ընտրեք աուդիո/տեսանյութ ֆայլ կամ միացրեք խոսափողը՝ խոսքը տեքստի վերածելու համար
            </p>
          </div>
        )}

        {localSegments.map((segment, segIdx) => {
          const isCurrentlyPlaying =
            currentPlaybackTime >= segment.startTime && currentPlaybackTime <= segment.endTime;

          return (
            <div
              key={segment.id || `seg-${segIdx}`}
              className={`group flex items-start gap-3 p-2.5 rounded-2xl transition-all ${
                isCurrentlyPlaying
                  ? "bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/50"
                  : "hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 border border-transparent"
              }`}
            >
              {/* Clickable Timestamp Indicator */}
              <button
                type="button"
                onClick={() => onSeekAudio && onSeekAudio(segment.startTime)}
                className="mt-0.5 flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono text-slate-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/60 transition-colors"
                title="Լսել այս հատվածից"
              >
                <Clock className="w-3 h-3 opacity-60" />
                <span>{formatSeconds(segment.startTime)}</span>
              </button>

              {/* Editable Text Segment */}
              <div className="flex-1 text-base leading-relaxed text-slate-800 dark:text-zinc-100">
                {isLiveRecording ? (
                  // Read-only during live session per A-012
                  <span className="select-text">{renderSegmentWithSpans(segment, segIdx)}</span>
                ) : (
                  // Editable post-session per FR-023
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleSegmentEdit(segIdx, e.currentTarget.textContent || "")}
                    className="focus:outline-none focus:ring-1 focus:ring-indigo-300 dark:focus:ring-indigo-700/50 rounded px-1 transition-all"
                  >
                    {segment.finalizedText}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Interim Text (distinct visual style: gray italic, low-delay in-place update FR-017) */}
        {interimText && (
          <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/30 border border-dashed border-slate-200 dark:border-zinc-800 animate-pulseSlow">
            <span className="mt-0.5 flex-shrink-0 text-[11px] font-mono px-2 py-0.5 rounded-md text-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40">
              ընթացիկ...
            </span>
            <div className="flex-1 text-base leading-relaxed text-slate-400 dark:text-zinc-500 italic">
              {interimText}
            </div>
          </div>
        )}
      </div>

      {/* Floating Popover for Armenianized Word (Revert & Details FR-031) */}
      {activeSpanPopover && (
        <div
          className="fixed z-50 p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-slate-200/90 dark:border-zinc-700/90 w-64 text-xs animate-in fade-in zoom-in-95 duration-150"
          style={{
            top: `${Math.min(window.innerHeight - 150, activeSpanPopover.rect.bottom + 8)}px`,
            left: `${Math.max(10, Math.min(window.innerWidth - 270, activeSpanPopover.rect.left - 40))}px`,
          }}
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-zinc-700/60 mb-2">
            <span className="font-semibold text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Հայերենացված տերմին
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-mono">
              {Math.round(activeSpanPopover.span.confidence * 100)}%
            </span>
          </div>

          <div className="space-y-1.5 text-slate-600 dark:text-zinc-300">
            <div>
              <span className="text-slate-400 dark:text-zinc-500">Բնօրինակ: </span>
              <span className="font-mono text-slate-900 dark:text-zinc-100 font-medium">
                {activeSpanPopover.span.originalToken}
              </span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-zinc-500">Հայերեն համարժեք: </span>
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                {activeSpanPopover.span.replacedWith}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-zinc-700/60 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleRevertSpan(activeSpanPopover.span, activeSpanPopover.segmentIndex)}
              className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-xl text-xs font-medium text-slate-700 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-700/70 hover:bg-slate-200 dark:hover:bg-zinc-600 transition-colors"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>
                {activeSpanPopover.span.state === "reverted" ? "Վերականգնել հայերենը" : "Վերադարձնել բնօրինակին"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Helper to render segment text with interactive span popovers
  function renderSegmentWithSpans(segment: Segment, segIdx: number) {
    if (!segment.replacements || segment.replacements.length === 0) {
      return segment.finalizedText;
    }

    return (
      <span>
        {segment.finalizedText.split(" ").map((word, wIdx) => {
          const matchSpan = segment.replacements?.find(
            (r) =>
              r.replacedWith.includes(word) ||
              word.includes(r.replacedWith) ||
              r.originalToken.includes(word)
          );

          if (matchSpan) {
            return (
              <span
                key={`${segIdx}-${wIdx}`}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setActiveSpanPopover({
                    span: matchSpan,
                    segmentIndex: segIdx,
                    rect,
                  });
                }}
                className={`armenianized-token ${
                  matchSpan.state === "reverted" ? "reverted text-slate-500" : "text-indigo-700 dark:text-indigo-300 font-medium"
                }`}
                title="Կտտացրեք՝ բնօրինակը տեսնելու կամ վերադարձնելու համար"
              >
                {word}{" "}
              </span>
            );
          }
          return <span key={`${segIdx}-${wIdx}`}>{word} </span>;
        })}
      </span>
    );
  }
}

function formatSeconds(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
