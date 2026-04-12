'use client'

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
  const assignedAsset = hh.assignedAssetId ? assets.find((a) => a.id === hh.assignedAssetId) : null

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
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 6,
        padding: 15,
        marginBottom: 10,
        opacity: isRescued ? 0.74 : 1,
      }}
    >
      <div
        className="mobile-stack"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 6,
          gap: 8,
        }}
      >
        <h3 style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem', color: 'var(--fg-default)' }}>
          {hh.head}
        </h3>
        <TriageBadge triage={hh.triage} rescued={isRescued} />
      </div>

      <p style={{ margin: '0 0 6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        {hh.street}, Brgy. {hh.barangay}, {hh.city} - {hh.occupants} occupants
      </p>
      {hh.source && (
        <p style={{ margin: '0 0 8px', fontSize: '0.68rem', color: 'var(--accent-blue)' }}>
          Source: {hh.source}
        </p>
      )}

      <div style={{ marginBottom: 10 }}>
        {hh.vulnArr.map((v) => (
          <span
            key={v}
            style={{
              display: 'inline-block',
              padding: '2px 6px',
              background: 'var(--bg-elevated)',
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
        <div className="mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <p style={{ margin: 0, color: 'var(--resolved-green)', fontWeight: 'bold', fontSize: '0.8rem' }}>
            Operation Complete
          </p>
          <button
            onClick={() => restorePending(hh.id)}
            title="Restore to pending"
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--fg-muted)',
              borderRadius: 4,
              padding: '4px 10px',
              cursor: 'pointer',
              fontSize: '0.72rem',
            }}
          >
            Restore
          </button>
        </div>
      ) : (
        <>
          {assignedAsset && !showPicker && (
            <div
              className="mobile-stack"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-inset)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '6px 10px',
                marginBottom: 10,
                fontSize: '0.75rem',
                gap: 8,
              }}
            >
              <span style={{ color: 'var(--high-orange)', fontWeight: 600 }}>
                {assignedAsset.icon} {assignedAsset.name} - dispatched
              </span>
              <button
                onClick={handleReassign}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--fg-muted)',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                }}
              >
                Reassign
              </button>
            </div>
          )}

          {showPicker && (
            <div
              style={{
                background: 'var(--bg-inset)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '10px',
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--fg-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                Select Rescue Asset
              </div>
              <div className="mobile-stack" style={{ display: 'flex', gap: 6 }}>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--fg-default)',
                    borderRadius: 4,
                    padding: '6px 8px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value="" disabled>
                    Choose asset...
                  </option>
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
                    background: selectedAssetId ? 'var(--resolved-green)' : 'var(--bg-elevated)',
                    color: selectedAssetId ? '#fff' : 'var(--fg-subtle)',
                    border: 'none',
                    borderRadius: 4,
                    padding: '6px 12px',
                    cursor: selectedAssetId ? 'pointer' : 'default',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => {
                    setShowPicker(false)
                    setSelectedAssetId('')
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--fg-muted)',
                    borderRadius: 4,
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          <div className="mobile-stack" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {!assignedAsset && !showPicker && (
              <button
                onClick={() => setShowPicker(true)}
                style={{
                  ...btnBase,
                  background: 'var(--critical-red)',
                  color: '#fff',
                  border: 'none',
                }}
              >
                Dispatch Rescue
              </button>
            )}
            <button
              onClick={() => setPanTo(hh.id)}
              style={{
                ...btnBase,
                background: 'var(--bg-elevated)',
                color: 'var(--fg-default)',
                border: 'none',
                flex: assignedAsset ? 1 : '0 1 auto',
              }}
            >
              Locate
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
              Mark Rescued
            </button>
          </div>
        </>
      )}
    </div>
  )
}
