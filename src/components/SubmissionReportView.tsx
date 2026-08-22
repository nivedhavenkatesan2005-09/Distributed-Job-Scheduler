import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  ExternalLink, 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  Database, 
  Radio, 
  Workflow, 
  Server, 
  Terminal, 
  Cpu,
  Github,
  Globe,
  Download,
  Loader2,
  Sparkles
} from 'lucide-react';
import { exportSubmissionReportPDF } from '../utils/generatePdf';

export function SubmissionReportView() {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDirectDownloadPDF = async () => {
    try {
      setDownloading(true);
      setDownloadSuccess(false);
      
      // Generate clean vector PDF directly using jsPDF
      await exportSubmissionReportPDF();
      
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('PDF export error:', err);
      // Fallback to opening printable view or print dialog
      window.open('/submission-report', '_blank');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Banner with Print / Export Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Technical Submission Report</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Codity.AI Internship Assignment Submission
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Production-Inspired Distributed Job Scheduler Technical Package
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleDirectDownloadPDF}
            disabled={downloading}
            id="btn-download-pdf-direct"
            className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold text-sm shadow-lg shadow-emerald-900/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>PDF Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download .PDF</span>
              </>
            )}
          </button>
          <a
            href="/submission-report"
            target="_blank"
            rel="noreferrer"
            className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-cyan-400" />
            <span>Open Print Page</span>
          </a>
          <button
            onClick={handlePrint}
            id="btn-print-report"
            className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Dialog</span>
          </button>
        </div>
      </div>

      {/* Main Printable Document Sheet */}
      <div id="printable-submission-sheet" className="bg-slate-900 border border-slate-800 rounded-2xl p-8 md:p-12 shadow-2xl text-slate-200 space-y-10">
        
        {/* Document Header */}
        <div className="text-center pb-8 border-b border-slate-800">
          <div className="inline-block px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-3">
            Codity.AI Internship Technical Assignment
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            DISTRIBUTED JOB SCHEDULER
          </h2>
          <p className="text-base text-slate-400 mt-2 font-medium">
            Production-Inspired Asynchronous Background Job Scheduling Platform
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-5 rounded-xl border border-slate-800/80 text-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400 font-medium">Candidate:</span>
              <span className="text-white font-semibold">Nivedha Venkatesan</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400 font-medium">Candidate Email:</span>
              <span className="text-cyan-300 font-mono">nivedhavenkatesan2005@gmail.com</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Assignment:</span>
              <span className="text-slate-200">Backend & Distributed Systems</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400 font-medium">GitHub Repository:</span>
              <a 
                href="https://github.com/nivedhavenkatesan2005-09/Distributed-Job-Scheduler" 
                target="_blank" 
                rel="noreferrer"
                className="text-cyan-400 hover:underline inline-flex items-center gap-1 font-mono truncate max-w-[220px]"
              >
                <Github className="w-3 h-3 shrink-0" />
                <span>Distributed-Job-Scheduler</span>
              </a>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400 font-medium">Live Production URL:</span>
              <a 
                href="https://distributed-job-scheduler-3.onrender.com/" 
                target="_blank" 
                rel="noreferrer"
                className="text-cyan-400 hover:underline inline-flex items-center gap-1 font-mono truncate max-w-[220px]"
              >
                <Globe className="w-3 h-3 shrink-0" />
                <span>onrender.com</span>
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Stack:</span>
              <span className="text-slate-300">Node/TS • React • Prisma • SQLite • SSE</span>
            </div>
          </div>
        </div>

        {/* Section 1: Overview */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2.5 text-lg font-bold text-white border-b border-slate-800 pb-2">
            <span className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-mono">1</span>
            <h3>Project Overview</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            The <strong>Distributed Job Scheduler</strong> is a decoupled, asynchronous background processing platform engineered to coordinate distributed workloads across multi-worker fleets. The architecture prioritizes core distributed systems invariants: <strong>at-least-once execution with atomic CAS claiming</strong>, <strong>API-boundary idempotency</strong>, <strong>exponential backoff retry policies with jitter</strong>, <strong>Dead Letter Queue (DLQ) poison pill isolation</strong>, and <strong>real-time operational telemetry</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl">
              <div className="font-semibold text-xs text-cyan-300 mb-1">Atomic CAS Claiming</div>
              <p className="text-xs text-slate-400">Zero duplicate task acquisition via conditional SQL Compare-And-Swap updates.</p>
            </div>
            <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl">
              <div className="font-semibold text-xs text-cyan-300 mb-1">API Idempotency Key</div>
              <p className="text-xs text-slate-400">Unique index deduplication guarantees safe client retries without double enqueuing.</p>
            </div>
            <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl">
              <div className="font-semibold text-xs text-cyan-300 mb-1">Exponential Backoff & Jitter</div>
              <p className="text-xs text-slate-400">Dynamic future <code>runAt</code> scheduling prevents worker thread blocking and thundering herds.</p>
            </div>
            <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl">
              <div className="font-semibold text-xs text-cyan-300 mb-1">Real-Time Observability</div>
              <p className="text-xs text-slate-400">Server-Sent Events stream live job state transitions, Gantt timeline, and worker heartbeats.</p>
            </div>
          </div>
        </div>

        {/* Section 2: Architecture */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2.5 text-lg font-bold text-white border-b border-slate-800 pb-2">
            <span className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-mono">2</span>
            <h3>System Architecture & Lifecycle</h3>
          </div>
          
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-400 overflow-x-auto leading-relaxed">
{`+-----------------------------------------------------------------------------------+
| CLIENT LAYER: React Operations Dashboard  |  External REST Clients / SDKs         |
+----------------------------------------+------------------------------------------+
                                         | HTTP Requests / Idempotency-Key
                                         v
+-----------------------------------------------------------------------------------+
| API INGESTION: Express Gateway -> JWT Auth -> Idempotency Check -> Validation     |
+----------------------------------------+------------------------------------------+
                                         | Persists Job (State=QUEUED)
                                         v
+-----------------------------------------------------------------------------------+
| PRIMARY DATABASE (Prisma / SQLite / Postgres): ACID Store with Composite Indexes   |
+----------------------------------------+------------------------------------------+
                                         | Polled by Scheduler & Workers
                                         v
+-----------------------------------------------------------------------------------+
| SCHEDULER & WORKER FLEET ENGINE:                                                  |
|  * Scheduler Ticker: Promotes due delayed/cron jobs to QUEUED                     |
|  * Worker Fleet Mesh: Atomic CAS claim -> Concurrency Token -> Run -> Complete/DLQ |
|  * SSE Hub: Broadcasts real-time events to Dashboard                              |
+-----------------------------------------------------------------------------------+`}
          </div>

          <div className="space-y-1.5 text-xs text-slate-300">
            <p><strong>1. Ingestion:</strong> Client submits job with <code>Idempotency-Key</code> header; duplicates return cached results.</p>
            <p><strong>2. Promotion:</strong> Scheduler ticker promotes due scheduled jobs (<code>runAt &le; NOW</code>) to <code>QUEUED</code>.</p>
            <p><strong>3. Atomic CAS:</strong> Available worker executes <code>UPDATE Job SET state='CLAIMED', lockedBy=id WHERE state='QUEUED'</code>.</p>
            <p><strong>4. Execution:</strong> Worker executes task, writes execution logs, and maintains heartbeat.</p>
            <p><strong>5. Recovery / DLQ:</strong> Failures re-queue with exponential backoff; exhausted retries isolate to Dead Letter Queue.</p>
          </div>
        </div>

        {/* Section 3: REST API */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2.5 text-lg font-bold text-white border-b border-slate-800 pb-2">
            <span className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-mono">3</span>
            <h3>REST API Endpoint Reference</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
              <thead className="bg-slate-950 text-slate-300 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Method</th>
                  <th className="p-2.5">Endpoint</th>
                  <th className="p-2.5">Description</th>
                  <th className="p-2.5">Status Codes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                <tr className="hover:bg-slate-950/40">
                  <td className="p-2.5 text-emerald-400 font-bold">POST</td>
                  <td className="p-2.5 text-slate-200">/api/auth/login</td>
                  <td className="p-2.5 text-slate-400 font-sans">Authenticate & issue JWT token</td>
                  <td className="p-2.5 text-slate-300">200, 401</td>
                </tr>
                <tr className="hover:bg-slate-950/40">
                  <td className="p-2.5 text-emerald-400 font-bold">POST</td>
                  <td className="p-2.5 text-slate-200">/api/jobs</td>
                  <td className="p-2.5 text-slate-400 font-sans">Enqueue job (Supports <code>Idempotency-Key</code>)</td>
                  <td className="p-2.5 text-slate-300">201, 400, 409</td>
                </tr>
                <tr className="hover:bg-slate-950/40">
                  <td className="p-2.5 text-blue-400 font-bold">GET</td>
                  <td className="p-2.5 text-slate-200">/api/jobs</td>
                  <td className="p-2.5 text-slate-400 font-sans">Paginated job explorer with filtering</td>
                  <td className="p-2.5 text-slate-300">200</td>
                </tr>
                <tr className="hover:bg-slate-950/40">
                  <td className="p-2.5 text-emerald-400 font-bold">POST</td>
                  <td className="p-2.5 text-slate-200">/api/jobs/:id/retry</td>
                  <td className="p-2.5 text-slate-400 font-sans">Manually requeue failed/DLQ job</td>
                  <td className="p-2.5 text-slate-300">200, 404</td>
                </tr>
                <tr className="hover:bg-slate-950/40">
                  <td className="p-2.5 text-blue-400 font-bold">GET</td>
                  <td className="p-2.5 text-slate-200">/api/queues</td>
                  <td className="p-2.5 text-slate-400 font-sans">List queues & throughput statistics</td>
                  <td className="p-2.5 text-slate-300">200</td>
                </tr>
                <tr className="hover:bg-slate-950/40">
                  <td className="p-2.5 text-amber-400 font-bold">PATCH</td>
                  <td className="p-2.5 text-slate-200">/api/queues/:id/pause</td>
                  <td className="p-2.5 text-slate-400 font-sans">Toggle pause/resume on queue</td>
                  <td className="p-2.5 text-slate-300">200, 404</td>
                </tr>
                <tr className="hover:bg-slate-950/40">
                  <td className="p-2.5 text-emerald-400 font-bold">POST</td>
                  <td className="p-2.5 text-slate-200">/api/workers/scale</td>
                  <td className="p-2.5 text-slate-400 font-sans">Scale worker fleet capacity</td>
                  <td className="p-2.5 text-slate-300">200, 400</td>
                </tr>
                <tr className="hover:bg-slate-950/40">
                  <td className="p-2.5 text-blue-400 font-bold">GET</td>
                  <td className="p-2.5 text-slate-200">/api/events</td>
                  <td className="p-2.5 text-slate-400 font-sans">Server-Sent Events live telemetry stream</td>
                  <td className="p-2.5 text-slate-300">200 (Stream)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Design Decisions */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2.5 text-lg font-bold text-white border-b border-slate-800 pb-2">
            <span className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-mono">4</span>
            <h3>Architectural Trade-Off Analysis</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-1.5">
              <div className="font-bold text-slate-200">Relational DB vs Redis</div>
              <p className="text-slate-400">
                Relational DB provides strict ACID consistency, referential integrity for job execution history, and auditability across restarts. Mitigated polling latency via composite indexes on <code>(queueId, state, priority DESC, runAt ASC)</code>.
              </p>
            </div>
            <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-1.5">
              <div className="font-bold text-slate-200">Server-Sent Events (SSE) vs WebSockets</div>
              <p className="text-slate-400">
                SSE operates seamlessly over standard HTTP/2 with automatic browser reconnect and zero socket state overhead, making it ideal for unidirectional operational telemetry.
              </p>
            </div>
            <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-1.5">
              <div className="font-bold text-slate-200">Worker Pull (Polling + CAS) vs Push</div>
              <p className="text-slate-400">
                Worker pull provides natural backpressure—workers claim jobs only when concurrency slots are available, eliminating memory saturation under traffic spikes.
              </p>
            </div>
            <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-1.5">
              <div className="font-bold text-slate-200">Database runAt Scheduling vs In-Memory Sleep</div>
              <p className="text-slate-400">
                Calculated retry backoff timestamps are persisted directly in the database. Workers never sleep while holding concurrency slots, keeping execution threads 100% active.
              </p>
            </div>
          </div>
        </div>

        {/* Section 5: Advanced Distributed Features & Requirement Coverage */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2.5 text-lg font-bold text-white border-b border-slate-800 pb-2">
            <span className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-mono">5</span>
            <h3>Distributed Architecture Feature Implementation</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {[
              { 
                title: 'Workflow Dependencies (DAG Engine)', 
                badge: 'Topological Engine',
                desc: 'Multi-step Directed Acyclic Graph pipelines with Kahn’s cycle detection, branch concurrency, upstream output passing, and failure propagation.' 
              },
              { 
                title: 'Token Bucket Rate Limiting', 
                badge: 'Token Bucket',
                desc: 'Strict throughput regulation per queue with burst allowance, continuous token replenishment, and HTTP 429 backpressure handling.' 
              },
              { 
                title: 'Distributed Locking (Redlock Protocol)', 
                badge: 'Redlock + Leases',
                desc: 'Safe concurrent resource coordination featuring heartbeat lease auto-renewal, lease expiry safety, and monotonic fencing tokens to prevent split-brain.' 
              },
              { 
                title: 'Queue Sharding & Consistent Hashing', 
                badge: 'Consistent Hashing',
                desc: 'Hash ring partitioning with 100 virtual nodes per shard for uniform key distribution, zero downtime rebalancing, and horizontal scalability.' 
              },
              { 
                title: 'Event-Driven Execution (Pub/Sub Bus)', 
                badge: 'Event Bus',
                desc: 'Decoupled event broker with regex topic matching, event audit history, and automatic asynchronous job triggering upon incoming domain events.' 
              },
              { 
                title: 'Dual WebSocket & SSE Live Telemetry', 
                badge: 'Real-Time /ws',
                desc: 'Sub-50ms bidirectional WebSocket streaming with automatic Server-Sent Events fallback and heartbeat keep-alive connectivity.' 
              },
              { 
                title: 'Role-Based Access Control (RBAC)', 
                badge: 'RBAC Matrix',
                desc: 'Fine-grained permission matrices across ADMIN, OPERATOR, DEVELOPER, and VIEWER roles with endpoint middleware authorization.' 
              },
              { 
                title: 'AI-Powered Failure Summaries & Triage', 
                badge: 'Gemini AI',
                desc: 'Google Gemini integration analyzing stack traces, error messages, and task payloads to generate root-cause hypotheses and fix playbooks.' 
              }
            ].map((req, i) => (
              <div key={i} className="flex items-start space-x-2.5 p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-100">{req.title}</span>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono">
                      {req.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{req.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document Footer */}
        <div className="pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
          Prepared and submitted for the Codity.AI Internship Technical Assignment &bull; August 2026
        </div>

      </div>
    </div>
  );
}
