"use client";

import { useState, useCallback, useEffect } from "react";
import { useUser } from "@/app/context/UserContext";
import { searchGames, addToWishlist } from "@/lib/api";

interface SearchResult {
  gameID: string;
  title: string;
  thumb: string;
}

export default function SearchPage() {
  const { user, loading: authLoading } = useUser();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await searchGames(searchQuery.trim());
      setResults(data.games);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Search failed";
      if ((err as Error & { status?: number })?.status !== 401) {
        setError(message);
      }
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleAddToWishlist = async (game: SearchResult) => {
    if (!user) return;

    setAddingId(game.gameID);
    try {
      await addToWishlist(game.gameID, game.title, game.thumb);
      setResults(prev => prev.filter(g => g.gameID !== game.gameID));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add";
      if ((err as Error & { status?: number })?.status === 409) {
        setError("Game already in your wishlist");
      } else {
        setError(message);
      }
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-neutral-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-4xl mx-auto py-12 px-6">
        <div className="w-full space-y-8">
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-neutral-50">
            Search Games
          </h1>

          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for games..."
              className="flex-1 px-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-black dark:text-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm"
            />
              <button
                type="submit"
                disabled={hydrated ? !!(loading || query.trim().length < 2) : true}
              className="px-6 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>

          {error && (
            <p className="text-red-400 text-sm bg-red-950/30 border border-red-800 rounded-md px-4 py-2">
              {error}
            </p>
          )}

          {!user && !authLoading && (
            <p className="text-neutral-500 text-sm">
              Sign in to add games to your wishlist.{" "}
              <a href="/login" className="text-green-400 hover:underline">Login</a>
            </p>
          )}

          {loading && results.length === 0 && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 animate-pulse">
                  <div className="w-16 h-20 bg-neutral-300 dark:bg-neutral-700 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-neutral-300 dark:bg-neutral-700 rounded" />
                    <div className="h-3 w-1/2 bg-neutral-300 dark:bg-neutral-700 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-neutral-500">{results.length} results found</p>
              {results.map(game => (
                <div
                  key={game.gameID}
                  className="flex items-center gap-4 p-4 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-green-600/50 transition-colors"
                >
                  <img
                    src={game.thumb || "/placeholder-game.png"}
                    alt={game.title}
                    className="w-16 h-20 object-cover rounded-md bg-neutral-800"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='80'%3E%3Crect fill='%23333' width='64' height='80'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666'%3EGame%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-black dark:text-neutral-50 truncate">
                      {game.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleAddToWishlist(game)}
                    disabled={addingId === game.gameID || !user}
                    className="px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {addingId === game.gameID ? "Adding..." : "+ Wishlist"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {!loading && results.length === 0 && query.trim().length >= 2 && !error && (
            <p className="text-neutral-500 text-sm text-center py-8">
              No games found. Try a different search term.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
