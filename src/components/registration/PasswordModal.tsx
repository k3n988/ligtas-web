'use client'

interface Props {
  contact: string
  password: string
  onClose: () => void
}

export default function PasswordModal({ contact, password, onClose }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: 10,
        padding: 28,
        width: '100%',
        maxWidth: 420,
      }}>
        <div style={{
          background: '#238636',
          borderRadius: 6,
          padding: '10px 14px',
          marginBottom: 20,
          fontSize: '0.82rem',
          fontWeight: 700,
          color: '#fff',
        }}>
          ✅ Asset registered and pinned to map.
        </div>

        <h3 style={{
          color: '#fff',
          fontSize: '0.95rem',
          fontWeight: 800,
          marginBottom: 6,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          borderLeft: '4px solid #58a6ff',
          paddingLeft: 10,
        }}>
          RESCUERS Login Credentials
        </h3>
        <p style={{ color: '#8b949e', fontSize: '0.75rem', marginBottom: 20, paddingLeft: 14 }}>
          Hand these to the Rescuers.{' '}
          <strong style={{ color: '#f0883e' }}>Password will not be shown again.</strong>
        </p>

        <div style={{
          background: '#0d1117',
          border: '1px solid #30363d',
          borderRadius: 6,
          padding: '16px 18px',
          marginBottom: 20,
          fontFamily: 'monospace',
        }}>
          <div style={{ marginBottom: 14 }}>
            <span style={{ color: '#8b949e', fontSize: '0.68rem', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
              Username (Contact Number)
            </span>
            <span style={{ color: '#58a6ff', fontSize: '1.05rem', fontWeight: 700 }}>
              {contact}
            </span>
          </div>
          <div>
            <span style={{ color: '#8b949e', fontSize: '0.68rem', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
              Password (one-time display)
            </span>
            <span style={{ color: '#3fb950', fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.15em' }}>
              {password}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: 13,
            background: '#58a6ff',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.03em',
          }}
        >
          ✓ DONE — I'VE NOTED THE PASSWORD
        </button>
      </div>
    </div>
  )
}