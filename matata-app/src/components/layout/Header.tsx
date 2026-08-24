'use client'

import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from './LanguageSwitcher'

export function Header() {
  const [open, setOpen] = useState(false)
  const { t } = useLanguage()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link href="#top" className="flex items-center gap-3" aria-label="Matata Crisis Response home">
          <span className="flex size-10 items-center justify-center bg-primary text-lg font-bold text-primary-foreground">Matata</span>
          <span className="hidden border-l border-border pl-3 text-sm font-medium leading-tight text-foreground sm:block">Crisis<br />Response</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium lg:flex" aria-label="Primary navigation">
          <Link href="#report" className="transition-colors hover:text-primary">{t('nav.report_now')}</Link>
          <Link href="#how-it-works" className="transition-colors hover:text-primary">{t('landing.how_title')}</Link>
          <Link href="#resources" className="transition-colors hover:text-primary">{t('nav.resources')}</Link>
          <Link href="#about" className="transition-colors hover:text-primary">{t('nav.about')}</Link>
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden lg:block">
            <LanguageSwitcher />
          </div>
          <button type="button" className="lg:hidden" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && <nav id="mobile-navigation" className="flex flex-col gap-4 border-t border-border bg-background px-6 py-5 text-sm font-medium lg:hidden" aria-label="Mobile navigation">
        <Link href="#report" onClick={() => setOpen(false)}>{t('nav.report_now')}</Link>
        <Link href="#how-it-works" onClick={() => setOpen(false)}>{t('landing.how_title')}</Link>
        <Link href="#resources" onClick={() => setOpen(false)}>{t('nav.resources')}</Link>
        <Link href="#about" onClick={() => setOpen(false)}>{t('nav.about')}</Link>
        <div className="pt-2">
          <LanguageSwitcher />
        </div>
      </nav>}
    </header>
  )
}
