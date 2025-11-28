'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  MODULE_PERMISSIONS,
  PERMISSION_LABELS,
  SPECIAL_PERMISSIONS,
  type PermissionValue,
} from '@/types/permissions';
import { cn } from '@/lib/utils';

const DEFAULT_ORDER: PermissionValue[] = [
  MODULE_PERMISSIONS.BENEFICIARIES,
  MODULE_PERMISSIONS.AID_APPLICATIONS,
  MODULE_PERMISSIONS.DONATIONS,
  MODULE_PERMISSIONS.SCHOLARSHIPS,
  MODULE_PERMISSIONS.MESSAGES,
  MODULE_PERMISSIONS.WORKFLOW,
  MODULE_PERMISSIONS.FINANCE,
  MODULE_PERMISSIONS.REPORTS,
  MODULE_PERMISSIONS.PARTNERS,
  MODULE_PERMISSIONS.SETTINGS,
];

interface PermissionCheckboxGroupProps {
  value: PermissionValue[];
  onChange: (next: PermissionValue[]) => void;
  className?: string;
  disabled?: boolean;
  includeManageOption?: boolean;
}

export function PermissionCheckboxGroup({
  value,
  onChange,
  className,
  disabled,
  includeManageOption = false,
}: PermissionCheckboxGroupProps) {
  const togglePermission = (permission: PermissionValue, checked: boolean) => {
    if (checked) {
      onChange(Array.from(new Set([...value, permission])));
    } else {
      onChange(value.filter((item) => item !== permission));
    }
  };

  const modulesToRender = includeManageOption
    ? [...DEFAULT_ORDER, SPECIAL_PERMISSIONS.USERS_MANAGE]
    : DEFAULT_ORDER;

  return (
    <div className={cn('space-y-3', className)}>
      {modulesToRender.map((permission) => (
        <div
          key={permission}
          className="flex items-center gap-2 rounded-md border border-border/50 p-3"
        >
          <Checkbox
            id={`permission-${permission}`}
            checked={value.includes(permission)}
            onCheckedChange={(checked) => {
              togglePermission(permission, Boolean(checked));
            }}
            disabled={disabled}
          />
          <div>
            <Label htmlFor={`permission-${permission}`} className="font-medium">
              {PERMISSION_LABELS[permission]}
            </Label>
            <p className="text-xs text-muted-foreground">
              {permission === SPECIAL_PERMISSIONS.USERS_MANAGE
                ? 'Kullanıcı oluşturma, düzenleme ve silme yetkisi verir.'
                : 'Bu modüldeki tüm sayfalara erişim sağlar.'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
