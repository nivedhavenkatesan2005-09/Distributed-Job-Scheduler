import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Lock,
  RotateCcw,
  Zap,
  Activity,
  Sparkles
} from 'lucide-react';
import { designDecisions } from '../data/mock-and-docs';

export const DesignDecisionsView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2">
        <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2.5">
          <BookOpen className="w-6 h-6 text-indigo-400" />
          <span>System Design Decisions & Architectural Trade-Offs Whitepaper</span>
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Detailed technical justification of the concurrency patterns, database locking strategies, fault tolerance mechanisms, and delivery guarantees powering this distributed scheduler.
        </p>
      </div>

      {/* Decisions Cards List */}
      <div className="space-y-5">
        {designDecisions.map((decision, idx) => (
          <div
            key={idx}
            id={`decision-${idx + 1}`}
            className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4"
          >
            {/* Title & Topic */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">
                  Design Decision #{idx + 1} • {decision.category}
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-1">{decision.title}</h3>
              </div>
            </div>

            {/* Context & Problem */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Context & Technical Challenge</span>
              <p className="text-xs text-slate-300 leading-relaxed">{decision.problem}</p>
            </div>

            {/* Decision Made */}
            <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-indigo-300">Selected Approach & Execution Contract</span>
              <p className="text-xs text-slate-100 font-medium leading-relaxed">{decision.decision}</p>
            </div>

            {/* Rationale & Trade-offs */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Technical Rationale & Alternatives Considered</span>
              <p className="text-xs text-slate-400 leading-relaxed">{decision.rationale}</p>
            </div>

            {/* Alternatives Comparison */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Comparative Option Matrix</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {decision.options.map((opt, oIdx) => (
                  <div
                    key={oIdx}
                    className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                      opt.isChosen
                        ? 'bg-indigo-950/20 border-indigo-500/40 text-slate-200'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className={opt.isChosen ? 'text-indigo-300' : 'text-slate-300'}>{opt.name}</span>
                      {opt.isChosen && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                          CHOSEN
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-semibold text-emerald-400">Pros</div>
                      <ul className="list-disc list-inside text-[11px] space-y-0.5">
                        {opt.pros.map((p, pIdx) => (
                          <li key={pIdx}>{p}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-semibold text-rose-400">Cons</div>
                      <ul className="list-disc list-inside text-[11px] space-y-0.5">
                        {opt.cons.map((c, cIdx) => (
                          <li key={cIdx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Failure Mode Handling */}
            {decision.failureModeHandling && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-400">Failure Mode Recovery Invariant</span>
                <p className="text-[11px] text-slate-400">{decision.failureModeHandling}</p>
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
};
