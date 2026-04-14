'use client'
// src/components/map/MapView.tsx
// Imported via next/dynamic with ssr:false — must stay a pure client module.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { useNoahFloodStore } from '@/store/noahFloodStore'
import HouseholdMarker from './HouseholdMarker'
import AssetMarker from './AssetMarker'
import MapLegend from './MapLegend'
import HazardControlPanel from './HazardControlPanel'
import NoahFloodLayer from './NoahFloodLayer'
import { Marker } from '@vis.gl/react-google-maps'
import type { FloodSeverity, HazardEvent } from '@/types'
import { isPointInAnyPolygon } from '@/lib/geo'

const DEFAULT_CENTER = { lat: 10.6765, lng: 122.9509 }

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

function pendingPinIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
    <circle cx="16" cy="16" r="12" fill="#0d1117" stroke="#58a6ff" stroke-width="3" stroke-dasharray="5 3"/>
    <circle cx="16" cy="16" r="5" fill="#58a6ff"/>
  </svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

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
/** Pans the map to the hazard center once when a new hazard is activated. */
function HazardPanController() {
  const map          = useMap()
  const activeHazard = useHazardStore((s) => s.activeHazard)

  useEffect(() => {
    // Flood hazards have no meaningful center (lat/lng = 0) — skip auto-pan
    if (!map || !activeHazard?.isActive || activeHazard.type === 'Flood') return
    map.panTo(activeHazard.center)
    map.setZoom(12)
  }, [map, activeHazard?.id])

  return null
}

// Severity order: stable rendered first so critical sits on top visually
const SEVERITY_ORDER: Record<FloodSeverity, number> = {
  stable: 0, elevated: 1, high: 2, critical: 3,
}

const FLOOD_ZONE_STYLE: Record<FloodSeverity, { fill: string; fillOpacity: number; stroke: string; zIndex: number }> = {
  critical: { fill: '#ff4d4d', fillOpacity: 0.38, stroke: '#c0392b', zIndex: 14 },
  high:     { fill: '#f39c12', fillOpacity: 0.30, stroke: '#d68910', zIndex: 13 },
  elevated: { fill: '#f1c40f', fillOpacity: 0.25, stroke: '#b7950b', zIndex: 12 },
  stable:   { fill: '#58a6ff', fillOpacity: 0.18, stroke: '#2980b9', zIndex: 11 },
}

const SEVERITY_LABEL: Record<FloodSeverity, string> = {
  critical: '🔴 Critical',
  high:     '🟠 High',
  elevated: '🟡 Elevated',
  stable:   '🔵 Stable',
}

const DEPTH_LABEL: Record<string, string> = {
  ankle: 'Ankle-deep',
  knee:  'Knee-deep',
  waist: 'Waist-deep',
  chest: 'Chest-deep',
}

