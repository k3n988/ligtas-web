'use client'
// src/components/public/GuestPanel.tsx

import { useEffect, useRef, useState } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { supabase } from '@/lib/supabase'
import { useHouseholdStore } from '@/store/householdStore'
import { useHazardStore } from '@/store/hazardStore'

// ── Location data ────────────────────────────────────────────────────────────

const CITIES = [
  'Bacolod City', 'Bago City', 'Cadiz City', 'Canlaon City', 'Escalante City',
  'Himamaylan City', 'Kabankalan City', 'La Carlota City', 'Murcia',
  'Sagay City', 'San Carlos City', 'Silay City', 'Talisay City', 'Victorias City',
]

const BARANGAYS_BY_CITY: Record<string, string[]> = {
  'Bacolod City': [
    'Alangilan', 'Alicante', 'Banago', 'Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5', 'Barangay 6', 'Barangay 7', 'Barangay 8', 'Barangay 9', 'Barangay 10', 'Barangay 11', 'Barangay 12', 'Barangay 13', 'Barangay 14', 'Barangay 15', 'Barangay 16', 'Barangay 17', 'Barangay 18', 'Barangay 19', 'Barangay 20', 'Barangay 21', 'Barangay 22', 'Barangay 23', 'Barangay 24', 'Barangay 25', 'Barangay 26', 'Barangay 27', 'Barangay 28', 'Barangay 29', 'Barangay 30', 'Barangay 31', 'Barangay 32', 'Barangay 33', 'Barangay 34', 'Barangay 35', 'Barangay 36', 'Barangay 37', 'Barangay 38', 'Barangay 39', 'Barangay 40', 'Barangay 41', 'Bata', 'Cabug', 'Estefania', 'Felisa', 'Granada', 'Handumanan', 'Mandalagan', 'Mansilingan', 'Pahanocoy', 'Punta Taytay', 'Singcang', 'Sum-ag', 'Tangub', 'Vista Alegre'
  ],
  'Bago City': [
    'Abuanan', 'Alanza', 'Atipuluan', 'Bacong', 'Bagroy', 'Balingasag', 'Binubuhan', 'Busay', 'Calumangangan', 'Caridad', 'Don Jorge L. Araneta', 'Dulao', 'Ilijan', 'Ma-ao', 'Mailum', 'Malingin', 'Napoles', 'Pacol', 'Poblacion', 'Sagasa', 'Sampinit', 'Tabunan', 'Taloc', 'Ubay'
  ],
  'Cadiz City': [
    'Andres Bonifacio', 'Burgos', 'Cabahug', 'Cadiz Viejo', 'Caduha-an', 'Celestino Villacin', 'Daga', 'Jerusalem', 'Luna', 'Mabini', 'Magsaysay', 'Sicaba', 'Tiglawigan', 'Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5', 'Zone 6'
  ],
  'Murcia': [
    'Abejuvela', 'Amaya', 'Anahaw', 'Buenavista', 'Caliban', 'Canlandog', 'Cansilayan', 'Damsite', 'Iglau-an', 'Lopez Jaena', 'Minoyan', 'Pandanon', 'Salvacion', 'San Miguel', 'Santa Cruz', 'Santa Rosa', 'Talotog', 'Zone I', 'Zone II', 'Zone III', 'Zone IV', 'Zone V'
  ],
  'Canlaon City': [
    'Bayog', 'Binalbagan', 'Bucalan', 'Budlasan', 'Linothangan', 'Lumapao', 'Mabigo', 'Malaiba', 'Masulog', 'Ninoy Aquino', 'Panubigan', 'Pula',
  ],
  'Escalante City': [
    'Alimango', 'Balintawak', 'Binaguiohan', 'Buenavista', 'Cervantes', 'Dian-ay', 'Haba', 'Japitan', 'Jonobjonob', 'Langub', 'Libertad', 'Mabini', 'Magsaysay', 'Malasibog', 'Old Poblacion', 'Paitan', 'Pinapugasan', 'Rizal', 'Tamlang', 'Udtongan', 'Washington'
  ],
  'Himamaylan City': [
    'Aguisan', 'Barangay I', 'Barangay II', 'Barangay III', 'Barangay IV', 'Buenavista', 'Cabadiangan', 'Cabanbanan', 'Carabalan', 'Libacao', 'Mahalang', 'Nabali-an', 'San Antonio', 'Saraet', 'Su-ay', 'Talaban', 'To-oy'
  ],
  'Kabankalan City': [
    'Bantayan', 'Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5', 'Barangay 6', 'Barangay 7', 'Barangay 8', 'Barangay 9', 'Binicuil', 'Camansi', 'Camingawan', 'Camugao', 'Carol-an', 'Daan Banua', 'Hilamonan', 'Inapoy', 'Linao', 'Locotan', 'Magballo', 'Oringao', 'Orong', 'Pinaguinpinan', 'Salong', 'Tabugon', 'Tagoc', 'Tagukon', 'Tampalon', 'Tan-Awan', 'Tayum'
  ],
  'La Carlota City': [
    'Ara-al', 'Ayungon', 'Balabag', 'Barangay I', 'Barangay II', 'Barangay III', 'Batuan', 'Cubay', 'Haguimit', 'La Granja', 'Nagasi', 'Roberto S. Benedicto', 'San Miguel', 'Yubo',
  ],
  'Sagay City': [
    'Bato', 'Baviera', 'Bulanon', 'Campo Himoga-an', 'Campo Santiago', 'Colonia Divina', 'Fabrica', 'General Luna', 'Himoga-an Baybay', 'Lopez Jaena', 'Malubon', 'Molocaboc', 'Old Sagay', 'Plaridel', 'Poblacion I', 'Poblacion II', 'Rizal', 'Sewane', 'Taba-ao', 'Tadlong', 'Vito'
  ],
  'San Carlos City': [
    'Bagonbon', 'Barangay I', 'Barangay II', 'Barangay III', 'Barangay IV', 'Barangay V', 'Barangay VI', 'Buluangan', 'Codcod', 'Ermita', 'Guadalupe', 'Nataban', 'Palampas', 'Prinza', 'Prosperidad', 'Punao', 'Quezon', 'Rizal', 'San Juan'
  ],
  'Silay City': [
    'Bagtic', 'Balaring', 'Barangay I', 'Barangay II', 'Barangay III', 'Barangay IV', 'Barangay V', 'Guimbala-on', 'Guinhalaran', 'Kapitan Ramon', 'Lantad', 'Mambulac', 'Patag', 'Rizal'
  ],
  'Talisay City': [
    'Bubog', 'Cabacungan', 'Concepcion', 'Dos Hermanas', 'Efigenio Lizares', 'Katubhan', 'Matab-ang', 'Poblacion', 'San Fernando', 'Tanza', 'Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 4-A', 'Zone 5', 'Zone 6', 'Zone 7', 'Zone 8', 'Zone 9', 'Zone 10', 'Zone 11', 'Zone 12', 'Zone 12-A', 'Zone 14', 'Zone 14-A', 'Zone 14-B', 'Zone 15', 'Zone 16'
  ],
  'Victorias City': [
    'Barangay I', 'Barangay II', 'Barangay III', 'Barangay IV', 'Barangay V', 'Barangay VI', 'Barangay VII', 'Barangay VIII', 'Barangay IX', 'Barangay X', 'Barangay XI', 'Barangay XII', 'Barangay XIII', 'Barangay XIV', 'Barangay XV', 'Barangay XVI', 'Barangay XVII', 'Barangay XVIII', 'Barangay XIX', 'Barangay XX', 'Barangay XXI'
  ],
}

