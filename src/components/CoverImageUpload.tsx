import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/useAuth'
import { ACCEPT_ATTR, ImageError, formatBytes, uploadImage } from '../lib/images'

interface CoverImageUploadProps {
  currentImage?: string
  onUpload: (url: string) => void
  onRemove: () => void
}

const CoverImageUpload = ({ currentImage, onUpload, onRemove }: CoverImageUploadProps) => {
  const { user, isDemo } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file || !user || uploading) return
    setUploading(true)
    try {
      const { url, bytes } = await uploadImage(file, 'covers', user.id, isDemo)
      onUpload(url)
      toast.success(`Cover uploaded (${formatBytes(bytes)})`)
    } catch (err) {
      toast.error(err instanceof ImageError ? err.message : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (input.current) input.current.value = ''
    }
  }

  const pick = () => input.current?.click()

  return (
    <div>
      <span className="block text-xs font-mono mb-2 tracking-widest" style={{ color: 'var(--accent)' }}>
        $ COVER IMAGE
      </span>
      <input
        ref={input}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        data-testid="cover-input"
        onChange={e => handleFile(e.target.files?.[0])}
      />

      {currentImage ? (
        <div className="hud-cover-preview">
          <img src={currentImage} alt="Cover preview" className="w-full h-48 object-cover" />
          <div className="absolute top-2 right-2 flex gap-2">
            <button type="button" className="hud-chip" onClick={pick} disabled={uploading}>
              {uploading ? 'uploading…' : 'change()'}
            </button>
            <button type="button" className="hud-chip hud-chip-danger" onClick={onRemove} disabled={uploading}>
              remove()
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="hud-dropzone"
          data-over={dragOver || undefined}
          onClick={pick}
          disabled={uploading}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]) }}
        >
          <span className="hud-dropzone-icon" aria-hidden="true">⬒</span>
          <span>{uploading ? '$ compressing + uploading…' : '$ upload_cover() — click or drop an image'}</span>
          <span className="hud-dropzone-hint">
            // jpg · png · webp · gif, up to 10 MB in · resized to 1600px webp ≤ 2 MB
            {isDemo ? ' · guests: 5 images max' : ''}
          </span>
        </button>
      )}
    </div>
  )
}

export default CoverImageUpload
