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

  // ✅ SINGLE SOURCE OF TRUTH
  const [level, setLevel] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<AnalysisSections | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('explanation');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [leetcodeLoading, setLeetcodeLoading] = useState(false);
  const [leetcodeError, setLeetcodeError] = useState('');
  const [leetcodeFetched, setLeetcodeFetched] = useState(false);

  const defaultCodeMap: Record<string, string> = {
    cpp: 
`class Solution {
public:
    <datatype> function(){
      // add your code here
    }
};`,

    python: 
`class Solution(object):
    def funciotn():
        # add your code here
        `,

    java: 
`class Solution {
    public <datatype> function() {
        // add your code here
    }
}`,

    javascript: 
`// write your code here`,
  };

  // 🔹 Sync user
  useEffect(() => {
    if (!session?.user?.email || !BACKEND_URL) return;

    axios.post(`${BACKEND_URL}/auth/sync`, {
      email: session.user.email,
      name: session.user.name,
    }).catch(() => {});
  }, [session]);

  function normalizeCode(code: string) {
    if (!code) return '';
    return code.replace(/\\n/g, '\n').replace(/\t/g, '    ').trim();
  }

  // 🔹 ANALYZE
  async function analyze() {
    if (!session?.user?.email) {
      setError('Please login to continue');
      return;
    }

    if (!BACKEND_URL) {
      setError('Backend URL not configured');
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
      setActiveTab('explanation');

      const res = await axios.post(`${BACKEND_URL}/analyze`, {
        problem,
        code,
        email: session.user.email,
        leetcodeDifficulty: level, // 🔒 LOCKED
      });

      setAnalysis(res.data.analysis);
    } catch (err: any) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // 🔹 FETCH FROM LEETCODE
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

      const formattedProblem = `
Title: ${res.data.title}

Description:
${res.data.description}
`.trim();

      setProblem(formattedProblem);

      // 🔒 LOCK difficulty forever
      setLevel(res.data.difficulty.toLowerCase());
      setLeetcodeFetched(true);
    } catch (err) {
      console.error(err);
      setLeetcodeError('Failed to fetch from LeetCode');
    } finally {
      setLeetcodeLoading(false);
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
        <h1 className="text-4xl font-bold mb-2"><img src="/logo.png" alt="CheetCode" className="h-9" />CheetCode</h1>
        <p className="text-zinc-400 mb-6">
          AI-powered LeetCode problem analysis
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
            disabled={leetcodeFetched}
            className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded"
            rows={4}
            placeholder="Paste LeetCode problem URL"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
          />

          <button
            onClick={fetchFromLeetCode}
            disabled={leetcodeLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 transition p-2 rounded font-medium"
          >
            {leetcodeLoading ? 'Fetching...' : 'Fetch problem statement'}
          </button>

          {leetcodeError && (
            <p className="text-red-400 text-sm">{leetcodeError}</p>
          )}

          {language && (
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
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
            disabled={loading || !session}
            className={`w-full transition p-3 rounded font-semibold ${
              !session
                ? 'bg-zinc-700 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {!session
              ? 'Login to Analyze'
              : loading
              ? 'Analyzing...'
              : 'Analyze'}
          </button>
        </div>

        {/* Difficulty */}
        {level && (
          <div className="mb-4 inline-block px-4 py-1 rounded bg-zinc-800 border border-zinc-700">
            Detected Difficulty:{' '}
            <span className="font-semibold uppercase text-emerald-400">
              {level}
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
                        : 'bg-zinc-700'
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
                  <div key={i} className="mb-6">
                    <p className="font-semibold text-emerald-400">{a.title}</p>
                    <p>{a.description}</p>
                    <pre className="bg-black/50 p-3 rounded mt-2">
                      <code>{normalizeCode(a.code)}</code>
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
