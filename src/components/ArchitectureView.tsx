import React, { useState } from 'react';
import {
  Radio,
  Layers,
  Server,
  Database,
  Shield,
  Activity,
  ArrowDown,
  ArrowRight,
  Zap,
  CheckCircle,
  Cpu
} from 'lucide-react';
import { architectureNodes } from '../data/mock-and-docs';

export const ArchitectureView: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState(architectureNodes[0]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
          <Radio className="w-5 h-5 text-indigo-400" />
          <span>System Architecture & End-to-End Data Flow</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Relational-first distributed scheduling engine with Compare-And-Swap (CAS) queue locking, token bucket rate limiters, worker heartbeats, and DLQ quarantine.
        </p>
      </div>

      {/* Interactive System Flow Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Architecture Diagram Nodes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
            <span className="text-[11px] uppercase font-semibold text-slate-400">
              Interactive Component Topology (Click any component to inspect implementation details)
            </span>

            {/* Architecture Node Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {architectureNodes.map((node) => {
                const isSelected = selectedNode.id === node.id;

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/20'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-200">{node.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                        {node.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{node.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Step-by-Step Data Flow Visual Pipeline */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <span className="text-[11px] uppercase font-semibold text-slate-400">
                End-to-End Task Execution Lifecycle
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-indigo-400 font-bold font-mono">STEP 1</div>
                  <div className="font-bold text-slate-200 mt-1">Ingestion</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Idempotency & Delay checks</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-indigo-400 font-bold font-mono">STEP 2</div>
                  <div className="font-bold text-slate-200 mt-1">Atomic Claim</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">CAS Lock & Rate limiter</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-indigo-400 font-bold font-mono">STEP 3</div>
                  <div className="font-bold text-slate-200 mt-1">Execution</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Worker sandbox & Heartbeats</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-indigo-400 font-bold font-mono">STEP 4</div>
                  <div className="font-bold text-slate-200 mt-1">Backoff / Jitter</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Exponential retry on err</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-indigo-400 font-bold font-mono">STEP 5</div>
                  <div className="font-bold text-slate-200 mt-1">DLQ / Done</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Quarantine or DAG next</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right: Component Detail Panel */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 text-xs">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold">
              <Zap className="w-4 h-4" />
              <span>Component Specification</span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-100">{selectedNode.name}</h3>
              <span className="text-[10px] font-mono uppercase text-slate-500">Tier: {selectedNode.category} • Tech: {selectedNode.tech}</span>
              <p className="text-slate-300 mt-2 leading-relaxed">{selectedNode.description}</p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Core Responsibilities</span>
              <ul className="space-y-1.5 text-slate-300">
                {selectedNode.responsibilities.map((resp, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono space-y-1">
              <div className="text-slate-300 font-bold">Architectural Invariant:</div>
              <div>Zero-dependency PostgreSQL CAS claiming prevents distributed deadlocks without requiring Redis.</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
