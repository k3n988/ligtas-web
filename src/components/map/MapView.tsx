'use client'
// src/components/map/MapView.tsx
// Imported via next/dynamic with ssr:false — must stay a pure client module.

import { useEffect, useState } from 'react'
import { APIProvider, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import { useHouseholdStore } from '@/store/householdStore'
import { useAssetStore } from '@/store/assetStore'
import { haversineKm } from '@/lib/geo'
import HouseholdMarker from './HouseholdMarker'
import AssetMarker from './AssetMarker'
import MapLegend from './MapLegend'

const DEFAULT_CENTER = { lat: 10.6765, lng: 122.9509 }

// Default Google Maps style — only POIs and transit pins are hidden.
const CLEAN_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: 'poi',                  stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.attraction',       stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business',         stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.government',       stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.medical',          stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park',             stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.place_of_worship', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.school',           stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.sports_complex',   stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',              stylers: [{ visibility: 'off' }] },
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

/**
 * When a household is selected, finds the nearest asset and draws a
 * driving route from that asset to the household using the Directions API.
 */
function RouteOverlay() {
  const map = useMap()
  const routesLib = useMapsLibrary('routes')
  const households = useHouseholdStore((s) => s.households)
  const assets = useAssetStore((s) => s.assets)
  const selectedId = useHouseholdStore((s) => s.selectedId)

  const [renderer, setRenderer] = useState<google.maps.DirectionsRenderer | null>(null)

  // Create the renderer once
  useEffect(() => {
    if (!routesLib || !map) return
    const r = new routesLib.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#58a6ff',
        strokeWeight: 5,
        strokeOpacity: 0.85,
      },
    })
    setRenderer(r)
    return () => {
      r.setMap(null)
    }
  }, [routesLib, map])

  // Request route whenever selectedId changes
  useEffect(() => {
    if (!renderer || !routesLib || !map) return

    if (!selectedId) {
      renderer.setMap(null)
      return
    }

    const hh = households.find((h) => h.id === selectedId)
    if (!hh) return

    // Find the geographically nearest asset
    const nearest = assets.reduce((prev, curr) =>
      haversineKm(hh.lat, hh.lng, curr.lat, curr.lng) <
      haversineKm(hh.lat, hh.lng, prev.lat, prev.lng)
        ? curr
        : prev,
    )

    renderer.setMap(map)

    const service = new routesLib.DirectionsService()
    service.route(
      {
        origin: { lat: nearest.lat, lng: nearest.lng },
        destination: { lat: hh.lat, lng: hh.lng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          renderer.setDirections(result)
        }
      },
    )
  }, [selectedId, households, assets, renderer, routesLib, map])

  return null
}

function MapInner() {
  const households = useHouseholdStore((s) => s.households)
  const assets = useAssetStore((s) => s.assets)

  return (
    <Map
      defaultCenter={DEFAULT_CENTER}
      defaultZoom={14}
      styles={CLEAN_STYLES}
      disableDefaultUI={false}
      gestureHandling="greedy"
      style={{ width: '100%', height: '100%' }}
      mapTypeControlOptions={{ mapTypeIds: ['roadmap', 'satellite', 'hybrid'] }}
    >
      <PanController />
      <RouteOverlay />
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
