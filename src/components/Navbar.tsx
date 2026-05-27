import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const Navbar = () => {
  const { user, signOut } = useAuth()

  return (
    <nav className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="max-w-4x1 mx-auto flex justify-between items-center">
        <Link to="/" className="text-x1 font-bold text-gray-800">
          Blog Platform
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                to="/create"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
               >
                  New Post
                </Link>
                <span className="text-gray-600 text-sm">{user.email}</span>
                <button
                  onClick={signOut}
                  className="text-red-500 hover:text-red-600 text-sm"
                >
                  Sign Out 
                </button>  
              </>
            ) : (
              <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Sign In
              </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar