import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils/format";
import logger from "@/lib/logger";
import type { FinanceRecord } from "@/lib/financial/calculations";

// jsPDF-autotable için tip genişletmesi
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

export const exportToPDF = (
  records: FinanceRecord[],
  title: string = "Finansal Rapor",
) => {
  // Lazy-load heavy dependencies to keep initial JS small
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  return (async () => {
    const [jspdfMod, autoTableMod] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
    const JsPDF =
      (jspdfMod as unknown as { jsPDF?: new (...args: any[]) => any }).jsPDF ||
      ((jspdfMod as unknown as { default?: new (...args: any[]) => any }).default as any);
    const autoTable =
      ((autoTableMod as unknown as { default?: any }).default as any) ||
      ((autoTableMod as unknown as { autoTable?: any }).autoTable as any);

    if (!JsPDF || !autoTable) {
      throw new Error("PDF kütüphanesi yüklenemedi");
    }

  // A4 boyutunda dikey PDF oluştur
    const doc = new JsPDF();

  // Başlık
    doc.setFontSize(18);
    doc.text(title, 14, 22);

  // Rapor Tarihi
  doc.setFontSize(11);
  doc.setTextColor(100);
  const reportDate = format(new Date(), "d MMMM yyyy HH:mm", { locale: tr });
  doc.text(`Rapor Tarihi: ${reportDate}`, 14, 30);

  // Tablo Verilerini Hazırla
  const tableBody = records.map((record) => [
    format(new Date(record.transaction_date), "d MMM yyyy", { locale: tr }),
    record.record_type === "income" ? "Gelir" : "Gider",
    record.category,
    record.description,
    record.status === "approved"
      ? "Onaylandı"
      : record.status === "pending"
        ? "Bekliyor"
        : "Reddedildi",
    formatCurrency(record.amount, record.currency),
  ]);

  // Toplam Tutarlar
  const totalIncome = records
    .filter((r) => r.record_type === "income" && r.status === "approved")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpense = records
    .filter((r) => r.record_type === "expense" && r.status === "approved")
    .reduce((sum, r) => sum + r.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Tabloyu Oluştur
    autoTable(doc, {
    head: [["Tarih", "Tip", "Kategori", "Açıklama", "Durum", "Tutar"]],
    body: tableBody,
    startY: 40,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 25 }, // Tarih
      1: { cellWidth: 15 }, // Tip
      2: { cellWidth: 30 }, // Kategori
      3: { cellWidth: "auto" }, // Açıklama (otomatik genişlik)
      4: { cellWidth: 20 }, // Durum
      5: { cellWidth: 25, halign: "right" }, // Tutar
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    didDrawPage: (_data: unknown) => {
      // Alt Bilgi (Sayfa Numarası)
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.text(
        `Sayfa ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" },
      );
    },
    });

  // Özet Bilgiler (Tablonun altına)
    const finalY = doc.lastAutoTable.finalY + 10;

  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text("Özet:", 14, finalY);

  doc.setFontSize(10);
  doc.text(
    `Toplam Gelir: ${formatCurrency(totalIncome, "TRY")}`,
    14,
    finalY + 7,
  );
  doc.text(
    `Toplam Gider: ${formatCurrency(totalExpense, "TRY")}`,
    14,
    finalY + 14,
  );

  // Net Bakiye Rengi (Pozitif: Yeşil, Negatif: Kırmızı)
  if (netBalance >= 0) {
    doc.setTextColor(0, 128, 0);
  } else {
    doc.setTextColor(220, 53, 69);
  }
  doc.text(`Net Bakiye: ${formatCurrency(netBalance, "TRY")}`, 14, finalY + 21);

  // PDF'i indir
    doc.save(`Finansal_Rapor_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  })();
};

// Legacy PDF generation functions
// These functions are placeholders for future implementation
