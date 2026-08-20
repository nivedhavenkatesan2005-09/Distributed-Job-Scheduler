import React, { useState } from 'react';
import {
  FileCode2,
  Play,
  Copy,
  CheckCircle,
  Clock,
  Sparkles,
  Send,
  Code
} from 'lucide-react';
import { apiDocumentation } from '../data/mock-and-docs';

export const ApiDocsView: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState(apiDocumentation[0]);
  const [testRequestBody, setTestRequestBody] = useState(
    JSON.stringify(apiDocumentation[0].requestBody || {}, null, 2)
  );
  const [testResponse, setTestResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const handleSelectEndpoint = (ep: typeof apiDocumentation[0]) => {
    setSelectedEndpoint(ep);
    setTestRequestBody(JSON.stringify(ep.requestBody || {}, null, 2));
    setTestResponse(null);
    setLatencyMs(null);
  };

  const handleExecuteRequest = async () => {
    setIsLoading(true);
    setTestResponse(null);
    const start = performance.now();

    try {
      let url = selectedEndpoint.path;
      // Replace path parameters if needed
      url = url.replace(':id', 'job-sample-1');

      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `req_${Date.now()}`
        }
      };

      if (selectedEndpoint.method !== 'GET' && selectedEndpoint.method !== 'DELETE') {
        options.body = testRequestBody;
      }

      const res = await fetch(url, options);
      const data = await res.json();
      const end = performance.now();

      setLatencyMs(Math.round(end - start));
      setTestResponse({ status: res.status, data });
    } catch (err: any) {
      setLatencyMs(Math.round(performance.now() - start));
      setTestResponse({ error: err?.message || 'Network request failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'GET':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400">GET</span>;
      case 'POST':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400">POST</span>;
      case 'PUT':
      case 'PATCH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400">{method}</span>;
      case 'DELETE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400">DELETE</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">{method}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
          <FileCode2 className="w-5 h-5 text-indigo-400" />
          <span>Interactive REST API Documentation & Live Tester</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Explore complete endpoint specifications with live interactive execution against the local backend engine.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Endpoint List */}
        <div className="lg:col-span-1 space-y-2">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Endpoints ({apiDocumentation.length})</span>
          <div className="space-y-1 max-h-[650px] overflow-y-auto pr-1">
            {apiDocumentation.map((ep, idx) => {
              const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center space-x-2.5 ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {getMethodBadge(ep.method)}
                  <div className="truncate flex-1">
                    <div className="font-mono text-[11px] truncate text-slate-200">{ep.path}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{ep.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Endpoint Detail & Live Tester */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-5 text-xs">
            
            {/* Header info */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  {getMethodBadge(selectedEndpoint.method)}
                  <span className="font-mono font-bold text-sm text-slate-100">{selectedEndpoint.path}</span>
                </div>
                <p className="text-slate-400 mt-1">{selectedEndpoint.description}</p>
              </div>

              <button
                onClick={handleExecuteRequest}
                disabled={isLoading}
                className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-semibold shadow-md shadow-indigo-600/30 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Executing...' : 'Try It Out'}</span>
              </button>
            </div>

            {/* Request Body (if POST/PUT) */}
            {selectedEndpoint.method !== 'GET' && selectedEndpoint.method !== 'DELETE' && (
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Request Body (JSON)</span>
                <textarea
                  rows={6}
                  value={testRequestBody}
                  onChange={(e) => setTestRequestBody(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-cyan-300 font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Live Response Panel */}
            {testResponse && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Live API Response</span>
                  <div className="flex items-center space-x-2 font-mono text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      HTTP {testResponse.status || 200} OK
                    </span>
                    {latencyMs !== null && (
                      <span className="text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{latencyMs}ms</span>
                      </span>
                    )}
                  </div>
                </div>

                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-emerald-300 font-mono text-[11px] overflow-x-auto max-h-64">
                  {JSON.stringify(testResponse.data || testResponse, null, 2)}
                </pre>
              </div>
            )}

            {/* Expected Schema Spec */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Schema Example Response</span>
              <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-400 font-mono text-[11px] overflow-x-auto max-h-40">
                {JSON.stringify(selectedEndpoint.responseExample, null, 2)}
              </pre>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
