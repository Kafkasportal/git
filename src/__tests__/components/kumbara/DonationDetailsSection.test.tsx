/**
 * Tests for DonationDetailsSection component
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { useForm, FormProvider, UseFormReturn } from "react-hook-form";
import { DonationDetailsSection } from "@/components/kumbara/sections/DonationDetailsSection";
import type { KumbaraCreateInput } from "@/lib/validations/kumbara";

// Wrapper component to properly use React hooks
function TestWrapper({
  children,
  currentCurrency = "TRY",
}: {
  children: (methods: UseFormReturn<KumbaraCreateInput>) => React.ReactNode;
  currentCurrency?: "TRY" | "USD" | "EUR";
}) {
  const methods = useForm<KumbaraCreateInput>({
    defaultValues: {
      donor_name: "",
      donor_phone: "",
      amount: 0,
      currency: currentCurrency,
      payment_method: "Nakit",
      donation_type: "Kumbara",
      donation_purpose: "Kumbara Bağışı",
      kumbara_location: "",
      kumbara_institution: "",
      collection_date: new Date().toISOString().split("T")[0],
      status: "pending",
      is_kumbara: true,
      notes: "",
    },
  });

  return <FormProvider {...methods}>{children(methods)}</FormProvider>;
}

describe("DonationDetailsSection", () => {
  const renderWithForm = (currentCurrency: "TRY" | "USD" | "EUR" = "TRY") => {
    let methods: UseFormReturn<KumbaraCreateInput> | null = null;

    const result = render(
      <TestWrapper currentCurrency={currentCurrency}>
        {(m) => {
          methods = m;
          return (
            <DonationDetailsSection
              control={m.control}
              currentCurrency={currentCurrency}
            />
          );
        }}
      </TestWrapper>
    );

    return { ...result, methods: methods! };
  };

  it("should render the section title", () => {
    renderWithForm();
    expect(screen.getByText("Bağış Detayları")).toBeInTheDocument();
  });

  it("should render all required fields", () => {
    renderWithForm();

    // Use getByText instead of getByLabelText since shadcn components may use custom label structures
    expect(screen.getByText(/Tutar/i)).toBeInTheDocument();
    expect(screen.getByText(/Para Birimi/i)).toBeInTheDocument();
    expect(screen.getByText(/Ödeme/i)).toBeInTheDocument();
  });

  it("should show required asterisk for all fields", () => {
    renderWithForm();

    const amountLabel = screen.getByText(/Tutar/i).closest("label");
    expect(amountLabel).toHaveTextContent("*");

    const currencyLabel = screen.getByText(/Para Birimi/i).closest("label");
    expect(currencyLabel).toHaveTextContent("*");

    const paymentLabel = screen.getByText(/Ödeme/i).closest("label");
    expect(paymentLabel).toHaveTextContent("*");
  });

  it("should display correct currency symbol for TRY", () => {
    renderWithForm("TRY");
    expect(screen.getByText("₺")).toBeInTheDocument();
  });

  it("should display correct currency symbol for USD", () => {
    renderWithForm("USD");
    expect(screen.getByText("$")).toBeInTheDocument();
  });

  it("should display correct currency symbol for EUR", () => {
    renderWithForm("EUR");
    expect(screen.getByText("€")).toBeInTheDocument();
  });

  it("should allow numeric input in amount field", async () => {
    const user = userEvent.setup();
    const { methods } = renderWithForm();

    const input = screen.getByPlaceholderText("0.00");
    await user.clear(input);
    await user.type(input, "1500.50");

    const amountValue = methods.getValues("amount");
    expect(amountValue).toBe(1500.5);
  });

  it('should have step="0.01" for decimal amounts', () => {
    renderWithForm();
    const input = screen.getByPlaceholderText("0.00") as HTMLInputElement;
    expect(input.step).toBe("0.01");
  });

  it('should have min="0.01" to prevent negative amounts', () => {
    renderWithForm();
    const input = screen.getByPlaceholderText("0.00") as HTMLInputElement;
    expect(input.min).toBe("0.01");
  });

  // ...existing code...

  it("should render in a 3-column grid layout", () => {
    const { container } = renderWithForm();

    const gridContainer = container.querySelector(".grid.grid-cols-3");
    expect(gridContainer).toBeInTheDocument();
  });

  it("should have money bag emoji in section header", () => {
    renderWithForm();
    expect(screen.getByText("💰")).toBeInTheDocument();
  });

  it("should have green-themed styling", () => {
    const { container } = renderWithForm();

    const section = container.querySelector(".bg-green-50\\/50");
    expect(section).toBeInTheDocument();
  });

  it("should update currency symbol when currency changes", async () => {
    const { rerender } = renderWithForm("TRY");

    expect(screen.getByText("₺")).toBeInTheDocument();

    // Rerender with USD using the TestWrapper pattern
    rerender(
      <TestWrapper currentCurrency="USD">
        {(m) => (
          <DonationDetailsSection control={m.control} currentCurrency="USD" />
        )}
      </TestWrapper>,
    );

    expect(screen.getByText("$")).toBeInTheDocument();
  });
});
