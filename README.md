# Redis Desktop Viewer (RedisGui)

A production-ready, high-performance Redis management GUI built with Next.js 15, Tailwind CSS 4, and SQLite.

## Features

- 🔌 **Multi-Connection Manager**: Securely save and switch between multiple Redis instances.
- 🌳 **Key Explorer**: Efficient cursor-based scanning with type filtering and real-time search.
- 📝 **Key Editor**: Type-aware editing for strings (JSON support) with TTL management.
- ⌨️ **Redis Console**: Execute raw commands directly with history tracking.
- 🔒 **Security First**: 
  - Redis credentials never exposed to the browser.
  - Saved passwords are AES-256 encrypted in the local database.
  - CSRF protected API routes.
- 🚀 **Modern Tech Stack**:
  - Next.js 15 (App Router) with React Server Components.
  - Tailwind CSS 4 for cutting-edge aesthetics.
  - TanStack Query (v5) for robust state and caching.
  - Zustand for lightweight global UI state.
  - SQLite (better-sqlite3) for local persistence.

## Tech Stack Requirements

- **Frontend**: Next.js 16+, React, Tailwind CSS 4, Lucide Icons, react-resizable-panels.
- **State Management**: Zustand, TanStack Query.
- **Backend**: Node.js, ioredis, better-sqlite3 (SQLite).
- **Security**: CryptoJS (AES-256).

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   Create a `.env` file (one has been automatically created for you):
   ```
   ENCRYPTION_KEY=your_secure_secret
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Navigate to**: `http://localhost:3000`

## Project Structure

```text
/src
  /app
    /api           # Redis & Connection endpoints
    page.tsx       # Main Dashboard Layout
  /components
    /dashboard     # Core GUI components
    providers.tsx  # React Query context
  /lib
    db.ts          # SQLite initialization
    encryption.ts  # AES Encryption utilities
    redis-manager.ts # Active connection pool
    utils.ts       # Tailwind helpers
  /services
    redis-service.ts # Core Redis operations logic
  /store           # Zustand global state
/data              # Local SQLite database storage
```

## Performance Rules

- **SCALABLE SCAN**: Never uses `KEYS *`. Employs `SCAN` with cursor-based pagination to handle millions of keys without blocking the Redis event loop.
- **POOLED CONNECTIONS**: Reuses Redis connections to prevent flooding.
- **LAZY LOADING**: Key values and details are loaded only when selected.

---
Built with ❤️ by Antigravity
