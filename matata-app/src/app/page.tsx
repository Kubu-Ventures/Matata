'use client'

import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { Header, Footer } from '@/components/site-ui'
import { useLanguage } from '@/components/language-provider'

const imageUrls = {
  hero: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1800&q=85',
  people: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=85',
  field: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=85',
  response: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1200&q=85',
}

const crisisTypes = ['flood', 'earthquake', 'conflict', 'wildfire', 'other'] as const

export default function Page() {
  const { translate } = useLanguage()
  return <div id="top" className="min-h-screen bg-background text-foreground">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-background focus:p-3">Skip to main content</a>
    <Header />
    <main id="main-content">
      <section className="border-b border-border" aria-labelledby="hero-title">
        <div className="mx-auto grid max-w-7xl lg:grid-cols-[1fr_0.92fr]">
          <div className="flex flex-col justify-center px-6 py-16 lg:px-10 lg:py-24">
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.18em] text-primary">{translate('landing.badge')}</p>
            <h1 id="hero-title" className="max-w-3xl text-pretty text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">{translate('landing.hero_title')}</h1>
            <p className="mt-7 max-w-xl text-pretty text-lg leading-8 text-muted-foreground">{translate('landing.hero_desc')}</p>
            <div className="mt-9 flex flex-wrap items-center gap-4"><Link href="/report" className="inline-flex items-center gap-3 bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{translate('landing.cta_primary')} <ArrowRight data-icon="inline-end" /></Link><Link href="#how-it-works" className="inline-flex items-center gap-2 px-2 py-3.5 text-sm font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">{translate('landing.how_title')} </Link></div>
            <div className="mt-8 border-l-2 border-primary bg-muted/60 px-4 py-3"><p className="text-sm font-semibold text-foreground">{translate('landing.cta2_title')}</p><Link href="/login" className="mt-1 inline-flex text-sm font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary">{translate('nav.sign_in')} <ArrowRight className="ml-1" size={16} aria-hidden="true" /></Link></div>
            <p className="mt-6 text-xs leading-5 text-muted-foreground">{translate('landing.cta2_desc')}</p>
          </div>
          <div className="min-h-[360px] bg-muted lg:min-h-[560px]"><img src={imageUrls.hero} alt={translate('landing.hero_title')} className="h-full w-full object-cover" /></div>
        </div>
      </section>
      <section id="report" className="border-b border-border bg-muted/50" aria-labelledby="report-title"><div className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16"><div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{translate('landing.badge')}</p><h2 id="report-title" className="mt-3 text-3xl font-bold tracking-tight">{translate('landing.crisis_section_title')}</h2></div><div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">{crisisTypes.map((type) => <Link key={type} href="/report" className="group flex min-h-24 items-end justify-between bg-background p-5 text-sm font-semibold transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><span>{translate(`crisis.${type}`)}</span><ArrowRight className="opacity-0 transition-opacity group-hover:opacity-100" data-icon="inline-end" /></Link>)}</div></div></div></section>
      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24" aria-labelledby="process-title"><div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{translate('landing.how_title')}</p><h2 id="process-title" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{translate('landing.how_title')}</h2></div><div className="mt-12 grid gap-10 lg:grid-cols-3">{([1, 2, 3] as const).map((step, index) => <article key={step} className="border-t-2 border-primary pt-5"><p className="font-mono text-sm text-primary">0{index + 1}</p><h3 className="mt-6 text-xl font-bold">{translate(`landing.step${step}_title`)}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{translate(`landing.step${step}_desc`)}</p><img src={imageUrls[index === 0 ? 'people' : index === 1 ? 'field' : 'response']} alt={translate(`landing.step${step}_title`)} className="mt-8 aspect-[4/3] w-full object-cover" /></article>)}</div></section>
      <section id="resources" className="bg-primary text-primary-foreground" aria-labelledby="resources-title"><div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-14 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-16"><div><h2 id="resources-title" className="text-3xl font-bold tracking-tight">{translate('landing.cta2_title')}</h2><p className="mt-3 max-w-xl leading-7 text-primary-foreground/75">{translate('landing.cta2_desc')}</p></div><a href="#top" className="inline-flex w-fit items-center gap-2 border border-primary-foreground/60 px-5 py-3 text-sm font-semibold hover:bg-primary-foreground hover:text-primary">{translate('nav.report_now')} <ExternalLink data-icon="inline-end" /></a></div></section>
    </main>
    <Footer />
  </div>
}
