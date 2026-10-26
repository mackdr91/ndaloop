"use client";

import { useState, useTransition } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Share2,
  Check,
  Navigation,
  FileText,
  Printer,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ShareModal } from "@/components/ShareModal";
import { showToast } from "@/components/Toast";
import { formatDate, getMapsUrl } from "@/lib/utils";
import { toggleItemCompletedAction } from "@/app/actions/itinerary";

export interface PublicItemData {
  id: string;
  time: string | null;
  title: string;
  location: string | null;
  notes: string | null;
  isCompleted: boolean;
  sortOrder: number;
}

export interface PublicItineraryData {
  id: string;
  shareSlug: string;
  title: string;
  date: string | null;
  notes: string | null;
  items: PublicItemData[];
}

export function PublicItineraryClient({
  itinerary,
}: {
  itinerary: PublicItineraryData;
}) {
  const [items, setItems] = useState<PublicItemData[]>(itinerary.items);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [, startTransition] = useTransition();

  const handleToggleComplete = (item: PublicItemData) => {
    const nextStatus = !item.isCompleted;

    // Optimistic UI update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isCompleted: nextStatus } : i))
    );

    startTransition(async () => {
      const res = await toggleItemCompletedAction(item.id, nextStatus);
      if (res.error) {
        // Revert on error
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, isCompleted: item.isCompleted } : i))
        );
        showToast("Could not update status", "error");
      }
    });
  };

  const handleNativeShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: itinerary.title,
          text: `Itinerary for ${itinerary.title}:`,
          url,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setIsShareOpen(true);
        }
      }
    } else {
      setIsShareOpen(true);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const completedCount = items.filter((i) => i.isCompleted).length;
  const progressPercent = items.length
    ? Math.round((completedCount / items.length) * 100)
    : 0;

  return (
    <div className="min-h-screen text-zinc-900 dark:text-zinc-100 pb-28 print:pb-0 print:bg-white print:text-black">
      <div className="print:hidden">
        <Header />
      </div>

      <main className="max-w-xl mx-auto px-4 pt-6 sm:pt-8">
        {/* Top Floating Controls */}
        <div className="flex items-center justify-between mb-4 print:hidden">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/90 dark:bg-emerald-950/60 backdrop-blur-xs text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Itinerary
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white/60 dark:hover:bg-zinc-800/60 backdrop-blur-xs transition-colors"
              title="Print itinerary"
              aria-label="Print itinerary"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleNativeShare}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-xl text-xs font-semibold shadow-xs transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Day Header Card */}
        <div className="bg-white/85 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 shadow-xs border border-zinc-200/90 dark:border-zinc-800 mb-6 print:border-none print:shadow-none print:p-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            {itinerary.title}
          </h1>

          {itinerary.date && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(itinerary.date)}</span>
            </div>
          )}

          {itinerary.notes && (
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-300">
              <FileText className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
              <p className="whitespace-pre-line leading-relaxed">{itinerary.notes}</p>
            </div>
          )}

          {/* Progress Tracker */}
          {items.length > 0 && (
            <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 print:hidden">
              <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                <span>
                  {completedCount} of {items.length} completed
                </span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Schedule Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Today&apos;s Schedule
            </h2>
            <span className="text-[11px] text-zinc-400 print:hidden">
              Tap check to mark completed
            </span>
          </div>

          {items.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800">
              <Clock className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                No activities planned yet
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800 print:before:bg-zinc-300">
              {items.map((item, index) => (
                <div key={item.id} className="relative group">
                  {/* Timeline Dot / Number */}
                  <div
                    className={`absolute -left-6 top-3 -translate-x-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-colors ${
                      item.isCompleted
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-white dark:bg-zinc-900 border-zinc-400 dark:border-zinc-600 text-zinc-500"
                    }`}
                  >
                    {item.isCompleted ? (
                      <Check className="w-3 h-3 stroke-[3]" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  {/* Card Content */}
                  <div
                    className={`p-4 rounded-xl bg-white/85 dark:bg-zinc-900/80 backdrop-blur-md border transition-all ${
                      item.isCompleted
                        ? "border-emerald-200/80 dark:border-emerald-950/60 bg-emerald-50/15 dark:bg-emerald-950/10"
                        : "border-zinc-200/90 dark:border-zinc-800 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {/* Time Badge */}
                        {item.time && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-semibold mb-1.5">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            <span>{item.time}</span>
                          </div>
                        )}

                        {/* Title */}
                        <h3
                          className={`text-base font-semibold leading-snug ${
                            item.isCompleted
                              ? "line-through text-zinc-400 dark:text-zinc-500"
                              : "text-zinc-900 dark:text-zinc-100"
                          }`}
                        >
                          {item.title}
                        </h3>

                        {/* Location */}
                        {item.location && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <a
                              href={getMapsUrl(item.location)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100/80 hover:bg-zinc-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors group/loc"
                            >
                              <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span className="truncate max-w-[200px] sm:max-w-xs">{item.location}</span>
                              <Navigation className="w-2.5 h-2.5 opacity-60 group-hover/loc:opacity-100 ml-0.5" />
                            </a>
                          </div>
                        )}

                        {/* Notes */}
                        {item.notes && (
                          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg p-2.5 leading-relaxed">
                            {item.notes}
                          </div>
                        )}
                      </div>

                      {/* Interactive Completed Checkbox (tap to update for all) */}
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(item)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 print:hidden ${
                          item.isCompleted
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-zinc-300 dark:border-zinc-600 hover:border-zinc-500 bg-white dark:bg-zinc-900"
                        }`}
                        title={item.isCompleted ? "Mark incomplete" : "Mark completed"}
                        aria-label="Toggle activity completion"
                      >
                        {item.isCompleted && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Brand CTA */}
        <div className="mt-14 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center print:hidden">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 transition-colors shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Create your own day itinerary on ndaloop</span>
          </Link>
        </div>
      </main>

      {/* Sticky Mobile Bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 p-3 flex items-center gap-2 max-w-xl mx-auto sm:hidden print:hidden">
        <button
          onClick={handleNativeShare}
          className="flex-1 py-2.5 px-4 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share with Friends</span>
        </button>
        <button
          onClick={handlePrint}
          className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl"
          title="Print"
        >
          <Printer className="w-4 h-4" />
        </button>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={itinerary.title}
        shareSlug={itinerary.shareSlug}
      />
    </div>
  );
}
