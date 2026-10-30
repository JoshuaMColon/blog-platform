import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const NotFound = () => {
  useDocumentTitle('Page not found')
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-8 text-center mt-20">
        <div className="text-xs font-mono tracking-widest mb-3" style={{ color: 'var(--accent-2)' }}>
          // error 404 · signal lost
        </div>
        <h1 className="hud-404 glitch" data-text="404">404</h1>
        <h2 className="text-xl font-bold font-mono mb-2" style={{ color: 'var(--text-primary)' }}>Page not found</h2>
        <p className="text-sm font-mono mb-8" style={{ color: 'var(--text-secondary)' }}>
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          to="/"
          className="inline-block px-5 py-2 rounded font-mono text-sm font-bold"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--btn-text)' }}
        >
          &gt; return_home()
        </Link>
      </div>
    </div>
  )
}

export default NotFound
