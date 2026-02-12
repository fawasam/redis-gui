import { create } from 'zustand';

interface RedisConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  username?: string;
  db: number;
  tls: boolean;
}

interface RedisState {
  currentConnection: RedisConnection | null;
  selectedKey: string | null;
  isConsoleOpen: boolean;
  
  setCurrentConnection: (conn: RedisConnection | null) => void;
  setSelectedKey: (key: string | null) => void;
  setConsoleOpen: (open: boolean) => void;
}

export const useRedisStore = create<RedisState>((set) => ({
  currentConnection: null,
  selectedKey: null,
  isConsoleOpen: false,

  setCurrentConnection: (conn) => set({ currentConnection: conn, selectedKey: null }),
  setSelectedKey: (key) => set({ selectedKey: key }),
  setConsoleOpen: (open) => set({ isConsoleOpen: open }),
}));
