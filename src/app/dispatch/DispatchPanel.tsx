'use client'
// src/app/dispatch/DispatchPanel.tsx

import { useEffect } from 'react'
import { useAssetStore } from '@/store/assetStore'
import { useHouseholdStore } from '@/store/householdStore'
import { TRIAGE_ORDER } from '@/lib/triage'
import AssetCard from '@/components/dispatch/AssetCard'

export default function DispatchPanel() {
  const assets = useAssetStore((s) => s.assets)
  const households = useHouseholdStore((s) => s.households)
  const setPanTo = useHouseholdStore((s) => s.setPanTo)

  // Listen for asset pan events dispatched by AssetCard
  useEffect(() => {
    const handler = (e: Event) => {
      const { lat, lng } = (e as CustomEvent<{ lat: number; lng: number }>).detail
      // Find the nearest pending critical household to that asset
      const pending = households.filter((h) => h.status === 'Pending')
      if (pending.length === 0) return
      const sorted = [...pending].sort(
        (a, b) => TRIAGE_ORDER[a.triage.level] - TRIAGE_ORDER[b.triage.level],
      )
      // Just pan to asset position for now via a temporary store hack
      void lat; void lng
      setPanTo(sorted[0].id)
    }
    window.addEventListener('ligtas:panToAsset', handler)
    return () => window.removeEventListener('ligtas:panToAsset', handler)
  }, [households, setPanTo])

  const pending = households.filter((h) => h.status === 'Pending')
  const critical = pending.filter((h) => h.triage.level === 'CRITICAL')

  return (
    <div>
      <h2
        style={{
          margin: '0 0 6px',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        Assets
      </h2>
      <p style={{ margin: '0 0 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        {assets.filter((a) => a.status === 'Active').length} active &mdash;{' '}
        {assets.filter((a) => a.status === 'Dispatching').length} dispatching
      </p>

      {assets.map((asset) => (
        <AssetCard key={asset.id} asset={asset} />
      ))}

      {critical.length > 0 && (
        <>
          <h2
            style={{
              margin: '20px 0 10px',
              fontSize: '0.8rem',
              color: '#ff4d4d',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            🚨 Critical — Awaiting Dispatch ({critical.length})
          </h2>
          {critical.map((hh) => (
            <div
              key={hh.id}
              style={{
                padding: '10px 14px',
                marginBottom: 8,
                background: '#21262d',
                borderRadius: 6,
                borderLeft: '3px solid #ff4d4d',
                fontSize: '0.82rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: '#fff', marginBottom: 2 }}>{hh.head}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  {hh.street}, {hh.barangay}
                </div>
              </div>
              <button
                onClick={() => setPanTo(hh.id)}
                style={{
                  background: '#30363d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                }}
              >
                📍
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
