'use client'
// src/components/registration/RegistrationForm.tsx

import { useState } from 'react'
import { useHouseholdStore } from '@/store/householdStore'
import { assessTriage } from '@/lib/triage'
import type { Vulnerability } from '@/types'
import TriagePreview from './TriagePreview'

const CITIES = [
  'Bacolod City', 'Bago City', 'Cadiz City', 'Escalante City',
  'Himamaylan City', 'Kabankalan City', 'La Carlota City',
  'Sagay City', 'San Carlos City', 'Silay City', 'Talisay City', 'Victorias City',
]

const BARANGAYS = [
  'Mansilingan', 'Taculing', 'Estefania',
  'Villamonte', 'Singcang-Airport', 'Bata',
]

const VULN_OPTIONS: { value: Vulnerability; label: string }[] = [
  { value: 'Bedridden', label: 'Bedridden' },
  { value: 'Senior', label: 'Senior Citizen' },
  { value: 'Wheelchair', label: 'Wheelchair User' },
  { value: 'Infant', label: 'Infant/Toddler' },
  { value: 'Pregnant', label: 'Pregnant' },
  { value: 'PWD', label: 'PWD' },
  { value: 'Oxygen', label: 'Oxygen Dep.' },
  { value: 'Dialysis', label: 'Dialysis Patient' },
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

export default function RegistrationForm() {
  const addHousehold = useHouseholdStore((s) => s.addHousehold)

  const [coords, setCoords] = useState('')
  const [locating, setLocating] = useState(false)
  const [vulnArr, setVulnArr] = useState<Vulnerability[]>([])

  const triage = assessTriage(vulnArr)

  const toggleVuln = (v: Vulnerability) => {
    setVulnArr((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    )
  }

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.')
      return
    }
    setLocating(true)
    setCoords('Locating...')
    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => {
        setCoords(`${c.latitude.toFixed(6)}, ${c.longitude.toFixed(6)}`)
        setLocating(false)
      },
      (err) => {
        alert('GPS Error: ' + err.message + '. Enter coordinates manually.')
        setCoords('')
        setLocating(false)
      },
    )
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!coords || coords === 'Locating...') {
      alert('Please acquire GPS location first.')
      return
    }

    const form = e.currentTarget
    const fd = new FormData(form)
    const [lat, lng] = coords.split(',').map((n) => parseFloat(n.trim()))

    addHousehold({
      id: 'HH-' + Date.now().toString().slice(-6),
      lat,
      lng,
      city: fd.get('city') as string,
      barangay: fd.get('barangay') as string,
      purok: (fd.get('purok') as string) || 'N/A',
      street: fd.get('street') as string,
      structure: fd.get('structure') as string,
      head: fd.get('head') as string,
      contact: fd.get('contact') as string,
      occupants: parseInt(fd.get('occupants') as string, 10),
      vulnArr,
      notes: (fd.get('notes') as string) || '',
      status: 'Pending',
      triage,
    })

    form.reset()
    setVulnArr([])
    setCoords('')
    alert('Household registered and mapped.')
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Location */}
      <div style={{ marginBottom: 15 }}>
        <label style={labelStyle}>Location (GPS Auto-Capture)</label>
        <div style={{ display: 'flex', gap: 5 }}>
          <input
            style={inputStyle}
            type="text"
            value={coords}
            onChange={(e) => setCoords(e.target.value)}
            placeholder="Lat, Lng"
            required
            readOnly={locating}
          />
          <button
            type="button"
            onClick={getLocation}
            disabled={locating}
            title="Get Current Location"
            style={{
              width: 44,
              flexShrink: 0,
              background: '#30363d',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            📍
          </button>
        </div>
      </div>

      {/* City */}
      <div style={{ marginBottom: 15 }}>
        <label style={labelStyle}>City / Municipality</label>
        <select name="city" required style={inputStyle}>
          <option value="" disabled>Select City / Municipality</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Barangay + Purok */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 15 }}>
        <div>
          <label style={labelStyle}>Barangay</label>
          <select name="barangay" required style={inputStyle}>
            <option value="" disabled>Select Barangay</option>
            {BARANGAYS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Purok / Sitio</label>
          <input name="purok" type="text" placeholder="e.g. Purok Riverside" style={inputStyle} />
        </div>
      </div>

      {/* Street */}
      <div style={{ marginBottom: 15 }}>
        <label style={labelStyle}>Street Address / Landmark</label>
        <input
          name="street"
          type="text"
          placeholder="House number, street, or nearest landmark"
          required
          style={inputStyle}
        />
      </div>

      {/* Structure */}
      <div style={{ marginBottom: 15 }}>
        <label style={labelStyle}>Structural Risk</label>
        <select name="structure" style={inputStyle}>
          <option value="Single-story">Single-story (High Flood Risk)</option>
          <option value="Light materials">Light materials (High Wind Risk)</option>
          <option value="Multi-story">Multi-story</option>
        </select>
      </div>

      {/* Household Head */}
      <div style={sectionDivider}>
        <label style={labelStyle}>Household Head Name</label>
        <input name="head" type="text" placeholder="Full Name" required style={inputStyle} />
      </div>

      {/* Contact + Occupants */}
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

      {/* Vulnerabilities */}
      <div style={sectionDivider}>
        <label style={labelStyle}>Vulnerability (Select all that apply)</label>
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
              style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', cursor: 'pointer' }}
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
      </div>

      {/* Notes */}
      <div style={{ margin: '15px 0' }}>
        <label style={labelStyle}>Responder / Evacuation Notes</label>
        <textarea
          name="notes"
          rows={2}
          placeholder="Critical instructions (e.g. Needs stretcher, 4 men to lift)"
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      <TriagePreview triage={triage} />

      <button
        type="submit"
        style={{
          width: '100%',
          padding: 15,
          background: 'var(--accent-blue)',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontWeight: 'bold',
          cursor: 'pointer',
          marginTop: 10,
          fontSize: '0.9rem',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        REGISTER &amp; MAP HOUSEHOLD
      </button>
    </form>
  )
}
