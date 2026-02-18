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
    // Force IPv4 to avoid localhost resolution issues with tunnels
    family: 4,
    keepAlive: 10000,
    enableOfflineQueue: false, // Fail immediately if not connected
    commandTimeout: 3000, // Timeout commands after 3s
    tls: config.tls ? {
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined, // Skip hostname verification
    } : undefined,
    retryStrategy: (times) => {
      if (times > 3) return null; // stop retrying after 3 attempts
      return Math.min(times * 50, 2000);
    },
    connectTimeout: 5000,
  });

  console.log(`[Redis ${config.id}] Connecting to ${config.host}:${config.port} (TLS: ${!!config.tls})...`);

  // Attach a permanent error listener to prevent "Unhandled error event"
  redis.on('error', (err) => {
    console.warn(`[Redis ${config.id}] Error: ${err.message}`);
  });
  
  redis.on('connect', () => console.log(`[Redis ${config.id}] Socket connected`));
  redis.on('ready', () => console.log(`[Redis ${config.id}] Ready`));

  redisInstances.set(config.id, redis);
  
  return new Promise((resolve, reject) => {
    const onReady = () => {
      resolve(redis);
    };

    const onError = (err: any) => {
      // If initial connection fails, clean up and reject
      redisInstances.delete(config.id);
      redis.disconnect(); // Stop retrying
      reject(err);
    };

    redis.once('ready', onReady);
    redis.once('error', onError);
  });
}

export async function closeRedisConnection(id: string) {
  const redis = redisInstances.get(id);
  if (redis) {
    await redis.quit().catch(() => {});
    redisInstances.delete(id);
  }
}
