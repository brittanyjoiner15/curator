'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

export function ShareViewTracker({ itemCount }: { itemCount: number }) {
  useEffect(() => {
    posthog.capture('shared_wishlist_viewed', { item_count: itemCount })
  }, [itemCount])

  return null
}
