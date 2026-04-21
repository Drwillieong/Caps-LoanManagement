import { forwardRef, HTMLProps } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const formatNumberInput = (value: string): string => {
  const num = parseInt(value.replace(/,/g, ''), 10);
  return isNaN(num) || num === 0 ? '' : num.toLocaleString('en-US');
};

const parseNumberInput = (value: string): string => {
  return value.replace(/,/g, '');
};

interface NumberInputProps extends Omit<HTMLProps<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, className, placeholder = '0', ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      // Integer only
      if (/^\\d*$/.test(rawValue.replace(/,/g, ''))) {
        onChange(parseNumberInput(rawValue));
      }
    };

    return (
      <Input
        ref={ref}
        type="text"
        value={formatNumberInput(value)}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn('text-right', className)}
        {...props}
      />
    );
  }
);

NumberInput.displayName = 'NumberInput';

export { NumberInput };

