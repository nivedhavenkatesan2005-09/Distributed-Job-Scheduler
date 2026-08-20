import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Search,
  Trash2,
  Pause,
  Play,
  Download,
  Filter,
  Layers
} from 'lucide-react';
import { SystemEvent } from '../types';

interface LiveLogStreamProps {
  events: SystemEvent[];
  onClearEvents: () => void;
}

export const LiveLogStream: React.FC<LiveLogStreamProps> = ({ events, onClearEvents }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, autoScroll]);

  const filteredEvents = events.filter((evt) => {
    if (levelFilter === 'ERROR' && !evt.type.includes('fail') && !evt.type.includes('dlq') && !evt.type.includes('stalled')) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        evt.message.toLowerCase().includes(q) ||
        evt.type.toLowerCase().includes(q) ||
        JSON.stringify(evt.data).toLowerCase().includes(q)
      );
    }
    return true;
  });

  const downloadLogs = () => {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scheduler-logs-${Date.now()}.json`;
    a.click();
  };

  const getEventBadge = (type: string) => {
    if (type.includes('completed')) {
      return <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400">COMPLETED</span>;
    }
    if (type.includes('dlq') || type.includes('stalled')) {
      return <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 font-bold">CRITICAL</span>;
    }
    if (type.includes('retrying')) {
      return <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400">RETRY</span>;
    }
    if (type.includes('started')) {
      return <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400">STARTED</span>;
    }
    return <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">INFO</span>;
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-slate-100 text-sm">Real-Time Cluster Event Stream</span>
          <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
            {events.length} events
          </span>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center flex-wrap gap-2">
          
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="ERROR">Errors / Failures Only</option>
          </select>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
              autoScroll
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {autoScroll ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{autoScroll ? 'Auto-Scroll' : 'Paused'}</span>
          </button>

          <button
            onClick={downloadLogs}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
            title="Download JSON logs"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onClearEvents}
            className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 rounded-lg border border-slate-700 transition-colors"
            title="Clear terminal stream"
          >
            <Trash2 className="w-4 h-4" />
          </button>

        </div>
      </div>

      {/* Terminal Output Window */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] h-[550px] overflow-y-auto space-y-1.5 shadow-inner">
        {filteredEvents.length === 0 ? (
          <div className="text-slate-600 text-center py-24">No live events captured yet.</div>
        ) : (
          filteredEvents.map((evt, idx) => (
            <div key={evt.id || idx} className="flex items-start space-x-2.5 hover:bg-slate-900/60 p-1 rounded transition-colors">
              <span className="text-slate-500 whitespace-nowrap">
                {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
              </span>
              
              {getEventBadge(evt.type)}

              <span className="text-slate-400 font-bold whitespace-nowrap text-[10px] uppercase">
                [{evt.type}]
              </span>

              <span className="text-slate-200 flex-1 break-all">
                {evt.message}
              </span>

              {evt.data && Object.keys(evt.data).length > 0 && (
                <span className="text-slate-500 text-[10px] hidden md:inline truncate max-w-xs">
                  {JSON.stringify(evt.data)}
                </span>
              )}
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};
