'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi, reportsApi } from '@/lib/api';
import { saveAuth, getToken } from '@/lib/auth';
import { addToQueue } from '@/lib/offline';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { AccountMenu } from '@/components/layout/AccountMenu';
import type { CrisisType, InfrastructureType, DamageSeverity, ElectricityStatus, HealthServicesStatus } from '@/lib/types';

type FormData = {
  lat: number | null;
  lng: number | null;
  landmark_description: string;
  crisis_type: CrisisType | '';
  infrastructure_type: InfrastructureType | '';
  damage_severity: DamageSeverity | '';
  electricity_status: ElectricityStatus | '';
  health_services_status: HealthServicesStatus | '';
  most_pressing_needs: string;
  debris_clearing_needed: boolean | null;
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ReportPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const [step, setStep] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [form, setForm] = useState<FormData>({
    lat: null,
    lng: null,
    landmark_description: '',
    crisis_type: '',
    infrastructure_type: '',
    damage_severity: '',
    electricity_status: '',
    health_services_status: '',
    most_pressing_needs: '',
    debris_clearing_needed: null,
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const STEPS = [
    t(locale, 'report.step_location'),
    t(locale, 'report.step_crisis'),
    t(locale, 'report.step_details'),
    t(locale, 'report.step_review'),
  ];

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!getToken()) {
      authApi.anonymous().then(d => saveAuth(d.session_token, 'anonymous_reporter')).catch(() => {});
    }
  }, []);

  function setField<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  function getLocation() {
    setLocating(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setField('lat', pos.coords.latitude);
        setField('lng', pos.coords.longitude);
        setLocating(false);
      },
      () => {
        setLocError(t(locale, 'report.location_error'));
        setLocating(false);
      },
      { timeout: 10000 }
    );
  }

  function canProceed() {
    if (step === 0) return form.lat !== null || form.landmark_description.trim().length > 0;
    if (step === 1) return form.crisis_type !== '' && form.infrastructure_type !== '';
    if (step === 2) return form.damage_severity !== '';
    return true;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError('');

    const fields = {
      crisis_type: form.crisis_type as CrisisType,
      infrastructure_type: form.infrastructure_type as InfrastructureType,
      damage_severity: form.damage_severity as DamageSeverity,
      offline_queued_at: new Date().toISOString(),
      ...(form.lat !== null ? { lat: form.lat, lng: form.lng! } : {}),
      ...(form.landmark_description ? { landmark_description: form.landmark_description } : {}),
      ...(form.electricity_status ? { electricity_status: form.electricity_status } : {}),
      ...(form.health_services_status ? { health_services_status: form.health_services_status } : {}),
      ...(form.most_pressing_needs ? { most_pressing_needs: form.most_pressing_needs } : {}),
      ...(form.debris_clearing_needed !== null ? { debris_clearing_needed: form.debris_clearing_needed } : {}),
    };

    if (!isOnline) {
      let photoDataUrl: string | undefined;
      if (photo && photo.size < 5 * 1024 * 1024) {
        try { photoDataUrl = await readFileAsDataUrl(photo); } catch { /* skip */ }
      }
      const localId = addToQueue({ fields, ...(photoDataUrl ? { photoDataUrl } : {}) });
      router.push(`/report/queued?ref=${localId}`);
      return;
    }

    try {
      const result = await reportsApi.submit(fields, photo);
      router.push(`/report/${result.id}?submitted=1`);
    } catch (err: unknown) {
      const apiErr = err as { status?: number };
      if (apiErr.status === 429) {
        setSubmitError(t(locale, 'report.error_rate_limit'));
      } else if (apiErr.status === 422) {
        setSubmitError(t(locale, 'report.error_photo'));
      } else {
        setSubmitError(t(locale, 'report.error_generic'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const crisisIcons: Record<CrisisType, string> = {
    flood: '🌊', earthquake: '🏚️', conflict: '⚠️', wildfire: '🔥', other: '❓',
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <div className="border-b border-[#EDEFF0] bg-white">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#006EB5] rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="font-semibold text-[#232E3D]">Matata</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#55606E]">
              {t(locale, 'report.step_of', { current: step + 1, total: STEPS.length })}
            </span>
            <AccountMenu />
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[#EDEFF0]">
        <div
          className="h-full bg-[#006EB5] transition-all duration-300"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {!isOnline && (
        <div className="bg-[#FBC412] text-[#232E3D] text-xs font-medium text-center py-1.5 px-4">
          {t(locale, 'offline.banner')}
        </div>
      )}

      <div className="flex-1 max-w-xl mx-auto w-full px-4 py-8">
        <p className="text-xs font-semibold text-[#006EB5] uppercase tracking-widest mb-2">
          {STEPS[step]}
        </p>

        {/* STEP 0: Location */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#232E3D] mb-1">{t(locale, 'report.location_title')}</h2>
              <p className="text-sm text-[#55606E]">{t(locale, 'report.location_desc')}</p>
            </div>

            <button
              type="button"
              disabled={locating}
              onClick={getLocation}
              className={`w-full py-4 px-6 rounded-lg border-2 text-sm font-semibold transition-colors ${
                form.lat !== null
                  ? 'border-green-500 bg-green-50 text-green-800'
                  : 'border-[#006EB5] bg-[#006EB5] text-white hover:bg-[#005a94]'
              } disabled:opacity-60`}
            >
              {locating ? '…' : form.lat !== null
                ? `${t(locale, 'report.location_captured')} (${form.lat.toFixed(4)}, ${form.lng?.toFixed(4)})`
                : t(locale, 'report.use_location')}
            </button>

            {locError && <p className="text-sm text-[#EE402D]">{locError}</p>}

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-[#EDEFF0]" />
              <span className="text-xs text-[#55606E]">{t(locale, 'report.or')}</span>
              <div className="flex-1 h-px bg-[#EDEFF0]" />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-[#232E3D]">
                {t(locale, 'report.landmark_label')}
              </label>
              <input
                type="text"
                className="block w-full rounded border border-[#EDEFF0] px-3 py-2.5 text-sm text-[#232E3D] placeholder:text-[#55606E] focus:border-[#006EB5] focus:outline-none focus:ring-1 focus:ring-[#006EB5]"
                placeholder={t(locale, 'report.landmark_placeholder')}
                value={form.landmark_description}
                onChange={e => setField('landmark_description', e.target.value)}
              />
              <p className="text-xs text-[#55606E]">{t(locale, 'report.landmark_helper')}</p>
            </div>
          </div>
        )}

        {/* STEP 1: Crisis Type */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#232E3D] mb-1">{t(locale, 'report.crisis_title')}</h2>
              <p className="text-sm text-[#55606E]">{t(locale, 'report.crisis_desc')}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-[#232E3D] mb-3">{t(locale, 'report.crisis_type_label')}</p>
              <div className="grid grid-cols-2 gap-3">
                {(['flood', 'earthquake', 'conflict', 'wildfire', 'other'] as CrisisType[]).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setField('crisis_type', type)}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      form.crisis_type === type
                        ? 'border-[#006EB5] bg-[#B5D5F5]/20'
                        : 'border-[#EDEFF0] hover:border-[#B5D5F5]'
                    }`}
                  >
                    <div className="text-xl mb-1">{crisisIcons[type]}</div>
                    <div className="text-sm font-medium text-[#232E3D]">
                      {t(locale, `crisis.${type}` as Parameters<typeof t>[1])}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-[#232E3D]">
                {t(locale, 'report.infra_label')}
              </label>
              <select
                className="block w-full rounded border border-[#EDEFF0] px-3 py-2.5 text-sm text-[#232E3D] focus:border-[#006EB5] focus:outline-none focus:ring-1 focus:ring-[#006EB5] bg-white"
                value={form.infrastructure_type}
                onChange={e => setField('infrastructure_type', e.target.value as InfrastructureType)}
              >
                <option value="">{t(locale, 'report.infra_placeholder')}</option>
                {(['residential', 'commercial', 'government', 'utilities', 'transport', 'community'] as InfrastructureType[]).map(type => (
                  <option key={type} value={type}>
                    {t(locale, `infra.${type}` as Parameters<typeof t>[1])}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* STEP 2: Details */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#232E3D] mb-1">{t(locale, 'report.details_title')}</h2>
              <p className="text-sm text-[#55606E]">{t(locale, 'report.details_desc')}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-[#232E3D] mb-3">
                {t(locale, 'report.severity_label')} <span className="text-[#EE402D]">*</span>
              </p>
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    { val: 'minimal' as const, labelKey: 'report.severity_minimal_label' as const, descKey: 'report.severity_minimal_desc' as const, color: 'border-yellow-300 bg-yellow-50' },
                    { val: 'partial' as const, labelKey: 'report.severity_partial_label' as const, descKey: 'report.severity_partial_desc' as const, color: 'border-orange-300 bg-orange-50' },
                    { val: 'destroyed' as const, labelKey: 'report.severity_destroyed_label' as const, descKey: 'report.severity_destroyed_desc' as const, color: 'border-red-300 bg-red-50' },
                  ]
                ).map(({ val, labelKey, descKey, color }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setField('damage_severity', val)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      form.damage_severity === val ? color : 'border-[#EDEFF0] hover:border-[#B5D5F5]'
                    }`}
                  >
                    <div className="text-sm font-semibold text-[#232E3D]">{t(locale, labelKey)}</div>
                    <div className="text-xs text-[#55606E] mt-0.5">{t(locale, descKey)}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-[#232E3D]">{t(locale, 'report.electricity_label')}</label>
              <select
                className="block w-full rounded border border-[#EDEFF0] px-3 py-2.5 text-sm text-[#232E3D] focus:border-[#006EB5] focus:outline-none focus:ring-1 focus:ring-[#006EB5] bg-white"
                value={form.electricity_status}
                onChange={e => setField('electricity_status', e.target.value as ElectricityStatus)}
              >
                <option value="">Select...</option>
                {(['functional', 'non_functional', 'unknown'] as ElectricityStatus[]).map(s => (
                  <option key={s} value={s}>{t(locale, `electricity.${s}` as Parameters<typeof t>[1])}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-[#232E3D]">{t(locale, 'report.health_label')}</label>
              <select
                className="block w-full rounded border border-[#EDEFF0] px-3 py-2.5 text-sm text-[#232E3D] focus:border-[#006EB5] focus:outline-none focus:ring-1 focus:ring-[#006EB5] bg-white"
                value={form.health_services_status}
                onChange={e => setField('health_services_status', e.target.value as HealthServicesStatus)}
              >
                <option value="">Select...</option>
                {(['accessible', 'inaccessible', 'unknown'] as HealthServicesStatus[]).map(s => (
                  <option key={s} value={s}>{t(locale, `health.${s}` as Parameters<typeof t>[1])}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-[#232E3D]">{t(locale, 'report.needs_label')}</label>
              <textarea
                rows={3}
                className="block w-full rounded border border-[#EDEFF0] px-3 py-2 text-sm text-[#232E3D] placeholder:text-[#55606E] focus:border-[#006EB5] focus:outline-none focus:ring-1 focus:ring-[#006EB5]"
                placeholder={t(locale, 'report.needs_placeholder')}
                value={form.most_pressing_needs}
                onChange={e => setField('most_pressing_needs', e.target.value)}
                maxLength={1000}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-[#232E3D] mb-2">{t(locale, 'report.debris_label')}</p>
              <div className="flex gap-3">
                {[
                  { val: true, labelKey: 'report.yes' as const },
                  { val: false, labelKey: 'report.no' as const },
                ].map(({ val, labelKey }) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setField('debris_clearing_needed', val)}
                    className={`px-4 py-2 rounded border text-sm font-medium transition-colors ${
                      form.debris_clearing_needed === val
                        ? 'border-[#006EB5] bg-[#006EB5] text-white'
                        : 'border-[#EDEFF0] text-[#232E3D] hover:border-[#B5D5F5]'
                    }`}
                  >
                    {t(locale, labelKey)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Review & Submit */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#232E3D] mb-1">{t(locale, 'report.review_title')}</h2>
              <p className="text-sm text-[#55606E]">{t(locale, 'report.review_desc')}</p>
            </div>

            <div className="bg-[#F7F8FA] rounded-lg p-4 space-y-2 border border-[#EDEFF0]">
              <div className="flex justify-between text-sm">
                <span className="text-[#55606E]">{t(locale, 'report.summary_location')}</span>
                <span className="text-[#232E3D] font-medium text-right max-w-xs">
                  {form.lat !== null
                    ? `${form.lat.toFixed(4)}, ${form.lng?.toFixed(4)}`
                    : form.landmark_description || '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#55606E]">{t(locale, 'report.summary_crisis')}</span>
                <span className="text-[#232E3D] font-medium">
                  {form.crisis_type ? t(locale, `crisis.${form.crisis_type}` as Parameters<typeof t>[1]) : '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#55606E]">{t(locale, 'report.summary_infra')}</span>
                <span className="text-[#232E3D] font-medium">
                  {form.infrastructure_type ? t(locale, `infra.${form.infrastructure_type}` as Parameters<typeof t>[1]) : '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#55606E]">{t(locale, 'report.summary_severity')}</span>
                <span
                  className={`font-medium capitalize px-2 py-0.5 rounded text-xs ${
                    form.damage_severity === 'destroyed'
                      ? 'bg-red-100 text-red-800'
                      : form.damage_severity === 'partial'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {form.damage_severity ? t(locale, `report.severity_${form.damage_severity}_label` as Parameters<typeof t>[1]) : '—'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-[#232E3D] mb-2">{t(locale, 'report.photo_label')}</p>
              <div
                className="border-2 border-dashed border-[#EDEFF0] rounded-lg p-6 text-center cursor-pointer hover:border-[#B5D5F5] transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {photo ? (
                  <div>
                    <div className="text-2xl mb-1">📷</div>
                    <p className="text-sm font-medium text-[#006EB5]">{photo.name}</p>
                    <p className="text-xs text-[#55606E]">{(photo.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl mb-1">📷</div>
                    <p className="text-sm text-[#55606E]">{t(locale, 'report.photo_tap')}</p>
                    <p className="text-xs text-[#55606E] mt-1">{t(locale, 'report.photo_hint')}</p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => setPhoto(e.target.files?.[0] || null)}
              />
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-sm text-[#EE402D]">{submitError}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3.5 px-6 rounded-lg border-2 border-[#EDEFF0] text-sm font-semibold text-[#232E3D] hover:border-[#B5D5F5] transition-colors"
            >
              {t(locale, 'report.back')}
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="flex-1 py-3.5 px-6 rounded-lg bg-[#006EB5] text-white text-sm font-semibold hover:bg-[#005a94] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t(locale, 'report.continue')}
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="flex-1 py-3.5 px-6 rounded-lg bg-[#006EB5] text-white text-sm font-semibold hover:bg-[#005a94] transition-colors disabled:opacity-60"
            >
              {submitting ? '…' : t(locale, 'report.submit')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}