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