// ── Hotlines by city ─────────────────────────────────────────────────────────

const HOTLINES: Record<string, { label: string; number: string }[]> = {
  'Bacolod City': [
    { label: 'CDRRMO',             number: '(034) 434-0116' },
    { label: 'BFP Bacolod',        number: '(034) 432-5401' },
    { label: 'PNP Bacolod',        number: '(034) 433-3060' },
    { label: 'National Emergency', number: '911' },
  ],
  'Talisay City': [
    { label: 'MDRRMO Talisay',     number: '(034) 495-0114' },
    { label: 'BFP Talisay',        number: '(034) 495-0888' },
    { label: 'National Emergency', number: '911' },
  ],
  'Silay City': [
    { label: 'MDRRMO Silay',       number: '(034) 495-5270' },
    { label: 'BFP Silay',          number: '(034) 495-5116' },
    { label: 'National Emergency', number: '911' },
  ],
  'Bago City': [
    { label: 'CDRRMO Bago',        number: '(034) 461-0333' },
    { label: 'National Emergency', number: '911' },
  ],
  'Cadiz City': [
    { label: 'MDRRMO Cadiz',       number: '(034) 493-0365' },
    { label: 'National Emergency', number: '911' },
  ],
  'Escalante City': [
    { label: 'MDRRMO Escalante',   number: '(034) 454-0011' },
    { label: 'National Emergency', number: '911' },
  ],
  'Himamaylan City': [
    { label: 'MDRRMO Himamaylan',  number: '(034) 388-2154' },
    { label: 'National Emergency', number: '911' },
  ],
  'Kabankalan City': [
    { label: 'CDRRMO Kabankalan',  number: '(034) 471-2063' },
    { label: 'National Emergency', number: '911' },
  ],
  'La Carlota City': [
    { label: 'MDRRMO La Carlota',  number: '(034) 460-0335' },
    { label: 'National Emergency', number: '911' },
  ],
  'Sagay City': [
    { label: 'CDRRMO Sagay',       number: '(034) 488-0333' },
    { label: 'National Emergency', number: '911' },
  ],
  'San Carlos City': [
    { label: 'CDRRMO San Carlos',  number: '(034) 312-5240' },
    { label: 'National Emergency', number: '911' },
  ],
  'Victorias City': [
    { label: 'MDRRMO Victorias',   number: '(034) 399-2100' },
    { label: 'National Emergency', number: '911' },
  ],
  'Murcia': [
    { label: 'MDRRMO Murcia',      number: '(034) 399-2101' },
    { label: 'National Emergency', number: '911' },
  ],
  'Canlaon City': [
    { label: 'CDRRMO Canlaon',     number: '(035) 400-0000' },
    { label: 'National Emergency', number: '911' },
  ],
}

