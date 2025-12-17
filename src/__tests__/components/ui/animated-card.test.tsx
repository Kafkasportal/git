import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AnimatedCard } from '@/components/ui/animated-card';


describe('AnimatedCard', () => {
    it('renders children', () => {
        render(<AnimatedCard>Animasyonlu Kart</AnimatedCard>);
        expect(screen.getByText('Animasyonlu Kart')).toBeInTheDocument();
    });
});
