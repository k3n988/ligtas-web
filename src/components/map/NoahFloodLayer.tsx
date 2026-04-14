'use client'

import { useEffect, useRef } from 'react'
import { useMap } from '@vis.gl/react-google-maps'

type NoahLayerStatus = 'idle' | 'loading' | 'ready'

interface Props {
  visible: boolean
  onStatusChange?: (status: NoahLayerStatus) => void
  onFeatureCountChange?: (count: number) => void
}

export default function NoahFloodLayer({
  visible,
  onStatusChange,
  onFeatureCountChange,
}: Props) {
  const map = useMap()
  const var3LayerRef = useRef<google.maps.Data | null>(null)
  const var2LayerRef = useRef<google.maps.Data | null>(null)
  const featureCountRef = useRef({ var3: 0, var2: 0 })

  useEffect(() => {
    if (!map) return

    if (!var3LayerRef.current) {
      var3LayerRef.current = new google.maps.Data()
      var3LayerRef.current.setStyle({
        fillColor: '#ff4d4d',
        fillOpacity: 0.34,
        strokeColor: '#c0392b',
        strokeOpacity: 0.5,
        strokeWeight: 1,
        clickable: false,
        zIndex: 8,
      })
    }

    if (!var2LayerRef.current) {
      var2LayerRef.current = new google.maps.Data()
      var2LayerRef.current.setStyle({
        fillColor: '#f39c12',
        fillOpacity: 0.26,
        strokeColor: '#d68910',
        strokeOpacity: 0.42,
        strokeWeight: 1,
        clickable: false,
        zIndex: 7,
      })
    }

    const var3Layer = var3LayerRef.current
    const var2Layer = var2LayerRef.current

    if (visible) {
      if (featureCountRef.current.var3 === 0 || featureCountRef.current.var2 === 0) {
        onStatusChange?.('loading')
        let loaded = 0
        const finishLoad = () => {
          loaded += 1
          if (loaded < 2) return
          onFeatureCountChange?.(featureCountRef.current.var3 + featureCountRef.current.var2)
          onStatusChange?.('ready')
          var2Layer.setMap(map)
          var3Layer.setMap(map)
        }

        var2Layer.loadGeoJson('/data/flood_var2_analysis.geojson', null, (features) => {
          featureCountRef.current.var2 = features.length
          finishLoad()
        })

        var3Layer.loadGeoJson('/data/flood_var3_analysis.geojson', null, (features) => {
          featureCountRef.current.var3 = features.length
          finishLoad()
        })

        return () => {
          var2Layer.setMap(null)
          var3Layer.setMap(null)
        }
      }

      var2Layer.setMap(map)
      var3Layer.setMap(map)
      onFeatureCountChange?.(featureCountRef.current.var3 + featureCountRef.current.var2)
      onStatusChange?.('ready')
      return () => {
        var2Layer.setMap(null)
        var3Layer.setMap(null)
      }
    }

    var2Layer.setMap(null)
    var3Layer.setMap(null)
    onStatusChange?.('idle')

    return () => {
      var2Layer.setMap(null)
      var3Layer.setMap(null)
    }
  }, [map, onFeatureCountChange, onStatusChange, visible])

  useEffect(() => {
    return () => {
      var2LayerRef.current?.setMap(null)
      var3LayerRef.current?.setMap(null)
    }
  }, [])

  return null
}
