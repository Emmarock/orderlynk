import { useCallback, useEffect, useRef, useState } from 'react'
import { apiMessage } from '@/shared/lib/http'
import type { Page } from '@/shared/lib/types'

/** Default page size for "load more" lists; matches the backend default. */
export const PAGE_SIZE = 20

export interface PagedList<T> {
  /** All rows fetched so far (page 0 … current page, appended). */
  items: T[]
  /** Total matching rows server-side (for "Showing X of N"). */
  total: number
  /** True while the first page is loading (drives the full-page spinner). */
  loading: boolean
  /** True while a subsequent page is loading (drives the "Load more" button). */
  loadingMore: boolean
  error: string | null
  hasNext: boolean
  loadMore: () => void
  /** Re-fetch from page 0, discarding what's shown (e.g. after a mutation). */
  reload: () => void
  /** Replace the loaded rows locally without a re-fetch (optimistic updates). */
  setItems: (update: (prev: T[]) => T[]) => void
}

/**
 * Append-style pagination for "load more" lists. `fetchPage` is called with the zero-based page
 * index and size; its `Page<T>` envelope drives the running total and whether more remain. Pass the
 * filter values the fetch depends on in `deps` — changing any of them resets back to page 0.
 *
 * `fetchPage` is read through a ref, so it can be an inline arrow that closes over current filter
 * state without being listed in `deps` (only the filter *values* belong there).
 */
export function usePagedList<T>(
  fetchPage: (page: number, size: number) => Promise<Page<T>>,
  deps: unknown[] = [],
  size: number = PAGE_SIZE,
): PagedList<T> {
  const [items, setItemsState] = useState<T[]>([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRef = useRef(fetchPage)
  fetchRef.current = fetchPage

  const fetchInto = useCallback(
    (p: number, append: boolean) => {
      if (append) setLoadingMore(true)
      else setLoading(true)
      setError(null)
      fetchRef
        .current(p, size)
        .then((res) => {
          setItemsState((prev) => (append ? [...prev, ...res.content] : res.content))
          setTotal(res.totalElements)
          setHasNext(res.hasNext)
          setPage(res.page)
        })
        .catch((e) => {
          setError(apiMessage(e, 'Could not load this list'))
          if (!append) {
            setItemsState([])
            setTotal(0)
            setHasNext(false)
          }
        })
        .finally(() => {
          setLoading(false)
          setLoadingMore(false)
        })
    },
    [size],
  )

  // Reset to page 0 whenever a filter value changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => fetchInto(0, false), deps)

  const loadMore = useCallback(() => {
    if (hasNext && !loadingMore) fetchInto(page + 1, true)
  }, [hasNext, loadingMore, page, fetchInto])

  const reload = useCallback(() => fetchInto(0, false), [fetchInto])

  const setItems = useCallback((update: (prev: T[]) => T[]) => setItemsState(update), [])

  return { items, total, loading, loadingMore, error, hasNext, loadMore, reload, setItems }
}
