import React, { useState } from 'react';
import {
  AlertOctagon,
  RotateCcw,
  Trash2,
  Sparkles,
  Search,
  CheckCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  FileCode,
  Terminal,
  AlertTriangle
} from 'lucide-react';
import { DeadLetterJob } from '../types';

interface DeadLetterQueueViewProps {
  dlqItems: DeadLetterJob[];
  onReplayJob: (dlqId: string) => void;
  onBulkReplay: () => void;
  onPurgeDlqItem: (dlqId: string) => void;
  onDiagnoseDlqWithAi: (item: DeadLetterJob) => Promise<void>;
  isDiagnosingAi: boolean;
}

export const DeadLetterQueueView: React.FC<DeadLetterQueueViewProps> = ({
  dlqItems,
  onReplayJob,
  onBulkReplay,
  onPurgeDlqItem,
  onDiagnoseDlqWithAi,
  isDiagnosingAi
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = dlqItems.filter((item) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.jobName.toLowerCase().includes(q) ||
      item.jobId.toLowerCase().includes(q) ||
      item.failedReason.toLowerCase().includes(q) ||
      JSON.stringify(item.payload).toLowerCase().includes(q)
    );
  });

  const unresolvedCount = dlqItems.filter((d) => !d.resolvedAt).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Dead Letter Queue (DLQ) Quarantine</h2>
              <p className="text-xs text-slate-400">
                Jobs that permanently failed after exhausting all configured exponential backoff retry attempts.
              </p>
            </div>
          </div>
        </div>

        {/* Bulk Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            id="btn-bulk-replay-dlq"
            onClick={onBulkReplay}
            disabled={unresolvedCount === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Replay All ({unresolvedCount}) to Queue</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter dead letter items by job name, error message, or payload..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* DLQ Cards List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-2">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-200">Dead Letter Queue is Empty</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              All worker task executions are succeeding within retry thresholds. To test DLQ handling, use "Simulate Traffic (+ Failures)".
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                id={`dlq-item-${item.id}`}
                className={`bg-slate-900/90 border rounded-2xl transition-all overflow-hidden ${
                  item.resolvedAt
                    ? 'border-slate-800/60 opacity-70'
                    : 'border-rose-500/30 hover:border-rose-500/50 shadow-sm'
                }`}
              >
                {/* Main Card Summary */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="p-4 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 select-none"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-100 text-sm">{item.jobName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {item.jobId}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Exhausted {item.attemptsCount} Attempts
                      </span>
                      {item.resolvedAt && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          REPLAYED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-rose-400 font-mono line-clamp-1">{item.failedReason}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                      {new Date(item.failedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-4 text-xs">
                    
                    {/* Error Stack Trace Box */}
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2 text-slate-400 font-semibold">
                        <Terminal className="w-3.5 h-3.5 text-rose-400" />
                        <span>Execution Stack Trace</span>
                      </div>
                      <pre className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-rose-300 font-mono text-[11px] overflow-x-auto max-h-48">
                        {item.errorStack || item.failedReason}
                      </pre>
                    </div>

                    {/* Payload Viewer */}
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2 text-slate-400 font-semibold">
                        <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Job Payload</span>
                      </div>
                      <pre className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-cyan-300 font-mono text-[11px] overflow-x-auto max-h-40">
                        {JSON.stringify(item.payload, null, 2)}
                      </pre>
                    </div>

                    {/* AI Diagnosis Callout */}
                    {item.aiDiagnosis ? (
                      <div className="p-4 bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900 border border-purple-800/50 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-purple-300 flex items-center space-x-1.5">
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            <span>Gemini Root Cause Analysis</span>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                            {item.aiDiagnosis.category}
                          </span>
                        </div>
                        <p className="text-slate-200 text-xs"><strong>Root Cause: </strong>{item.aiDiagnosis.rootCause}</p>
                        <p className="text-emerald-300 text-xs"><strong>Suggested Remediation: </strong>{item.aiDiagnosis.suggestedFix}</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-purple-950/20 border border-purple-800/30 rounded-xl">
                        <div className="flex items-center space-x-2 text-purple-300">
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>Get automated AI diagnostic root cause and fix recommendation</span>
                        </div>
                        <button
                          onClick={() => onDiagnoseDlqWithAi(item)}
                          disabled={isDiagnosingAi}
                          className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-semibold text-xs transition-all disabled:opacity-50"
                        >
                          {isDiagnosingAi ? 'Diagnosing...' : 'Run Gemini Triage'}
                        </button>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                      <button
                        onClick={() => onPurgeDlqItem(item.id)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Purge from DLQ</span>
                      </button>

                      <button
                        onClick={() => onReplayJob(item.id)}
                        className="flex items-center space-x-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-md shadow-indigo-600/30 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Replay Job to Queue</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
