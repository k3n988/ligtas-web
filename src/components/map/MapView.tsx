'use client'
// src/components/map/MapView.tsx
// Imported via next/dynamic with ssr:false — must stay a pure client module.

import { useCallback, useEffect, useState } from 'react'
import {
  APIProvider,
  Map,
  useMap,
  useMapsLibrary,
  type MapMouseEvent,
} from '@vis.gl/react-google-maps'
import { useHouseholdStore } from '@/store/householdStore'
import { useAssetStore } from '@/store/assetStore'
import { haversineKm } from '@/lib/geo'
import HouseholdMarker from './HouseholdMarker'
import AssetMarker from './AssetMarker'
import MapLegend from './MapLegend'
import { Marker } from '@vis.gl/react-google-maps'

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

/** SVG crosshair pin used as the "pending / not yet saved" location marker. */
function pendingPinIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
    <circle cx="16" cy="16" r="12" fill="#0d1117" stroke="#58a6ff" stroke-width="3" stroke-dasharray="5 3"/>
    <circle cx="16" cy="16" r="5" fill="#58a6ff"/>
  </svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

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

/** Pans the map to arbitrary coordinates (used by the search bar). */
function PanCoordsController() {
  const map = useMap()
  const panToCoords = useHouseholdStore((s) => s.panToCoords)
  const setPanToCoords = useHouseholdStore((s) => s.setPanToCoords)

  useEffect(() => {
    if (!panToCoords || !map) return
    map.panTo(panToCoords)
    map.setZoom(15)
    setPanToCoords(null)
  }, [panToCoords, map, setPanToCoords])

  return null
}

/** Changes the map cursor to a crosshair while location-picking is active. */
function PickCursorController() {
  const map = useMap()
  const pickingLocation = useHouseholdStore((s) => s.pickingLocation)

  useEffect(() => {
    if (!map) return
    map.setOptions({ draggableCursor: pickingLocation ? 'crosshair' : '' })
  }, [map, pickingLocation])

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
  const pickingLocation = useHouseholdStore((s) => s.pickingLocation)
  const pendingCoords = useHouseholdStore((s) => s.pendingCoords)
  const setPickingLocation = useHouseholdStore((s) => s.setPickingLocation)
  const setPendingCoords = useHouseholdStore((s) => s.setPendingCoords)

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      if (!pickingLocation) return
      const lat = e.detail.latLng?.lat
      const lng = e.detail.latLng?.lng
      if (lat == null || lng == null) return
      setPendingCoords({ lat, lng })
      setPickingLocation(false)
    },
    [pickingLocation, setPendingCoords, setPickingLocation],
  )

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Banner shown while admin is picking a location */}
      {pickingLocation && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            background: '#58a6ff',
            color: '#0d1117',
            padding: '8px 18px',
            borderRadius: 20,
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.82rem',
            fontWeight: 700,
            boxShadow: '0 4px 12px rgba(0,0,0,.5)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          📍 Click on the map to pin the household location
        </div>
      )}

      {/* Cancel button shown while picking */}
      {pickingLocation && (
        <button
          onClick={() => setPickingLocation(false)}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 20,
            background: '#161b22',
            border: '1px solid #30363d',
            color: '#c9d1d9',
            padding: '7px 14px',
            borderRadius: 6,
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ✕ Cancel
        </button>
      )}

      <Map
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={14}
        styles={CLEAN_STYLES}
        disableDefaultUI={false}
        gestureHandling="greedy"
        style={{ width: '100%', height: '100%' }}
        mapTypeControlOptions={{ mapTypeIds: ['roadmap', 'satellite', 'hybrid'] }}
        onClick={handleMapClick}
      >
        <PanController />
        <PanCoordsController />
        <PickCursorController />
        <RouteOverlay />

        {households.filter((hh) => hh.approvalStatus === 'approved').map((hh) => (
          <HouseholdMarker key={hh.id} household={hh} />
        ))}
        {assets.map((asset) => (
          <AssetMarker key={asset.id} asset={asset} />
        ))}

        {/* Preview pin for pending registration */}
        {pendingCoords && (
          <Marker
            position={pendingCoords}
            icon={pendingPinIcon()}
            title="Pinned location (not yet saved)"
            zIndex={999}
          />
        )}

        <MapLegend />
      </Map>
    </div>
  )
}

export default function MapView() {
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <MapInner />
    </APIProvider>
  )
}
