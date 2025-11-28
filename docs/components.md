# 🧱 Bileşen Kütüphanesi

Bu döküman, Dernek Yönetim Sistemi'ndeki UI bileşenlerini ve kullanımlarını açıklar.

## 📦 Bileşen Kategorileri

```
components/
├── ui/           # Temel/Atomik UI bileşenleri (Radix + shadcn/ui)
├── forms/        # Form bileşenleri
├── layouts/      # Layout bileşenleri
├── tables/       # Tablo bileşenleri
├── analytics/    # Analitik bileşenleri
├── errors/       # Hata bileşenleri
├── pwa/          # PWA bileşenleri
└── [feature]/    # Özellik bazlı bileşenler
```

---

## 🎨 Temel UI Bileşenleri

### Button

```tsx
import { Button } from '@/components/ui/button';

// Varyantlar
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Boyutlar
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Plus /></Button>

// Loading durumu
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? 'Yükleniyor...' : 'Kaydet'}
</Button>
```

### Input

```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

<div className="space-y-2">
  <Label htmlFor="email">E-posta</Label>
  <Input
    id="email"
    type="email"
    placeholder="ornek@mail.com"
    disabled={false}
    aria-invalid={!!error}
    aria-describedby={error ? 'email-error' : undefined}
  />
  {error && (
    <p id="email-error" className="text-sm text-red-600">{error}</p>
  )}
</div>
```

### Select

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

<Select onValueChange={(value) => setValue(value)} defaultValue={defaultValue}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Seçiniz" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Seçenek 1</SelectItem>
    <SelectItem value="option2">Seçenek 2</SelectItem>
    <SelectItem value="option3">Seçenek 3</SelectItem>
  </SelectContent>
</Select>
```

### Card

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Kart Başlığı</CardTitle>
    <CardDescription>Kart açıklaması</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Kart içeriği</p>
  </CardContent>
  <CardFooter className="flex justify-between">
    <Button variant="outline">İptal</Button>
    <Button>Kaydet</Button>
  </CardFooter>
</Card>
```

### Badge

```tsx
import { Badge } from '@/components/ui/badge';

<Badge variant="default">Varsayılan</Badge>
<Badge variant="secondary">İkincil</Badge>
<Badge variant="destructive">Tehlikeli</Badge>
<Badge variant="outline">Outline</Badge>

// Durum badge'leri
<Badge variant={status === 'active' ? 'default' : 'secondary'}>
  {status === 'active' ? 'Aktif' : 'Pasif'}
</Badge>
```

### Dialog (Modal)

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Modal Aç</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Modal Başlığı</DialogTitle>
      <DialogDescription>Modal açıklaması</DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      {/* İçerik */}
    </div>
    <DialogFooter>
      <Button onClick={() => setIsOpen(false)}>Kapat</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Alert Dialog (Onay)

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Sil</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Silmek istediğinize emin misiniz?</AlertDialogTitle>
      <AlertDialogDescription>
        Bu işlem geri alınamaz. Kayıt kalıcı olarak silinecektir.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>İptal</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Sil</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Tabs

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Tabs defaultValue="genel" className="w-full">
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="genel">Genel</TabsTrigger>
    <TabsTrigger value="detay">Detay</TabsTrigger>
    <TabsTrigger value="tarihce">Tarihçe</TabsTrigger>
  </TabsList>
  <TabsContent value="genel">
    <Card>
      <CardContent>Genel bilgiler...</CardContent>
    </Card>
  </TabsContent>
  <TabsContent value="detay">
    <Card>
      <CardContent>Detaylı bilgiler...</CardContent>
    </Card>
  </TabsContent>
  <TabsContent value="tarihce">
    <Card>
      <CardContent>Tarihçe...</CardContent>
    </Card>
  </TabsContent>
</Tabs>
```

---

## 📊 Veri Görüntüleme

### DataTable

```tsx
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

// Kolon tanımları
const columns: ColumnDef<Beneficiary>[] = [
  {
    accessorKey: 'name',
    header: 'Ad Soyad',
    cell: ({ row }) => (
      <Link href={`/yardim/ihtiyac-sahipleri/${row.original.$id}`}>
        {row.getValue('name')}
      </Link>
    ),
  },
  {
    accessorKey: 'phone',
    header: 'Telefon',
  },
  {
    accessorKey: 'city',
    header: 'Şehir',
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: 'status',
    header: 'Durum',
    cell: ({ row }) => (
      <Badge variant={row.getValue('status') === 'AKTIF' ? 'default' : 'secondary'}>
        {row.getValue('status')}
      </Badge>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleView(row.original)}>
            Görüntüle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleEdit(row.original)}>
            Düzenle
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleDelete(row.original)}
            className="text-red-600"
          >
            Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

// Kullanım
<DataTable
  columns={columns}
  data={beneficiaries}
  searchKey="name"
  searchPlaceholder="Ad Soyad ile ara..."
  pagination={{
    pageIndex: 0,
    pageSize: 10,
  }}
/>
```

### VirtualizedDataTable

Büyük veri setleri için:

```tsx
import { VirtualizedDataTable } from '@/components/ui/virtualized-data-table';

