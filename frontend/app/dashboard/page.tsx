'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
} from 'recharts';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

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

  // ================= FETCH DASHBOARD DATA =================
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return;

    const email = session.user.email;
    setLoading(true);

    // 📊 Stats
    axios
      .get(`${BACKEND_URL}/analyze/stats`, { params: { email } })
      .then((res) => setStats(res.data))
      .catch((err) => console.error('Stats error:', err))
      .finally(() => setLoading(false));

    // 🤖 AI Recommendations
    axios
      .get(`${BACKEND_URL}/analyze/recommendations`, {
        params: { email },
      })
      .then((res) => setRecommendations(res.data))
      .catch((err) =>
        console.warn('Recommendations unavailable:', err?.message)
      );
  }, [session, status]);

  const pieData = [
    { name: 'Easy', value: stats.easy },
    { name: 'Medium', value: stats.medium },
    { name: 'Hard', value: stats.hard },
  ];

  return (
    <main className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        {/* SESSION STATES */}
        {status === 'loading' && (
          <p className="text-zinc-400">Loading session...</p>
        )}

        {status === 'unauthenticated' && (
          <p className="text-red-400">Please login to view dashboard</p>
        )}

        {status === 'authenticated' && loading && (
          <p className="text-zinc-400">Loading stats...</p>
        )}

        {/* STATS CARDS */}
        {status === 'authenticated' && !loading && stats.total > 0 && (
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            
              {/* Difficulty Breakdown */}
              <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Difficulty Breakdown
                </h2>
                    
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Easy', value: stats.easy },
                        { name: 'Medium', value: stats.medium },
                        { name: 'Hard', value: stats.hard },
                      ]}
                      dataKey="value"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                    >
                      {['#34d399', '#60a5fa', '#f87171'].map((color, i) => (
                        <Cell key={i} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

    {/* Problems Solved */}
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4">
        Problems Solved
      </h2>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={[{ name: 'Solved', value: stats.total }]}>
          <XAxis dataKey="name" />
          <Tooltip />
          <Bar dataKey="value" fill="#34d399" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
)}


        {/* AI RECOMMENDATIONS */}
        {status === 'authenticated' && recommendations && (
          <div className="mt-8 bg-zinc-800 border border-zinc-700 rounded-xl p-6">
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

/* ================= REUSABLE CARD ================= */
function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
      <p className="text-zinc-400 text-sm">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
