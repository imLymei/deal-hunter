"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/app/context/UserContext";

export default function WishlistPage() {
  const { user, loading: authLoading } = useUser();

  useEffect(() => {
    if (!authLoading && user) {
      window.location.href = `/${user.username}`;
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="flex flex-col flex-1 bg-neutral-50 font-sans dark:bg-black">
        <main className="flex flex-1 w-full max-w-4xl mx-auto py-12 px-6 items-center justify-center">
          <p className="text-sm text-neutral-500">Loading...</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col flex-1 bg-neutral-50 font-sans dark:bg-black">
        <main className="flex flex-1 w-full max-w-4xl mx-auto py-12 px-6 items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-black dark:text-neutral-50">Sign in required</h1>
            <p className="text-sm text-neutral-500">
              Please sign in to view your wishlist.{" "}
               <Link href="/login" className="text-green-400 hover:underline">Login</Link>
            </p>
          </div>
        </main>
      </div>
    );
  }

  return null;
}
