'use client'
// src/components/public/CitizenPanel.tsx
import { useHazardStore } from '@/store/hazardStore'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useHouseholdStore } from '@/store/householdStore'
import type { Household } from '@/types'


const STATUS_CONFIG = {
  Pending: {
    color: '#d29922', bg: '#1f1a0e', border: '#9e6a03',
    icon: <ClockIcon />, label: 'Queued — Awaiting Rescue',
    message: 'Your request has been received. Rescuers have been notified.',
  },
  Rescued: {
    color: '#3fb950', bg: '#0d2016', border: '#238636',
    icon: <CheckCircleIcon />, label: 'Marked as Rescued',
    message: 'You have been marked as rescued. Stay safe!',
  },
}

export default function CitizenPanel() {
  const user           = useAuthStore((s) => s.user)
  const households     = useHouseholdStore((s) => s.households)
  const markRescued    = useHouseholdStore((s) => s.markRescued)
  const restorePending = useHouseholdStore((s) => s.restorePending)
const activeHazard = useHazardStore((s) => s.activeHazard)
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

    {/* ── Active Disaster Warning Banner ── */}
    {activeHazard?.isActive && (
      <div style={{
        background: '#3d1a1a',
        border: '1px solid #da3633',
        borderRadius: 6,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        <span style={{
          fontSize: '0.6rem', color: '#ff4d4d',
          letterSpacing: 2, textTransform: 'uppercase', fontWeight: 800,
        }}>
          ⚠ Active Disaster Warning
        </span>
        <span style={{
          fontSize: '1.1rem', fontWeight: 900,
          color: '#ffffff', textTransform: 'uppercase', letterSpacing: 1,
        }}>
          {activeHazard.type}
        </span>
        <span style={{ fontSize: '0.75rem', color: '#c9d1d9', lineHeight: 1.5 }}>
          A <b>{activeHazard.type.toLowerCase()}</b> hazard zone is currently being monitored on the
          map. Please stay alert and follow local advisories.
        </span>
      </div>
    )}

    
      {/* ── Rescue status card ─────────────────────────────────────────── */}
      {household && (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ padding: 16, background: statusCfg?.bg, borderBottom: '1px solid #30363d' }}>
          <p style={{ margin: '0 0 4px', fontSize: '0.65rem', color: '#8b949e', letterSpacing: 2, textTransform: 'uppercase' }}>
            Rescue Status
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 4px' }}>
            <span style={{ color: statusCfg?.color, display: 'flex' }}>{statusCfg?.icon}</span>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: statusCfg?.color }}>
              {statusCfg?.label}
            </p>
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#8b949e', lineHeight: 1.5 }}>
            {statusCfg?.message}
          </p>

          {household.status === 'Pending' && (
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
          )}
          </div>

                {household.status === 'Pending' && (
        <div style={{ marginTop: 16 }}>
          {confirming === 'safe' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#3fb950', fontWeight: 600 }}>
                Confirm you are safe?
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
                  {busy ? 'Saving…' : 'Yes, I am Safe'}
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
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: '#0d2016', color: '#3fb950',
                border: '1px solid #238636', borderRadius: 4,
                fontWeight: 700, fontSize: '0.85rem',
                cursor: 'pointer', letterSpacing: 1,
              }}
            >
              <CheckCircleIcon size={18} /> I AM SAFE
            </button>
          )}
        </div>
      )}
          
          {household.status === 'Rescued' && (
            <div style={{ padding: 16 }}>
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
            <>
              <p style={{ margin: '0 0 12px', fontSize: '0.75rem', color: '#8b949e', lineHeight: 1.5 }}>
                If your situation has changed and you still need rescue, tap below to re-submit your request.
              </p>
              <button
                onClick={() => setConfirming('cancel')}
                style={{
                  width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: 'transparent', color: '#a3b408',
                  border: '1px solid #a3b408', borderRadius: 4,
                  fontWeight: 700, fontSize: '0.85rem',
                  cursor: 'pointer', letterSpacing: 1,
                }}
              >
                <AlertTriangleIcon size={18} /> RE-SUBMIT REQUEST
              </button>
            </>
          )}
            </div>
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

    </div>
  )
}

// ── Standard Inline SVGs ─────────────────────────────────────────────────────

function ClockIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

function CheckCircleIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  )
}

function AlertTriangleIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

function PhoneIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  )
}
