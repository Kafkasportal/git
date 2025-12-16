import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KAFKASDER - Dernek Yönetim Sistemi',
  description: 'Bağış yönetimi, ihtiyaç sahipleri takibi ve gönüllü koordinasyonu için profesyonel dernek yönetim platformu.',
};

export default function PublicLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
