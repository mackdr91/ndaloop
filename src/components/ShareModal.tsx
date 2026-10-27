"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Copy, Check, Share2, ShieldAlert, Globe, X } from "lucide-react";
import { showToast } from "./Toast";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  shareSlug: string;
  editToken?: string;
}

export function ShareModal({ isOpen, onClose, title, shareSlug, editToken }: ShareModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copiedView, setCopiedView] = useState(false);
  const [copiedEdit, setCopiedEdit] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = `${origin}/i/${shareSlug}`;
  const editUrl = editToken ? `${origin}/edit/${editToken}` : "";

  const handleCopyPublic = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedView(true);
      showToast("Public view link copied to clipboard!");
      setTimeout(() => setCopiedView(false), 2000);
    } catch {
      showToast("Could not copy link automatically", "error");
    }
  };

  const handleCopyEdit = async () => {
    if (!editUrl) return;
    try {
      await navigator.clipboard.writeText(editUrl);
      setCopiedEdit(true);
      showToast("Secret edit link copied! Keep it safe.");
      setTimeout(() => setCopiedEdit(false), 2000);
    } catch {
      showToast("Could not copy link automatically", "error");
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Itinerary: ${title}`,
          text: `Check out our itinerary for ${title}:`,
          url: publicUrl,
        });
      } catch (err) {
        // User canceled or failed
        if ((err as Error).name !== "AbortError") {
          handleCopyPublic();
        }
      }
    } else {
      handleCopyPublic();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-bottom duration-200"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">Share Itinerary</h3>
            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* Public Link Card */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Public View Link
              </span>
              <span className="text-[11px] text-zinc-500">For friends & attendees</span>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
              Anyone with this link can view the day schedule and check off activities together.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-700 dark:text-zinc-300 font-mono select-all focus:outline-none"
              />
              <button
                onClick={handleCopyPublic}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 rounded-lg text-xs font-medium transition-all shrink-0"
              >
                {copiedView ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedView ? "Copied" : "Copy"}
              </button>
            </div>

            <button
              onClick={handleNativeShare}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-xs font-medium text-zinc-800 dark:text-zinc-200 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              Send via Messages, WhatsApp, or Email
            </button>
          </div>

          {/* Secret Edit Link Card (Only shown if editToken provided) */}
          {editToken && (
            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Your Secret Edit Link
                </span>
                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">Owner Only</span>
              </div>

              <p className="text-xs text-amber-800 dark:text-amber-400/90 mb-3">
                Bookmark or save this private link to add, edit, or delete activities later without signing up.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={editUrl}
                  className="w-full text-xs bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-900/50 rounded-lg px-3 py-2 text-zinc-700 dark:text-zinc-300 font-mono select-all focus:outline-none"
                />
                <button
                  onClick={handleCopyEdit}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-medium transition-all shrink-0"
                >
                  {copiedEdit ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedEdit ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
