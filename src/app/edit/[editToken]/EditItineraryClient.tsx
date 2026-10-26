"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Share2,
  ExternalLink,
  Check,
  Save,
  Navigation,
  FileText,
  AlertCircle,
  Bookmark,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ShareModal } from "@/components/ShareModal";
import { showToast } from "@/components/Toast";
import { saveLocalItinerary } from "@/lib/storage";
import { formatDate, getMapsUrl } from "@/lib/utils";
import {
  updateItineraryDetailsAction,
  addItemAction,
  updateItemAction,
  deleteItemAction,
  reorderItemsAction,
  toggleItemCompletedAction,
} from "@/app/actions/itinerary";
import { claimItineraryAction, getSessionUserAction } from "@/app/actions/auth";

export interface ItemData {
  id: string;
  time: string | null;
  title: string;
  location: string | null;
  notes: string | null;
  isCompleted: boolean;
  sortOrder: number;
}

export interface ItineraryData {
  id: string;
  shareSlug: string;
  editToken: string;
  userId?: string | null;
  title: string;
  date: string | null;
  notes: string | null;
  items: ItemData[];
}

export function EditItineraryClient({ initialData }: { initialData: ItineraryData }) {
  const [data, setData] = useState<ItineraryData>(initialData);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [headerTitle, setHeaderTitle] = useState(data.title);
  const [headerDate, setHeaderDate] = useState(data.date || "");
  const [headerNotes, setHeaderNotes] = useState(data.notes || "");
  const [, startTransition] = useTransition();

  // New item form state
  const [newTime, setNewTime] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    getSessionUserAction().then(setCurrentUser);
  }, []);

  const handleClaim = async () => {
    const res = await claimItineraryAction(data.editToken);
    if (res.error) {
      showToast(res.error, "error");
    } else {
      setData((prev) => ({ ...prev, userId: currentUser?.id }));
      showToast("Saved to your account!");
    }
  };

  // Sync to local device storage
  useEffect(() => {
    saveLocalItinerary({
      id: data.id,
      title: data.title,
      date: data.date,
      editToken: data.editToken,
      shareSlug: data.shareSlug,
    });
  }, [data.id, data.title, data.date, data.editToken, data.shareSlug]);

  const handleSaveHeader = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!headerTitle.trim()) {
      showToast("Title cannot be empty", "error");
      return;
    }

    try {
      const res = await updateItineraryDetailsAction(data.editToken, {
        title: headerTitle,
        date: headerDate || undefined,
        notes: headerNotes || undefined,
      });

      if (res.error) {
        showToast(res.error, "error");
      } else {
        setData((prev) => ({
          ...prev,
          title: headerTitle.trim(),
          date: headerDate.trim() || null,
          notes: headerNotes.trim() || null,
        }));
        setIsEditingHeader(false);
        showToast("Day details updated!");
      }
    } catch {
      showToast("Failed to save changes", "error");
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast("Activity title is required", "error");
      return;
    }

    setIsAddingItem(true);
    try {
      const res = await addItemAction(data.editToken, {
        time: newTime.trim() || undefined,
        title: newTitle.trim(),
        location: newLocation.trim() || undefined,
        notes: newNotes.trim() || undefined,
      });

      if (res.error || !res.item) {
        showToast(res.error || "Failed to add activity", "error");
      } else {
        setData((prev) => ({
          ...prev,
          items: [...prev.items, res.item as ItemData],
        }));
        setNewTime("");
        setNewTitle("");
        setNewLocation("");
        setNewNotes("");
        showToast("Activity added!");
      }
    } catch {
      showToast("Failed to add activity", "error");
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleToggleComplete = async (item: ItemData) => {
    const nextStatus = !item.isCompleted;
    // Optimistic update
    setData((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.id === item.id ? { ...i, isCompleted: nextStatus } : i
      ),
    }));

    startTransition(async () => {
      const res = await toggleItemCompletedAction(item.id, nextStatus);
      if (res.error) {
        // Revert on error
        setData((prev) => ({
          ...prev,
          items: prev.items.map((i) =>
            i.id === item.id ? { ...i, isCompleted: item.isCompleted } : i
          ),
        }));
        showToast("Failed to update status", "error");
      }
    });
  };

  const handleDeleteItem = async (itemId: string) => {
    const previousItems = data.items;
    setData((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== itemId),
    }));

    startTransition(async () => {
      const res = await deleteItemAction(data.editToken, itemId);
      if (res.error) {
        setData((prev) => ({ ...prev, items: previousItems }));
        showToast("Failed to delete activity", "error");
      } else {
        showToast("Activity removed");
      }
    });
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= data.items.length) return;

    const newItems = [...data.items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);

    setData((prev) => ({ ...prev, items: newItems }));

    startTransition(async () => {
      const res = await reorderItemsAction(
        data.editToken,
        newItems.map((i) => i.id)
      );
      if (res.error) {
        setData((prev) => ({ ...prev, items: data.items }));
        showToast("Failed to save order", "error");
      }
    });
  };

  const handleUpdateItemInline = async (
    itemId: string,
    field: "time" | "title" | "location" | "notes",
    value: string
  ) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === itemId ? { ...i, [field]: value } : i)),
    }));

    startTransition(async () => {
      await updateItemAction(data.editToken, itemId, { [field]: value });
    });
  };

  const completedCount = data.items.filter((i) => i.isCompleted).length;
  const progressPercent = data.items.length
    ? Math.round((completedCount / data.items.length) * 100)
    : 0;

  return (
    <div className="min-h-screen text-zinc-900 dark:text-zinc-100 pb-28">
      <Header />

      <main className="max-w-2xl mx-auto px-4 pt-6">
        {/* Top Controls: Share & Public View */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              Creator Mode
            </span>
            {currentUser && !data.userId && (
              <button
                onClick={handleClaim}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 hover:bg-indigo-200 transition-colors"
                title="Save this itinerary to your logged-in account"
              >
                <Bookmark className="w-3 h-3" />
                <span>Save to Account</span>
              </button>
            )}
            <span className="text-xs text-zinc-400 hidden sm:inline">All edits auto-save</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsShareOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-xl text-xs font-medium transition-all shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
            <Link
              href={`/i/${data.shareSlug}`}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xs border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Live</span>
            </Link>
          </div>
        </div>

        {/* Day Header Card */}
        <div className="bg-white/85 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl p-5 shadow-xs border border-zinc-200/80 dark:border-zinc-800 mb-6">
          {!isEditingHeader ? (
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {data.title}
                  </h1>
                  {data.date && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(data.date)}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIsEditingHeader(true)}
                  className="px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shrink-0"
                >
                  Edit details
                </button>
              </div>

              {data.notes && (
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <FileText className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <p className="whitespace-pre-line leading-relaxed">{data.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSaveHeader} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-500 mb-1">
                  Day Title
                </label>
                <input
                  type="text"
                  required
                  value={headerTitle}
                  onChange={(e) => setHeaderTitle(e.target.value)}
                  className="w-full px-3 py-2 text-base font-semibold rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-500 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={headerDate}
                  onChange={(e) => setHeaderDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-500 mb-1">
                  General Notes
                </label>
                <textarea
                  rows={2}
                  value={headerNotes}
                  onChange={(e) => setHeaderNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold rounded-lg hover:opacity-90 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHeaderTitle(data.title);
                    setHeaderDate(data.date || "");
                    setHeaderNotes(data.notes || "");
                    setIsEditingHeader(false);
                  }}
                  className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Progress Bar */}
          {data.items.length > 0 && (
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                <span>
                  Progress: {completedCount} of {data.items.length} completed
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

        {/* Activities List */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Schedule ({data.items.length})
            </h2>
            <span className="text-[11px] text-zinc-400">Use arrows to reorder</span>
          </div>

          {data.items.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800">
              <Clock className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                No stops added yet
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Add activities below to build your day.
              </p>
            </div>
          ) : (
            data.items.map((item, index) => (
              <div
                key={item.id}
                className={`group p-4 rounded-xl bg-white/85 dark:bg-zinc-900/80 backdrop-blur-md border transition-all ${
                  item.isCompleted
                    ? "border-emerald-200 dark:border-emerald-950/60 bg-emerald-50/20 dark:bg-emerald-950/10"
                    : "border-zinc-200/90 dark:border-zinc-800 shadow-2xs"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Completed Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(item)}
                    className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                      item.isCompleted
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "border-zinc-300 dark:border-zinc-600 hover:border-zinc-500 bg-white dark:bg-zinc-900"
                    }`}
                    title={item.isCompleted ? "Mark incomplete" : "Mark completed"}
                  >
                    {item.isCompleted && <Check className="w-3.5 h-3.5" />}
                  </button>

                  {/* Main Inputs */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative w-28 shrink-0">
                        <input
                          type="text"
                          placeholder="Time"
                          defaultValue={item.time || ""}
                          onBlur={(e) =>
                            handleUpdateItemInline(item.id, "time", e.target.value)
                          }
                          className="w-full pl-6 pr-2 py-1 text-xs rounded-md bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/70 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium"
                        />
                        <Clock className="w-3 h-3 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      <input
                        type="text"
                        placeholder="Activity title"
                        defaultValue={item.title}
                        onBlur={(e) =>
                          handleUpdateItemInline(item.id, "title", e.target.value)
                        }
                        className={`w-full px-2 py-1 text-sm font-semibold rounded-md bg-transparent focus:bg-zinc-50 dark:focus:bg-zinc-800 border border-transparent focus:border-zinc-200 dark:focus:border-zinc-700 focus:outline-none ${
                          item.isCompleted
                            ? "line-through text-zinc-400 dark:text-zinc-500"
                            : "text-zinc-900 dark:text-zinc-100"
                        }`}
                      />
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Location / Address"
                          defaultValue={item.location || ""}
                          onBlur={(e) =>
                            handleUpdateItemInline(item.id, "location", e.target.value)
                          }
                          className="w-full pl-6 pr-2 py-1 text-xs rounded-md bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 focus:outline-none text-zinc-600 dark:text-zinc-300"
                        />
                        <MapPin className="w-3 h-3 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {item.location && (
                        <a
                          href={getMapsUrl(item.location)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          title="Open in Maps"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    {/* Notes / Sub-items */}
                    <div>
                      <input
                        type="text"
                        placeholder="Notes / details / tips (optional)"
                        defaultValue={item.notes || ""}
                        onBlur={(e) =>
                          handleUpdateItemInline(item.id, "notes", e.target.value)
                        }
                        className="w-full px-2 py-1 text-xs rounded-md bg-transparent focus:bg-zinc-50 dark:focus:bg-zinc-800 border border-transparent focus:border-zinc-200 dark:focus:border-zinc-700 focus:outline-none text-zinc-500 dark:text-zinc-400"
                      />
                    </div>
                  </div>

                  {/* Actions: Reorder & Delete */}
                  <div className="flex flex-col items-center gap-0.5 shrink-0 ml-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, "up")}
                      className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-20 transition-colors"
                      title="Move up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === data.items.length - 1}
                      onClick={() => handleMove(index, "down")}
                      className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-20 transition-colors"
                      title="Move down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 text-zinc-300 dark:text-zinc-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors mt-1"
                      title="Delete activity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Activity Form */}
        <form
          onSubmit={handleAddItem}
          className="bg-white/85 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs"
        >
          <div className="flex items-center gap-2 mb-3">
            <Plus className="w-4 h-4 text-zinc-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Add New Activity
            </h3>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="relative w-32 shrink-0">
                <input
                  type="text"
                  placeholder="e.g. 2:00 PM"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full pl-7 pr-2 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none font-medium"
                />
                <Clock className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <input
                type="text"
                placeholder="Activity Title *"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none font-medium"
              />
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Location (optional - opens in Maps)"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="w-full pl-7 pr-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none text-zinc-600 dark:text-zinc-300"
              />
              <MapPin className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <input
              type="text"
              placeholder="Notes / instructions / what to bring (optional)"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none text-zinc-600 dark:text-zinc-300"
            />

            <button
              type="submit"
              disabled={isAddingItem}
              className="w-full mt-2 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingItem ? "Adding..." : "Add to Itinerary"}</span>
            </button>
          </div>
        </form>

        {/* Secret Edit Link Notice */}
        <div className="mt-8 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Keep your edit link handy: </span>
            This page is your private editor. Use the Share button to get the public link for your friends!
          </div>
        </div>
      </main>

      {/* Sticky Bottom Action Bar for Mobile */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 p-3 flex items-center justify-between max-w-2xl mx-auto sm:hidden">
        <button
          onClick={() => setIsShareOpen(true)}
          className="flex-1 mr-2 py-2.5 px-4 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share Links</span>
        </button>
        <Link
          href={`/i/${data.shareSlug}`}
          target="_blank"
          className="py-2.5 px-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium text-xs rounded-xl flex items-center justify-center gap-1.5"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>View</span>
        </Link>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={data.title}
        shareSlug={data.shareSlug}
        editToken={data.editToken}
      />
    </div>
  );
}
