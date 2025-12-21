'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// 🔥 SSR OFF FOR CHARTS
const DashboardCharts = dynamic(
  () => import('../components/DashboardCharts'),
  { ssr: false }
);

export default function DashboardPage() {
  const { data: session, status } = useSession();

  const [stats, setStats] = useState({
    total: 0,
    easy: 0,
    medium: 0,
    hard: 0,
  });

  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return;

    const email = session.user.email;
    setLoading(true);

    axios
      .get(`${BACKEND_URL}/analyze/stats`, { params: { email } })
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));

    axios
      .get(`${BACKEND_URL}/analyze/recommendations`, {
        params: { email },
      })
      .then((res) => {
        setRecommendations(res.data.result); // 🔥 FIX
      })
      .catch(() =>
        console.warn('Recommendations unavailable')
      );
  }, [session, status]);

  return (
    <main className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        {status === 'loading' && (
          <p className="text-zinc-400">Loading session...</p>
        )}

        {status === 'unauthenticated' && (
          <p className="text-red-400">
            Please login to view dashboard
          </p>
        )}

        {status === 'authenticated' && loading && (
          <p className="text-zinc-400">Loading stats...</p>
        )}

        {status === 'authenticated' && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Solved" value={stats.total} />
            <StatCard title="Beginner" value={stats.easy} />
            <StatCard title="Intermediate" value={stats.medium} />
            <StatCard title="Advanced" value={stats.hard} />
          </div>
        )}

        {/* 🔥 CLIENT-ONLY CHARTS */}
        {status === 'authenticated' && !loading && stats.total > 0 && (
          <DashboardCharts stats={stats} />
        )}

        {status === 'authenticated' && recommendations && (
          <div className="mt-10 bg-zinc-800 border border-zinc-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-3">
              AI Recommendations
            </h2>
            <div className="whitespace-pre-wrap text-zinc-200 text-sm">
              {recommendations}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
      <p className="text-zinc-400 text-sm">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
