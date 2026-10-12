import Link from 'next/link';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import type { ReactNode, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/** Shared page width and gutters for every analyst screen. */
export function PageContainer({
  children,
  className,
  narrow,
}: {
  children: ReactNode;
  className?: string;
  /** Cap the content width for text-heavy pages while keeping the left edge on the nav's. */
  narrow?: boolean;
}) {
  return (
    <div className={cn('mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7', className)}>
      {narrow ? <div className="max-w-5xl">{children}</div> : children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  meta,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  /** Short context line under the title: counts, "last updated", feed status. */
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3', className)}>
      <div className="min-w-0 max-w-3xl">
        <h1 className="text-xl font-bold tracking-normal text-[#232E3D] sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm leading-relaxed text-[#55606E]">{description}</p>}
        {meta && <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#55606E]">{meta}</div>}
      </div>
      {actions && <div className="flex max-w-full flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('rounded-lg border border-[#EDEFF0] bg-white', className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 border-b border-[#EDEFF0] px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-normal text-[#232E3D]">{title}</h2>
            {description && <p className="mt-0.5 text-xs leading-relaxed text-[#55606E]">{description}</p>}
          </div>
          {action && <div className="flex-shrink-0 text-xs">{action}</div>}
        </div>
      )}
      <div className={cn('p-4 sm:p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

/** One headline number. Rendered in a row of these, humanitarian "key figures" style. */
export function KeyFigure({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'text-[#232E3D]',
  iconClassName = 'bg-[#006EB5]/10 text-[#006EB5]',
  href,
  className: extraClassName,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: string;
  iconClassName?: string;
  href?: string;
  className?: string;
}) {
  const body = (
    <div className="flex items-center gap-3">
      <span className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg', iconClassName)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className={cn('text-2xl font-bold leading-tight tabular-nums', tone)}>{value}</p>
        <p className="text-xs font-medium uppercase tracking-wide text-[#55606E]">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-[#55606E]">{sub}</p>}
      </div>
    </div>
  );
  const className = cn('block bg-white px-4 py-4 sm:px-5', extraClassName);
  return href ? (
    <Link href={href} className={cn(className, 'font-normal transition-colors hover:bg-[#F7F8FA]')}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/** Wraps KeyFigures in one bordered band with hairline dividers between them. */
export function KeyFigureRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'grid gap-px overflow-hidden rounded-lg border border-[#EDEFF0] bg-[#EDEFF0]',
        className
      )}
    >
      {children}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#006EB5] border-t-transparent',
        className
      )}
    />
  );
}

export function LoadingBlock({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-16', className)}>
      <Spinner />
    </div>
  );
}

const ALERT_TONES = {
  error: 'border-red-200 bg-red-50 text-[#EE402D]',
  success: 'border-green-200 bg-green-50 text-green-800',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  info: 'border-[#B5D5F5] bg-[#B5D5F5]/20 text-[#232E3D]',
} as const;

export function Alert({
  tone = 'error',
  children,
  className,
}: {
  tone?: keyof typeof ALERT_TONES;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('rounded-md border px-3 py-2.5 text-sm leading-relaxed', ALERT_TONES[tone], className)}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {Icon && (
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#F7F8FA] text-[#55606E]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <p className="text-sm font-semibold text-[#232E3D]">{title}</p>
      {children && <p className="mt-1 max-w-md text-sm leading-relaxed text-[#55606E]">{children}</p>}
    </div>
  );
}

/** Small coloured label for severity, status, priority and role values. */
export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium capitalize',
        className
      )}
    >
      {children}
    </span>
  );
}

// The global stylesheet gives bare <input> and <label> elements the large
// sizing of the public sign-in pages, so analyst form controls reset it here.
export const fieldLabelClass = 'mb-1 block text-xs font-medium text-[#55606E]';
export const fieldInputClass =
  'block h-9 min-h-0 w-full rounded border border-[#EDEFF0] bg-white px-2.5 py-0 text-sm text-[#232E3D] placeholder:text-[#55606E] focus:border-[#006EB5] focus:outline-none focus:ring-1 focus:ring-[#006EB5]';
export const checkboxClass =
  'h-4 min-h-0 w-4 flex-shrink-0 rounded border-[#EDEFF0] p-0 accent-[#006EB5] focus:ring-[#006EB5]';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  wrapperClassName?: string;
}

/** Labelled native select with a visible chevron, sized for dense filter bars. */
export function SelectField({ label, options, placeholder, wrapperClassName, className, id, ...props }: SelectFieldProps) {
  return (
    <label className={cn('block min-w-0 font-normal', wrapperClassName)} htmlFor={id}>
      <span className={fieldLabelClass}>{label}</span>
      <span className="relative block">
        <select id={id} className={cn(fieldInputClass, 'appearance-none pr-8', className)} {...props}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#55606E]"
          aria-hidden="true"
        />
      </span>
    </label>
  );
}

/** Label/value rows used for calibration and threshold read-outs. */
export function DefinitionList({ rows }: { rows: { label: ReactNode; value: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-[#EDEFF0] text-sm">
      {rows.map((row, i) => (
        <div key={i} className="flex items-baseline justify-between gap-4 py-2 first:pt-0 last:pb-0">
          <dt className="text-[#55606E]">{row.label}</dt>
          <dd className="text-right font-medium text-[#232E3D] tabular-nums">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Horizontal bar with a label and a count, for simple ranked breakdowns. */
export function BarRow({
  label,
  value,
  percent,
  barClassName = 'bg-[#006EB5]',
}: {
  label: ReactNode;
  value: ReactNode;
  /** 0–100 */
  percent: number;
  barClassName?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
        <span className="font-medium text-[#232E3D]">{label}</span>
        <span className="tabular-nums text-[#55606E]">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#F7F8FA]">
        <div className={cn('h-full rounded-full', barClassName)} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
      </div>
    </div>
  );
}
