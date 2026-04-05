'use client'
// src/app/admin/page.tsx

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useHouseholdStore } from '@/store/householdStore'
import { useAuthStore } from '@/store/authStore'
import HouseholdTable from './HouseholdTable'
import AssetTable from './AssetTable'
// import PendingTable from './PendingTable' // <-- I-uncomment mo ito kapag may PendingTable component ka na!

export default function AdminPage() {
  const loadHouseholds = useHouseholdStore((s) => s.loadHouseholds)
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  
  // State para sa tabs
  const [activeTab, setActiveTab] = useState<'registry' | 'pending' | 'assets'>('registry')

  // Protect route: Redirect if not admin
  useEffect(() => {
    if (!user || user.role !== 'admin') router.replace('/')
  }, [user, router])

  useEffect(() => { 
    void loadHouseholds() 
  }, [loadHouseholds])

  // Helper function para sa design ng tabs (para hindi paulit-ulit)
  const getTabStyle = (isActive: boolean) => ({
    padding: '8px 16px',
    background: 'transparent',
    border: 'none',
    borderBottom: isActive ? '2px solid #58a6ff' : '2px solid transparent',
    color: isActive ? '#58a6ff' : '#8b949e',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    fontFamily: 'Inter, sans-serif',
    transition: 'all 0.2s ease',
  })

  if (!user || user.role !== 'admin') return null

  return (
    <div style={{ padding: '24px' }}> {/* Inalis na natin yung maxWidth dito para full-width uli! */}
      
      {/* --- HEADER SECTION --- */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 24 }}>
        <button
          onClick={() => router.back()}
          onMouseOver={(e) => (e.currentTarget.style.background = '#30363d')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#21262d')}
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
            transition: 'background 0.2s ease',
          }}
        >
          ← Back
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
            Household & Asset Registry
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#8b949e' }}>
            View, edit, or delete registered data. Changes sync to Supabase immediately.
          </p>
        </div>
      </div>

      {/* --- TABS NAVIGATION --- */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid #30363d', marginBottom: 20 }}>
        <button 
          style={getTabStyle(activeTab === 'registry')} 
          onClick={() => setActiveTab('registry')}
        >
          Household Registry
        </button>
        <button 
          style={getTabStyle(activeTab === 'pending')} 
          onClick={() => setActiveTab('pending')}
        >
          Pending Approvals
        </button>
        <button 
          style={getTabStyle(activeTab === 'assets')} 
          onClick={() => setActiveTab('assets')}
        >
          Asset Registry
        </button>
      </div>

      {/* --- CONDITIONAL RENDERING (Content Area) --- */}
      <div style={{ minHeight: '500px' }}> 
        {activeTab === 'registry' && <HouseholdTable />}
        
        {activeTab === 'pending' && (
          // <PendingTable /> {/* Palitan mo na lang ito kapag ready na yung component */}
          <div style={{ 
            padding: '40px 20px', 
            color: '#8b949e', 
            textAlign: 'center', 
            border: '1px dashed #30363d', 
            borderRadius: 6,
            background: '#0d1117'
          }}>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>⏳ Pending approvals table will go here...</p>
          </div>
        )}
        
        {activeTab === 'assets' && <AssetTable />}
      </div>

    </div>
  )
}