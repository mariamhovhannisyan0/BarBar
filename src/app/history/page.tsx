"use client";

import { useState, useEffect } from "react";
import {
  History,
  Search,
  Filter,
  FileAudio,
  Film,
  Mic,
  Trash2,
  Edit2,
  ExternalLink,
  Clock,
  Calendar,
  AlertCircle,
  Check,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";

export default function HistoryPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [modeFilter, setModeFilter] = useState("all");

  // Rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const url = new URL("/api/sessions", window.location.origin);
      if (searchQuery) url.searchParams.set("query", searchQuery);
      if (modeFilter !== "all") url.searchParams.set("mode", modeFilter);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions || []);
      }
    } catch (e) {
      console.error("Error fetching sessions:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [modeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSessions();
  };

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle }),
      });
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title: editTitle } : s))
      );
      setEditingId(null);
    } catch (e) {
      console.error("Rename error:", e);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/sessions/${deleteTarget.id}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      console.error("Delete error:", e);
    } finally {
      setIsDeleting(false);
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "video_file":
        return <Film className="w-4 h-4 text-indigo-500" />;
      case "live_microphone":
        return <Mic className="w-4 h-4 text-rose-500" />;
      default:
        return <FileAudio className="w-4 h-4 text-blue-500" />;
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case "video_file":
        return "Տեսանյութ";
      case "live_microphone":
        return "Կենդանի խոսք";
      default:
        return "Աուդիո ֆայլ";
    }
  };

  const formatSec = (secs: number) => {
    if (!secs) return "—";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}ր ${s}վ`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-zinc-800/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Սղագրությունների պատմություն
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Տեղային պատմություն՝ ավարտված և ընդհատված բոլոր աշխատանքներով (FR-040)։
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Որոնել ըստ վերնագրի..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48 sm:w-64"
            />
          </form>

          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 focus:outline-none"
          >
            <option value="all">Բոլոր ռեժիմները</option>
            <option value="audio_file">Աուդիո ֆայլեր</option>
            <option value="video_file">Տեսանյութեր</option>
            <option value="live_microphone">Կենդանի խոսք</option>
          </select>
        </div>
      </div>

      {/* Session Cards Grid / Table */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400 dark:text-zinc-500">
          Բեռնվում է պատմությունը...
        </div>
      ) : sessions.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800/80">
          <FileText className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
            Սղագրություններ չեն գտնվել
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
            Կատարեք աուդիոյի, տեսանյութի կամ կենդանի խոսքի սղագրում՝ այստեղ պահպանելու համար։
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 hover:shadow-card transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getModeIcon(session.mode)}
                </div>

                <div className="flex-1 min-w-0">
                  {editingId === session.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="text-sm font-semibold px-2 py-0.5 rounded border border-indigo-400 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRename(session.id)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100 truncate">
                        {session.title}
                      </h3>
                      <button
                        onClick={() => {
                          setEditingId(session.id);
                          setEditTitle(session.title);
                        }}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                        title="Խմբագրել վերնագիրը"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(session.createdAt).toLocaleDateString("hy-AM", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatSec(session.durationSeconds)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                      {getModeLabel(session.mode)}
                    </span>
                    {!session.sourceMediaAvailable && (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-3 h-3" />
                        Սկզբնաղբյուրն անհասանելի է (FR-041)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => {
                    localStorage.setItem(
                      "barbar_current_draft",
                      JSON.stringify({
                        sessionId: session.id,
                        title: session.title,
                        segments: session.segments || [],
                        updatedAt: Date.now(),
                      })
                    );
                    window.location.href = "/";
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Բացել</span>
                </button>

                <button
                  onClick={() => setDeleteTarget({ id: session.id, title: session.title })}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Հեռացնել"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal (FR-040) */}
      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        title={deleteTarget?.title || ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
}

