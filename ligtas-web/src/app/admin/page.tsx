'use client'
// src/app/admin/page.tsx

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHouseholdStore } from '@/store/householdStore'
import HouseholdTable from './HouseholdTable'

export default function AdminPage() {
  const loadHouseholds = useHouseholdStore((s) => s.loadHouseholds)
  const router = useRouter()
  useEffect(() => { void loadHouseholds() }, [loadHouseholds])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 24 }}>
        <button
          onClick={() => router.back()}
          style={{
            marginTop: 2,
            padding: '6px 14px',
            background: '#21262d',
            border: '1px solid #30363d',
            color: '#c9d1d9',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          ← Back
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
            Household Registry
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#8b949e' }}>
            View, edit, or delete registered households. Changes sync to Supabase immediately.
          </p>
        </div>
      </div>
      <HouseholdTable />
    </div>
  )
}
