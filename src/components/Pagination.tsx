interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  // Show max 5 page numbers with ellipsis
  const getVisiblePages = () => {
    if (totalPages <= 5) return pages

    if (currentPage <= 3) return [...pages.slice(0, 5), -1, totalPages]
    if (currentPage >= totalPages - 2) return [1, -1, ...pages.slice(totalPages - 5)]

    return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages]
  }

  const visiblePages = getVisiblePages()

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {/* Prev button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1.5 rounded border font-mono text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--text-secondary)',
          backgroundColor: 'transparent',
        }}
        onMouseEnter={e => {
          if (currentPage !== 1) {
            e.currentTarget.style.borderColor = 'var(--accent)'
            e.currentTarget.style.color = 'var(--accent)'
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }}
      >
        ← prev()
      </button>

      {/* Page numbers */}
      {visiblePages.map((page, index) =>
        page === -1 ? (
          <span
            key={`ellipsis-${index}`}
            className="font-mono text-xs px-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className="w-8 h-8 rounded border font-mono text-xs transition-all"
            style={{
              borderColor: currentPage === page ? 'var(--accent)' : 'var(--border)',
              color: currentPage === page ? 'var(--accent)' : 'var(--text-secondary)',
              backgroundColor: currentPage === page ? 'var(--bg-tertiary)' : 'transparent',
            }}
            onMouseEnter={e => {
              if (currentPage !== page) {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.color = 'var(--accent)'
              }
            }}
            onMouseLeave={e => {
              if (currentPage !== page) {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }
            }}
          >
            {page}
          </button>
        )
      )}

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1.5 rounded border font-mono text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--text-secondary)',
          backgroundColor: 'transparent',
        }}
        onMouseEnter={e => {
          if (currentPage !== totalPages) {
            e.currentTarget.style.borderColor = 'var(--accent)'
            e.currentTarget.style.color = 'var(--accent)'
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }}
      >
        next() →
      </button>
    </div>
  )
}

export default Pagination