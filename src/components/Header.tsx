import Link from "next/link";
import { Plus, Compass } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 group transition-opacity hover:opacity-90"
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-xs">
            <Compass className="w-4 h-4 transition-transform group-hover:rotate-45" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-base text-zinc-900 dark:text-zinc-100 leading-none">
              ndaloop
            </span>
            <span className="text-[10px] text-zinc-500 font-medium tracking-wide">
              day itineraries
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Day</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
