import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { encrypt } from '@/lib/encryption';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const connections = db.prepare('SELECT id, name, host, port, username, db, tls, created_at FROM connections ORDER BY created_at DESC').all();
    return NextResponse.json(connections);
  } catch (error) {
    console.error('Failed to fetch connections:', error);
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, host, port, username, password, db: dbIndex, tls } = body;

    if (!name || !host || !port) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const id = uuidv4();
    const encryptedPassword = password ? encrypt(password) : null;

    db.prepare(`
      INSERT INTO connections (id, name, host, port, username, password, db, tls)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, host, parseInt(port), username || null, encryptedPassword, parseInt(dbIndex) || 0, tls ? 1 : 0);

    return NextResponse.json({ id, name, host, port, username, db: dbIndex, tls });
  } catch (error) {
    console.error('Failed to create connection:', error);
    return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 });
  }
}
