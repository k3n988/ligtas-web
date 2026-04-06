'use client'
// src/components/registration/RegistrationForm.tsx

import { useEffect, useRef, useState } from 'react'
import { useHouseholdStore } from '@/store/householdStore'
import { assessTriage } from '@/lib/triage'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { supabase } from '@/lib/supabase'
import type { RegistrySource, Vulnerability } from '@/types'
import TriagePreview from './TriagePreview'
import PasswordModal from './PasswordModal'

// ── Credential helpers ────────────────────────────────────────────────────────
function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const arr   = new Uint8Array(8)
  crypto.getRandomValues(arr)
  return Array.from(arr).map((n) => chars[n % chars.length]).join('')
}

async function hashPassword(plain: string): Promise<string> {
  const encoded = new TextEncoder().encode(plain + 'LIGTAS_SALT_2025')
  const buf     = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R   = 6_371_000
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─────────────────────────────────────────────────────────────────────────────

const SOURCE_OPTIONS: { value: RegistrySource; label: string }[] = [
  { value: 'Senior Citizen Registry', label: 'Senior Citizen Registry (OSCA)'     },
  { value: 'PWD Registry',            label: 'PWD Registry (CPDAO)'               },
  { value: 'Maternal Health Record',  label: 'Maternal Health Record (RHU/BHW)'   },
  { value: 'CSWDO Database',          label: 'CSWDO Database'                     },
  { value: 'BHW Field Survey',        label: 'BHW Field Survey / Community Round' },
]

const VULN_OPTIONS: { value: Vulnerability; label: string }[] = [
  { value: 'Bedridden',  label: 'Bedridden'       },
  { value: 'Senior',     label: 'Senior Citizen'   },
  { value: 'Wheelchair', label: 'Wheelchair User'  },
  { value: 'Infant',     label: 'Infant / Toddler' },
  { value: 'Pregnant',   label: 'Pregnant'         },
  { value: 'PWD',        label: 'PWD'              },
  { value: 'Oxygen',     label: 'Oxygen Dependent' },
  { value: 'Dialysis',   label: 'Dialysis Patient' },
]

const CITY_BARANGAY_MAP: Record<string, string[]> = {
  'Bacolod City': ['Alangilan', 'Alicante', 'Banago', 'Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5', 'Barangay 6', 'Barangay 7', 'Barangay 8', 'Barangay 9', 'Barangay 10', 'Barangay 11', 'Barangay 12', 'Barangay 13', 'Barangay 14', 'Barangay 15', 'Barangay 16', 'Barangay 17', 'Barangay 18', 'Barangay 19', 'Barangay 20', 'Barangay 21', 'Barangay 22', 'Barangay 23', 'Barangay 24', 'Barangay 25', 'Barangay 26', 'Barangay 27', 'Barangay 28', 'Barangay 29', 'Barangay 30', 'Barangay 31', 'Barangay 32', 'Barangay 33', 'Barangay 34', 'Barangay 35', 'Barangay 36', 'Barangay 37', 'Barangay 38', 'Barangay 39', 'Barangay 40', 'Barangay 41', 'Bata', 'Cabug', 'Estefania', 'Felisa', 'Granada', 'Handumanan', 'Mandalagan', 'Mansilingan', 'Pahanocoy', 'Punta Taytay', 'Singcang', 'Sum-ag', 'Tangub', 'Vista Alegre'],
  'Bago City':    ['Abuanan', 'Alanza', 'Atipuluan', 'Bacong', 'Bagroy', 'Balingasag', 'Binubuhan', 'Busay', 'Calumangan', 'Caridad', 'Don Jorge L. Araneta', 'Dulao', 'Ilijan', 'Ma-ao', 'Mailum', 'Malingin', 'Napoles', 'Pacol', 'Poblacion', 'Sagasa', 'Sampinit', 'Tabunan', 'Taloc', 'Ubay'],
  'Cadiz City':   ['Andres Bonifacio', 'Burgos', 'Cabahug', 'Cadiz Viejo', 'Caduha-an', 'Celestino Villacin', 'Daga', 'Jerusalem', 'Luna', 'Mabini', 'Magsaysay', 'Sicaba', 'Tiglawigan', 'Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5', 'Zone 6'],
  'Murcia':       ['Abejuvela', 'Amaya', 'Anahaw', 'Buenavista', 'Caliban', 'Canlandog', 'Cansilayan', 'Damsite', 'Iglau-an', 'Lopez Jaena', 'Minoyan', 'Pandanon', 'Salvacion', 'San Miguel', 'Santa Cruz', 'Santa Rosa', 'Talotog', 'Zone I', 'Zone II', 'Zone III', 'Zone IV', 'Zone V'],
  'Sagay City':   ['Bato', 'Baviera', 'Bulanon', 'Campo Himoga-an', 'Campo Santiago', 'Colonia Divina', 'Fabrica', 'General Luna', 'Himoga-an Baybay', 'Lopez Jaena', 'Malubon', 'Molocaboc', 'Old Sagay', 'Plaridel', 'Poblacion I', 'Poblacion II', 'Rizal', 'Sewane', 'Taba-ao', 'Tadlong', 'Vito'],
  'Silay City':   ['Bagtic', 'Balaring', 'Barangay I', 'Barangay II', 'Barangay III', 'Barangay IV', 'Barangay V', 'Guimbala-on', 'Guinhalaran', 'Kapitan Ramon', 'Lantad', 'Mambulac', 'Patag', 'Rizal'],
  'Talisay City': ['Bubog', 'Cabacungan', 'Concepcion', 'Dos Hermanas', 'Efigenio Lizares', 'Katubhan', 'Matab-ang', 'Poblacion', 'San Fernando', 'Tanza', 'Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 4-A', 'Zone 5', 'Zone 6', 'Zone 7', 'Zone 8', 'Zone 9', 'Zone 10', 'Zone 11', 'Zone 12', 'Zone 12-A', 'Zone 14', 'Zone 14-A', 'Zone 14-B', 'Zone 15', 'Zone 16'],
  'Victorias City': ['Barangay I', 'Barangay II', 'Barangay III', 'Barangay IV', 'Barangay V', 'Barangay VI', 'Barangay VII', 'Barangay VIII', 'Barangay IX', 'Barangay X', 'Barangay XI', 'Barangay XII', 'Barangay XIII', 'Barangay XIV', 'Barangay XV', 'Barangay XVI', 'Barangay XVII', 'Barangay XVIII', 'Barangay XIX', 'Barangay XX', 'Barangay XXI'],
}

const CITY_OPTIONS = Object.keys(CITY_BARANGAY_MAP).sort()

/** Resolves cityVal to the exact key in CITY_BARANGAY_MAP.
 *  Handles geocoder mismatches like "Bacolod" → "Bacolod City" */
function resolveMapKey(cityVal: string): string | null {
  if (!cityVal) return null
  const normalized = cityVal.trim().toLowerCase()

  // 1. Exact match
  if (CITY_BARANGAY_MAP[cityVal]) return cityVal

  // 2. Case-insensitive exact match
  const exactCI = Object.keys(CITY_BARANGAY_MAP).find(
    (k) => k.toLowerCase() === normalized
  )
  if (exactCI) return exactCI

  // 3. Geocoder returns "Bacolod" → match "Bacolod City", etc.
  //    Only allow "X" → "X City", not broad substring matching
  const withCity = normalized.endsWith(' city') ? normalized : normalized + ' city'
  const cityMatch = Object.keys(CITY_BARANGAY_MAP).find(
    (k) => k.toLowerCase() === withCity
  )
  if (cityMatch) return cityMatch

  // 4. Reverse: geocoder returns "Bago City" → strip " city" and try
  const withoutCity = normalized.replace(/ city$/, '').trim()
  const reverseMatch = Object.keys(CITY_BARANGAY_MAP).find(
    (k) => k.toLowerCase().replace(/ city$/, '') === withoutCity
  )
  if (reverseMatch) return reverseMatch

  return null
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  background: '#0d1117',
  border: '1px solid var(--border-color)',
  color: '#fff',
  borderRadius: 4,
  boxSizing: 'border-box',
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.85rem',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  marginBottom: 5,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  fontWeight: 500,
}

const subHeaderStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 800,
  color: '#fff',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  marginBottom: 12,
  borderLeft: '4px solid var(--accent-blue)',
  paddingLeft: 10,
}

