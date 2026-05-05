import Anthropic from '@anthropic-ai/sdk'

export async function analyzeContent({
  type,
  title,
  description,
  text,
  apiKey,
  categories,
}: {
  type: 'article' | 'youtube' | 'video'
  title: string
  description: string
  text?: string
  apiKey: string
  categories?: string[]
}): Promise<{ topics: string[] }> {
  const client = new Anthropic({ apiKey })

  const hasCategories = categories && categories.length > 0

  const prompt = hasCategories
    ? `Categorize this ${type} by choosing from the list below. Return ONLY a JSON object — no explanation, no markdown.

Title: ${title}
Description: ${description.slice(0, 500)}${text ? `\nExcerpt: ${text.slice(0, 1000)}` : ''}

Available categories: ${categories.join(', ')}

Return exactly:
{"topics": ["category1", "category2"]}

Rules:
- Only use categories from the list above
- Choose 1–3 that best fit
- Use the exact category names as given`
    : `Categorize this ${type} and return ONLY a JSON object — no explanation, no markdown.

Title: ${title}
Description: ${description.slice(0, 500)}${text ? `\nExcerpt: ${text.slice(0, 1000)}` : ''}

Return exactly:
{"topics": ["topic1", "topic2"]}

Rules:
- 2–5 topics
- Lowercase, concise (single words or short phrases)
- Good examples: "programming", "machine learning", "productivity", "science", "history", "design", "psychology", "finance", "cooking", "health", "philosophy", "business"`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected Claude response type')

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in Claude response')

  return JSON.parse(jsonMatch[0])
}

export async function classifyUrl({
  title,
  description,
  apiKey,
}: {
  title: string
  description: string
  apiKey: string
}): Promise<{ type: 'content' | 'product' }> {
  const client = new Anthropic({ apiKey })

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 32,
    messages: [
      {
        role: 'user',
        content: `Is this a product page (something to buy) or content (article/video to read/watch)?

Title: ${title}
Description: ${description.slice(0, 200)}

Return exactly: {"type": "product"} or {"type": "content"}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') return { type: 'content' }
  const match = content.text.match(/\{[\s\S]*\}/)
  if (!match) return { type: 'content' }
  const result = JSON.parse(match[0])
  return { type: result.type === 'product' ? 'product' : 'content' }
}

export async function analyzeProduct({
  title,
  description,
  apiKey,
  categories,
}: {
  title: string
  description: string
  apiKey: string
  categories: string[]
}): Promise<{ category: string }> {
  const client = new Anthropic({ apiKey })

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 64,
    messages: [
      {
        role: 'user',
        content: `Pick the single best category for this product. Return ONLY a JSON object — no explanation.

Title: ${title}
Description: ${description.slice(0, 300)}

Categories: ${categories.join(', ')}

Return exactly: {"category": "category_name"}
Use the exact name as given.`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response')
  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in response')
  return JSON.parse(jsonMatch[0])
}
