import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getProfile } from '@/actions/profiles'
import { UserDashboardClient } from './UserDashboardClient'

export const metadata = { title: 'Dashboard' }

export default async function UserDashboardPage() {
  const session = await auth()

  if (!session?.user?.id) redirect('/signin')

  const profileResult = await getProfile(session.user.id)

  const profile = profileResult.success
    ? profileResult.data
    : null

  const ratings: any[] = []

  if (!profile) redirect('/signin')

  return (
    <UserDashboardClient
      profile={profile}
      ratings={ratings}
    />
  )
}