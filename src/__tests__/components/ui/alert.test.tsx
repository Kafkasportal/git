import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Alert } from '@/components/ui/alert';


describe('Alert', () => {
    it('renders children and role', () => {
        render(<Alert>Test Alert</Alert>);
        expect(screen.getByText('Test Alert')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();
    });
});
