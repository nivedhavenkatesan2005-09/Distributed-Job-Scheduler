import React, { useState } from 'react';
import {
  Database,
  Table,
  Key,
  Copy,
  CheckCircle,
  FileCode,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react';
import { relationalSchema, postgresDdl } from '../types/database-schema';

export const DatabaseSchemaView: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState(relationalSchema[4] || relationalSchema[0]); // Default to 'jobs' table
  const [copiedDdl, setCopiedDdl] = useState(false);

  const copyDdl = () => {
    navigator.clipboard.writeText(postgresDdl);
    setCopiedDdl(true);
    setTimeout(() => setCopiedDdl(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <span>Relational Schema & ACID Integrity Specifications</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete third-normal-form (3NF) relational model with atomic CAS locks, compound partial indexes for O(1) claiming, and idempotency guarantees.
          </p>
        </div>

        <button
          id="btn-copy-ddl"
          onClick={copyDdl}
          className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-colors"
        >
          {copiedDdl ? <CheckCircle className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          <span>{copiedDdl ? 'DDL Copied!' : 'Copy PostgreSQL DDL'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left: Table List */}
        <div className="lg:col-span-1 space-y-2">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Database Tables ({relationalSchema.length})</span>
          <div className="space-y-1">
            {relationalSchema.map((tbl) => {
              const isSelected = selectedTable.name === tbl.name;
              return (
                <button
                  key={tbl.name}
                  onClick={() => setSelectedTable(tbl)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 text-white font-semibold shadow-sm'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Table className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="font-mono truncate">{tbl.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{tbl.columns.length} cols</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center & Right: Selected Table Details & Indexes */}
        <div className="lg:col-span-3 space-y-5">
          
          {/* Table Header */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-base font-bold font-mono text-slate-100">{selectedTable.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                    Category: {selectedTable.category} • {selectedTable.normalizationLevel}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{selectedTable.description}</p>
              </div>
            </div>

            {/* Columns Table */}
            <div>
              <span className="text-[11px] font-semibold uppercase text-slate-400 mb-2 block">Columns & Types</span>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Column Name</th>
                      <th className="py-2.5 px-3">Data Type</th>
                      <th className="py-2.5 px-3">Nullable</th>
                      <th className="py-2.5 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-sans">
                    {selectedTable.columns.map((col) => (
                      <tr key={col.name} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono text-slate-100 flex items-center space-x-1.5">
                          {col.isPrimary && <Key className="w-3 h-3 text-amber-400" />}
                          <span className={col.isPrimary ? 'font-bold text-amber-300' : ''}>{col.name}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-cyan-300 text-[11px]">{col.type}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">{col.isNullable ? 'YES' : 'NO'}</td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">{col.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Indexes */}
            <div>
              <span className="text-[11px] font-semibold uppercase text-slate-400 mb-2 block">Performance Indexes & Partial Constraints</span>
              <div className="space-y-2">
                {selectedTable.indexes.map((idx, i) => (
                  <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
                    <div className="flex items-center space-x-2">
                      <span className="text-indigo-400 font-bold">{idx.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {idx.type} ON ({idx.columns.join(', ')})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans mt-1">{idx.purpose}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* DDL Code Snippet */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span>PostgreSQL 16+ Production DDL Generator</span>
              </span>
            </div>
            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 font-mono text-[11px] overflow-x-auto max-h-56">
              {postgresDdl.slice(0, 1400)}...
            </pre>
          </div>

        </div>

      </div>
    </div>
  );
};
