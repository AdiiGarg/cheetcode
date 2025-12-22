'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/* ---------------- TYPES ---------------- */

type Submission = {
  id: string;
  title: string;
  level: 'easy' | 'medium' | 'hard';
  createdAt: string;
};

/* ---------------- HELPERS ---------------- */

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  const intervals: [number, string][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.345, 'week'],
    [12, 'month'],
    [Infinity, 'year'],
  ];

  let counter = seconds;
  for (const [limit, label] of intervals) {
    if (counter < limit) {
      return `${Math.floor(counter)} ${label}${counter >= 2 ? 's' : ''} ago`;
    }
    counter /= limit;
  }
}

/* ---------------- PAGE ---------------- */

export default function MySubmissionsPage() {
  const { data: session, status } = useSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return;

    axios
      .get(`${BACKEND_URL}/analyze/my-submissions`, {
        params: { email: session.user.email },
      })
      .then(res => setSubmissions(res.data))
      .catch(console.error);
  }, [session, status]);

  return (
    <main className="min-h-screen landing-bg text-white px-6 pt-32 pb-20">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <div>
          <h1 className="text-4xl font-bold">My Submissions</h1>
          <p className="text-zinc-400 mt-1">
            Click any submission to view full details
          </p>
        </div>

        {/* EMPTY STATE */}
        {submissions.length === 0 && (
          <div className="text-zinc-400">
            No submissions found yet.
          </div>
        )}

        {/* LIST */}
        <div className="space-y-4">
          {submissions.map(sub => {
            const isOpen = openId === sub.id;

            return (
              <div
                key={sub.id}
                onClick={() => setOpenId(isOpen ? null : sub.id)}
                className="
                  bg-zinc-900/70
                  backdrop-blur
                  border border-zinc-800
                  rounded-xl
                  p-5
                  cursor-pointer
                  transition
                  hover:border-emerald-500/40
                  hover:shadow-[0_0_30px_rgba(16,185,129,0.12)]
                "
              >
                {/* TOP ROW */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="text-sm text-zinc-400">
                      {timeAgo(sub.createdAt)}
                    </p>

                    <h3 className="text-lg font-semibold mt-1 line-clamp-2">
                      {sub.title}
                    </h3>
                  </div>

                  <DifficultyBadge level={sub.level} />
                </div>

                {/* EXPANDED CONTENT */}
                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-zinc-800 text-sm text-zinc-300 leading-relaxed">
                    <p>
                      This submission was analyzed by AI.  
                      You can revisit this problem, re-solve it, or compare
                      your approach with optimized techniques.
                    </p>

                    <p className="mt-3 text-emerald-400 font-medium">
                      💡 Tip: Try solving this again without looking at hints.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

/* ---------------- COMPONENTS ---------------- */

function DifficultyBadge({ level }: { level: string }) {
  const map: any = {
    easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    medium: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    hard: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border ${map[level]}`}
    >
      {level.toUpperCase()}
    </span>
  );
}
