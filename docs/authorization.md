# 🛂 Yetkilendirme Sistemi

Bu döküman, Dernek Yönetim Sistemi'nin rol ve izin yapısını açıklar.

## 📊 Yetkilendirme Modeli

Sistem, **Role-Based Access Control (RBAC)** modelini kullanır.

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHORIZATION MODEL                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────┐        ┌─────────────┐        ┌────────────┐  │
│   │  User   │───────▶│    Role     │───────▶│ Permission │  │
│   └─────────┘        └─────────────┘        └────────────┘  │
│                            │                       │         │
│                            │                       │         │
│                            ▼                       ▼         │
│                     ┌─────────────┐        ┌────────────┐   │
│                     │   Preset    │        │   Module   │   │
│                     │ Permission  │        │   Access   │   │
│                     │    Set      │        │            │   │
│                     └─────────────┘        └────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎭 Roller

### Öntanımlı Roller

| Rol | Açıklama | Varsayılan İzinler |
|-----|----------|-------------------|
| **Başkan** | Tam yetkili sistem yöneticisi | Tüm izinler |
| **Yönetici** | Operasyonel yönetici | Çoğu modüle erişim |
| **Muhasebe** | Finansal işlemler sorumlusu | Finans, bağış, raporlar |
| **Personel** | Standart çalışan | Temel modüller |
| **Gönüllü** | Sınırlı erişimli gönüllü | Sadece okuma |
| **Görüntüleyici** | Salt okunur erişim | Sadece okuma |

### Rol Hiyerarşisi

```
Başkan
   │
   ├── Yönetici
   │      │
   │      ├── Muhasebe
   │      │
   │      └── Personel
   │             │
   │             └── Gönüllü
   │
   └── Görüntüleyici
```

---

## 🔐 İzinler

### Modül İzinleri

```typescript
// types/permissions.ts
export const MODULE_PERMISSIONS = {
  BENEFICIARIES: 'beneficiaries:access',     // İhtiyaç sahipleri
  DONATIONS: 'donations:access',             // Bağışlar
  AID_APPLICATIONS: 'aid_applications:access', // Yardım başvuruları
  SCHOLARSHIPS: 'scholarships:access',       // Burslar
  MESSAGES: 'messages:access',               // Mesajlaşma
  FINANCE: 'finance:access',                 // Finans
  REPORTS: 'reports:access',                 // Raporlar
  SETTINGS: 'settings:access',               // Ayarlar
  WORKFLOW: 'workflow:access',               // İş yönetimi
  PARTNERS: 'partners:access',               // Ortak yönetimi
} as const;
```

### Özel İzinler

```typescript
export const SPECIAL_PERMISSIONS = {
  USERS_MANAGE: 'users:manage',       // Kullanıcı yönetimi
  SETTINGS_MANAGE: 'settings:manage', // Ayar düzenleme
  AUDIT_VIEW: 'audit:view',           // Denetim kayıtları
} as const;
```

### İzin Etiketleri

```typescript
export const PERMISSION_LABELS: Record<PermissionValue, string> = {
  'beneficiaries:access': 'Hak Sahipleri',
  'donations:access': 'Bağışlar',
  'aid_applications:access': 'Yardım Başvuruları',
  'scholarships:access': 'Burslar',
  'messages:access': 'Mesajlaşma',
  'finance:access': 'Finans',
  'reports:access': 'Raporlar',
  'settings:access': 'Ayarlar',
  'workflow:access': 'Görev & Toplantılar',
  'partners:access': 'Ortak Yönetimi',
  'users:manage': 'Kullanıcı Yönetimi',
  'settings:manage': 'Ayarları Yönet',
  'audit:view': 'Denetim Kayıtlarını Görüntüle',
};
```

---

## 📱 Navigasyon Yetkilendirmesi

### Modül Bazlı Erişim

```typescript
// config/navigation.ts
export const navigationModules: NavigationModule[] = [
  {
    id: 'bagis',
    name: 'Bağış Yönetimi',
    permission: MODULE_PERMISSIONS.DONATIONS,  // Gerekli izin
    subPages: [
      { name: 'Bağış Listesi', href: '/bagis/liste' },
      { 
        name: 'Bağış Raporları', 
        href: '/bagis/raporlar',
        permission: MODULE_PERMISSIONS.REPORTS,  // Ek izin gerekli
      },
    ],
  },
  // ...
];
```

### Dinamik Menü Filtreleme

