import { create } from 'zustand'
import { extractPolygonsFromGeoJson } from '@/lib/geo'

type NoahAnalysisStatus = 'idle' | 'loading' | 'ready' | 'error'

interface NoahFloodStore {
  visible: boolean
  analysisStatus: NoahAnalysisStatus
  var3PolygonCount: number
  var2PolygonCount: number
  var1PolygonCount: number
  var3Polygons: Array<Array<{ lat: number; lng: number }>>
  var2Polygons: Array<Array<{ lat: number; lng: number }>>
  var1Polygons: Array<Array<{ lat: number; lng: number }>>
  setVisible: (visible: boolean) => void
  ensureAnalysisLoaded: () => Promise<void>
}

async function loadFloodGeoJson(path: string) {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`Failed to load ${path} (${response.status})`)
  }

  return response.json()
}

export const useNoahFloodStore = create<NoahFloodStore>((set, get) => ({
  visible: false,
  analysisStatus: 'idle',
  var3PolygonCount: 0,
  var2PolygonCount: 0,
  var1PolygonCount: 0,
  var3Polygons: [],
  var2Polygons: [],
  var1Polygons: [],

  setVisible: (visible) => set({ visible }),

  ensureAnalysisLoaded: async () => {
    const { analysisStatus, var3Polygons, var2Polygons } = get()
    if (analysisStatus === 'loading' || (var3Polygons.length > 0 && var2Polygons.length > 0)) return

    set({ analysisStatus: 'loading' })

    try {
      const [var3GeoJson, var2GeoJson, var1GeoJson] = await Promise.all([
        loadFloodGeoJson('/data/flood_var3_analysis.geojson'),
        loadFloodGeoJson('/data/flood_var2_analysis.geojson'),
        loadFloodGeoJson('/data/flood_var1_analysis.geojson').catch((error) => {
          console.warn('[LIGTAS] Optional Var 1 flood analysis load skipped:', error)
          return null
        }),
      ])

      const extractedVar3Polygons = extractPolygonsFromGeoJson(var3GeoJson)
      const extractedVar2Polygons = extractPolygonsFromGeoJson(var2GeoJson)
      const extractedVar1Polygons = var1GeoJson ? extractPolygonsFromGeoJson(var1GeoJson) : []

      set({
        var3Polygons: extractedVar3Polygons,
        var2Polygons: extractedVar2Polygons,
        var1Polygons: extractedVar1Polygons,
        var3PolygonCount: extractedVar3Polygons.length,
        var2PolygonCount: extractedVar2Polygons.length,
        var1PolygonCount: extractedVar1Polygons.length,
        analysisStatus: 'ready',
      })
    } catch (error) {
      console.error('[LIGTAS] NOAH flood analysis load failed:', error)
      set({ analysisStatus: 'error' })
    }
  },
}))
