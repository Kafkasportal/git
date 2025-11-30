'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Construction, ArrowLeft, Clock, Code, Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layouts/PageLayout';

interface PlaceholderPageProps {
  title: string;
  description?: string;
  estimatedDate?: string;
  features?: string[];
}

export function PlaceholderPage({
  title,
  description,
  estimatedDate,
  features = [],
}: PlaceholderPageProps) {
  const router = useRouter();

  return (
    <PageLayout
      title={title}
      description={description || 'Bu sayfa geliştirme aşamasındadır'}
      badge={{ text: 'Geliştiriliyor', variant: 'secondary' }}
      showBackButton={true}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Main Construction Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card variant="elevated" className="border-2 h-full">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="inline-flex p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-6"
                >
                  <Construction className="h-16 w-16 text-primary" />
                </motion.div>
                <h3 className="text-2xl font-heading font-bold text-foreground mb-3">
                  Geliştirme Aşamasında
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {title} sayfası aktif olarak geliştirilmektedir ve yakında kullanıma açılacaktır.
                </p>
                {estimatedDate && (
                  <Badge variant="secondary" className="gap-2 px-4 py-2">
                    <Clock className="h-4 w-4" />
                    <span>Tahmini: {estimatedDate}</span>
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-4"
        >
          {/* Status Card */}
          <Card variant="elevated" className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Code className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-heading font-semibold text-foreground mb-2">
                    Geliştirme Durumu
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Backend entegrasyonu ve frontend bileşenleri aktif olarak geliştirilmektedir.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Card */}
          {features.length > 0 && (
            <Card variant="elevated" className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-green-500/10">
                    <Rocket className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-heading font-semibold text-foreground mb-3">
                      Planlanan Özellikler
                    </h4>
                    <ul className="space-y-2">
                      {features.map((feature, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {feature}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="flex items-center justify-center gap-3"
      >
        <Button
          variant="outline"
          onClick={() => {
            router.push('/genel');
          }}
          className="gap-2"
        >
          Ana Sayfaya Dön
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            router.back();
          }}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Geri
        </Button>
      </motion.div>
    </PageLayout>
  );
}
