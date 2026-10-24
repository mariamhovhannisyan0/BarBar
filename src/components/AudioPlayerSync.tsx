"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Square, Volume2, VolumeX, RotateCcw } from "lucide-react";

interface AudioPlayerSyncProps {
  audioUrl?: string;
  duration?: number;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onSeek: (time: number) => void;
}

export function AudioPlayerSync({
  audioUrl,
  duration = 0,
  currentTime,
  onTimeUpdate,
  onSeek,
}: AudioPlayerSyncProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    onTimeUpdate(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    onSeek(time);
  };

  const formatSec = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50/80 dark:bg-zinc-900/60 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 text-xs">
      {audioUrl && (
        <audio
          ref={audioRef}
          onTimeUpdate={() => audioRef.current && onTimeUpdate(audioRef.current.currentTime)}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Play/Pause */}
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-sm transition-all active:scale-95"
        title={isPlaying ? "Դադար (Pause)" : "Նվագարկել (Play)"}
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
      </button>

      <button
        onClick={handleStop}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-200/50 dark:hover:bg-zinc-800 transition-colors"
        title="Կանգնեցնել (Stop)"
      >
        <Square className="w-3.5 h-3.5" />
      </button>

      {/* Current Time / Duration */}
      <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-400 min-w-[70px]">
        {formatSec(currentTime)} / {formatSec(duration)}
      </span>

      {/* Progress Slider */}
      <div className="flex-1 flex items-center">
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
      </div>

      {/* Mute Toggle */}
      <button
        onClick={() => {
          if (audioRef.current) {
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
          }
        }}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
      >
        {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

