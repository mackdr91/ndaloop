"use client";

import { useState, useEffect } from "react";
import { User as UserIcon, LogOut, LayoutList, ChevronDown } from "lucide-react";
import Link from "next/link";
import { AuthUser } from "@/lib/auth";
import { signOutAction, getSessionUserAction } from "@/app/actions/auth";
import { AuthModal } from "./AuthModal";
import { showToast } from "./Toast";
import { useRouter } from "next/navigation";

export function UserNav() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const refreshUser = async () => {
    try {
      const u = await getSessionUserAction();
      setUser(u);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const handleSignOut = async () => {
    await signOutAction();
    setUser(null);
    setIsMenuOpen(false);
    showToast("Signed out successfully");
    router.refresh();
  };

  if (!user) {
    return (
      <>
        <button
          onClick={() => setIsAuthOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors"
        >
          <UserIcon className="w-3.5 h-3.5 text-zinc-500" />
          <span>Sign In</span>
        </button>

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => {
            setIsAuthOpen(false);
            refreshUser();
          }}
        />
      </>
    );
  }

  const initial = user.name
    ? user.name.charAt(0).toUpperCase()
    : user.email.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center gap-1 p-1 rounded-full hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors"
        aria-label="User menu"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
          {initial}
        </div>
        <ChevronDown className="w-3 h-3 text-zinc-400" />
      </button>

      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-xl border border-zinc-200 dark:border-zinc-800 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
              {user.name && (
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {user.name}
                </p>
              )}
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                {user.email}
              </p>
            </div>

            <Link
              href="/dashboard"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>My Itineraries</span>
            </Link>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
