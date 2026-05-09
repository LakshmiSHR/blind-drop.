'use client'

import { useActionState, useState, useRef } from 'react'
import { createSong } from '@/actions/songs'
import { GENRES, type ActionResult } from '@/types'
import { GlowButton } from '@/components/GlowButton/GlowButton'
import Link from 'next/link'

const STEPS = ['Details', 'Files', 'Review'] as const
const MAX_SIZE = 50 * 1024 * 1024

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function uploadAction(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  return createSong(formData) as any
}

export function UploadForm() {
  const [step, setStep] = useState(0)
  const [state, formAction, pending] = useActionState(uploadAction, null)

  // Step 1 fields
  const [title, setTitle] = useState('')
  const [alias, setAlias] = useState('')
  const [genre, setGenre] = useState(GENRES[0])
  const [tagsRaw, setTagsRaw] = useState('')
  const [spotifyUrl, setSpotifyUrl] = useState('')

  // Step 2 files
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [artFile, setArtFile] = useState<File | null>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const artInputRef = useRef<HTMLInputElement>(null)

  const tags = tagsRaw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 5)

  const canProceedStep1 = title.length > 0 && alias.length > 0
  const canProceedStep2 = audioFile !== null && audioFile.size <= MAX_SIZE

  function handleSubmit(formData: FormData) {
    formData.set('title', title)
    formData.set('alias', alias)
    formData.set('genre', genre)
    formData.set('tags', JSON.stringify(tags))
    formData.set('spotifyTrackUrl', spotifyUrl)
    if (audioFile) formData.set('audio', audioFile)
    if (artFile) formData.set('albumArt', artFile)
    formAction(formData)
  }

  if (state?.success) {
    return (
      <div className="glass" style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>Track uploaded!</h2>
        <p style={{ color: 'hsl(220 15% 55%)', marginBottom: 24 }}>
          Your track is now live on Blind Drop.
        </p>
        <GlowButton href="/dashboard/artist">Go to Dashboard</GlowButton>
      </div>
    )
  }

  return (
    <div>
      {/* Step indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              if (i < step) setStep(i)
            }}
            style={{
              padding: '6px 18px',
              borderRadius: 'var(--radius-pill)',
              fontSize: 13,
              fontWeight: 600,
              cursor: i < step ? 'pointer' : 'default',
              border:
                i === step
                  ? '1px solid hsl(263 100% 67%)'
                  : '1px solid hsl(263 50% 25% / 0.3)',
              background:
                i === step
                  ? 'hsl(263 100% 67% / 0.2)'
                  : i < step
                    ? 'hsl(142 70% 45% / 0.15)'
                    : 'transparent',
              color:
                i === step
                  ? 'hsl(263 100% 80%)'
                  : i < step
                    ? 'hsl(142 70% 65%)'
                    : 'hsl(220 15% 45%)',
            }}
          >
            {i < step ? '✓ ' : ''}
            {s}
          </button>
        ))}
      </div>

      <div className="glass" style={{ padding: 32 }}>
        {/* STEP 1 — Details */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Track Title</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My Awesome Track" />
            </div>
            <div>
              <label style={labelStyle}>Artist Alias <span style={{ fontWeight: 400, color: 'hsl(220 15% 45%)' }}>— shown during blind phase</span></label>
              <input className="input" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Anonymous Producer" />
            </div>
            <div>
              <label style={labelStyle}>Genre</label>
              <select
                className="input"
                value={genre}
                onChange={(e) => setGenre(e.target.value as typeof genre)}
                style={{ cursor: 'pointer' }}
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tags <span style={{ fontWeight: 400, color: 'hsl(220 15% 45%)' }}>— comma-separated, max 5</span></label>
              <input className="input" value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="chill, lo-fi, vibes" />
            </div>
            <div>
              <label style={labelStyle}>Spotify URL <span style={{ fontWeight: 400, color: 'hsl(220 15% 45%)' }}>— optional, enriches audio data</span></label>
              <input className="input" value={spotifyUrl} onChange={(e) => setSpotifyUrl(e.target.value)} placeholder="https://open.spotify.com/track/..." />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <GlowButton onClick={() => setStep(1)} disabled={!canProceedStep1}>
                Next: Files →
              </GlowButton>
            </div>
          </div>
        )}

        {/* STEP 2 — Files */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Audio drop zone */}
            <div>
              <label style={labelStyle}>Audio File <span style={{ fontWeight: 400, color: 'hsl(220 15% 45%)' }}>— max 50 MB</span></label>
              <div
                onClick={() => audioInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const f = e.dataTransfer.files[0]
                  if (f?.type.startsWith('audio/')) setAudioFile(f)
                }}
                style={dropZoneStyle}
              >
                {audioFile ? (
                  <div>
                    <div style={{ fontWeight: 600 }}>🎵 {audioFile.name}</div>
                    <div style={{ fontSize: 13, color: 'hsl(220 15% 55%)', marginTop: 4 }}>
                      {formatSize(audioFile.size)}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'hsl(220 15% 55%)' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🎵</div>
                    Drop audio file here or click to browse
                  </div>
                )}
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) setAudioFile(f)
                  }}
                />
              </div>
              {audioFile && audioFile.size > MAX_SIZE && (
                <p style={{ color: 'hsl(0 70% 65%)', fontSize: 13, marginTop: 8 }}>
                  File exceeds 50 MB limit
                </p>
              )}
            </div>

            {/* Album art drop zone */}
            <div>
              <label style={labelStyle}>Album Art <span style={{ fontWeight: 400, color: 'hsl(220 15% 45%)' }}>— optional, shown after reveal</span></label>
              <div
                onClick={() => artInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const f = e.dataTransfer.files[0]
                  if (f?.type.startsWith('image/')) setArtFile(f)
                }}
                style={{ ...dropZoneStyle, minHeight: 100 }}
              >
                {artFile ? (
                  <div style={{ fontWeight: 600 }}>🖼️ {artFile.name}</div>
                ) : (
                  <div style={{ color: 'hsl(220 15% 55%)' }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>🖼️</div>
                    Drop image or click to browse
                  </div>
                )}
                <input
                  ref={artInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) setArtFile(f)
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <GlowButton size="sm" onClick={() => setStep(0)}>← Back</GlowButton>
              <GlowButton onClick={() => setStep(2)} disabled={!canProceedStep2}>
                Next: Review →
              </GlowButton>
            </div>
          </div>
        )}

        {/* STEP 3 — Review */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Review Your Track</h3>
            <div style={reviewRowStyle}>
              <span style={reviewLabelStyle}>Title</span>
              <span>{title}</span>
            </div>
            <div style={reviewRowStyle}>
              <span style={reviewLabelStyle}>Alias</span>
              <span>{alias}</span>
            </div>
            <div style={reviewRowStyle}>
              <span style={reviewLabelStyle}>Genre</span>
              <span className="badge">{genre}</span>
            </div>
            {tags.length > 0 && (
              <div style={reviewRowStyle}>
                <span style={reviewLabelStyle}>Tags</span>
                <span>{tags.join(', ')}</span>
              </div>
            )}
            <div style={reviewRowStyle}>
              <span style={reviewLabelStyle}>Audio</span>
              <span>{audioFile?.name} ({audioFile ? formatSize(audioFile.size) : ''})</span>
            </div>
            {artFile && (
              <div style={reviewRowStyle}>
                <span style={reviewLabelStyle}>Art</span>
                <span>{artFile.name}</span>
              </div>
            )}
            {spotifyUrl && (
              <div style={reviewRowStyle}>
                <span style={reviewLabelStyle}>Spotify</span>
                <span style={{ fontSize: 13, wordBreak: 'break-all' }}>{spotifyUrl}</span>
              </div>
            )}

            {state && !state.success && (
              <p style={{ color: 'hsl(0 70% 65%)', fontSize: 14 }}>{state.error}</p>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <GlowButton size="sm" onClick={() => setStep(1)}>← Back</GlowButton>
              <form action={handleSubmit}>
                <GlowButton size="lg" type="submit" disabled={pending}>
                  {pending ? 'Uploading…' : '🚀 Upload Track'}
                </GlowButton>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: 'hsl(220 15% 65%)',
  marginBottom: 6,
}

const dropZoneStyle: React.CSSProperties = {
  minHeight: 140,
  borderRadius: 'var(--radius-md)',
  border: '2px dashed hsl(263 50% 25% / 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  cursor: 'pointer',
  padding: 20,
  transition: 'border-color 0.2s',
}

const reviewRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 0',
  borderBottom: '1px solid hsl(263 50% 25% / 0.2)',
  fontSize: 14,
}

const reviewLabelStyle: React.CSSProperties = {
  color: 'hsl(220 15% 55%)',
  fontWeight: 600,
  fontSize: 13,
}
