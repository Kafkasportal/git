import { render, screen } from '@testing-library/react';
import { UsersTable, type UsersTableItem } from '@/components/tables/users-table';
import { TooltipProvider } from '@/components/ui/tooltip';
import { describe, it, expect } from 'vitest';

const mockUser: UsersTableItem = {
  _id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin',
  permissions: [],
  isActive: true,
  createdAt: new Date().toISOString(),
};

describe('UsersTable', () => {
  it('renders user data correctly', () => {
    render(<UsersTable users={[mockUser]} />);
    expect(screen.getByText('Test User')).toBeDefined();
    expect(screen.getByText('test@example.com')).toBeDefined();
  });

  it('renders empty state when no users', () => {
    render(<UsersTable users={[]} />);
    expect(screen.getByText('Henüz kullanıcı bulunmuyor.')).toBeDefined();
  });

  it('renders action buttons with tooltips', () => {
    render(
      <TooltipProvider>
        <UsersTable
          users={[mockUser]}
          onEdit={() => {}}
          onDelete={() => {}}
          onToggleActive={() => {}}
        />
      </TooltipProvider>
    );
    // Check if buttons are present (sr-only text)
    expect(screen.getByText('Düzenle')).toBeDefined();
    expect(screen.getByText('Sil')).toBeDefined();
    expect(screen.getByText('Durumu değiştir')).toBeDefined();
  });
});
