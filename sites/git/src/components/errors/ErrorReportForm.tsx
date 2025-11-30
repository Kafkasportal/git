'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import logger from '@/lib/logger';
import { reportUserError } from '@/lib/error-tracker';

interface ErrorReportFormProps {
  userId?: string;
  trigger?: React.ReactNode;
}

export function ErrorReportForm({ userId, trigger }: ErrorReportFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast.error('Lütfen başlık ve açıklama girin');
      return;
    }

    setSubmitting(true);

    try {
      await reportUserError(title, description, userId);
      toast.success('Hata raporu başarıyla gönderildi');
      setTitle('');
      setDescription('');
      setOpen(false);
    } catch (error) {
      logger.error('Error report submission failed', { error });
      toast.error('Hata raporu gönderilemedi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <AlertCircle className="h-4 w-4 mr-2" />
            Hata Bildir
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Hata Bildir</DialogTitle>
          <DialogDescription>
            Karşılaştığınız sorunu aşağıdaki forma yazarak bize bildirin.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Başlık</Label>
            <Input
              id="title"
              placeholder="Kısa bir başlık girin"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              placeholder="Sorunu detaylı bir şekilde açıklayın..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
              rows={6}
              maxLength={2000}
              required
            />
            <p className="text-xs text-muted-foreground">{description.length}/2000 karakter</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-xs text-blue-800">
              <strong>Not:</strong> Tarayıcı ve sistem bilgileriniz otomatik olarak eklenecektir.
              Kişisel verileriniz güvende tutulmaktadır.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              İptal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Gönder
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
