import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

export function Footer() {
  const { t } = useLanguage()

  return (
    <footer id="about" className="border-t border-border bg-foreground text-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1.5fr_1fr_1fr] lg:px-10">
        <div>
          <p className="text-xl font-bold tracking-tight">Matata</p>
          <p className="mt-4 max-w-sm text-sm leading-6 text-background/70">{t('footer.tagline')}</p>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <p className="font-semibold">{t('nav.report_now')}</p>
          <Link href="#report" className="text-background/70 hover:text-background">{t('nav.report_now')}</Link>
          <Link href="#how-it-works" className="text-background/70 hover:text-background">{t('landing.how_title')}</Link>
          <Link href="#resources" className="text-background/70 hover:text-background">{t('nav.resources')}</Link>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <p className="font-semibold">{t('nav.about')}</p>
          <Link href="#top" className="text-background/70 hover:text-background">{t('login.return_home')}</Link>
          <p className="text-background/50">{t('landing.emergency_notice')}</p>
        </div>
      </div>
      <div className="border-t border-background/20 px-6 py-5 text-xs text-background/60 lg:px-10">
        © {new Date().getFullYear()} Matata — {t('footer.undp')}
      </div>
    </footer>
  )
}
