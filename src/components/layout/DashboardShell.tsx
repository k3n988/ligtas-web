'use client'
// src/components/layout/DashboardShell.tsx
// Must be a Client Component so it can use dynamic() with ssr:false.

import dynamic from 'next/dynamic'
import Sidebar from './Sidebar'

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#1b1b1b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
      }}
    >
      Loading map…
    </div>
  ),
})

interface Props {
  children: React.ReactNode
}

export default function DashboardShell({ children }: Props) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 450px',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <MapView />
      <Sidebar>{children}</Sidebar>
    </div>
  )
}
