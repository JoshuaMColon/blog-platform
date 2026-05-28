import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/useAuth";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-600 px-4 sm:px-8 py-4 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <Link
          to="/"
          className="font-mono font-bold text-gray-800 dark:text-white hover:text-green-600 dark:hover:text-neon transition-colors text-sm sm:text-base"
        >
          &lt;<span className="text-green-600 dark:text-neon">Blog</span>
          Platform /&gt;
        </Link>

        <div className="flex items-center gap-2 sm:gap-6">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-neon transition-colors font-mono text-xs border border-gray-300 dark:border-dark-500 rounded px-2 py-1 hover:border-green-600 dark:hover:border-neon"
          >
            {theme === "dark" ? "☀ light" : "⬛ dark"}
          </button>

          {user ? (
            <>
              <Link
                to="/create"
                className="bg-green-600 dark:bg-neon text-white dark:text-dark-900 px-3 sm:px-4 py-1.5 rounded font-mono text-xs sm:text-sm font-bold hover:bg-green-700 dark:hover:bg-opacity-90 transition-all tracking-wide"
              >
                + new_post()
              </Link>
              <span className="text-gray-500 text-xs font-mono hidden md:block truncate max-w-32">
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="text-gray-500 hover:text-red-500 text-xs font-mono transition-colors"
              >
                logout()
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-green-600 dark:bg-neon text-white dark:text-dark-900 px-4 py-1.5 rounded font-mono text-sm font-bold hover:bg-green-700 dark:hover:bg-opacity-90 transition-all"
            >
              sign_in()
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
