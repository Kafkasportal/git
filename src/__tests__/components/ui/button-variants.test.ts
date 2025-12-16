import { describe, it, expect } from 'vitest';
import { buttonVariants } from '@/components/ui/button-variants';

describe('buttonVariants', () => {
  it('should generate default variant classes', () => {
    const classes = buttonVariants();
    expect(classes).toContain('bg-gradient-to-r');
    expect(classes).toContain('from-corporate-primary-600');
    expect(classes).toContain('text-white');
  });

  it('should generate destructive variant classes', () => {
    const classes = buttonVariants({ variant: 'destructive' });
    expect(classes).toContain('bg-corporate-error-600');
    expect(classes).toContain('text-white');
  });

  it('should generate outline variant classes', () => {
    const classes = buttonVariants({ variant: 'outline' });
    expect(classes).toContain('border');
    expect(classes).toContain('bg-white');
  });

  it('should generate size classes', () => {
    const smClasses = buttonVariants({ size: 'sm' });
    expect(smClasses).toContain('h-9');

    const lgClasses = buttonVariants({ size: 'lg' });
    expect(lgClasses).toContain('h-13');
  });

  it('should combine variant and size', () => {
    const classes = buttonVariants({ variant: 'secondary', size: 'lg' });
    expect(classes).toContain('border-2');
    expect(classes).toContain('h-13');
  });
});
