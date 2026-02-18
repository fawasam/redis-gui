'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRedisStore } from '@/store/use-redis-store';
import { 
  Trash2, 
  Copy, 
  Save, 
  Clock, 
  FileJson, 
  Type, 
  Loader2, 
  RefreshCw,
  X,
  AlertTriangle
} from 'lucide-react';
import { HashEditor } from '@/components/dashboard/editors/HashEditor';
import { ListEditor } from '@/components/dashboard/editors/ListEditor';
import { SetEditor } from '@/components/dashboard/editors/SetEditor';
import { ZSetEditor } from '@/components/dashboard/editors/ZSetEditor';

export function KeyEditor() {
  const { currentConnection, selectedKey, setSelectedKey } = useRedisStore();
  const queryClient = useQueryClient();
  const [editedValue, setEditedValue] = useState('');
  const [viewMode, setViewMode] = useState<'text' | 'json'>('text');
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: details, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['keyDetails', currentConnection?.id, selectedKey],
    queryFn: async () => {
      if (!currentConnection || !selectedKey) return null;
      const res = await fetch(`/api/redis/key?key=${encodeURIComponent(selectedKey)}`, {
        headers: { 'x-connection-id': currentConnection.id }
      });
      if (!res.ok) throw new Error('Failed to fetch details');
      return res.json();
    },
    enabled: !!currentConnection && !!selectedKey,
  });

  useEffect(() => {
    if (details?.type === 'string' && details.value !== null) {
      setEditedValue(details.value);
      try {
        JSON.parse(details.value);
        setViewMode('json');
      } catch {
        setViewMode('text');
      }
    } else if (details?.value) {
      setEditedValue(JSON.stringify(details.value, null, 2));
    }
  }, [details]);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!currentConnection || !selectedKey) return;
      const res = await fetch(`/api/redis/key?key=${encodeURIComponent(selectedKey)}`, {
        method: 'DELETE',
        headers: { 'x-connection-id': currentConnection.id }
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys', currentConnection?.id] });
      setSelectedKey(null);
      setIsDeleting(false);
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentConnection || !selectedKey || !details) return;
      const res = await fetch('/api/redis/key', {
        method: 'PUT',
        headers: { 
          'x-connection-id': currentConnection.id,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: selectedKey,
          type: details.type,
          value: editedValue,
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      refetch();
    }
  });

  if (!selectedKey) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
        <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800">
          <Type className="w-12 h-12 opacity-10" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">No Key Selected</p>
          <p className="text-xs">Select a key from the sidebar to view and edit its details.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Toolbar */}
      <div className="h-14 border-b border-zinc-900 flex items-center justify-between px-6 bg-zinc-900/20">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">
              Key name
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold truncate text-zinc-100">{selectedKey}</span>
              <button className="text-zinc-500 hover:text-white transition-colors">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          
          <div className="h-8 w-px bg-zinc-800 hidden md:block" />
          
          <div className="hidden md:flex flex-col">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">
              Type
            </span>
            <span className="text-xs font-mono text-red-400 font-bold uppercase tracking-tight">
              {details?.type}
            </span>
          </div>

          <div className="h-8 w-px bg-zinc-800 hidden lg:block" />

          <div className="hidden lg:flex flex-col">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">
              TTL
            </span>
            <span className="text-xs font-mono text-zinc-400">
              {details?.ttl === -1 ? 'None' : `${details?.ttl}s`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => refetch()}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          
          <button 
            onClick={() => setIsDeleting(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-red-950/40 text-red-400 hover:text-red-300 transition-all border border-zinc-800"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Delete</span>
          </button>

          <button 
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || details?.type !== 'string'}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all shadow-lg shadow-red-900/20 disabled:opacity-50"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="text-xs font-bold uppercase tracking-widest">Save Changes</span>
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 flex flex-col p-6 min-h-0 overflow-hidden">
        {details?.type === 'string' && (
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setViewMode('text')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
                  viewMode === 'text' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Raw Text
              </button>
              <button 
                onClick={() => setViewMode('json')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
                  viewMode === 'json' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Pretty JSON
              </button>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">
              SIZE: {details?.size} bytes
            </div>
          </div>
        )}

        {details?.type === 'hash' ? (
             <HashEditor data={details.value} keyName={selectedKey} />
        ) : details?.type === 'list' ? (
             <ListEditor data={details.value} keyName={selectedKey} />
        ) : details?.type === 'set' ? (
             <SetEditor data={details.value} keyName={selectedKey} />
        ) : details?.type === 'zset' ? (
             <ZSetEditor data={details.value} keyName={selectedKey} />
        ) : (
            <div className="flex-1 relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group">
              <textarea 
                className="absolute inset-0 w-full h-full bg-transparent p-6 text-sm font-mono text-zinc-300 focus:outline-none resize-none custom-scrollbar selection:bg-red-500/30"
                value={editedValue}
                onChange={(e) => setEditedValue(e.target.value)}
                spellCheck={false}
                readOnly={details?.type !== 'string'} // Only string editable via text area for now
              />
               {details?.type !== 'string' && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-zinc-800 text-zinc-400 text-xs rounded opacity-50 pointer-events-none">
                    Read Only (Stream/Other)
                  </div>
               )}
            </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl shadow-3xl p-6 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold mb-2 uppercase tracking-wide">Delete Key?</h3>
            <p className="text-sm text-zinc-500 mb-6">
              Are you sure you want to delete <span className="font-mono text-zinc-300 font-bold">{selectedKey}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleting(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-bold uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-bold uppercase tracking-widest transition-all shadow-lg shadow-red-900/20"
              >
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Delete Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
