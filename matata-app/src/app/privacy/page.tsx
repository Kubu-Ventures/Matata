'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';

// The policy text is kept in English only and mirrors PRIVACY.md at the repo
// root. Change both together.

const VERSION = 'Version 1.0 · 16 October 2026';
const CONTACT = 'info@origin.co.ke';

const COLLECTED: [string, string, string][] = [
  ['Location of the damage (GPS position and its accuracy), or a landmark you type', 'Every report', 'To put the report on the map and match it to a building'],
  ['The building you pick, or that your building is not on the map', 'If you choose one', 'To link the report to the right building, or to show mapping gaps'],
  ['Crisis type, building type, damage level, electricity, health services, debris, most pressing needs', 'Every report', 'To understand the damage and what people need'],
  ['A photo of the damage', 'Only if you add one', 'To show responders the damage and estimate its severity'],
  ['A random session code for your phone', 'When you open the report form', 'To let you see your own reports and to stop abuse'],
  ['Your email address', 'Only if you choose to sign in', 'To let you sign in. We store only a scrambled (hashed) form of it'],
  ['Your IP address', 'When your phone talks to our server', 'To block abuse such as automated floods of reports'],
];

const PROVIDERS: [string, string, string][] = [
  ['Our own server (Docker deployment, with MinIO photo storage)', 'Runs the Matata server, database and photo storage', 'All report data and photos'],
  ['Privy', 'Sends sign-in codes by email', 'Your email address, if you sign in'],
  ['Amazon Web Services (AWS Rekognition)', 'Checks photos for harmful content', 'Photos'],
  ['Anthropic (Claude)', 'Estimates damage severity from the photo', 'Photos and the damage details'],
  ['OpenStreetMap Nominatim', 'Finds a location from a landmark you typed', 'The landmark text'],
  ['LibreTranslate, run on our own server', 'Translates free text for analysts', 'Free text you typed'],
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-[#232E3D]">{title}</h2>
      <div className="space-y-3 text-sm leading-6 text-[#55606E]">{children}</div>
    </section>
  );
}

