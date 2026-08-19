'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { authApi } from '@/lib/api'
import { saveAuth } from '@/lib/auth'
import type { Role } from '@/lib/types'
import { LoginShell, PrimaryButton } from '@/components/site-ui'
import { useLanguage } from '@/components/language-provider'

export default function LoginPage() {
  const router = useRouter()
  const { translate } = useLanguage()
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSendOtp(event: FormEvent) {
    event.preventDefault(); setError('')
    if (phone.replace(/\D/g, '').length < 7) return setError(translate('invalidPhone'))
    setLoading(true)
    try { await authApi.sendOtp(phone); setStep('code') }
    catch (err: unknown) { setError((err as { message?: string }).message || translate('otpError')) }
    finally { setLoading(false) }
  }

  async function handleVerifyOtp(event: FormEvent) {
    event.preventDefault(); setError('')
    if (!/^\d{6}$/.test(code)) return setError(translate('invalidCode'))
    setLoading(true)
    try {
      const data = await authApi.verifyOtp(phone, code)
      saveAuth(data.token, data.role as Role, data.refresh_token)
      if (['analyst', 'responder', 'admin'].includes(data.role)) router.push('/analyst/dashboard')
      else router.push('/report')
    } catch (err: unknown) {
      setError((err as { status?: number }).status === 429 ? translate('tooManyAttempts') : translate('invalidCode'))
    } finally { setLoading(false) }
  }

  return <LoginShell><div className="mx-auto max-w-md"><div className="flex items-center gap-2 text-sm font-bold text-udnp-blue"><ShieldCheck size={18} aria-hidden="true" />{translate('privacy')}</div><h1 className="mt-6 text-3xl font-black tracking-tight text-navy">{step === 'phone' ? translate('phoneTitle') : translate('codeTitle')}</h1><p className="mt-3 leading-6 text-slate-copy">{step === 'phone' ? translate('phoneIntro') : `${translate('codeIntro')} ${phone}`}</p><form onSubmit={step === 'phone' ? handleSendOtp : handleVerifyOtp} className="mt-8 space-y-6">{step === 'phone' ? <label className="block text-sm font-bold text-navy">{translate('phone')}<input autoFocus required type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-2 min-h-12 w-full border border-line bg-white px-4 text-base outline-none focus:border-udnp-blue focus:ring-4 focus:ring-udnp-blue/15" placeholder="+000 000 000 000" /></label> : <label className="block text-sm font-bold text-navy">{translate('code')}<input autoFocus required inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className="mt-2 min-h-12 w-full border border-line bg-white px-4 text-center text-2xl tracking-[0.4em] outline-none focus:border-udnp-blue focus:ring-4 focus:ring-udnp-blue/15" /> </label>}{error && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-dark">{error}</p>}<PrimaryButton disabled={loading}>{loading ? '…' : step === 'phone' ? translate('continue') : translate('verify')}</PrimaryButton>{step === 'code' && <button type="button" onClick={() => { setStep('phone'); setCode(''); setError('') }} className="inline-flex items-center gap-1 text-sm font-bold text-udnp-blue"><ArrowLeft size={16} aria-hidden="true" />{translate('back')}</button>}</form></div></LoginShell>
}
