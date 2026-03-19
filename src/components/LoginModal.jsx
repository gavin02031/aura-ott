import React from 'react';
import { supabase } from '../lib/supabase.js';

export default function LoginModal({
  open,
  onClose,
  onAuthed
}) {
  const [mode, setMode] = React.useState('login'); // 'login' | 'signup'
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setLoading(false);
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!supabase) {
        throw new Error('Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      }
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password
        });

        if (signUpError) throw signUpError;
      }

      const { data } = await supabase.auth.getSession();
      if (data?.session) onAuthed?.();
      onClose?.();
    } catch (err) {
      setError(err?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md rounded-2xl bg-[#141A24]/90 backdrop-blur-2xl border border-white/10 p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm md:text-base font-bold tracking-wide">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <button
            type="button"
            className="text-sm text-white/60 hover:text-white transition"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              mode === 'login'
                ? 'bg-[#E50914] text-white'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              mode === 'signup'
                ? 'bg-[#E50914] text-white'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-5">
          <div>
            <label className="block text-xs text-white/60 mb-2">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="w-full bg-transparent text-white placeholder:text-white/30 outline-none border-b border-white/15 pb-2 focus:border-[#E50914] transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs text-white/60 mb-2">
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="w-full bg-transparent text-white placeholder:text-white/30 outline-none border-b border-white/15 pb-2 focus:border-[#E50914] transition"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-600/15 border border-red-400/20 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#E50914] hover:bg-[#F6121D] transition px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Log In'
                : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

