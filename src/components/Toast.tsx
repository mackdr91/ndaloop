"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

let toastListeners: Array<(toasts: ToastMessage[]) => void> = [];
let toastsState: ToastMessage[] = [];

export function showToast(message: string, type: "success" | "error" | "info" = "success") {
  const id = Math.random().toString(36).slice(2);
  const newToast: ToastMessage = { id, type, message };
  toastsState = [...toastsState, newToast];
  toastListeners.forEach((l) => l(toastsState));

  setTimeout(() => {
    toastsState = toastsState.filter((t) => t.id !== id);
    toastListeners.forEach((l) => l(toastsState));
  }, 3500);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== setToasts);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[90%] max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xl border border-zinc-800 dark:border-zinc-200 text-sm animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-center gap-2.5">
            {toast.type === "success" && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            )}
            {toast.type === "error" && (
              <AlertCircle className="w-4 h-4 text-rose-400 dark:text-rose-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => {
              toastsState = toastsState.filter((t) => t.id !== toast.id);
              toastListeners.forEach((l) => l(toastsState));
            }}
            className="opacity-70 hover:opacity-100 transition-opacity p-0.5"
            aria-label="Dismiss toast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