<VirtualizedDataTable
  columns={columns}
  data={largeDataset}
  rowHeight={52}
  overscan={5}
/>
```

### Pagination

```tsx
import { Pagination } from '@/components/ui/pagination';

<Pagination
  currentPage={page}
  totalPages={Math.ceil(total / pageSize)}
  onPageChange={(newPage) => setPage(newPage)}
  pageSize={pageSize}
  onPageSizeChange={(size) => setPageSize(size)}
  pageSizeOptions={[10, 20, 50, 100]}
  showPageSizeSelector
/>
```

---

## 📈 Metrik ve İstatistik

### KPICard

```tsx
import { KPICard } from '@/components/ui/kpi-card';

<KPICard
  title="Toplam Bağış"
  value={250000}
  format="currency"
  currency="TRY"
  change={15.5}
  changeDirection="up"
  icon={<Heart className="h-6 w-6" />}
  description="Bu ay"
/>
```

### MetricCard

```tsx
import { MetricCard } from '@/components/ui/metric-card';

<MetricCard
  title="Aktif İhtiyaç Sahibi"
  value={1250}
  subtitle="Son güncelleme: Bugün"
  trend={{ value: 5, direction: 'up' }}
  icon={<Users />}
  className="bg-gradient-to-br from-blue-50 to-blue-100"
/>
```

### StatCard

```tsx
import { StatCard } from '@/components/ui/stat-card';

<StatCard
  label="Bekleyen Başvuru"
  value={42}
  variant="warning"
/>
```

---

## 🎯 Layout Bileşenleri

### PageLayout

```tsx
import { PageLayout } from '@/components/ui/page-layout';

<PageLayout
  title="İhtiyaç Sahipleri"
  description="Kayıtlı ihtiyaç sahiplerini yönetin"
  actions={
    <Button onClick={() => router.push('/yardim/ihtiyac-sahipleri/yeni')}>
      <Plus className="mr-2 h-4 w-4" />
      Yeni Ekle
    </Button>
  }
>
  {/* Sayfa içeriği */}
</PageLayout>
```

### BreadcrumbNav

```tsx
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';

// Otomatik route tabanlı breadcrumb
<BreadcrumbNav />

// Manuel breadcrumb
<BreadcrumbNav
  items={[
    { label: 'Ana Sayfa', href: '/' },
    { label: 'Yardım', href: '/yardim' },
    { label: 'İhtiyaç Sahipleri', href: '/yardim/ihtiyac-sahipleri' },
    { label: 'Detay' }, // Son item - link yok
  ]}
/>
```

### ModernSidebar

```tsx
import { ModernSidebar } from '@/components/ui/modern-sidebar';

<ModernSidebar
  isMobileOpen={isMobileOpen}
  onMobileToggle={() => setIsMobileOpen(false)}
/>
```

---

## 📝 Form Bileşenleri

### FileUpload

```tsx
import { FileUpload } from '@/components/ui/file-upload';

<FileUpload
  label="Belge Yükle"
  accept="application/pdf,image/*"
  maxSize={5 * 1024 * 1024} // 5MB
  onFileSelect={(file) => handleFileSelect(file)}
  onError={(error) => toast.error(error)}
  preview={true}
  showProgress={true}
/>
```

### DatePicker

```tsx
import { DatePicker } from '@/components/ui/date-picker';

<DatePicker
  value={date}
  onChange={(newDate) => setDate(newDate)}
  placeholder="Tarih seçin"
  format="dd/MM/yyyy"
  minDate={new Date()}
  disabled={false}
/>
```

### Calendar

```tsx
import { Calendar } from '@/components/ui/calendar';

<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  disabled={(date) => date < new Date()}
  className="rounded-md border"
/>
```

---

## ⚠️ Geri Bildirim Bileşenleri

### Toast (Sonner)

```tsx
import { toast } from 'sonner';

// Başarı
toast.success('İşlem başarıyla tamamlandı');

// Hata
toast.error('Bir hata oluştu');

// Bilgi
toast.info('Bilgilendirme mesajı');

// Uyarı
toast.warning('Dikkat edilmesi gereken durum');

// Promise toast
toast.promise(saveData(), {
  loading: 'Kaydediliyor...',
  success: 'Başarıyla kaydedildi',
  error: 'Kaydetme başarısız',
});

// Özelleştirilmiş
toast('Özel mesaj', {
  description: 'Açıklama metni',
  action: {
    label: 'Geri Al',
    onClick: () => undoAction(),
  },
});
```

### Alert

```tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

<Alert variant="default">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Bilgi</AlertTitle>
  <AlertDescription>Bu bir bilgi mesajıdır.</AlertDescription>
</Alert>

<Alert variant="destructive">
  <XCircle className="h-4 w-4" />
  <AlertTitle>Hata</AlertTitle>
  <AlertDescription>Bir hata oluştu.</AlertDescription>
</Alert>
```

### ErrorAlert

```tsx
import { ErrorAlert } from '@/components/ui/error-alert';

