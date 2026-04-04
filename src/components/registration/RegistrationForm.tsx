'use client'
// src/components/registration/RegistrationForm.tsx

import { useEffect, useRef, useState } from 'react'
import { useHouseholdStore } from '@/store/householdStore'
import { assessTriage } from '@/lib/triage'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { supabase } from '@/lib/supabase'
import type { RegistrySource, Vulnerability } from '@/types'
import TriagePreview from './TriagePreview'

const SOURCE_OPTIONS: { value: RegistrySource; label: string }[] = [
  { value: 'Senior Citizen Registry',  label: 'Senior Citizen Registry (OSCA)'      },
  { value: 'PWD Registry',             label: 'PWD Registry (CPDAO)'                },
  { value: 'Maternal Health Record',   label: 'Maternal Health Record (RHU/BHW)'    },
  { value: 'CSWDO Database',           label: 'CSWDO Database'                      },
  { value: 'BHW Field Survey',         label: 'BHW Field Survey / Community Round'  },
]

const VULN_OPTIONS: { value: Vulnerability; label: string }[] = [
  { value: 'Bedridden',  label: 'Bedridden'         },
  { value: 'Senior',     label: 'Senior Citizen'     },
  { value: 'Wheelchair', label: 'Wheelchair User'    },
  { value: 'Infant',     label: 'Infant / Toddler'   },
  { value: 'Pregnant',   label: 'Pregnant'            },
  { value: 'PWD',        label: 'PWD'                 },
  { value: 'Oxygen',     label: 'Oxygen Dependent'   },
  { value: 'Dialysis',   label: 'Dialysis Patient'   },
]

const CITY_BARANGAY_MAP: Record<string, string[]> = {
  'Bacolod City': ['Alangilan', 'Alicante', 'Banago', 'Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5', 'Barangay 6', 'Barangay 7', 'Barangay 8', 'Barangay 9', 'Barangay 10', 'Barangay 11', 'Barangay 12', 'Barangay 13', 'Barangay 14', 'Barangay 15', 'Barangay 16', 'Barangay 17', 'Barangay 18', 'Barangay 19', 'Barangay 20', 'Barangay 21', 'Barangay 22', 'Barangay 23', 'Barangay 24', 'Barangay 25', 'Barangay 26', 'Barangay 27', 'Barangay 28', 'Barangay 29', 'Barangay 30', 'Barangay 31', 'Barangay 32', 'Barangay 33', 'Barangay 34', 'Barangay 35', 'Barangay 36', 'Barangay 37', 'Barangay 38', 'Barangay 39', 'Barangay 40', 'Barangay 41', 'Bata', 'Cabug', 'Estefania', 'Felisa', 'Granada', 'Handumanan', 'Mandalagan', 'Mansilingan', 'Pahanocoy', 'Punta Taytay', 'Singcang', 'Sum-ag', 'Tangub', 'Vista Alegre'],
  'Bago City': ['Abuanan', 'Alanza', 'Atipuluan', 'Bacong', 'Bagroy', 'Balingasag', 'Binubuhan', 'Busay', 'Calumangan', 'Caridad', 'Don Jorge L. Araneta', 'Dulao', 'Ilijan', 'Ma-ao', 'Mailum', 'Malingin', 'Napoles', 'Pacol', 'Poblacion', 'Sagasa', 'Sampinit', 'Tabunan', 'Taloc', 'Ubay'],
  'Cadiz City': ['Andres Bonifacio', 'Burgos', 'Cabahug', 'Cadiz Viejo', 'Caduha-an', 'Celestino Villacin', 'Daga', 'Jerusalem', 'Luna', 'Mabini', 'Magsaysay', 'Sicaba', 'Tiglawigan', 'Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5', 'Zone 6'],
  'Murcia': ['Abejuvela', 'Amaya', 'Anahaw', 'Buenavista', 'Caliban', 'Canlandog', 'Cansilayan', 'Damsite', 'Iglau-an', 'Lopez Jaena', 'Minoyan', 'Pandanon', 'Salvacion', 'San Miguel', 'Santa Cruz', 'Santa Rosa', 'Talotog', 'Zone I', 'Zone II', 'Zone III', 'Zone IV', 'Zone V'],
  'Sagay City': ['Bato', 'Baviera', 'Bulanon', 'Campo Himoga-an', 'Campo Santiago', 'Colonia Divina', 'Fabrica', 'General Luna', 'Himoga-an Baybay', 'Lopez Jaena', 'Malubon', 'Molocaboc', 'Old Sagay', 'Plaridel', 'Poblacion I', 'Poblacion II', 'Rizal', 'Sewane', 'Taba-ao', 'Tadlong', 'Vito'],
  'Silay City': ['Bagtic', 'Balaring', 'Barangay I', 'Barangay II', 'Barangay III', 'Barangay IV', 'Barangay V', 'Guimbala-on', 'Guinhalaran', 'Kapitan Ramon', 'Lantad', 'Mambulac', 'Patag', 'Rizal'],
  'Talisay City': ['Bubog', 'Cabacungan', 'Concepcion', 'Dos Hermanas', 'Efigenio Lizares', 'Katubhan', 'Matab-ang', 'Poblacion', 'San Fernando', 'Tanza', 'Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 4-A', 'Zone 5', 'Zone 6', 'Zone 7', 'Zone 8', 'Zone 9', 'Zone 10', 'Zone 11', 'Zone 12', 'Zone 12-A', 'Zone 14', 'Zone 14-A', 'Zone 14-B', 'Zone 15', 'Zone 16'],
  'Victorias City': ['Barangay I', 'Barangay II', 'Barangay III', 'Barangay IV', 'Barangay V', 'Barangay VI', 'Barangay VII', 'Barangay VIII', 'Barangay IX', 'Barangay X', 'Barangay XI', 'Barangay XII', 'Barangay XIII', 'Barangay XIV', 'Barangay XV', 'Barangay XVI', 'Barangay XVII', 'Barangay XVIII', 'Barangay XIX', 'Barangay XX', 'Barangay XXI'],
}

