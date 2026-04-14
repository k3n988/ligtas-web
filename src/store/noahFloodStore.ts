import { create } from 'zustand'
import { extractPolygonsFromGeoJson } from '@/lib/geo'

type NoahAnalysisStatus = 'idle' | 'loading' | 'ready' | 'error'

interface NoahFloodStore {
  visible: boolean
  analysisStatus: NoahAnalysisStatus
  analysisError: string | null
  var3PolygonCount: number
  var2PolygonCount: number
  var1PolygonCount: number
  var3Polygons: Array<Array<{ lat: number; lng: number }>>
  var2Polygons: Array<Array<{ lat: number; lng: number }>>
  var1Polygons: Array<Array<{ lat: number; lng: number }>>
  setVisible: (visible: boolean) => void
  ensureAnalysisLoaded: () => Promise<void>
}

async function fetchGeoJson(path: string) {
  const response = await fetch(path)
  if (!response.ok) throw new Error(`HTTP ${response.status} loading ${path}`)

  const text = await response.text()

  // Detect Git LFS pointer — actual data not downloaded yet
  if (text.startsWith('version https://git-lfs')) {
    throw new Error(
      `${path} is a Git LFS pointer. Run "git lfs pull" in the project root to download the flood data.`,
    )
  }

  return JSON.parse(text)
}

export const useNoahFloodStore = create<NoahFloodStore>((set, get) => ({
  visible: false,
  analysisStatus: 'idle',
  analysisError: null,
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

    set({ analysisStatus: 'loading', analysisError: null })

    try {
      const [var3GeoJson, var2GeoJson, var1GeoJson] = await Promise.all([
        fetchGeoJson('/data/flood_var3_analysis.geojson'),
        fetchGeoJson('/data/flood_var2_analysis.geojson'),
        fetchGeoJson('/data/flood_var1_analysis.geojson').catch((err) => {
          console.warn('[LIGTAS] Optional Var1 layer skipped:', err.message)
          return null
        }),
      ])

      const var3Polys = extractPolygonsFromGeoJson(var3GeoJson)
      const var2Polys = extractPolygonsFromGeoJson(var2GeoJson)
      const var1Polys = var1GeoJson ? extractPolygonsFromGeoJson(var1GeoJson) : []

      set({
        var3Polygons:     var3Polys,
        var2Polygons:     var2Polys,
        var1Polygons:     var1Polys,
        var3PolygonCount: var3Polys.length,
        var2PolygonCount: var2Polys.length,
        var1PolygonCount: var1Polys.length,
        analysisStatus:   'ready',
        analysisError:    null,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('[LIGTAS] NOAH flood analysis load failed:', message)
      set({ analysisStatus: 'error', analysisError: message })
    }
  },
}))
