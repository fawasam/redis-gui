import Redis from 'ioredis';

// Use a global variable to persist connections across hot-reloads in development
const globalForRedis = global as unknown as {
  redisInstances: Map<string, Redis>;
};

export const redisInstances = globalForRedis.redisInstances || new Map<string, Redis>();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redisInstances = redisInstances;
}

export type ConnectionConfig = {
  id: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  db?: number;
  tls?: boolean;
};

export async function getRedisConnection(config: ConnectionConfig): Promise<Redis> {
  const existing = redisInstances.get(config.id);
  if (existing && existing.status === 'ready') {
    return existing;
  }

  // Close old connection if it exists but isn't ready
  if (existing) {
    await existing.quit().catch(() => {});
  }

  const redis = new Redis({
    host: config.host,
    port: config.port,
    username: config.username || undefined,
    password: config.password || undefined,
    db: config.db || 0,
    tls: config.tls ? {} : undefined,
    retryStrategy: (times) => {
      if (times > 3) return null; // stop retrying after 3 attempts
      return Math.min(times * 50, 2000);
    },
    connectTimeout: 5000,
  });

  redisInstances.set(config.id, redis);
  
  return new Promise((resolve, reject) => {
    redis.once('ready', () => resolve(redis));
    redis.once('error', (err) => {
      redisInstances.delete(config.id);
      reject(err);
    });
  });
}

export async function closeRedisConnection(id: string) {
  const redis = redisInstances.get(id);
  if (redis) {
    await redis.quit().catch(() => {});
    redisInstances.delete(id);
  }
}
