import { useEffect, useRef, useState } from 'react'
import { api } from '@/shared/lib/api'
import type { AddressSuggestion } from '@/shared/lib/types'
import { Spinner } from './ui'

interface Props {
  /** Controlled text value (also kept editable for manual entry). */
  value: string
  onChange: (value: string) => void
  /** Restrict results to a country — name ("Canada") or ISO code. Changing it re-scopes results. */
  country?: string
  /** Geoapify location type, e.g. "city". Omit for full addresses. */
  type?: 'city'
  /** Maps a chosen suggestion to the stored field value (e.g. its city, or the formatted address). */
  pick?: (s: AddressSuggestion) => string
  label?: string
  placeholder?: string
  className?: string
}

const DEBOUNCE_MS = 350
const MIN_CHARS = 2

/**
 * Debounced, country-scoped autocomplete field backed by the Geoapify proxy — a controlled-input
 * sibling of {@link AddressAutocomplete} for single-value fields (city pickers, location lookups).
 * Degrades to a plain text input when autocomplete is unconfigured (results just stay empty).
 */
export default function SuggestField({
  value, onChange, country, type, pick, label, placeholder, className = '',
}: Props) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [typing, setTyping] = useState(false)
  const requestId = useRef(0)

  useEffect(() => {
    if (!typing) return // only search in response to user input, not external value/country resets
    const text = value.trim()
    if (text.length < MIN_CHARS) {
      setSuggestions([])
      setLoading(false)
      return
    }
    setLoading(true)
    const id = ++requestId.current
    const handle = setTimeout(() => {
      api
        .addressAutocomplete(text, country, type)
        .then((res) => {
          if (id !== requestId.current) return
          setSuggestions(res)
          setOpen(true)
        })
        .catch(() => { if (id === requestId.current) setSuggestions([]) })
        .finally(() => { if (id === requestId.current) setLoading(false) })
    }, DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [value, country, type, typing])

  const choose = (s: AddressSuggestion) => {
    onChange(pick ? pick(s) : (s.formatted ?? ''))
    setSuggestions([])
    setOpen(false)
    setTyping(false)
  }

  return (
    <div className={`relative ${className}`}>
      {label && <label className="label">{label}</label>}
      <div className="relative">
        <input
          className="field"
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => { setTyping(true); onChange(e.target.value) }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {loading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"><Spinner /></span>}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-line bg-cream py-1 shadow-card">
          {suggestions.map((s, i) => (
            <li key={`${s.formatted}-${i}`}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); choose(s) }}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-sand/60"
              >
                {type === 'city' ? (s.city || s.formatted) : s.formatted}
                {type === 'city' && s.state && <span className="text-muted"> · {s.state}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
