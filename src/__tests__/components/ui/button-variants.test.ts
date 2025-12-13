import { describe, it, expect } from 'vitest';
import { buttonVariants } from '@/components/ui/button-variants';

describe('buttonVariants', () => {
  it('should generate default variant classes', () => {
    const classes = buttonVariants();
    expect(classes).toContain('bg-primary');
    expect(classes).toContain('text-primary-foreground');
  });

  it('should generate destructive variant classes', () => {
    const classes = buttonVariants({ variant: 'destructive' });
    expect(classes).toContain('bg-destructive');
    expect(classes).toContain('text-white');
  });

  it('should generate outline variant classes', () => {
    const classes = buttonVariants({ variant: 'outline' });
    expect(classes).toContain('border');
    expect(classes).toContain('bg-background');
  });

  it('should generate size classes', () => {
    const smClasses = buttonVariants({ size: 'sm' });
    expect(smClasses).toContain('h-8');

    const lgClasses = buttonVariants({ size: 'lg' });
    expect(lgClasses).toContain('h-10');
  });

  it('should combine variant and size', () => {
    const classes = buttonVariants({ variant: 'secondary', size: 'lg' });
    expect(classes).toContain('bg-secondary');
    expect(classes).toContain('h-10');
  });
});

