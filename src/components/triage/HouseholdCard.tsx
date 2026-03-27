'use client'
// src/components/triage/HouseholdCard.tsx

import { useState } from 'react'
import type { Household } from '@/types'
import { useHouseholdStore } from '@/store/householdStore'
import { useAssetStore } from '@/store/assetStore'
import TriageBadge from './TriageBadge'

interface Props {
  household: Household
}

const BORDER_COLOR: Record<string, string> = {
  red: 'var(--critical-red)',
  orange: 'var(--high-orange)',
  yellow: 'var(--elevated-yellow)',
  blue: 'var(--accent-blue)',
}

const btnBase: React.CSSProperties = {
  flex: 1,
  padding: '8px',
  fontSize: '0.75rem',
  borderRadius: 4,
  cursor: 'pointer',
  fontWeight: 600,
  textTransform: 'uppercase',
  fontFamily: 'Inter, sans-serif',
}

export default function HouseholdCard({ household: hh }: Props) {
  const markRescued = useHouseholdStore((s) => s.markRescued)
  const restorePending = useHouseholdStore((s) => s.restorePending)
  const setPanTo = useHouseholdStore((s) => s.setPanTo)
  const dispatchRescue = useHouseholdStore((s) => s.dispatchRescue)
  const assets = useAssetStore((s) => s.assets)
  const setAssetStatus = useAssetStore((s) => s.setAssetStatus)

  const [showPicker, setShowPicker] = useState(false)
  const [selectedAssetId, setSelectedAssetId] = useState('')

  const isRescued = hh.status === 'Rescued'
  const borderColor = isRescued ? 'var(--resolved-green)' : BORDER_COLOR[hh.triage.colorName]
  const assignedAsset = hh.assignedAssetId
    ? assets.find((a) => a.id === hh.assignedAssetId)
    : null

  const handleConfirmDispatch = () => {
    if (!selectedAssetId) return
    dispatchRescue(hh.id, selectedAssetId)
    setAssetStatus(selectedAssetId, 'Dispatching')
    setShowPicker(false)
    setSelectedAssetId('')
  }

  const handleReassign = () => {
    setSelectedAssetId(hh.assignedAssetId ?? '')
    setShowPicker(true)
  }

  return (
    <div
      style={{
        background: '#21262d',
        border: '1px solid var(--border-color)',
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 6,
        padding: 15,
        marginBottom: 10,
        opacity: isRescued ? 0.7 : 1,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 6,
        }}
      >
        <h3 style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>
          {hh.head}
        </h3>
        <TriageBadge triage={hh.triage} rescued={isRescued} />
      </div>

      <p style={{ margin: '0 0 8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        {hh.street}, Brgy. {hh.barangay}, {hh.city} &mdash; {hh.occupants} occupants
      </p>

      {/* Vulnerability badges */}
      <div style={{ marginBottom: 10 }}>
        {hh.vulnArr.map((v) => (
          <span
            key={v}
            style={{
              display: 'inline-block',
              padding: '2px 6px',
              background: '#30363d',
              borderRadius: 4,
              fontSize: '0.7rem',
              marginRight: 4,
              marginBottom: 4,
              color: 'var(--text-main)',
            }}
          >
            {v}
          </span>
        ))}
      </div>

      {isRescued ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, color: 'var(--resolved-green)', fontWeight: 'bold', fontSize: '0.8rem' }}>
            ✓ OPERATION COMPLETE
          </p>
          <button
            onClick={() => restorePending(hh.id)}
            title="Undo — restore to Pending"
            style={{
              background: 'transparent',
              border: '1px solid #30363d',
              color: '#8b949e',
              borderRadius: 4,
              padding: '4px 10px',
              cursor: 'pointer',
              fontSize: '0.72rem',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            ↩ Restore
          </button>
        </div>
      ) : (
        <>
          {/* Dispatch status bar */}
          {assignedAsset && !showPicker && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#0d1117',
                border: '1px solid #30363d',
                borderRadius: 4,
                padding: '6px 10px',
                marginBottom: 10,
                fontSize: '0.75rem',
              }}
            >
              <span style={{ color: 'var(--high-orange)', fontWeight: 600 }}>
                🚨 {assignedAsset.icon} {assignedAsset.name} — DISPATCHED
              </span>
              <button
                onClick={handleReassign}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#8b949e',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Reassign
              </button>
            </div>
          )}

          {/* Asset picker */}
          {showPicker && (
            <div
              style={{
                background: '#0d1117',
                border: '1px solid #30363d',
                borderRadius: 4,
                padding: '10px',
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#8b949e', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                Select Rescue Asset
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  style={{
                    flex: 1,
                    background: '#161b22',
                    border: '1px solid #30363d',
                    color: '#c9d1d9',
                    borderRadius: 4,
                    padding: '6px 8px',
                    fontSize: '0.8rem',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                  }}
                >
                  <option value="" disabled>Choose asset…</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.icon} {a.name} ({a.status})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleConfirmDispatch}
                  disabled={!selectedAssetId}
                  style={{
                    background: selectedAssetId ? '#238636' : '#21262d',
                    color: selectedAssetId ? '#fff' : '#555',
                    border: 'none',
                    borderRadius: 4,
                    padding: '6px 12px',
                    cursor: selectedAssetId ? 'pointer' : 'default',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => { setShowPicker(false); setSelectedAssetId('') }}
                  style={{
                    background: 'transparent',
                    border: '1px solid #30363d',
                    color: '#8b949e',
                    borderRadius: 4,
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {!assignedAsset && !showPicker && (
              <button
                onClick={() => setShowPicker(true)}
                style={{
                  ...btnBase,
                  background: '#ff4d4d',
                  color: '#fff',
                  border: 'none',
                }}
              >
                🚨 Dispatch Rescue
              </button>
            )}
            <button
              onClick={() => setPanTo(hh.id)}
              style={{
                ...btnBase,
                background: '#30363d',
                color: '#fff',
                border: 'none',
                flex: assignedAsset ? 1 : '0 1 auto',
              }}
            >
              📍 Locate
            </button>
            <button
              onClick={() => markRescued(hh.id)}
              style={{
                ...btnBase,
                background: 'transparent',
                border: '1px solid var(--resolved-green)',
                color: 'var(--resolved-green)',
                flex: assignedAsset ? 1 : '0 1 auto',
              }}
            >
              ✓ Mark Rescued
            </button>
          </div>
        </>
      )}
    </div>
  )
}
