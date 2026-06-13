import { request } from '@/shared/lib/http'
import type { AddressSuggestion } from '@/shared/lib/types'

/** Cross-cutting meta endpoints (option sets, address autocomplete). */
export const metaApi = {
  optionSets: () => request<Record<string, string[]>>('GET', '/api/meta/option-sets'),
  // Address autocomplete (proxied to Geoapify). `country` accepts a name ("Canada") or ISO code;
  // `type` restricts results to a location kind (e.g. "city") for country-scoped pickers.
  addressAutocomplete: (text: string, country?: string, type?: string) => {
    const qs = new URLSearchParams({ text })
    if (country) qs.set('country', country)
    if (type) qs.set('type', type)
    return request<AddressSuggestion[]>('GET', `/api/meta/address/autocomplete?${qs.toString()}`)
  },
}
