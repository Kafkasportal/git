/**
 * useExport Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock dependencies
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  default: {
    error: vi.fn(),
  },
}));

vi.mock("@/lib/export/export-service", () => ({
  exportData: vi.fn(),
  ExportType: {
    PDF: "pdf",
    EXCEL: "excel",
    CSV: "csv",
  },
}));

import {
  useExport,
  beneficiaryExportColumns,
  donationExportColumns,
} from "@/hooks/useExport";
import { exportData } from "@/lib/export/export-service";
import { toast } from "sonner";

describe("useExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (exportData as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it("should initialize with isExporting as false", () => {
    const { result } = renderHook(() => useExport());

    expect(result.current.isExporting).toBe(false);
  });

  it("should have exportPDF, exportExcel, exportCSV functions", () => {
    const { result } = renderHook(() => useExport());

    expect(typeof result.current.exportPDF).toBe("function");
    expect(typeof result.current.exportExcel).toBe("function");
    expect(typeof result.current.exportCSV).toBe("function");
  });

  it("should set isExporting to true during export", async () => {
    let resolveExport: () => void;
    const exportPromise = new Promise<void>((resolve) => {
      resolveExport = resolve;
    });
    (exportData as ReturnType<typeof vi.fn>).mockReturnValue(exportPromise);

    const { result } = renderHook(() => useExport());

    act(() => {
      result.current.exportPDF({
        title: "Test",
        data: [],
        columns: beneficiaryExportColumns,
      });
    });

    expect(result.current.isExporting).toBe(true);

    await act(async () => {
      resolveExport!();
    });

    await waitFor(() => {
      expect(result.current.isExporting).toBe(false);
    });
  });

  it("should show success toast on successful PDF export", async () => {
    const { result } = renderHook(() => useExport());

    await act(async () => {
      await result.current.exportPDF({
        title: "Test",
        data: [],
        columns: beneficiaryExportColumns,
      });
    });

    expect(toast.success).toHaveBeenCalledWith("PDF başarıyla oluşturuldu");
  });

  it("should show success toast on successful Excel export", async () => {
    const { result } = renderHook(() => useExport());

    await act(async () => {
      await result.current.exportExcel({
        filename: "test",
        data: [],
        columns: beneficiaryExportColumns,
      });
    });

    expect(toast.success).toHaveBeenCalledWith(
      "Excel dosyası başarıyla oluşturuldu",
    );
  });

  it("should show success toast on successful CSV export", async () => {
    const { result } = renderHook(() => useExport());

    await act(async () => {
      await result.current.exportCSV({
        filename: "test",
        data: [],
        columns: beneficiaryExportColumns,
      });
    });

    expect(toast.success).toHaveBeenCalledWith(
      "CSV dosyası başarıyla oluşturuldu",
    );
  });

  it("should show error toast on export failure", async () => {
    (exportData as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Export failed"),
    );

    const { result } = renderHook(() => useExport());

    await act(async () => {
      await result.current.exportPDF({
        title: "Test",
        data: [],
        columns: beneficiaryExportColumns,
      });
    });

    expect(toast.error).toHaveBeenCalledWith(
      "Dışa aktarma sırasında bir hata oluştu",
    );
  });

  it("should call onSuccess callback on successful export", async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useExport({ onSuccess }));

    await act(async () => {
      await result.current.exportPDF({
        title: "Test",
        data: [],
        columns: beneficiaryExportColumns,
      });
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it("should call onError callback on export failure", async () => {
    const testError = new Error("Export failed");
    (exportData as ReturnType<typeof vi.fn>).mockRejectedValue(testError);

    const onError = vi.fn();
    const { result } = renderHook(() => useExport({ onError }));

    await act(async () => {
      await result.current.exportPDF({
        title: "Test",
        data: [],
        columns: beneficiaryExportColumns,
      });
    });

    expect(onError).toHaveBeenCalledWith(testError);
  });
});

describe("Export Columns", () => {
  it("should have correct beneficiary export columns", () => {
    expect(beneficiaryExportColumns).toHaveLength(6);
    expect(beneficiaryExportColumns[0]).toEqual({
      header: "Ad Soyad",
      key: "name",
      width: 40,
    });
  });

  it("should have correct donation export columns", () => {
    expect(donationExportColumns).toHaveLength(5);
    expect(donationExportColumns[0]).toEqual({
      header: "Bağışçı",
      key: "donor_name",
      width: 40,
    });
  });

  it("should have formatter for donation amount column", () => {
    const amountColumn = donationExportColumns.find(
      (col) => col.key === "amount",
    );
    expect(amountColumn).toBeDefined();
    expect(amountColumn?.formatter).toBeDefined();

    // Test formatter
    const formatted = amountColumn?.formatter?.(1000);
    expect(formatted).toContain("1.000");
  });
});
