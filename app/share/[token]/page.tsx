import { createServiceClient } from '@/lib/supabase'
import { WishlistCard } from '@/components/WishlistCard'
import { WishlistItem } from '@/types'

export default async function PublicWishlistPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = createServiceClient()

  const { data: settings } = await supabase
    .from('user_settings')
    .select('user_id')
    .eq('wishlist_share_token', token)
    .single()

  if (!settings) {
    return (
      <div className="text-center py-24 text-gray-400">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-sm">This wishlist link isn't valid.</p>
      </div>
    )
  }

  const { data: items } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('user_id', settings.user_id)
    .eq('purchased', false)
    .order('created_at', { ascending: false })

  const list = (items ?? []) as WishlistItem[]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Wishlist</h1>
        <p className="text-sm text-gray-500">
          {list.length === 0 ? 'Nothing here yet.' : `${list.length} item${list.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {list.length > 0 && (
        <div className="flex flex-col gap-3">
          {list.map(item => (
            <WishlistCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
