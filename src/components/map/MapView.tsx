'use client'
// src/components/map/MapView.tsx
// Imported via next/dynamic with ssr:false — must stay a pure client module.

import { useEffect } from 'react'
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import { useHouseholdStore } from '@/store/householdStore'
import { useAssetStore } from '@/store/assetStore'
import HouseholdMarker from './HouseholdMarker'
import AssetMarker from './AssetMarker'
import MapLegend from './MapLegend'

// Bacolod City center
const DEFAULT_CENTER = { lat: 10.6765, lng: 122.9509 }

// Dark "night" style — matches the dashboard's #0d1117 palette
const DARK_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8b949e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d1117' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#30363d' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9aa0a6' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#c9d1d9' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#8b949e' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0d2137' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#21262d' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#161b22' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9aa0a6' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#30363d' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1c2028' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#c9d1d9' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#21262d' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#8b949e' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1b2a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
]

/** Pans the map whenever panToId changes in the Zustand store. */
function PanController() {
  const map = useMap()
  const panToId = useHouseholdStore((s) => s.panToId)
  const households = useHouseholdStore((s) => s.households)
  const setPanTo = useHouseholdStore((s) => s.setPanTo)

  useEffect(() => {
    if (!panToId || !map) return
    const hh = households.find((h) => h.id === panToId)
    if (hh) {
      map.panTo({ lat: hh.lat, lng: hh.lng })
      map.setZoom(18)
    }
    setPanTo(null)
  }, [panToId, households, map, setPanTo])

  return null
}

function MapInner() {
  const households = useHouseholdStore((s) => s.households)
  const assets = useAssetStore((s) => s.assets)

  return (
    <Map
      defaultCenter={DEFAULT_CENTER}
      defaultZoom={14}
      mapId="DEMO_MAP_ID"
      styles={DARK_STYLES}
      disableDefaultUI={false}
      gestureHandling="greedy"
      style={{ width: '100%', height: '100%' }}
      mapTypeControlOptions={{ mapTypeIds: ['roadmap', 'satellite', 'hybrid'] }}
    >
      <PanController />
      {households.map((hh) => (
        <HouseholdMarker key={hh.id} household={hh} />
      ))}
      {assets.map((asset) => (
        <AssetMarker key={asset.id} asset={asset} />
      ))}
      <MapLegend />
    </Map>
  )
}

export default function MapView() {
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <MapInner />
    </APIProvider>
  )
}
