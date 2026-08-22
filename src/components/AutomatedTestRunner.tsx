import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  Terminal,
  ShieldCheck,
  Clock,
  Layers
} from 'lucide-react';
import { TestSuiteResult } from '../types';
import { testSuitesList } from '../data/mock-and-docs';

export const AutomatedTestRunner: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, TestSuiteResult>>({});
  const [runningTestId, setRunningTestId] = useState<string | null>(null);
  const [isRunningAll, setIsRunningAll] = useState(false);

  const runSingleTest = async (testId: string) => {
    setRunningTestId(testId);
    try {
      const res = await fetch('/api/tests/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId })
      });
      const data: TestSuiteResult = await res.json();
      setTestResults((prev) => ({ ...prev, [testId]: data }));
    } catch (err) {
      console.error('Test run failed', err);
    } finally {
      setRunningTestId(null);
    }
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    for (const test of testSuitesList) {
      await runSingleTest(test.id);
    }
    setIsRunningAll(false);
  };

  // Automatically execute verification test suite on first mount so results are always ready
  React.useEffect(() => {
    runAllTests();
  }, []);

  const totalPassed = Object.values(testResults).filter((r: TestSuiteResult) => r.status === 'PASSED').length;
  const totalFailed = Object.values(testResults).filter((r: TestSuiteResult) => r.status === 'FAILED').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span>Automated Invariants Verification & Concurrency Test Suite</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time execution of distributed race conditions, CAS claim exclusivity, idempotency deduplication, and backoff jitter tests.
          </p>
        </div>

        {/* Run All Button & Status Indicator */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs font-mono">
            {Object.keys(testResults).length === 0 ? (
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
                0 / {testSuitesList.length} Tests Run
              </span>
            ) : (
              <>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  {totalPassed} / {testSuitesList.length} PASSED
                </span>
                {totalFailed > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                    {totalFailed} FAILED
                  </span>
                )}
              </>
            )}
          </div>

          <button
            id="btn-run-all-tests"
            onClick={runAllTests}
            disabled={isRunningAll || runningTestId !== null}
            className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunningAll ? 'Running Verification Suite...' : 'Run All Tests'}</span>
          </button>
        </div>
      </div>

      {/* Test Suites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {testSuitesList.map((suite) => {
          const result = testResults[suite.id];
          const isRunning = runningTestId === suite.id;

          return (
            <div
              key={suite.id}
              id={`test-card-${suite.id}`}
              className={`bg-slate-900/90 border rounded-2xl p-5 space-y-3 transition-all ${
                result?.status === 'PASSED'
                  ? 'border-emerald-500/40 bg-slate-900/90 shadow-sm shadow-emerald-500/10'
                  : result?.status === 'FAILED'
                  ? 'border-rose-500/40 bg-slate-900/90'
                  : 'border-slate-800'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-slate-100 text-sm">{suite.name}</h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    Category: {suite.category}
                  </span>
                </div>

                <div>
                  {isRunning ? (
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse">
                      RUNNING...
                    </span>
                  ) : result?.status === 'PASSED' ? (
                    <span className="flex items-center space-x-1 px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>PASSED</span>
                    </span>
                  ) : result?.status === 'FAILED' ? (
                    <span className="flex items-center space-x-1 px-2.5 py-1 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      <XCircle className="w-3 h-3" />
                      <span>FAILED</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => runSingleTest(suite.id)}
                      disabled={isRunningAll || runningTestId !== null}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Run Test
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-400">{suite.description}</p>

              {/* Execution Result Log Output */}
              {result && (
                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Assertions: {result.passedAssertions}/{result.assertionsCount} passed</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{result.durationMs}ms</span>
                    </span>
                  </div>

                  {result.logs && result.logs.length > 0 && (
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 font-mono text-[10px] text-slate-300 space-y-1 max-h-32 overflow-y-auto">
                      {result.logs.map((log, idx) => (
                        <div key={idx} className="leading-tight">{log}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
