'use client'
// src/components/dispatch/AssetCard.tsx

import type { Asset } from '@/types'
import { useHouseholdStore } from '@/store/householdStore'

interface Props {
  asset: Asset
}

const STATUS_COLOR: Record<Asset['status'], string> = {
  Active: 'var(--resolved-green)',
  Dispatching: 'var(--high-orange)',
  Standby: 'var(--text-muted)',
}

export default function AssetCard({ asset }: Props) {
  const setPanTo = useHouseholdStore((s) => s.setPanTo)

  // Pan to closest critical household as a dispatch hint
  const handleTrack = () => {
    // For MVP, just pan to the asset's lat/lng by dispatching a synthetic id.
    // We store asset coords in Zustand; for now we use the store's households
    // to fly to the nearest critical one, falling back to nothing.
    void setPanTo(null) // reset, map will handle asset pan via its own logic
    // Actual asset pan handled by MapView watching window.dispatchEvent
    window.dispatchEvent(
      new CustomEvent('ligtas:panToAsset', {
        detail: { lat: asset.lat, lng: asset.lng },
      }),
    )
  }

  return (
    <div
      style={{
        background: '#21262d',
        border: '1px solid var(--border-color)',
        borderLeft: '4px solid var(--accent-blue)',
        borderRadius: 6,
        padding: 15,
        marginBottom: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 6,
        }}
      >
        <h3 style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>
          {asset.icon} {asset.name}
        </h3>
        <span style={{ fontSize: '0.75rem', color: STATUS_COLOR[asset.status], fontWeight: 'bold' }}>
          {asset.status}
        </span>
      </div>

      <p style={{ margin: '0 0 12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        {asset.type} &mdash; {asset.unit}
      </p>

      <button
        onClick={handleTrack}
        style={{
          width: '100%',
          padding: '8px',
          fontSize: '0.75rem',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          fontWeight: 600,
          textTransform: 'uppercase',
          background: '#30363d',
          color: '#fff',
        }}
      >
        📍 Track Live
      </button>
    </div>
  )
}
