import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Connection from '@/models/Connection';
import { getUserFromRequest } from '@/lib/auth-helper';
import { encrypt } from '@/lib/encryption';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const connections = await Connection.find({ userId: user.userId })
      .select('name host port username db tls createdAt')
      .sort({ createdAt: -1 });
      
    // Map _id to id for frontend compatibility
    const formattedConnections = connections.map(conn => ({
      id: conn._id.toString(),
      name: conn.name,
      host: conn.host,
      port: conn.port,
      username: conn.username,
      db: conn.db,
      tls: conn.tls,
      created_at: conn.createdAt
    }));

    return NextResponse.json(formattedConnections);
  } catch (error) {
    console.error('Failed to fetch connections:', error);
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, host, port, username, password, db: dbIndex, tls } = body;

    if (!name || !host || !port) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();
    const encryptedPassword = password ? encrypt(password) : undefined;

    const newConnection = await Connection.create({
      name,
      host,
      port: parseInt(port),
      username,
      password: encryptedPassword,
      db: parseInt(dbIndex) || 0,
      tls: !!tls,
      userId: user.userId,
    });

    return NextResponse.json({
      id: newConnection._id.toString(),
      name: newConnection.name,
      host: newConnection.host,
      port: newConnection.port,
      username: newConnection.username,
      db: newConnection.db,
      tls: newConnection.tls,
    });
  } catch (error) {
    console.error('Failed to create connection:', error);
    return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 });
  }
}
