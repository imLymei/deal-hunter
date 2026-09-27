"use client";

import { useUser } from "@/app/context/UserContext";

export default function Navbar() {
  const { user, loading, logout } = useUser();

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-sm">
      <nav className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <a href="/" className="text-base font-bold text-black dark:text-neutral-50 hover:opacity-80 transition-opacity">
          Deal Hunter
        </a>

        {loading ? (
          <div className="flex gap-6" />
        ) : user ? (
          <div className="flex items-center gap-6">
            <a
              href="/search"
              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-neutral-50 transition-colors"
            >
              Search Games
            </a>
            <a
              href="/wishlist"
              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-neutral-50 transition-colors"
            >
              Wishlist
            </a>
            <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-800" />
            <span className="text-sm text-neutral-500">{user.username}</span>
            <button
              onClick={logout}
              className="text-sm text-red-400 hover:text-red-300 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <a
              href="/login"
              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-neutral-50 transition-colors"
            >
              Login
            </a>
            <a
              href="/register"
              className="px-4 py-1.5 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors cursor-pointer"
            >
              Register
            </a>
          </div>
        )}
      </nav>
    </header>
  );
}
