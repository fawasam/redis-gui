'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRedisStore } from '@/store/use-redis-store';
import { X, Loader2, Save } from 'lucide-react';

export function CreateKeyModal({ onClose }: { onClose: () => void }) {
  const { currentConnection, setSelectedKey } = useRedisStore();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    key: '',
    type: 'string',
    value: '',
    ttl: '-1',
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!currentConnection) return;
      const res = await fetch('/api/redis/key', {
        method: 'PUT',
        headers: { 
          'x-connection-id': currentConnection.id,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: data.key,
          type: data.type,
          value: data.value,
          ttl: data.ttl === '-1' ? undefined : Number.parseInt(data.ttl),
        }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['keys', currentConnection?.id] });
        setSelectedKey(formData.key);
        onClose();
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h3 className="text-lg font-bold uppercase tracking-widest text-zinc-100">Create New Key</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form className="p-5 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Key Name</label>
            <input 
              required
              autoFocus
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all font-mono"
              placeholder="e.g. user:123"
              value={formData.key}
              onChange={e => setFormData({...formData, key: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Type</label>
              <select 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="string">String</option>
                <option value="hash" disabled>Hash (Coming Soon)</option>
                <option value="list" disabled>List (Coming Soon)</option>
                <option value="set" disabled>Set (Coming Soon)</option>
                <option value="zset" disabled>ZSet (Coming Soon)</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">TTL (-1 for none)</label>
              <input 
                type="number"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all font-mono"
                value={formData.ttl}
                onChange={e => setFormData({...formData, ttl: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Initial Value</label>
            <textarea 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all min-h-[100px] font-mono"
              placeholder='{"id": 1}'
              value={formData.value}
              onChange={e => setFormData({...formData, value: e.target.value})}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-red-900/20 transition-all disabled:opacity-50"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Create Key
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
