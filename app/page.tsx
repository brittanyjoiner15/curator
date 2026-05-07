'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.push('/library')
  }, [user, loading, router])

  if (loading) return null

  return (
    <div className="flex flex-col gap-20 pb-20">

      {/* Hero */}
      <section className="flex flex-col items-center text-center gap-6 pt-8">
        <Image
          src="/logo.png"
          alt="Stash"
          width={120}
          height={120}
          priority
          className="rounded-2xl shadow-lg shadow-violet-200/60"
        />
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight tracking-tight">
            Articles. Videos.<br />Books. Shows. Movies.<br />
            <span className="text-violet-600">One stash.</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-lg mx-auto leading-relaxed">
            The internet is overflowing with stuff you want to get to. Stash holds it all in one place, lets AI sort it for you, then tells you what to read, watch, or pick up next based on how much time you have.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth?mode=signup"
            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors text-sm shadow-sm"
          >
            Get started free
          </Link>
          <Link
            href="/auth"
            className="px-6 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors text-sm"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Problem */}
      <section className="flex flex-col gap-4">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
          <p className="text-sm font-semibold text-amber-700 mb-2 uppercase tracking-wide">Sound familiar?</p>
          <p className="text-gray-700 leading-relaxed">
            40 open tabs. A graveyard of bookmarks. A book list you abandoned in 2022. A Netflix watchlist 80 titles deep. The "save for later" pile keeps growing. The "actually got to it" pile does not.
          </p>
          <p className="text-gray-700 leading-relaxed mt-3 font-medium">
            Stash is where saved stuff actually gets consumed.
          </p>
        </div>
      </section>

      {/* What you can save */}
      <section className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Save anything worth coming back to</h2>
          <p className="text-sm text-gray-500 mt-1">One library for everything, not five different apps.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: '📰', title: 'Articles', body: 'Paste any URL. Stash pulls the title, summarizes the content, and estimates read time.' },
            { icon: '📺', title: 'YouTube videos', body: 'Drop a link. Stash grabs the duration and tags the topic so you can find it later.' },
            { icon: '📚', title: 'Books', body: 'Add a book by title or ISBN. Track what you want to read, what you are reading, and what you finished.' },
            { icon: '🎬', title: 'TV & movies', body: 'Build a watchlist your future self will actually use. Filter by runtime when you only have 22 minutes.' },
          ].map(({ icon, title, body }) => (
            <div key={title} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-1.5 shadow-sm">
              <p className="text-xl">{icon}</p>
              <p className="font-semibold text-gray-900 text-sm">{title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Hardcover integration */}
      <section className="flex flex-col gap-4">
        <div className="bg-gradient-to-br from-violet-50 to-orange-50 border border-violet-100 rounded-2xl p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-violet-700 uppercase tracking-wide bg-violet-100 px-2 py-0.5 rounded-full">Integration</span>
            <span className="text-xs font-semibold text-gray-500">Hardcover</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Save a book to Stash, save it to Hardcover too.</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Connect your Hardcover account and every book you stash gets added to your Hardcover library automatically. No double entry, no copying ISBNs back and forth. Track your reading where you already track it, and let Stash handle the queue.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="flex flex-col gap-6">
        <h2 className="text-xl font-bold text-gray-900">How it works</h2>
        <div className="flex flex-col gap-4">
          {[
            {
              step: '1',
              title: 'Drop it in',
              body: 'Paste a link, type a book title, or push something to your list via the API.',
            },
            {
              step: '2',
              title: 'AI does the boring part',
              body: 'Claude reads the content, assigns topic tags, and estimates how long it will take to get through.',
            },
            {
              step: '3',
              title: 'Surprise me',
              body: 'Tell Stash how much time you have and what you are in the mood for. Get a recommendation. Actually do it.',
            },
          ].map(({ step, title, body }) => (
            <div key={step} className="flex gap-4 items-start">
              <div className="shrink-0 w-8 h-8 rounded-full bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center">
                {step}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{title}</p>
                <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="flex flex-col gap-6">
        <h2 className="text-xl font-bold text-gray-900">What you get</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: '🏷️', title: 'AI topic tags', body: 'Every item is auto-tagged with 2 to 5 topics so your library stays organized with zero effort.' },
            { icon: '⏱️', title: 'Time estimates', body: 'Know if something is a 3-minute read, a 45-minute video, or a 10-hour book before you commit.' },
            { icon: '✨', title: '"Surprise me"', body: 'Pick a topic and how much time you have. Stash picks something from your library at random.' },
            { icon: '📖', title: 'Hardcover sync', body: 'Books you save in Stash get pushed to your Hardcover library automatically.' },
          ].map(({ icon, title, body }) => (
            <div key={title} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-1.5 shadow-sm">
              <p className="text-xl">{icon}</p>
              <p className="font-semibold text-gray-900 text-sm">{title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* API callout */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Works with your existing tools</h2>
          <p className="text-sm text-gray-500 mt-1">
            Already capturing links in Trello, Notion, or a custom workflow? Stash has an API. Push a URL, get back a fully categorized and timed entry in your library.
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 text-xs font-mono text-gray-300 leading-relaxed overflow-x-auto">
          <span className="text-gray-500"># Push any URL to your Stash library</span><br />
          curl -X POST https://stashcurator.com/api/content \<br />
          {'  '}<span className="text-violet-400">-H</span> <span className="text-emerald-400">"x-api-token: your_token"</span> \<br />
          {'  '}<span className="text-violet-400">-H</span> <span className="text-emerald-400">"Content-Type: application/json"</span> \<br />
          {'  '}<span className="text-violet-400">-d</span> <span className="text-emerald-400">'{"{"}"url": "https://..."{"}"}'</span>
        </div>
        <p className="text-xs text-gray-400">
          Works with Zapier, Make, n8n, iOS Shortcuts, Pixiebrix, Raycast, anything that can make an HTTP request.
        </p>
      </section>

      {/* Bottom CTA */}
      <section className="flex flex-col items-center gap-4 text-center py-6 border-t border-gray-100">
        <Image src="/logo.png" alt="Stash" width={56} height={56} className="rounded-xl" />
        <h2 className="text-2xl font-bold text-gray-900">Start building your stash</h2>
        <p className="text-sm text-gray-500">Free to use. Bring your own Anthropic API key.</p>
        <Link
          href="/auth?mode=signup"
          className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors"
        >
          Get started free →
        </Link>
      </section>

    </div>
  )
}
