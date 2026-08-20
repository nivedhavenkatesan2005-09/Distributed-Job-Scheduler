import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  Ban,
  Clock,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  Terminal,
  Code,
  Shield,
  Copy,
  Layers,
  Server,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Job, JobLog, JobState } from '../types';

interface JobDetailModalProps {
  job: Job;
  logs: JobLog[];
  onClose: () => void;
  onRetry: (jobId: string) => void;
  onCancel: (jobId: string) => void;
  onDiagnoseWithAi: (job: Job) => Promise<void>;
  isDiagnosingAi: boolean;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  logs,
  onClose,
  onRetry,
  onCancel,
  onDiagnoseWithAi,
  isDiagnosingAi
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'payload' | 'ai' | 'retries'>('overview');
  const [logFilter, setLogFilter] = useState<string>('ALL');
  const [copiedPayload, setCopiedPayload] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const filteredLogs = logs.filter((l) => {
    if (logFilter !== 'ALL' && l.level !== logFilter) return false;
    return true;
  });

  // Calculate lifecycle steps
  const steps = [
    { label: 'Created', done: true, time: job.createdAt },
    { label: 'Queued', done: job.state !== 'SCHEDULED', time: job.scheduledAt || job.createdAt },
    { label: 'Claimed', done: Boolean(job.workerId) || job.state === 'RUNNING' || job.state === 'COMPLETED' || job.state === 'FAILED' || job.state === 'DEAD_LETTERED', time: job.startedAt },
    { label: 'Running', done: job.state === 'RUNNING' || job.state === 'COMPLETED' || job.state === 'FAILED' || job.state === 'DEAD_LETTERED', time: job.startedAt },
    { label: job.state === 'DEAD_LETTERED' ? 'Dead Letter' : job.state === 'FAILED' ? 'Failed' : 'Completed', done: job.state === 'COMPLETED' || job.state === 'FAILED' || job.state === 'DEAD_LETTERED', time: job.completedAt }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 my-8">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <h3 className="text-lg font-bold text-slate-100">{job.name}</h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {job.id}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Priority P{job.priority}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Queue: <span className="text-slate-200 font-medium">{job.queueName || job.queueId}</span> • Type:{' '}
              <span className="text-slate-200 font-mono uppercase">{job.type}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lifecycle Stepper */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between relative">
            {steps.map((step, idx) => {
              const isLast = idx === steps.length - 1;
              const isFailedFinal = isLast && (job.state === 'FAILED' || job.state === 'DEAD_LETTERED');

              return (
                <div key={idx} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isFailedFinal
                          ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                          : step.done
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {isFailedFinal ? '!' : step.done ? '✓' : idx + 1}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-300 mt-1.5 whitespace-nowrap">
                      {step.label}
                    </span>
                    {step.time && (
                      <span className="text-[9px] text-slate-500 font-mono whitespace-nowrap">
                        {new Date(step.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    )}
                  </div>
                  {!isLast && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        step.done ? 'bg-emerald-600' : 'bg-slate-800'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex space-x-2 border-b border-slate-800 pb-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview & Leases
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === 'logs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Execution Logs ({logs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('payload')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === 'payload' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Payload & Result</span>
          </button>
          <button
            onClick={() => setActiveTab('retries')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === 'retries' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retries & Backoff</span>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-purple-300 hover:text-white bg-purple-950/40 border border-purple-800/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Failure Diagnostics</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[260px] text-xs">
          
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">State</div>
                  <div className="text-sm font-bold text-slate-200 mt-0.5">{job.state}</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Assigned Worker</div>
                  <div className="text-sm font-mono text-slate-200 mt-0.5 truncate">{job.workerName || 'None'}</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Attempt Count</div>
                  <div className="text-sm font-mono text-slate-200 mt-0.5">{job.attemptCount} / {job.maxRetries}</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Idempotency Key</div>
                  <div className="text-sm font-mono text-slate-200 mt-0.5 truncate">{job.idempotencyKey || 'None'}</div>
                </div>
              </div>

              {/* Distributed Lease Token Box */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 text-indigo-400 font-semibold">
                  <Lock className="w-4 h-4" />
                  <span>Atomic Lease Token & CAS Concurrency Guard</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500">lock_token: </span>
                    <span className="text-cyan-300">{job.lockToken || 'NULL (Unclaimed)'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">lock_expires_at: </span>
                    <span className="text-amber-300">{job.lockExpiresAt ? new Date(job.lockExpiresAt).toISOString() : 'NULL'}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  The worker acquires an exclusive time-bounded lease token on claim. If the worker fails to refresh heartbeat within 15 seconds, the lock expires and the Reaper reassigns the job.
                </p>
              </div>

              {/* Error Callout if Failed */}
              {job.errorMessage && (
                <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl space-y-1">
                  <div className="flex items-center space-x-2 text-rose-400 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Execution Error</span>
                  </div>
                  <p className="text-rose-200 font-mono text-xs">{job.errorMessage}</p>
                </div>
              )}
            </div>
          )}

          {/* 2. LOGS TAB */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Structured Execution Output</span>
                <select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
                >
                  <option value="ALL">All Levels</option>
                  <option value="info">INFO</option>
                  <option value="warn">WARN</option>
                  <option value="error">ERROR</option>
                </select>
              </div>

              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 max-h-72 overflow-y-auto font-mono text-[11px] space-y-1.5">
                {filteredLogs.length === 0 ? (
                  <div className="text-slate-600 text-center py-6">No execution logs recorded yet.</div>
                ) : (
                  filteredLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <span className="text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span
                        className={`font-bold uppercase text-[10px] px-1.5 py-0.2 rounded ${
                          log.level === 'error'
                            ? 'bg-rose-500/20 text-rose-400'
                            : log.level === 'warn'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {log.level}
                      </span>
                      <span className="text-slate-200 flex-1">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 3. PAYLOAD TAB */}
          {activeTab === 'payload' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-400 font-semibold">Input Payload (JSON)</span>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(job.payload, null, 2))}
                    className="flex items-center space-x-1 text-slate-400 hover:text-white text-[11px]"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedPayload ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-cyan-300 font-mono text-[11px] max-h-60 overflow-y-auto">
                  {JSON.stringify(job.payload, null, 2)}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-400 font-semibold">Execution Result / Output</span>
                </div>
                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-emerald-300 font-mono text-[11px] max-h-60 overflow-y-auto">
                  {job.result ? JSON.stringify(job.result, null, 2) : 'No result yet (In progress or failed)'}
                </pre>
              </div>
            </div>
          )}

          {/* 4. RETRIES & BACKOFF TAB */}
          {activeTab === 'retries' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-200 font-bold">Exponential Backoff & Full Jitter Formula</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[11px]">
                    t = random(0, min(max_delay, base_delay * 2^attempt))
                  </span>
                </div>
                <p className="text-slate-400">
                  Full jitter prevents the "Thundering Herd" problem by dispersing worker retry attempts uniformly over the backoff interval.
                </p>

                <div className="grid grid-cols-4 gap-2 text-center pt-2">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Attempt 1</div>
                    <div className="text-xs font-mono font-bold text-slate-200">0s - 1.0s</div>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Attempt 2</div>
                    <div className="text-xs font-mono font-bold text-slate-200">0s - 2.0s</div>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Attempt 3</div>
                    <div className="text-xs font-mono font-bold text-slate-200">0s - 4.0s</div>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Attempt 4</div>
                    <div className="text-xs font-mono font-bold text-slate-200">0s - 8.0s</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. AI DIAGNOSTICS TAB */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              {!job.aiDiagnosis ? (
                <div className="text-center py-8 bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-3">
                  <Sparkles className="w-8 h-8 text-purple-400 mx-auto" />
                  <h4 className="text-slate-200 font-bold">Automated Failure Root Cause Analysis</h4>
                  <p className="text-slate-400 max-w-md mx-auto">
                    Evaluate error stack traces, job payload, and downstream network telemetry with Gemini AI to generate immediate remediation steps.
                  </p>
                  <button
                    id="btn-run-ai-diagnosis"
                    onClick={() => onDiagnoseWithAi(job)}
                    disabled={isDiagnosingAi}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
                  >
                    {isDiagnosingAi ? 'Analyzing Stack Trace with Gemini...' : 'Run AI Root Cause Analysis'}
                  </button>
                </div>
              ) : (
                <div className="p-5 bg-gradient-to-br from-purple-950/40 via-slate-950 to-slate-950 border border-purple-800/50 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-purple-300 font-bold text-sm">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Gemini Root Cause Diagnosis</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Category: {job.aiDiagnosis.category}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Root Cause</span>
                    <p className="text-slate-200 text-xs bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      {job.aiDiagnosis.rootCause}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Recommended Fix</span>
                    <p className="text-emerald-300 text-xs bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      {job.aiDiagnosis.suggestedFix}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800 text-slate-400">
                    <span>Action: <strong className="text-slate-200">{job.aiDiagnosis.remediationAction}</strong></span>
                    <span>Confidence: <strong className="text-indigo-400">{(job.aiDiagnosis.confidence * 100).toFixed(0)}%</strong></span>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="flex items-center space-x-2">
            {(job.state === 'FAILED' || job.state === 'DEAD_LETTERED') && (
              <button
                onClick={() => {
                  onRetry(job.id);
                  onClose();
                }}
                className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-md transition-colors text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Job Now</span>
              </button>
            )}

            {(job.state === 'QUEUED' || job.state === 'SCHEDULED' || job.state === 'RUNNING') && (
              <button
                onClick={() => {
                  onCancel(job.id);
                  onClose();
                }}
                className="flex items-center space-x-1.5 px-4 py-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 rounded-xl font-semibold transition-colors text-xs"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Cancel Execution</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition-colors text-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
