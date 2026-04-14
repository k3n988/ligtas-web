import { create } from 'zustand'
import { extractPolygonsFromGeoJson } from '@/lib/geo'

type NoahAnalysisStatus = 'idle' | 'loading' | 'ready' | 'error'

interface NoahFloodStore {
  visible: boolean
  analysisStatus: NoahAnalysisStatus
  var3PolygonCount: number
  var2PolygonCount: number
  var3Polygons: Array<Array<{ lat: number; lng: number }>>
  var2Polygons: Array<Array<{ lat: number; lng: number }>>
  setVisible: (visible: boolean) => void
  ensureAnalysisLoaded: () => Promise<void>
}

export const useNoahFloodStore = create<NoahFloodStore>((set, get) => ({
  visible: false,
  analysisStatus: 'idle',
  var3PolygonCount: 0,
  var2PolygonCount: 0,
  var3Polygons: [],
  var2Polygons: [],

  setVisible: (visible) => set({ visible }),

  ensureAnalysisLoaded: async () => {
    const { analysisStatus, var3Polygons, var2Polygons } = get()
    if (analysisStatus === 'loading' || (var3Polygons.length > 0 && var2Polygons.length > 0)) return

    set({ analysisStatus: 'loading' })

    try {
      const [var3Response, var2Response] = await Promise.all([
        fetch('/data/flood_var3_analysis.geojson'),
        fetch('/data/flood_var2_analysis.geojson'),
      ])

      if (!var3Response.ok) {
        throw new Error(`Failed to load flood_var3_analysis.geojson (${var3Response.status})`)
      }
      if (!var2Response.ok) {
        throw new Error(`Failed to load flood_var2_analysis.geojson (${var2Response.status})`)
      }

      const [var3GeoJson, var2GeoJson] = await Promise.all([
        var3Response.json(),
        var2Response.json(),
      ])

      const extractedVar3Polygons = extractPolygonsFromGeoJson(var3GeoJson)
      const extractedVar2Polygons = extractPolygonsFromGeoJson(var2GeoJson)

      set({
        var3Polygons: extractedVar3Polygons,
        var2Polygons: extractedVar2Polygons,
        var3PolygonCount: extractedVar3Polygons.length,
        var2PolygonCount: extractedVar2Polygons.length,
        analysisStatus: 'ready',
      })
    } catch (error) {
      console.error('[LIGTAS] NOAH flood analysis load failed:', error)
      set({ analysisStatus: 'error' })
    }
  },
}))
