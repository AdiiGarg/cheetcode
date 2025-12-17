'use client';
import { useState } from 'react';
import axios from 'axios';
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect } from "react";


export default function Home() {
    const { data: session } = useSession();
  const [problem, setProblem] = useState('');
  const [code, setCode] = useState('');
  const [level, setLevel] = useState('beginner');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
    useEffect(() => {
      if (session?.user?.email) {
        axios.post("http://localhost:3001/auth/sync", {
          email: session.user.email,
          name: session.user.name,
        });
      }
    }, [session]);


  async function analyze() {
    try {
      setLoading(true);
      setError('');
      setResult('');

      const res = await axios.post('http://localhost:3001/analyze', {
        problem,
        code,
        level,
        email: session?.user?.email,
      });

      setResult(res.data.result);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    
    <main className="min-h-screen bg-zinc-900 text-white p-6">
                <div className="flex justify-end mb-4">
          {!session ? (
            <button
              onClick={() => signIn("github")}
              className="px-4 py-2 bg-zinc-800 rounded"
            >
              Login with GitHub
            </button>
          ) : (
            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-zinc-800 rounded"
            >
              Logout
            </button>
          )}
        </div>
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">🐆 CheetCode</h1>
        <p className="text-zinc-400 mb-6">
          AI-powered coding submission analysis
        </p>

        {/* Controls */}
        <div className="bg-zinc-800 p-6 rounded-xl mb-6 space-y-4">
          <select
            className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <textarea
            className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded"
            rows={4}
            placeholder="Paste problem statement or link"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
          />

          <textarea
            className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded font-mono"
            rows={6}
            placeholder="Paste your solution code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <button
            onClick={analyze}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 transition p-3 rounded font-semibold"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {/* Result */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 p-4 rounded mb-4">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-zinc-800 p-6 rounded-xl whitespace-pre-wrap">
            <h2 className="text-xl font-semibold mb-2">Analysis</h2>
            {result}
          </div>
        )}
      </div>
    </main>
  );
}
