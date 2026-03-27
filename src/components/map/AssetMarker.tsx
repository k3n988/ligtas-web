'use client'
// src/components/map/AssetMarker.tsx

import { useMemo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
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
  const icon = useMemo(
    () =>
      L.divIcon({
        html: `<div style="font-size:24px;text-align:center;line-height:24px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.8))">${asset.icon}</div>`,
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      }),
    [asset.icon],
  )

  return (
    <Marker position={[asset.lat, asset.lng]} icon={icon}>
      <Popup>
        <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 160 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
            {asset.icon} {asset.name}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: 6 }}>
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
      </Popup>
    </Marker>
  )
}
