import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const imageUrls = {
  hero: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1800&q=85',
  people: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=85',
  field: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=85',
  response: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1200&q=85',
}

const crisisTypes = ['Floods', 'Earthquakes', 'Wildfires', 'Hurricanes', 'Droughts', 'Landslides']

export default function Page() {
  return (
    <div id="top" className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <section className="border-b border-border" aria-labelledby="hero-title">
          <div className="mx-auto grid max-w-7xl lg:grid-cols-[1fr_0.92fr]">
            <div className="flex flex-col justify-center px-6 py-16 lg:px-10 lg:py-24">
              <p className="mb-6 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Matata Crisis Response</p>
              <h1 id="hero-title" className="max-w-3xl text-pretty text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">Help us understand what is happening.</h1>
              <p className="mt-7 max-w-xl text-pretty text-lg leading-8 text-muted-foreground">Map what is happening in your community. Your report helps Matata and partners understand the location, scale and impact of floods, earthquakes, wildfires and other disasters.</p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link href="/report" className="inline-flex items-center gap-3 bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Report a crisis <ArrowRight data-icon="inline-end" /></Link>
                <Link href="#how-it-works" className="inline-flex items-center gap-2 px-2 py-3.5 text-sm font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">Learn how it works</Link>
              </div>
              <p className="mt-6 text-xs leading-5 text-muted-foreground">For immediate danger, contact your local emergency services first.</p>
            </div>
            <div className="min-h-[360px] bg-muted lg:min-h-[560px]">
              <img src={imageUrls.hero} alt="Aerial view of a community affected by flooding" className="h-full w-full object-cover" />
            </div>
          </div>
        </section>

        <section id="report" className="border-b border-border bg-muted/50" aria-labelledby="report-title">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Start here</p>
                <h2 id="report-title" className="mt-3 text-3xl font-bold tracking-tight">What is happening in your area?</h2>
              </div>
              <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
                {crisisTypes.map((type) => <Link key={type} href="/report" className="group flex min-h-24 items-end justify-between bg-background p-5 text-sm font-semibold transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><span>{type}</span><ArrowRight className="opacity-0 transition-opacity group-hover:opacity-100" data-icon="inline-end" /></Link>)}
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24" aria-labelledby="process-title">
          <div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">A simple process</p><h2 id="process-title" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Your information can guide action.</h2></div>
          <div className="mt-12 grid gap-10 lg:grid-cols-3">
            {[['01', 'Tell us what you see', 'Pin the disaster location and describe what is happening on the ground.'], ['02', 'Add what you know', 'Add observations about damage, access, infrastructure and people affected.'], ['03', 'Help direct support', 'Clear, location-based reports help response teams prioritize action and resources.']].map(([number, title, description], index) => <article key={number} className="border-t-2 border-primary pt-5"><p className="font-mono text-sm text-primary">{number}</p><h3 className="mt-6 text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>{index === 0 && <img src={imageUrls.people} alt="People gathered to support their community" className="mt-8 aspect-[4/3] w-full object-cover" />}{index === 1 && <img src={imageUrls.field} alt="Aid workers coordinating support in the field" className="mt-8 aspect-[4/3] w-full object-cover" />}{index === 2 && <img src={imageUrls.response} alt="Community members receiving coordinated support" className="mt-8 aspect-[4/3] w-full object-cover" />}</article>)}
          </div>
        </section>

        <section id="resources" className="bg-primary text-primary-foreground" aria-labelledby="resources-title">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-14 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-16"><div><h2 id="resources-title" className="text-3xl font-bold tracking-tight">Need help or more information?</h2><p className="mt-3 max-w-xl leading-7 text-primary-foreground/75">Learn more about Matata’s work in crisis prevention, response and recovery.</p></div><a href="#top" className="inline-flex w-fit items-center gap-2 border border-primary-foreground/60 px-5 py-3 text-sm font-semibold hover:bg-primary-foreground hover:text-primary">Return to Matata <ExternalLink data-icon="inline-end" /></a></div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
