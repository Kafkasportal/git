'use client';

/**
 * MetricCard Component - Usage Examples
 *
 * This file contains usage examples for the MetricCard component.
 * These examples demonstrate different use cases and configurations.
 */

import {
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Heart,
  Package,
  CreditCard,
  Target,
} from 'lucide-react';
import {
  MetricCard,
  MetricCardsGrid,
  ComparisonMetricCard,
  type MetricCardProps,
} from './metric-card';

/**
 * Example 1: Basic Metric Card
 */
export function BasicMetricCardExample() {
  return (
    <MetricCard
      title="Toplam Bağış"
      value={150000}
      prefix="₺"
      variant="default"
      icon={DollarSign}
    />
  );
}

/**
 * Example 2: Gradient Metric Card with Trend
 */
export function GradientMetricCardExample() {
  return (
    <MetricCard
      title="Aktif Kullanıcılar"
      value={1250}
      suffix="kullanıcı"
      variant="gradient"
      icon={Users}
      animated
      trend={{
        value: 12.5,
        direction: 'up',
        label: 'Bu ay',
      }}
    />
  );
}

/**
 * Example 3: Metric Card with Sub-Metrics
 */
export function SubMetricsExample() {
  return (
    <MetricCard
      title="Toplam Gelir"
      value={2500000}
      prefix="₺"
      decimals={2}
      variant="success"
      icon={TrendingUp}
      animated
      trend={{
        value: 8.3,
        direction: 'up',
        label: 'Son 30 gün',
      }}
      subMetrics={[
        { label: 'Nakit', value: '₺1.2M', icon: DollarSign },
        { label: 'Online', value: '₺1.3M', icon: CreditCard },
      ]}
    />
  );
}

/**
 * Example 4: Comparison Metric Card
 */
export function ComparisonMetricCardExample() {
  return (
    <ComparisonMetricCard
      title="Aylık Bağış"
      value={85000}
      previousValue={72000}
      prefix="₺"
      variant="info"
      icon={Heart}
      animated
      comparisonLabel="Geçen ay"
    />
  );
}

/**
 * Example 5: Loading State
 */
export function LoadingMetricCardExample() {
  return <MetricCard title="Yükleniyor" value={0} loading />;
}

/**
 * Example 6: Small Size
 */
export function SmallMetricCardExample() {
  return (
    <MetricCard
      title="Yeni Kayıtlar"
      value={42}
      size="sm"
      variant="outlined"
      icon={Users}
      trend={{
        value: 5,
        direction: 'up',
      }}
    />
  );
}

/**
 * Example 7: Large Size with Description
 */
export function LargeMetricCardExample() {
  return (
    <MetricCard
      title="Toplam Proje"
      value={156}
      suffix="proje"
      size="lg"
      description="Aktif ve tamamlanan tüm projeler"
      variant="default"
      icon={Package}
    />
  );
}

/**
 * Example 8: Error Variant (Negative Trend)
 */
export function ErrorVariantExample() {
  return (
    <MetricCard
      title="İptal Edilen"
      value={12}
      variant="error"
      icon={Target}
      trend={{
        value: 3.2,
        direction: 'down',
        label: 'Bu hafta',
      }}
    />
  );
}

/**
 * Example 9: Multiple Metrics Grid (Dashboard)
 */
export function MetricsGridExample() {
  const metrics: MetricCardProps[] = [
    {
      title: 'Toplam Bağış',
      value: 2500000,
      prefix: '₺',
      variant: 'gradient',
      icon: DollarSign,
      animated: true,
      trend: {
        value: 12.5,
        direction: 'up',
        label: 'Bu ay',
      },
    },
    {
      title: 'Yararlanıcılar',
      value: 847,
      suffix: 'kişi',
      variant: 'success',
      icon: Users,
      animated: true,
      trend: {
        value: 8.3,
        direction: 'up',
        label: 'Yeni kayıt',
      },
    },
    {
      title: 'Toplantılar',
      value: 24,
      variant: 'info',
      icon: Calendar,
      animated: true,
      trend: {
        value: 2,
        direction: 'neutral',
        label: 'Bu ay',
      },
    },
    {
      title: 'Aktif Projeler',
      value: 15,
      suffix: 'proje',
      variant: 'warning',
      icon: Package,
      animated: true,
      trend: {
        value: 1,
        direction: 'down',
        label: 'Devam ediyor',
      },
    },
  ];

  return (
    <MetricCardsGrid columns={4} gap="md">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </MetricCardsGrid>
  );
}

/**
 * Example 10: Interactive Metric Card (with onClick)
 */
export function InteractiveMetricCardExample() {
  const handleClick = () => {
    alert('Metric card clicked!');
  };

  return (
    <MetricCard
      title="Tıklanabilir Kart"
      value={999}
      variant="default"
      icon={Target}
      onClick={handleClick}
      trend={{
        value: 15,
        direction: 'up',
      }}
    />
  );
}

/**
 * Example 11: Glass Effect (for dark backgrounds)
 */
export function GlassMetricCardExample() {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-8 rounded-xl">
      <MetricCard
        title="Premium Üyeler"
        value={342}
        suffix="üye"
        variant="glass"
        icon={Users}
        animated
        trend={{
          value: 18,
          direction: 'up',
          label: 'Bu yıl',
        }}
      />
    </div>
  );
}

/**
 * Example 12: Full Dashboard Example
 */
export function DashboardExample() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard Özeti</h2>

      {/* Primary Metrics */}
      <MetricCardsGrid columns={4} gap="lg">
        <MetricCard
          title="Toplam Gelir"
          value={3750000}
          prefix="₺"
          variant="gradient"
          icon={DollarSign}
          animated
          animationDuration={2500}
          trend={{
            value: 15.3,
            direction: 'up',
            label: 'Bu ay',
          }}
        />
        <ComparisonMetricCard
          title="Bağışçılar"
          value={1250}
          previousValue={1100}
          suffix="kişi"
          variant="success"
          icon={Heart}
          animated
        />
        <MetricCard
          title="Yararlanıcılar"
          value={847}
          suffix="aile"
          variant="info"
          icon={Users}
          animated
          trend={{
            value: 12,
            direction: 'up',
            label: 'Aktif',
          }}
        />
        <MetricCard
          title="Projeler"
          value={23}
          variant="warning"
          icon={Package}
          animated
          trend={{
            value: 2,
            direction: 'neutral',
            label: 'Devam ediyor',
          }}
        />
      </MetricCardsGrid>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          title="Aylık Hedef"
          value={500000}
          prefix="₺"
          size="sm"
          variant="outlined"
          icon={Target}
          subMetrics={[
            { label: 'Gerçekleşen', value: '₺425K' },
            { label: 'Kalan', value: '₺75K' },
          ]}
        />
        <MetricCard
          title="Toplantılar"
          value={8}
          size="sm"
          variant="outlined"
          icon={Calendar}
          trend={{
            value: 1,
            direction: 'up',
            label: 'Bu hafta',
          }}
        />
      </div>
    </div>
  );
}
