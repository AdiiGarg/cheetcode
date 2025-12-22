'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
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

  /* UI STATES */
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
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
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return list;
  }, [submissions, search, difficulty, sort]);

  return (
    <main className="min-h-screen landing-bg text-white px-6 pt-32 pb-24">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* HEADER */}
        <header>
          <h1 className="text-4xl font-bold tracking-tight">My Submissions</h1>
          <p className="text-zinc-400 mt-2">
            Search, filter and revisit your analyzed problems
          </p>
        </header>

        {/* CONTROLS */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">

          {/* SEARCH */}
          <input
            placeholder="Search by problem title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-zinc-900/70 border border-zinc-800 rounded-lg px-4 py-2 text-sm w-full md:w-80"
          />

          {/* FILTERS */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'easy', 'medium', 'hard'].map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d as any)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition
                  ${difficulty === d
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}
                `}
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
            <p className="text-zinc-300">
              No submissions found.
            </p>
          </div>
        )}

        {/* LIST */}
        <section className="grid gap-6">
          {filtered.map(sub => (
            <SubmissionCard key={sub._id} sub={sub} />
          ))}
        </section>
      </div>
    </main>
  );
}

/* ---------------- CARD ---------------- */

function SubmissionCard({ sub }: { sub: Submission }) {
  const levelColor = {
    easy: 'text-emerald-400',
    medium: 'text-blue-400',
    hard: 'text-rose-400',
  };

  return (
    <div className="
      bg-zinc-900/70 backdrop-blur-xl
      border border-zinc-800
      rounded-2xl p-6
      hover:translate-y-[-2px]
      hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)]
      transition
    ">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-zinc-400">
          {new Date(sub.createdAt).toLocaleString()}
        </span>
        <span className={`text-xs font-semibold uppercase ${levelColor[sub.level]}`}>
          {sub.level}
        </span>
      </div>

      <h3 className="text-lg font-semibold mb-2 line-clamp-2">
        {sub.title}
      </h3>

      <p className="text-sm text-zinc-300 line-clamp-3 leading-relaxed">
        {cleanText(sub.problem)}
      </p>
    </div>
  );
}

/* ---------------- UTIL ---------------- */

function cleanText(text: string) {
  return text
    .replace(/<[^>]*>?/gm, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}
