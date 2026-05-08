'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getSongs } from '@/actions/songs'
import { GENRES, type SongBlind } from '@/types'
import { TrackCard } from '@/components/TrackCard/TrackCard'
import { GlowButton } from '@/components/GlowButton/GlowButton'

interface DiscoverClientProps {
  initialSongs: SongBlind[]
  initialGenre: string
}

const ALL_GENRES = ['All', ...GENRES] as const

export function DiscoverClient({ initialSongs, initialGenre }: DiscoverClientProps) {
  const router = useRouter()
  const [songs, setSongs] = useState(initialSongs)
  const [genre, setGenre] = useState(initialGenre)
  const [offset, setOffset] = useState(initialSongs.length)
  const [hasMore, setHasMore] = useState(initialSongs.length === 20)
  const [isPending, startTransition] = useTransition()

  function handleGenreChange(g: string) {
    setGenre(g)
    setOffset(0)
    setHasMore(true)
    router.push(g === 'All' ? '/discover' : `/discover?genre=${encodeURIComponent(g)}`)
    startTransition(async () => {
      const result = await getSongs()
      if (result.success) {
        setSongs(result.data)
        setOffset(result.data.length)
        setHasMore(result.data.length === 20)
      }
    })
  }

  function loadMore() {
    startTransition(async () => {
      const result = await getSongs()
      if (result.success) {
        setSongs((prev) => [...prev, ...result.data])
        setOffset((prev) => prev + result.data.length)
        setHasMore(result.data.length === 20)
      }
    })
  }

  return (
    <main style={{ paddingTop: 88, paddingBottom: 60, minHeight: '100dvh' }}>
      {/* Genre Pills */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '0 24px 24px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {ALL_GENRES.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => handleGenreChange(g)}
            style={{
              flexShrink: 0,
              padding: '8px 18px',
              borderRadius: 'var(--radius-pill)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: genre === g
                ? '1px solid hsl(263 100% 67%)'
                : '1px solid hsl(263 50% 25% / 0.4)',
              background: genre === g
                ? 'hsl(263 100% 67% / 0.2)'
                : 'hsl(220 20% 10% / 0.6)',
              color: genre === g ? 'hsl(263 100% 80%)' : 'hsl(220 15% 55%)',
            }}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Songs Grid */}
      {isPending ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
            padding: '0 24px',
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 360, borderRadius: 'var(--radius-lg)' }}
            />
          ))}
        </div>
      ) : songs.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 24px',
            color: 'hsl(220 15% 55%)',
          }}
        >
          <p style={{ fontSize: 18 }}>No tracks yet in this genre</p>
          <p style={{ fontSize: 14, marginTop: 8 }}>
            Be the first to upload one!
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
              padding: '0 24px',
            }}
          >
            {songs.map((song) => (
              <TrackCard key={song.id} song={song} />
            ))}
          </div>

          {hasMore && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
              <GlowButton onClick={loadMore}>Load More</GlowButton>
            </div>
          )}
        </>
      )}
    </main>
  )
}
