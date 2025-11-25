'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PiggyBank } from 'lucide-react';
import { KumbaraStats } from '@/components/kumbara/KumbaraStats';
import { KumbaraCharts } from '@/components/kumbara/KumbaraCharts';
import { KumbaraList } from '@/components/kumbara/KumbaraList';

export default function KumbaraPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-6 w-6 text-blue-600" />
            <h2 className="text-3xl font-bold tracking-tight">Kumbara Takibi</h2>
          </div>
          <p className="text-muted-foreground">Kumbara bağışlarını takip edin ve yönetin</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="charts">Analitikler</TabsTrigger>
          <TabsTrigger value="list">Kumbara Listesi</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <KumbaraStats />
          <KumbaraList onCreate={() => {}} />
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <KumbaraCharts />
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <KumbaraList onCreate={() => {}} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
