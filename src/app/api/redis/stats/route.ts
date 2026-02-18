import { NextResponse } from 'next/server';
import { RedisService } from '@/services/redis-service';

export async function GET(request: Request) {
  const connectionId = request.headers.get('x-connection-id');

  if (!connectionId) {
    return NextResponse.json({ error: 'Connection ID required' }, { status: 400 });
  }

  try {
    const stats = await RedisService.getStats(connectionId);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Fetch stats failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch stats' }, { status: 500 });
  }
}
