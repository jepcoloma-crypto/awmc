import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8f9fb] dark:bg-[#0f1117]">
      {/* Left: Brand */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center">
        <div className="max-w-sm px-8">
          <div className="w-10 h-10 rounded-lg bg-[#3b82f6] flex items-center justify-center mb-6">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#13151a] dark:text-[#f1f2f4] tracking-tight mb-3">Alyssa Wellness &amp; Medical Clinic</h1>
          <p className="text-sm text-[#6b7080] dark:text-[#9ca0aa] leading-relaxed">
            Complete patient information, billing, and appointment scheduling system for modern healthcare.
          </p>
        </div>
      </div>

      {/* Right: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <div className="w-10 h-10 rounded-lg bg-[#3b82f6] flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-[#13151a] dark:text-[#f1f2f4]">Alyssa Wellness &amp; Medical Clinic</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#13151a] dark:text-[#f1f2f4]">Sign in</h2>
            <p className="text-sm text-[#6b7080] dark:text-[#9ca0aa] mt-1">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg border border-red-100 dark:border-red-800/40">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#4b5060] dark:text-[#9ca0aa] mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#e4e5e8] dark:border-[#2a2d3a] rounded-lg bg-white dark:bg-[#181b23] text-[#13151a] dark:text-[#f1f2f4] placeholder-[#9ca0aa] focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 outline-none transition-all text-sm"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#4b5060] dark:text-[#9ca0aa] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#e4e5e8] dark:border-[#2a2d3a] rounded-lg bg-white dark:bg-[#181b23] text-[#13151a] dark:text-[#f1f2f4] placeholder-[#9ca0aa] focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 outline-none transition-all text-sm"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-[#3b82f6]/50 text-white font-medium rounded-lg transition-all text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
