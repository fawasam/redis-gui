import { NextResponse } from 'next/server';
import { getRedisConnection } from '@/lib/redis-manager';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { host, port, username, password, db, tls } = body;

    if (!host || !port) {
      return NextResponse.json({ error: 'Host and port are required' }, { status: 400 });
    }

    // Temporary ID for testing connection
    const testConfig = {
      id: `test-${Date.now()}`,
      host,
      port: parseInt(port),
      username,
      password,
      db: parseInt(db) || 0,
      tls,
    };

    const redis = await getRedisConnection(testConfig);
    const info = await redis.info('server');
    
    // Cleanup the test connection
    await redis.quit();

    return NextResponse.json({ success: true, info: 'Connected pulse: ' + info.split('\n')[1] });
  } catch (error: any) {
    console.error('Connection test failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to connect to Redis' }, { status: 500 });
  }
}