function Table({ head, rows }: { head: [string, string, string]; rows: [string, string, string][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#EDEFF0]">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#F7F8FA] text-[#232E3D]">
          <tr>
            {head.map(h => (
              <th key={h} className="px-3 py-2 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r[0]} className="border-t border-[#EDEFF0] align-top">
              {r.map((cell, i) => (
                <td key={i} className={i === 0 ? 'px-3 py-2 text-[#232E3D]' : 'px-3 py-2'}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map(i => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
  const { locale } = useLanguage();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="border-b border-[#EDEFF0] bg-white">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#006EB5] rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="font-semibold text-[#232E3D]">Matata</span>
          </Link>
          <LanguageSwitcher />
        </div>
      </div>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-[#232E3D]">{t(locale, 'privacy.title')}</h1>
          <p className="text-xs text-[#55606E]">{VERSION}</p>
          {locale !== 'en' && (
            <p className="rounded bg-[#F7F8FA] border border-[#EDEFF0] p-3 text-sm text-[#232E3D]">
              {t(locale, 'privacy.english_only')}
            </p>
          )}
        </header>

        <Section title="1. Who we are">
          <p>
            Matata is built and maintained by Origin Africa Software Limited, a company registered in Kenya
            (&ldquo;we&rdquo;). When we run Matata for a response, we are the data controller. When a partner (for
            example a county government or a Red Cross society) runs its own Matata instance, that partner is the
            controller for its data and this policy describes the minimum the software does.
          </p>
          <p>Privacy and safeguarding contact: {CONTACT}</p>
        </Section>

        <Section title="2. What we collect">
          <Table head={['Data', 'When', 'Why']} rows={COLLECTED} />
          <p>We do not ask for your name, ID number or phone number to send a report.</p>
          <p>
            Before a photo is stored, we remove the hidden data that phones add to pictures (GPS position, device
            model, serial number). Free text you type is cleaned of web code. Your email address or phone number is
            never stored in readable form: we keep only a salted hash.
          </p>
          <p>
            While you are offline, your report waits on your own phone (in the browser&rsquo;s storage) and is sent
            when you are back online. It is deleted from your phone once it is sent.
          </p>
        </Section>

        <Section title="3. Why we use it, and our legal basis">
          <p>
            We use report data only to help people affected by a disaster: to see where damage is, to decide where
            to send help, and to plan recovery. We do not sell data, show advertising, or use reports to build
            profiles of people.
          </p>
          <p>
            Our legal basis is your consent, which you give in the report form before you send a report, and, during
            an emergency, the protection of people&rsquo;s vital interests and tasks carried out in the public
            interest by the responders we work with.
          </p>
        </Section>

        <Section title="4. Who can see your report">
          <List
            items={[
              'Trained analysts and responders working on the response see reports on the Matata dashboard, including photos. Regional responders see only reports inside their own area.',
              'Aid organisations and the public may receive exported data (for example on the Humanitarian Data Exchange). Exports never include photos, your email, your session code or analyst notes. Email addresses, phone numbers and web links typed into free-text fields are removed. For sensitive situations, such as conflict, locations can be rounded to about 110 m or 1.1 km before sharing.',
              'Analysts never see who you are. The dashboard shows only a trust level for each reporter, never an email or session code.',
            ]}
          />
        </Section>

        <Section title="5. Service providers">
          <p>
            These services process data on our behalf. Matata runs on servers we operate, so report data, photos
            and translation stay on our own systems. Anthropic and Amazon Web Services are outside Kenya.
          </p>
          <Table head={['Provider', 'What it does', 'Data it sees']} rows={PROVIDERS} />
        </Section>

        <Section title="6. Automated severity estimates">
          <p>
            When a photo is added, an AI model may estimate how badly the building is damaged. The estimate is
            advice for analysts, not a decision about you. Estimates the model is unsure about are always sent to a
            person, and analysts can override any estimate.
          </p>
        </Section>

        <Section title="7. How long we keep it">
          <List
            items={[
              'Photos are deleted 90 days after the report was sent, unless a newer report still uses the same photo.',
              'Report records (location, damage details, needs) are kept for as long as the response and recovery need them, and reviewed at the end of each response. They are then deleted or made anonymous, and are never kept more than 2 years after the response ends.',
              'Session codes expire on their own. Sign-in codes expire within minutes.',
              'Exports created on the dashboard expire after 24 hours.',
            ]}
          />
        </Section>

        <Section title="8. Your rights">
          <p>Under the Kenya Data Protection Act, 2019, you can ask us to:</p>
          <List
            items={[
              'tell you what data we hold about you and give you a copy;',
              'correct it;',
              'delete it, or stop using it;',
              'withdraw your consent at any time (this does not affect reports already shared before you withdrew it).',
            ]}
          />
          <p>
            Write to {CONTACT} with the report reference shown after you sent the report. We will reply within 30
            days. If you are not satisfied, you can complain to the Office of the Data Protection Commissioner (
            <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer" className="text-[#006EB5] underline">
              odpc.go.ke
            </a>
            ).
          </p>
        </Section>

        <Section title="9. Safeguarding">
          <p>Reports are about damage, not people. To keep everyone safe:</p>
          <List
            items={[
              'Do not photograph people’s faces, children, injured or dead people, or ID documents. Point the camera at the building or road.',
              'Do not photograph police, military or other security sites.',
              'Do not type names or phone numbers (yours or anyone else’s) into the report. If you need help yourself, contact emergency services first.',
              'Only report if it is safe to do so. Never enter a damaged building or flood water to take a photo.',
              'Matata is not meant for children under 18 to use alone. A young person who needs to report damage should ask an adult to help.',
            ]}
          />
          <p>
            When automatic content checking is switched on, every photo is checked for harmful content before it is
            stored. Analysts remove reports that break these rules. In conflict settings, locations can be rounded
            before data is shared. If you see a report that puts someone at risk, contact {CONTACT} and we will
            act within 24 hours.
          </p>
        </Section>

        <Section title="10. Security">
          <p>
            Data travels between your phone and our server over an encrypted connection (HTTPS). Only provisioned
            staff accounts can open the dashboard. Personal identifiers are stored only as salted hashes. One limit:
            phone numbers have few possible values, so if both our database and our secret key were stolen, hashed
            phone numbers could be worked out. Moving the key to a managed key store is planned.
          </p>
        </Section>

        <Section title="11. Changes">
          <p>
            We will post any change to this policy here, with a new version date. If a change affects how reports
            you have already sent are used, we will say so on the report form.
          </p>
        </Section>

        <Link href="/" className="inline-block text-sm text-[#006EB5] underline">
          {t(locale, 'login.return_home')}
        </Link>
      </main>
    </div>
  );
}
