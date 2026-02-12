import Database from 'better-sqlite3';
import path from 'path';

// For development/local use, we store the db in the data folder
const dbPath = path.join(process.cwd(), 'data', 'redis-gui.db');
const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS connections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    host TEXT NOT NULL,
    port INTEGER NOT NULL,
    username TEXT,
    password TEXT,
    db INTEGER DEFAULT 0,
    tls BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export default db;
