'use client';

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        
        {/* Logo */}
        <Link href="/">
        <img src="/logo.png" alt="CheetCode" className="h-9" />
        <span className="text-xl font-bold">CheetCode</span>
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Loading */}
          {status === "loading" && (
            <span className="text-zinc-400 text-sm">Loading...</span>
          )}

          {/* Logged out */}
          {status === "unauthenticated" && (
            <button
              onClick={() => signIn("github")}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded text-sm font-semibold"
            >
              Login with GitHub
            </button>
          )}

          {/* Logged in */}
          {status === "authenticated" && session?.user && (
            <>
              <Link
                href="/dashboard"
                className="text-zinc-300 hover:text-white text-sm"
              >
                Dashboard
              </Link>

              <Link
                href="/my-submissions"
                className="text-zinc-300 hover:text-white text-sm"
              >
                My Submissions
              </Link>

              {/* GitHub Avatar */}
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt="avatar"
                  className="w-8 h-8 rounded-full border border-zinc-700"
                />
              )}

              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
