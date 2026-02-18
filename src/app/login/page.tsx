
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Database, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 font-sans p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-red-600 rounded-xl shadow-lg shadow-red-900/30 mb-4">
            <Database className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Welcome Back</h1>
          <p className="text-zinc-500 text-sm mt-2">Sign in to manage your Redis connections</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 relative z-10">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-medium text-center animate-pulse">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider pl-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all placeholder:text-zinc-700"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider pl-1">Password</label>
            <input
              type="password"
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all placeholder:text-zinc-700"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-red-900/20 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In</span>}
            {!loading && <ArrowRight className="w-4 h-4 opacity-50" />}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-600 relative z-10">
          Don't have an account?{' '}
          <Link href="/register" className="text-red-500 hover:text-red-400 font-medium transition-colors">
            Create one now
          </Link>
        </div>
      </div>
      
      <div className="fixed bottom-4 text-[10px] text-zinc-700 font-mono tracking-widest opacity-50">
        REDIS GUI • SECURE ACCESS
      </div>
    </div>
  );
}
