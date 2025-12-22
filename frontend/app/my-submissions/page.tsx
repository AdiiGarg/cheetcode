'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

type Submission = {
  _id: string;
  createdAt: string;
  level: 'easy' | 'medium' | 'hard';
  title: string;
  problem: string;
};

export default function MySubmissionsPage() {
  const { data: session, status } = useSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return;

    setLoading(true);

    axios
      .get(`${BACKEND_URL}/submissions`, {
        params: { email: session.user.email },
      })
      .then(res => setSubmissions(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session, status]);

  return (
    <main className="min-h-screen landing-bg text-white px-6 pt-32 pb-24">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* HEADER */}
        <header>
          <h1 className="text-4xl font-bold tracking-tight">
            My Submissions
          </h1>
          <p className="text-zinc-400 mt-2">
            All your analyzed LeetCode problems in one place
          </p>
        </header>

        {/* LOADING */}
        {loading && (
          <p className="text-zinc-400">Loading submissions...</p>
        )}

        {/* EMPTY STATE */}
        {!loading && submissions.length === 0 && (
          <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-xl p-8 text-center">
            <p className="text-zinc-300">
              You haven’t analyzed any problems yet.
            </p>
          </div>
        )}

        {/* LIST */}
        <section className="space-y-6">
          {submissions.map(sub => (
            <SubmissionCard key={sub._id} sub={sub} />
          ))}
        </section>
      </div>
    </main>
  );
}

/* ---------------- COMPONENTS ---------------- */

function SubmissionCard({ sub }: { sub: Submission }) {
  const levelColor = {
    easy: 'text-emerald-400',
    medium: 'text-blue-400',
    hard: 'text-rose-400',
  };

  return (
    <div
      className="
        bg-zinc-900/70
        backdrop-blur-xl
        border border-zinc-800
        rounded-2xl
        p-6
        transition
        hover:translate-y-[-2px]
        hover:shadow-[0_10px_40px_rgba(0,0,0,0.4)]
      "
    >
      {/* META */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-400">
          {new Date(sub.createdAt).toLocaleString()}
        </span>

        <span
          className={`text-xs font-semibold uppercase ${levelColor[sub.level]}`}
        >
          {sub.level}
        </span>
      </div>

      {/* TITLE */}
      <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
        {sub.title}
      </h3>

      {/* DESCRIPTION */}
      <p className="text-sm text-zinc-300 leading-relaxed line-clamp-3">
        {stripHtml(sub.problem)}
      </p>
    </div>
  );
}

/* ---------------- HELPERS ---------------- */

function stripHtml(text: string) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>?/gm, '')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}
