import * as React from 'react';
import { type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export interface FormFieldGroupProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'bordered' | 'card';
  children: React.ReactNode;
  className?: string;
}

export function FormFieldGroup({
  title,
  description,
  icon: Icon,
  variant = 'default',
  children,
  className,
}: FormFieldGroupProps) {
  const Header = (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="h-5 w-5 text-primary" />}
        <h3 className="font-heading font-semibold text-base text-foreground">{title}</h3>
      </div>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <Separator className="mt-3" />
    </div>
  );

  const Content = <div className="space-y-4">{children}</div>;

  if (variant === 'card') {
    return (
      <Card className={cn('mb-6', className)}>
        <CardContent className="pt-6">
          {Header}
          {Content}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'bordered') {
    return (
      <div className={cn('border-l-4 border-primary pl-4 mb-6', className)}>
        {Header}
        {Content}
      </div>
    );
  }

  return (
    <div className={cn('mb-6', className)}>
      {Header}
      {Content}
    </div>
  );
}
