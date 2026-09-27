"use client";

import { useUser } from "@/app/context/UserContext";

export default function Home() {
  const { user, loading, logout } = useUser();

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-neutral-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        {loading ? (
          <p className="text-neutral-500 text-sm">Loading...</p>
        ) : user ? (
          <div className="space-y-6 w-full max-w-md">
            <h1 className="text-2xl font-bold tracking-tight text-black dark:text-neutral-50">
              Welcome, {user.username}!
            </h1>
            <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
              <p>
                <span className="font-medium text-black dark:text-neutral-200">ID:</span>{" "}
                {user.id}
              </p>
              <p>
                <span className="font-medium text-black dark:text-neutral-200">Username:</span>{" "}
                {user.username}
              </p>
              <p>
                <span className="font-medium text-black dark:text-neutral-200">Email:</span>{" "}
                {user.email}
              </p>
            </div>
            <div className="space-y-3">
              <a
                href="/search"
                className="block w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium cursor-pointer text-center"
              >
                Search Games
              </a>
              <a
                href="/wishlist"
                className="block w-full border border-neutral-300 dark:border-neutral-700 text-white py-2 rounded-md hover:bg-neutral-800 transition-colors text-sm font-medium cursor-pointer text-center"
              >
                My Wishlist
              </a>
            </div>
            <button
              onClick={logout}
              className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium cursor-pointer"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="space-y-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-black dark:text-neutral-50">
              Welcome to Deal Hunter
            </h1>
            <p className="text-sm text-neutral-500 max-w-md">
              Sign in or create an account to start hunting for the best game deals across virtual stores.
            </p>
            <div className="flex gap-4 justify-center pt-2">
              <a
                href="/login"
                className="px-6 py-2 rounded-md bg-black text-white text-sm font-medium hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Login
              </a>
              <a
                href="/register"
                className="px-6 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Register
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