const CITY_OPTIONS = Object.keys(CITY_BARANGAY_MAP).sort()

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

const sectionDivider: React.CSSProperties = {
  marginTop: 25,
  borderTop: '1px solid var(--border-color)',
  paddingTop: 15,
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

export default function RegistrationForm() {
  const addHousehold    = useHouseholdStore((s) => s.addHousehold)
  const setPickingLocation = useHouseholdStore((s) => s.setPickingLocation)
  const pendingCoords   = useHouseholdStore((s) => s.pendingCoords)
  const setPendingCoords = useHouseholdStore((s) => s.setPendingCoords)

  const geocodingLib = useMapsLibrary('geocoding')
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)

  const formRef   = useRef<HTMLFormElement>(null)
  const fileRef   = useRef<HTMLInputElement>(null)
  const [coords,      setCoords]      = useState('')
  const [locating,    setLocating]    = useState(false)
  const [pinSource,   setPinSource]   = useState<'gps' | 'map' | null>(null)
  const [vulnArr,     setVulnArr]     = useState<Vulnerability[]>([])
  const [sourceVal,   setSourceVal]   = useState<RegistrySource | ''>('')
  const [cityVal,     setCityVal]     = useState('')
  const [barangayVal, setBarangayVal] = useState('')
  const [streetVal,   setStreetVal]   = useState('')
  const [saved,       setSaved]       = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [saveError,   setSaveError]   = useState<string | null>(null)

  const isSelfReported = sourceVal === 'Self-Reported'

  // Address must be filled before location can be pinned
  const addressReady = Boolean(cityVal && barangayVal && streetVal.trim())

  // Init Geocoder
  useEffect(() => {
    if (geocodingLib && !geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder()
    }
  }, [geocodingLib])

  const updateAddressFromCoords = async (lat: number, lng: number) => {
    if (!geocoderRef.current) return
    geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const components = results[0].address_components
        
        // Map route or formatted_address to setStreetVal
        const route = components.find(c => c.types.includes('route'))?.long_name 
        const streetNumber = components.find(c => c.types.includes('street_number'))?.long_name
        const street = route ? (streetNumber ? `${streetNumber} ${route}` : route) : results[0].formatted_address.split(',')[0]
        if (street) setStreetVal(street)
        
        // City Detection: Look specifically for locality first, then admin_level_2
        const cityComp = components.find(c => c.types.includes('locality')) || 
                         components.find(c => c.types.includes('administrative_area_level_2'));
        const detectedCity = cityComp?.long_name || '';

        // Refine Barangay Logic: detection priority for Philippine sub-districts
        const bgyComp =
          components.find(c => c.types.includes('sublocality_level_1')) || 
          components.find(c => c.types.includes('neighborhood')) ||
          components.find(c => c.types.includes('administrative_area_level_3')) ||
          components.find(c => c.types.includes('sublocality'));
          
        let detectedBarangay = bgyComp ? bgyComp.long_name.trim() : '';

        // Sanitization: Remove "Barangay" or "Brgy" prefixes/suffixes so only the name is stored
        detectedBarangay = detectedBarangay.replace(/Barangay|Brgy\.?/gi, '').trim();

        // Mutual Exclusivity: Clear Barangay if it matches City to prevent duplicates (common in PH geocoding)
        if (detectedBarangay.toLowerCase() === detectedCity.toLowerCase() || !detectedBarangay) {
          detectedBarangay = '';
        }

        if (detectedCity) setCityVal(detectedCity);
        setBarangayVal(detectedBarangay);
      }
    })
  }

  // Sync coords when admin clicks the map
  useEffect(() => {
    if (!pendingCoords) return
    const newCoords = `${pendingCoords.lat.toFixed(6)}, ${pendingCoords.lng.toFixed(6)}`
    setCoords(newCoords)
    setPinSource('map')
    updateAddressFromCoords(pendingCoords.lat, pendingCoords.lng)
  }, [pendingCoords]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss the success banner after 3 s
  useEffect(() => {
    if (!saved) return
    const t = setTimeout(() => setSaved(false), 3000)
    return () => clearTimeout(t)
  }, [saved])

  const triage = assessTriage(vulnArr)

  const toggleVuln = (v: Vulnerability) =>
    setVulnArr((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    )

  const getLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    setCoords('Capturing GPS...')
    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => {
        const lat = c.latitude;
        const lng = c.longitude;
        setCoords(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
        setPinSource('gps')
        setPendingCoords({ lat, lng })
        updateAddressFromCoords(lat, lng)
        setLocating(false)
      },
      (err) => {
        setCoords('')
        setLocating(false); setPinSource(null)
        console.error('GPS Error:', err.message)
      },
    )
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!coords || coords === 'Locating…') return

    const form = e.currentTarget
    const fd   = new FormData(form)
    const [lat, lng] = coords.split(',').map((n) => parseFloat(n.trim()))

    const source = fd.get('source') as RegistrySource
    const id     = 'HH-' + Date.now().toString().slice(-6)

    setSaving(true)
    setSaveError(null)
    try {
      // Upload verification document for self-reported entries
      let documentUrl: string | undefined
      const file = fileRef.current?.files?.[0]
      if (source === 'Self-Reported' && file) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('verification-docs')
          .upload(`${id}/${file.name}`, file, { upsert: true })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage
          .from('verification-docs')
          .getPublicUrl(uploadData.path)
        documentUrl = urlData.publicUrl
      }

      await addHousehold({
        id, lat, lng,
        city:           fd.get('city')       as string,
        barangay:       fd.get('barangay')   as string,
        purok:         (fd.get('purok')      as string) || 'N/A',
        street:         fd.get('street')     as string,
        structure:      fd.get('structure')  as string,
        head:           fd.get('head')       as string,
        contact:        fd.get('contact')    as string,
        occupants:      parseInt(fd.get('occupants') as string, 10),
        vulnArr,
        notes:         (fd.get('notes')      as string) || '',
        source,
        status:         'Pending',
        triage,
        approvalStatus: source === 'Self-Reported' ? 'pending_review' : 'approved',
        documentUrl,
      })
      formRef.current?.reset()
      setVulnArr([])
      setCoords('')
      setPinSource(null)
      setPendingCoords(null) // Fix State Persistence Bug
      setSourceVal('')
      setCityVal('')
      setBarangayVal('')
      setStreetVal('')
      setSaved(true)
    } catch {
      setSaveError('Failed to save. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>

      {/* ── LGU context header ──────────────────────────────────────── */}
      <div
        style={{
          background: '#0000c3',
          borderLeft: '3px solid var(--accent-blue)',
          borderRadius: 4,
          padding: '10px 14px',
          marginBottom: 20,
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: '#fff', display: 'block', marginBottom: 2, fontSize: '0.85rem' }}>
          📋 LGU Vulnerability Registry — Authorized Personnel Only
        </strong>
        <span style={{ color: '#e9d5ff' }}>
          For use by Barangay Health Workers (BHWs), CSWDO, and LGU field staff
          to digitize existing registries pre-disaster.
        </span>
      </div>

      {/* ================================================================= */}
      {/* 1. RESCUE LOCATION (HIGHEST PRIORITY)                             */}
      {/* ================================================================= */}
      <div style={{ 
        background: '#0d1117', 
        border: '1px solid #30363d', 
        borderRadius: 8, 
        padding: 16, 
        marginBottom: 20,
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
      }}>
        <h3 style={subHeaderStyle}>1. Rescue Location</h3>
        
        {/* Map Pinning Actions */}
        <div style={{ marginBottom: 15 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>LATITUDE, LONGITUDE</label>
            {pinSource && (
              <span style={{ fontSize: '0.68rem', color: pinSource === 'map' ? '#58a6ff' : '#238636', fontWeight: 600 }}>
                {pinSource === 'map' ? '🗺 Pinned on map' : '📡 GPS captured'} {barangayVal && ` • ${barangayVal}`}

              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
            <input
              style={inputStyle}
              type="text"
              value={coords}
              onChange={(e) => { setCoords(e.target.value); setPinSource(null); setPendingCoords(null) }}
              placeholder="LATITUDE, LONGITUDE"
              required
              readOnly={locating}
            />
            <button
              type="button"
              onClick={getLocation}
              disabled={locating}
              style={{
                padding: '12px',
                background: '#238636',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 800,
              }}
            >
              {locating ? '⌛ CAPTURING...' : '📍 PIN CURRENT GPS LOCATION'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setPickingLocation(true)}
            style={{
              width: '100%',
              padding: '10px',
              background: 'transparent',
              border: '1px solid var(--accent-blue)',
              color: 'var(--accent-blue)',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 800,
              letterSpacing: '0.02em',
              marginTop: 5
            }}
          >
            🗺 MANUALLY ADJUST PIN
          </button>
        </div>

        {/* Address Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={labelStyle}>City</label>
            <select
              name="city"
              required
              style={inputStyle}
              value={cityVal}
              onChange={(e) => setCityVal(e.target.value)}
            >
              <option value="" disabled>Select City</option>
              {CITY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Barangay</label>
            <select
              name="barangay"
              required
              style={{ ...inputStyle, opacity: cityVal ? 1 : 0.5, cursor: cityVal ? 'pointer' : 'not-allowed', pointerEvents: cityVal ? 'auto' : 'none' }}
              value={barangayVal}
              onChange={(e) => setBarangayVal(e.target.value)}
              disabled={!cityVal}
            >
              <option value="" disabled>{cityVal ? 'Select Barangay' : 'Select City First'}</option>
              {cityVal && CITY_BARANGAY_MAP[cityVal]?.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
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
      </div>

      {/* ================================================================= */}
      {/* 2. TRIAGE INTELLIGENCE (HIGH PRIORITY)                            */}
      {/* ================================================================= */}
      <div style={{ 
        marginBottom: 25, 
        background: '#161b22', 
        padding: 16, 
        borderRadius: 8, 
        border: '1px solid #30363d' 
      }}>
        <h3 style={subHeaderStyle}>2. Triage Intelligence</h3>
        
        <label style={{ ...labelStyle, marginTop: 15 }}>Vulnerability Profile</label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            background: '#0d1117',
            padding: 12,
            borderRadius: 4,
            border: '1px solid var(--border-color)',
            marginBottom: 12
          }}
        >
          {VULN_OPTIONS.map(({ value, label }) => (
            <label
              key={value}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                fontSize: '0.8rem', 
                cursor: 'pointer',
                background: vulnArr.includes(value) ? '#30363d' : 'transparent',
                padding: '6px 10px',
                borderRadius: '20px',
                border: `1px solid ${vulnArr.includes(value) ? '#58a6ff' : '#30363d'}`,
                color: (value === 'Bedridden' || value === 'Oxygen') && vulnArr.includes(value) ? '#ff4d4d' : '#c9d1d9'
              }}
            >
              <input
                type="checkbox"
                checked={vulnArr.includes(value)}
                onChange={() => toggleVuln(value)}
                style={{ width: 'auto', marginRight: 8, cursor: 'pointer' }}
              />
              {label}
            </label>
          ))}
        </div>
        <TriagePreview triage={triage} />
      </div>

      {/* ================================================================= */}
      {/* 3. HOUSEHOLD IDENTITY (ADMINISTRATIVE)                            */}
      {/* ================================================================= */}
      <div style={{ marginBottom: 25, opacity: 0.9 }}>
        <h3 style={subHeaderStyle}>3. Household Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Head of Household / Patient Name</label>
            <input name="head" type="text" placeholder="Full Name" required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Contact Number</label>
            <input name="contact" type="tel" placeholder="0912..." required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Total Occupants</label>
            <input name="occupants" type="number" min="1" defaultValue="1" required style={inputStyle} />
          </div>
        </div>

        <div style={{ marginTop: 15 }}>
          <label style={labelStyle}>Data Source / Registry</label>
          <select 
            name="source" 
            required 
            style={inputStyle} 
            value={sourceVal} 
            onChange={(e) => setSourceVal(e.target.value as RegistrySource)}
          >
            <option value="" disabled>Select Source</option>
            {SOURCE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>

        <div style={{ marginTop: 15 }}>
          <label style={labelStyle}>Responder / Evacuation Notes</label>
          <textarea
            name="notes"
            rows={2}
            placeholder="Critical instructions (e.g. Needs stretcher, 4 men required)"
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>
      </div>

      {/* ── Status Banners ───────────────────────── */}
      {saved && (
        <div
          style={{
            background: isSelfReported ? '#1e1a0e' : '#238636',
            border: isSelfReported ? '1px solid #f39c12' : 'none',
            color: isSelfReported ? '#f39c12' : '#fff',
            borderRadius: 4,
            padding: '10px 14px',
            marginBottom: 16,
            fontWeight: 600,
            fontSize: '0.82rem',
          }}
        >
          {isSelfReported
            ? '⏳ Submitted for admin review. Will appear on map once approved.'
            : '✓ Household registered and pinned to map.'}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        style={{
          width: '100%',
          padding: 15,
          background: saving ? '#1a3a5c' : 'var(--accent-blue)',
          color: saving ? '#8b949e' : '#fff',
          border: 'none',
          borderRadius: 6,
          fontWeight: 'bold',
          cursor: saving ? 'not-allowed' : 'pointer',
          marginTop: 10,
          fontSize: '0.9rem',
          fontFamily: 'Inter, sans-serif',
          transition: 'background 0.2s',
        }}
      >
        {saving ? '⏳ Saving…' : 'REGISTER & PIN TO VULNERABILITY MAP'}
      </button>
    </form>
  )
}