import { NextRequest, NextResponse } from 'next/server'
import { buildAssetRecommendation } from '@/lib/ai/advisories'
import type { Asset, FloodZone, HazardEvent, Household } from '@/types'

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    household: Household
    assets: Asset[]
    hazard?: HazardEvent | null
    floodZones?: FloodZone[]
  }

  return NextResponse.json(
    buildAssetRecommendation({
      household: body.household,
      assets: body.assets,
      hazard: body.hazard ?? null,
      floodZones: body.floodZones ?? [],
    }),
  )
}
