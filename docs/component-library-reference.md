# Component Library Reference

Bu doküman, Kafkasder Panel projesinin UI component kütüphanesini detaylı olarak açıklar.

## Genel Bakış

- **Base Components:** 50+ component
- **UI Framework:** Radix UI primitives
- **Styling:** Tailwind CSS 4
- **Location:** `src/components/ui/`
- **Design System:** shadcn/ui (New York style)

## Component Kategorileri

### 1. Form Components

#### Button (`button.tsx`)
Çok amaçlı buton componenti.

**Variants:**
- `default` - Primary button
- `destructive` - Delete/danger actions
- `outline` - Outlined button
- `secondary` - Secondary actions
- `ghost` - Minimal button
- `link` - Link-style button

**Sizes:**
- `default` - h-9
- `sm` - h-8
- `lg` - h-10
- `icon` - size-9
- `icon-sm` - size-8
- `icon-lg` - size-10

**Usage:**
```tsx
<Button variant="default" size="default">
  Click me
</Button>
```

#### Input (`input.tsx`)
Metin input alanı.

**Variants:**
- `default` - Standard input
- `error` - Error state
- `success` - Success state

**Usage:**
```tsx
<Input type="text" placeholder="Enter text" />
```

#### Textarea (`textarea.tsx`)
Çok satırlı metin alanı.

**Usage:**
```tsx
<Textarea placeholder="Enter description" rows={4} />
```

#### Select (`select.tsx`)
Dropdown seçim componenti (Radix UI).

**Usage:**
```tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

#### Checkbox (`checkbox.tsx`)
Onay kutusu (Radix UI).

**Usage:**
```tsx
<Checkbox checked={isChecked} onCheckedChange={setIsChecked} />
```

#### RadioGroup (`radio-group.tsx`)
Radyo buton grubu (Radix UI).

**Usage:**
```tsx
<RadioGroup value={value} onValueChange={setValue}>
  <RadioGroupItem value="option1" />
  <RadioGroupItem value="option2" />
</RadioGroup>
```

#### Switch (`switch.tsx`)
Toggle switch (Radix UI).

**Usage:**
```tsx
<Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
```

#### DatePicker (`date-picker.tsx`)
Tarih seçici componenti.

**Usage:**
```tsx
<DatePicker
  date={date}
  onDateChange={setDate}
  placeholder="Select date"
/>
```

#### FileUpload (`file-upload.tsx`)
Dosya yükleme componenti.

**Features:**
- Drag & drop support
- File preview
- Multiple file support
- File type validation

**Usage:**
```tsx
<FileUpload
  accept="image/*"
  maxSize={5 * 1024 * 1024}
  onUpload={handleUpload}
/>
```

#### Form (`form.tsx`)
Form wrapper componenti (React Hook Form integration).

**Usage:**
```tsx
<Form {...form}>
  <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>
```

#### AccessibleFormField (`accessible-form-field.tsx`)
Erişilebilir form alanı wrapper'ı.

### 2. Data Display Components

#### Card (`card.tsx`)
Kart container componenti.

**Variants:**
- `default` - Standard card
- `interactive` - Clickable card
- `elevated` - Elevated shadow
- `outline` - Outlined border
- `ghost` - Minimal card

**Usage:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

#### MetricCard (`metric-card.tsx`)
Animasyonlu metrik kartı.

**Variants:**
- 8 color variants
- Trend indicator
- Animated number

**Usage:**
```tsx
<MetricCard
  title="Total Beneficiaries"
  value={1234}
  trend={{ value: 12, direction: 'up' }}
  variant="blue"
/>
```

#### StatCard (`stat-card.tsx`)
İstatistik kartı.

**Features:**
- 9 color themes
- Progress bar
- Icon support

**Usage:**
```tsx
<StatCard
  title="Active Users"
  value={456}
  progress={75}
  color="green"
/>
```

#### KPICard (`kpi-card.tsx`)
KPI (Key Performance Indicator) kartı.

**Variants:**
- `green` - Success metrics
- `orange` - Warning metrics
- `blue` - Info metrics
- `red` - Critical metrics
- `gray` - Neutral metrics
- `purple` - Special metrics

**Usage:**
```tsx
<KPICard
  title="Donations"
  value={50000}
  unit="TRY"
  variant="green"
/>
```

#### GlassCard (`glass-card.tsx`)
Glassmorphism efekti kartı.

**Usage:**
```tsx
<GlassCard>
  Content with glass effect
