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
  const var1LayerRef = useRef<google.maps.Data | null>(null)
  const featureCountRef = useRef({ var3: 0, var2: 0, var1: 0 })

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

    if (!var1LayerRef.current) {
      var1LayerRef.current = new google.maps.Data()
      var1LayerRef.current.setStyle({
        fillColor: '#f1c40f',
        fillOpacity: 0.2,
        strokeColor: '#b7950b',
        strokeOpacity: 0.34,
        strokeWeight: 1,
        clickable: false,
        zIndex: 6,
      })
    }

    const var3Layer = var3LayerRef.current
    const var2Layer = var2LayerRef.current
    const var1Layer = var1LayerRef.current

    if (visible) {
      if (featureCountRef.current.var3 === 0 || featureCountRef.current.var2 === 0) {
        onStatusChange?.('loading')
        let requiredLoaded = 0
        const finishRequiredLoad = () => {
          requiredLoaded += 1
          if (requiredLoaded < 2) return
          onFeatureCountChange?.(featureCountRef.current.var3 + featureCountRef.current.var2 + featureCountRef.current.var1)
          onStatusChange?.('ready')
          if (featureCountRef.current.var1 > 0) {
            var1Layer.setMap(map)
          }
          var2Layer.setMap(map)
          var3Layer.setMap(map)
        }

        var1Layer.loadGeoJson('/data/flood_var1_analysis.geojson', null, (features) => {
          featureCountRef.current.var1 = features.length
          if (features.length > 0) {
            onFeatureCountChange?.(featureCountRef.current.var3 + featureCountRef.current.var2 + featureCountRef.current.var1)
            if (visible) {
              var1Layer.setMap(map)
            }
          }
        })

        var2Layer.loadGeoJson('/data/flood_var2_analysis.geojson', null, (features) => {
          featureCountRef.current.var2 = features.length
          finishRequiredLoad()
        })

        var3Layer.loadGeoJson('/data/flood_var3_analysis.geojson', null, (features) => {
          featureCountRef.current.var3 = features.length
          finishRequiredLoad()
        })

        return () => {
          var1Layer.setMap(null)
          var2Layer.setMap(null)
          var3Layer.setMap(null)
        }
      }

      if (featureCountRef.current.var1 > 0) {
        var1Layer.setMap(map)
      }
      var2Layer.setMap(map)
      var3Layer.setMap(map)
      onFeatureCountChange?.(featureCountRef.current.var3 + featureCountRef.current.var2 + featureCountRef.current.var1)
      onStatusChange?.('ready')
      return () => {
        var1Layer.setMap(null)
        var2Layer.setMap(null)
        var3Layer.setMap(null)
      }
    }

    var1Layer.setMap(null)
    var2Layer.setMap(null)
    var3Layer.setMap(null)
    onStatusChange?.('idle')

    return () => {
      var1Layer.setMap(null)
      var2Layer.setMap(null)
      var3Layer.setMap(null)
    }
  }, [map, onFeatureCountChange, onStatusChange, visible])

  useEffect(() => {
    return () => {
      var1LayerRef.current?.setMap(null)
      var2LayerRef.current?.setMap(null)
      var3LayerRef.current?.setMap(null)
    }
  }, [])

  return null
}
