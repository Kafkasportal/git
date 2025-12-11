import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Pagination } from '@/components/ui/pagination';

describe('Pagination Component', () => {
  it('should have accessible labels for navigation buttons', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        total={50}
        limit={10}
        onPageChange={vi.fn()}
      />
    );

    // Check for Previous button
    const prevButton = screen.getByTitle('Önceki sayfa');
    expect(prevButton).toBeInTheDocument();
    // Use getAttribute to strictly check for aria-label, ensuring better accessibility than just title
    expect(prevButton.getAttribute('aria-label')).toBe('Önceki sayfa');

    // Check for Next button
    const nextButton = screen.getByTitle('Sonraki sayfa');
    expect(nextButton).toBeInTheDocument();
    expect(nextButton.getAttribute('aria-label')).toBe('Sonraki sayfa');
  });

  it('should have accessible label for page input', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        total={50}
        limit={10}
        onPageChange={vi.fn()}
      />
    );

    const input = screen.getByRole('spinbutton');
    expect(input.getAttribute('aria-label')).toBe('Sayfa numarası');
  });
});