<ErrorAlert
  title="Veri yüklenemedi"
  error={error}
  retry={() => refetch()}
/>
```

### EmptyState

```tsx
import { EmptyState } from '@/components/ui/empty-state';

<EmptyState
  icon={<Inbox className="h-12 w-12" />}
  title="Kayıt bulunamadı"
  description="Henüz kayıt eklenmemiş veya arama kriterlerinize uygun sonuç yok."
  action={
    <Button onClick={() => router.push('/yeni')}>
      <Plus className="mr-2 h-4 w-4" />
      Yeni Ekle
    </Button>
  }
/>
```

---

## ⏳ Loading Bileşenleri

### LoadingOverlay

```tsx
import { LoadingOverlay } from '@/components/ui/loading-overlay';

<LoadingOverlay
  variant="pulse"
  fullscreen={false}
  text="Yükleniyor..."
/>
```

### SuspenseBoundary

```tsx
import { SuspenseBoundary } from '@/components/ui/suspense-boundary';

<SuspenseBoundary
  loadingVariant="spinner"
  loadingText="Sayfa yükleniyor..."
  onSuspend={() => console.log('Loading')}
  onResume={() => console.log('Loaded')}
>
  <AsyncComponent />
</SuspenseBoundary>
```

### Skeleton

```tsx
import { Skeleton } from '@/components/ui/skeleton';

// Tek satır
<Skeleton className="h-4 w-full" />

// Kart skeleton
<div className="space-y-4">
  <Skeleton className="h-8 w-3/4" />
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-5/6" />
  <Skeleton className="h-10 w-1/4" />
</div>
```

---

## 🔧 Utility Bileşenleri

### Tooltip

```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon">
        <HelpCircle className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Bu bir yardım metnidir</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Avatar

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

<Avatar>
  <AvatarImage src={user.avatar} alt={user.name} />
  <AvatarFallback>
    {user.name.split(' ').map(n => n[0]).join('')}
  </AvatarFallback>
</Avatar>
```

### Progress

```tsx
import { Progress } from '@/components/ui/progress';

<Progress value={65} className="w-full" />
```

### Separator

```tsx
import { Separator } from '@/components/ui/separator';

<div className="space-y-4">
  <div>Üst içerik</div>
  <Separator />
  <div>Alt içerik</div>
</div>
```

---

## 🎨 Özel Bileşenler

### GlassCard

```tsx
import { GlassCard } from '@/components/ui/glass-card';

<GlassCard className="p-6">
  <h3>Glass Efektli Kart</h3>
  <p>Backdrop blur efekti ile</p>
</GlassCard>
```

### StepProgress

```tsx
import { StepProgress } from '@/components/ui/step-progress';

<StepProgress
  steps={[
    { id: 1, title: 'Adım 1', description: 'Açıklama' },
    { id: 2, title: 'Adım 2', description: 'Açıklama' },
    { id: 3, title: 'Adım 3', description: 'Açıklama' },
  ]}
  currentStep={2}
  onStepClick={(step) => setCurrentStep(step)}
/>
```

### ExportButtons

```tsx
import { ExportButtons } from '@/components/ui/export-buttons';

<ExportButtons
  data={tableData}
  filename="rapor"
  columns={['name', 'email', 'phone', 'city']}
  formats={['excel', 'pdf', 'csv']}
/>
```

### FilterPanel

```tsx
import { FilterPanel } from '@/components/ui/filter-panel';

<FilterPanel
  filters={[
    {
      key: 'status',
      label: 'Durum',
      type: 'select',
      options: [
        { value: 'AKTIF', label: 'Aktif' },
        { value: 'PASIF', label: 'Pasif' },
      ],
    },
    {
      key: 'city',
      label: 'Şehir',
      type: 'select',
      options: cities.map(c => ({ value: c, label: c })),
    },
    {
      key: 'dateRange',
      label: 'Tarih Aralığı',
      type: 'dateRange',
    },
  ]}
  values={filterValues}
  onChange={setFilterValues}
  onReset={() => setFilterValues({})}
/>
```

---

## 🎯 Best Practices

### 1. Import Yolu

```tsx
// ✓ İyi - Alias kullanımı
import { Button } from '@/components/ui/button';

// ✗ Kötü - Relative path
import { Button } from '../../../components/ui/button';
```

### 2. Erişilebilirlik

```tsx
// ✓ İyi
<Button aria-label="Silme işlemini onayla">
  <Trash className="h-4 w-4" />
</Button>

// ✗ Kötü - Screen reader için label yok
<Button>
  <Trash className="h-4 w-4" />
</Button>
```

### 3. Responsive Tasarım

```tsx
// ✓ İyi - Mobile-first yaklaşım
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id}>{item.name}</Card>)}
</div>
```

### 4. Loading States

```tsx
// ✓ İyi - Her durumu ele al
{isLoading ? (
  <Skeleton className="h-20 w-full" />
) : isError ? (
  <ErrorAlert error={error} retry={refetch} />
) : data.length === 0 ? (
  <EmptyState title="Kayıt yok" />
) : (
  <DataTable data={data} columns={columns} />
)}
```

