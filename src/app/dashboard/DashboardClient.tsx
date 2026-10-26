"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  ExternalLink,
  Edit3,
  Trash2,
  Copy,
  Check,
  Plus,
  Compass,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { showToast } from "@/components/Toast";
import { formatDate } from "@/lib/utils";
import { AuthUser } from "@/lib/auth";

export interface UserItinerary {
  id: string;
  title: string;
  date: string | null;
  shareSlug: string;
  editToken: string;
  updatedAt: string;
  itemCount: number;
  completedCount: number;
}

export function DashboardClient({
  user,
  initialItineraries,
}: {
  user: AuthUser;
  initialItineraries: UserItinerary[];
}) {
  const [itineraries, setItineraries] = useState<UserItinerary[]>(initialItineraries);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const handleCopyLink = async (slug: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/i/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      showToast("Share link copied to clipboard!");
      setTimeout(() => setCopiedSlug(null), 2000);
    } catch {
      showToast("Failed to copy link", "error");
    }
  };

  return (
    <div className="min-h-screen text-zinc-900 dark:text-zinc-100 pb-20">
      <Header />

      <main className="max-w-2xl mx-auto px-4 pt-8">
        {/* Profile / Greeting Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              My Itineraries
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Signed in as <span className="font-semibold text-zinc-700 dark:text-zinc-300">{user.email}</span>
            </p>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-xl text-xs font-semibold shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Itinerary</span>
          </Link>
        </div>

        {/* Itineraries List */}
        {itineraries.length === 0 ? (
          <div className="p-10 text-center bg-white/85 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
            <Compass className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
              No saved itineraries yet
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              Plan your day in seconds. Any itineraries you create while signed in will automatically appear here.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Day Itinerary</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3.5">
            {itineraries.map((itinerary) => {
              const progress = itinerary.itemCount > 0
                ? Math.round((itinerary.completedCount / itinerary.itemCount) * 100)
                : 0;

              return (
                <div
                  key={itinerary.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white/85 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                        {itinerary.title}
                      </h2>

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {itinerary.date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(itinerary.date)}
                          </span>
                        )}

                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {itinerary.itemCount} {itinerary.itemCount === 1 ? "stop" : "stops"}
                        </span>

                        {itinerary.itemCount > 0 && (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {progress}% completed
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link
                        href={`/edit/${itinerary.editToken}`}
                        className="flex items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </Link>

                      <Link
                        href={`/i/${itinerary.shareSlug}`}
                        target="_blank"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title="View public page"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => handleCopyLink(itinerary.shareSlug)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Copy share link"
                      >
                        {copiedSlug === itinerary.shareSlug ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
