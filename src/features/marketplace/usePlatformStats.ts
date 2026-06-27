import { useEffect, useState } from 'react'
import { api } from '@/shared/lib/api'

/** One tile in the home-page stats strip. */
export interface StatTile {
  value: string
  label: string
}

/**
 * Marketing placeholders shown only while the live numbers load (and if the
 * stats endpoint is unreachable). Once `/api/platform/stats` resolves these are
 * replaced by the real platform figures.
 */
const FALLBACK: StatTile[] = [
  { value: '12,400+', label: 'Orders processed' },
  { value: '450+', label: 'Verified vendors' },
  { value: '38', label: 'Cities served' },
  { value: '99.2%', label: 'On-time fulfillment' },
]

const fmt = (n: number) => n.toLocaleString('en-US')

/**
 * Loads platform-wide headline numbers and shapes them into the four stat tiles
 * the home page renders. Returns marketing fallbacks until the request resolves.
 */
export function usePlatformStats(): StatTile[] {
  const [tiles, setTiles] = useState<StatTile[]>(FALLBACK)

  useEffect(() => {
    let alive = true
    api
      .platformStats()
      .then((s) => {
        if (!alive) return
        setTiles([
          {
            value: `${fmt(s.ordersProcessed)}${s.ordersProcessed >= 1000 ? '+' : ''}`,
            label: 'Orders processed',
          },
          {
            value: `${fmt(s.verifiedVendors)}${s.verifiedVendors >= 100 ? '+' : ''}`,
            label: 'Verified vendors',
          },
          { value: fmt(s.citiesServed), label: 'Cities served' },
          { value: `${s.fulfillmentRate.toFixed(1)}%`, label: 'On-time fulfillment' },
        ])
      })
      .catch(() => {
        /* keep the fallback tiles if the stats endpoint is unavailable */
      })
    return () => {
      alive = false
    }
  }, [])

  return tiles
}
