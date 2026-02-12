import { NextResponse } from 'next/server';
import { RedisService } from '@/services/redis-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const connectionId = request.headers.get('x-connection-id');
  const key = searchParams.get('key');

  if (!connectionId || !key) {
    return NextResponse.json({ error: 'Connection ID and key required' }, { status: 400 });
  }

  try {
    const details = await RedisService.getKeyDetails(connectionId, key);
    return NextResponse.json(details);
  } catch (error: any) {
    console.error('Fetch key details failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch key details' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const connectionId = request.headers.get('x-connection-id');
  const key = searchParams.get('key');

  if (!connectionId || !key) {
    return NextResponse.json({ error: 'Connection ID and key required' }, { status: 400 });
  }

  try {
    await RedisService.deleteKey(connectionId, key);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete key failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete key' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const connectionId = request.headers.get('x-connection-id');
  const body = await request.json();
  const { key, type, value, ttl } = body;

  if (!connectionId || !key || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    if (type === 'string') {
      await RedisService.updateString(connectionId, key, value, ttl);
    } else {
      // TODO: Handle other types for updates
      return NextResponse.json({ error: 'Update for this type not yet implemented' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update key failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to update key' }, { status: 500 });
  }
}
