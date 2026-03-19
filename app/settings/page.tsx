'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const { user, session, loading, signOut } = useAuth()
  const router = useRouter()

  const [hasKey, setHasKey] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/auth')
  }, [user, loading, router])

  useEffect(() => {
    if (!session) return
    fetch('/api/settings', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(data => {
        setHasKey(data.has_anthropic_key)
        setApiToken(data.api_token ?? '')
        setSettingsLoading(false)
      })
  }, [session])

  async function saveKey() {
    if (!session || !newKey.trim()) return
    setSaving(true)
    setSaveMessage(null)
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ anthropic_api_key: newKey }),
    })
    if (res.ok) {
      setHasKey(true)
      setNewKey('')
      setSaveMessage('Key saved!')
    } else {
      setSaveMessage('Failed to save.')
    }
    setSaving(false)
  }

  async function regenerateToken() {
    if (!session) return
    setRegenerating(true)
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ regenerate_token: true }),
    })
    const data = await res.json()
    if (data.api_token) setApiToken(data.api_token)
    setRegenerating(false)
  }

  async function copyToken() {
    await navigator.clipboard.writeText(apiToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading || settingsLoading) {
    return <div className="flex flex-col gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
  }

  if (!user) return null

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <button onClick={signOut} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          Sign out
        </button>
      </div>

      <p className="text-sm text-gray-500 -mt-4">{user.email}</p>

      {/* Anthropic API key */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">Anthropic API key</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Used to categorize your content with Claude.{' '}
            {hasKey && <span className="text-emerald-600 font-medium">Key is set ✓</span>}
          </p>
        </div>
        <input
          type="password"
          value={newKey}
          onChange={e => setNewKey(e.target.value)}
          placeholder={hasKey ? 'Enter new key to replace…' : 'sk-ant-…'}
          className="px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 font-mono"
        />
        {saveMessage && <p className="text-sm text-emerald-600">{saveMessage}</p>}
        <button
          onClick={saveKey}
          disabled={saving || !newKey.trim()}
          className="self-start px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save key'}
        </button>
      </section>

      {/* Personal API token */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">Your API token</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Use this to push content from external tools and automations.
          </p>
        </div>
        <div className="flex gap-2">
          <code className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-xs font-mono break-all select-all">
            {apiToken}
          </code>
          <button
            onClick={copyToken}
            className="shrink-0 px-3 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors"
          >
            {copied ? '✓' : 'Copy'}
          </button>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 font-mono">
          {`curl -X POST https://curator-omega.vercel.app/api/content \\`}<br />
          {`  -H "x-api-token: ${apiToken.slice(0, 8)}…" \\`}<br />
          {`  -H "Content-Type: application/json" \\`}<br />
          {`  -d '{"url": "https://..."}'`}
        </div>
        <button
          onClick={regenerateToken}
          disabled={regenerating}
          className="self-start text-sm text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
        >
          {regenerating ? 'Regenerating…' : 'Regenerate token'}
        </button>
      </section>
    </div>
  )
}
