'use client';

import { useState, useRef, useEffect } from 'react';
import { useRedisStore } from '@/store/use-redis-store';
import { Terminal as TerminalIcon, ChevronRight, CornerDownLeft, X, Trash2, Loader2 } from 'lucide-react';

interface HistoryItem {
  command: string;
  result: any;
  timestamp: number;
  error?: boolean;
}

export function RedisConsole() {
  const { currentConnection, setConsoleOpen } = useRedisStore();
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !currentConnection || isExecuting) return;

    const currentCmd = command.trim();
    setIsExecuting(true);
    setCommand('');

    try {
      const res = await fetch('/api/redis/command', {
        method: 'POST',
        headers: { 
          'x-connection-id': currentConnection.id,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command: currentCmd }),
      });
      
      const data = await res.json();
      
      setHistory(prev => [...prev, {
        command: currentCmd,
        result: data.error ? data.error : data.result,
        error: !!data.error,
        timestamp: Date.now()
      }]);
    } catch (err: any) {
      setHistory(prev => [...prev, {
        command: currentCmd,
        result: err.message,
        error: true,
        timestamp: Date.now()
      }]);
    } finally {
      setIsExecuting(false);
    }
  };

  const formatResult = (result: any) => {
    if (result === null) return <span className="text-zinc-500 italic">(nil)</span>;
    if (typeof result === 'object') return <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>;
    return String(result);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 font-mono">
      <div className="h-10 border-b border-zinc-900 flex items-center justify-between px-4 bg-zinc-900/40 shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-red-500" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Redis Console</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setHistory([])}
            className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Clear History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setConsoleOpen(false)}
            className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-red-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
      >
        {history.length === 0 && (
          <div className="text-zinc-600 text-xs italic">
            Enter Redis commands here. Type HELP for help (not implemented).
          </div>
        )}
        
        {history.map((item, i) => (
          <div key={i} className="space-y-1 animate-in slide-in-from-left-2 duration-200">
            <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase opacity-70">
              <ChevronRight className="w-3.5 h-3.5" />
              <span>{item.command}</span>
            </div>
            <div className={`pl-5 text-sm ${item.error ? 'text-rose-500' : 'text-zinc-300'}`}>
              {formatResult(item.result)}
            </div>
          </div>
        ))}

        {isExecuting && (
          <div className="flex items-center gap-2 pl-5 text-zinc-600">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-xs">Executing...</span>
          </div>
        )}
      </div>

      <form 
        onSubmit={handleSubmit}
        className="h-12 border-t border-zinc-900 flex items-center px-4 bg-zinc-900/20 group focus-within:bg-zinc-900/40 transition-all shrink-0"
      >
        <ChevronRight className="w-4 h-4 text-zinc-600 group-focus-within:text-red-500 transition-colors mr-2" />
        <input 
          autoFocus
          className="flex-1 bg-transparent border-none text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none"
          placeholder="Type a Redis command and press Enter..."
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          disabled={isExecuting}
        />
        <CornerDownLeft className="w-4 h-4 text-zinc-700" />
      </form>
    </div>
  );
}
