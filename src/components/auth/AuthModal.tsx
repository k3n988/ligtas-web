'use client'
// src/components/auth/AuthModal.tsx

import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'

interface Props {
  onClose: () => void
}

export default function AuthModal({ onClose }: Props) {
  const { login, loading } = useAuthStore()

  const [contact, setContact] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    const err = await login(contact.trim(), password)
    if (err) {
      setError(err)
    } else {
      onClose()
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: '#0d1117',
    border: '1px solid #30363d',
    color: '#fff',
    borderRadius: 4,
    fontSize: '0.85rem',
    fontFamily: 'Inter, monospace',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.7rem',
    color: '#8b949e',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  }

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#161b22',
          border: '1px solid #30363d',
          borderRadius: 8,
          width: 360,
          padding: 28,
          fontFamily: 'Inter, monospace',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--accent-blue)', letterSpacing: 2 }}>
            L.I.G.T.A.S. SYSTEM
          </p>
          <h2 style={{ margin: '4px 0 0', fontSize: '1rem', color: '#fff', letterSpacing: 1 }}>
            Sign In
          </h2>
        </div>

        {/* Info blurb */}
        <p style={{ fontSize: '0.72rem', color: '#8b949e', margin: '0 0 18px', lineHeight: 1.5 }}>
          Use your email (LGU admin) or the contact number and password given by your Barangay Health Worker.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            {/* UPDATED: Changed Label to include Email */}
            <label style={labelStyle}>Username</label>
            <input
              type="text" /* <--- CRITICAL FIX: Changed from "tel" to "text" para gumana sa mobile */
              placeholder="Email or 09XX-XXX-XXXX"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
              style={inputStyle}
              autoCapitalize="none" /* <--- ADDED: Prevents mobile from capitalizing the first letter of an email */
              autoCorrect="off"     /* <--- ADDED: Prevents mobile autocorrect from changing the email */
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ fontSize: '0.75rem', color: '#f85149', margin: 0, padding: '8px 10px', background: '#2d1217', border: '1px solid #f8514933', borderRadius: 4 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '11px',
              background: loading ? '#21262d' : 'var(--accent-blue)',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 4,
            }}
          >
            {loading ? 'Please wait…' : 'LOG IN'}
          </button>
        </form>

        <button
          onClick={onClose}
          style={{
            display: 'block',
            marginTop: 16,
            width: '100%',
            padding: '8px',
            background: 'transparent',
            border: '1px solid #30363d',
            color: '#8b949e',
            borderRadius: 4,
            fontSize: '0.75rem',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}