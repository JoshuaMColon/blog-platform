import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import { Navigate } from 'react-router-dom'

const Login = () => {
  const { user } = useAuth()

  if (user) return <Navigate to="/" />

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-x1 shadow-md w-full max-w-md">
        <h1 className="text-2x1 font-bold text-center mb-6 text-gray-800">
          Welcome to BlogPlatform
        </h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          redirectTo={window.location.origin}
        />
      </div>
    </div>
  )
}

export default Login