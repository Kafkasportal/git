import { format } from "date-fns";
import type { FinanceRecord } from "@/lib/financial/calculations";

export const exportToExcel = async (
  records: FinanceRecord[],
  title: string = "Finansal Rapor",
) => {
  // Lazy-load heavy dependency to keep initial JS small
  const mod = await import("exceljs");
  const ExcelJS = (mod as unknown as { default?: unknown }).default || mod;

  // Workbook oluştur
  const workbook = new (ExcelJS as unknown as { Workbook: new () => any }).Workbook();
  workbook.creator = "Kafkasder Panel";
  workbook.lastModifiedBy = "Kafkasder Panel";
  workbook.created = new Date();
  workbook.modified = new Date();

  // Worksheet ekle
  const worksheet = workbook.addWorksheet(title.substring(0, 31), {
    views: [{ state: "frozen", ySplit: 1 }], // İlk satırı dondur
  });

  // Sütunları tanımla
  worksheet.columns = [
    { header: "Tarih", key: "date", width: 15 },
    { header: "Tip", key: "type", width: 10 },
    { header: "Kategori", key: "category", width: 20 },
    { header: "Açıklama", key: "description", width: 40 },
    { header: "Durum", key: "status", width: 15 },
    {
      header: "Tutar",
      key: "amount",
      width: 15,
      style: { numFmt: '#,##0.00 "₺"' },
    },
    { header: "Para Birimi", key: "currency", width: 10 },
    { header: "Oluşturan", key: "createdBy", width: 20 },
  ];

  // Başlık satırını stilize et
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2980B9" }, // Mavi
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 24;

  // Verileri ekle
  records.forEach((record) => {
    const row = worksheet.addRow({
      date: new Date(record.transaction_date),
      type: record.record_type === "income" ? "Gelir" : "Gider",
      category: record.category,
      description: record.description,
      status:
        record.status === "approved"
          ? "Onaylandı"
          : record.status === "pending"
            ? "Bekliyor"
            : "Reddedildi",
      amount: record.amount,
      currency: record.currency,
      createdBy: record.created_by, // İsim yerine ID olabilir, gerekirse düzeltilmeli
    });

    // Tip sütununu renklendir (Gelir: Yeşil, Gider: Kırmızı)
    const typeCell = row.getCell("type");
    if (record.record_type === "income") {
      typeCell.font = { color: { argb: "FF008000" } }; // Yeşil
    } else {
      typeCell.font = { color: { argb: "FFDC3545" } }; // Kırmızı
    }

    // Durum sütununu renklendir
    const statusCell = row.getCell("status");
    if (record.status === "approved") {
      statusCell.font = { color: { argb: "FF008000" } };
    } else if (record.status === "pending") {
      statusCell.font = { color: { argb: "FFF39C12" } }; // Turuncu
    } else {
      statusCell.font = { color: { argb: "FFDC3545" } };
    }
  });

  // Toplam satırı ekle (Bir satır boşluk bırakarak)
  const totalRowIndex = records.length + 3;

  // Toplam Gelir
  const totalIncome = records
    .filter((r) => r.record_type === "income" && r.status === "approved")
    .reduce((sum, r) => sum + r.amount, 0);

  // Toplam Gider
  const totalExpense = records
    .filter((r) => r.record_type === "expense" && r.status === "approved")
    .reduce((sum, r) => sum + r.amount, 0);

  const netBalance = totalIncome - totalExpense;

  worksheet.getCell(`D${totalRowIndex}`).value = "TOPLAM GELİR:";
  worksheet.getCell(`D${totalRowIndex}`).font = { bold: true };
  worksheet.getCell(`D${totalRowIndex}`).alignment = { horizontal: "right" };
  worksheet.getCell(`F${totalRowIndex}`).value = totalIncome;
  worksheet.getCell(`F${totalRowIndex}`).font = {
    bold: true,
    color: { argb: "FF008000" },
  };

  worksheet.getCell(`D${totalRowIndex + 1}`).value = "TOPLAM GİDER:";
  worksheet.getCell(`D${totalRowIndex + 1}`).font = { bold: true };
  worksheet.getCell(`D${totalRowIndex + 1}`).alignment = {
    horizontal: "right",
  };
  worksheet.getCell(`F${totalRowIndex + 1}`).value = totalExpense;
  worksheet.getCell(`F${totalRowIndex + 1}`).font = {
    bold: true,
    color: { argb: "FFDC3545" },
  };

  worksheet.getCell(`D${totalRowIndex + 2}`).value = "NET BAKİYE:";
  worksheet.getCell(`D${totalRowIndex + 2}`).font = { bold: true };
  worksheet.getCell(`D${totalRowIndex + 2}`).alignment = {
    horizontal: "right",
  };
  worksheet.getCell(`F${totalRowIndex + 2}`).value = netBalance;
  worksheet.getCell(`F${totalRowIndex + 2}`).font = {
    bold: true,
    color: { argb: netBalance >= 0 ? "FF008000" : "FFDC3545" },
  };

  // Dosyayı oluştur ve indir
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `Finansal_Rapor_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
};
