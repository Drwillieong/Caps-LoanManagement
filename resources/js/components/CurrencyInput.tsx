import { forwardRef, HTMLProps } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const formatCurrencyInput = (value: string): string => {
  const num = value.replace(/,/g, '');
  if (!num || isNaN(parseFloat(num))) return '';
  return parseFloat(num).toLocaleString('en-US', { maximumFractionDigits: 0 });
};

const parseCurrencyInput = (value: string): string => {
  return value.replace(/,/g, '');
};

interface CurrencyInputProps extends Omit<HTMLProps<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, className, placeholder = '0', ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      // Allow only digits and decimal
      if (/^\\d*\\.?\\d{0,2}$/.test(rawValue.replace(/,/g, ''))) {
        onChange(parseCurrencyInput(rawValue));
      }
    };

    return (
      <Input
        ref={ref}
        type="text"
        value={formatCurrencyInput(value)}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn('text-right', className)}
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };

