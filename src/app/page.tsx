"use client";

import { useState } from "react";

export default function Home() {
  const [code, setCode] = useState("function add(a, b) {\n  return a - b;\n}");
  const [error, setError] = useState("AssertionError: expected add(2,3) to equal 5, got -1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleHeal = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/heal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, error }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert("Failed to execute agentic healing loop.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <header className="max-w-6xl mx-auto mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-bold text-emerald-400">⚡ Codex PR Healer & Compliance Guard</h1>
        <p className="text-slate-400 text-sm mt-1">Autonomous Agentic Loop for PR Remediation</p>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Broken Code Snippet</label>
            <textarea
              className="w-full h-40 bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-sm text-emerald-300 focus:outline-none focus:border-emerald-500"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Build / Test Error Log</label>
            <textarea
              className="w-full h-32 bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-sm text-rose-400 focus:outline-none focus:border-rose-500"
              value={error}
              onChange={(e) => setError(e.target.value)}
            />
          </div>

          <button
            onClick={handleHeal}
            disabled={loading}
            className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-lg transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? "Agentic Execution in Progress..." : "Run Agentic Healing Loop 🚀"}
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">Agent Trajectory & Results</h2>

          {!result && !loading && (
            <p className="text-slate-500 text-sm">Click the button to run Codex self-healing loop.</p>
          )}

          {loading && (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-slate-800 rounded w-3/4"></div>
              <div className="h-4 bg-slate-800 rounded w-1/2"></div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-xs font-semibold uppercase text-slate-400">Execution Trajectory</span>
                <ul className="mt-2 space-y-1 font-mono text-xs text-slate-300">
                  {result.logs?.map((log: string, idx: number) => (
                    <li key={idx}>{log}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase text-slate-400">Remediated Code</span>
                <pre className="mt-2 p-3 bg-slate-950 rounded border border-emerald-900/50 font-mono text-sm text-emerald-400 overflow-x-auto">
                  {result.fixedCode}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
