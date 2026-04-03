'use client'
// src/components/layout/DashboardShell.tsx
// Must be a Client Component so it can use dynamic() with ssr:false.

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import Sidebar from './Sidebar'
import { useHouseholdStore } from '@/store/householdStore'
import { useAssetStore } from '@/store/assetStore'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import GuestPanel from '@/components/public/GuestPanel'

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
  const loadHouseholds = useHouseholdStore((s) => s.loadHouseholds)
  const loadAssets     = useAssetStore((s) => s.loadAssets)
  const user           = useAuthStore((s) => s.user)

  useEffect(() => {
    void loadHouseholds()
    void loadAssets()

    const channel = supabase
      .channel('ligtas-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'households' },
        () => { void loadHouseholds() },
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' },
        () => { void loadAssets() },
      )
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [loadHouseholds, loadAssets])

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
      <Sidebar>
        {user ? children : <GuestPanel />}
      </Sidebar>
    </div>
  )
}
