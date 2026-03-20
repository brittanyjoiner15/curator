import Anthropic from '@anthropic-ai/sdk'

export async function analyzeContent({
  type,
  title,
  description,
  text,
  apiKey,
  categories,
}: {
  type: 'article' | 'youtube'
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
