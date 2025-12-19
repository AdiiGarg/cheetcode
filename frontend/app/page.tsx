'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSession, signIn, signOut } from 'next-auth/react';
import Editor from "@monaco-editor/react";


const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Home() {
  const { data: session } = useSession();

  const [problem, setProblem] = useState('');
  const [code, setCode] = useState('');
  const [level, setLevel] = useState('beginner');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState("");
  const defaultCodeMap: Record<string, string> = {
  cpp: 
`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(NULL);
    // write your code here
  
    return 0;
}`,

  python:
`def solve():
    # write your code here
    pass

  if __name__ == "__main__":
      solve()`,

  java: 
`import java.io.*;
import java.util.*;
    
public class Main {
    public static void main(String[] args) {
      // write your code here
    }
}`,

  javascript: 
`"use strict";
    // write your code here
  `,
  };
  


  // 🔹 Debug: confirm backend URL is injected
  useEffect(() => {
    console.log('BACKEND_URL:', BACKEND_URL);
  }, []);

  // 🔹 Sync user with backend after login
  useEffect(() => {
    if (!session?.user?.email || !BACKEND_URL) return;

    axios
      .post(`${BACKEND_URL}/auth/sync`, {
        email: session.user.email,
        name: session.user.name,
      })
      .catch((err) => {
        console.error('Auth sync failed:', err);
      });
  }, [session]);

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
      setResult('');

      const res = await axios.post(`${BACKEND_URL}/analyze`, {
        problem,
        code,
        level,
        email: session.user.email,
      });

      setResult(res.data.result);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-900 text-white p-6">
      {/* 🔹 Auth buttons */}
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

        {/* Controls */}
        <div className="bg-zinc-800 p-6 rounded-xl mb-6 space-y-4">
          <select
            className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded"
            value={language}
            onChange={(e) => {
              const lang = e.target.value;
              setLanguage(lang);
              setCode(defaultCodeMap[lang] || "");
            }}

          >
            <option value="">Select Language</option>
            <option value="cpp">C++</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="javascript">JavaScript</option>
          </select>

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

          {language && (
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
              <p className="text-sm text-zinc-400 mb-1">
                Paste your code below or start writing here
              </p>

              <Editor
                height="300px"
                language={
                  language === "cpp"
                    ? "cpp"
                    : language === "python"
                    ? "python"
                    : language === "java"
                    ? "java"
                    : "javascript"
                }
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || "")}
                options={{
                  tabSize: 4,
                  insertSpaces: true,
                  detectIndentation: false,
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
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

        {/* Result */}
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
