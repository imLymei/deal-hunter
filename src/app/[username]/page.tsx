"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useUser } from "@/app/context/UserContext";
import {
  getWishlist,
  removeFromWishlist,
  updateWishlistNotes,
  updateWishlistVisibility,
  type WishlistItem,
} from "@/lib/api";
import {
  getGameDetails,
  formatPrice,
  formatDate,
  type GameDetails,
} from "@/lib/api";

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

  const loadPricesForItems = useCallback(
    async (wishlistItems: WishlistItem[]) => {
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
        }),
      );
      setGamePrices(prices);
    },
    [],
  );

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
      const message =
        err instanceof Error ? err.message : "Failed to load wishlist";
      if ((err as Error & { status?: number })?.status !== 401) {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [loadPricesForItems]);

  const loadPublicWishlist = useCallback(
    async (targetUsername: string) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `http://localhost:5000/api/wishlist/user/${encodeURIComponent(targetUsername)}`,
        );
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
        const message =
          err instanceof Error ? err.message : "Failed to load wishlist";
        setError(message);
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [loadPricesForItems],
  );

  useEffect(() => {
    if (!username || authLoading) return;

    if (isOwner) {
      loadOwnWishlist();
    } else {
      loadPublicWishlist(username);
    }
  }, [
    username,
    user,
    authLoading,
    isOwner,
    loadOwnWishlist,
    loadPublicWishlist,
  ]);

  const handleRemove = async (id: number) => {
    setRemovingId(id);
    try {
      await removeFromWishlist(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
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
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, notes: editNotes } : item,
        ),
      );
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
      const message =
        err instanceof Error ? err.message : "Failed to update visibility";
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
    <div className="flex flex-1 flex-col bg-neutral-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-6 py-12">
        {error && !loading && items.length === 0 ? (
          <div className="space-y-4 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-black dark:text-neutral-50">
              {displayName}&apos;s Wishlist
            </h1>
            <p className="rounded-md border border-red-800 bg-red-950/30 px-4 py-2 text-sm text-red-400">
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
                  className={`cursor-pointer rounded-md px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${
                    user.wishlist_public
                      ? "border border-neutral-300 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {visibilityLoading
                    ? "Updating..."
                    : user.wishlist_public
                      ? "Make Private"
                      : "Make Public"}
                </button>
              )}
            </div>

            {error && (
              <p className="rounded-md border border-red-800 bg-red-950/30 px-4 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            {loading && items.length === 0 && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex animate-pulse items-center gap-4 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
                  >
                    <div className="h-20 w-16 rounded bg-neutral-300 dark:bg-neutral-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-neutral-300 dark:bg-neutral-700" />
                      <div className="h-3 w-1/2 rounded bg-neutral-300 dark:bg-neutral-700" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {items.length === 0 && !loading && (
              <div className="space-y-4 py-16 text-center">
                <p className="text-sm text-neutral-500">
                  {displayName}&apos;s wishlist is empty.
                </p>
                {isOwner && (
                  <Link
                    href="/search"
                    className="inline-block cursor-pointer rounded-md bg-green-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                  >
                    Search Games
                  </Link>
                )}
              </div>
            )}

            {items.length > 0 && (
              <div className="space-y-3">
                {!isOwner && user?.wishlist_public === false && (
                  <p className="text-xs text-neutral-500 italic">
                    Viewing public wishlist of {displayName}
                  </p>
                )}
                {items.map((item) => {
                  const prices = gamePrices[item.cheapshark_id];
                  const currentPrice = prices?.cheapestActiveDeal
                    ? formatPrice(prices.cheapestActiveDeal.price)
                    : null;
                  const everPrice =
                    prices?.cheapestPriceEver &&
                    prices.cheapestPriceEver.price !== "0"
                      ? formatPrice(prices.cheapestPriceEver.price)
                      : null;
                  const everDate = prices?.cheapestPriceEver?.date
                    ? formatDate(prices.cheapestPriceEver.date)
                    : null;

                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
                    >
                      <img
                        src={item.thumb || "/placeholder-game.png"}
                        alt={item.title}
                        className="h-20 w-16 flex-shrink-0 rounded-md bg-neutral-800 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='80'%3E%3Crect fill='%23333' width='64' height='80'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666'%3EGame%3C/text%3E%3C/svg%3E";
                        }}
                      />
                      <div className="min-w-0 flex-1 space-y-2">
                        <h3 className="truncate text-sm font-medium text-black dark:text-neutral-50">
                          {item.title}
                        </h3>

                        {(currentPrice || everPrice) && (
                          <div className="flex items-center gap-4">
                            {currentPrice ? (
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                  {currentPrice}
                                </span>
                                <span className="-mt-1 text-xs font-medium text-green-700 dark:text-green-500">
                                  Cheapest Deal Now
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-neutral-400 dark:text-neutral-500">
                                No active deals
                              </span>
                            )}
                            {everPrice && (
                              <div
                                className="flex items-center gap-2"
                                title={`All-time low on ${everDate}`}
                              >
                                <span className="text-sm text-neutral-400 line-through dark:text-neutral-500">
                                  {everPrice}
                                </span>
                                <span className="-mt-1 text-xs text-neutral-500">
                                  All-Time Low
                                </span>
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
                              className="w-full resize-none rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-black placeholder-neutral-400 focus:ring-2 focus:ring-green-600 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveNotes(item.id)}
                                className="cursor-pointer rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-green-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {item.notes && (
                              <p className="text-xs text-neutral-500 italic">
                                {item.notes}
                              </p>
                            )}
                            <div className="flex gap-2">
                              {isOwner && (
                                <button
                                  onClick={() => handleStartEdit(item)}
                                  className="cursor-pointer text-xs text-neutral-500 transition-colors hover:text-neutral-300"
                                >
                                  Edit notes
                                </button>
                              )}
                            </div>
                          </>
                        )}

                        {!editingId && (
                          <p className="text-xs text-neutral-600 dark:text-neutral-500">
                            Added{" "}
                            {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {isOwner && (
                        <button
                          onClick={() => handleRemove(item.id)}
                          disabled={removingId === item.id}
                          className="flex-shrink-0 cursor-pointer rounded-md border border-red-800 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-950/50 disabled:opacity-50"
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
