"use client";

import { useState, useEffect } from "react";
import {
  FileAudio,
  Film,
  Mic,
  SlidersHorizontal,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Clock,
  Layers,
} from "lucide-react";
import { TranscriptEditor, Segment } from "@/components/TranscriptEditor";
import { AudioFileUploader } from "@/components/AudioFileUploader";
import { VideoFileUploader } from "@/components/VideoFileUploader";
import { LiveMicrophoneTranscriber } from "@/components/LiveMicrophoneTranscriber";
import { AudioPlayerSync } from "@/components/AudioPlayerSync";
import { ExportModal } from "@/components/ExportModal";

export default function WorkspacePage() {
  const [activeTab, setActiveTab] = useState<"audio_file" | "video_file" | "live_microphone">("audio_file");
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
  const [transcriptTitle, setTranscriptTitle] = useState("Նոր սղագրություն");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [interimText, setInterimText] = useState("");
  const [isLiveRecording, setIsLiveRecording] = useState(false);

  // Settings states
  const [armenianizationEnabled, setArmenianizationEnabled] = useState(true);
  const [punctuationEnabled, setPunctuationEnabled] = useState(true);
  const [activeModel, setActiveModel] = useState("small");

  // Playback sync
  const [playbackTime, setPlaybackTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Restore active draft or session if exists
  useEffect(() => {
    const savedDraft = localStorage.getItem("barbar_current_draft");
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.segments && parsed.segments.length > 0) {
          setSegments(parsed.segments);
          setTranscriptTitle(parsed.title || "Պահպանված սևագիր");
          if (parsed.sessionId) setCurrentSessionId(parsed.sessionId);
        }
      } catch (e) {
        console.error("Draft restore error:", e);
      }
    }
  }, []);

  // Auto-save draft locally every 3 seconds (FR-039 resilience)
  useEffect(() => {
    if (segments.length > 0) {
      localStorage.setItem(
        "barbar_current_draft",
        JSON.stringify({
          sessionId: currentSessionId,
          title: transcriptTitle,
          segments,
          updatedAt: Date.now(),
        })
      );
    }
  }, [segments, transcriptTitle, currentSessionId]);

  const handleTranscriptionComplete = (session: any) => {
    setCurrentSessionId(session.id);
    setTranscriptTitle(session.title || "Սղագրություն");
    setSegments(session.segments || []);
    setTotalDuration(session.durationSeconds || 0);
  };

  const handleLiveSegmentFinalized = (segment: any) => {
    setSegments((prev) => [...prev, segment]);
  };

  const handleSaveToHistory = async () => {
    if (!currentSessionId) {
      // Create session first
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: transcriptTitle,
          mode: activeTab,
          status: "completed",
          durationSeconds: totalDuration,
          modelIdentifier: activeModel,
          armenianizationEnabled,
          punctuationEnabled,
        }),
      });
      const data = await res.json();
      if (data.session) {
        setCurrentSessionId(data.session.id);
        // Append segments
        for (const seg of segments) {
          await fetch(`/api/sessions/${data.session.id}/segments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(seg),
          });
        }
      }
    } else {
      // Update session title and segments
      await fetch(`/api/sessions/${currentSessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: transcriptTitle,
          hasUnsavedChanges: false,
        }),
      });
    }
  };

  const hasTimestamps = segments.length > 0 && segments.some((s) => s.endTime > 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-zinc-800/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            Հայերեն խոսքի սղագրում (Speech-to-Text)
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Սղագրեք աուդիո ֆայլեր, առանձնացրեք խոսքը տեսանյութերից կամ թելադրեք կենդանի խոսափողով։
          </p>
        </div>

        {/* Quick Toggles: Armenianization & Punctuation */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Armenianization Toggle (FR-031) */}
          <button
            onClick={() => setArmenianizationEnabled(!armenianizationEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium border transition-all ${
              armenianizationEnabled
                ? "bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60"
                : "bg-white dark:bg-zinc-900 text-slate-400 border-slate-200 dark:border-zinc-800"
            }`}
            title="Համատեքստային հայերենացում (օր. meeting-ի -> հանդիպման)"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Հայերենացում՝ {armenianizationEnabled ? "Միացված" : "Անջատված"}</span>
          </button>

          {/* Punctuation Toggle */}
          <button
            onClick={() => setPunctuationEnabled(!punctuationEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium border transition-all ${
              punctuationEnabled
                ? "bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60"
                : "bg-white dark:bg-zinc-900 text-slate-400 border-slate-200 dark:border-zinc-800"
            }`}
            title="Հայերեն վերջակետ (։) և կետադրություն"
          >
            <span className="font-bold text-indigo-500">։</span>
            <span>Կետադրություն՝ {punctuationEnabled ? "Միացված" : "Անջատված"}</span>
          </button>
        </div>
      </div>

      {/* Main Mode Tabs (Audio / Video / Live) */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/70 dark:bg-zinc-900/70 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 max-w-fit">
        <button
          onClick={() => setActiveTab("audio_file")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "audio_file"
              ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-300 shadow-sm"
              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
          }`}
        >
          <FileAudio className="w-4 h-4" />
          <span>Աուդիո ֆայլ</span>
        </button>

        <button
          onClick={() => setActiveTab("video_file")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "video_file"
              ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-300 shadow-sm"
              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Տեսանյութ</span>
        </button>

        <button
          onClick={() => setActiveTab("live_microphone")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "live_microphone"
              ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-300 shadow-sm"
              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Կենդանի խոսք</span>
        </button>
      </div>

      {/* Mode Content Panel */}
      <div className="transition-all duration-200">
        {activeTab === "audio_file" && (
          <AudioFileUploader
            onTranscriptionComplete={handleTranscriptionComplete}
            armenianizationEnabled={armenianizationEnabled}
            punctuationEnabled={punctuationEnabled}
            modelIdentifier={activeModel}
          />
        )}

        {activeTab === "video_file" && (
          <VideoFileUploader
            onTranscriptionComplete={handleTranscriptionComplete}
            armenianizationEnabled={armenianizationEnabled}
            punctuationEnabled={punctuationEnabled}
            modelIdentifier={activeModel}
          />
        )}

        {activeTab === "live_microphone" && (
          <LiveMicrophoneTranscriber
            onSegmentFinalized={handleLiveSegmentFinalized}
            onInterimText={setInterimText}
            onRecordingStateChange={setIsLiveRecording}
            armenianizationEnabled={armenianizationEnabled}
            punctuationEnabled={punctuationEnabled}
            modelIdentifier={activeModel}
          />
        )}
      </div>

      {/* Audio Playback Sync Bar (FR-042) */}
      {totalDuration > 0 && (
        <AudioPlayerSync
          duration={totalDuration}
          currentTime={playbackTime}
          onTimeUpdate={setPlaybackTime}
          onSeek={setPlaybackTime}
        />
      )}

      {/* Dominant Transcript Workspace (UI-002) */}
      <TranscriptEditor
        sessionId={currentSessionId}
        title={transcriptTitle}
        segments={segments}
        interimText={interimText}
        isLiveRecording={isLiveRecording}
        onTextChange={setSegments}
        onSave={handleSaveToHistory}
        onExportClick={() => setIsExportModalOpen(true)}
        onSeekAudio={setPlaybackTime}
        currentPlaybackTime={playbackTime}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        sessionId={currentSessionId}
        hasTimestamps={hasTimestamps}
      />
    </div>
  );
}

