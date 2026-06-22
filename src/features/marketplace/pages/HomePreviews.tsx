import { Link } from 'react-router-dom'

/**
 * Tiny gallery that links to every home-page design experiment, so the
 * variants can be reviewed side by side. Mounted at `/previews`.
 */
const VARIANTS = [
  { to: '/preview', name: 'KojoForex', mood: 'Dark · gold · stats-led, high-energy premium', sw: ['#0A0A0B', '#E0B23C', '#ffffff'] },
  { to: '/preview/apple', name: 'Apple', mood: 'Light · airy · product-tile minimalism', sw: ['#f5f5f7', '#1d1d1f', '#0066cc'] },
  { to: '/preview/stripe', name: 'Stripe', mood: 'Angled gradient hero · developer platform', sw: ['#635bff', '#0a2540', '#2bd4d9'] },
  { to: '/preview/linear', name: 'Linear', mood: 'Near-black · indigo glow · refined product OS', sw: ['#08090a', '#5e6ad2', '#b794f6'] },
  { to: '/preview/airbnb', name: 'Airbnb', mood: 'Warm · coral · search pill & listing cards', sw: ['#ffffff', '#FF385C', '#222222'] },
]

export default function HomePreviews() {
  return (
    <div className="min-h-screen bg-[#0c0c0d] px-6 py-16 text-white" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/40">Orderlynk · home page</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Design experiments</h1>
        <p className="mt-3 text-white/55">Five reference styles, same content. Open each to compare.</p>

        <div className="mt-10 grid gap-4">
          {VARIANTS.map((v) => (
            <Link
              key={v.to}
              to={v.to}
              className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:-translate-y-0.5 hover:border-white/25"
            >
              <div className="flex items-center gap-4">
                <div className="flex">
                  {v.sw.map((c, i) => (
                    <span key={i} className="h-9 w-9 rounded-full border-2 border-[#0c0c0d]" style={{ background: c, marginLeft: i ? -10 : 0 }} />
                  ))}
                </div>
                <div>
                  <p className="text-lg font-semibold">{v.name}</p>
                  <p className="text-sm text-white/50">{v.mood}</p>
                </div>
              </div>
              <span className="text-white/40 transition-transform group-hover:translate-x-1">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
