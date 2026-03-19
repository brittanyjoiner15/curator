'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
      <section className="flex flex-col items-center text-center gap-6 pt-10">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight tracking-tight">
            You save it.<br />You never go back to it.
          </h1>
          <p className="text-lg text-gray-500 max-w-md mx-auto leading-relaxed">
            Stash saves any article or YouTube video, uses AI to categorize it and estimate how long it takes, then suggests what to read or watch based on your mood and available time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth?mode=signup"
            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors text-sm"
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
            You've got 40 open tabs. A graveyard of bookmarks. A Trello board labeled "read later" you haven't opened since last year. The content is good — you just never remember to go back to it.
          </p>
          <p className="text-gray-700 leading-relaxed mt-3">
            Stash is the place where saved content actually gets consumed.
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
              title: 'Drop a link',
              body: 'Paste any YouTube or article URL. Stash figures out the rest.',
            },
            {
              step: '2',
              title: 'AI does the work',
              body: "Claude reads the content, assigns topic tags, and estimates how long it'll take to read or watch.",
            },
            {
              step: '3',
              title: 'Read it when you\'re ready',
              body: 'Tell Stash how much time you have and what you\'re in the mood for. Get a suggestion. Actually go through it.',
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
            { icon: '🏷️', title: 'AI topic categories', body: 'Every item is automatically tagged with 2–5 topics so your library stays organized without any effort.' },
            { icon: '⏱️', title: 'Time estimates', body: 'Know if something is a 3-minute read or a 45-minute video before you click.' },
            { icon: '✨', title: '"Surprise me"', body: 'Pick a topic and how much time you have. Stash picks something from your library at random.' },
            { icon: '🔌', title: 'API for automations', body: 'Push URLs from any tool — Trello, Zapier, iOS Shortcuts, Pixiebrix — and Stash handles the rest.' },
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
            Already capturing links in Trello, Notion, or a custom workflow? Stash has an API.
            Push a URL, get back a fully categorized and timed entry in your library.
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
          Works with Zapier, Make, n8n, iOS Shortcuts, Pixiebrix, Raycast — anything that can make an HTTP request.
        </p>
      </section>

      {/* Bottom CTA */}
      <section className="flex flex-col items-center gap-4 text-center py-6 border-t border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900">Start building your library</h2>
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
