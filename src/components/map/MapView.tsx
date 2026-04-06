'use client'
// src/components/map/MapView.tsx
// Imported via next/dynamic with ssr:false — must stay a pure client module.

import { useCallback, useEffect, useState } from 'react'
import {
  Map,
  useMap,
  useMapsLibrary,
  type MapMouseEvent,
} from '@vis.gl/react-google-maps'
import { useHouseholdStore } from '@/store/householdStore'
import { useAssetStore } from '@/store/assetStore'
import { useAuthStore } from '@/store/authStore'
import { useHazardStore } from '@/store/hazardStore'
import HouseholdMarker from './HouseholdMarker'
import AssetMarker from './AssetMarker'
import MapLegend from './MapLegend'
import HazardControlPanel from './HazardControlPanel'
import { Marker } from '@vis.gl/react-google-maps'
import type { HazardEvent } from '@/types'

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
    map.panTo({ lat: panToCoords.lat, lng: panToCoords.lng })
    map.setZoom(panToCoords.zoom ?? 15)
    setPanToCoords(null)
  }, [panToCoords, map, setPanToCoords])

  return null
}

/** Changes the map cursor to a crosshair while location-picking is active. */
function PickCursorController() {
  const map = useMap()
  const pickingLocation    = useHouseholdStore((s) => s.pickingLocation)
  const isSelectingCenter  = useHazardStore((s) => s.isSelectingCenter)

  useEffect(() => {
    if (!map) return
    map.setOptions({ draggableCursor: (pickingLocation || isSelectingCenter) ? 'crosshair' : '' })
  }, [map, pickingLocation, isSelectingCenter])

  return null
}

const HAZARD_RING_STYLE: Record<string, { stroke: string; fill: string }> = {
  critical: { stroke: '#ff4d4d', fill: '#ff4d4d' },
  high:     { stroke: '#f39c12', fill: '#f39c12' },
  elevated: { stroke: '#f1c40f', fill: '#f1c40f' },
  stable:   { stroke: '#58a6ff', fill: '#58a6ff' },
}

/** Renders concentric hazard circles on the map via the raw Maps API. */
function HazardCircles({ hazard }: { hazard: HazardEvent }) {
  const map = useMap()

  useEffect(() => {
    if (!map) return
    const circles: google.maps.Circle[] = []

    // Draw outermost → innermost so inner rings appear on top
    const rings = [
      { key: 'stable',   km: hazard.radii.stable   },
      { key: 'elevated', km: hazard.radii.elevated  },
      { key: 'high',     km: hazard.radii.high      },
      { key: 'critical', km: hazard.radii.critical  },
    ] as const

    rings.forEach(({ key, km }) => {
      const style = HAZARD_RING_STYLE[key]
      const c = new google.maps.Circle({
        map,
        center:      hazard.center,
        radius:      km * 1000,
        strokeColor:   style.stroke,
        strokeOpacity: 0.9,
        strokeWeight:  2,
        fillColor:     style.fill,
        fillOpacity:   0.08,
        clickable:     false,
      })
      circles.push(c)
    })

    // Hazard center marker
    const pin = new google.maps.Marker({
      map,
      position: hazard.center,
      title:    `${hazard.type} epicenter`,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale:         10,
        fillColor:     '#ff4d4d',
        fillOpacity:   1,
        strokeColor:   '#fff',
        strokeWeight:  2,
      },
      zIndex: 500,
    })

    return () => {
      circles.forEach((c) => c.setMap(null))
      pin.setMap(null)
    }
  }, [map, hazard])

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
  const user = useAuthStore((s) => s.user) 

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
    // If no renderer, no map, OR NO USER LOGGED IN, do not draw routes.
    if (!renderer || !routesLib || !map || !user) {
      renderer?.setMap(null)
      return
    }

    if (!selectedId) {
      renderer.setMap(null)
      return
    }

    const hh = households.find((h) => h.id === selectedId)
    if (!hh || !hh.assignedAssetId || hh.status === 'Rescued') {
      renderer.setMap(null)
      return
    }

    // Only route if the assigned asset is currently Dispatching
    const assignedAsset = assets.find((a) => a.id === hh.assignedAssetId)
    if (!assignedAsset || assignedAsset.status !== 'Dispatching') {
      renderer.setMap(null)
      return
    }

    renderer.setMap(map)

    const service = new routesLib.DirectionsService()
    service.route(
      {
        origin: { lat: assignedAsset.lat, lng: assignedAsset.lng },
        destination: { lat: hh.lat, lng: hh.lng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          renderer.setDirections(result)
        }
      },
    )
  }, [selectedId, households, assets, renderer, routesLib, map, user])

  return null
}

function MapInner() {
  const households         = useHouseholdStore((s) => s.households)
  const assets             = useAssetStore((s) => s.assets)
  const pickingLocation    = useHouseholdStore((s) => s.pickingLocation)
  const pendingCoords      = useHouseholdStore((s) => s.pendingCoords)
  const setPickingLocation = useHouseholdStore((s) => s.setPickingLocation)
  const setPendingCoords   = useHouseholdStore((s) => s.setPendingCoords)
  const user               = useAuthStore((s) => s.user)

  const activeHazard          = useHazardStore((s) => s.activeHazard)
  const isSelectingCenter     = useHazardStore((s) => s.isSelectingCenter)
  const setIsSelectingCenter  = useHazardStore((s) => s.setIsSelectingCenter)
  const setDraftCenter        = useHazardStore((s) => s.setDraftCenter)

  const [openAssetId, setOpenAssetId] = useState<string | null>(null)

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      setOpenAssetId(null)

      const lat = e.detail.latLng?.lat
      const lng = e.detail.latLng?.lng
      if (lat == null || lng == null) return

      // Hazard center picking takes priority over household pin
      if (isSelectingCenter) {
        setDraftCenter({ lat, lng })
        setIsSelectingCenter(false)
        return
      }

      if (!pickingLocation) return
      setPendingCoords({ lat, lng })
      setPickingLocation(false)
    },
    [isSelectingCenter, pickingLocation, setDraftCenter, setIsSelectingCenter, setPendingCoords, setPickingLocation],
  )

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Banner shown while picking hazard center */}
      {isSelectingCenter && (
        <div style={{
          position: 'absolute', top: 12, left: '50%',
          transform: 'translateX(-50%)', zIndex: 20,
          background: '#ff4d4d', color: '#fff',
          padding: '8px 18px', borderRadius: 20,
          fontFamily: 'Inter, sans-serif', fontSize: '0.82rem',
          fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,.5)',
          pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          ⚠ Click on the map to set the hazard epicenter
        </div>
      )}

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

        {/* Hazard rings — rendered whenever an active hazard exists */}
        {activeHazard?.isActive && <HazardCircles hazard={activeHazard} />}

        {/* ALWAYS SHOW APPROVED HOUSEHOLDS (Guest or Admin) */}
        {households.filter((hh) => hh.approvalStatus === 'approved').map((hh) => (
          <HouseholdMarker key={hh.id} household={hh} />
        ))}

        {/* SHOW ASSETS FOR EVERYONE (GUEST OR ADMIN) */}
        {assets.map((asset) => (
          <AssetMarker 
            key={asset.id} 
            asset={asset} 
            isOpen={openAssetId === asset.id}
            onOpen={() => setOpenAssetId(asset.id)}
            onClose={() => setOpenAssetId(null)}
          />
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

      {/* Hazard control panel — admins only */}
      {user?.role === 'admin' && <HazardControlPanel />}
    </div>
  )
}

export default function MapView() {
  return <MapInner />
}