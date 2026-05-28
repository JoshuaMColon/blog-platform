import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/useAuth";
import { supabase } from "../lib/supabase";

const Login = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900 p-4">
      {/* Theme toggle top right */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-neon transition-colors font-mono text-xs border border-gray-300 dark:border-dark-500 rounded px-2 py-1"
      >
        {theme === "dark" ? "☀ light" : "⬛ dark"}
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-green-600 dark:text-neon font-mono text-xs mb-2 tracking-widest">
            // welcome to
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white font-mono tracking-tight">
            &lt;BlogPlatform /&gt;
          </h1>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-px w-16 bg-green-600 dark:bg-neon opacity-50" />
            <span className="text-green-600 dark:text-neon text-xs tracking-widest font-mono">
              {isSignUp ? "CREATE ACCOUNT" : "SIGN IN"}
            </span>
            <div className="h-px w-16 bg-green-600 dark:bg-neon opacity-50" />
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-lg p-6 sm:p-8 shadow-lg">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200 dark:border-dark-600">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-400 dark:text-dark-500 text-xs font-mono ml-2">
              {isSignUp ? "auth/signup.sh" : "auth/login.sh"}
            </span>
          </div>

          {error && (
            <div className="border border-red-400 bg-red-50 dark:bg-red-500 dark:bg-opacity-10 text-red-500 p-3 rounded mb-4 text-xs font-mono">
              <span className="font-bold">ERROR:</span> {error}
            </div>
          )}

          {success && (
            <div className="border border-green-500 bg-green-50 dark:bg-neon dark:bg-opacity-10 text-green-600 dark:text-neon p-3 rounded mb-4 text-xs font-mono">
              <span className="font-bold">SUCCESS:</span> {success}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-mono text-green-600 dark:text-neon mb-2 tracking-widest">
              $ EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full bg-gray-50 dark:bg-dark-700 border border-gray-300 dark:border-dark-500 rounded px-3 py-2 text-sm font-mono text-gray-800 dark:text-white focus:outline-none focus:border-green-500 dark:focus:border-neon transition-colors placeholder-gray-400 dark:placeholder-dark-500"
              placeholder="you@example.com"
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs font-mono text-green-600 dark:text-neon mb-2 tracking-widest">
              $ PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full bg-gray-50 dark:bg-dark-700 border border-gray-300 dark:border-dark-500 rounded px-3 py-2 text-sm font-mono text-gray-800 dark:text-white focus:outline-none focus:border-green-500 dark:focus:border-neon transition-colors placeholder-gray-400 dark:placeholder-dark-500"
              placeholder="••••••••"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-green-600 dark:bg-neon text-white dark:text-dark-900 py-2 rounded font-mono font-bold text-sm hover:bg-green-700 dark:hover:bg-opacity-90 disabled:opacity-50 transition-all tracking-widest"
          >
            {loading
              ? "> loading..."
              : isSignUp
                ? "> CREATE ACCOUNT"
                : "> SIGN IN"}
          </button>

          <p className="text-center text-xs text-gray-500 font-mono mt-4">
            {isSignUp ? "// already have an account?" : "// no account yet?"}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setSuccess("");
              }}
              className="text-green-600 dark:text-neon hover:underline ml-2"
            >
              {isSignUp ? "sign_in()" : "sign_up()"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
