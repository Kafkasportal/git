import { redirect } from 'next/navigation';

/**
 * Root page - redirects to login page
 * Middleware will handle redirecting authenticated users to dashboard
 */
export default function HomePage() {
  // Always redirect to login page
  // Middleware will handle redirecting authenticated users to dashboard
  redirect('/login');
}
