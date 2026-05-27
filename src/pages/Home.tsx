import { useAuth } from '../context/useAuth'

const Home = () => {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4x1 mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3x1 font-bold text-gray-800">Blog Platform</h1>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{user.email}</span>
              <button
                onClick={signOut}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                  Sign Out
                </button>
            </div>
          ) : null}
        </div>
        <p className="text-gray-600">Posts will appear here soon!</p>
      </div>
    </div>
  )
}

export default Home