```typescript
// Kullanıcının izinlerine göre menü filtreleme
const filteredNavigation = navigationModules.filter(module => {
  if (!module.permission) return true; // İzin gerekmiyorsa göster
  return userHasPermission(module.permission);
});
```

---

## 🔍 Frontend Yetki Kontrolü

### useAuthStore Hooks

```typescript
// stores/authStore.ts
export const useAuthStore = create<AuthStore>((set, get) => ({
  // ...
  
  hasPermission: (permission: PermissionValue) => {
    const { user, isAuthenticated } = get();
    if (!user || !isAuthenticated) return false;
    return user.permissions.includes(permission);
  },
  
  hasRole: (role: string) => {
    const { user, isAuthenticated } = get();
    if (!user || !isAuthenticated) return false;
    return user.role?.toLowerCase() === role.toLowerCase();
  },
  
  hasAnyPermission: (permissions: PermissionValue[]) => {
    const { user, isAuthenticated } = get();
    if (!user || !isAuthenticated) return false;
    return permissions.some(p => user.permissions.includes(p));
  },
  
  hasAllPermissions: (permissions: PermissionValue[]) => {
    const { user, isAuthenticated } = get();
    if (!user || !isAuthenticated) return false;
    return permissions.every(p => user.permissions.includes(p));
  },
}));
```

### Kullanım Örnekleri

```tsx
// Bileşen içinde izin kontrolü
function BeneficiaryPage() {
  const { hasPermission } = useAuthStore();
  
  if (!hasPermission('beneficiaries:access')) {
    return <AccessDenied />;
  }
  
  return (
    <div>
      {/* İçerik */}
      
      {/* Düzenleme butonu sadece yetkili kullanıcılara */}
      {hasPermission('users:manage') && (
        <Button onClick={handleEdit}>Düzenle</Button>
      )}
    </div>
  );
}
```

### Koşullu Render

```tsx
// Rol bazlı koşullu render
function Dashboard() {
  const { hasRole, hasPermission } = useAuthStore();
  
  return (
    <div>
      {/* Herkes görebilir */}
      <GeneralStats />
      
      {/* Sadece finans yetkisi olanlar */}
      {hasPermission('finance:access') && <FinanceWidget />}
      
      {/* Sadece yöneticiler */}
      {hasRole('Yönetici') && <AdminPanel />}
      
      {/* Başkan veya kullanıcı yönetimi yetkisi olanlar */}
      {(hasRole('Başkan') || hasPermission('users:manage')) && (
        <UserManagement />
      )}
    </div>
  );
}
```

---

## 🖥️ Backend Yetki Kontrolü

### API Route Middleware

```typescript
// lib/api/middleware.ts
export function buildApiRoute(options: RouteOptions) {
  return (handler: RouteHandler) => async (request: NextRequest) => {
    // 1. Authentication
    const { user } = await requireAuthenticatedUser();
    
    // 2. Authorization - Modül kontrolü
    if (options.requireModule) {
      const modulePermission = `${options.requireModule}:access`;
      
      if (!user.permissions.includes(modulePermission)) {
        return errorResponse('Bu modüle erişim yetkiniz yok', 403);
      }
    }
    
    // 3. Authorization - Özel izin kontrolü
    if (options.requiredPermissions) {
      const hasAllPermissions = options.requiredPermissions.every(
        p => user.permissions.includes(p)
      );
      
      if (!hasAllPermissions) {
        return errorResponse('Yeterli yetkiniz yok', 403);
      }
    }
    
    return handler(request);
  };
}
```

### Endpoint Örnekleri

```typescript
// api/beneficiaries/route.ts
export const GET = buildApiRoute({
  requireModule: 'beneficiaries',  // beneficiaries:access gerekli
  allowedMethods: ['GET'],
})(async (request) => {
  // Handler
});

// api/users/route.ts
export const POST = buildApiRoute({
  requiredPermissions: ['users:manage'],  // Özel izin gerekli
  allowedMethods: ['POST'],
})(async (request) => {
  // Handler
});
```

### Kaynak Bazlı Yetkilendirme

```typescript
// Kullanıcı sadece kendi görevlerini düzenleyebilir
export const PUT = buildApiRoute({
  requireModule: 'workflow',
})(async (request) => {
  const { user } = await requireAuthenticatedUser();
  const taskId = request.params.id;
  
  const task = await getTask(taskId);
  
  // Sadece görev sahibi veya yönetici düzenleyebilir
  if (task.assigned_to !== user.id && !hasRole(user, 'Yönetici')) {
    return errorResponse('Bu görevi düzenleme yetkiniz yok', 403);
  }
  
  // Devam...
});
```

