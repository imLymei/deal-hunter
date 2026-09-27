"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useUser } from "@/app/context/UserContext";
import { getWishlist, removeFromWishlist, updateWishlistNotes, updateWishlistVisibility, type WishlistItem } from "@/lib/api";
import { getGameDetails, formatPrice, formatDate, type GameDetails } from "@/lib/api";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function UsernamePage({ params }: PageProps) {
  const { user, loading: authLoading, refreshUser } = useUser();
  const [username, setUsername] = useState<string | null>(null);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [visibilityLoading, setVisibilityLoading] = useState(false);
  const [gamePrices, setGamePrices] = useState<Record<string, GameDetails>>({});

  useEffect(() => {
    params.then((p) => setUsername(p.username));
  }, [params]);

  const isOwner = user?.username === username;

  const loadPricesForItems = useCallback(async (wishlistItems: WishlistItem[]) => {
    const prices: Record<string, GameDetails> = {};
    await Promise.all(
      wishlistItems.map(async (item) => {
        try {
          const details = await getGameDetails(item.cheapshark_id);
          if (details) {
            prices[item.cheapshark_id] = details;
          }
        } catch {
          // ignore price fetch errors
        }
      })
    );
    setGamePrices(prices);
  }, []);

  const loadOwnWishlist = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getWishlist();
      setItems(data.items);
      if (data.items.length > 0) {
        loadPricesForItems(data.items);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load wishlist";
      if ((err as Error & { status?: number })?.status !== 401) {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [loadPricesForItems]);

  const loadPublicWishlist = useCallback(async (targetUsername: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`http://localhost:5000/api/wishlist/user/${encodeURIComponent(targetUsername)}`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setError("This wishlist is private");
        } else if (res.status === 404) {
          setError("User not found");
        } else {
          setError(data?.error || "Failed to load wishlist");
        }
        setItems([]);
      } else {
        setItems(data.items || []);
        if (data.items && data.items.length > 0) {
          loadPricesForItems(data.items);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load wishlist";
      setError(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [loadPricesForItems]);

  useEffect(() => {
    if (!username || authLoading) return;

    if (isOwner) {
      loadOwnWishlist();
    } else {
      loadPublicWishlist(username);
    }
  }, [username, user, authLoading, isOwner, loadOwnWishlist, loadPublicWishlist]);

  const handleRemove = async (id: number) => {
    setRemovingId(id);
    try {
      await removeFromWishlist(id);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove";
      setError(message);
    } finally {
      setRemovingId(null);
    }
  };

  const handleStartEdit = (item: WishlistItem) => {
    setEditingId(item.id);
    setEditNotes(item.notes);
  };

  const handleSaveNotes = async (id: number) => {
    try {
      await updateWishlistNotes(id, editNotes);
      setItems(prev => prev.map(item => item.id === id ? { ...item, notes: editNotes } : item));
      setEditingId(null);
      setEditNotes("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update";
      setError(message);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditNotes("");
  };

  const handleToggleVisibility = async () => {
    if (!user) return;
    setVisibilityLoading(true);
    try {
      await updateWishlistVisibility(!user.wishlist_public);
      await refreshUser();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update visibility";
      setError(message);
    } finally {
      setVisibilityLoading(false);
    }
  };

  if (!username || authLoading) {
    return null;
  }

  const displayName = isOwner ? user?.username : username;

  return (
    <div className="flex flex-col flex-1 bg-neutral-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-4xl mx-auto py-12 px-6 items-center justify-center">
        {error && !loading && items.length === 0 ? (
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-black dark:text-neutral-50">{displayName}&apos;s Wishlist</h1>
            <p className="text-red-400 text-sm bg-red-950/30 border border-red-800 rounded-md px-4 py-2">
              {error}
            </p>
          </div>
        ) : (
          <div className="w-full space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tight text-black dark:text-neutral-50">
                {displayName}&apos;s Wishlist
              </h1>

              {isOwner && user && (
                <button
                  onClick={handleToggleVisibility}
                  disabled={visibilityLoading}
                  className={`px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                    user.wishlist_public
                      ? "border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {visibilityLoading ? "Updating..." : user.wishlist_public ? "Make Private" : "Make Public"}
                </button>
              )}
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-950/30 border border-red-800 rounded-md px-4 py-2">
                {error}
              </p>
            )}

            {loading && items.length === 0 && (
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

            {items.length === 0 && !loading && (
              <div className="text-center py-16 space-y-4">
                <p className="text-neutral-500 text-sm">{displayName}&apos;s wishlist is empty.</p>
                {isOwner && (
                  <Link
                    href="/search"
                    className="inline-block px-6 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors cursor-pointer"
                  >
                    Search Games
                  </Link>
                )}
              </div>
            )}

            {items.length > 0 && (
              <div className="space-y-3">
                {!isOwner && user?.wishlist_public === false && (
                  <p className="text-xs text-neutral-500 italic">Viewing public wishlist of {displayName}</p>
                )}
                {items.map(item => {
                  const prices = gamePrices[item.cheapshark_id];
                  const currentPrice = prices?.cheapestActiveDeal ? formatPrice(prices.cheapestActiveDeal.price) : null;
                  const everPrice = prices?.cheapestPriceEver && prices.cheapestPriceEver.price !== "0" 
                    ? formatPrice(prices.cheapestPriceEver.price) 
                    : null;
                  const everDate = prices?.cheapestPriceEver?.date ? formatDate(prices.cheapestPriceEver.date) : null;

                  return (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 p-4 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950"
                  >
                    <img
                      src={item.thumb || "/placeholder-game.png"}
                      alt={item.title}
                      className="w-16 h-20 object-cover rounded-md bg-neutral-800 flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='80'%3E%3Crect fill='%23333' width='64' height='80'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666'%3EGame%3C/text%3E%3C/svg%3E";
                      }}
                    />
                    <div className="flex-1 min-w-0 space-y-2">
                      <h3 className="text-sm font-medium text-black dark:text-neutral-50 truncate">
                        {item.title}
                      </h3>

                      {(currentPrice || everPrice) && (
                        <div className="flex items-center gap-4">
                          {currentPrice ? (
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                {currentPrice}
                              </span>
                              <span className="text-xs text-green-700 dark:text-green-500 font-medium -mt-1">
                                Cheapest Deal Now
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-neutral-400 dark:text-neutral-500">
                              No active deals
                            </span>
                          )}
                          {everPrice && (
                            <div className="flex items-center gap-2" title={`All-time low on ${everDate}`}>
                              <span className="text-sm text-neutral-400 dark:text-neutral-500 line-through">
                                {everPrice}
                              </span>
                              <span className="text-xs text-neutral-500 -mt-1">All-Time Low</span>
                            </div>
                          )}
                        </div>
                      )}

                      {isOwner && editingId === item.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Add notes..."
                            rows={2}
                            maxLength={500}
                            className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-black dark:text-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveNotes(item.id)}
                              className="px-3 py-1 rounded-md bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {item.notes && (
                            <p className="text-xs text-neutral-500 italic">{item.notes}</p>
                          )}
                          <div className="flex gap-2">
                            <a
                              href={`https://www.cheapshark.com/game/${item.cheapshark_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-green-400 hover:underline cursor-pointer"
                            >
                              View on CheapShark
                            </a>
                            {isOwner && (
                              <button
                                onClick={() => handleStartEdit(item)}
                                className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                              >
                                Edit notes
                              </button>
                            )}
                          </div>
                        </>
                      )}

                      {!editingId && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-500">
                          Added {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {isOwner && (
                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={removingId === item.id}
                        className="px-3 py-1.5 rounded-md border border-red-800 text-red-400 text-xs font-medium hover:bg-red-950/50 transition-colors cursor-pointer disabled:opacity-50 flex-shrink-0"
                      >
                        {removingId === item.id ? "Removing..." : "Remove"}
                      </button>
                    )}
                  </div>
                );
              })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
