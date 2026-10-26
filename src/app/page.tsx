"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  ArrowRight,
  Sparkles,
  History,
  ExternalLink,
  Edit3,
} from "lucide-react";
import { Header } from "@/components/Header";
import { createItineraryAction } from "@/app/actions/itinerary";
import { getLocalItineraries, saveLocalItinerary, removeLocalItinerary, StoredItinerary } from "@/lib/storage";
import { showToast } from "@/components/Toast";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface InitialItem {
  id: string;
  time: string;
  title: string;
  location: string;
}

export default function HomePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => {
    // Default to current date in YYYY-MM-DD
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [items, setItems] = useState<InitialItem[]>([
    { id: "1", time: "10:00 AM", title: "Morning coffee & meet up", location: "" },
    { id: "2", time: "12:30 PM", title: "Lunch & explore", location: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentItineraries, setRecentItineraries] = useState<StoredItinerary[]>([]);

  useEffect(() => {
    setRecentItineraries(getLocalItineraries());
  }, []);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Math.random().toString(), time: "", title: "", location: "" },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof InitialItem, val: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("Please give your day a title", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createItineraryAction({
        title,
        date,
        notes: notes.trim() || undefined,
        initialItems: items
          .filter((i) => i.title.trim().length > 0)
          .map((i) => ({
            time: i.time.trim() || undefined,
            title: i.title.trim(),
            location: i.location.trim() || undefined,
          })),
      });

      if (res.error || !res.editToken || !res.shareSlug || !res.id) {
        showToast(res.error || "Failed to create itinerary", "error");
        setIsSubmitting(false);
        return;
      }

      // Save to localStorage
      saveLocalItinerary({
        id: res.id,
        title: title.trim(),
        date: date || null,
        editToken: res.editToken,
        shareSlug: res.shareSlug,
      });

      showToast("Itinerary created! Redirecting...");
      router.push(`/edit/${res.editToken}`);
    } catch {
      showToast("An unexpected error occurred", "error");
      setIsSubmitting(false);
    }
  };

  const handleDeleteRecent = (editToken: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeLocalItinerary(editToken);
    setRecentItineraries(getLocalItineraries());
    showToast("Removed from recent list");
  };

  return (
    <div className="min-h-screen text-zinc-900 dark:text-zinc-100 pb-20">
      <Header />

      <main className="max-w-2xl mx-auto px-4 pt-8">
        {/* Minimal Hero */}
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 dark:bg-zinc-800/60 backdrop-blur-xs border border-zinc-200/60 dark:border-zinc-700/50 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-3">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Zero login • Mobile first • Fast sharing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Build your day&apos;s itinerary.
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Set up a schedule in under a minute. Share a live link with friends so everyone stays in the loop.
          </p>
        </div>

        {/* Creation Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/85 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl p-5 sm:p-7 shadow-sm border border-zinc-200/90 dark:border-zinc-800"
        >
          {/* Title & Date */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5"
              >
                Day Title *
              </label>
              <input
                id="title"
                type="text"
                required
                placeholder="e.g. Saturday in the City, Tokyo Day 1, Beach Trip"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 text-base rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 placeholder:text-zinc-400 transition-all font-medium"
              />
            </div>

            <div>
              <label
                htmlFor="date"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5"
              >
                Date
              </label>
              <div className="relative">
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
                />
                <Calendar className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Notes Toggle */}
            <div>
              {!showNotes ? (
                <button
                  type="button"
                  onClick={() => setShowNotes(true)}
                  className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium transition-colors"
                >
                  + Add general notes / group details
                </button>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="notes"
                      className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                    >
                      General Notes / Packing Checklist
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowNotes(false)}
                      className="text-[11px] text-zinc-400 hover:text-zinc-600"
                    >
                      Hide
                    </button>
                  </div>
                  <textarea
                    id="notes"
                    rows={2}
                    placeholder="e.g. Bring sunglasses and sunscreen. Meeting at main entrance."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 placeholder:text-zinc-400 transition-all"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Activities Starter List */}
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Initial Activities (Optional)
              </span>
              <span className="text-[11px] text-zinc-400">You can add more anytime</span>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-700/60 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="relative w-28 shrink-0">
                      <input
                        type="text"
                        placeholder="Time"
                        value={item.time}
                        onChange={(e) => handleItemChange(item.id, "time", e.target.value)}
                        className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none font-medium"
                      />
                      <Clock className="w-3 h-3 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    <input
                      type="text"
                      placeholder={`Activity ${idx + 1}`}
                      value={item.title}
                      onChange={(e) => handleItemChange(item.id, "title", e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none font-medium"
                    />

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Location name (optional)"
                      value={item.location}
                      onChange={(e) => handleItemChange(item.id, "location", e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none text-zinc-600 dark:text-zinc-300"
                    />
                    <MapPin className="w-3 h-3 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="mt-3 w-full py-2 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Stop
            </button>
          </div>

          {/* Submit Action */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-xl text-sm font-semibold tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Generating Itinerary...</span>
              ) : (
                <>
                  <span>Create Itinerary & Get Link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Recent Itineraries (Local Device Storage) */}
        {recentItineraries.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-zinc-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Created on this device
              </h2>
            </div>

            <div className="space-y-2.5">
              {recentItineraries.map((itinerary) => (
                <div
                  key={itinerary.editToken}
                  className="group flex items-center justify-between p-3.5 rounded-xl bg-white/85 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-2xs"
                >
                  <div className="min-w-0 pr-3">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {itinerary.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {formatDate(itinerary.date) || "No date set"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href={`/edit/${itinerary.editToken}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </Link>
                    <Link
                      href={`/i/${itinerary.shareSlug}`}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="View public page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={(e) => handleDeleteRecent(itinerary.editToken, e)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Remove from this device's recent list"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
