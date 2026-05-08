import { getSongs } from '@/actions/songs'
import { DiscoverClient } from './DiscoverClient'

interface DiscoverPageProps {
  searchParams: Promise<{ genre?: string }>
}

export const metadata = { title: 'Discover' }

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const { genre } = await searchParams
  const result = await getSongs()
  const songs = result.success ? result.data : []

  return <DiscoverClient initialSongs={songs} initialGenre={genre ?? 'All'} />
}