// ── Haversine distance (returns km) ──────────────────────────────────────────

function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Hazard advisory text by type ─────────────────────────────────────────────

function getHazardAdvisory(type: string): string {
  switch (type.toLowerCase()) {
    case 'volcano':
      return 'Ashfall warning. Stay indoors, seal windows, wear an N95 mask when going outside, and prepare an emergency go-bag with essential documents, medicine, and 3-day supplies.'
    case 'flood':
      return 'Monitor water levels closely. If you live near riverbanks or low-lying areas, evacuate immediately to the nearest evacuation center. Do not cross flooded roads.'
    case 'earthquake':
      return 'Aftershocks may occur. Stay away from damaged structures. Inspect your home for gas leaks and structural damage before re-entering.'
    case 'typhoon':
      return 'Secure loose objects outdoors. Stay indoors away from windows. Follow the local DRRMO for evacuation orders. Keep flashlights and emergency kits ready.'
    case 'landslide':
      return 'Avoid slopes, hillsides, and drainage channels. Evacuate if you hear rumbling or notice tilting trees and cracking ground. Do not return until authorities declare it safe.'
    case 'fire':
      return 'Evacuate the area immediately. Stay low to avoid smoke inhalation. Do not use elevators. Call BFP and do not re-enter until cleared by responders.'
    default:
      return 'A hazard has been detected near your area. Stay alert, monitor official channels, and follow the instructions of your local DRRMO.'
  }
}

