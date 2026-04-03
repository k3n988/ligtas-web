'use client'
// src/components/registration/RegistrationForm.tsx

import { useEffect, useRef, useState } from 'react'
import { useHouseholdStore } from '@/store/householdStore'
import { assessTriage } from '@/lib/triage'
import { supabase } from '@/lib/supabase'
import type { RegistrySource, Vulnerability } from '@/types'
import TriagePreview from './TriagePreview'

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

const DEFAULT_BARANGAYS = ['— Type barangay name —']

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
  const barangays = BARANGAYS_BY_CITY[cityVal] ?? DEFAULT_BARANGAYS

  // Address must be filled before location can be pinned
  const addressReady = Boolean(cityVal && barangayVal && streetVal.trim())

  // Sync coords when admin clicks the map
  useEffect(() => {
    if (!pendingCoords) return
    setCoords(`${pendingCoords.lat.toFixed(6)}, ${pendingCoords.lng.toFixed(6)}`)
    setPinSource('map')
  }, [pendingCoords])

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
    setCoords('Locating…')
    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => {
        setCoords(`${c.latitude.toFixed(6)}, ${c.longitude.toFixed(6)}`)
        setPinSource('gps')
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
      setPendingCoords(null)
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

      {/* ── Success banner ───────────────────────── */}
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

      {/* ── Error banner ─────────────────────────────────────────── */}
      {saveError && (
        <div
          style={{
            background: '#3d1a1a',
            border: '1px solid #ff4d4d',
            color: '#ff4d4d',
            borderRadius: 4,
            padding: '10px 14px',
            marginBottom: 16,
            fontWeight: 600,
            fontSize: '0.82rem',
          }}
        >
          ✕ {saveError}
        </div>
      )}

      {/* ================================================================= */}
      {/* 1. PERSONAL & ADDRESS DETAILS (MOVED TO TOP)                        */}
      {/* ================================================================= */}
      <h3 style={subHeaderStyle}>Personal & Address Details</h3>

      {/* ── Source Registry ──────────────────────────────────────── */}
      <div style={{ marginBottom: isSelfReported ? 10 : 15 }}>
        <label style={labelStyle}>Source Registry / Data Origin</label>
        <div style={{ position: 'relative' }}>
          <select
            name="source"
            required
            style={{ ...inputStyle, appearance: 'none' }}
            value={sourceVal}
            onChange={(e) => setSourceVal(e.target.value as RegistrySource)}
          >
            <option value="" disabled>Select data source</option>
            {SOURCE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.7rem' }}>▼</span>
        </div>
      </div>

      {/* ── Self-Reported warning + document upload ──────────────── */}
      {isSelfReported && (
        <div style={{ marginBottom: 15 }}>
          <div style={{
            background: '#2d2711',
            border: '1px solid #f39c12',
            borderRadius: 4,
            padding: '10px 14px',
            marginBottom: 10,
            fontSize: '0.75rem',
            color: '#ffdf5d',
            lineHeight: 1.6,
          }}>
            <strong style={{ display: 'block', marginBottom: 2 }}>⚠️ Pending Admin Review</strong>
            This entry will be held for LGU verification before appearing on the live map.
            Upload a valid ID or medical certificate to speed up approval.
          </div>
          <label style={labelStyle}>
            Verification Document <span style={{ color: '#8b949e' }}>(Senior/PWD ID or Medical Certificate)</span>
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            required
            style={{
              ...inputStyle,
              padding: '7px 10px',
              cursor: 'pointer',
            }}
          />
        </div>
      )}

      {/* ── Household Head ───────────────────────── */}
      <div style={{ marginBottom: 15 }}>
        <label style={labelStyle}>Household Head / Patient Name</label>
        <input name="head" type="text" placeholder="Full Name" required style={inputStyle} />
      </div>

      {/* ── Contact + Occupants ──────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '15px 0' }}>
        <div>
          <label style={labelStyle}>Primary Contact</label>
          <input name="contact" type="tel" placeholder="09XX-XXX-XXXX" required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Total Occupants</label>
          <input name="occupants" type="number" placeholder="Count" min="1" required style={inputStyle} />
        </div>
      </div>

      {/* ── City ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 15 }}>
        <label style={labelStyle}>City / Municipality</label>
        <div style={{ position: 'relative' }}>
          <select
            name="city"
            required
            style={{ ...inputStyle, appearance: 'none' }}
            value={cityVal}
            onChange={(e) => { setCityVal(e.target.value); setBarangayVal('') }}
          >
            <option value="" disabled>Select City / Municipality</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.7rem' }}>▼</span>
        </div>
      </div>

      {/* ── Barangay + Purok ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 15 }}>
        <div>
          <label style={labelStyle}>
            Barangay
            {cityVal && BARANGAYS_BY_CITY[cityVal] && (
              <span style={{ color: '#238636', marginLeft: 6, fontWeight: 400 }}>
                ({BARANGAYS_BY_CITY[cityVal].length} available)
              </span>
            )}
          </label>
          {cityVal && BARANGAYS_BY_CITY[cityVal] ? (
            <div style={{ position: 'relative' }}>
              <select
                name="barangay"
                required
                style={{ ...inputStyle, appearance: 'none' }}
                value={barangayVal}
                onChange={(e) => setBarangayVal(e.target.value)}
              >
                <option value="" disabled>Select Barangay</option>
                {barangays.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.7rem' }}>▼</span>
            </div>
          ) : (
            <input
              name="barangay"
              type="text"
              placeholder="Type barangay name"
              required
              style={inputStyle}
              value={barangayVal}
              onChange={(e) => setBarangayVal(e.target.value)}
            />
          )}
        </div>
        <div>
          <label style={labelStyle}>Purok / Sitio</label>
          <input name="purok" type="text" placeholder="e.g. Purok Riverside" style={inputStyle} />
        </div>
      </div>

      {/* ── Street ───────────────────────────────────────────────── */}
      <div style={{ marginBottom: 15 }}>
        <label style={labelStyle}>Street Address / Landmark</label>
        <input
          name="street"
          type="text"
          placeholder="House no., street, or nearest landmark"
          required
          style={inputStyle}
          value={streetVal}
          onChange={(e) => setStreetVal(e.target.value)}
        />
      </div>

      {/* ── Structure ────────────────────────────────────────────── */}
      <div style={{ marginBottom: 15 }}>
        <label style={labelStyle}>Structural Risk</label>
        <select name="structure" style={inputStyle}>
          <option value="Single-story">Single-story (High Flood Risk)</option>
          <option value="Light materials">Light materials (High Wind Risk)</option>
          <option value="Multi-story">Multi-story</option>
        </select>
      </div>

      <div style={sectionDivider} />

      {/* ================================================================= */}
      {/* 2. LOCATION DETAILS (DEPENDS ON ADDRESS)                            */}
      {/* ================================================================= */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={subHeaderStyle}>Location Details</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>LATITUDE & LONGITUDE</label>
          {pinSource && (
            <span style={{ fontSize: '0.68rem', color: pinSource === 'map' ? '#58a6ff' : '#238636', fontWeight: 600 }}>
              {pinSource === 'map' ? '🗺 Pinned on map' : '📡 GPS captured'}
            </span>
          )}
        </div>

        {!addressReady && (
          <div style={{
            padding: '8px 12px',
            background: '#161b22',
            border: '1px dashed #30363d',
            borderRadius: 4,
            fontSize: '0.75rem',
            color: '#8b949e',
            marginBottom: 8,
          }}>
            Fill in City, Barangay, and Street Address above to enable location pinning.
          </div>
        )}

        <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
          <input
            style={{
              ...inputStyle,
              opacity: addressReady ? 1 : 0.5,
            }}
            type="text"
            value={coords}
            onChange={(e) => { setCoords(e.target.value); setPinSource(null) }}
            placeholder="LATITUDE, LONGITUDE — or use buttons →"
            required
            readOnly={locating || !addressReady}
          />
          <button
            type="button"
            onClick={getLocation}
            disabled={locating || !addressReady}
            title={addressReady ? 'Auto-detect GPS location' : 'Fill address first'}
            style={{
              flexShrink: 0,
              padding: '0 10px',
              background: addressReady ? '#238636' : '#21262d',
              color: addressReady ? '#fff' : '#8b949e',
              border: addressReady ? '1px solid #2ea043' : '1px solid #30363d',
              borderRadius: 4,
              cursor: addressReady ? 'pointer' : 'not-allowed',
              fontSize: '0.8rem',
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            📡 GPS
          </button>
        </div>
        <button
          type="button"
          onClick={() => { if (addressReady) setPickingLocation(true) }}
          disabled={!addressReady}
          title={addressReady ? 'Click to pin on map' : 'Fill address first'}
          style={{
            width: '100%',
            padding: '8px',
            background: addressReady ? '#161b22' : '#0d1117',
            border: `1px solid ${addressReady ? '#58a6ff' : '#30363d'}`,
            color: addressReady ? '#58a6ff' : '#8b949e',
            borderRadius: 4,
            cursor: addressReady ? 'pointer' : 'not-allowed',
            fontSize: '0.8rem',
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          🗺 Pin Location on Map
        </button>
      </div>

      <div style={sectionDivider} />

      {/* ================================================================= */}
      {/* 3. VULNERABILITY PROFILE & NOTES                                    */}
      {/* ================================================================= */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={subHeaderStyle}>Vulnerability Profile</h3>
        <label style={labelStyle}>Vulnerability Profile (select all that apply)</label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            background: '#21262d',
            padding: 10,
            borderRadius: 4,
            border: '1px solid var(--border-color)',
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
                padding: '4px 8px',
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

      {/* ── Notes ────────────────────────────────────────────────── */}
      <div style={{ margin: '15px 0' }}>
        <label style={labelStyle}>Responder / Evacuation Notes</label>
        <textarea
          name="notes"
          rows={2}
          placeholder="Critical instructions (e.g. Needs stretcher, 4 men required)"
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

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