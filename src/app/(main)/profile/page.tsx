import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ProfilePage } from '@/components/ProfilePage'

export default async function ProfileRoute() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const userEmail = session.user.email ?? ''
  const userName = session.user.name ?? null

  return <ProfilePage userEmail={userEmail} userName={userName} />
}