function FloodZoneOverlays() {
  const map             = useMap()
  const user            = useAuthStore((s) => s.user)
  const floodZones      = useHazardStore((s) => s.floodZones)
  const updateFloodZone = useHazardStore((s) => s.updateFloodZone)

  // Single persistent InfoWindow — avoids stacking popups
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)

  useEffect(() => {
    if (!map) return

    // Ensure one shared InfoWindow exists
    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow()
    }
    const iw = infoWindowRef.current

    // Close InfoWindow when user clicks the base map
    const mapClickListener = map.addListener('click', () => iw.close())

    const polygons:  google.maps.Polygon[]             = []
    const listeners: google.maps.MapsEventListener[]   = []

    // Render stable → critical so higher severity sits on top
    const sorted = [...floodZones].sort(
      (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
    )

    sorted.forEach((zone) => {
      const style   = FLOOD_ZONE_STYLE[zone.severity]
      const isAdmin = user?.role === 'admin'

      const poly = new google.maps.Polygon({
        map,
        paths:         zone.polygon,
        fillColor:     style.fill,
        fillOpacity:   style.fillOpacity,
        strokeColor:   style.stroke,
        strokeOpacity: 0.85,
        strokeWeight:  2.5,
        clickable:     true,
        editable:      false,
        draggable:     false,
        zIndex:        style.zIndex,
      })

      // Click → update and reopen the single InfoWindow
      listeners.push(poly.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return
        iw.setContent(`
          <div style="font-family:Inter,sans-serif;padding:4px 2px;min-width:130px">
            <div style="font-size:0.82rem;font-weight:700;margin-bottom:4px">
              ${SEVERITY_LABEL[zone.severity]} Flood Zone
            </div>
            ${zone.depth ? `<div style="font-size:0.75rem;color:#555">💧 ${DEPTH_LABEL[zone.depth] ?? zone.depth}</div>` : ''}
            ${zone.notes ? `<div style="font-size:0.73rem;color:#666;margin-top:3px">${zone.notes}</div>` : ''}
          </div>`)
        iw.setPosition(e.latLng)
        iw.open(map)
      }))

      // Admin path edits → persist to store + DB
      if (isAdmin) {
        const syncPath = () => {
          const path   = poly.getPath()
          const coords = Array.from({ length: path.getLength() }, (_, i) => {
            const pt = path.getAt(i)
            return { lat: pt.lat(), lng: pt.lng() }
          })
          updateFloodZone(zone.id, { polygon: coords })
        }
        listeners.push(poly.getPath().addListener('set_at',    syncPath))
        listeners.push(poly.getPath().addListener('insert_at', syncPath))
        listeners.push(poly.getPath().addListener('remove_at', syncPath))
      }

      polygons.push(poly)
    })

    return () => {
      iw.close()
      google.maps.event.removeListener(mapClickListener)
      polygons.forEach((p)  => p.setMap(null))
      listeners.forEach((l) => google.maps.event.removeListener(l))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, floodZones, user?.role])

  // Destroy InfoWindow on component unmount
  useEffect(() => {
    return () => { infoWindowRef.current?.close() }
  }, [])

  return null
}

const HAZARD_RING_STYLE: Record<string, { stroke: string; fill: string }> = {
  critical: { stroke: '#ff4d4d', fill: '#ff4d4d' },
  high:     { stroke: '#f39c12', fill: '#f39c12' },
  elevated: { stroke: '#f1c40f', fill: '#f1c40f' },
  stable:   { stroke: '#58a6ff', fill: '#58a6ff' },
}

function HazardCircles({ hazard }: { hazard: HazardEvent }) {
  const map = useMap()

  useEffect(() => {
    if (!map) return
    const circles: google.maps.Circle[] = []

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
        center:        hazard.center,
        radius:        km * 1000,
        strokeColor:   style.stroke,
        strokeOpacity: 0.9,
        strokeWeight:  2,
        fillColor:     style.fill,
        fillOpacity:   0.08,
        clickable:     false,
      })
      circles.push(c)
    })

    const pin = new google.maps.Marker({
      map,
      position: hazard.center,
      title:    `${hazard.type} epicenter`,
      icon: {
        path:          google.maps.SymbolPath.CIRCLE,
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

function RouteOverlay() {
  const map        = useMap()
  const routesLib  = useMapsLibrary('routes')
  const households = useHouseholdStore((s) => s.households)
  const assets     = useAssetStore((s) => s.assets)
  const selectedId = useHouseholdStore((s) => s.selectedId)
  const user       = useAuthStore((s) => s.user)

  const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null)

  useEffect(() => {
    if (!routesLib || !map) return
    const r = new routesLib.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor:   '#58a6ff',
        strokeWeight:  5,
        strokeOpacity: 0.85,
      },
    })
    rendererRef.current = r
    return () => {
      rendererRef.current = null
      r.setMap(null)
    }
  }, [routesLib, map])

  useEffect(() => {
    const renderer = rendererRef.current
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
    const assignedAsset = assets.find((a) => a.id === hh.assignedAssetId)
    if (!assignedAsset || assignedAsset.status !== 'Dispatching') {
      renderer.setMap(null)
      return
    }
    renderer.setMap(map)
    const service = new routesLib.DirectionsService()
    service.route(
      {
        origin:      { lat: assignedAsset.lat, lng: assignedAsset.lng },
        destination: { lat: hh.lat, lng: hh.lng },
        travelMode:  google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          renderer.setDirections(result)
        }
      },
    )
  }, [selectedId, households, assets, routesLib, map, user])

  return null
}

