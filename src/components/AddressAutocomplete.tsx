import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import type { Address, AddressSuggestion } from '../lib/types'
import { Spinner } from './ui'

interface Props {
  /** Restrict results to a country — accepts a name ("Canada") or ISO code ("CA"). */
  country?: string
  /** Called with the structured parts when the user picks a suggestion. */
  onSelect: (address: Address) => void
  label?: string
  placeholder?: string
}

const DEBOUNCE_MS = 350
const MIN_CHARS = 3

/**
 * Debounced address search backed by the server-side Geoapify proxy. Purely additive: picking a
 * suggestion fills the form's address fields via {@link Props.onSelect}; the existing manual inputs
 * stay editable and the field degrades to a no-op if autocomplete is unconfigured.
 */
export default function AddressAutocomplete({ country, onSelect, label = 'Search for your address', placeholder = 'Start typing an address…' }: Props) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  // Guards against out-of-order responses overwriting newer results.
  const requestId = useRef(0)

  useEffect(() => {
    const text = query.trim()
    if (text.length < MIN_CHARS) {
      setSuggestions([])
      setLoading(false)
      return
    }
    setLoading(true)
    const id = ++requestId.current
    const handle = setTimeout(() => {
      api
        .addressAutocomplete(text, country)
        .then((res) => {
          if (id !== requestId.current) return // a newer keystroke superseded this one
          setSuggestions(res)
          setOpen(true)
        })
        .catch(() => {
          if (id === requestId.current) setSuggestions([])
        })
        .finally(() => {
          if (id === requestId.current) setLoading(false)
        })
    }, DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [query, country])

  const choose = (s: AddressSuggestion) => {
    onSelect({
      houseNumber: s.houseNumber ?? '',
      street: s.street ?? '',
      city: s.city ?? '',
      state: s.state ?? '',
      postcode: s.postcode ?? '',
      country: s.country ?? country ?? '',
    })
    setQuery(s.formatted)
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div className="relative">
      {label && <label className="label">{label}</label>}
      <div className="relative">
        <input
          className="field"
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          // Delay close so a click on a suggestion (which blurs the input) still registers.
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
            <Spinner />
          </span>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-line bg-cream py-1 shadow-card">
          {suggestions.map((s, i) => (
            <li key={`${s.formatted}-${i}`}>
              <button
                type="button"
                // onMouseDown fires before the input's onBlur, so the selection isn't lost.
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose(s)
                }}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-sand/60"
              >
                {s.formatted}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}