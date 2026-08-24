'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck, Users, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import type { CrisisType } from '@/lib/types';

const CRISIS_TYPES: CrisisType[] = ['flood', 'earthquake', 'wildfire', 'conflict', 'other'];

export default function Page() {
  const { locale } = useLanguage();

  return (
    <main id="top" className="site-shell">
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Matata home">
          <span className="brand-mark">M</span><span>Matata</span>
        </Link>
        <nav className="site-nav" aria-label="Primary navigation">
          <a href="#how-it-works">{t(locale, 'nav.about')}</a>
          <a href="#resources">{t(locale, 'nav.resources')}</a>
          <Link href="/login">{t(locale, 'nav.sign_in')}</Link>
        </nav>
        <LanguageSwitcher />
        <Link href="/report" className="header-action">
          {t(locale, 'nav.report_now')} <ArrowRight size={16} />
        </Link>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">{t(locale, 'landing.badge')}</p>
          <h1 id="hero-title">{t(locale, 'landing.hero_title')}</h1>
          <p className="hero-lede">{t(locale, 'landing.hero_desc')}</p>
          <div className="hero-actions">
            <Link href="/report" className="primary-action">
              {t(locale, 'landing.cta_primary')} <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="text-action">
              {t(locale, 'landing.cta_secondary')}
            </Link>
          </div>
          <p className="notice">{t(locale, 'landing.emergency_notice')}</p>
        </div>
        <div className="hero-visual" aria-label="Community members standing together">
          <div className="visual-badge"><ShieldCheck size={20} /><span>{t(locale, 'landing.badge')}</span></div>
          <div className="visual-grid" />
        </div>
      </section>

      <section className="report-section" aria-labelledby="report-title">
        <div>
          <h2 id="report-title">{t(locale, 'landing.crisis_section_title')}</h2>
        </div>
        <div className="category-grid">
          {CRISIS_TYPES.map((type) => (
            <Link href={`/report?type=${type}`} className="category" key={type}>
              {t(locale, `crisis.${type}` as Parameters<typeof t>[1])}
              <ArrowRight size={18} />
            </Link>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="steps-section" aria-labelledby="how-title">
        <div className="section-heading">
          <h2 id="how-title">{t(locale, 'landing.how_title')}</h2>
        </div>
        <div className="steps-grid">
          <article>
            <MapPin size={24} />
            <h3>{t(locale, 'landing.step1_title')}</h3>
            <p>{t(locale, 'landing.step1_desc')}</p>
          </article>
          <article>
            <Users size={24} />
            <h3>{t(locale, 'landing.step2_title')}</h3>
            <p>{t(locale, 'landing.step2_desc')}</p>
          </article>
          <article>
            <ShieldCheck size={24} />
            <h3>{t(locale, 'landing.step3_title')}</h3>
            <p>{t(locale, 'landing.step3_desc')}</p>
          </article>
        </div>
      </section>

      <section id="resources" className="resource-band">
        <div>
          <h2>{t(locale, 'landing.cta2_title')}</h2>
          <p>{t(locale, 'landing.cta2_desc')}</p>
        </div>
        <Link href="/report" className="outline-action">
          {t(locale, 'landing.submit_report')} <ArrowRight size={18} />
        </Link>
      </section>

      <footer className="site-footer">
        <div>
          <span className="brand-name">Matata</span>
          <p>{t(locale, 'footer.tagline')}</p>
        </div>
        <div>
          <p className="footer-label">{t(locale, 'nav.report_now')}</p>
          <Link href="/report">{t(locale, 'nav.report_now')}</Link>
          <Link href="/login">{t(locale, 'nav.sign_in')}</Link>
        </div>
        <div>
          <p className="footer-label">{t(locale, 'footer.undp')}</p>
          <p>{t(locale, 'footer.undp_tagline')}</p>
        </div>
      </footer>
    </main>
  );
}