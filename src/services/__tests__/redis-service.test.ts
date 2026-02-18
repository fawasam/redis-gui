/**
 * @jest-environment node
 */
import { RedisService } from '../redis-service';
import Connection from '../../models/Connection';
import { getRedisConnection } from '@/lib/redis-manager';

// Mock dependencies
jest.mock('@/lib/redis-manager');
jest.mock('@/models/Connection');
// Basic mocks for things we don't care about deeply
jest.mock('@/lib/mongodb', () => jest.fn());
jest.mock('@/lib/encryption', () => ({
  decrypt: jest.fn(val => val),
}));

describe('RedisService', () => {
  let mockRedis: any;
  const mockConnectionId = 'test-conn-id';

  beforeEach(() => {
    jest.clearAllMocks();

    mockRedis = {
      scan: jest.fn(),
      pipeline: jest.fn(),
      type: jest.fn(),
      ttl: jest.fn(),
      pttl: jest.fn(),
      get: jest.fn(),
      info: jest.fn(),
      call: jest.fn(),
      client: jest.fn(), // If used directly
    };

    // Chainable pipeline mock
    const pipelineMock = {
      type: jest.fn(),
      exec: jest.fn(),
    };
    mockRedis.pipeline.mockReturnValue(pipelineMock);
    pipelineMock.type.mockReturnThis();

    (getRedisConnection as jest.Mock).mockResolvedValue(mockRedis);

    (Connection.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: mockConnectionId,
        host: 'localhost',
        port: 6379,
        username: 'default',
        password: 'password', // mock will just pass it through
        db: 0,
      }),
    });
  });

  describe('getStats', () => {
    it('should parse INFO and CLIENT LIST output correctly', async () => {
      // Mock Redis responses
      mockRedis.info.mockImplementation((section?: string) => {
        if (section === 'commandstats') {
           return 'cmdstat_get:calls=10,usec=20,usec_per_call=2.00\r\ncmdstat_set:calls=5,usec=10,usec_per_call=2.00';
        }
        return '# Memory\r\nused_memory:1024\r\nused_memory_human:1K\r\n# CPU\r\nused_cpu_sys:10.5';
      });

      mockRedis.call.mockResolvedValue('id=1 addr=127.0.0.1:6379 name=test-client age=10 idle=0 flags=N db=0 sub=0 psub=0 multi=-1 qbuf=26 qbuf-free=32742 obl=0 oll=0 omem=0 events=r cmd=client user=default\n');

      const stats = await RedisService.getStats(mockConnectionId);

      // Verify INFO parsing
      expect(stats.info.memory.used_memory).toBe('1024');
      expect(stats.info.cpu.used_cpu_sys).toBe('10.5');

      // Verify Command Stats
      expect(stats.commandStats).toHaveLength(2);
      expect(stats.commandStats[0].name).toBe('get');
      expect(stats.commandStats[0].calls).toBe(10);
      
      // Verify Client List parsing
      expect(stats.clients).toHaveLength(1);
      expect(stats.clients[0].id).toBe('1');
      expect(stats.clients[0].name).toBe('test-client');
    });
  });

  describe('scanKeys', () => {
    it('should key scan results and fetch types', async () => {
        mockRedis.scan.mockResolvedValue(['10', ['key1', 'key2']]);
        
        // Mock pipeline execution result for types
        const pipelineMock = mockRedis.pipeline();
        pipelineMock.exec.mockResolvedValue([
            [null, 'string'], // error, result tuple for key1
            [null, 'hash'],   // error, result tuple for key2
        ]);

        const result = await RedisService.scanKeys(mockConnectionId, '0', '*', 100);

        expect(mockRedis.scan).toHaveBeenCalledWith('0', 'MATCH', '*', 'COUNT', 100);
        expect(result.cursor).toBe('10');
        expect(result.keys).toHaveLength(2);
        expect(result.keys[0]).toEqual({ key: 'key1', type: 'string' });
        expect(result.keys[1]).toEqual({ key: 'key2', type: 'hash' });
    });
  });
});
