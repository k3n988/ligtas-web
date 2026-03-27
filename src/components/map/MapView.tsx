'use client'
// src/components/map/MapView.tsx
// Imported via next/dynamic with ssr:false — must stay a pure client module.

import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { useHouseholdStore } from '@/store/householdStore'
import { useAssetStore } from '@/store/assetStore'
import HouseholdMarker from './HouseholdMarker'
import AssetMarker from './AssetMarker'
import MapLegend from './MapLegend'

// Leaflet default icon fix (required in bundlers that hash assets)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

/** Listens to panToId in Zustand and pans the map when it changes. */
function PanController() {
  const map = useMap()
  const households = useHouseholdStore((s) => s.households)
  const panToId = useHouseholdStore((s) => s.panToId)
  const setPanTo = useHouseholdStore((s) => s.setPanTo)

  useEffect(() => {
    if (!panToId) return
    const hh = households.find((h) => h.id === panToId)
    if (hh) map.setView([hh.lat, hh.lng], 18)
    setPanTo(null)
  }, [panToId, households, map, setPanTo])

  return null
}

export default function MapView() {
  const households = useHouseholdStore((s) => s.households)
  const assets = useAssetStore((s) => s.assets)

  return (
    <MapContainer
      center={[10.6765, 122.9509]}
      zoom={14}
      style={{ width: '100%', height: '100%' }}
      zoomControl
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution="L.I.G.T.A.S. Bacolod"
        maxZoom={19}
      />
      <PanController />
      {households.map((hh) => (
        <HouseholdMarker key={hh.id} household={hh} />
      ))}
      {assets.map((asset) => (
        <AssetMarker key={asset.id} asset={asset} />
      ))}
      <MapLegend />
    </MapContainer>
  )
}
