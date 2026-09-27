const API_BASE = "http://localhost:5000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const defaultHeaders: Record<string, string> = {};

  if (options?.body && typeof options.body === "string") {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...defaultHeaders,
      ...(options?.headers as Record<string, string>),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data?.error || data?.errors?.join(", ") || "Request failed") as Error & { status: number };
    error.status = res.status;
    throw error;
  }

  return data;
}

const priceCache = new Map<string, Promise<GameDetails | null>>();

export interface GameDetails {
  info?: {
    title?: string;
    steamAppID?: string;
    thumb?: string;
  };
  cheapestActiveDeal?: {
    storeID: string;
    dealID: string;
    price: string;
    retailPrice: string;
    savings: string;
  } | null;
  cheapestPriceEver?: {
    price: string;
    date: number;
  } | null;
}

export async function getGameDetails(cheapsharkId: string): Promise<GameDetails | null> {
  if (priceCache.has(cheapsharkId)) {
    return priceCache.get(cheapsharkId)!;
  }

  const promise = request<GameDetails>(`/wishlist/game/${encodeURIComponent(cheapsharkId)}`)
    .then(result => result)
    .catch(() => null);

  priceCache.set(cheapsharkId, promise);
  return promise;
}

export function formatPrice(price: string | undefined): string {
  if (!price || price === "0") return "";
  try {
    const num = parseFloat(price);
    if (isNaN(num)) return "";
    return `$${num.toFixed(2)}`;
  } catch {
    return "";
  }
}

export function formatLowestPrice(details: GameDetails | null): { current: string; ever: string } {
  if (!details) return { current: "", ever: "" };

  let current = "";
  if (details.cheapestActiveDeal?.price) {
    current = formatPrice(details.cheapestActiveDeal.price);
  }

  let ever = "";
  if (details.cheapestPriceEver?.price && details.cheapestPriceEver.price !== "0") {
    ever = formatPrice(details.cheapestPriceEver.price);
  }

  return { current, ever };
}

export function formatDate(timestamp: number | undefined): string {
  if (!timestamp) return "";
  try {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export async function searchGames(q: string) {
  return request<{ games: Array<{ gameID: string; title: string; thumb: string }> }>(`/wishlist/search?q=${encodeURIComponent(q)}`);
}

export async function getWishlist() {
  return request<{ items: WishlistItem[] }>("/wishlist");
}

export interface WishlistItem {
  id: number;
  cheapshark_id: string;
  title: string;
  thumb: string;
  notes: string;
  created_at: string;
}

export async function addToWishlist(gameID: string, title: string, thumb: string, notes?: string) {
  return request<{ message: string; item: WishlistItem }>("/wishlist", {
    method: "POST",
    body: JSON.stringify({ cheapshark_id: gameID, title, thumb, notes: notes || "" }),
  });
}

export async function removeFromWishlist(itemID: number) {
  return request<{ message: string }>(`/wishlist/${itemID}`, { method: "DELETE" });
}

export async function updateWishlistNotes(itemID: number, notes: string) {
  return request<{ message: string; item: WishlistItem }>(`/wishlist/${itemID}`, {
    method: "PUT",
    body: JSON.stringify({ notes }),
  });
}

export async function updateWishlistVisibility(publicVal: boolean) {
  return request<{ message: string; wishlist_public: boolean }>("/wishlist/visibility", {
    method: "PUT",
    body: JSON.stringify({ public: publicVal }),
  });
}

export interface PublicWishlistResponse {
  username: string;
  items: WishlistItem[];
}

export async function getPublicWishlist(username: string) {
  return request<PublicWishlistResponse>(`/user/${username}`);
}
