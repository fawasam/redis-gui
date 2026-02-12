'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRedisStore } from '@/store/use-redis-store';
import { Plus, ChevronDown, Check, Trash2, Wifi, WifiOff, Loader2, X } from 'lucide-react';
import { createPortal } from 'react-dom';

export function ConnectionSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentConnection, setCurrentConnection } = useRedisStore();
  const queryClient = useQueryClient();

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['connections'],
    queryFn: async () => {
      const res = await fetch('/api/connections');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    }
  });

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 border min-w-[220px] justify-between group shadow-lg ${
          isOpen 
            ? 'bg-zinc-800 border-zinc-600 ring-2 ring-red-500/20' 
            : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800'
        }`}
      >
        <div className="flex items-center gap-2">
          {currentConnection ? (
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-zinc-600" />
          )}
          <span className="text-sm font-medium truncate max-w-[150px]">
            {currentConnection?.name || 'Select Connection'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[320px] bg-zinc-900 border border-zinc-800 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 z-[70] animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl">
            <div className="flex items-center justify-between px-2 py-1.5 mb-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Saved Connections</span>
              <button 
                onClick={() => { setIsModalOpen(true); setIsOpen(false); }}
                className="p-1 hover:bg-zinc-800 rounded-md text-red-500 transition-colors"
                title="Add Connection"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto space-y-1 custom-scrollbar">
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                </div>
              )}
              
              {!isLoading && connections.length === 0 && (
                <div className="text-center py-6 text-zinc-500 text-xs italic">
                  No connections found.
                </div>
              )}

              {connections.map((conn: any) => (
                <div 
                  key={conn.id}
                  className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                    currentConnection?.id === conn.id 
                      ? 'bg-red-500/10 border border-red-500/20' 
                      : 'hover:bg-zinc-800 border border-transparent'
                  }`}
                  onClick={() => {
                    setCurrentConnection(conn);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-1.5 rounded-md ${currentConnection?.id === conn.id ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200'}`}>
                      <Wifi className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">{conn.name}</span>
                      <span className="text-[10px] text-zinc-500 truncate">{conn.host}:{conn.port}</span>
                    </div>
                  </div>
                  {currentConnection?.id === conn.id && (
                    <Check className="w-4 h-4 text-red-500 mr-1 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {isModalOpen && (
        <ConnectionModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}

function ConnectionModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    host: 'localhost',
    port: '6379',
    username: '',
    password: '',
    db: '0',
    tls: false,
  });

  const testMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/connections/test', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setTestResult({
        success: data.success,
        message: data.success ? data.info : data.error,
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/connections', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      onClose();
    },
  });

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    testMutation.mutate(formData);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 overflow-hidden relative">
        {/* Header - Fixed */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)] animate-pulse" />
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">
              New Connection
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all group"
          >
            <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
        
        {/* Form Body - Solid Background */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-zinc-900">
          <form id="connection-form" onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                Display Name
              </label>
              <input 
                required
                autoFocus
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all placeholder:text-zinc-700"
                placeholder="e.g. My Redis Database"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-6 gap-4">
              <div className="col-span-4 space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Host</label>
                <input 
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all font-mono"
                  placeholder="127.0.0.1"
                  value={formData.host}
                  onChange={e => setFormData({...formData, host: e.target.value})}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Port</label>
                <input 
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all font-mono"
                  placeholder="6379"
                  value={formData.port}
                  onChange={e => setFormData({...formData, port: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Database Index</label>
                <input 
                  type="number"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all font-mono"
                  value={formData.db}
                  onChange={e => setFormData({...formData, db: e.target.value})}
                />
              </div>
              <div className="flex items-center gap-3 pt-6 pl-2">
                <input 
                  type="checkbox"
                  id="modal-tls"
                  checked={formData.tls}
                  onChange={e => setFormData({...formData, tls: e.target.checked})}
                  className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-red-600 focus:ring-red-500/20 cursor-pointer accent-red-600"
                />
                <label htmlFor="modal-tls" className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest cursor-pointer select-none">
                  Use SSL/TLS
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Username</label>
                <input 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-zinc-700 transition-all placeholder:text-zinc-800"
                  placeholder="Optional"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Password</label>
                <input 
                  type="password"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-zinc-700 transition-all placeholder:text-zinc-800"
                  placeholder="Optional"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            {testResult && (
              <div className={`p-4 rounded-xl text-[11px] font-semibold flex gap-3 items-center border animate-in slide-in-from-top-2 ${
                testResult.success 
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/5 border-red-500/20 text-red-500'
              }`}>
                {testResult.success ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span className="flex-1 leading-normal">{testResult.message}</span>
              </div>
            )}
          </form>
        </div>

        {/* Footer - Fixed */}
        <div className="px-6 py-5 border-t border-zinc-800 flex items-center justify-between bg-zinc-950 shrink-0">
          <button 
            type="button"
            onClick={handleTest}
            disabled={testMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold uppercase tracking-widest text-zinc-300 transition-all disabled:opacity-50 border border-zinc-700 hover:border-zinc-600"
          >
            {testMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Wifi className="w-4 h-4" />}
            Test Connection
          </button>
          
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button 
              form="connection-form"
              type="submit"
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-red-900/40 transition-all disabled:opacity-50 active:scale-95"
            >
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Connection
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
