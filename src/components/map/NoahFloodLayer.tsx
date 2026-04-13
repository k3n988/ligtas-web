'use client'

import { useEffect, useRef } from 'react'
import { useMap } from '@vis.gl/react-google-maps'

type NoahLayerStatus = 'idle' | 'loading' | 'ready'

interface Props {
  visible: boolean
  onStatusChange?: (status: NoahLayerStatus) => void
  onFeatureCountChange?: (count: number) => void
}

const NOAH_STYLE: Record<number, { fillColor: string; strokeColor: string; label: string }> = {
  1: { fillColor: '#f1c40f', strokeColor: '#b7950b', label: 'Low Flood Susceptibility' },
  2: { fillColor: '#f39c12', strokeColor: '#d68910', label: 'Moderate Flood Susceptibility' },
  3: { fillColor: '#ff4d4d', strokeColor: '#c0392b', label: 'High Flood Susceptibility' },
}

function getVarBand(value: unknown): number {
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export default function NoahFloodLayer({
  visible,
  onStatusChange,
  onFeatureCountChange,
}: Props) {
  const map = useMap()
  const dataLayerRef = useRef<google.maps.Data | null>(null)
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const cleanupRef = useRef<Array<google.maps.MapsEventListener>>([])
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (!map) return

    if (!dataLayerRef.current) {
      dataLayerRef.current = new google.maps.Data()
      dataLayerRef.current.setStyle((feature) => {
        const style = NOAH_STYLE[getVarBand(feature.getProperty('Var'))] ?? NOAH_STYLE[1]
        return {
          fillColor: style.fillColor,
          fillOpacity: 0.16,
          strokeColor: style.strokeColor,
          strokeOpacity: 0.55,
          strokeWeight: 1.2,
          clickable: true,
          zIndex: 8,
        }
      })
    }

    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow()
    }

    const layer = dataLayerRef.current
    const infoWindow = infoWindowRef.current

    if (!hasLoadedRef.current) {
      onStatusChange?.('loading')
      layer.loadGeoJson('/data/flood_negocc.geojson', null, (features) => {
        hasLoadedRef.current = true
        onFeatureCountChange?.(features.length)
        onStatusChange?.('ready')
      })

      cleanupRef.current.push(
        layer.addListener('click', (event: google.maps.Data.MouseEvent) => {
          if (!event.latLng) return
          const band = getVarBand(event.feature.getProperty('Var'))
          const style = NOAH_STYLE[band] ?? NOAH_STYLE[1]
          infoWindow.setContent(`
            <div style="font-family:Inter,sans-serif;padding:4px 2px;min-width:170px">
              <div style="font-size:0.82rem;font-weight:700;margin-bottom:4px">
                NOAH Flood Reference
              </div>
              <div style="font-size:0.75rem;color:#555">${style.label}</div>
              <div style="font-size:0.72rem;color:#666;margin-top:3px">Dataset band: Var ${band || '?'}</div>
            </div>
          `)
          infoWindow.setPosition(event.latLng)
          infoWindow.open(map)
        }),
        map.addListener('click', () => infoWindow.close()),
      )
    }

    layer.setMap(visible ? map : null)
    if (!visible) infoWindow.close()

    return () => {
      layer.setMap(null)
    }
  }, [map, onFeatureCountChange, onStatusChange, visible])

  useEffect(() => {
    return () => {
      cleanupRef.current.forEach((listener) => google.maps.event.removeListener(listener))
      cleanupRef.current = []
      infoWindowRef.current?.close()
      dataLayerRef.current?.setMap(null)
    }
  }, [])

  return null
}
