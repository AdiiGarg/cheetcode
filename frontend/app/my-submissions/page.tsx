'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/* ---------------- TYPES ---------------- */

type Submission = {
  _id: string;
  createdAt: string;
  level: 'easy' | 'medium' | 'hard';
  title: string;
};

/* ---------------- TIME HELPER ---------------- */

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ---------------- PAGE ---------------- */

export default function MySubmissionsPage() {
  const { data: session, status } = useSession();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* UI */
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] =
    useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [sort, setSort] = useState<'latest' | 'oldest'>('latest');

  /* FETCH */
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return;

    setLoading(true);
    axios
      .get(`${BACKEND_URL}/analyze/my-submissions`, {
        params: { email: session.user.email },
      })
      .then(res => setSubmissions(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session, status]);

  /* FILTER + SEARCH + SORT */
  const filtered = useMemo(() => {
    let list = [...submissions];

    if (difficulty !== 'all') {
      list = list.filter(s => s.level === difficulty);
    }

    if (search.trim()) {
      list = list.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    list.sort((a, b) =>
      sort === 'latest'
        ? +new Date(b.createdAt) - +new Date(a.createdAt)
        : +new Date(a.createdAt) - +new Date(b.createdAt)
    );

    return list;
  }, [submissions, search, difficulty, sort]);

  return (
    <main className="min-h-screen landing-bg text-white px-6 pt-32 pb-24">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* HEADER */}
        <header>
          <h1 className="text-4xl font-bold">My Submissions</h1>
          <p className="text-zinc-400 mt-2">
            Revisit, improve and re-analyze your problems
          </p>
        </header>

        {/* CONTROLS */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <input
            placeholder="Search by problem title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-zinc-900/70 border border-zinc-800 rounded-lg px-4 py-2 text-sm w-full md:w-80"
          />

          <div className="flex gap-2 flex-wrap items-center">
            {['all', 'easy', 'medium', 'hard'].map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d as any)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition
                  ${
                    difficulty === d
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
              >
                {d.toUpperCase()}
              </button>
            ))}

            <select
              value={sort}
              onChange={e => setSort(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1 text-xs"
            >
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>

        {/* STATES */}
        {loading && <p className="text-zinc-400">Loading submissions...</p>}

        {!loading && filtered.length === 0 && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-8 text-center">
            <p className="text-zinc-300">No submissions found.</p>
          </div>
        )}

        {/* LIST */}
        <section className="space-y-5">
          {filtered.map(sub => (
            <SubmissionCard
              key={sub._id}
              sub={sub}
              open={openId === sub._id}
              onToggle={() =>
                setOpenId(openId === sub._id ? null : sub._id)
              }
            />
          ))}
        </section>
      </div>
    </main>
  );
}

/* ---------------- CARD ---------------- */

function SubmissionCard({
  sub,
  open,
  onToggle,
}: {
  sub: Submission;
  open: boolean;
  onToggle: () => void;
}) {
  const color = {
    easy: 'text-emerald-400',
    medium: 'text-blue-400',
    hard: 'text-rose-400',
  };

  return (
    <div
      onClick={onToggle}
      className="
        bg-zinc-900/70 backdrop-blur-xl
        border border-zinc-800 rounded-2xl p-6
        transition cursor-pointer
        hover:border-emerald-500/40
      "
    >
      {/* TOP */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-zinc-400">
            {timeAgo(sub.createdAt)}
          </p>
          <h3 className="text-lg font-semibold mt-1">
            {sub.title}
          </h3>
        </div>

        <span className={`text-xs font-semibold uppercase ${color[sub.level]}`}>
          {sub.level}
        </span>
      </div>

      {/* EXPANDED */}
      {open && (
        <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3 text-sm text-zinc-300">
          <p className="text-emerald-400 font-medium">
            💡 Tip
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Think in terms of optimal time & space complexity</li>
            <li>Handle edge cases before coding</li>
            <li>Prefer clean two-pointer or hash based approaches</li>
            <li>Re-solve without looking at hints</li>
          </ul>

          <button
            onClick={e => {
              e.stopPropagation();
              alert('Re-analyze coming next 🔥');
            }}
            className="mt-3 px-4 py-2 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Re-Analyze
          </button>
        </div>
      )}
    </div>
  );
}
