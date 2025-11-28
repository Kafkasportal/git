'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { toast } from 'sonner';

interface KumbaraQRCode {
  id: string;
  donor_name: string;
  kumbara_location: string;
  kumbara_institution: string;
  collection_date: string;
  amount: number;
  currency: string;
  receipt_number: string;
}

interface KumbaraPrintQRProps {
  kumbara: KumbaraQRCode;
  qrDataUrl?: string;
}

export function KumbaraPrintQR({ kumbara, qrDataUrl }: KumbaraPrintQRProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const handlePrint = () => {
    window.print();
    toast.success('Yazdırma işlemi başlatıldı');
  };

  return (
    <>
      {/* Print Button */}
      <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
        <Printer className="h-4 w-4" />
        Yazdır
      </Button>

      {/* Hidden Print Layout */}
      <style jsx global>{`
        @media print {
          @page {
            size: 40mm 30mm;
            margin: 2mm;
          }

          body * {
            visibility: hidden;
          }

          .print-layout,
          .print-layout * {
            visibility: visible;
          }

          .print-layout {
            position: absolute;
            left: 0;
            top: 0;
            width: 36mm;
            height: 26mm;
            padding: 2mm;
            font-size: 8px;
            line-height: 1.2;
          }

          .print-header {
            text-align: center;
            margin-bottom: 2mm;
            font-weight: bold;
            font-size: 9px;
          }

          .print-qr {
            width: 16mm;
            height: 16mm;
            margin: 0 auto 2mm;
          }

          .print-qr img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }

          .print-info {
            font-size: 7px;
            line-height: 1.3;
          }

          .print-info div {
            margin-bottom: 0.5mm;
          }

          .print-footer {
            text-align: center;
            margin-top: 2mm;
            font-size: 6px;
            border-top: 0.2mm solid #000;
            padding-top: 1mm;
          }
        }
      `}</style>

      <div className="print-layout hidden">
        <div className="print-header">KUMBA BA BAĞIŞI</div>

        {qrDataUrl && (
          <div className="print-qr">
            <img src={qrDataUrl} alt="Kumbara QR Kodu" />
          </div>
        )}

        <div className="print-info">
          <div>
            <strong>Bağışçı:</strong> {kumbara.donor_name}
          </div>
          <div>
            <strong>Lokasyon:</strong> {kumbara.kumbara_location}
          </div>
          <div>
            <strong>Kurum:</strong> {kumbara.kumbara_institution}
          </div>
          <div>
            <strong>Tutar:</strong> {formatCurrency(kumbara.amount, kumbara.currency)}
          </div>
          <div>
            <strong>Toplama:</strong> {formatDate(kumbara.collection_date)}
          </div>
          <div>
            <strong>Makbuz:</strong> {kumbara.receipt_number}
          </div>
        </div>

        <div className="print-footer">Kumbara bağışınız için teşekkürler</div>
      </div>
    </>
  );
}
