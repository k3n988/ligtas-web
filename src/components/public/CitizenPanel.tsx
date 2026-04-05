'use client'
// src/components/public/CitizenPanel.tsx

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useHouseholdStore } from '@/store/householdStore'
import type { Household } from '@/types'

const STATUS_CONFIG = {
  Pending: {
    color: '#d29922', bg: '#1f1a0e', border: '#9e6a03',
    icon: '⏳', label: 'Queued — Awaiting Rescue',
    message: 'Your request has been received. Rescuers have been notified.',
  },
  Rescued: {
    color: '#3fb950', bg: '#0d2016', border: '#238636',
    icon: '✅', label: 'Marked as Rescued',
    message: 'You have been marked as rescued. Stay safe!',
  },
}

export default function CitizenPanel() {
  const user           = useAuthStore((s) => s.user)
  const households     = useHouseholdStore((s) => s.households)
  const markRescued    = useHouseholdStore((s) => s.markRescued)
  const restorePending = useHouseholdStore((s) => s.restorePending)

  const [confirming, setConfirming] = useState<'safe' | 'cancel' | null>(null)
  const [busy, setBusy]             = useState(false)

  const household: Household | undefined = households.find(
    (hh) => hh.contact === user?.contact,
  )

  // Close confirm dialog if household status changes externally
  useEffect(() => { setConfirming(null) }, [household?.status])

  async function handleSafe() {
    if (!household) return
    setBusy(true)
    await markRescued(household.id)
    setBusy(false)
    setConfirming(null)
  }

  async function handleCancel() {
    if (!household) return
    setBusy(true)
    await restorePending(household.id)
    setBusy(false)
    setConfirming(null)
  }

  const statusCfg = household ? STATUS_CONFIG[household.status] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Greeting ───────────────────────────────────────────────────── */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 6, padding: 16 }}>
        <p style={{ margin: '0 0 2px', fontSize: '0.65rem', color: '#58a6ff', letterSpacing: 2, textTransform: 'uppercase' }}>
          Citizen Portal
        </p>
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#e6edf3', fontWeight: 600 }}>
          Welcome, {household?.head ?? user?.contact}
        </p>
        {household && (
          <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#8b949e' }}>
            {household.barangay}, {household.city}
          </p>
        )}
      </div>

      {/* ── Not registered yet ─────────────────────────────────────────── */}
      {!household && (
        <div style={{ background: '#1f1a0e', border: '1px solid #9e6a03', borderRadius: 6, padding: 16 }}>
          <p style={{ margin: '0 0 6px', fontSize: '0.78rem', color: '#d29922', fontWeight: 700 }}>
            ⚠ No household linked to your account
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#8b949e', lineHeight: 1.6 }}>
            Your contact number has not been registered in the system yet.
            Please contact your Barangay Health Worker (BHW) or LGU to register your household.
          </p>
        </div>
      )}

      {/* ── Rescue status card ─────────────────────────────────────────── */}
      {household && statusCfg && (
        <div style={{ background: statusCfg.bg, border: `1px solid ${statusCfg.border}`, borderRadius: 6, padding: 16 }}>
          <p style={{ margin: '0 0 4px', fontSize: '0.65rem', color: '#8b949e', letterSpacing: 2, textTransform: 'uppercase' }}>
            Rescue Status
          </p>
          <p style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: statusCfg.color }}>
            {statusCfg.icon} {statusCfg.label}
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#8b949e', lineHeight: 1.5 }}>
            {statusCfg.message}
          </p>

          {/* Triage badge */}
          <div style={{
            marginTop: 12, display: 'inline-block',
            padding: '3px 10px', borderRadius: 20,
            background: household.triage.hex + '22',
            border: `1px solid ${household.triage.hex}`,
            fontSize: '0.7rem', fontWeight: 700,
            color: household.triage.hex, letterSpacing: 1,
          }}>
            {household.triage.level} PRIORITY
          </div>
        </div>
      )}

      {/* ── Notification banners ───────────────────────────────────────── */}
      {household?.status === 'Pending' && household.assignedAssetId && (
        <div style={{ background: '#0d2016', border: '1px solid #238636', borderRadius: 6, padding: 14 }}>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#3fb950', fontWeight: 700 }}>
            🚨 Responders are on the way!
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#8b949e' }}>
            A rescue team has been dispatched to your location. Please stay put and keep your phone on.
          </p>
        </div>
      )}

      {/* ── "I Am Safe" button ─────────────────────────────────────────── */}
      {household && household.status === 'Pending' && (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 6, padding: 16 }}>
          <p style={{ margin: '0 0 8px', fontSize: '0.75rem', color: '#8b949e', lineHeight: 1.5 }}>
            If you have already evacuated safely on your own, tap below to remove yourself from the active rescue queue so rescuers can focus on others.
          </p>

          {confirming === 'safe' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#f0a500', fontWeight: 600 }}>
                Confirm you are safe and no longer need rescue?
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleSafe}
                  disabled={busy}
                  style={{
                    flex: 1, padding: '10px',
                    background: '#238636', color: '#fff',
                    border: 'none', borderRadius: 4,
                    fontWeight: 700, fontSize: '0.8rem',
                    cursor: busy ? 'not-allowed' : 'pointer',
                    opacity: busy ? 0.7 : 1,
                  }}
                >
                  {busy ? 'Saving…' : 'Yes, I Am Safe'}
                </button>
                <button
                  onClick={() => setConfirming(null)}
                  disabled={busy}
                  style={{
                    flex: 1, padding: '10px',
                    background: 'transparent', color: '#8b949e',
                    border: '1px solid #30363d', borderRadius: 4,
                    fontWeight: 600, fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Go Back
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirming('safe')}
              style={{
                width: '100%', padding: '12px',
                background: '#238636', color: '#fff',
                border: 'none', borderRadius: 4,
                fontWeight: 800, fontSize: '0.9rem',
                cursor: 'pointer', letterSpacing: 1,
              }}
            >
              ✅ I AM SAFE — REMOVE ME FROM QUEUE
            </button>
          )}
        </div>
      )}

      {/* ── Cancel Request button ──────────────────────────────────────── */}
      {household && household.status === 'Rescued' && (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 6, padding: 16 }}>
          <p style={{ margin: '0 0 8px', fontSize: '0.75rem', color: '#8b949e', lineHeight: 1.5 }}>
            If your situation has changed and you still need rescue, tap below to re-submit your request.
          </p>

          {confirming === 'cancel' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#f85149', fontWeight: 600 }}>
                Re-submit your rescue request?
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleCancel}
                  disabled={busy}
                  style={{
                    flex: 1, padding: '10px',
                    background: '#da3633', color: '#fff',
                    border: 'none', borderRadius: 4,
                    fontWeight: 700, fontSize: '0.8rem',
                    cursor: busy ? 'not-allowed' : 'pointer',
                    opacity: busy ? 0.7 : 1,
                  }}
                >
                  {busy ? 'Saving…' : 'Yes, I Need Help'}
                </button>
                <button
                  onClick={() => setConfirming(null)}
                  disabled={busy}
                  style={{
                    flex: 1, padding: '10px',
                    background: 'transparent', color: '#8b949e',
                    border: '1px solid #30363d', borderRadius: 4,
                    fontWeight: 600, fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Go Back
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirming('cancel')}
              style={{
                width: '100%', padding: '12px',
                background: 'transparent', color: '#f85149',
                border: '1px solid #da3633', borderRadius: 4,
                fontWeight: 700, fontSize: '0.85rem',
                cursor: 'pointer', letterSpacing: 1,
              }}
            >
              🆘 CANCEL — I STILL NEED RESCUE
            </button>
          )}
        </div>
      )}

      {/* ── Household info summary ─────────────────────────────────────── */}
      {household && (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 6, padding: 16 }}>
          <p style={{ margin: '0 0 12px', fontSize: '0.65rem', color: '#8b949e', letterSpacing: 2, textTransform: 'uppercase' }}>
            Your Registration
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'ID',          value: household.id },
              { label: 'Head',        value: household.head },
              { label: 'Occupants',   value: String(household.occupants) },
              { label: 'Address',     value: [household.street, household.barangay, household.city].filter(Boolean).join(', ') },
              { label: 'Registered',  value: household.created_at ? new Date(household.created_at).toLocaleDateString('en-PH', { dateStyle: 'medium' }) : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', gap: 8 }}>
                <span style={{ color: '#8b949e', flexShrink: 0 }}>{label}</span>
                <span style={{ color: '#e6edf3', textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Emergency hotline ─────────────────────────────────────────── */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 6, padding: 14 }}>
        <p style={{ margin: '0 0 8px', fontSize: '0.65rem', color: '#8b949e', letterSpacing: 2, textTransform: 'uppercase' }}>
          Emergency
        </p>
        <a
          href="tel:911"
          style={{
            display: 'block', textAlign: 'center',
            padding: '10px', background: '#3d1a1a',
            border: '1px solid #da3633', borderRadius: 4,
            color: '#f85149', fontWeight: 800,
            fontSize: '1rem', letterSpacing: 2,
            textDecoration: 'none',
          }}
        >
          📞 CALL 911
        </a>
      </div>

    </div>
  )
}
