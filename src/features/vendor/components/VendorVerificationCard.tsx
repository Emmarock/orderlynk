import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, apiMessage } from '@/shared/lib/api'
import type { Vendor } from '@/shared/lib/types'
import { ErrorNote, Rail } from '@/shared/components/ui'

/**
 * Shows the vendor exactly what they must verify — their email address AND their WhatsApp number —
 * before an admin can approve the store, with resend/verify actions for each. Rendered on the vendor
 * dashboard while either is still outstanding, so the requirement is never invisible.
 */
export default function VendorVerificationCard({
  vendor,
  onChange,
}: {
  vendor: Vendor
  onChange: (v: Vendor) => void
}) {
  const emailVerified = vendor.emailVerified !== false
  const { whatsappVerified } = vendor
  const hasNumber = !!vendor.whatsappNumber

  const [busy, setBusy] = useState<'email' | 'send' | 'verify' | null>(null)
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Both verified: nothing to prompt — let the "pending approval" banner speak instead.
  if (emailVerified && whatsappVerified) return null

  const resendEmail = async () => {
    setBusy('email'); setError(null); setNotice(null)
    try {
      await api.resendVerification()
      setNotice("We've re-sent the verification link. Check your inbox (and spam folder).")
    } catch (e) {
      setError(apiMessage(e, 'Could not send the verification email'))
    } finally {
      setBusy(null)
    }
  }

  const sendCode = async () => {
    setBusy('send'); setError(null); setNotice(null)
    try {
      await api.sendWhatsappCode()
      setCodeSent(true)
      setNotice(`We've sent a 6-digit code to ${vendor.whatsappNumber} on WhatsApp.`)
    } catch (e) {
      setError(apiMessage(e, 'Could not send the WhatsApp code'))
    } finally {
      setBusy(null)
    }
  }

  const verifyCode = async () => {
    setBusy('verify'); setError(null); setNotice(null)
    try {
      const updated = await api.verifyWhatsapp(code.trim())
      onChange(updated)
      setCode('')
    } catch (e) {
      setError(apiMessage(e, 'Could not verify that code'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="card overflow-hidden">
      <Rail />
      <div className="p-6">
        <h2 className="font-display text-xl font-semibold">Verify your account</h2>
        <p className="mt-1 text-sm text-muted">
          Verify both your email address and your WhatsApp number so an admin can approve your store and
          make it public.
        </p>

        {error && <div className="mt-4"><ErrorNote message={error} /></div>}
        {notice && (
          <div className="mt-4 rounded-xl border border-forest/30 bg-forest/8 px-4 py-3 text-sm text-forest">
            {notice}
          </div>
        )}

        {/* Email */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium">Email address</p>
              <span className={`chip ${emailVerified ? 'bg-forest/12 text-forest' : 'bg-gold/15 text-gold'}`}>
                {emailVerified ? 'Verified' : 'Not verified'}
              </span>
            </div>
            <p className="text-sm text-muted">Click the link in the email we sent you.</p>
          </div>
          {!emailVerified && (
            <button className="btn-ghost px-4 py-1.5" disabled={busy === 'email'} onClick={resendEmail}>
              {busy === 'email' ? 'Sending…' : 'Resend email'}
            </button>
          )}
        </div>

        {/* WhatsApp */}
        <div className="mt-5 border-t border-line pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium">WhatsApp number</p>
                <span className={`chip ${whatsappVerified ? 'bg-forest/12 text-forest' : 'bg-gold/15 text-gold'}`}>
                  {whatsappVerified ? 'Verified' : 'Not verified'}
                </span>
              </div>
              <p className="text-sm text-muted">
                {hasNumber ? vendor.whatsappNumber : 'No WhatsApp number on file.'}
              </p>
            </div>
            {!whatsappVerified && !hasNumber && (
              <Link to="/vendor/manage/settings" className="btn-ghost px-4 py-1.5">Add number</Link>
            )}
            {!whatsappVerified && hasNumber && (
              <button className="btn-ghost px-4 py-1.5" disabled={busy === 'send'} onClick={sendCode}>
                {busy === 'send' ? 'Sending…' : codeSent ? 'Resend code' : 'Send code'}
              </button>
            )}
          </div>

          {!whatsappVerified && hasNumber && codeSent && (
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div>
                <label className="label" htmlFor="wa-code">Enter the 6-digit code</label>
                <input
                  id="wa-code"
                  className="field w-40 font-mono tracking-widest"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>
              <button
                className="btn-forest px-4 py-2"
                disabled={busy === 'verify' || code.length !== 6}
                onClick={verifyCode}
              >
                {busy === 'verify' ? 'Verifying…' : 'Verify'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
