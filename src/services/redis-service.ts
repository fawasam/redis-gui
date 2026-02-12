import { getRedisConnection, ConnectionConfig } from '@/lib/redis-manager';
import db from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import Redis from 'ioredis';

export class RedisService {
  private static async getConfig(id: string): Promise<ConnectionConfig> {
    const config = db.prepare('SELECT * FROM connections WHERE id = ?').get(id) as any;
    if (!config) throw new Error('Connection not found');

    return {
      id: config.id,
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password ? decrypt(config.password) : undefined,
      db: config.db,
      tls: !!config.tls,
    };
  }

  static async getConnection(id: string): Promise<Redis> {
    const config = await this.getConfig(id);
    return await getRedisConnection(config);
  }

  static async scanKeys(id: string, cursor: string = '0', pattern: string = '*', count: number = 100, type?: string) {
    const redis = await this.getConnection(id);
    
    // Redis SCAN doesn't natively filter by type efficiently in the command itself 
    // without potentially scanning many keys. ioredis can't do it directly in SCAN.
    // However, some versions support TYPE.
    
    const scanArgs: (string | number)[] = ['MATCH', pattern, 'COUNT', count];
    if (type && type !== 'all') {
      scanArgs.push('TYPE', type);
    }

    const [newCursor, keys] = await redis.scan(cursor, ...(scanArgs as any));
    
    // Parallel fetch types for found keys to display in UI
    const pipeline = redis.pipeline();
    keys.forEach(key => pipeline.type(key));
    const types = await pipeline.exec();

    const results = keys.map((key, index) => ({
      key,
      type: types ? (types[index][1] as string) : 'unknown'
    }));

    return { cursor: newCursor, keys: results };
  }

  static async getKeyDetails(id: string, key: string) {
    const redis = await this.getConnection(id);
    const type = await redis.type(key);
    const ttl = await redis.ttl(key);
    const pttl = await redis.pttl(key);
    
    let value: any = null;
    let size: number = 0;

    switch (type) {
      case 'string':
        value = await redis.get(key);
        size = value?.length || 0;
        break;
      case 'hash':
        value = await redis.hgetall(key);
        size = await redis.hlen(key);
        break;
      case 'list':
        value = await redis.lrange(key, 0, 99); // limited preview
        size = await redis.llen(key);
        break;
      case 'set':
        value = await redis.smembers(key);
        size = await redis.scard(key);
        break;
      case 'zset':
        value = await redis.zrange(key, 0, 99, 'WITHSCORES');
        size = await redis.zcard(key);
        // format zset better
        const formattedZset = [];
        for (let i = 0; i < value.length; i += 2) {
          formattedZset.push({ value: value[i], score: value[i+1] });
        }
        value = formattedZset;
        break;
      case 'stream':
        value = await redis.xrevrange(key, '+', '-', 'COUNT', 50);
        size = await redis.xlen(key);
        break;
    }

    return { key, type, ttl, pttl, value, size };
  }

  static async deleteKey(id: string, key: string) {
    const redis = await this.getConnection(id);
    return await redis.del(key);
  }

  static async updateString(id: string, key: string, value: string, ttl?: number) {
    const redis = await this.getConnection(id);
    if (ttl && ttl > 0) {
      return await redis.set(key, value, 'EX', ttl);
    }
    return await redis.set(key, value);
  }

  static async executeCommand(id: string, command: string, args: string[]) {
    const redis = await this.getConnection(id);
    // @ts-ignore
    return await redis.call(command, ...args);
  }
}
