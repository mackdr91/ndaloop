export interface StoredItinerary {
  id: string;
  title: string;
  date?: string | null;
  editToken: string;
  shareSlug: string;
  updatedAt: number;
}

const STORAGE_KEY = "ndaloop_itineraries";

export function getLocalItineraries(): StoredItinerary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLocalItinerary(item: Omit<StoredItinerary, "updatedAt">): void {
  if (typeof window === "undefined") return;
  try {
    const list = getLocalItineraries().filter((i) => i.editToken !== item.editToken);
    const updated: StoredItinerary = {
      ...item,
      updatedAt: Date.now(),
    };
    list.unshift(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 30)));
  } catch (e) {
    console.error("Failed to save to local storage", e);
  }
}

export function removeLocalItinerary(editToken: string): void {
  if (typeof window === "undefined") return;
  try {
    const list = getLocalItineraries().filter((i) => i.editToken !== editToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to remove from local storage", e);
  }
}
