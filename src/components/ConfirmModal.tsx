interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmModalProps) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-lg border p-6 shadow-2x1"
        style={{
          backgroundColor: 'var(--bg-secondary',
          borderColor: 'var(--border)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Terminal Bar */}
        <div className="flex items-center gap-1.5 mb-4 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs font-mono ml-2" style={{ color: 'var(--text-primary)' }}>
            confirm.sh
          </span>
        </div>

        <h3 className="font-mono font-bold text-sm mb-2" style={{ color: 'var(--text-primary' }}>
          {title}
        </h3>
        <p className="font-mono text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          {message}
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 rounded font-mono text-xs border transition-all"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 rounded font-mono text-xs font-bold transition-all"
            style={{
              backgroundColor: danger ? '#ef4444' : 'var(--accent)',
              color: danger ? '#ffffff' : 'var(--btn-text)',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal