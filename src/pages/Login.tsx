import { useDocumentTitle } from "../hooks/useDocumentTitle"
import { useState, useEffect } from "react";
import Spinner from '../components/Spinner'
import { Navigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/useAuth";
import { supabase } from "../lib/supabase";
import ThemeSelector from '../components/ThemeSelector'
import { motion } from 'framer-motion'
import HudMark from '../components/HudMark'

const Login = () => {
  useDocumentTitle('Sign in')
  const { user, signInAsGuest } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);
  const { toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 't') toggleTheme()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleTheme])

  if (user) return <Navigate to="/" />;

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setSuccess("Account created! You can now sign in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }
    setLoading(false);
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    setError("");
    setSuccess("");
    const { error } = await signInAsGuest();
    if (error) setError(error);
    setDemoLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="fixed top-4 right-4">
        <ThemeSelector />
      </div>

      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="text-center mb-8">
          <div className="text-xs font-mono mb-2 tracking-widest" style={{ color: 'var(--accent)' }}>
            // welcome to
          </div>
          <h1 className="hud-hero glitch" data-text="BLOG//PLATFORM" style={{ color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--accent)' }}>BLOG</span>
            <span style={{ color: 'var(--accent-2)' }}>//</span>
            PLATFORM
          </h1>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-px w-16 opacity-50" style={{ backgroundColor: 'var(--accent)' }} />
            <span className="text-xs tracking-widest font-mono" style={{ color: 'var(--accent)' }}>
              {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
            </span>
            <div className="h-px w-16 opacity-50" style={{ backgroundColor: 'var(--accent)' }} />
          </div>
        </div>

        <div
          className="hud-panel p-6 sm:p-8 border"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center gap-2 mb-6 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <HudMark size="lg" />
            <span className="text-xs font-mono ml-2" style={{ color: 'var(--text-secondary)' }}>
              {isSignUp ? 'auth/signup.sh' : 'auth/login.sh'}
            </span>
          </div>

          {error && (
            <div className="border border-red-400 bg-red-500 bg-opacity-10 text-red-400 p-3 rounded mb-4 text-xs font-mono">
              <span className="font-bold">ERROR:</span> {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded mb-4 text-xs font-mono border" style={{ borderColor: 'var(--accent)', color: 'var(--accent)', backgroundColor: 'var(--bg-tertiary)' }}>
              <span className="font-bold">SUCCESS:</span> {success}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-mono mb-2 tracking-widest" style={{ color: 'var(--accent)' }}>
              $ EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full rounded px-3 py-2 text-sm font-mono focus:outline-none transition-colors border"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
              placeholder="you@example.com"
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs font-mono mb-2 tracking-widest" style={{ color: 'var(--accent)' }}>
              $ PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full rounded px-3 py-2 text-sm font-mono focus:outline-none transition-colors border"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            aria-busy={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-2 rounded font-mono font-bold text-sm disabled:opacity-50 transition-all tracking-widest"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--btn-text)',
            }}
          >
            {loading && <Spinner label="Signing in" />}
            {loading ? 'loading...' : isSignUp ? '> CREATE ACCOUNT' : '> SIGN IN'}
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1" style={{ backgroundColor: 'var(--border)' }} />
            <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>or</span>
            <div className="h-px flex-1" style={{ backgroundColor: 'var(--border)' }} />
          </div>

          <button
            onClick={handleDemo}
            disabled={demoLoading}
            aria-busy={demoLoading}
            className="w-full inline-flex items-center justify-center gap-2 py-2 rounded font-mono font-bold text-sm disabled:opacity-50 transition-all tracking-widest border"
            style={{
              borderColor: 'var(--accent)',
              color: 'var(--accent)',
              backgroundColor: 'var(--bg-tertiary)',
            }}
          >
            {demoLoading && <Spinner label="Starting demo" />}
            {demoLoading ? 'starting demo...' : '✦ TRY THE DEMO'}
          </button>
          <p className="text-center text-[11px] font-mono mt-2" style={{ color: 'var(--text-secondary)' }}>
            // no sign-up needed · guest data clears after a day
          </p>

          <p className="text-center text-xs font-mono mt-4" style={{ color: 'var(--text-secondary)' }}>
            {isSignUp ? '// already have an account?' : '// no account yet?'}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess('') }}
              className="hover:underline ml-2"
              style={{ color: 'var(--accent)' }}
            >
              {isSignUp ? 'sign_in()' : 'sign_up()'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;