// ── Dynamic alert level from hazard proximity ─────────────────────────────────

type HazardZone = 'critical' | 'high' | 'elevated' | 'stable' | 'outside'

function getHazardZone(
  distKm: number,
  radii: { critical: number; high: number; elevated: number; stable: number },
): HazardZone {
  if (distKm <= radii.critical) return 'critical'
  if (distKm <= radii.high)     return 'high'
  if (distKm <= radii.elevated) return 'elevated'
  if (distKm <= radii.stable)   return 'stable'
  return 'outside'
}

function zoneToAlertLevel(zone: HazardZone): AlertLevel | null {
  if (zone === 'critical' || zone === 'high')     return 'Pre-emptive Evacuation'
  if (zone === 'elevated' || zone === 'stable')   return 'Monitoring'
  return null // outside — no override
}

const ZONE_LABEL: Record<HazardZone, string> = {
  critical:  'Critical Zone',
  high:      'High-Risk Zone',
  elevated:  'Elevated Zone',
  stable:    'Stable Zone',
  outside:   'Outside Hazard Area',
}

// ── Alert level config ────────────────────────────────────────────────────────

type AlertLevel = 'Normal' | 'Monitoring' | 'Pre-emptive Evacuation'

const ALERT_CONFIG: Record<AlertLevel, { icon: string; color: string; bg: string; border: string }> = {
  'Normal':                 { icon: '🟢', color: '#3fb950', bg: '#0d2016', border: '#238636' },
  'Monitoring':             { icon: '🟡', color: '#d29922', bg: '#1f1a0e', border: '#9e6a03' },
  'Pre-emptive Evacuation': { icon: '🔴', color: '#f85149', bg: '#2d1217', border: '#da3633' },
}

interface AreaStatus {
  alert_level: AlertLevel
  advisory: string
  updated_at: string
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GuestPanel() {
  const setPanToCoords = useHouseholdStore((s) => s.setPanToCoords)
  const activeHazard = useHazardStore((s) => s.activeHazard)
  const geocodingLib = useMapsLibrary('geocoding')
  
  const geocoder = useRef<google.maps.Geocoder | null>(null) 

  useEffect(() => {
    if (geocodingLib) {
      geocoder.current = new geocodingLib.Geocoder()
    }
  }, [geocodingLib])

  function geocodeAndPan(q: string, zoom: number) {
    if (!geocoder.current) return
    
    geocoder.current.geocode(
      { address: q, componentRestrictions: { country: 'ph' } },
      (
        results: google.maps.GeocoderResult[] | null, 
        status: google.maps.GeocoderStatus
      ) => {
        if (status === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location
          setPanToCoords({ lat: loc.lat(), lng: loc.lng(), zoom })
          setSelectedCoords({ lat: loc.lat(), lng: loc.lng() })
        }
      }
    )
  }

  const [city, setCity] = useState('')
  const [barangay, setBarangay] = useState('')
  const [status, setStatus] = useState<AreaStatus | null>(null)
  const [fetching, setFetching] = useState(false)
  const [noData, setNoData] = useState(false)
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null)

  const barangays = city ? (BARANGAYS_BY_CITY[city] ?? []) : []
  const hotlines = city ? (HOTLINES[city] ?? [{ label: 'National Emergency', number: '911' }]) : []

  useEffect(() => {
    if (!city || !barangay) return
    
    supabase
      .from('area_status')
      .select('alert_level, advisory, updated_at')
      .eq('city', city)
      .eq('barangay', barangay)
      .single()
      .then(({ data, error }) => {
        setFetching(false)
        if (error || !data) { 
          setNoData(true)
          return 
        }
        setStatus(data as AreaStatus)
      })
  }, [city, barangay])

  function handleCityChange(c: string) {
    setCity(c)
    setBarangay('')
    setStatus(null)
    setNoData(false)
    if (!c) return
    geocodeAndPan(`${c}, Negros Occidental, Philippines`, 13)
  }

