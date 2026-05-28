import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/useAuth";
import { supabase } from "../lib/supabase";
import ThemeSelector from '../components/ThemeSelector'

const Login = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const { theme, toggleTheme } = useTheme();
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
    }
    setLoading(false);
  };

    return (
    <div className={`min-h-screen flex items-center justify-center p-4 theme-${theme}`}>
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="fixed top-4 right-4">
        <ThemeSelector />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-xs font-mono mb-2 tracking-widest" style={{ color: 'var(--accent)' }}>
            // welcome to
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-mono tracking-tight" style={{ color: 'var(--text-primary)' }}>
            &lt;BlogPlatform /&gt;
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
          className="rounded-lg p-6 sm:p-8 shadow-lg border"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center gap-2 mb-6 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
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
            className="w-full py-2 rounded font-mono font-bold text-sm disabled:opacity-50 transition-all tracking-widest"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--btn-text)',
            }}
          >
            {loading ? '> loading...' : isSignUp ? '> CREATE ACCOUNT' : '> SIGN IN'}
          </button>

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
      </div>
    </div>
    </div>
  );
};

export default Login;
