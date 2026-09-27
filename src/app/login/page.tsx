"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { refreshUser } = useUser();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        await refreshUser();
        router.push("/");
      } else {
        const data = await res.json();
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Could not connect to server");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 p-8 rounded-lg bg-neutral-900 border border-neutral-800">
        <h1 className="text-2xl font-bold text-center text-neutral-100">Login</h1>

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-1 text-neutral-300">
            Username or Email
          </label>
          <input
            id="username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm bg-neutral-800 border-neutral-700 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1 text-neutral-300">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm bg-neutral-800 border-neutral-700 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded-md hover:bg-neutral-800 transition-colors text-sm font-medium cursor-pointer"
        >
          Login
        </button>

        <p className="text-center text-sm text-neutral-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-green-400 underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
