'use client'

import Link from 'next/link'
import { ArrowRight, Globe2, LockKeyhole } from 'lucide-react'
import { LOCALES, Locale } from '@/lib/i18n/locales'
import { useLanguage } from './language-provider'

export function LanguageSelector() {
  const { locale, setLocale, translate } = useLanguage()
  return <label className="inline-flex items-center gap-2 border border-line bg-surface px-3 text-sm font-semibold text-navy"><Globe2 size={17} aria-hidden="true" /><span className="sr-only">Select language</span><select aria-label="Select language" value={locale} onChange={(e) => setLocale(e.target.value as Locale)} className="min-h-10 cursor-pointer bg-transparent py-2 outline-none focus-visible:ring-2 focus-visible:ring-udnp-blue">{Object.entries(LOCALES).map(([key, value]) => <option key={key} value={key}>{value.flag} {value.label}</option>)}</select></label>
}

export function Header() {
  const { translate } = useLanguage()
  return <header className="border-b-4 border-udnp-red bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8"><Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Matata"><span className="grid h-10 w-10 shrink-0 place-items-center bg-udnp-red text-lg font-black text-white">M</span><span className="truncate text-xl font-black tracking-[0.18em] text-navy">Matata</span></Link><div className="flex items-center gap-3"><LanguageSelector /><Link href="/login" className="hidden min-h-10 items-center border border-udnp-blue px-4 py-2 text-sm font-bold text-udnp-blue transition hover:bg-udnp-blue hover:text-white sm:inline-flex">{translate('nav.sign_in')}</Link></div></div></header>
}

export function Footer() { const { translate } = useLanguage(); return <footer className="border-t border-line bg-navy text-white"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between lg:px-8"><div><p className="font-bold tracking-[0.12em]">Matata</p><p className="mt-2 max-w-md text-white/70">{translate('footer.tagline')}</p></div><Link href="/analyst/login" className="font-semibold text-white underline decoration-udnp-red decoration-2 underline-offset-4">{translate('login.analyst_title')}</Link></div></footer> }

export function LoginShell({ children, analyst = false }: { children: React.ReactNode; analyst?: boolean }) { const { translate } = useLanguage(); return <div className="min-h-screen bg-surface"><Header /><main className="mx-auto flex max-w-7xl justify-center px-5 py-10 lg:px-8 lg:py-16"><div className="grid w-full max-w-5xl overflow-hidden border border-line bg-white shadow-sm lg:grid-cols-[0.85fr_1.15fr]"><aside className="hidden bg-navy p-10 text-white lg:block"><p className="text-sm font-bold uppercase tracking-[0.16em] text-white/70">{translate('eyebrow')}</p><h1 className="mt-10 max-w-sm text-4xl font-black leading-tight">{analyst ? translate('analystTitle') : translate('title')}</h1><div className="mt-16 flex items-center gap-2 text-sm text-white/70"><LockKeyhole size={16} aria-hidden="true" />{translate('privacy')}</div></aside><section className="p-6 sm:p-10 lg:p-14">{children}</section></div></main></div> }

export function PrimaryButton({ children, type = 'submit', disabled = false }: { children: React.ReactNode; type?: 'submit' | 'button'; disabled?: boolean }) { return <button type={type} disabled={disabled} className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-udnp-blue px-5 py-3 font-bold text-white transition hover:bg-udnp-blue-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-udnp-blue/25 disabled:cursor-not-allowed disabled:opacity-60">{children}<ArrowRight size={18} aria-hidden="true" /></button> }
