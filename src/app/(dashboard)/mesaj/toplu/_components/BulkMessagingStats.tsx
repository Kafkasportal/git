'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, XCircle, Calendar } from 'lucide-react';
import type { MessageStatistics } from '@/lib/messages/calculations';

interface BulkMessagingStatsProps {
  stats: MessageStatistics;
  isLoading?: boolean;
}

export function BulkMessagingStats({ stats, isLoading }: BulkMessagingStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-32 mb-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total SMS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam SMS</CardTitle>
          <Phone className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalSms}</div>
          <p className="text-xs text-muted-foreground mt-1">Gönderilen mesajlar</p>
        </CardContent>
      </Card>

      {/* Total Emails */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam E-Posta</CardTitle>
          <Mail className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalEmails}</div>
          <p className="text-xs text-muted-foreground mt-1">Gönderilen e-postalar</p>
        </CardContent>
      </Card>

      {/* Failed Messages */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Başarısız</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.failedMessages}</div>
          <p className="text-xs text-muted-foreground mt-1">Başarısız gönderi</p>
        </CardContent>
      </Card>

      {/* This Month */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bu Ay</CardTitle>
          <Calendar className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.thisMonth || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">Toplam gönderi</p>
        </CardContent>
      </Card>
    </div>
  );
}
