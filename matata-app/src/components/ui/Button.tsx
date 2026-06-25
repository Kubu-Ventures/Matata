import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-[#006EB5] text-white hover:bg-[#005a94] focus:ring-[#006EB5]': variant === 'primary',
            'bg-white text-[#232E3D] border border-[#EDEFF0] hover:bg-[#EDEFF0] focus:ring-[#006EB5]': variant === 'secondary',
            'bg-transparent text-[#006EB5] hover:bg-[#EDEFF0] focus:ring-[#006EB5]': variant === 'ghost',
            'bg-[#EE402D] text-white hover:bg-[#d63520] focus:ring-[#EE402D]': variant === 'danger',
            'px-3 py-1.5 text-sm rounded': size === 'sm',
            'px-4 py-2 text-sm rounded': size === 'md',
            'px-6 py-3 text-base rounded': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
