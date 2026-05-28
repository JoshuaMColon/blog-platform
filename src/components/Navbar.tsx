import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const Navbar = () => {
  const { user, signOut } = useAuth()

  return (
    <nav className="bg-dark-800 border-b border-dark-600 px-8 py-4 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <Link to="/" className="font-mono font-bold text-white hover:text-neon transition-colors">
          &lt;<span className="text-neon">Blog</span>Platform /&gt;
        </Link>
        <div className="flex items-center gap-6">
          {user ? (
            <>
              <Link
                to="/create"
                className="bg-neon text-dark-900 px-4 py-1.5 rounded font-mono text-sm font-bold hover:bg-opacity-90 transition-all tracking-wide"
              >
                + new_post()
              </Link>
              <span className="text-gray-500 text-xs font-mono hidden sm:block">
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="text-gray-500 hover:text-red-400 text-xs font-mono transition-colors"
              >
                logout()
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-neon text-dark-900 px-4 py-1.5 rounded font-mono text-sm font-bold hover:bg-opacity-90 transition-all"
            >
              sign_in()
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar