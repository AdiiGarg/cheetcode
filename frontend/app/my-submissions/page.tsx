'use client';

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import axios from "axios";

export default function MySubmissionsPage() {
  const { data: session } = useSession();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.email) {
      axios
        .get(
          `http://localhost:3001/analyze/my-submissions?email=${session.user.email}`
        )
        .then((res) => {
          setSubmissions(res.data);
        })
        .catch((err) => {
          console.error("Failed to fetch submissions", err);
        });
    }
  }, [session]);

  return (
    <main className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">My Submissions</h1>

        {/* TEMP DEBUG (can remove later) */}
        {session?.user?.email ? (
          <p className="text-green-400 mb-4">
            Logged in as: {session.user.email}
          </p>
        ) : (
          <p className="text-red-400 mb-4">Not logged in</p>
        )}

        <p className="text-zinc-400">
          Your past analyzed submissions will appear here.
        </p>

        <div className="mt-6 space-y-4">
          {submissions.length === 0 ? (
            <p className="text-zinc-400">No submissions yet.</p>
          ) : (
            submissions.map((sub) => (
              <div
                key={sub.id}
                onClick={() =>
                  setOpenId(openId === sub.id ? null : sub.id)
                }
                className="bg-zinc-800 p-4 rounded border border-zinc-700 cursor-pointer"
              >
                <p className="text-sm text-zinc-400">
                  {new Date(sub.createdAt).toLocaleString()}
                </p>

                <p className="mt-2 font-semibold">
                  Level:{" "}
                  <span className="text-emerald-400">{sub.level}</span>
                </p>

                <p className="mt-1 text-zinc-300 line-clamp-2">
                  {sub.problem}
                </p>

                {/* ✅ CORRECT PLACE FOR ANALYSIS */}
                {openId === sub.id && (
                  <div className="mt-4 bg-zinc-900 p-3 rounded text-sm whitespace-pre-wrap text-zinc-200">
                    {sub.analysis}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
