import { NextResponse } from 'next/server';
import { RedisService } from '@/services/redis-service';
import { getUserFromRequest } from '@/lib/auth-helper';
import connectDB from '@/lib/mongodb';
import Connection from '@/models/Connection';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const connectionId = request.headers.get('x-connection-id');
  const cursor = searchParams.get('cursor') || '0';
  const pattern = searchParams.get('pattern') || '*';
  const type = searchParams.get('type') || undefined;

  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!connectionId) {
    return NextResponse.json({ error: 'Connection ID required' }, { status: 400 });
  }

  await connectDB();
  const conn = await Connection.findOne({ _id: connectionId, userId: user.userId });
  if (!conn) {
    return NextResponse.json({ error: 'Connection not found or unauthorized' }, { status: 403 });
  }

  try {
    const results = await RedisService.scanKeys(connectionId, cursor, pattern, 100, type);
    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Scan failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to scan keys' }, { status: 500 });
  }
}
