import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className, id, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-[#232E3D]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'block w-full rounded border px-3 py-2 text-sm text-[#232E3D] placeholder:text-[#55606E] transition-colors',
            'border-[#EDEFF0] bg-white focus:border-[#006EB5] focus:outline-none focus:ring-1 focus:ring-[#006EB5]',
            error && 'border-[#EE402D] focus:border-[#EE402D] focus:ring-[#EE402D]',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[#EE402D]">{error}</p>}
        {helper && !error && <p className="text-xs text-[#55606E]">{helper}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
