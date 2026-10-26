import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { customAlphabet } from "nanoid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate human-friendly, clean short slug for sharing (lowercase letters + numbers)
const slugAlphabet = "23456789abcdefghjkmnpqrstuvwxyz";
const nanoidSlug = customAlphabet(slugAlphabet, 8);

// Generate secure edit token
const tokenAlphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const nanoidToken = customAlphabet(tokenAlphabet, 24);

export function generateShareSlug(): string {
  return nanoidSlug();
}

export function generateEditToken(): string {
  return `edit_${nanoidToken()}`;
}

export function getMapsUrl(location: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.trim())}`;
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    // If dateStr is in YYYY-MM-DD format, parse as local date
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
}
