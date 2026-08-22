/**
 * Consistent Hashing & Queue Sharding Engine
 * Implements a Virtual Node (VNode) ring to partition job queues across
 * distributed shard clusters with minimal rehashing churn during scale-out.
 */

import { ShardNode, ShardPartitionRoute } from '../src/types';

class ConsistentHashRing {
  private shards: Map<string, ShardNode> = new Map();
  private vnodesMap: { hash: number; shardId: string; vnodeKey: string }[] = [];
  private readonly RING_SIZE = 1000000;

  constructor() {
    this.seedInitialShards();
    this.rebuildRing();
  }

  private seedInitialShards() {
    const initial: ShardNode[] = [
      {
        id: 'shard-us-east-1a',
        name: 'Partition Cluster US-East (Primary)',
        region: 'us-east-1',
        vnodesCount: 32,
        status: 'ACTIVE',
        assignedPartitions: 250,
        totalKeysRouted: 14200,
        currentJobsCount: 48,
        memoryMb: 512,
        cpuUsagePct: 24.5,
        ringAngleStartDeg: 0,
        ringAngleEndDeg: 90
      },
      {
        id: 'shard-us-east-1b',
        name: 'Partition Cluster US-East (Secondary)',
        region: 'us-east-1',
        vnodesCount: 32,
        status: 'ACTIVE',
        assignedPartitions: 250,
        totalKeysRouted: 13850,
        currentJobsCount: 42,
        memoryMb: 480,
        cpuUsagePct: 21.8,
        ringAngleStartDeg: 90,
        ringAngleEndDeg: 180
      },
      {
        id: 'shard-eu-west-1',
        name: 'Partition Cluster EU-West (Frankfurt)',
        region: 'eu-west-1',
        vnodesCount: 32,
        status: 'ACTIVE',
        assignedPartitions: 250,
        totalKeysRouted: 11920,
        currentJobsCount: 36,
        memoryMb: 440,
        cpuUsagePct: 18.2,
        ringAngleStartDeg: 180,
        ringAngleEndDeg: 270
      },
      {
        id: 'shard-ap-south-1',
        name: 'Partition Cluster AP-South (Mumbai)',
        region: 'ap-south-1',
        vnodesCount: 32,
        status: 'ACTIVE',
        assignedPartitions: 250,
        totalKeysRouted: 10450,
        currentJobsCount: 29,
        memoryMb: 390,
        cpuUsagePct: 15.6,
        ringAngleStartDeg: 270,
        ringAngleEndDeg: 360
      }
    ];

    for (const shard of initial) {
      this.shards.set(shard.id, shard);
    }
  }

  /**
   * MurmurHash3 / FNV-1a simple integer hash simulation (0 to RING_SIZE)
   */
  private hashString(key: string): number {
    let hash = 2166136261;
    for (let i = 0; i < key.length; i++) {
      hash ^= key.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash) % this.RING_SIZE;
  }

  private rebuildRing() {
    this.vnodesMap = [];
    const activeShards = Array.from(this.shards.values()).filter(s => s.status === 'ACTIVE');

    for (const shard of activeShards) {
      for (let i = 0; i < shard.vnodesCount; i++) {
        const vnodeKey = `${shard.id}#vn-${i}`;
        const hash = this.hashString(vnodeKey);
        this.vnodesMap.push({ hash, shardId: shard.id, vnodeKey });
      }
    }

    // Sort clockwise along ring
    this.vnodesMap.sort((a, b) => a.hash - b.hash);
  }

  /**
   * Route any partition key (e.g. tenant-id, customer_hash, job-id) to target shard node.
   */
  routeKey(partitionKey: string): ShardPartitionRoute {
    if (this.vnodesMap.length === 0) {
      this.rebuildRing();
    }

    const hashValue = this.hashString(partitionKey);
    
    // Find next clockwise virtual node (binary search or find)
    let selected = this.vnodesMap.find(vn => vn.hash >= hashValue);
    if (!selected) {
      // Wrap around to start of ring
      selected = this.vnodesMap[0];
    }

    const assignedShard = this.shards.get(selected.shardId)!;
    assignedShard.totalKeysRouted += 1;

    // Determine replication backup shards (next distinct shards on ring)
    const replicationShardIds: string[] = [];
    const shardList = Array.from(this.shards.keys());
    const currentIndex = shardList.indexOf(assignedShard.id);
    if (shardList.length > 1) {
      replicationShardIds.push(shardList[(currentIndex + 1) % shardList.length]);
    }
    if (shardList.length > 2) {
      replicationShardIds.push(shardList[(currentIndex + 2) % shardList.length]);
    }

    return {
      partitionKey,
      hashValue,
      assignedShardId: assignedShard.id,
      assignedShardName: assignedShard.name,
      vnodeToken: selected.vnodeKey,
      replicationShardIds
    };
  }

  getShards(): ShardNode[] {
    return Array.from(this.shards.values());
  }

  getRingTopology() {
    return {
      totalVNodes: this.vnodesMap.length,
      ringSize: this.RING_SIZE,
      vnodes: this.vnodesMap.slice(0, 48), // sample for visualizer
      shards: Array.from(this.shards.values())
    };
  }

  rebalanceShards(newShardCount: number) {
    const current = Array.from(this.shards.values());
    if (newShardCount > current.length) {
      const idx = current.length + 1;
      const newShard: ShardNode = {
        id: `shard-dynamic-0${idx}`,
        name: `Dynamic Elastic Shard 0${idx} (Auto-scaled)`,
        region: 'us-west-2',
        vnodesCount: 32,
        status: 'ACTIVE',
        assignedPartitions: 200,
        totalKeysRouted: 0,
        currentJobsCount: 0,
        memoryMb: 384,
        cpuUsagePct: 8.0,
        ringAngleStartDeg: 0,
        ringAngleEndDeg: 45
      };
      this.shards.set(newShard.id, newShard);
    } else if (newShardCount < current.length && current.length > 1) {
      const last = current[current.length - 1];
      this.shards.delete(last.id);
    }

    this.rebuildRing();
    return this.getShards();
  }
}

export const shardingEngine = new ConsistentHashRing();
