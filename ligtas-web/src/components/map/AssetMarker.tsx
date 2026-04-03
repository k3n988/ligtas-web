'use client'
// src/components/map/AssetMarker.tsx

import { useState } from 'react'
import { Marker, InfoWindow } from '@vis.gl/react-google-maps'
import type { Asset } from '@/types'

interface Props {
  asset: Asset
}

const STATUS_COLOR: Record<Asset['status'], string> = {
  Active: '#238636',
  Dispatching: '#f39c12',
  Standby: '#8b949e',
}

/** Renders an emoji inside an SVG data-URI icon — no mapId required. */
function emojiIcon(emoji: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36">
    <text x="2" y="30" font-size="28"
      font-family="Apple Color Emoji,Segoe UI Emoji,NotoColorEmoji,sans-serif">${emoji}</text>
  </svg>`
  // btoa via encodeURIComponent handles multi-byte emoji safely
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}

export default function AssetMarker({ asset }: Props) {
  const [open, setOpen] = useState(false)
  const pos = { lat: asset.lat, lng: asset.lng }

  return (
    <>
      <Marker
        position={pos}
        icon={emojiIcon(asset.icon)}
        title={asset.name}
        onClick={() => setOpen(true)}
      />

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
