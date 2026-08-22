/**
 * Token Bucket & Leaky Bucket Rate Limiter Engine
 * Enforces per-queue and global ingestion/execution throughput limits,
 * handles token refill algorithms with sub-second precision, and returns
 * HTTP 429 Retry-After metadata when quotas are exhausted.
 */

import { TokenBucketStatus } from '../src/types';
import { db } from './db';

interface BucketState {
  queueId: string;
  capacity: number;
  tokens: number;
  refillRateTokensPerSec: number;
  lastRefillTimestamp: number;
  throttledRequestsCount: number;
}

class RateLimiterEngine {
  private buckets: Map<string, BucketState> = new Map();

  constructor() {
    this.syncWithQueues();
  }

  private syncWithQueues() {
    for (const queue of db.queues.values()) {
      if (!this.buckets.has(queue.id)) {
        const rpm = queue.rateLimitPerMin || 300;
        const capacity = Math.max(20, Math.round(rpm / 2)); // burst capacity
        const refillRate = rpm / 60; // tokens per second
        this.buckets.set(queue.id, {
          queueId: queue.id,
          capacity,
          tokens: capacity,
          refillRateTokensPerSec: refillRate,
          lastRefillTimestamp: Date.now(),
          throttledRequestsCount: 0
        });
      }
    }
  }

  /**
   * Refill tokens based on elapsed wall-clock time
   */
  private refillBucket(bucket: BucketState, now: number) {
    const elapsedSeconds = (now - bucket.lastRefillTimestamp) / 1000;
    if (elapsedSeconds > 0) {
      const tokensToAdd = elapsedSeconds * bucket.refillRateTokensPerSec;
      bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
      bucket.lastRefillTimestamp = now;
    }
  }

  /**
   * Attempt to consume tokens from the queue's token bucket
   */
  consume(queueId: string, tokensRequired: number = 1): {
    allowed: boolean;
    remainingTokens: number;
    retryAfterMs?: number;
    capacity: number;
  } {
    this.syncWithQueues();
    const now = Date.now();
    let bucket = this.buckets.get(queueId);

    if (!bucket) {
      const queue = db.queues.get(queueId);
      const rpm = queue?.rateLimitPerMin || 300;
      bucket = {
        queueId,
        capacity: Math.max(20, Math.round(rpm / 2)),
        tokens: Math.max(20, Math.round(rpm / 2)),
        refillRateTokensPerSec: rpm / 60,
        lastRefillTimestamp: now,
        throttledRequestsCount: 0
      };
      this.buckets.set(queueId, bucket);
    }

    this.refillBucket(bucket, now);

    if (bucket.tokens >= tokensRequired) {
      bucket.tokens -= tokensRequired;
      return {
        allowed: true,
        remainingTokens: Math.floor(bucket.tokens),
        capacity: bucket.capacity
      };
    } else {
      // Calculate how long until 1 token is available
      const deficit = tokensRequired - bucket.tokens;
      const waitSeconds = Math.ceil(deficit / bucket.refillRateTokensPerSec);
      bucket.throttledRequestsCount += 1;

      return {
        allowed: false,
        remainingTokens: Math.max(0, Math.floor(bucket.tokens)),
        retryAfterMs: Math.max(1000, waitSeconds * 1000),
        capacity: bucket.capacity
      };
    }
  }

  updateQueueLimit(queueId: string, rateLimitPerMin: number) {
    const queue = db.queues.get(queueId);
    if (queue) {
      queue.rateLimitPerMin = rateLimitPerMin;
    }

    const capacity = Math.max(20, Math.round(rateLimitPerMin / 2));
    const refillRate = rateLimitPerMin / 60;
    const bucket = this.buckets.get(queueId);

    if (bucket) {
      bucket.capacity = capacity;
      bucket.refillRateTokensPerSec = refillRate;
      bucket.tokens = Math.min(capacity, bucket.tokens);
    } else {
      this.buckets.set(queueId, {
        queueId,
        capacity,
        tokens: capacity,
        refillRateTokensPerSec: refillRate,
        lastRefillTimestamp: Date.now(),
        throttledRequestsCount: 0
      });
    }
  }

  getBucketStatus(queueId: string): TokenBucketStatus | null {
    this.syncWithQueues();
    const bucket = this.buckets.get(queueId);
    const queue = db.queues.get(queueId);
    if (!bucket || !queue) return null;

    this.refillBucket(bucket, Date.now());

    return {
      queueId: queue.id,
      queueName: queue.name,
      rateLimitPerMin: queue.rateLimitPerMin || 300,
      burstCapacity: bucket.capacity,
      availableTokens: Math.floor(bucket.tokens),
      fillPercentage: Math.min(100, Math.round((bucket.tokens / bucket.capacity) * 100)),
      refillRateTokensPerSec: parseFloat(bucket.refillRateTokensPerSec.toFixed(2)),
      lastRefillTimestamp: bucket.lastRefillTimestamp,
      throttledRequestsCount: bucket.throttledRequestsCount,
      windowResetInSeconds: Math.ceil((bucket.capacity - bucket.tokens) / bucket.refillRateTokensPerSec)
    };
  }

  getAllStatuses(): TokenBucketStatus[] {
    this.syncWithQueues();
    return Array.from(this.buckets.keys())
      .map(qid => this.getBucketStatus(qid))
      .filter((s): s is TokenBucketStatus => s !== null);
  }
}

export const rateLimiter = new RateLimiterEngine();
