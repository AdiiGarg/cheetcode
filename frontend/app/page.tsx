'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSession, signIn, signOut } from 'next-auth/react';
import Editor from '@monaco-editor/react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

type TabType = 'explanation' | 'complexity' | 'approaches' | 'next';

type BetterApproach = {
  title: string;
  description: string;
  code: string;
  timeComplexity: string;
  spaceComplexity: string;
};

type AnalysisSections = {
  explanation: string;
  timeComplexity: string;
  spaceComplexity: string;
  betterApproaches: BetterApproach[];
  nextSteps: string;
};

export default function Home() {
  const { data: session } = useSession();

  const [problem, setProblem] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('');

  const [analysis, setAnalysis] = useState<AnalysisSections | null>(null);
  const [detectedLevel, setDetectedLevel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('explanation');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const defaultCodeMap: Record<string, string> = {
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(NULL);

    // write your code here

    return 0;
}`,
    python: `def solve():
    # write your code here
    pass

if __name__ == "__main__":
    solve()`,
    java: `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) {
        // write your code here
    }
}`,
    javascript: `"use strict";

// write your code here`,
  };

  /* 🔹 Sync user */
  useEffect(() => {
    if (!session?.user?.email || !BACKEND_URL) return;

    axios.post(`${BACKEND_URL}/auth/sync`, {
      email: session.user.email,
      name: session.user.name,
    }).catch(() => {});
  }, [session]);

  /* 🔹 Analyze */
  async function analyze() {
    if (!BACKEND_URL) {
      setError('Backend URL not configured');
      return;
    }

    if (!session?.user?.email) {
      setError('Please login first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setAnalysis(null);
      setDetectedLevel(null);
      setActiveTab('explanation');

      const res = await axios.post(`${BACKEND_URL}/analyze`, {
        problem,
        code,
        email: session.user.email,
      });

      // ✅ CORRECT DATA MAPPING
      setDetectedLevel(res.data.level);
      setAnalysis(res.data.analysis);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-900 text-white p-6">
      {/* Auth */}
      <div className="flex justify-end mb-4">
        {!session ? (
          <button
            onClick={() => signIn('github')}
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

        {/* Input */}
        <div className="bg-zinc-800 p-6 rounded-xl space-y-4 mb-6">
          <select
            className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded"
            value={language}
            onChange={(e) => {
              const lang = e.target.value;
              setLanguage(lang);
              setCode(defaultCodeMap[lang] || '');
            }}
          >
            <option value="">Select Language</option>
            <option value="cpp">C++</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="javascript">JavaScript</option>
          </select>

          <textarea
            className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded"
            rows={4}
            placeholder="Paste problem statement / link / question number"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
          />

          {language && (
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
              <p className="text-sm text-zinc-400 mb-2">
                Paste your code below or start writing here
              </p>

              <Editor
                height="300px"
                language={language === 'cpp' ? 'cpp' : language}
                theme="vs-dark"
                value={code}
                onChange={(v) => setCode(v || '')}
                options={{
                  tabSize: 4,
                  insertSpaces: true,
                  detectIndentation: false,
                  fontSize: 14,
                  minimap: { enabled: false },
                  wordWrap: 'on',
                }}
              />
            </div>
          )}

          <button
            onClick={analyze}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 transition p-3 rounded font-semibold"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 p-4 rounded mb-4">
            {error}
          </div>
        )}

        {/* Difficulty */}
        {detectedLevel && (
          <div className="mb-4 inline-block px-4 py-1 rounded bg-zinc-800 border border-zinc-700">
            Detected Difficulty:{' '}
            <span className="font-semibold text-emerald-400 uppercase">
              {detectedLevel}
            </span>
          </div>
        )}

        {/* Analysis */}
        {analysis && (
          <div className="bg-zinc-800 p-6 rounded-xl">
            <div className="flex gap-2 mb-4">
              {(['explanation', 'complexity', 'approaches', 'next'] as TabType[])
                .map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded text-sm ${
                      activeTab === tab
                        ? 'bg-emerald-600'
                        : 'bg-zinc-700 hover:bg-zinc-600'
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
            </div>

            <div className="bg-zinc-900 p-4 rounded text-sm whitespace-pre-wrap">
              {activeTab === 'explanation' && analysis.explanation}

              {activeTab === 'complexity' && (
                <>
                  <p><b>Time:</b> {analysis.timeComplexity}</p>
                  <p><b>Space:</b> {analysis.spaceComplexity}</p>
                </>
              )}

              {activeTab === 'approaches' &&
                analysis.betterApproaches.map((a, i) => (
                  <div key={i} className="mb-4">
                    <p className="font-semibold">{a.title}</p>
                    <p>{a.description}</p>
                    <pre className="bg-black/40 p-2 rounded mt-2">
{a.code}
                    </pre>
                    <p className="text-xs text-zinc-400">
                      TC: {a.timeComplexity} | SC: {a.spaceComplexity}
                    </p>
                  </div>
                ))}

              {activeTab === 'next' && analysis.nextSteps}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
