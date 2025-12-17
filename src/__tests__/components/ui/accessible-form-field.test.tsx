import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AccessibleFormField } from '@/components/ui/accessible-form-field';


describe('AccessibleFormField', () => {
    it('renders label and children', () => {
        render(
            <AccessibleFormField label="Etiket">
                <input type="text" />
            </AccessibleFormField>
        );
        expect(screen.getByText('Etiket')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
});
