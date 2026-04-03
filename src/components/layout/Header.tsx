'use client'
// src/components/layout/Header.tsx

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useHouseholdStore } from '@/store/householdStore'
import AuthModal from '@/components/auth/AuthModal'

const NAV_TABS = [
  { href: '/register', label: '📝 REGISTER' },
  { href: '/queue',    label: '🚨 QUEUE'    },
  { href: '/assets',   label: '🚤 ASSETS'   },
  { href: '/admin',    label: '🗺️ DASHBOARD' },
]

export default function Header() {
  const pathname = usePathname()
  const { user, logout, showModal, setShowModal } = useAuthStore()
  const setPanToCoords = useHouseholdStore((s) => s.setPanToCoords)

  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
        { headers: { 'Accept-Language': 'en' } },
      )
      const data = await res.json()
      if (data && data[0]) {
        setPanToCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) })
        setQuery('')
        inputRef.current?.blur()
      }
    } finally {
      setSearching(false)
    }
  }

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

      {/* ── Search bar (below top bar, like NOAH) ───────────────────────── */}
      <div
        style={{
          padding: '10px 14px',
          background: '#0d1117',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <form
          onSubmit={handleSearch}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#fff',
            borderRadius: 22,
            padding: '5px 6px 5px 14px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.5)',
          }}
        >
          <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>📍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search a place or barangay…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.8rem',
              color: '#111',
              fontFamily: 'Inter, sans-serif',
              minWidth: 0,
            }}
          />
          <button
            type="submit"
            disabled={searching}
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: searching ? '#8b949e' : '#1f6feb',
              border: 'none',
              color: '#fff',
              cursor: searching ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '0.85rem',
            }}
          >
            {searching ? '…' : '🔍'}
          </button>
        </form>
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
