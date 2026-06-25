import { cn } from '@/lib/utils';
import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-[#232E3D]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            'block w-full rounded border px-3 py-2 text-sm text-[#232E3D] transition-colors bg-white appearance-none',
            'border-[#EDEFF0] focus:border-[#006EB5] focus:outline-none focus:ring-1 focus:ring-[#006EB5]',
            error && 'border-[#EE402D] focus:border-[#EE402D] focus:ring-[#EE402D]',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-[#EE402D]">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
