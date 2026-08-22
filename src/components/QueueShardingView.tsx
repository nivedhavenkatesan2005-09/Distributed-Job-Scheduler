import React, { useState } from 'react';
import {
  Layers,
  CircleDot,
  Compass,
  ArrowRight,
  Server,
  RefreshCw,
  Cpu,
  Database,
  Hash,
  Share2,
  CheckCircle2
} from 'lucide-react';
import { ShardNode, ShardPartitionRoute } from '../types';

interface QueueShardingViewProps {
  shards: ShardNode[];
  onRouteKey: (key: string) => Promise<ShardPartitionRoute>;
  onRebalanceShards: (count: number) => Promise<any>;
  userRole?: string;
}

export const QueueShardingView: React.FC<QueueShardingViewProps> = ({
  shards,
  onRouteKey,
  onRebalanceShards,
  userRole = 'admin'
}) => {
  const [testKey, setTestKey] = useState('tenant:stripe_acme_corp');
  const [routedResult, setRoutedResult] = useState<ShardPartitionRoute | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [customKeyPreset, setCustomKeyPreset] = useState<string>('');

  const canManage = userRole === 'admin';

  const handleRoute = async (keyToTest?: string) => {
    const target = keyToTest || testKey;
    if (!target) return;
    setIsRouting(true);
    try {
      const res = await onRouteKey(target);
      setRoutedResult(res);
    } finally {
      setIsRouting(false);
    }
  };

  const handleRebalance = async (newCount: number) => {
    setIsRebalancing(true);
    try {
      await onRebalanceShards(newCount);
      if (routedResult) {
        // Re-route current key to observe rebalance behavior
        await handleRoute(routedResult.partitionKey);
      }
    } finally {
      setIsRebalancing(false);
    }
  };

  const sampleKeys = [
    'tenant:stripe_acme_corp',
    'tenant:shopify_store_01',
    'user:usr_99812_eu',
    'order:ord_774912',
    'job:batch_export_2026',
    'device:iot_telemetry_hub_9'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                <span>Consistent Hash Ring & Queue Sharding</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Virtual Nodes (VNodes) Ring
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Horizontally partitions job queues across distributed cluster nodes using consistent hashing with minimal keyspace churn during scaling.
              </p>
            </div>
          </div>
        </div>

        {/* Rebalance Scale Controls */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">Cluster Nodes:</span>
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[3, 4, 5, 6].map((count) => (
              <button
                key={count}
                onClick={() => handleRebalance(count)}
                disabled={!canManage || isRebalancing}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  shards.length === count
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {count} Nodes
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Key Partition Router */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Share2 className="w-4 h-4 text-cyan-400" />
              <span>Interactive Partition Key Router</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter any tenant ID, customer key, or job hash to determine its exact ring coordinate and assigned physical shard.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {sampleKeys.slice(0, 4).map((k) => (
              <button
                key={k}
                onClick={() => {
                  setTestKey(k);
                  handleRoute(k);
                }}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-[11px] font-mono transition-colors"
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Hash className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={testKey}
              onChange={(e) => setTestKey(e.target.value)}
              placeholder="e.g. tenant-acme-corp or user-id-8841"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            id="btn-route-partition-key"
            onClick={() => handleRoute()}
            disabled={isRouting || !testKey}
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-cyan-500/20 transition-colors"
          >
            <span>Route Key</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Route Result Card */}
        {routedResult && (
          <div className="bg-cyan-950/30 border border-cyan-800/50 p-4 rounded-xl space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-400">
                  Consistent Hashing Target
                </span>
                <div className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <span className="font-mono text-cyan-300">"{routedResult.partitionKey}"</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-emerald-400">{routedResult.assignedShardName}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Hash Value: </span>
                  <span className="font-mono font-bold text-cyan-300">{routedResult.hashValue}</span>
                </div>
                <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[11px]">VNode Token: </span>
                  <span className="font-mono text-indigo-300">{routedResult.vnodeToken}</span>
                </div>
              </div>
            </div>

            {/* Replication Shards */}
            <div className="text-[11px] text-slate-400 flex items-center space-x-2 pt-1 border-t border-cyan-900/40">
              <span>Replication Replica Clusters:</span>
              <div className="flex items-center space-x-1.5">
                {routedResult.replicationShardIds.map((rid) => (
                  <span key={rid} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 font-mono text-[10px]">
                    {rid}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Visual Hash Ring & Shards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Ring Graphic */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 flex flex-col items-center justify-center text-center">
          <h3 className="text-sm font-bold text-slate-200">Virtual Nodes Topology Ring</h3>
          
          <div className="relative w-56 h-56 flex items-center justify-center">
            {/* Outer Ring Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="112"
                cy="112"
                r="90"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-slate-800"
              />
              {/* Colored Segments for each physical shard */}
              {shards.map((shard, index) => {
                const totalShards = shards.length;
                const strokeDash = (2 * Math.PI * 90) / totalShards;
                const colors = ['#06b6d4', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
                const color = colors[index % colors.length];

                return (
                  <circle
                    key={shard.id}
                    cx="112"
                    cy="112"
                    r="90"
                    stroke={color}
                    strokeWidth="8"
                    strokeDasharray={`${strokeDash - 6} 6`}
                    strokeDashoffset={-index * strokeDash}
                    fill="transparent"
                    className="transition-all duration-700"
                  />
                );
              })}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-100 font-mono">
                {shards.reduce((acc, s) => acc + s.vnodesCount, 0)}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Virtual VNodes
              </span>
              <span className="text-[11px] text-cyan-400 font-bold mt-1">
                {shards.length} Shard Clusters
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 max-w-xs">
            Clockwise hash routing evenly distributes incoming jobs across all physical partitions with zero lock contention.
          </div>
        </div>

        {/* Shard Node Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {shards.map((shard, i) => {
            const colors = [
              'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
              'border-indigo-500/40 text-indigo-400 bg-indigo-500/10',
              'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
              'border-amber-500/40 text-amber-400 bg-amber-500/10',
              'border-pink-500/40 text-pink-400 bg-pink-500/10',
              'border-purple-500/40 text-purple-400 bg-purple-500/10'
            ];
            const badgeClass = colors[i % colors.length];

            return (
              <div
                key={shard.id}
                className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                      Shard #{i + 1} ({shard.region})
                    </span>
                    <h4 className="text-xs font-bold text-slate-100 font-mono">
                      {shard.id}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-emerald-400 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{shard.status}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400 text-[10px]">Total Keys Routed</span>
                    <div className="text-slate-200 font-bold font-mono mt-0.5">
                      {shard.totalKeysRouted.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400 text-[10px]">Active Jobs</span>
                    <div className="text-slate-200 font-bold font-mono mt-0.5">
                      {shard.currentJobsCount}
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400 text-[10px]">VNodes Weight</span>
                    <div className="text-slate-200 font-bold font-mono mt-0.5">
                      {shard.vnodesCount} vnodes
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400 text-[10px]">Memory / CPU</span>
                    <div className="text-slate-200 font-bold font-mono mt-0.5">
                      {shard.memoryMb}MB • {shard.cpuUsagePct}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
