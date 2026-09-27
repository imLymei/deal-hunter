"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const router = useRouter();
  const { refreshUser } = useUser();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, email, password }),
      });

      if (res.ok) {
        await refreshUser();
        router.push("/");
      } else {
        const data = await res.json();
        setErrors(data.errors || [data.error || "Registration failed"]);
      }
    } catch {
      setErrors(["Could not connect to server"]);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 p-8 rounded-lg bg-neutral-900 border border-neutral-800">
        <h1 className="text-2xl font-bold text-center text-neutral-100">Register</h1>

        {errors.length > 0 && (
          <ul className="text-red-500 text-sm space-y-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        )}

        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-1 text-neutral-300">
            Username
          </label>
          <input
            id="username"
            type="text"
            required
            minLength={3}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm bg-neutral-800 border-neutral-700 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1 text-neutral-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm bg-neutral-800 border-neutral-700 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1 text-neutral-300">
            Password (min 8 characters)
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm bg-neutral-800 border-neutral-700 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded-md hover:bg-neutral-800 transition-colors text-sm font-medium cursor-pointer"
        >
          Register
        </button>

        <p className="text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link href="/login" className="text-green-400 underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
