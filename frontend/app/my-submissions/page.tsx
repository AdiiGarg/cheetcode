'use client';

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import axios from "axios";

type Submission = {
  id: string;
  problem: string;
  level: string;
  analysis: string;
  createdAt: string;
};

export default function MySubmissionsPage() {
  const { data: session, status } = useSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.email) return;

    setLoading(true);

    axios
      .get(
        `http://localhost:3001/analyze/my-submissions?email=${session.user.email}`
      )
      .then((res) => setSubmissions(res.data))
      .catch((err) =>
        console.error("Failed to fetch submissions", err)
      )
      .finally(() => setLoading(false));
  }, [session, status]);

  return (
    <main className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          My Submissions
        </h1>

        {status === "loading" && (
          <p className="text-zinc-400">Loading session...</p>
        )}

        {status === "unauthenticated" && (
          <p className="text-red-400">
            Please login to view submissions
          </p>
        )}

        {status === "authenticated" && loading && (
          <p className="text-zinc-400">Loading submissions...</p>
        )}

        {status === "authenticated" && submissions.length === 0 && (
          <p className="text-zinc-400">
            No submissions yet.
          </p>
        )}

        <div className="space-y-4">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 cursor-pointer"
              onClick={() =>
                setOpenId(openId === sub.id ? null : sub.id)
              }
            >
              <p className="text-sm text-zinc-400">
                {new Date(sub.createdAt).toLocaleString()}
              </p>

              <p className="mt-1 font-semibold">
                Level:{" "}
                <span className="text-emerald-400">
                  {sub.level}
                </span>
              </p>

              <p className="mt-2 text-zinc-300 line-clamp-2">
                {sub.problem}
              </p>

              {openId === sub.id && (
                <div className="mt-4 bg-zinc-900 p-3 rounded text-sm whitespace-pre-wrap text-zinc-200">
                  {sub.analysis}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
