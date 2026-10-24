"use client";

import { Trash2, AlertTriangle, X } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  title,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-slate-200/80 dark:border-zinc-800/80 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <Trash2 className="w-6 h-6" />
        </div>

        <div className="text-center space-y-1.5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
            Հեռացնե՞լ սղագրությունը
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            «<span className="font-medium text-slate-800 dark:text-zinc-200">{title}</span>» սղագրությունը և դրա բոլոր հատվածները կջնջվեն պատմությունից։
          </p>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
            Նշում. Ձեր սկզբնական աուդիո/տեսանյութ ֆայլը չի ջնջվի (FR-040)։
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Չեղարկել
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2 rounded-2xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-sm disabled:opacity-50"
          >
            {isDeleting ? "Ջնջվում է..." : "Այո, հեռացնել"}
          </button>
        </div>
      </div>
    </div>
  );
}

