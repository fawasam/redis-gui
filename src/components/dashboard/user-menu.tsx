'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ChevronDown, Settings } from 'lucide-react';

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Unauthorized');
      })
      .then(data => {
        if (data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => {
        // If unauthorized, redirect to login is handled by middleware usually,
        // but here we just don't show the user menu or could redirect.
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (loading) return <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />;
  if (!user) return null;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zinc-800 transition-colors text-sm font-medium text-zinc-300 border border-transparent hover:border-zinc-700"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-xs font-bold text-white shadow-inner">
          {user.email[0].toUpperCase()}
        </div>
        <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
        <button 
          className="fixed inset-0 z-10 w-full h-full cursor-default" 
          onClick={() => setIsOpen(false)} 
          aria-label="Close menu"
          tabIndex={-1}
        />
        <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl shadow-black/50 z-50 overflow-hidden ring-1 ring-white/5 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/30">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Signed in as</p>
            <p className="text-sm font-medium truncate text-zinc-200" title={user.email}>{user.email}</p>
          </div>
          
          <div className="p-1">
            <button 
              onClick={() => {
                setIsOpen(false);
                // Add settings logic here later
              }}
              className="w-full text-left px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 rounded-md transition-colors flex items-center gap-2 group"
            >
              <Settings className="w-4 h-4 group-hover:text-zinc-300" />
              Settings
            </button>
            
            <div className="h-px bg-zinc-800 my-1 mx-2" />
            
            <button 
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-md transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
          
          <div className="bg-zinc-950/50 px-4 py-2 text-[10px] text-zinc-600 border-t border-zinc-800 text-center">
            RedisGui v1.0
          </div>
        </div>
        </>
      )}
    </div>
  );
}
