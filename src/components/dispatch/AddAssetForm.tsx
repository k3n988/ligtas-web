'use client'
// src/components/dispatch/AddAssetForm.tsx

import { useEffect, useState } from 'react'
import { useAssetStore } from '@/store/assetStore'
import { useHouseholdStore } from '@/store/householdStore'

const ASSET_TYPES = ['Boat', 'Truck', 'Ambulance', 'Helicopter', 'Motorcycle', 'Van']

const ICON_OPTIONS = [
  { icon: '🚤', label: 'Boat' },
  { icon: '🛻', label: 'Truck' },
  { icon: '🚑', label: 'Ambulance' },
  { icon: '🚁', label: 'Helicopter' },
  { icon: '🏍️', label: 'Motorcycle' },
  { icon: '🚐', label: 'Van' },
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 10px',
  background: '#0d1117',
  border: '1px solid #30363d',
  color: '#fff',
  borderRadius: 4,
  boxSizing: 'border-box',
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.82rem',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.7rem',
  marginBottom: 4,
  color: '#8b949e',
  textTransform: 'uppercase',
  fontWeight: 500,
}

export default function AddAssetForm({ onClose }: { onClose: () => void }) {
  const addAsset          = useAssetStore((s) => s.addAsset)
  const setPickingLocation = useHouseholdStore((s) => s.setPickingLocation)
  const pendingCoords      = useHouseholdStore((s) => s.pendingCoords)
  const setPendingCoords   = useHouseholdStore((s) => s.setPendingCoords)

  const [name,      setName]      = useState('')
  const [type,      setType]      = useState('Boat')
  const [unit,      setUnit]      = useState('')
  const [icon,      setIcon]      = useState('🚤')
  const [address,   setAddress]   = useState('')
  const [coords,    setCoords]    = useState('')
  const [pinSource, setPinSource] = useState<'gps' | 'map' | null>(null)
  const [locating,  setLocating]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  // Sync when admin clicks the map
  useEffect(() => {
    if (!pendingCoords) return
    setCoords(`${pendingCoords.lat.toFixed(6)}, ${pendingCoords.lng.toFixed(6)}`)
    setPinSource('map')
  }, [pendingCoords])

  // Clean up picked coords when form closes
  useEffect(() => {
    return () => { setPendingCoords(null) }
  }, [setPendingCoords])

  const getGPS = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    setCoords('Locating…')
    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => {
        setCoords(`${c.latitude.toFixed(6)}, ${c.longitude.toFixed(6)}`)
        setPinSource('gps')
        setLocating(false)
      },
      () => { setCoords(''); setLocating(false) },
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!coords || coords === 'Locating…') { setError('Location is required.'); return }
    const [lat, lng] = coords.split(',').map((n) => parseFloat(n.trim()))
    if (isNaN(lat) || isNaN(lng)) { setError('Invalid coordinates.'); return }

    setSaving(true)
    setError(null)
    try {
      await addAsset({
        id:      'A-' + Date.now().toString().slice(-6),
        name,
        type,
        unit,
        icon,
        address: address || undefined,
        status:  'Active',
        lat,
        lng,
      })
      setPendingCoords(null)
      onClose()
    } catch {
      setError('Failed to save. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: 8,
        padding: '16px',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>
          Add Rescue Asset
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'transparent', border: 'none',
            color: '#8b949e', cursor: 'pointer', fontSize: '1rem',
          }}
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit}>

        {error && (
          <div style={{
            background: '#3d1a1a', border: '1px solid #ff4d4d',
            color: '#ff4d4d', borderRadius: 4, padding: '8px 12px',
            marginBottom: 12, fontSize: '0.78rem', fontWeight: 600,
          }}>
            ✕ {error}
          </div>
        )}

        {/* Icon picker */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Asset Icon</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ICON_OPTIONS.map((opt) => (
              <button
                key={opt.icon}
                type="button"
                onClick={() => setIcon(opt.icon)}
                title={opt.label}
                style={{
                  width: 38, height: 38, fontSize: '1.2rem',
                  borderRadius: 6, cursor: 'pointer',
                  background: icon === opt.icon ? '#1f4170' : '#21262d',
                  border: `1px solid ${icon === opt.icon ? '#58a6ff' : '#30363d'}`,
                }}
              >
                {opt.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Asset Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rescue Boat Bravo"
            required
            style={inputStyle}
          />
        </div>

        {/* Type + Unit */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <div>
            <label style={labelStyle}>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
              {ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Unit / Agency</label>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. BFP Marine"
              required
              style={inputStyle}
            />
          </div>
        </div>

        {/* Address */}
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Station Address <span style={{ color: '#6e7681' }}>(optional)</span></label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Brgy. Bata, Bacolod City"
            style={inputStyle}
          />
        </div>

        {/* Location */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Current Location</label>
            {pinSource && (
              <span style={{
                fontSize: '0.68rem',
                color: pinSource === 'map' ? '#58a6ff' : '#238636',
                fontWeight: 600,
              }}>
                {pinSource === 'map' ? '🗺 Pinned on map' : '📡 GPS captured'}
              </span>
            )}
          </div>

          {/* Coords input + GPS button */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input
              value={coords}
              onChange={(e) => { setCoords(e.target.value); setPinSource(null) }}
              placeholder="Lat, Lng — or use buttons →"
              required
              readOnly={locating}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={getGPS}
              disabled={locating}
              style={{
                flexShrink: 0, padding: '0 10px',
                background: '#30363d', color: '#fff',
                border: 'none', borderRadius: 4,
                cursor: 'pointer', fontSize: '0.78rem',
                fontWeight: 600, fontFamily: 'Inter, sans-serif',
                whiteSpace: 'nowrap',
              }}
            >
              📡 GPS
            </button>
          </div>

          {/* Pin on map button */}
          <button
            type="button"
            onClick={() => setPickingLocation(true)}
            style={{
              width: '100%', padding: '8px',
              background: '#161b22',
              border: '1px solid #58a6ff',
              color: '#58a6ff', borderRadius: 4,
              cursor: 'pointer', fontSize: '0.78rem',
              fontWeight: 600, fontFamily: 'Inter, sans-serif',
            }}
          >
            🗺 Pin Location on Map
          </button>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            width: '100%', padding: '10px',
            background: saving ? '#1a3a5c' : '#238636',
            color: saving ? '#8b949e' : '#fff',
            border: 'none', borderRadius: 6,
            fontWeight: 700, fontSize: '0.85rem',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {saving ? '⏳ Saving…' : '+ Add Asset'}
        </button>
      </form>
    </div>
  )
}