</GlassCard>
```

#### Table (`table.tsx`)
Temel tablo componenti.

**Usage:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

#### DataTable (`data-table.tsx`)
Gelişmiş veri tablosu.

**Features:**
- Search
- Sorting
- Pagination
- Filtering
- Column visibility toggle

**Usage:**
```tsx
<DataTable
  columns={columns}
  data={data}
  searchable
  sortable
  pagination
/>
```

#### VirtualizedDataTable (`virtualized-data-table.tsx`)
Büyük veri setleri için sanallaştırılmış tablo.

**Features:**
- Virtual scrolling
- Efficient rendering
- Large dataset support

**Usage:**
```tsx
<VirtualizedDataTable
  columns={columns}
  data={largeDataset}
  height={600}
/>
```

#### ResponsiveTable (`responsive-table.tsx`)
Responsive tablo componenti.

### 3. Dialog & Feedback Components

#### Dialog (`dialog.tsx`)
Modal pencere (Radix UI).

**Usage:**
```tsx
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    Content
    <DialogFooter>
      <Button>Close</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### AlertDialog (`alert-dialog.tsx`)
Onay dialogu (Radix UI).

**Usage:**
```tsx
<AlertDialog>
  <AlertDialogTrigger>Delete</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

#### Popover (`popover.tsx`)
Açılır pencere (Radix UI).

**Usage:**
```tsx
<Popover>
  <PopoverTrigger>Open</PopoverTrigger>
  <PopoverContent>
    Content
  </PopoverContent>
</Popover>
```

#### Tooltip (`tooltip.tsx`)
İpucu (Radix UI).

**Usage:**
```tsx
<Tooltip>
  <TooltipTrigger>Hover me</TooltipTrigger>
  <TooltipContent>
    Tooltip text
  </TooltipContent>
</Tooltip>
```

#### Alert (`alert.tsx`)
Bilgi mesajı.

**Variants:**
- `default`
- `destructive`
- `warning`
- `info`
- `success`

**Usage:**
```tsx
<Alert variant="destructive">
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Something went wrong</AlertDescription>
</Alert>
```

#### ErrorAlert (`error-alert.tsx`)
Hata mesajı componenti.

#### Badge (`badge.tsx`)
Etiket/rozet.

**Variants:**
- `default`
- `secondary`
- `destructive`
- `outline`
- `success`
- `warning`

**Usage:**
```tsx
<Badge variant="default">New</Badge>
```

#### Progress (`progress.tsx`)
İlerleme çubuğu (Radix UI).

**Usage:**
```tsx
<Progress value={75} />
```

#### Skeleton (`skeleton.tsx`)
Yükleme iskeleti.

**Usage:**
```tsx
<Skeleton className="h-4 w-full" />
```

#### EnhancedToast (`enhanced-toast.tsx`)
Gelişmiş bildirim componenti (Sonner).

**Usage:**
```tsx
import { toast } from 'sonner';

toast.success('Operation successful');
toast.error('Operation failed');
toast.info('Information');
```

### 4. Navigation & Layout Components

#### ModernSidebar (`modern-sidebar.tsx`)
Modern sidebar navigasyonu.

**Features:**
- Collapsible
- Permission-based menu items
- Active route highlighting
- Icon support

**Usage:**
```tsx
<ModernSidebar
  items={menuItems}
  user={user}
  collapsed={isCollapsed}
  onToggle={setIsCollapsed}
/>
```

#### BreadcrumbNav (`breadcrumb-nav.tsx`)
Breadcrumb navigasyonu.

**Usage:**
```tsx
<BreadcrumbNav
  items={[
    { label: 'Home', href: '/' },
    { label: 'Beneficiaries', href: '/beneficiaries' },
    { label: 'Details' },
  ]}
/>
```

#### Pagination (`pagination.tsx`)
Sayfa numaralandırma.

**Usage:**
```tsx
<Pagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
/>
```

#### Tabs (`tabs.tsx`)
Sekme bileşeni (Radix UI).

**Usage:**
```tsx
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

#### ScrollArea (`scroll-area.tsx`)
Özel kaydırma alanı (Radix UI).

**Usage:**
```tsx
<ScrollArea className="h-72">
  Long content
</ScrollArea>
```

### 5. Advanced Components

#### AdvancedSearchModal (`advanced-search-modal.tsx`)
Gelişmiş arama modalı.

**Features:**
- Multi-field search
- Filter options
- Search history

#### FilterPanel (`filter-panel.tsx`)
Filtre paneli.

**Usage:**
```tsx
<FilterPanel
  filters={filterConfig}
  onFilterChange={handleFilterChange}
/>
```

#### ColumnVisibilityToggle (`column-visibility-toggle.tsx`)
Sütun görünürlük toggle'ı.

