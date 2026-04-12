import 'server-only'

export async function maybeGenerateGeminiJson<T>(input: {
  prompt: string
  schema: object
}): Promise<T | null> {
  const apiKey = process.env.GEMINI_API_KEY
  const model = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash'

  if (!apiKey) return null

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: input.prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: input.schema,
        },
      }),
      cache: 'no-store',
    },
  )

  if (!response.ok) return null

  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) return null

  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}
