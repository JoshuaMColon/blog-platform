import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import { Navigate } from 'react-router-dom'

const Login = () => {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" />

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setSuccess('Account created! You can now sign in.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-neon font-mono text-sm mb-2 tracking-widest">// welcome to</div>
          <h1 className="text-4xl font-bold text-white font-mono tracking-tight">
            &lt;BlogPlatform /&gt;
          </h1>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-px w-16 bg-neon opacity-50" />
            <span className="text-neon text-xs tracking-widest font-mono">
              {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
            </span>
            <div className="h-px w-16 bg-neon opacity-50" />
          </div>
        </div>

        {/* Card */}
        <div className="bg-dark-800 border border-dark-600 rounded-lg p-8 shadow-2xl">
          {/* Terminal bar */}
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-dark-600">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-dark-500 text-xs font-mono ml-2">
              {isSignUp ? 'auth/signup.sh' : 'auth/login.sh'}
            </span>
          </div>

          {error && (
            <div className="border border-red-500 bg-red-500 bg-opacity-10 text-red-400 p-3 rounded mb-4 text-xs font-mono">
              <span className="text-red-500">ERROR:</span> {error}
            </div>
          )}

          {success && (
            <div className="border border-neon bg-neon bg-opacity-10 text-neon p-3 rounded mb-4 text-xs font-mono">
              <span className="text-neon">SUCCESS:</span> {success}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-mono text-neon mb-2 tracking-widest">
              $ EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full bg-dark-700 border border-dark-500 rounded px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-neon transition-colors placeholder-dark-500"
              placeholder="you@example.com"
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs font-mono text-neon mb-2 tracking-widest">
              $ PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full bg-dark-700 border border-dark-500 rounded px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-neon transition-colors placeholder-dark-500"
              placeholder="••••••••"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-neon text-dark-900 py-2 rounded font-mono font-bold text-sm hover:bg-opacity-90 disabled:opacity-50 transition-all tracking-widest"
          >
            {loading ? '> loading...' : isSignUp ? '> CREATE ACCOUNT' : '> SIGN IN'}
          </button>

          <p className="text-center text-xs text-gray-500 font-mono mt-4">
            {isSignUp ? '// already have an account?' : '// no account yet?'}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess('') }}
              className="text-neon hover:underline ml-2"
            >
              {isSignUp ? 'sign_in()' : 'sign_up()'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login