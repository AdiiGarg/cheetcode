'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

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

  const [recommendations, setRecommendations] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return;

    const email = session.user.email;
    setLoading(true);

    axios
      .get(`${BACKEND_URL}/analyze/stats`, { params: { email } })
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));

    axios
      .get(`${BACKEND_URL}/analyze/recommendations`, { params: { email } })
      .then(res => {
        const data = res.data;
        if (typeof data === 'string') setRecommendations(data);
        else if (typeof data?.result === 'string') setRecommendations(data.result);
        else setRecommendations('');
      })
      .catch(() => setRecommendations(''));
  }, [session, status]);

  return (
    <main className="min-h-screen landing-bg text-white p-6 pt-26">
      <div className="max-w-6xl mx-auto space-y-12 backdrop-blur-sm">

        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>

        {status === 'authenticated' && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            <StatCard title="Total Submissions" value={stats.total} />
            <StatCard title="Easy" value={stats.easy} accent="emerald" />
            <StatCard title="Medium" value={stats.medium} accent="blue" />
            <StatCard title="Hard" value={stats.hard} accent="rose" />
          </div>
        )}

        {stats.total > 0 && (
          <DashboardCharts
            easy={stats.easy}
            medium={stats.medium}
            hard={stats.hard}
          />
        )}

        {/* 🤖 AI RECOMMENDATIONS */}
        {recommendations && <AIRecommendations text={recommendations} />}
      </div>
    </main>
  );
}

/* ---------------- COMPONENTS ---------------- */

function StatCard({ title, value, accent = 'zinc' }: any) {
  const map: any = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    rose: 'text-rose-400',
    zinc: 'text-white',
  };

  return (
    <div className="bg-zinc-800/70 backdrop-blur border border-zinc-700 rounded-xl p-6 hover:shadow-lg transition">
      <p className="text-zinc-400 text-sm">{title}</p>
      <p className={`text-3xl font-bold mt-2 ${map[accent]}`}>
        {value}
      </p>
    </div>
  );
}

/* ---------------- AI RECOMMENDATION PARSER ---------------- */

function AIRecommendations({ text }: { text: string }) {
  const sections = text.split('\n\n');

  return (
    <div className="bg-zinc-900/70 backdrop-blur border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl">
      <h2 className="text-xl font-semibold flex items-center gap-2 text-emerald-400">
        🤖 AI Recommendations
      </h2>

      {sections.map((block, i) => (
        <div
          key={i}
          className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm leading-relaxed"
        >
          {block}
        </div>
      ))}

      <p className="text-xs text-zinc-500">
        Generated from your recent submissions & coding patterns
      </p>
    </div>
  );
}
