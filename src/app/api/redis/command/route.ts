import { NextResponse } from 'next/server';
import { RedisService } from '@/services/redis-service';

export async function POST(request: Request) {
  const connectionId = request.headers.get('x-connection-id');
  const body = await request.json();
  const { command } = body;

  if (!connectionId || !command) {
    return NextResponse.json({ error: 'Connection ID and command required' }, { status: 400 });
  }

  try {
    // Basic parsing of command string
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    const result = await RedisService.executeCommand(connectionId, cmd, args);
    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('Command execution failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to execute command' }, { status: 500 });
  }
}
