import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

// UI gate only. I wait out `loading` so a stored session isn't treated as
// logged-out on refresh. Skipping this redirect still wouldn't authorize a
// write: every table checks auth.uid() in its RLS policy.
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  )

  if (!user) return <Navigate to ="/login" />

  return <>{children}</>
}

export default ProtectedRoute