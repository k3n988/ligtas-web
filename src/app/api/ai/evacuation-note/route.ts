import { NextRequest, NextResponse } from 'next/server'
import { buildEvacuationNote } from '@/lib/ai/advisories'
import type { FloodZone, HazardEvent, Household } from '@/types'

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    household: Household
    hazard?: HazardEvent | null
    floodZones?: FloodZone[]
  }

  return NextResponse.json(
    buildEvacuationNote({
      household: body.household,
      hazard: body.hazard ?? null,
      floodZones: body.floodZones ?? [],
    }),
  )
}