// ─────────────────────────────────────────────────────────────────────────────
export default function RegistrationForm() {
  const addHousehold       = useHouseholdStore((s) => s.addHousehold)
  const households         = useHouseholdStore((s) => s.households)
  const setPickingLocation = useHouseholdStore((s) => s.setPickingLocation)
  const pendingCoords      = useHouseholdStore((s) => s.pendingCoords)
  const setPendingCoords   = useHouseholdStore((s) => s.setPendingCoords)

  const geocodingLib = useMapsLibrary('geocoding')
  const geocoderRef  = useRef<google.maps.Geocoder | null>(null)
  const formRef      = useRef<HTMLFormElement>(null)
  const fileRef      = useRef<HTMLInputElement>(null)

  // ── Coords ───────────────────────────────────────────────────────────────
  const [lat,           setLat]           = useState<number | null>(null)
  const [lng,           setLng]           = useState<number | null>(null)
  const [coordsDisplay, setCoordsDisplay] = useState('')
  const [locating,      setLocating]      = useState(false)
  const [gpsAccuracy,   setGpsAccuracy]   = useState<number | null>(null)
  const [pinSource,     setPinSource]     = useState<'gps' | 'map' | null>(null)

  // ── Address — city auto-filled, barangay + street always manual ──────────
  const [geocoding,  setGeocoding]  = useState(false)
  const [cityVal,    setCityVal]    = useState('')       // auto-filled from geocode
  const [barangayVal, setBarangayVal] = useState('')    // always manual dropdown
  const [streetVal,  setStreetVal]  = useState('')      // always manual text input

  // ── Form ─────────────────────────────────────────────────────────────────
  const [vulnArr,   setVulnArr]   = useState<Vulnerability[]>([])
  const [sourceVal, setSourceVal] = useState<RegistrySource | ''>('')
  const [saving,    setSaving]    = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [credModal, setCredModal] = useState<{ contact: string; password: string } | null>(null)

  useEffect(() => {
    if (geocodingLib && !geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder()
    }
  }, [geocodingLib])

  // ── Reverse geocode — only extracts city ─────────────────────────────────
  const detectCity = (pLat: number, pLng: number, fillStreet = false) => {
    if (!geocoderRef.current) return
    setGeocoding(true)
  
    geocoderRef.current.geocode({ location: { lat: pLat, lng: pLng } }, (results, status) => {
      setGeocoding(false)
      if (status !== 'OK' || !results?.length) return
  
      const comps = results[0].address_components
  
      // Try each tier from most to least specific
      const cityComp =
        comps.find(c => c.types.includes('locality'))                    ||
        comps.find(c => c.types.includes('administrative_area_level_3')) ||
        comps.find(c => c.types.includes('administrative_area_level_2')) ||
        comps.find(c => c.types.includes('administrative_area_level_1'))
  
      const rawCity = cityComp?.long_name?.trim() ?? ''
  
      // Validate against our map — prevents province/region names being set as city
      let resolved = resolveMapKey(rawCity)
      if (!resolved) resolved = resolveMapKey(rawCity + ' City')
  
      if (resolved) {
        setCityVal(resolved)
        setBarangayVal('')
      }
  
      // Street — PH geocoder returns street info with empty types[]
      // so we extract from formatted_address directly instead
      if (fillStreet) {
        const formattedParts = results[0].formatted_address?.split(',') ?? []
  
        // formatted_address = "Door 2, Lot 8, Pueblo San Antonio, Talisay, Negros Occidental, Philippines"
        // Strip last 3 segments (city, province, country) — keep everything before
        const streetParts = formattedParts
          .slice(0, -3)
          .map(p => p.trim())
          .filter(Boolean)
  
        const street = streetParts.join(', ')
        if (street) setStreetVal(street)
      }
    })
  }

  // ── Sync map pin ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pendingCoords) return
    setLat(pendingCoords.lat)
    setLng(pendingCoords.lng)
    setCoordsDisplay(`${pendingCoords.lat.toFixed(6)}, ${pendingCoords.lng.toFixed(6)}`)
    setPinSource('map')
    setGpsAccuracy(null)
    detectCity(pendingCoords.lat, pendingCoords.lng)
  }, [pendingCoords]) // eslint-disable-line react-hooks/exhaustive-deps

  const triage = assessTriage(vulnArr)
  const resolvedCityKey = resolveMapKey(cityVal)
  const toggleVuln = (v: Vulnerability) =>
    setVulnArr((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v])

  // ── GPS capture ───────────────────────────────────────────────────────────
  const getLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    setCoordsDisplay('Capturing GPS…')
    setGpsAccuracy(null)
    setSaveError(null)

    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => {
        setLat(c.latitude)
        setLng(c.longitude)
        setCoordsDisplay(`${c.latitude.toFixed(6)}, ${c.longitude.toFixed(6)}`)
        setGpsAccuracy(Math.round(c.accuracy))
        setPinSource('gps')
        setPendingCoords({ lat: c.latitude, lng: c.longitude })
        setLocating(false)
        detectCity(c.latitude, c.longitude, true)

      },
      (err) => {
        setCoordsDisplay('')
        setLocating(false)
        setPinSource(null)
        setGpsAccuracy(null)
        setSaveError('GPS failed: ' + err.message)
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    )
  }

  // ── Full address preview ──────────────────────────────────────────────────
  const fullAddressPreview = [streetVal, barangayVal, cityVal, 'Negros Occidental']
    .filter(Boolean).join(', ')

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetForm = () => {
    formRef.current?.reset()
    setVulnArr([])
    setLat(null); setLng(null)
    setCoordsDisplay(''); setPinSource(null); setGpsAccuracy(null); setPendingCoords(null)
    setSourceVal(''); setCityVal(''); setBarangayVal(''); setStreetVal('')
    setSaveError(null)
  }

  // ── Duplicate check ───────────────────────────────────────────────────────
  const detectDuplicate = (contact: string, pLat: number, pLng: number) => {
    for (const hh of households) {
      if (hh.contact === contact)
        return { isDuplicate: true, reason: `Contact ${contact} already registered (${hh.id}).` }
      if (haversineMeters(pLat, pLng, hh.lat, hh.lng) <= 10)
        return { isDuplicate: true, reason: `Household within 10 m already exists (${hh.id} — ${hh.head}).` }
    }
    return { isDuplicate: false, reason: '' }
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaveError(null)

    if (!pinSource) {
      setSaveError('Please pin a location using GPS or the map before submitting.')
      return
    }
    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
      setSaveError('Invalid coordinates. Please re-pin the location.')
      return
    }
    if (!barangayVal.trim()) {
      setSaveError('Please select a barangay.')
      return
    }

    const form       = e.currentTarget
    const fd         = new FormData(form)
    const source     = fd.get('source')   as RegistrySource
    const contactVal = (fd.get('contact') as string).trim()
    const id         = 'HH-' + Date.now().toString().slice(-6)

    const fullAddress = [streetVal, barangayVal, cityVal, 'Negros Occidental']
      .filter(Boolean).join(', ')

    const { isDuplicate, reason } = detectDuplicate(contactVal, lat, lng)
    if (isDuplicate) { setSaveError(`⚠ Duplicate detected — ${reason}`); return }

    setSaving(true)
    try {
      let documentUrl: string | undefined
      const file = fileRef.current?.files?.[0]
      if (source === 'Self-Reported' && file) {
        const { data: up, error: ue } = await supabase.storage
          .from('verification-docs')
          .upload(`${id}/${file.name}`, file, { upsert: true })
        if (ue) throw ue
        const { data: ud } = supabase.storage.from('verification-docs').getPublicUrl(up.path)
        documentUrl = ud.publicUrl
      }

      const plainPassword = generatePassword()
      const passwordHash  = await hashPassword(plainPassword)

      await addHousehold({
        id,
        lat, lng,
        city: cityVal,
        barangay: barangayVal,
        purok: (fd.get('purok') as string) || 'N/A',
        street: streetVal,
        fullAddress,
        structure: 'N/A',
        head: fd.get('head') as string,
        contact: contactVal,
        occupants: parseInt(fd.get('occupants') as string, 10),
        vulnArr,
        notes: (fd.get('notes') as string) || '',
        source,
        status: 'Pending',
        triage,
        approvalStatus: source === 'Self-Reported' ? 'pending_review' : 'approved',
        documentUrl,
        citizenPasswordHash: passwordHash,
        gpsAccuracy: gpsAccuracy ?? undefined,
        pinSource: pinSource ?? undefined,
      })

      resetForm()
      setCredModal({ contact: contactVal, password: plainPassword })
    } catch (err) {
      console.error('[LIGTAS] handleSubmit:', err)
      setSaveError('Failed to save. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit}>

        {/* LGU header */}
        <div style={{ background: '#0000c3', borderLeft: '3px solid var(--accent-blue)', borderRadius: 4, padding: '10px 14px', marginBottom: 20, fontSize: '0.75rem', lineHeight: 1.6 }}>
          <strong style={{ color: '#fff', display: 'block', marginBottom: 2, fontSize: '0.85rem' }}>
            📋 LGU Vulnerability Registry — Authorized Personnel Only
          </strong>
          <span style={{ color: '#e9d5ff' }}>
            For use by Barangay Health Workers (BHWs), CSWDO, and LGU field staff to digitize existing registries pre-disaster.
          </span>
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* 1. RESCUE LOCATION                                           */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: 16, marginBottom: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          <h3 style={subHeaderStyle}>1. Rescue Location</h3>

          {/* Pin status row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Latitude, Longitude</label>
            {pinSource && (
              <span style={{ fontSize: '0.68rem', color: pinSource === 'map' ? '#58a6ff' : '#238636', fontWeight: 600 }}>
                {pinSource === 'map' ? '🗺 Pinned on map' : '📡 GPS captured'}
                {gpsAccuracy !== null && ` · ±${gpsAccuracy} m`}
              </span>
            )}
          </div>

          {/* Coords */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
            <input
              style={{ ...inputStyle, color: pinSource ? '#58a6ff' : '#fff', fontVariantNumeric: 'tabular-nums' }}
              type="text"
              value={coordsDisplay}
              onChange={(e) => {
                const raw = e.target.value
                setCoordsDisplay(raw)
                setPinSource(null); setPendingCoords(null); setGpsAccuracy(null)
                const parts = raw.split(',').map((n) => parseFloat(n.trim()))
                if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                  setLat(parts[0]); setLng(parts[1])
                } else { setLat(null); setLng(null) }
              }}
              placeholder="e.g. 10.676553, 122.954105"
              required
              readOnly={locating}
            />

            <button type="button" onClick={() => setPickingLocation(true)} style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid var(--accent-blue)', color: 'var(--accent-blue)', borderRadius: 4, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 800 }}>
              🗺 MANUALLY ADJUST PIN
            </button>
          </div>

          {/* Detecting city spinner */}
          {geocoding && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#58a6ff', fontSize: '0.78rem', marginBottom: 10, fontWeight: 500 }}>
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>🔄</span>
              Detecting city…
            </div>
          )}

          {/* City (auto) + Barangay (manual dropdown) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>

            {/* City — auto-filled, user can still change */}
            <div>
              <label style={labelStyle}>
                City
                {geocoding
                  ? <span style={{ marginLeft: 6, fontSize: '0.65rem', color: '#58a6ff', fontWeight: 400, textTransform: 'none' }}>detecting…</span>
                  : cityVal
                    ? <span style={{ marginLeft: 6, fontSize: '0.65rem', color: '#238636', fontWeight: 600, textTransform: 'none' }}>✓ auto-filled</span>
                    : null
                }
              </label>
              <select
                name="city"
                required
                style={inputStyle}
                value={cityVal}
                onChange={(e) => {
                  setCityVal(e.target.value)
                  setBarangayVal('') // reset brgy when city changes
                }}
              >
                <option value="" disabled>Select City</option>
                {CITY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Barangay — always manual dropdown */}
            <div>
              <label style={labelStyle}>
                Barangay
                <span style={{ marginLeft: 6, fontSize: '0.65rem', color: '#f0a500', fontWeight: 600, textTransform: 'none' }}>✎ manual</span>
              </label>
              <select
                name="barangay"
                required
                style={inputStyle}
                value={barangayVal}
                onChange={(e) => setBarangayVal(e.target.value)}
              >
                <option value="" disabled>Select Barangay</option>
                {resolvedCityKey
                  // Exact/resolved city match → flat list for that city only
                  ? CITY_BARANGAY_MAP[resolvedCityKey].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))
                  // No match or no city selected → all barangays grouped by city
                  : Object.entries(CITY_BARANGAY_MAP)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([city, bgs]) => (
                        <optgroup key={city} label={city}>
                          {bgs.map((b) => (
                            <option key={`${city}-${b}`} value={b}>{b}</option>
                          ))}
                        </optgroup>
                      ))
                }
              </select>
            </div>
          </div>

          {/* Street — always manual */}
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Street / Landmark</label>
            <input
              name="street"
              type="text"
              placeholder="House #, Street, or Landmark"
              required
              style={inputStyle}
              value={streetVal}
              onChange={(e) => setStreetVal(e.target.value)}
            />
          </div>

          {/* Full address preview */}
          {(streetVal || barangayVal || cityVal) && !geocoding && (
            <div style={{ padding: '8px 10px', background: '#161b22', border: '1px dashed #30363d', borderRadius: 4, fontSize: '0.75rem', color: '#8b949e', lineHeight: 1.5 }}>
              <span style={{ color: '#58a6ff', fontWeight: 700, marginRight: 6 }}>📌</span>
              {fullAddressPreview}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* 2. TRIAGE INTELLIGENCE                                       */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div style={{ marginBottom: 25, background: '#161b22', padding: 16, borderRadius: 8, border: '1px solid #30363d' }}>
          <h3 style={subHeaderStyle}>2. Triage Intelligence</h3>
          <label style={{ ...labelStyle, marginTop: 15 }}>Vulnerability Profile</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#0d1117', padding: 12, borderRadius: 4, border: '1px solid var(--border-color)', marginBottom: 12 }}>
            {VULN_OPTIONS.map(({ value, label }) => (
              <label key={value} style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', cursor: 'pointer', background: vulnArr.includes(value) ? '#30363d' : 'transparent', padding: '6px 10px', borderRadius: '20px', border: `1px solid ${vulnArr.includes(value) ? '#58a6ff' : '#30363d'}`, color: (value === 'Bedridden' || value === 'Oxygen') && vulnArr.includes(value) ? '#ff4d4d' : '#c9d1d9' }}>
                <input type="checkbox" checked={vulnArr.includes(value)} onChange={() => toggleVuln(value)} style={{ width: 'auto', marginRight: 8, cursor: 'pointer' }} />
                {label}
              </label>
            ))}
          </div>
          <TriagePreview triage={triage} />
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* 3. HOUSEHOLD INFORMATION                                     */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div style={{ marginBottom: 25, opacity: 0.9 }}>
          <h3 style={subHeaderStyle}>3. Household Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Head of Household / Patient Name</label>
              <input name="head" type="text" placeholder="Full Name" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Contact Number</label>
              <input name="contact" type="tel" placeholder="09xxxxxxxxx" required pattern="^(09|\+639)\d{9}$" title="Enter a valid PH mobile number (e.g. 09171234567)" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Total Occupants</label>
              <input name="occupants" type="number" min="1" defaultValue="1" required style={inputStyle} />
            </div>
          </div>
          <div style={{ marginTop: 15 }}>
            <label style={labelStyle}>Data Source / Registry</label>
            <select name="source" required style={inputStyle} value={sourceVal} onChange={(e) => setSourceVal(e.target.value as RegistrySource)}>
              <option value="" disabled>Select Source</option>
              {SOURCE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div style={{ marginTop: 15 }}>
            <label style={labelStyle}>Responder / Evacuation Notes</label>
            <textarea name="notes" rows={2} placeholder="Critical instructions (e.g. Needs stretcher, 4 men required)" style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
        </div>

        {/* Error banner */}
        {saveError && (
          <div style={{ background: '#3d1a1a', border: '1px solid #f85149', color: '#f85149', borderRadius: 4, padding: '10px 14px', marginBottom: 16, fontWeight: 600, fontSize: '0.82rem', lineHeight: 1.5 }}>
            {saveError}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={saving || geocoding}
          style={{ width: '100%', padding: 15, background: saving ? '#1a3a5c' : 'var(--accent-blue)', color: saving ? '#8b949e' : '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: saving || geocoding ? 'not-allowed' : 'pointer', marginTop: 10, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', transition: 'background 0.2s', opacity: geocoding ? 0.7 : 1 }}
        >
          {saving ? '⏳ Saving…' : geocoding ? '🔄 Detecting city…' : 'REGISTER & PIN TO VULNERABILITY MAP'}
        </button>
      </form>

          {credModal && (
      <PasswordModal contact={credModal.contact} password={credModal.password} role="citizen" onClose={() => setCredModal(null)} />
    )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  )
}