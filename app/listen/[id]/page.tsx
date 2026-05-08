import { notFound } from 'next/navigation'
import { getSongById } from '@/actions/songs'
import { getUserRating } from '@/actions/ratings'
import { ListenClient } from './ListenClient'

interface ListenPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ListenPageProps) {
  const { id } = await params
  const result = await getSongById(id)
  if (!result.success) return { title: 'Track Not Found' }
  const song = result.data
  return {
    title: song.is_revealed && 'title' in song ? song.title : song.alias,
  }
}

export default async function ListenPage({ params }: ListenPageProps) {
  const { id } = await params
  const result = await getSongById(id)
  if (!result.success) notFound()

  const existingRating = null

  return (
    <ListenClient
      song={result.data}
      existingRating={existingRating}
    />
  )
}
