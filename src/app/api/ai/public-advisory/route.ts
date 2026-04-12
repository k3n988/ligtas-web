import { NextRequest, NextResponse } from 'next/server'
import { buildPublicAdvisory, type PublicAdvisoryResult } from '@/lib/ai/advisories'
import { maybeGenerateGeminiJson } from '@/lib/ai/gemini'
import type { HazardEvent, Vulnerability } from '@/types'

const advisorySchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    summary: { type: 'string' },
    actions: {
      type: 'array',
      items: { type: 'string' },
    },
    severity: {
      type: 'string',
      enum: ['normal', 'monitoring', 'warning', 'critical'],
    },
  },
  required: ['title', 'summary', 'actions', 'severity'],
} as const

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    city?: string
    barangay?: string
    coords?: { lat: number; lng: number } | null
    hazard?: HazardEvent | null
    vulnerabilities?: Vulnerability[]
  }

  const fallback = buildPublicAdvisory({
    hazard: body.hazard ?? null,
    city: body.city,
    barangay: body.barangay,
    coords: body.coords,
    vulnerabilities: body.vulnerabilities,
  })

  const hazardType = body.hazard?.type ?? 'hazard'
  const prompt = [
    'You are generating a concise Philippine disaster advisory for a public map banner.',
    `Location: ${[body.barangay, body.city].filter(Boolean).join(', ') || 'Unknown area'}.`,
    `Hazard: ${hazardType}.`,
    `Fallback summary: ${fallback.summary}`,
    `Actions to preserve or improve: ${fallback.actions.join('; ')}`,
    'Keep the response localized, calm, and actionable. Avoid jargon. Use 3 short action items.',
  ].join('\n')

  const gemini = await maybeGenerateGeminiJson<Omit<PublicAdvisoryResult, 'source'>>({
    prompt,
    schema: advisorySchema,
  })

  return NextResponse.json(
    gemini
      ? { ...gemini, source: 'gemini' }
      : fallback,
  )
}
