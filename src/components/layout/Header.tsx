'use client'
// src/components/layout/Header.tsx

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
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

  return (
    <div style={{ flexShrink: 0 }}>
      {/* Top bar */}
      <div
        style={{
          padding: '12px 16px',
          background: '#000',
          borderBottom: '2px solid var(--critical-red)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', letterSpacing: 2 }}>
            L.I.G.T.A.S. DASHBOARD
          </h1>
          <small style={{ color: 'var(--accent-blue)', fontSize: '0.7rem' }}>
            BACOLOD DRRMO | COMMAND CENTER
          </small>
        </div>

        {/* Auth control */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: '0.65rem', color: '#8b949e', letterSpacing: 0.5 }}>
              {user.contact}
            </span>
            <button
              onClick={logout}
              style={{
                padding: '5px 10px',
                background: 'transparent',
                border: '1px solid #30363d',
                color: '#8b949e',
                borderRadius: 4,
                fontSize: '0.65rem',
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

      {/* Nav tabs — only when logged in */}
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
