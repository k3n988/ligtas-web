'use client'
// src/components/layout/Header.tsx

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_TABS = [
  { href: '/register', label: '📝 REGISTER' },
  { href: '/triage',   label: '🚨 TRIAGE'   },
  { href: '/dispatch', label: '🚤 DISPATCH'  },
  { href: '/map',      label: '🗺 MAP'       },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <div style={{ flexShrink: 0 }}>
      <div
        style={{
          padding: '16px 20px',
          background: '#000',
          borderBottom: '2px solid var(--critical-red)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', letterSpacing: 2 }}>
          L.I.G.T.A.S. DASHBOARD
        </h1>
        <small style={{ color: 'var(--accent-blue)', fontSize: '0.7rem' }}>
          BACOLOD DRRMO | COMMAND CENTER
        </small>
      </div>

      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-dark)',
        }}
      >
        {NAV_TABS.map(({ href, label }) => {
          const active = pathname === href || (href === '/map' && pathname === '/')
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1,
                padding: '14px 6px',
                textAlign: 'center',
                fontSize: '0.72rem',
                fontWeight: 600,
                textDecoration: 'none',
                borderBottom: active
                  ? '2px solid var(--accent-blue)'
                  : '2px solid transparent',
                color: active ? 'var(--accent-blue)' : 'var(--text-muted)',
                background: active ? 'var(--panel-bg)' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