function MapInner() {
  const households         = useHouseholdStore((s) => s.households)
  const assets             = useAssetStore((s) => s.assets)
  const pickingLocation    = useHouseholdStore((s) => s.pickingLocation)
  const pendingCoords      = useHouseholdStore((s) => s.pendingCoords)
  const setPickingLocation = useHouseholdStore((s) => s.setPickingLocation)
  const setPendingCoords   = useHouseholdStore((s) => s.setPendingCoords)

  const activeHazard         = useHazardStore((s) => s.activeHazard)
  const isSelectingCenter    = useHazardStore((s) => s.isSelectingCenter)
  const setIsSelectingCenter = useHazardStore((s) => s.setIsSelectingCenter)
  const setDraftCenter       = useHazardStore((s) => s.setDraftCenter)
  const showNoahFlood        = useNoahFloodStore((s) => s.visible)
  const setShowNoahFlood     = useNoahFloodStore((s) => s.setVisible)
  const noahAnalysisStatus   = useNoahFloodStore((s) => s.analysisStatus)
  const noahVar3PolygonCount = useNoahFloodStore((s) => s.var3PolygonCount)
  const noahVar2PolygonCount = useNoahFloodStore((s) => s.var2PolygonCount)
  const noahVar3Polygons = useNoahFloodStore((s) => s.var3Polygons)
  const noahVar2Polygons = useNoahFloodStore((s) => s.var2Polygons)
  const ensureAnalysisLoaded = useNoahFloodStore((s) => s.ensureAnalysisLoaded)

  const [openAssetId, setOpenAssetId] = useState<string | null>(null)
  const [noahStatus, setNoahStatus] = useState<'idle' | 'loading' | 'ready'>('idle')
  const [noahFeatureCount, setNoahFeatureCount] = useState(0)

  useEffect(() => {
    if (!showNoahFlood) return
    void ensureAnalysisLoaded()
  }, [ensureAnalysisLoaded, showNoahFlood])

  const noahCriticalHouseholdCount = useMemo(() => {
    if (!showNoahFlood || noahAnalysisStatus !== 'ready') return 0

    if (noahVar3Polygons.length === 0) return 0

    return households
      .filter((hh) => hh.approvalStatus === 'approved')
      .reduce((total, hh) => (
        isPointInAnyPolygon({ lat: hh.lat, lng: hh.lng }, noahVar3Polygons) ? total + 1 : total
      ), 0)
  }, [households, noahVar3Polygons, noahAnalysisStatus, showNoahFlood])

  const noahHighHouseholdCount = useMemo(() => {
    if (!showNoahFlood || noahAnalysisStatus !== 'ready') return 0

    if (noahVar2Polygons.length === 0) return 0

    return households
      .filter((hh) => hh.approvalStatus === 'approved')
      .reduce((total, hh) => {
        const point = { lat: hh.lat, lng: hh.lng }
        if (isPointInAnyPolygon(point, noahVar3Polygons)) return total
        return isPointInAnyPolygon(point, noahVar2Polygons) ? total + 1 : total
      }, 0)
  }, [households, noahAnalysisStatus, noahVar2Polygons, noahVar3Polygons, showNoahFlood])

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      setOpenAssetId(null)
      const lat = e.detail.latLng?.lat
      const lng = e.detail.latLng?.lng
      if (lat == null || lng == null) return

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
        <div style={{
          position: 'absolute', top: 12, left: '50%',
          transform: 'translateX(-50%)', zIndex: 20,
          background: '#58a6ff', color: '#0d1117',
          padding: '8px 18px', borderRadius: 20,
          fontFamily: 'Inter, sans-serif', fontSize: '0.82rem',
          fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,.5)',
          pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          📍 Click on the map to pin the household location
        </div>
      )}

      {/* Cancel button shown while picking */}
      {pickingLocation && (
        <button
          onClick={() => setPickingLocation(false)}
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 20,
            background: '#161b22', border: '1px solid #30363d',
            color: '#c9d1d9', padding: '7px 14px', borderRadius: 6,
            fontFamily: 'Inter, sans-serif', fontSize: '0.78rem',
            fontWeight: 600, cursor: 'pointer',
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
        <HazardPanController />   {/* ← add this */}
        <RouteOverlay />
        <NoahFloodLayer
          visible={showNoahFlood}
          onStatusChange={setNoahStatus}
          onFeatureCountChange={setNoahFeatureCount}
        />

        {activeHazard?.isActive && activeHazard.type !== 'Flood' && <HazardCircles hazard={activeHazard} />}
        {activeHazard?.isActive && activeHazard.type === 'Flood' && <FloodZoneOverlays />}

        {households.filter((hh) => hh.approvalStatus === 'approved').map((hh) => (
          <HouseholdMarker key={hh.id} household={hh} />
        ))}

        {assets.map((asset) => (
          <AssetMarker
            key={asset.id}
            asset={asset}
            isOpen={openAssetId === asset.id}
            onOpen={() => setOpenAssetId(asset.id)}
            onClose={() => setOpenAssetId(null)}
          />
        ))}

        {pendingCoords && (
          <Marker
            position={pendingCoords}
            icon={pendingPinIcon()}
            title="Pinned location (not yet saved)"
            zIndex={999}
          />
        )}

        <MapLegend showNoahFlood={showNoahFlood} />
      </Map>

      {/* ✅ HazardControlPanel is OUTSIDE <Map> so it renders as a proper DOM overlay */}
      <div
        style={{
          position: 'absolute',
          right: 12,
          bottom: 30,
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          alignItems: 'flex-end',
          maxWidth: 'min(320px, calc(100vw - 24px))',
        }}
      >
        <button
          onClick={() => {
            const next = !showNoahFlood
            setShowNoahFlood(next)
            if (next) {
              void ensureAnalysisLoaded()
            }
          }}
          style={{
            background: showNoahFlood ? '#102a19' : 'var(--map-panel-bg)',
            border: `1px solid ${showNoahFlood ? '#238636' : 'var(--map-panel-border)'}`,
            color: showNoahFlood ? '#3fb950' : 'var(--fg-default)',
            borderRadius: 12,
            padding: '10px 12px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.75rem',
            fontWeight: 700,
            boxShadow: 'var(--shadow-overlay)',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}
          title="Toggle the NOAH flood susceptibility reference layer"
        >
          {showNoahFlood ? 'Hide' : 'Show'} NOAH Flood Layer
        </button>

        <div
          style={{
            background: 'var(--map-panel-bg)',
            border: '1px solid var(--map-panel-border)',
            borderRadius: 12,
            padding: '10px 12px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.7rem',
            color: 'var(--fg-muted)',
            boxShadow: 'var(--shadow-overlay)',
            lineHeight: 1.35,
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--fg-default)', marginBottom: 4 }}>
            NOAH Reference Layer
          </div>
          <div>
            {showNoahFlood
              ? noahStatus === 'loading'
                ? 'Loading Var 2 and Var 3 GeoJSON flood layers...'
                : `Var 2 + Var 3 GeoJSON flood layers visible${noahFeatureCount > 0 ? ` • ${noahFeatureCount.toLocaleString()} features loaded` : ''}`
              : 'Off by default. This GeoJSON test uses the split Var 2 and Var 3 flood analysis files.'}
          </div>
          {showNoahFlood && (
            <div style={{ marginTop: 5 }}>
              {noahAnalysisStatus === 'loading' && 'Loading Var 2 and Var 3 analysis GeoJSON...'}
              {noahAnalysisStatus === 'ready' && `Flood analysis ready • Critical: ${noahVar3PolygonCount.toLocaleString()} polygons / ${noahCriticalHouseholdCount} households • High: ${noahVar2PolygonCount.toLocaleString()} polygons / ${noahHighHouseholdCount} households`}
              {noahAnalysisStatus === 'error' && 'Flood analysis GeoJSON failed to load.'}
            </div>
          )}
        </div>
      </div>

      <HazardControlPanel />

    </div>
  )
}

export default MapInner
