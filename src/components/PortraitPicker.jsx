import { useRef, useState } from 'react'
import { PORTRAITS } from '../data/portraits.js'
import { uploadAvatar } from '../lib/avatars.js'

// Preset gallery + custom upload. Controlled: `value` is the current avatar URL,
// `onChange(url)` is called when the player picks a preset or uploads a file.
export default function PortraitPicker({ value, onChange }) {
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    const { url, error: upErr } = await uploadAvatar(file)
    setUploading(false)
    if (upErr) { setError(upErr.message || 'Upload failed.'); return }
    onChange(url)
  }

  return (
    <div>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {PORTRAITS.map((p) => (
          <button
            key={p.key}
            type="button"
            data-testid={`portrait-${p.key}`}
            onClick={() => onChange(p.url)}
            title={p.label}
            className={`rounded-xl overflow-hidden border-2 transition ${
              value === p.url ? 'border-gold ring-1 ring-gold' : 'border-panel-2 hover:border-gold/50'
            }`}
          >
            <img src={p.url} alt={p.label} className="w-full aspect-square object-cover bg-ink" />
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="text-sm rounded-lg bg-panel-2 px-3 py-2 text-parchment hover:brightness-125 disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : '⬆ Upload your own'}
        </button>
        {value && (
          <button type="button" onClick={() => onChange('')} className="text-sm text-muted hover:text-blood">
            Clear
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          data-testid="portrait-upload"
          onChange={onFile}
          className="hidden"
        />
      </div>
      {error && <p className="text-blood text-sm mt-2">{error}</p>}
    </div>
  )
}
