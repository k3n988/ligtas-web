'use client'
// src/components/map/AssetMarker.tsx

import { useState } from 'react'
import { AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps'
import type { Asset } from '@/types'

interface Props {
  asset: Asset
}

const STATUS_COLOR: Record<Asset['status'], string> = {
  Active: '#238636',
  Dispatching: '#f39c12',
  Standby: '#8b949e',
}

export default function AssetMarker({ asset }: Props) {
  const [open, setOpen] = useState(false)
  const pos = { lat: asset.lat, lng: asset.lng }

  return (
    <>
      <AdvancedMarker position={pos} onClick={() => setOpen(true)} title={asset.name}>
        <div
          style={{
            fontSize: 26,
            lineHeight: 1,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.8))',
            cursor: 'pointer',
          }}
        >
          {asset.icon}
        </div>
      </AdvancedMarker>

      {open && (
        <InfoWindow position={pos} onCloseClick={() => setOpen(false)}>
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              minWidth: 160,
              background: '#161b22',
              color: '#c9d1d9',
              padding: 2,
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#fff' }}>
              {asset.icon} {asset.name}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#8b949e', marginBottom: 8 }}>
              {asset.type} — {asset.unit}
            </div>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 4,
                background: STATUS_COLOR[asset.status],
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 'bold',
              }}
            >
              {asset.status}
            </span>
          </div>
        </InfoWindow>
      )}
    </>
  )
}
