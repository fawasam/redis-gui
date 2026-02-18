'use client';

import { useState, useEffect } from 'react';
import { 
  Panel, 
  Group as PanelGroup, 
  Separator as PanelResizeHandle 
} from 'react-resizable-panels';
import { useRedisStore } from '@/store/use-redis-store';
import { ConnectionSwitcher } from '@/components/dashboard/connection-switcher';
import { KeyExplorer } from '@/components/dashboard/key-explorer';
import { KeyEditor } from '@/components/dashboard/key-editor';
import { RedisConsole } from '@/components/dashboard/redis-console';
import { UserMenu } from '@/components/dashboard/user-menu';
import { ServerStats } from '@/components/dashboard/server-stats';
import { Database, Terminal as TerminalIcon, Activity, Key } from 'lucide-react';

export default function Dashboard() {
  const { currentConnection, isConsoleOpen, setConsoleOpen, activeView, setActiveView } = useRedisStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-950 font-sans text-zinc-100">
      {/* Header / Connection Switcher */}
      <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/80 backdrop-blur-md shrink-0 relative z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-1.5 rounded-lg shadow-lg shadow-red-900/20">
              <Database className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Redis<span className="text-red-500">Gui</span></span>
          </div>

          <div className="h-6 w-px bg-zinc-800" />
          
          <nav className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800/50">
            <button
              onClick={() => setActiveView('keys')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeView === 'keys' 
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Keys</span>
            </button>
            <button
              onClick={() => setActiveView('stats')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeView === 'stats' 
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Stats</span>
            </button>
          </nav>
        </div>
        
        <ConnectionSwitcher />
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setConsoleOpen(!isConsoleOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              isConsoleOpen 
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/30' 
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <TerminalIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Console</span>
          </button>
          
          <div className="h-6 w-px bg-zinc-800 mx-1" />
          
          <UserMenu />
        </div>
      </header>

      <main className="flex-1 min-h-0 relative flex flex-col">
        {currentConnection === null ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 bg-zinc-950/80 backdrop-blur-sm z-10">
            <Database className="w-16 h-16 mb-4 opacity-20" />
            <h2 className="text-xl font-medium text-zinc-300">No Connection Selected</h2>
            <p className="mt-2 text-sm text-zinc-500">Select or add a Redis connection to start exploring.</p>
          </div>
        ) : (
          <PanelGroup orientation="vertical" className="flex-1">
            <Panel defaultSize={75} minSize={30}>
              {activeView === 'keys' ? (
                <PanelGroup orientation="horizontal">
                  {/* Sidebar: Key Explorer */}
                  <Panel defaultSize={25} minSize={20} className="border-r border-zinc-800">
                    <KeyExplorer />
                  </Panel>
                  
                  <PanelResizeHandle className="w-1 bg-transparent hover:bg-red-500/20 transition-colors cursor-col-resize" />
                  
                  {/* Main Content: Key Editor */}
                  <Panel defaultSize={75} minSize={30}>
                    <KeyEditor />
                  </Panel>
                </PanelGroup>
              ) : (
                <div className="h-full w-full overflow-hidden bg-zinc-950">
                  <ServerStats />
                </div>
              )}
            </Panel>

            {isConsoleOpen && (
              <>
                <PanelResizeHandle className="h-1 bg-transparent hover:bg-red-500/20 transition-colors cursor-row-resize" />
                <Panel defaultSize={25} minSize={10} className="border-t border-zinc-800 bg-zinc-900/50">
                  <RedisConsole />
                </Panel>
              </>
            )}
          </PanelGroup>
        )}
      </main>

      <footer className="h-7 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between px-4 text-[10px] text-zinc-500 shrink-0">
        <div className="flex items-center gap-4">
          <span>Connected: {currentConnection?.name || 'None'}</span>
          <span>Host: {currentConnection?.host || 'N/A'}:{currentConnection?.port || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-4 uppercase tracking-widest font-bold opacity-50">
          <span>Production Ready v1.0</span>
        </div>
      </footer>
    </div>
  );
}
