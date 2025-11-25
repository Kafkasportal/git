import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  total,
  limit,
  onPageChange,
}: PaginationProps) {
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      <p className="text-sm text-muted-foreground">
        Toplam <span className="font-semibold text-foreground">{total}</span> kayıt
        {total > 0 && ` (${startItem}-${endItem} görüntüleniyor)`}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            onPageChange(Math.max(1, currentPage - 1));
          }}
          disabled={currentPage === 1}
          className="h-9 w-9"
          title="Önceki sayfa"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1 px-2">
          <span className="text-sm text-muted-foreground">Sayfa</span>
          <Input
            type="number"
            value={currentPage}
            onChange={(e) => {
              const page = Number(e.target.value);
              if (page >= 1 && page <= totalPages) {
                onPageChange(page);
              }
            }}
            className="h-9 w-14 text-center"
            min="1"
            max={totalPages}
          />
          <span className="text-sm text-muted-foreground">/ {totalPages}</span>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            onPageChange(Math.min(totalPages, currentPage + 1));
          }}
          disabled={currentPage === totalPages}
          className="h-9 w-9"
          title="Sonraki sayfa"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

/**
 * Simplified pagination component for compact layouts
 */
export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
}: SimplePaginationProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          onPageChange(currentPage - 1);
        }}
        disabled={currentPage === 1 || isLoading}
        className="h-8"
      >
        ← Önceki
      </Button>

      <span className="text-sm text-muted-foreground px-2 min-w-[80px] text-center">
        {currentPage} / {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          onPageChange(currentPage + 1);
        }}
        disabled={currentPage === totalPages || isLoading}
        className="h-8"
      >
        Sonraki →
      </Button>
    </div>
  );
}