#### ExportButtons (`export-buttons.tsx`)
Dışa aktarma butonları.

**Features:**
- Excel export
- PDF export
- CSV export

**Usage:**
```tsx
<ExportButtons
  data={data}
  filename="export"
  onExport={handleExport}
/>
```

#### CurrencyWidget (`currency-widget.tsx`)
Para birimi widget'ı.

**Usage:**
```tsx
<CurrencyWidget
  amount={1000}
  currency="TRY"
  showSymbol
/>
```

#### OrganizationChart (`organization-chart.tsx`)
Organizasyon şeması.

#### StepProgress (`step-progress.tsx`)
Adım ilerleme göstergesi.

**Usage:**
```tsx
<StepProgress
  steps={['Step 1', 'Step 2', 'Step 3']}
  currentStep={1}
/>
```

#### ThemeSwitcher (`theme-switcher.tsx`)
Tema değiştirici.

**Usage:**
```tsx
<ThemeSwitcher />
```

#### KeyboardShortcuts (`keyboard-shortcuts.tsx`)
Klavye kısayolları gösterimi.

#### AnalyticsTracker (`analytics-tracker.tsx`)
Analitik takip componenti.

### 6. Loading & State Components

#### LoadingOverlay (`loading-overlay.tsx`)
Yükleme overlay'i.

**Usage:**
```tsx
<LoadingOverlay isLoading={isLoading} />
```

#### PageLoader (`page-loader.tsx`)
Sayfa yükleyici.

**Usage:**
```tsx
<PageLoader />
```

#### PageTransition (`page-transition.tsx`)
Sayfa geçiş animasyonu.

**Usage:**
```tsx
<PageTransition>
  {children}
</PageTransition>
```

#### SuspenseBoundary (`suspense-boundary.tsx`)
Suspense boundary wrapper.

**Usage:**
```tsx
<SuspenseBoundary fallback={<Skeleton />}>
  <AsyncComponent />
</SuspenseBoundary>
```

#### EmptyState (`empty-state.tsx`)
Boş durum gösterimi.

**Usage:**
```tsx
<EmptyState
  title="No data"
  description="No items found"
  icon={<Icon />}
/>
```

### 7. Specialized Components

#### CorporateLoginForm (`corporate-login-form.tsx`)
Kurumsal giriş formu.

#### DemoBanner (`demo-banner.tsx`)
Demo banner componenti.

#### Avatar (`avatar.tsx`)
Kullanıcı avatarı (Radix UI).

**Usage:**
```tsx
<Avatar>
  <AvatarImage src={imageUrl} />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

#### Separator (`separator.tsx`)
Ayırıcı çizgi (Radix UI).

**Usage:**
```tsx
<Separator />
```

#### Label (`label.tsx`)
Form etiketi (Radix UI).

**Usage:**
```tsx
<Label htmlFor="input">Label text</Label>
```

#### Calendar (`calendar.tsx`)
Takvim componenti (react-day-picker).

**Usage:**
```tsx
<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
/>
```

## Component Best Practices

### 1. Variant Usage

```tsx
// ✅ Good - Use variants for different states
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>

// ❌ Bad - Don't use inline styles for variants
<Button className="bg-red-500">Delete</Button>
```

### 2. Composition

```tsx
// ✅ Good - Compose components
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// ❌ Bad - Don't create monolithic components
<CardWithTitleAndContent title="Title" content="Content" />
```

### 3. Accessibility

```tsx
// ✅ Good - Include accessibility attributes
<Button aria-label="Close dialog">
  <XIcon />
</Button>

// ✅ Good - Use semantic HTML
<Button asChild>
  <Link href="/">Home</Link>
</Button>
```

### 4. Type Safety

```tsx
// ✅ Good - Use TypeScript types
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'sm' | 'default' | 'lg';
}

// ❌ Bad - Use any types
const Button = (props: any) => { ... }
```

## Styling Guidelines

### Tailwind CSS Classes

- Use utility classes for styling
- Follow design system tokens
- Use CSS variables for theming

### Responsive Design

```tsx
// Mobile-first approach
<div className="p-4 md:p-6 lg:p-8">
  Content
</div>
```

### Dark Mode

```tsx
// Use theme-aware classes
<div className="bg-background text-foreground">
  Content
</div>
```

## Related Documentation

- [PRD Document](./PRD-KAFKASDER-PANEL.md) - Component specifications
- [shadcn/ui Documentation](https://ui.shadcn.com) - Base component library
- [Radix UI Documentation](https://www.radix-ui.com) - Primitive components

