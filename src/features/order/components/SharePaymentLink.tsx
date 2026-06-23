import { useState, type ReactNode } from 'react'

/**
 * Share a card-payment link with a customer over social channels.
 *
 * WhatsApp and Facebook support sharing a URL via a web intent (prefilled message / share dialog).
 * Instagram and TikTok have no public "share this link" web intent, so those copy the link to the
 * clipboard — the vendor pastes it into a DM, caption, or bio. This is the honest behaviour rather
 * than pretending a deep link exists.
 */
export default function SharePaymentLink({ url, message }: { url: string; message: string }) {
  const [copied, setCopied] = useState<string | null>(null)
  const full = `${message} ${url}`

  const copy = async (what: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(what)
      setTimeout(() => setCopied((c) => (c === what ? null : c)), 1800)
    } catch {
      setCopied(null)
    }
  }

  const wa = `https://wa.me/?text=${encodeURIComponent(full)}`
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`

  return (
    <div>
      <p className="label">Share payment link</p>
      <p className="mb-3 text-sm text-muted">Send this to your customer — they pay by card, no account needed.</p>

      <div className="flex flex-wrap gap-2">
        <ShareButton href={wa} bg="#25D366" fg="#fff" label="WhatsApp" icon={<WhatsAppIcon />} />
        <ShareButton href={fb} bg="#1877F2" fg="#fff" label="Facebook" icon={<FacebookIcon />} />
        <ShareButton
          onClick={() => copy('ig', full)}
          bg="#E4405F"
          fg="#fff"
          label={copied === 'ig' ? 'Copied!' : 'Instagram'}
          icon={<InstagramIcon />}
        />
        <ShareButton
          onClick={() => copy('tt', full)}
          bg="#000"
          fg="#fff"
          label={copied === 'tt' ? 'Copied!' : 'TikTok'}
          icon={<TikTokIcon />}
        />
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <ShareButton
            onClick={() => navigator.share({ text: message, url }).catch(() => {})}
            bg="#1B1915"
            fg="#fff"
            label="Share…"
            icon={<ShareIcon />}
          />
        )}
      </div>

      <p className="mt-2 text-xs text-muted">Instagram & TikTok don't allow prefilled links — those copy it so you can paste into a DM or bio.</p>

      {/* The raw link + copy */}
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-sand px-3 py-2">
        <span className="truncate font-mono text-xs text-muted">{url}</span>
        <button className="btn-ghost ml-auto shrink-0 px-3 py-1 text-xs" onClick={() => copy('link', url)}>
          {copied === 'link' ? 'Copied!' : 'Copy link'}
        </button>
      </div>
    </div>
  )
}

function ShareButton({
  href,
  onClick,
  bg,
  fg,
  label,
  icon,
}: {
  href?: string
  onClick?: () => void
  bg: string
  fg: string
  label: string
  icon: ReactNode
}) {
  const className = 'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-transform hover:-translate-y-0.5'
  const style = { background: bg, color: fg }
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className} style={style}>
        {icon}
        {label}
      </a>
    )
  }
  return (
    <button type="button" onClick={onClick} className={className} style={style}>
      {icon}
      {label}
    </button>
  )
}

/* ── Brand glyphs (single-path, currentColor) ───────────────────────────── */
const S = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'currentColor' } as const
const WhatsAppIcon = () => (
  <svg {...S}><path d="M.06 24l1.68-6.13A11.87 11.87 0 1 1 12 24a11.9 11.9 0 0 1-5.7-1.45L.06 24zM6.6 20.2l.36.22a9.86 9.86 0 0 0 5.04 1.38 9.88 9.88 0 1 0-8.37-4.6l.24.38-1 3.65 3.73-.98zM18 14.3c-.1-.17-.37-.27-.77-.47s-2.35-1.16-2.71-1.29-.63-.2-.9.2-1.03 1.29-1.26 1.56-.46.3-.86.1a8.1 8.1 0 0 1-2.38-1.47 9 9 0 0 1-1.65-2.05c-.17-.3 0-.46.13-.64s.4-.46.6-.7a2.6 2.6 0 0 0 .4-.66.73.73 0 0 0 0-.7c-.1-.2-.9-2.17-1.24-2.97s-.65-.67-.9-.68h-.76a1.47 1.47 0 0 0-1.06.5A4.46 4.46 0 0 0 3 7.16a7.74 7.74 0 0 0 1.62 4.12 17.7 17.7 0 0 0 6.77 5.98c.94.4 1.68.65 2.25.83a5.45 5.45 0 0 0 2.49.16c.76-.12 2.35-.96 2.68-1.89s.33-1.72.23-1.89z" /></svg>
)
const FacebookIcon = () => (
  <svg {...S}><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" /></svg>
)
const InstagramIcon = () => (
  <svg {...S}><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.85 5.85 0 0 0-2.13 1.38A5.85 5.85 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.38 2.13a5.85 5.85 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.85 5.85 0 0 0 2.13-1.38 5.85 5.85 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.85 5.85 0 0 0-1.38-2.13A5.85 5.85 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zM12 16a4 4 0 1 1 4-4 4 4 0 0 1-4 4zm6.41-10.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z" /></svg>
)
const TikTokIcon = () => (
  <svg {...S}><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" /></svg>
)
const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" strokeLinecap="round" /></svg>
)
