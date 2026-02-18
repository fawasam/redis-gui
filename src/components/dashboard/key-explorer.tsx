'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRedisStore } from '@/store/use-redis-store';
import { 
  Search, 
  RotateCw, 
  PlusCircle, 
  Hash, 
  Type, 
  List, 
  Brackets, 
  Layers,
  Activity,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { CreateKeyModal } from './create-key-modal';

const TYPE_ICONS: Record<string, any> = {
  string: <Type className="w-3.5 h-3.5 text-blue-400" />,
  hash: <Hash className="w-3.5 h-3.5 text-emerald-400" />,
  list: <List className="w-3.5 h-3.5 text-orange-400" />,
  set: <Layers className="w-3.5 h-3.5 text-purple-400" />,
  zset: <Activity className="w-3.5 h-3.5 text-pink-400" />,
  stream: <Brackets className="w-3.5 h-3.5 text-cyan-400" />,
  none: <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />,
};

export function KeyExplorer() {
  const { currentConnection, selectedKey, setSelectedKey } = useRedisStore();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [cursor, setCursor] = useState('0');
  const [allKeys, setAllKeys] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ['keys', currentConnection?.id, cursor, search, filterType],
    queryFn: async () => {
      if (!currentConnection) return null;
      const res = await fetch(`/api/redis/scan?cursor=${cursor}&pattern=${search || '*'}${filterType !== 'all' ? `&type=${filterType}` : ''}`, {
        headers: { 'x-connection-id': currentConnection.id }
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch keys');
      }
      
      return res.json();
    },
    enabled: !!currentConnection,
    retry: false,
  });

  useEffect(() => {
    if (data?.keys) {
      if (cursor === '0') {
        setAllKeys(data.keys);
      } else {
        setAllKeys(prev => [...prev, ...data.keys]);
      }
    }
  }, [data, cursor]);

  const handleRefresh = () => {
    setCursor('0');
    refetch();
  };

  const handleLoadMore = () => {
    if (data?.cursor && data.cursor !== '0') {
      setCursor(data.cursor);
    }
  };

  if (!currentConnection) return null;

  return (
    <div className="flex flex-col h-full bg-zinc-900/30">
      <div className="p-4 space-y-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Key Explorer</h3>
          <div className="flex items-center gap-1">
            <button 
              onClick={handleRefresh}
              className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors"
              disabled={isFetching}
            >
              <RotateCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="p-1.5 hover:bg-zinc-800 rounded-md text-red-500 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
            placeholder="Search keys (e.g. user:*)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCursor('0');
            }}
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
          {['all', 'string', 'hash', 'list', 'set', 'zset', 'stream'].map((type) => (
            <button
              key={type}
              onClick={() => {
                setFilterType(type);
                setCursor('0');
              }}
              className={`px-2 py-1 rounded-md text-[10px] font-medium capitalize whitespace-nowrap transition-all ${
                filterType === type 
                  ? 'bg-zinc-100 text-zinc-900' 
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 px-4 text-center">
            <div className="p-3 bg-red-500/10 rounded-full">
              <Activity className="w-6 h-6 text-red-500" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-red-400">Connection Failed</p>
              <p className="text-[10px] text-zinc-500 max-w-[200px] break-all">
                {(error as Error).message}
              </p>
            </div>
            <button 
              onClick={handleRefresh}
              className="mt-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-medium rounded-md transition-colors"
            >
              Retry Connection
            </button>
          </div>
        ) : isLoading && cursor === '0' ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
            <span className="text-xs text-zinc-500">Scanning keys...</span>
          </div>
        ) : allKeys.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-10 h-10 text-zinc-800 mx-auto mb-3" />
            <p className="text-xs text-zinc-500 italic">No keys found</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {allKeys.map((item: any) => (
              <button
                key={item.key}
                onClick={() => setSelectedKey(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                  selectedKey === item.key 
                    ? 'bg-red-500/10 border border-red-500/20' 
                    : 'hover:bg-zinc-800/50 border border-transparent'
                }`}
              >
                <div className="shrink-0">
                  {TYPE_ICONS[item.type] || TYPE_ICONS.none}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={`text-xs font-medium truncate ${selectedKey === item.key ? 'text-red-400' : 'text-zinc-300'}`}>
                    {item.key}
                  </span>
                  <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-tighter">
                    {item.type}
                  </span>
                </div>
              </button>
            ))}

            {data?.cursor && data.cursor !== '0' && (
              <button
                onClick={handleLoadMore}
                disabled={isFetching}
                className="w-full mt-2 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-zinc-300 transition-colors flex items-center justify-center gap-2"
              >
                {isFetching ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Load More Keys'}
              </button>
            )}
          </div>
        )}
      </div>
      {isCreateModalOpen && (
        <CreateKeyModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </div>
  );
}
