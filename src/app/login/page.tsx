// Updated Login Page with Corporate Design
import { CorporateLoginForm } from '@/components/ui/corporate-login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const redirect = params?.redirect || '/genel';
  return <CorporateLoginForm showCorporateBranding={true} redirectTo={redirect} />;
}
