import { useMemo } from 'react'
import { buildFeed, derive, type DecoratedFeed, type Derived } from './selectors'
import { useStore } from './store'

/** Computed view of the signed-in user's state. Null when signed out. */
export function useDerived(): Derived | null {
  const { account, data, community } = useStore()
  return useMemo(
    () => (account && data ? derive(account, data, Date.now(), community ?? undefined) : null),
    [account, data, community],
  )
}

/** The merged, decorated community feed (own events + ambient community). */
export function useFeed(): DecoratedFeed[] {
  const { data } = useStore()
  return useMemo(() => (data ? buildFeed(data, Date.now()) : []), [data])
}