  function handleBarangayChange(b: string) {
    setBarangay(b)
    setFetching(Boolean(b && city))
    setNoData(false)
    if (!b || !city) return
    geocodeAndPan(`${b}, ${city}, Philippines`, 16)
  }

  // ── Hazard-aware computed values ──────────────────────────────────────────
  const hazardInfo = (() => {
    if (!activeHazard?.isActive || !selectedCoords) return null
    const distKm = haversineKm(
      selectedCoords.lat, selectedCoords.lng,
      activeHazard.center.lat, activeHazard.center.lng,
    )
    const zone = getHazardZone(distKm, activeHazard.radii)
    const overrideLevel = zoneToAlertLevel(zone)
    const advisory = getHazardAdvisory(activeHazard.type)
    return { distKm, zone, overrideLevel, advisory }
  })()

  const effectiveAlertLevel: AlertLevel =
    hazardInfo?.overrideLevel ??
    status?.alert_level ??
    'Normal'

  const alertCfg = (city && barangay)
    ? (ALERT_CONFIG[effectiveAlertLevel] ?? ALERT_CONFIG['Normal'])
    : status
      ? (ALERT_CONFIG[status.alert_level] ?? ALERT_CONFIG['Normal'])
      : null

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    background: '#0d1117',
    border: '1px solid #30363d',
    color: '#fff',
    borderRadius: 4,
    fontSize: '0.82rem',
    fontFamily: 'Inter, monospace',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── 0. Active Disaster Banner ──────────────────────────────────────── */}
      {activeHazard?.isActive && (
        <div style={{
          background: '#3d1a1a', 
          border: '1px solid #da3633', 
          borderRadius: 6, 
          padding: 16,
          boxShadow: '0 4px 12px rgba(218, 54, 51, 0.15)'
        }}>
          <p style={{ margin: '0 0 4px', fontSize: '0.65rem', color: '#ff4d4d', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>
            ⚠️ Active Disaster Warning
          </p>
          <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>
            {activeHazard.type}
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#e6edf3', lineHeight: 1.5 }}>
            A <strong>{activeHazard.type.toLowerCase()}</strong> hazard zone is currently being monitored on the map. Please stay alert and follow local advisories.
          </p>
        </div>
      )}

      {/* ── 1. Location Selector ─────────────────────────────────────────── */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 6, padding: 16 }}>
        <p style={{ margin: '0 0 4px', fontSize: '0.65rem', color: '#58a6ff', letterSpacing: 2, textTransform: 'uppercase' }}>
          Check Your Area
        </p>
        <p style={{ margin: '0 0 14px', fontSize: '0.78rem', color: '#8b949e', lineHeight: 1.5 }}>
          Select your city and barangay to see the current status and advisories for your area.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <select value={city} onChange={(e) => handleCityChange(e.target.value)} style={selectStyle}>
            <option value="">— Select City —</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={barangay}
            onChange={(e) => handleBarangayChange(e.target.value)}
            disabled={!city || barangays.length === 0}
            style={{ ...selectStyle, opacity: !city ? 0.5 : 1 }}
          >
            <option value="">— Select Barangay —</option>
            {barangays.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {/* ── 2. Area Status ───────────────────────────────────────────────── */}
      {city && barangay && (
        <>
          {fetching && (
            <p style={{ fontSize: '0.75rem', color: '#8b949e', textAlign: 'center', margin: 0 }}>
              Loading area status…
            </p>
          )}

          {noData && !fetching && (
            <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 6, padding: 14 }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#8b949e', textAlign: 'center' }}>
                No status posted yet for {barangay}, {city}.
              </p>
            </div>
          )}

          {/* ── Hazard-Aware Advisory ──────────────────────────────────── */}
          {hazardInfo && (
            <div style={{
              background: '#1e1409',
              border: '1px solid #9e6a03',
              borderRadius: 6,
              padding: 16,
              boxShadow: '0 4px 12px rgba(158, 106, 3, 0.15)',
            }}>
              <p style={{ margin: '0 0 4px', fontSize: '0.65rem', color: '#d29922', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>
                ⚡ Hazard-Aware Advisory
              </p>
              <p style={{ margin: '0 0 8px', fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                {activeHazard!.type} · {ZONE_LABEL[hazardInfo.zone]}
              </p>
              <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: '#8b949e' }}>
                Your area is approximately <strong style={{ color: '#e6edf3' }}>{hazardInfo.distKm.toFixed(1)} km</strong> from the hazard center.
                {hazardInfo.overrideLevel && (
                  <> Alert level has been automatically elevated to <strong style={{ color: ALERT_CONFIG[hazardInfo.overrideLevel].color }}>{hazardInfo.overrideLevel}</strong>.</>
                )}
              </p>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#e6edf3', lineHeight: 1.6, borderTop: '1px solid #3d2b05', paddingTop: 10 }}>
                {hazardInfo.advisory}
              </p>
            </div>
          )}

          {status && alertCfg && (
            <>
              {/* Alert Level */}
              <div
                style={{
                  background: alertCfg.bg,
                  border: `1px solid ${alertCfg.border}`,
                  borderRadius: 6,
                  padding: 16,
                }}
              >
                <p style={{ margin: '0 0 6px', fontSize: '0.65rem', color: '#8b949e', letterSpacing: 2, textTransform: 'uppercase' }}>
                  Barangay Alert Level
                </p>
                <p style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700, color: alertCfg.color }}>
                  {alertCfg.icon} {effectiveAlertLevel}
                </p>
                <p style={{ margin: 0, fontSize: '0.68rem', color: '#8b949e' }}>
                  {barangay}, {city} · Updated {new Date(status.updated_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                  {hazardInfo?.overrideLevel && (
                    <> · <span style={{ color: '#d29922' }}>Auto-elevated by hazard proximity</span></>
                  )}
                </p>
              </div>

              {/* LGU Advisory */}
              {status.advisory && (
                <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 6, padding: 16 }}>
                  <p style={{ margin: '0 0 8px', fontSize: '0.65rem', color: '#8b949e', letterSpacing: 2, textTransform: 'uppercase' }}>
                    LGU Advisory
                  </p>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#e6edf3', lineHeight: 1.6 }}>
                    {status.advisory}
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── 3. CTA Cards ────────────────────────────────────────────────── */}

      {/* Hotlines Card */}
      {city && (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 6, padding: 16 }}>
          <p style={{ margin: '0 0 12px', fontSize: '0.65rem', color: '#8b949e', letterSpacing: 2, textTransform: 'uppercase' }}>
            Emergency Hotlines · {city}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {hotlines.map(({ label, number }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  background: '#0d1117',
                  borderRadius: 4,
                  border: '1px solid #21262d',
                }}
              >
                <span style={{ fontSize: '0.75rem', color: '#8b949e' }}>{label}</span>
                <a
                  href={`tel:${number.replace(/\D/g, '')}`}
                  style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3fb950', textDecoration: 'none', letterSpacing: 0.5 }}
                >
                  {number}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No city selected yet — show generic 911 */}
      {!city && (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 6, padding: 16 }}>
          <p style={{ margin: '0 0 12px', fontSize: '0.65rem', color: '#8b949e', letterSpacing: 2, textTransform: 'uppercase' }}>
            Emergency Hotlines
          </p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 10px',
              background: '#0d1117',
              borderRadius: 4,
              border: '1px solid #21262d',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: '#8b949e' }}>National Emergency</span>
            <a
              href="tel:911"
              style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3fb950', textDecoration: 'none', letterSpacing: 0.5 }}
            >
              911
            </a>
          </div>
          <p style={{ margin: '10px 0 0', fontSize: '0.7rem', color: '#8b949e' }}>
            Select your city above to see local DRRMO numbers.
          </p>
        </div>
      )}
    </div>
  )
}
