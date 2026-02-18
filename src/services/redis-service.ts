import { getRedisConnection, ConnectionConfig } from '@/lib/redis-manager';
import connectDB from '@/lib/mongodb';
import Connection from '@/models/Connection';
import { decrypt } from '@/lib/encryption';
import Redis from 'ioredis';

export class RedisService {
  private static async getConfig(id: string): Promise<ConnectionConfig> {
    await connectDB();
    const config = await Connection.findById(id).lean() as any;
    if (!config) throw new Error('Connection not found');

    return {
      id: config._id.toString(),
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

  static async getStats(id: string) {
    const redis = await this.getConnection(id);
    const info = await redis.info();
    const commandStatsInfo = await redis.info('commandstats');
    const clientsData = await redis.call('CLIENT', 'LIST');
    
    // Parse INFO command output
    const infoLines = info.split('\r\n');
    const infoData: any = {};
    let section = '';
    
    for(const line of infoLines) {
      if(line.startsWith('#')) {
        section = line.substring(2).trim().toLowerCase();
        infoData[section] = {};
      } else if(line.includes(':')) {
        const parts = line.split(':');
        const key = parts[0];
        const value = parts.slice(1).join(':'); // Handle values that might contain colons
        
        if(section && infoData[section]) {
          infoData[section][key] = value.trim();
        } else {
          infoData[key] = value.trim();
        }
      }
    }

    // Parse COMMANDSTATS
    const cmdLines = commandStatsInfo.split('\r\n');
    const commandStats: any[] = [];
    for(const line of cmdLines) {
      if(line.includes(':')) {
        // cmdstat_get:calls=1,usec=2,usec_per_call=2.00
        const [key, val] = line.split(':');
        const cmdName = key.replace('cmdstat_', '');
        const stats: any = { name: cmdName };
        val.split(',').forEach(part => {
          const [k, v] = part.split('=');
          stats[k] = parseFloat(v);
        });
        commandStats.push(stats);
      }
    }
    // Sort by calls
    commandStats.sort((a, b) => b.calls - a.calls);

    // Parse CLIENT LIST output
    // id=12 addr=127.0.0.1:56324 ...
    // Some redis versions might return different formats, but key=value is standard
    const clients = (clientsData as string).split('\n').filter(line => line.trim().length > 0).map(line => {
      const clientObj: any = {};
      line.split(' ').forEach(part => {
        const [key, val] = part.split('=');
        if(key && val) clientObj[key] = val;
      });
      return clientObj;
    });

    return {
      info: infoData,
      commandStats,
      clients
    };
  }

  static async updateHash(id: string, key: string, field: string, value: string) {
    const redis = await this.getConnection(id);
    return await redis.hset(key, field, value);
  }

  static async deleteHashField(id: string, key: string, field: string) {
    const redis = await this.getConnection(id);
    return await redis.hdel(key, field);
  }

  static async updateList(id: string, key: string, index: number, value: string) {
    const redis = await this.getConnection(id);
    return await redis.lset(key, index, value);
  }

  static async addToList(id: string, key: string, value: string) {
    const redis = await this.getConnection(id);
    return await redis.rpush(key, value);
  }

  static async removeListValue(id: string, key: string, value: string, count: number = 1) {
    const redis = await this.getConnection(id);
    return await redis.lrem(key, count, value);
  }

  static async addSetMember(id: string, key: string, member: string) {
    const redis = await this.getConnection(id);
    return await redis.sadd(key, member);
  }

  static async removeSetMember(id: string, key: string, member: string) {
    const redis = await this.getConnection(id);
    return await redis.srem(key, member);
  }

  static async addZSetMember(id: string, key: string, score: number, member: string) {
    const redis = await this.getConnection(id);
    return await redis.zadd(key, score, member);
  }

  static async removeZSetMember(id: string, key: string, member: string) {
    const redis = await this.getConnection(id);
    return await redis.zrem(key, member);
  }

  static async executeCommand(id: string, command: string, args: string[]) {
    const redis = await this.getConnection(id);
    // @ts-ignore
    return await redis.call(command, ...args);
  }
}
