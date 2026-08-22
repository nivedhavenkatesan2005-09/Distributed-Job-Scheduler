/**
 * Distributed Lock Manager (DLM) - Redlock & Fencing Token Engine
 * Provides mutual exclusion across distributed workers with lease timeouts,
 * monotonic fencing tokens to prevent split-brain / out-of-order storage writes,
 * and automatic heartbeat renewal.
 */

import { DistributedLock } from '../src/types';
import { db } from './db';

class DistributedLockManager {
  private locks: Map<string, DistributedLock> = new Map();
  private monotonicCounter: number = 1000;
  private contentionLog: { key: string; requestedBy: string; deniedAt: string; heldBy: string }[] = [];

  constructor() {
    this.seedInitialLocks();
  }

  private seedInitialLocks() {
    const now = Date.now();
    const initial: DistributedLock[] = [
      {
        id: 'lock-1',
        key: 'resource:billing:daily_invoice_generation',
        holderWorkerId: 'w-01',
        holderWorkerName: 'worker-node-alpha-01',
        fencingToken: ++this.monotonicCounter,
        acquiredAt: new Date(now - 12000).toISOString(),
        expiresAt: new Date(now + 48000).toISOString(),
        ttlMs: 60000,
        renewCount: 1,
        metadata: { resource: 'billing_db', operation: 'aggregate_ledger' },
        status: 'ACQUIRED'
      },
      {
        id: 'lock-2',
        key: 'resource:warehouse:s3_parquet_compact',
        holderWorkerId: 'w-02',
        holderWorkerName: 'worker-node-alpha-02',
        fencingToken: ++this.monotonicCounter,
        acquiredAt: new Date(now - 5000).toISOString(),
        expiresAt: new Date(now + 25000).toISOString(),
        ttlMs: 30000,
        renewCount: 0,
        metadata: { partition: '2026-08', bucket: 'prod-datalake' },
        status: 'ACQUIRED'
      },
      {
        id: 'lock-3',
        key: 'resource:search:reindex_vector_embeddings',
        holderWorkerId: 'w-03',
        holderWorkerName: 'worker-node-beta-01',
        fencingToken: ++this.monotonicCounter,
        acquiredAt: new Date(now - 45000).toISOString(),
        expiresAt: new Date(now + 15000).toISOString(),
        ttlMs: 60000,
        renewCount: 2,
        metadata: { collection: 'product_catalog', shards: 8 },
        status: 'RENEWED'
      }
    ];

    for (const lock of initial) {
      this.locks.set(lock.key, lock);
    }
  }

  /**
   * Acquire a lease-based distributed lock with a monotonic fencing token.
   */
  acquire(params: {
    key: string;
    workerId: string;
    workerName?: string;
    ttlMs?: number;
    metadata?: Record<string, any>;
  }): { success: boolean; lock?: DistributedLock; error?: string; fencingToken?: number } {
    const { key, workerId, workerName = `worker-${workerId}`, ttlMs = 30000, metadata } = params;
    const now = Date.now();

    // Check if lock exists and is active
    const existing = this.locks.get(key);
    if (existing && existing.status !== 'RELEASED' && existing.status !== 'EXPIRED') {
      const expiresTime = new Date(existing.expiresAt).getTime();
      if (expiresTime > now) {
        // Contention! Denied
        this.contentionLog.unshift({
          key,
          requestedBy: workerName,
          deniedAt: new Date().toISOString(),
          heldBy: existing.holderWorkerName
        });
        if (this.contentionLog.length > 50) this.contentionLog.pop();

        return {
          success: false,
          error: `Lock contention: key "${key}" is currently leased by ${existing.holderWorkerName} (Fencing Token #${existing.fencingToken}, expires in ${Math.round((expiresTime - now) / 1000)}s)`
        };
      }
    }

    // Grant lock with monotonic fencing token
    const fencingToken = ++this.monotonicCounter;
    const lock: DistributedLock = {
      id: `lock-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      key,
      holderWorkerId: workerId,
      holderWorkerName: workerName,
      fencingToken,
      acquiredAt: new Date(now).toISOString(),
      expiresAt: new Date(now + ttlMs).toISOString(),
      ttlMs,
      renewCount: 0,
      metadata: metadata || {},
      status: 'ACQUIRED'
    };

    this.locks.set(key, lock);

    db.emitEvent({
      id: 'evt-' + Date.now(),
      type: 'queue:updated',
      timestamp: new Date().toISOString(),
      data: { lockId: lock.id, key, fencingToken, holderWorkerName: workerName },
      message: `Distributed lock "${key}" granted to ${workerName} [Fencing Token #${fencingToken}]`
    });

    return { success: true, lock, fencingToken };
  }

  /**
   * Renew lock lease (Heartbeat extension)
   */
  renew(params: {
    key: string;
    workerId: string;
    fencingToken: number;
    extendTtlMs?: number;
  }): { success: boolean; lock?: DistributedLock; error?: string } {
    const { key, workerId, fencingToken, extendTtlMs = 30000 } = params;
    const lock = this.locks.get(key);

    if (!lock) {
      return { success: false, error: `Lock "${key}" does not exist` };
    }

    if (lock.fencingToken !== fencingToken || lock.holderWorkerId !== workerId) {
      return {
        success: false,
        error: `Fencing token mismatch: lock held by another leaseholder (Provided #${fencingToken}, Current #${lock.fencingToken})`
      };
    }

    const now = Date.now();
    lock.expiresAt = new Date(now + extendTtlMs).toISOString();
    lock.renewCount += 1;
    lock.status = 'RENEWED';

    return { success: true, lock };
  }

  /**
   * Explicitly release lock lease
   */
  release(params: {
    key: string;
    workerId: string;
    fencingToken?: number;
  }): { success: boolean; error?: string } {
    const { key, workerId, fencingToken } = params;
    const lock = this.locks.get(key);

    if (!lock) {
      return { success: false, error: `Lock "${key}" not found` };
    }

    if (fencingToken && lock.fencingToken !== fencingToken) {
      return {
        success: false,
        error: `Cannot release lock: stale fencing token #${fencingToken} (active is #${lock.fencingToken})`
      };
    }

    lock.status = 'RELEASED';
    this.locks.delete(key);

    db.emitEvent({
      id: 'evt-' + Date.now(),
      type: 'queue:updated',
      timestamp: new Date().toISOString(),
      data: { key, releasedBy: workerId },
      message: `Distributed lock "${key}" explicitly released by worker ${workerId}`
    });

    return { success: true };
  }

  /**
   * Sweep expired lock leases
   */
  reapExpired(): number {
    const now = Date.now();
    let reapedCount = 0;

    for (const [key, lock] of this.locks.entries()) {
      if (lock.status !== 'RELEASED') {
        const expiresTime = new Date(lock.expiresAt).getTime();
        if (expiresTime <= now) {
          lock.status = 'EXPIRED';
          this.locks.delete(key);
          reapedCount++;
          console.log(`[DLM] Expired lease for key "${key}" reaped automatically.`);
        }
      }
    }

    return reapedCount;
  }

  getAll(): DistributedLock[] {
    const now = Date.now();
    return Array.from(this.locks.values()).map(lock => {
      const remainingMs = Math.max(0, new Date(lock.expiresAt).getTime() - now);
      return {
        ...lock,
        remainingTtlMs: remainingMs
      };
    });
  }

  getContentionLog() {
    return this.contentionLog;
  }
}

export const lockManager = new DistributedLockManager();
