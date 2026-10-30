import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import PostPage from "./pages/PostPage";
import Search from "./pages/Search";
import Following from './pages/Following';
import Bookmarks from './pages/Bookmarks'
import { AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import RouteFallback from './components/RouteFallback'

// Heavier, less-visited routes (TipTap editor, profile) load on demand.
const CreatePost = lazy(() => import('./pages/CreatePost'))
const EditPost = lazy(() => import('./pages/EditPost'))
const MyPosts = lazy(() => import('./pages/MyPosts'))
const UserProfile = lazy(() => import('./pages/UserProfile'))
const Notifications = lazy(() => import('./pages/Notifications'))

function App() {
  const location = useLocation()

  return (
    <ThemeProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderLeft: '3px solid var(--accent)',
            borderRadius: '2px',
          },
        }}
      />
      <AuthProvider>
        <AnimatePresence mode="wait">
          <Suspense fallback={<RouteFallback />} key={location.pathname}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/post/:slug" element={<PostPage />} />
            <Route path="/search" element={<Search />} />
            <Route path="/following" element={
              <ProtectedRoute><Following /></ProtectedRoute>
            } />
            <Route path="/bookmarks" element={
              <ProtectedRoute><Bookmarks /></ProtectedRoute>
            } />
            <Route path="/create" element={
              <ProtectedRoute><CreatePost /></ProtectedRoute>
            } />
            <Route path="/edit/:slug" element={
              <ProtectedRoute><EditPost /></ProtectedRoute>
            } />
            <Route path="/my-posts" element={
              <ProtectedRoute><MyPosts /></ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute><Notifications /></ProtectedRoute>
            } />
            <Route path="/profile/:id" element={<UserProfile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </AnimatePresence>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App;