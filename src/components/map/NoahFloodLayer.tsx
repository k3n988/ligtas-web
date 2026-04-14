'use client'

import { useEffect, useRef } from 'react'
import { useMap } from '@vis.gl/react-google-maps'

type NoahLayerStatus = 'idle' | 'loading' | 'ready'

interface Props {
  visible: boolean
  onStatusChange?: (status: NoahLayerStatus) => void
  onFeatureCountChange?: (count: number) => void
}

interface BandConfig {
  path: string
  fillColor: string
  strokeColor: string
  fillOpacity: number
  strokeOpacity: number
  zIndex: number
  label: string
}

const BANDS: BandConfig[] = [
  {
    path:         '/data/flood_var3_analysis.geojson',
    fillColor:    '#ff4d4d',
    strokeColor:  '#c0392b',
    fillOpacity:  0.34,
    strokeOpacity: 0.5,
    zIndex:       8,
    label:        'High Flood Susceptibility',
  },
  {
    path:         '/data/flood_var2_analysis.geojson',
    fillColor:    '#f39c12',
    strokeColor:  '#d68910',
    fillOpacity:  0.26,
    strokeOpacity: 0.42,
    zIndex:       7,
    label:        'Moderate Flood Susceptibility',
  },
  {
    path:         '/data/flood_var1_analysis.geojson',
    fillColor:    '#f1c40f',
    strokeColor:  '#b7950b',
    fillOpacity:  0.2,
    strokeOpacity: 0.34,
    zIndex:       6,
    label:        'Low Flood Susceptibility',
  },
]

async function fetchGeoJson(path: string) {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const text = await res.text()
  if (text.startsWith('version https://git-lfs')) {
    throw new Error(`Git LFS pointer — run "git lfs pull" to download flood data`)
  }

  return JSON.parse(text) as object
}

export default function NoahFloodLayer({
  visible,
  onStatusChange,
  onFeatureCountChange,
}: Props) {
  const map = useMap()

  // One Data layer per band, created once
  const layersRef   = useRef<google.maps.Data[]>([])
  const loadedRef   = useRef(false)
  const totalRef    = useRef(0)

  useEffect(() => {
    if (!map) return

    // Create the three Data layers once
    if (layersRef.current.length === 0) {
      layersRef.current = BANDS.map((band) => {
        const layer = new google.maps.Data()
        layer.setStyle({
          fillColor:    band.fillColor,
          fillOpacity:  band.fillOpacity,
          strokeColor:  band.strokeColor,
          strokeOpacity: band.strokeOpacity,
          strokeWeight:  1,
          clickable:    false,
          zIndex:       band.zIndex,
        })
        return layer
      })
    }

    const layers = layersRef.current

    if (visible) {
      if (!loadedRef.current) {
        onStatusChange?.('loading')

        Promise.all(
          BANDS.map((band, i) =>
            fetchGeoJson(band.path)
              .then((geojson) => {
                const added = layers[i].addGeoJson(geojson)
                totalRef.current += added.length
                onFeatureCountChange?.(totalRef.current)
              })
              .catch((err) => {
                console.warn(`[LIGTAS] NoahFloodLayer skipped ${band.path}:`, err.message)
              }),
          ),
        ).then(() => {
          loadedRef.current = true
          onStatusChange?.('ready')
        })
      } else {
        onStatusChange?.('ready')
        onFeatureCountChange?.(totalRef.current)
      }

      layers.forEach((l) => l.setMap(map))
    } else {
      layers.forEach((l) => l.setMap(null))
      onStatusChange?.('idle')
    }

    return () => {
      layers.forEach((l) => l.setMap(null))
    }
  }, [map, visible, onStatusChange, onFeatureCountChange])

  // Full cleanup on unmount
  useEffect(() => {
    return () => {
      layersRef.current.forEach((l) => l.setMap(null))
    }
  }, [])

  return null
}
