import React, { useState } from 'react';
import {
  Shield,
  UserCheck,
  Check,
  X,
  Key,
  Lock,
  Zap,
  Users,
  AlertCircle
} from 'lucide-react';
import { Role, Permission } from '../types';

interface RbacMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: Role;
  onSwitchRole: (role: Role) => Promise<any>;
}

export const RbacMatrixModal: React.FC<RbacMatrixModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onSwitchRole
}) => {
  const [isSwitching, setIsSwitching] = useState(false);

  if (!isOpen) return null;

  const permissionsList: { id: Permission; label: string; category: string }[] = [
    { id: 'CREATE_JOBS', label: 'Submit / Create Jobs', category: 'Jobs' },
    { id: 'CANCEL_JOBS', label: 'Cancel In-Flight Jobs', category: 'Jobs' },
    { id: 'MANAGE_QUEUES', label: 'Pause / Resume / Purge Queues', category: 'Queues' },
    { id: 'SCALE_WORKERS', label: 'Scale Worker Nodes Limit', category: 'Cluster' },
    { id: 'REPLAY_DLQ', label: 'Replay Dead Letter Queue', category: 'DLQ' },
    { id: 'PURGE_DLQ', label: 'Purge DLQ Items', category: 'DLQ' },
    { id: 'MANAGE_WORKFLOWS', label: 'Edit & Run DAG Workflows', category: 'Workflows' },
    { id: 'MANAGE_LOCKS', label: 'Acquire & Release Distributed Locks', category: 'Distributed' },
    { id: 'MANAGE_SHARDS', label: 'Rebalance Sharding Topology', category: 'Distributed' },
    { id: 'MANAGE_RULES', label: 'Create & Toggle Event Bus Rules', category: 'Event Bus' },
    { id: 'RUN_TESTS', label: 'Execute Automated Test Suite', category: 'Testing' },
    { id: 'VIEW_METRICS', label: 'View Real-Time Metrics & Logs', category: 'Read-Only' },
  ];

  const roleDefinitions: Record<Role, { name: string; badge: string; desc: string; permissions: Permission[] }> = {
    admin: {
      name: 'Admin (Site Reliability Engineer)',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      desc: 'Full cluster control, scaling, locking, DLQ triage, sharding rebalance, and test suite execution.',
      permissions: [
        'CREATE_JOBS', 'CANCEL_JOBS', 'MANAGE_QUEUES', 'SCALE_WORKERS',
        'REPLAY_DLQ', 'PURGE_DLQ', 'MANAGE_WORKFLOWS', 'MANAGE_LOCKS',
        'MANAGE_SHARDS', 'MANAGE_RULES', 'RUN_TESTS', 'VIEW_METRICS'
      ]
    },
    operator: {
      name: 'Operator (Operations Engineer)',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      desc: 'Manages day-to-day operations, queues, DLQ replay, lock releases, and worker pool health.',
      permissions: [
        'CREATE_JOBS', 'CANCEL_JOBS', 'MANAGE_QUEUES', 'SCALE_WORKERS',
        'REPLAY_DLQ', 'MANAGE_LOCKS', 'MANAGE_RULES', 'RUN_TESTS', 'VIEW_METRICS'
      ]
    },
    developer: {
      name: 'Developer (Software Engineer)',
      badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      desc: 'Creates jobs, triggers workflows, tests event rules, and runs self-service test suites.',
      permissions: [
        'CREATE_JOBS', 'MANAGE_WORKFLOWS', 'MANAGE_RULES', 'RUN_TESTS', 'VIEW_METRICS'
      ]
    },
    viewer: {
      name: 'Viewer (Read-Only Auditor)',
      badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
      desc: 'Audits dashboards, telemetry graphs, lock status, and real-time execution logs without mutation permissions.',
      permissions: ['VIEW_METRICS']
    }
  };

  const handleRoleClick = async (role: Role) => {
    setIsSwitching(true);
    try {
      await onSwitchRole(role);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <span>Role-Based Access Control (RBAC) Matrix</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  JWT Bearer Token Security
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Switch user personas to test permission checks across APIs and UI buttons.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Persona Switcher Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['admin', 'operator', 'developer', 'viewer'] as Role[]).map((r) => {
            const def = roleDefinitions[r];
            const isSelected = currentRole === r;

            return (
              <button
                key={r}
                onClick={() => handleRoleClick(r)}
                disabled={isSwitching}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 p-0.5 rounded-full bg-indigo-500 text-white">
                    <Check className="w-3 h-3" />
                  </div>
                )}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${def.badge}`}>
                  {r}
                </span>
                <div className="text-xs font-bold text-slate-100 mt-2">{r.charAt(0).toUpperCase() + r.slice(1)}</div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{def.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Permissions Grid */}
        <div className="bg-slate-950/80 rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Permission Scope</span>
            <div className="grid grid-cols-4 gap-6 text-center text-[11px] font-mono">
              <span>Admin</span>
              <span>Operator</span>
              <span>Developer</span>
              <span>Viewer</span>
            </div>
          </div>

          <div className="divide-y divide-slate-800/60 text-xs">
            {permissionsList.map((p) => (
              <div key={p.id} className="p-3 flex items-center justify-between hover:bg-slate-900/30">
                <div className="space-y-0.5">
                  <span className="font-medium text-slate-200">{p.label}</span>
                  <span className="text-[10px] text-slate-500 block font-mono">{p.id}</span>
                </div>

                <div className="grid grid-cols-4 gap-6 text-center shrink-0">
                  {(['admin', 'operator', 'developer', 'viewer'] as Role[]).map((r) => {
                    const hasPerm = roleDefinitions[r].permissions.includes(p.id);
                    return (
                      <div key={r} className="flex justify-center items-center w-12">
                        {hasPerm ? (
                          <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="p-1 rounded bg-slate-800/40 text-slate-600">
                            <X className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-400 flex items-center space-x-1.5">
            <UserCheck className="w-4 h-4 text-indigo-400" />
            <span>Currently Active Session Role: <strong className="text-slate-200 uppercase font-mono">{currentRole}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
