'use client';

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import axios from "axios";

type Stats = {
  total: number;
  beginner: number;
  intermediate: number;
  advanced: number;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 🔒 HARD GUARD — nothing runs without email
    if (status !== "authenticated" || !session?.user?.email) {
      return;
    }

    const email = session.user.email;
    setLoading(true);

    // 🔹 Fetch stats
    axios
      .get(`http://localhost:3001/analyze/stats?email=${email}`)
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Stats error", err))
      .finally(() => setLoading(false));

    // 🔹 Fetch recommendations
    axios
      .get(`http://localhost:3001/analyze/recommendations?email=${email}`)
      .then((res) => setRecommendations(res.data.result))
      .catch((err) =>
        console.error("Recommendations error", err)
      );
  }, [session, status]);

  return (
    <main className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        {status === "loading" && (
          <p className="text-zinc-400">Loading session...</p>
        )}

        {status === "unauthenticated" && (
          <p className="text-red-400">Please login to view dashboard</p>
        )}

        {status === "authenticated" && loading && (
          <p className="text-zinc-400">Loading stats...</p>
        )}

        {status === "authenticated" && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Solved" value={stats.total} />
            <StatCard title="Beginner" value={stats.beginner} />
            <StatCard title="Intermediate" value={stats.intermediate} />
            <StatCard title="Advanced" value={stats.advanced} />
          </div>
        )}

        {status === "authenticated" && recommendations && (
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

/* 🔹 Stat Card */
function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
      <p className="text-zinc-400 text-sm">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
