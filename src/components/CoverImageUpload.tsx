import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import toast from 'react-hot-toast'

interface CoverImageUploadProps {
  currentImage?: string
  onUpload: (url: string) => void
  onRemove: () => void
}

const CoverImageUpload = ({ currentImage, onUpload, onRemove }: CoverImageUploadProps) => {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }

    setUploading(true)

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      toast.error('Failed to upload image')
      setUploading(false)
      return
    }

    const { data } = supabase.storage
      .from('covers')
      .getPublicUrl(fileName)

    onUpload(data.publicUrl)
    toast.success('Cover image uploaded!')
    setUploading(false)
  }

  return (
    <div>
      <label className="block text-xs font-mono mb-2 tracking-widest" style={{ color: 'var(--accent)' }}>
        $ COVER IMAGE
      </label>

      {currentImage ? (
        <div className="relative">
          <img
            src={currentImage}
            alt="Cover"
            className="w-full h-48 object-cover rounded-lg border"
            style={{ borderColor: 'var(--border)' }}
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <label
              className="cursor-pointer text-xs font-mono px-3 py-1.5 rounded border transition-all"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              {uploading ? 'uploading...' : 'change()'}
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <button
              onClick={onRemove}
              className="text-xs font-mono px-3 py-1.5 rounded border transition-all"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: '#ef4444',
                color: '#ef4444',
              }}
            >
              remove()
            </button>
          </div>
        </div>
      ) : (
        <label
          className="flex flex-col items-center justify-center w-full h-36 rounded-lg border-2 border-dashed cursor-pointer transition-all"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-tertiary)' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <span className="text-2xl mb-2">🖼️</span>
          <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            {uploading ? '$ uploading...' : '$ click to upload cover image'}
          </span>
          <span className="text-xs font-mono mt-1" style={{ color: 'var(--text-secondary)' }}>
            // max 5MB, jpg/png/gif/webp
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      )}
    </div>
  )
}

export default CoverImageUpload