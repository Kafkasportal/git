'use client';

import { PageTransition } from '@/components/ui/motion/PageTransition';

export default function Template({ children }: { children: React.ReactNode }) {
    return <PageTransition>{children}</PageTransition>;
}
