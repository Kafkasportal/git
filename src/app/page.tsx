import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function HomePage() {
  // Check if user is authenticated by looking for auth session cookie
  const cookieStore = await cookies();
  const authSession = cookieStore.get('auth-session');

  // If authenticated, redirect to dashboard, otherwise to login
  if (authSession?.value) {
    redirect('/genel');
  } else {
    redirect('/login');
  }
}
