'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSession, signIn, signOut } from 'next-auth/react';
import Editor from '@monaco-editor/react';
import LandingHero from './components/LandingHero';

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
  /* ---------------- AUTH ---------------- */
  const { data: session } = useSession();

  /* ---------------- STATES ---------------- */
  const [problem, setProblem] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('');
  const [level, setLevel] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<AnalysisSections | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('explanation');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [leetcodeLoading, setLeetcodeLoading] = useState(false);
  const [leetcodeError, setLeetcodeError] = useState('');
  const [leetcodeFetched, setLeetcodeFetched] = useState(false);

  const defaultCodeMap: Record<string, string> = {
    cpp: `class Solution {
public:
    <datatype> function(){
      // add your code here
    }
};`,
    python: `class Solution(object):
    def function(self):
        # add your code here`,
    java: `class Solution {
    public <datatype> function() {
        // add your code here
    }
}`,
    javascript: `// write your code here`,
  };

  /* ---------------- SYNC USER ---------------- */
  useEffect(() => {
    if (!session?.user?.email || !BACKEND_URL) return;

    axios.post(`${BACKEND_URL}/auth/sync`, {
      email: session.user.email,
      name: session.user.name,
    }).catch(() => {});
  }, [session]);

  function normalizeCode(code: string) {
    return code
      .replace(/\\n/g, '\n')
      .replace(/\t/g, '    ')
      .trim();
  }

  /* ---------------- ANALYZE ---------------- */
  async function analyze() {
    if (!session?.user?.email) {
      setError('Please login to continue');
      return;
    }

    if (!level) {
      setError('Problem difficulty not detected yet.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setAnalysis(null);

      const res = await axios.post(`${BACKEND_URL}/analyze`, {
        problem,
        code,
        email: session.user.email,
        leetcodeDifficulty: level,
      });

      setAnalysis(res.data.analysis);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- FETCH LEETCODE ---------------- */
  async function fetchFromLeetCode() {
    if (!problem.startsWith('http')) {
      setLeetcodeError('Paste a valid LeetCode problem URL');
      return;
    }

    try {
      setLeetcodeLoading(true);
      setLeetcodeError('');

      const res = await axios.get(
        `${BACKEND_URL}/leetcode/fetch`,
        { params: { input: problem } }
      );

      setProblem(`Title: ${res.data.title}\n\n${res.data.description}`);
      setLevel(res.data.difficulty.toLowerCase());
      setLeetcodeFetched(true);
    } catch {
      setLeetcodeError('Failed to fetch from LeetCode');
    } finally {
      setLeetcodeLoading(false);
    }
  }

  /* ---------------- RENDER ---------------- */
  if (!session) {
    return <LandingHero />;
  }

  return (
    <main className="min-h-screen px-6 pt-28 pb-20 overflow-y-auto">
      <div className="max-w-4xl w-full mt-10">
        <div className="flex items-center gap-2 mb-3">
          <img src="/logo.png" className="w-12 h-12" />
          <h1 className="text-4xl font-semibold">CheetCode</h1>
        </div>

        <p className="text-zinc-400 mb-6">
          AI-powered LeetCode problem analysis
        </p>

        {/* INPUT */}
        <div className="
          bg-zinc-900/70
          backdrop-blur-xl
          p-6
          rounded-2xl
          space-y-4
          border
          border-zinc-800
          shadow-[0_0_40px_rgba(0,0,0,0.6)]
        ">
          <select
            className="w-full bg-zinc-900 border p-2 rounded"
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
            disabled={leetcodeFetched}
            className="w-full bg-zinc-900 border p-3 rounded"
            rows={4}
            placeholder="Paste LeetCode problem URL"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
          />

          <button
            onClick={fetchFromLeetCode}
            className="w-full bg-blue-600 p-2 rounded"
          >
            {leetcodeLoading ? 'Fetching...' : 'Fetch problem'}
          </button>

          {language && (
          <div className="mt-4 rounded-xl overflow-hidden border border-zinc-800">
            <Editor
              height="300px"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={(v) => setCode(v || '')}
            />
          </div>
          )}

          <button
            onClick={analyze}
            className="w-full bg-emerald-600 p-3 rounded font-semibold"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </div>
    </main>
  );
}
