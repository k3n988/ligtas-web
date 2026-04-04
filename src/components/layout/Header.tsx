/// <reference types="@types/google.maps" />
'use client'
// src/components/layout/Header.tsx

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { useAuthStore } from '@/store/authStore'
import { useHouseholdStore } from '@/store/householdStore'
import AuthModal from '@/components/auth/AuthModal'

const NAV_TABS = [
  { href: '/register', label: '📝 REGISTER' },
  { href: '/queue',    label: '🚨 QUEUE'    },
  { href: '/assets',   label: '🚤 ASSETS'   },
  { href: '/admin',    label: '🗺️ DASHBOARD' },
]

interface Suggestion {
  place_id: string
  description: string
  main_text: string
  secondary_text: string
}

export default function Header() {
  const pathname = usePathname()
  const { user, logout, showModal, setShowModal } = useAuthStore()
  const setPanToCoords = useHouseholdStore((s) => s.setPanToCoords)

  const placesLib = useMapsLibrary('places')
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
  const geocoder = useRef<google.maps.Geocoder | null>(null)

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Init Google services once the library loads
  useEffect(() => {
    if (!placesLib) return
    autocompleteService.current = new placesLib.AutocompleteService()
    geocoder.current = new google.maps.Geocoder()
  }, [placesLib])

  // Fetch suggestions with 300ms debounce using Google Places
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = query.trim()
    if (q.length < 2 || !autocompleteService.current) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(() => {
      setLoading(true)
      autocompleteService.current?.getPlacePredictions(
        { input: q, componentRestrictions: { country: 'ph' } },
        (predictions: google.maps.places.AutocompletePrediction[] | null, status: google.maps.places.PlacesServiceStatus) => {
          setLoading(false)
          if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
            setSuggestions([])
            return
          }
          setSuggestions(
            predictions.map((p: google.maps.places.AutocompletePrediction) => ({
              place_id: p.place_id,
              description: p.description,
              main_text: p.structured_formatting.main_text,
              secondary_text: p.structured_formatting.secondary_text,
            })),
          )
          setShowDropdown(true)
        },
      )
    }, 300)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function selectSuggestion(s: Suggestion) {
    if (!geocoder.current) return
    geocoder.current.geocode({ placeId: s.place_id }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
      if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
        const loc = results[0].geometry.location
        setPanToCoords({ lat: loc.lat(), lng: loc.lng() })
      }
    })
    setQuery('')
    setSuggestions([])
    setShowDropdown(false)
    inputRef.current?.blur()
  }

  function useCurrentLocation() {
    setShowDropdown(false)
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      setPanToCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, zoom: 17 })
    })
  }

  function clearQuery() {
    setQuery('')
    setSuggestions([])
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (suggestions.length > 0) selectSuggestion(suggestions[0])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestions])

  return (
    <div style={{ flexShrink: 0 }}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '10px 14px',
          background: '#000',
          borderBottom: '2px solid var(--critical-red)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        {/* Logo + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image
            src="/logo2.png"
            alt="LIGTAS Logo"
            width={42}
            height={42}
            priority
            style={{ objectFit: 'contain' }}
          />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', letterSpacing: 2, lineHeight: 1.1 }}>
              L.I.G.T.A.S.
            </h1>
            <p style={{ margin: 0, fontSize: '0.53rem', color: '#8b949e', letterSpacing: 0.3, lineHeight: 1.45 }}>
              Location Intelligence &amp; Geospatial Triage<br />for Accelerated Support
            </p>
          </div>
        </div>

        {/* Auth */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: '0.62rem', color: '#8b949e' }}>{user.contact}</span>
            <button
              onClick={logout}
              style={{
                padding: '5px 10px',
                background: 'transparent',
                border: '1px solid #30363d',
                color: '#8b949e',
                borderRadius: 4,
                fontSize: '0.62rem',
                fontWeight: 600,
                letterSpacing: 1,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              LOG OUT
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '6px 12px',
              background: 'var(--accent-blue)',
              border: 'none',
              color: '#fff',
              borderRadius: 4,
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: 1,
              cursor: 'pointer',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            LOG IN
          </button>
        )}
      </div>

      {/* ── Search bar ──────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '10px 14px',
          background: '#0d1117',
          borderBottom: '1px solid var(--border-color)',
          position: 'relative',
          zIndex: 200,
        }}
      >
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#161b22',
              borderRadius: showDropdown ? '4px 4px 0 0' : 4,
              padding: '8px 12px',
              border: '1px solid #30363d',
              transition: 'border-radius 0.1s',
            }}
          >
            <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>📍</span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search a place or barangay…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowDropdown(true) }}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '0.85rem',
                color: '#ffffff',
                fontFamily: 'Inter, sans-serif',
                minWidth: 0,
              }}
            />
            {query && (
              <button
                type="button"
                onClick={clearQuery}
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: '0 4px', fontSize: '1rem', lineHeight: 1 }}
              >
                ×
              </button>
            )}
            <button
              type="submit"
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                background: loading ? '#8b949e' : '#1f6feb',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '0.85rem',
              }}
            >
              {loading ? '…' : '🔍'}
            </button>
          </div>
        </form>

        {/* Dropdown */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              left: 14,
              right: 14,
              top: '100%',
              marginTop: -1,
              background: '#161b22',
              borderRadius: '0 0 4px 4px',
              border: '1px solid #30363d',
              overflow: 'hidden',
              zIndex: 300,
            }}
          >
            {/* Current location row */}
            <button
              onClick={useCurrentLocation}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '11px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid #30363d',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '1rem', color: '#1f6feb' }}>🎯</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1f6feb' }}>
                Your Current Location
              </span>
            </button>

            {/* Results */}
            {suggestions.map((s, i) => (
              <button
                key={s.place_id}
                onClick={() => selectSuggestion(s)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  width: '100%',
                  padding: '10px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: i < suggestions.length - 1 ? '1px solid #21262d' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '0.85rem', marginTop: 1, flexShrink: 0 }}>📍</span>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f0f6fc', lineHeight: 1.3 }}>
                    {s.main_text}
                  </div>
                  {s.secondary_text && (
                    <div style={{ fontSize: '0.7rem', color: '#8b949e', marginTop: 1 }}>
                      {s.secondary_text}
                    </div>
                  )}
                </div>
              </button>
            ))}

            {suggestions.length === 0 && !loading && (
              <div style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#888' }}>
                No results found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Nav tabs (logged in only) ────────────────────────────────────── */}
      {user && (
        <div
          style={{
            display: 'flex',
            overflowX: 'auto',
            overflowY: 'hidden',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-dark)',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          className="hide-scrollbar"
        >
          {NAV_TABS.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                style={{
                  flexShrink: 0,
                  padding: '14px 16px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  borderBottom: active
                    ? '2px solid var(--accent-blue)'
                    : '2px solid transparent',
                  color: active ? 'var(--accent-blue)' : 'var(--text-muted)',
                  background: active ? 'var(--panel-bg)' : 'transparent',
                  transition: 'color 0.15s, background 0.15s',
                }}
              >
                {label}
              </Link>
            )
          })}
        </div>
      )}

      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
