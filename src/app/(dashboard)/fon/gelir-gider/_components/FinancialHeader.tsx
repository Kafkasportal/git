"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Plus, FileSpreadsheet, FileText, File } from "lucide-react";

interface FinancialHeaderProps {
  onExportPDF: () => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
  onAddNew: () => void;
  isAddDialogOpen: boolean;
  onAddDialogOpenChange: (open: boolean) => void;
}

export function FinancialHeader({
  onExportPDF,
  onExportExcel,
  onExportCSV,
  onAddNew: _onAddNew,
  isAddDialogOpen,
  onAddDialogOpenChange,
}: FinancialHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gelir Gider</h1>
        <p className="text-muted-foreground mt-2">
          Gelir ve gider kayıtlarını yönetin
        </p>
      </div>

      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Dışa Aktar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Format Seçin</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onExportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              PDF İndir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportExcel}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel İndir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportCSV}>
              <File className="mr-2 h-4 w-4" />
              CSV İndir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={isAddDialogOpen} onOpenChange={onAddDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Yeni Kayıt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Yeni Gelir/Gider Kaydı</DialogTitle>
              <DialogDescription>
                Yeni bir gelir veya gider kaydı oluşturun
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-center text-muted-foreground py-8">
                Yeni kayıt formu geliştirilme aşamasındadır.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