---

## 👤 Kullanıcı Yönetimi

### Yeni Kullanıcı Oluşturma

```typescript
// Kullanıcı oluşturma API'si
const newUser = {
  name: 'Yeni Kullanıcı',
  email: 'yeni@example.com',
  role: 'Personel',
  permissions: [
    'beneficiaries:access',
    'donations:access',
  ],
  isActive: true,
};
```

### İzin Güncelleme

```typescript
// Mevcut kullanıcının izinlerini güncelleme
const updatedPermissions = [
  ...currentPermissions,
  'reports:access',  // Yeni izin ekleme
];

await updateUser(userId, { permissions: updatedPermissions });
```

### Rol Değiştirme

```typescript
// Kullanıcı rolünü güncelleme
await updateUser(userId, {
  role: 'Yönetici',
  permissions: getDefaultPermissionsForRole('Yönetici'),
});
```

---

## 📊 Rol Bazlı Varsayılan İzinler

### Başkan

```typescript
const baskanPermissions = [
  'beneficiaries:access',
  'donations:access',
  'aid_applications:access',
  'scholarships:access',
  'messages:access',
  'finance:access',
  'reports:access',
  'settings:access',
  'workflow:access',
  'partners:access',
  'users:manage',
  'settings:manage',
  'audit:view',
];
```

### Yönetici

```typescript
const yoneticiPermissions = [
  'beneficiaries:access',
  'donations:access',
  'aid_applications:access',
  'scholarships:access',
  'messages:access',
  'finance:access',
  'reports:access',
  'settings:access',
  'workflow:access',
  'partners:access',
];
```

### Muhasebe

```typescript
const muhasebePermissions = [
  'donations:access',
  'finance:access',
  'reports:access',
];
```

### Personel

```typescript
const personelPermissions = [
  'beneficiaries:access',
  'donations:access',
  'aid_applications:access',
  'workflow:access',
];
```

### Gönüllü

```typescript
const gonulluPermissions = [
  'beneficiaries:access',  // Salt okunur
];
```

---

## 🔒 Güvenlik Kuralları

### En Az Yetki Prensibi

Kullanıcılara sadece işlerini yapmaları için gerekli minimum izinler verilmelidir.

```typescript
// ✓ İyi
const permissions = ['beneficiaries:access'];

// ✗ Kötü - Gereksiz izin
const permissions = ['beneficiaries:access', 'users:manage', 'audit:view'];
```

### İzin Ayrımı

Hassas operasyonlar için farklı izinler tanımlanmıştır:

| İşlem | Gerekli İzin |
|-------|--------------|
| Kullanıcı listeleme | `users:manage` |
| Denetim kayıtları görme | `audit:view` |
| Sistem ayarlarını değiştirme | `settings:manage` |

### Audit Trail

Tüm yetkilendirme değişiklikleri loglanır:

```typescript
AuditLogger.log({
  userId: adminUser.id,
  action: 'UPDATE_PERMISSIONS',
  resource: 'users',
  resourceId: targetUser.id,
  changes: {
    permissions: {
      old: oldPermissions,
      new: newPermissions,
    },
  },
  status: 'success',
});
```

---

## 🧪 Yetki Testi

### Unit Test Örneği

```typescript
describe('Authorization', () => {
  it('should allow access with correct permission', async () => {
    const user = { permissions: ['beneficiaries:access'] };
    
    expect(hasPermission(user, 'beneficiaries:access')).toBe(true);
  });
  
  it('should deny access without permission', async () => {
    const user = { permissions: ['donations:access'] };
    
    expect(hasPermission(user, 'beneficiaries:access')).toBe(false);
  });
  
  it('should check multiple permissions', async () => {
    const user = { permissions: ['donations:access', 'finance:access'] };
    
    expect(hasAllPermissions(user, ['donations:access', 'finance:access'])).toBe(true);
    expect(hasAnyPermission(user, ['users:manage', 'finance:access'])).toBe(true);
  });
});
```

### Integration Test Örneği

```typescript
describe('API Authorization', () => {
  it('should return 403 for unauthorized access', async () => {
    const response = await GET(
      createMockRequest('/api/users', {
        user: { permissions: ['beneficiaries:access'] },
      })
    );
    
    expect(response.status).toBe(403);
  });
  
  it('should allow access with correct permission', async () => {
    const response = await GET(
      createMockRequest('/api/users', {
        user: { permissions: ['users:manage'] },
      })
    );
    
    expect(response.status).toBe(200);
  });
});
```

