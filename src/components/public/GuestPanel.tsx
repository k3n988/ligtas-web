'use client'
// src/components/public/GuestPanel.tsx

import { useEffect, useRef, useState } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useHouseholdStore } from '@/store/householdStore'

// ── Location data ────────────────────────────────────────────────────────────

const CITIES = [
  'Bacolod City', 'Bago City', 'Cadiz City', 'Escalante City',
  'Himamaylan City', 'Kabankalan City', 'La Carlota City',
  'Sagay City', 'San Carlos City', 'Silay City', 'Talisay City', 'Victorias City',
]

const BARANGAYS_BY_CITY: Record<string, string[]> = {
  'Bacolod City': [
    'Alijis', 'Banago', 'Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4',
    'Barangay 5', 'Barangay 6', 'Barangay 7', 'Barangay 8', 'Barangay 9', 'Barangay 10',
    'Barangay 11', 'Barangay 12', 'Barangay 13', 'Barangay 14', 'Barangay 15',
    'Barangay 16', 'Barangay 17', 'Barangay 18', 'Barangay 19', 'Barangay 20',
    'Barangay 21', 'Barangay 22', 'Barangay 23', 'Barangay 24', 'Barangay 25',
    'Barangay 26', 'Barangay 27', 'Barangay 28', 'Barangay 29', 'Barangay 30',
    'Bata', 'Cabug', 'Estefania', 'Felisa', 'Granada', 'Handumanan',
    'Lacson', 'Lag-itan', 'Lupit', 'Mandalagan', 'Mansilingan', 'Montevista',
    'Pahanocoy', 'Panaad', 'Singcang-Airport', 'Sum-ag', 'Taculing',
    'Tangub', 'Tapia', 'Villamonte', 'Vista Alegre',
  ].sort(),
  'Talisay City': [
    'Binubuhan', 'Cabug', 'Cambuhawe', 'Ceres', 'City Proper', 'Efigenio Lizares',
    'Gmcr', 'New Frontier', 'North City', 'Olympia', 'Pilar', 'Tabao Proper',
    'Tabao-Bulad', 'Tabao-Gabus', 'Talisa', 'Tangub', 'Tinago',
  ].sort(),
  'Silay City': [
    'Balarin', 'Biga-a', 'Binubutan', 'Bobog', 'Cabanbanan', 'Cabilauan',
    'Caña-an', 'Guinhalaran', 'Lantad', 'Patag', 'Rizal', 'Utod', 'Victorias',
  ].sort(),
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
  const setShowModal = useAuthStore((s) => s.setShowModal)
  const setAuthTab = useAuthStore((s) => s.setAuthTab) // <-- ADDED: Destructure setAuthTab from store
  const setPanToCoords = useHouseholdStore((s) => s.setPanToCoords)
  const geocodingLib = useMapsLibrary('geocoding')
  const geocoder = useRef<google.maps.Geocoder | null>(null)

  useEffect(() => {
    if (geocodingLib) geocoder.current = new geocodingLib.Geocoder()
  }, [geocodingLib])

  function geocodeAndPan(q: string, zoom: number) {
    if (!geocoder.current) return
    geocoder.current.geocode(
      { address: q, componentRestrictions: { country: 'ph' } },
      (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const loc = results[0].geometry.location
          setPanToCoords({ lat: loc.lat(), lng: loc.lng(), zoom })
        }
      },
    )
  }

  const [city, setCity] = useState('')
  const [barangay, setBarangay] = useState('')
  const [status, setStatus] = useState<AreaStatus | null>(null)
  const [fetching, setFetching] = useState(false)
  const [noData, setNoData] = useState(false)

  const barangays = city ? (BARANGAYS_BY_CITY[city] ?? []) : []
  const hotlines = city ? (HOTLINES[city] ?? [{ label: 'National Emergency', number: '911' }]) : []

  // Fetch area status when barangay is selected
  useEffect(() => {
    if (!city || !barangay) { setStatus(null); setNoData(false); return }

    setFetching(true)
    setNoData(false)
    supabase
      .from('area_status')
      .select('alert_level, advisory, updated_at')
      .eq('city', city)
      .eq('barangay', barangay)
      .single()
      .then(({ data, error }) => {
        setFetching(false)
        if (error || !data) { setNoData(true); return }
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
    if (!b || !city) return
    geocodeAndPan(`${b}, ${city}, Philippines`, 16)
  }

  const alertCfg = status ? (ALERT_CONFIG[status.alert_level] ?? ALERT_CONFIG['Normal']) : null

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
                  {alertCfg.icon} {status.alert_level}
                </p>
                <p style={{ margin: 0, fontSize: '0.68rem', color: '#8b949e' }}>
                  {barangay}, {city} · Updated {new Date(status.updated_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>

              {/* Advisory */}
              {status.advisory && (
                <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 6, padding: 16 }}>
                  <p style={{ margin: '0 0 8px', fontSize: '0.65rem', color: '#8b949e', letterSpacing: 2, textTransform: 'uppercase' }}>
                    Active Advisory
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

      {/* Register Card */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 6, padding: 16 }}>
        <p style={{ margin: '0 0 6px', fontSize: '0.65rem', color: '#58a6ff', letterSpacing: 2, textTransform: 'uppercase' }}>
          Are you a vulnerable household?
        </p>
        <p style={{ margin: '0 0 14px', fontSize: '0.78rem', color: '#8b949e', lineHeight: 1.6 }}>
          Make sure rescuers know you are there. Register seniors, PWDs, bedridden, and infants before a disaster strikes — so they are first on the priority list.
        </p>
        <button
          // <-- UPDATED: First switch to 'signup' tab, then open the modal
          onClick={() => {
            setAuthTab('signup')
            setShowModal(true)
          }}
          style={{
            width: '100%',
            padding: '10px',
            background: '#1f6feb',
            border: 'none',
            color: '#fff',
            borderRadius: 4,
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: 1,
            cursor: 'pointer',
          }}
        >
          REGISTER NOW →
        </button>
      </div>

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