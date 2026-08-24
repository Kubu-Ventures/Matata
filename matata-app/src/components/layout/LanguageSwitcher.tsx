'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { LOCALES, type Locale } from '@/lib/i18n/locales';
import { useLanguage } from '@/contexts/LanguageContext';

const LOCALE_CODES = Object.keys(LOCALES) as Locale[];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => LOCALE_CODES.indexOf(locale));

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listboxId = useId();

  const close = useCallback((focusButton = false) => {
    setOpen(false);
    if (focusButton) buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const idx = LOCALE_CODES.indexOf(locale);
    setActiveIndex(idx);
    const raf = requestAnimationFrame(() => optionRefs.current[idx]?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open, locale]);

  function onButtonKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    }
  }

  function onOptionKeyDown(e: React.KeyboardEvent, index: number) {
    const last = LOCALE_CODES.length - 1;
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const next = index === last ? 0 : index + 1;
        setActiveIndex(next);
        optionRefs.current[next]?.focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prev = index === 0 ? last : index - 1;
        setActiveIndex(prev);
        optionRefs.current[prev]?.focus();
        break;
      }
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        optionRefs.current[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(last);
        optionRefs.current[last]?.focus();
        break;
      case 'Escape':
        e.preventDefault();
        close(true);
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  }

  function selectLocale(code: Locale) {
    setLocale(code);
    close(true);
  }

  const current = LOCALES[locale as Locale] as { label: string; short?: string };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onButtonKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={`Change language, currently ${current.label}`}
        className="flex min-h-11 items-center gap-2 border border-transparent px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-border hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Globe className="size-[18px] shrink-0" aria-hidden="true" />
        <span className="whitespace-nowrap">{current.short ?? current.label}</span>
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Select language"
          tabIndex={-1}
          className="absolute end-0 top-full z-50 mt-2 max-h-80 w-64 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain border border-border bg-background py-1 shadow-lg"
        >
          {LOCALE_CODES.map((code, index) => {
            const selected = code === locale;
            const opt = LOCALES[code];
            return (
              <li key={code} role="presentation">
                <button
                  ref={(el) => {
                    optionRefs.current[index] = el;
                  }}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  tabIndex={activeIndex === index ? 0 : -1}
                  onClick={() => selectLocale(code)}
                  onKeyDown={(e) => onOptionKeyDown(e, index)}
                  className={`flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2.5 text-start text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none ${
                    selected ? 'font-semibold text-primary' : 'text-foreground'
                  }`}
                >
                  <span>{opt.label}</span>
                  {selected && <Check className="size-4 shrink-0" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
