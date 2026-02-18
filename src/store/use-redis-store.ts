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
  activeView: 'keys' | 'stats';
  isConsoleOpen: boolean;
  
  setCurrentConnection: (conn: RedisConnection | null) => void;
  setSelectedKey: (key: string | null) => void;
  setActiveView: (view: 'keys' | 'stats') => void;
  setConsoleOpen: (open: boolean) => void;
}

export const useRedisStore = create<RedisState>((set) => ({
  currentConnection: null,
  selectedKey: null,
  activeView: 'keys',
  isConsoleOpen: false,

  setCurrentConnection: (conn) => set({ currentConnection: conn, selectedKey: null }),
  setSelectedKey: (key) => set({ selectedKey: key }),
  setActiveView: (view) => set({ activeView: view }),
  setConsoleOpen: (open) => set({ isConsoleOpen: open }),
}));
