import React, { useState } from 'react';
import { loginUser } from '@/services/auth';
import { Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await loginUser(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      setLoading(false);
    }
  };

  return (
    <div className="glass-card w-full">
      <h2 className="text-2xl font-bold text-white mb-6">Welcome Back</h2>
      
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/60 mb-1">Email or Username</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input 
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
              placeholder="luga@boyz.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/60 mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center h-12"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
          </button>

          <button 
            type="button" 
            onClick={async () => {
              setLoading(true);
              setError('');
              try {
                const { loginAsGuest } = await import('@/services/auth');
                await loginAsGuest();
              } catch (err: any) {
                setError(err.message || 'Failed to login as guest');
                setLoading(false);
              }
            }}
            disabled={loading}
            className="w-full bg-white/5 border border-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/10 active:scale-[0.98] transition-all flex justify-center items-center h-12"
          >
            Continue as Guest
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-white/60">
        New to LUGA BOYZ?{' '}
        <button onClick={onSwitch} className="text-blue-400 font-bold hover:underline">
          Join the Hub
        </button>
      </p>
    </div>
  );
}
