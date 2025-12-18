
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WidgetGrid } from '@/components/dashboard/widget-grid';
import { WidgetConfig } from '@/types/dashboard';

// Mock the Tooltip components since they require a provider
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-trigger">{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('WidgetGrid', () => {
  const mockWidgets: WidgetConfig[] = [
    { id: '1', title: 'Widget 1', type: 'chart', visible: true, size: 'medium', order: 0 },
  ];
  const mockSavedLayouts = [
    { id: 'layout1', name: 'My Layout', widgets: [], isDefault: false, createdAt: '', updatedAt: '' },
  ];

  it('renders delete button for saved layouts with aria-label', () => {
    render(
      <WidgetGrid
        widgets={mockWidgets}
        visibleWidgets={mockWidgets}
        layoutItems={[]}
        isEditMode={false}
        savedLayouts={mockSavedLayouts}
        onLayoutChange={() => {}}
        onToggleWidget={() => {}}
        onResetLayout={() => {}}
        onSaveLayout={() => {}}
        onLoadLayout={() => {}}
        onDeleteLayout={() => {}}
        onEditModeChange={() => {}}
        renderWidget={() => <div>Widget Content</div>}
      />
    );

    // Find the saved layouts dropdown trigger button
    const savedLayoutsButton = screen.getByText('Şablonlar');
    fireEvent.click(savedLayoutsButton);

    // The delete button (trash icon) should have the aria-label
    // Since we mocked TooltipTrigger, we look for the button inside it
    // But verify the button exists.
    // In our mock, the button is inside data-testid="tooltip-trigger"
    // We can search for the button by aria-label directly if it's rendered

    // Note: Radix DropdownMenu might need some mocking or interaction if it doesn't render content immediately.
    // However, for this test, we just want to check if the aria-label is present in the code structure we added.
    // Since DropdownMenu content is usually not in DOM until open, we clicked it.

    const deleteButton = screen.getByLabelText('Şablonu sil');
    expect(deleteButton).toBeInTheDocument();
  });
});
