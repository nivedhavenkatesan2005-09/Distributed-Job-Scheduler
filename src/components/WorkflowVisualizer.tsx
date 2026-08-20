import React, { useState } from 'react';
import {
  GitMerge,
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Plus,
  Zap,
  Layers,
  ChevronRight,
  FolderTree
} from 'lucide-react';
import { Workflow, WorkflowNode } from '../types';

interface WorkflowVisualizerProps {
  workflows: Workflow[];
  onCreateWorkflow: (data: any) => void;
}

export const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({
  workflows,
  onCreateWorkflow
}) => {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(workflows[0]?.id || '');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [wfName, setWfName] = useState('Data Pipeline & AI Fine-Tuning');
  const [wfDesc, setWfDesc] = useState('Multi-stage ETL pipeline with vector embedding generation and model validation');

  const selectedWorkflow = workflows.find((w) => w.id === selectedWorkflowId) || workflows[0];

  const handleCreateDefaultWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateWorkflow({
      name: wfName,
      description: wfDesc,
      nodes: [
        { id: 'step-1', name: '1. Extract S3 Warehouse Parquet', queueId: 'q-data', taskType: 'etl_extract', dependsOn: [] },
        { id: 'step-2', name: '2. Normalize & Clean Customer Records', queueId: 'q-data', taskType: 'etl_clean', dependsOn: ['step-1'] },
        { id: 'step-3', name: '3. Generate Vector Embeddings (Gemini)', queueId: 'q-data', taskType: 'vectorize', dependsOn: ['step-2'] },
        { id: 'step-4', name: '4. Update Search Index & Notify Ops', queueId: 'q-critical', taskType: 'publish_index', dependsOn: ['step-3'] }
      ]
    });
    setIsCreateModalOpen(false);
  };

  const getNodeStatusBadge = (status: WorkflowNode['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>COMPLETED</span>
          </span>
        );
      case 'RUNNING':
        return (
          <span className="flex items-center space-x-1 text-[10px] font-bold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            <span>RUNNING</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center space-x-1 text-[10px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>FAILED</span>
          </span>
        );
      case 'WAITING':
        return (
          <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
            WAITING DEPS
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
            PENDING
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <GitMerge className="w-5 h-5 text-indigo-400" />
            <span>Workflow Orchestrator (Directed Acyclic Graphs)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Execute complex sequential and parallel job stages with automatic dependency resolution and error propagation.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New DAG Pipeline</span>
        </button>
      </div>

      {/* Workflow Selector & Status */}
      {workflows.length > 0 && selectedWorkflow && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs font-semibold text-slate-400 uppercase">Active Workflow:</span>
            <select
              value={selectedWorkflow.id}
              onChange={(e) => setSelectedWorkflowId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {workflows.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.status})
                </option>
              ))}
            </select>

            <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full ${
              selectedWorkflow.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
              selectedWorkflow.status === 'RUNNING' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
              'bg-slate-800 text-slate-300'
            }`}>
              Status: {selectedWorkflow.status}
            </span>
          </div>

          {/* Interactive DAG Pipeline Graph */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-bold text-slate-100 text-base">{selectedWorkflow.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{selectedWorkflow.description}</p>
            </div>

            {/* Visual Step Nodes & Connectors */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {selectedWorkflow.nodes.map((node, index) => {
                const isLast = index === selectedWorkflow.nodes.length - 1;

                return (
                  <div key={node.id} className="relative flex flex-col justify-between">
                    <div
                      className={`p-4 rounded-2xl border transition-all ${
                        node.status === 'COMPLETED'
                          ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                          : node.status === 'RUNNING'
                          ? 'bg-blue-950/30 border-blue-500/50 shadow-md shadow-blue-500/20'
                          : 'bg-slate-950/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Stage #{index + 1}</span>
                        {getNodeStatusBadge(node.status)}
                      </div>

                      <h4 className="font-bold text-slate-100 text-xs mb-1.5">{node.name}</h4>
                      
                      <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                        <div>Queue: <span className="text-slate-200">{node.queueId}</span></div>
                        {node.jobId && (
                          <div className="truncate text-indigo-400">Job: {node.jobId}</div>
                        )}
                        {node.dependsOn.length > 0 && (
                          <div className="text-[10px] text-slate-500">
                            Depends on: {node.dependsOn.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>

                    {!isLast && (
                      <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20">
                        <ArrowRight className="w-5 h-5 text-slate-600" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* DAG Execution Invariant Explainer */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
              <div className="flex items-center space-x-2 text-indigo-400 font-semibold">
                <FolderTree className="w-4 h-4" />
                <span>Distributed DAG Dependency Resolution</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Nodes in this pipeline remain in <strong className="text-slate-200">WAITING</strong> state until all parent dependencies transition to <strong className="text-emerald-400">COMPLETED</strong>. Once eligible, the scheduler engine spawns a distinct atomic job into the target queue with priority inheritance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Workflow Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <GitMerge className="w-4 h-4 text-indigo-400" />
                <span>Create Multi-Step DAG Workflow</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateDefaultWorkflow} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Workflow Name</label>
                <input
                  type="text"
                  required
                  value={wfName}
                  onChange={(e) => setWfName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={wfDesc}
                  onChange={(e) => setWfDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Included Pipeline Stages</span>
                <ul className="list-disc list-inside text-slate-300 space-y-1 text-[11px] font-mono">
                  <li>Stage 1: Ingest Data Parquet (Root)</li>
                  <li>Stage 2: Normalize Records (Depends on Stage 1)</li>
                  <li>Stage 3: Vector Embeddings (Depends on Stage 2)</li>
                  <li>Stage 4: Publish & Alert (Depends on Stage 3)</li>
                </ul>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors"
                >
                  Launch Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
