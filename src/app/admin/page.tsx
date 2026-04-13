'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useHouseholdStore } from '@/store/householdStore'
import { useAssetStore } from '@/store/assetStore'
import { useHazardStore } from '@/store/hazardStore'
import { haversineKm, getDynamicTriage, getFloodTriage } from '@/lib/geo'
import HouseholdTable from './HouseholdTable'
import AssetTable from './AssetTable'
import SummaryReportModal from '@/components/dashboard/SummaryReportModal'
import type { TriageLevel } from '@/types'

export default function AdminPage() {
  const loadHouseholds = useHouseholdStore((s) => s.loadHouseholds)
  const households = useHouseholdStore((s) => s.households)
  const assets = useAssetStore((s) => s.assets)
  const activeHazard = useHazardStore((s) => s.activeHazard)
  const floodZones = useHazardStore((s) => s.floodZones)
  const router = useRouter()

  const triageOverrides = useMemo<Map<string, TriageLevel>>(() => {
    const map = new Map<string, TriageLevel>()
    if (!activeHazard?.isActive) return map

    if (activeHazard.type === 'Flood') {
      for (const hh of households) {
        if (hh.status === 'Rescued') continue
        const level = getFloodTriage({ lat: hh.lat, lng: hh.lng }, floodZones, hh.triage.level)
        if (level !== hh.triage.level) map.set(hh.id, level)
      }
    } else {
      for (const hh of households) {
        const dist = haversineKm(hh.lat, hh.lng, activeHazard.center.lat, activeHazard.center.lng)
        if (dist <= activeHazard.radii.stable) {
          map.set(hh.id, getDynamicTriage(hh.lat, hh.lng, hh.triage.level, activeHazard))
        }
      }
    }
    return map
  }, [households, activeHazard, floodZones])

  const [activeTab, setActiveTab] = useState<'summary' | 'registry' | 'assets'>('summary')

  useEffect(() => {
    void loadHouseholds()
  }, [loadHouseholds])

  const getTabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    background: 'transparent',
    border: 'none',
    borderBottom: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
    color: isActive ? 'var(--accent-blue)' : 'var(--fg-muted)',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
  })

  const exportCSV = () => {
    let headers: string[] = []
    let rows: string[][] = []
    let filename = ''

    if (activeTab === 'registry') {
      filename = 'household_registry.csv'
      headers = ['ID', 'Household Head', 'Contact', 'Source', 'City', 'Barangay', 'Purok', 'Street', 'Structure', 'Occupants', 'Vulnerabilities', 'Triage Level', 'Status', 'Approval Status', 'Lat', 'Lng', 'Registered At']
      rows = households.map((h) => [
        h.id,
        h.head ?? '',
        h.contact ?? '',
        h.source ?? '',
        h.city ?? '',
        h.barangay ?? '',
        h.purok ?? '',
        h.street ?? '',
        h.structure ?? '',
        String(h.occupants ?? ''),
        (h.vulnArr ?? []).join('; '),
        h.triage?.level ?? '',
        h.status ?? '',
        h.approvalStatus ?? '',
        String(h.lat ?? ''),
        String(h.lng ?? ''),
        h.created_at ? new Date(h.created_at).toLocaleString() : '',
      ])
    } else {
      filename = 'asset_registry.csv'
      headers = ['ID', 'Name', 'Type', 'Unit / Agency', 'Contact', 'Address', 'Status', 'Lat', 'Lng']
      rows = assets.map((a) => [
        a.id,
        a.name ?? '',
        a.type ?? '',
        a.unit ?? '',
        a.contact ?? '',
        a.address ?? '',
        a.status ?? '',
        String(a.lat ?? ''),
        String(a.lng ?? ''),
      ])
    }

    const escape = (val: string) =>
      val.includes(',') || val.includes('"') || val.includes('\n') ? `"${val.replace(/"/g, '""')}"` : val

    const csv = [headers.join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ padding: '24px', color: 'var(--fg-default)' }}>
      <div className="mobile-stack" style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 24 }}>
        <button
          onClick={() => router.back()}
          style={{
            marginTop: 2,
            padding: '6px 14px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            color: 'var(--fg-default)',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          Back
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-default)' }}>
            Household & Asset Registry
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--fg-muted)' }}>
            View, edit, or delete registered data.
          </p>
        </div>
        <button
          onClick={exportCSV}
          style={{
            marginTop: 2,
            padding: '6px 14px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--accent-blue)',
            color: 'var(--accent-blue)',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          Export CSV
        </button>
      </div>

      <div className="mobile-scroll-x hide-scrollbar" style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        <button style={getTabStyle(activeTab === 'summary')} onClick={() => setActiveTab('summary')}>
          Summary Report
        </button>
        <button style={getTabStyle(activeTab === 'registry')} onClick={() => setActiveTab('registry')}>
          Household Registry
        </button>
        <button style={getTabStyle(activeTab === 'assets')} onClick={() => setActiveTab('assets')}>
          Asset Registry
        </button>
      </div>

      <div style={{ minHeight: '500px' }}>
        {activeTab === 'summary' && (
          <SummaryReportModal
            households={households}
            assets={assets}
            activeHazard={activeHazard}
            floodZones={floodZones}
            onClose={() => setActiveTab('registry')}
          />
        )}
        {activeTab === 'registry' && (
          <>
            {activeHazard?.isActive && (
              <div
                style={{
                  background: 'var(--bg-danger-subtle)',
                  border: '1px solid var(--fg-danger)',
                  borderRadius: 6,
                  padding: '10px 16px',
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--fg-danger)',
                }}
              >
                <span>Hazard Layer Active</span>
                <span style={{ color: 'var(--fg-warning)' }}>{activeHazard.type}</span>
                <span style={{ color: 'var(--fg-muted)', fontWeight: 400 }}>
                  · {triageOverrides.size} households with overridden triage
                  {activeHazard.type !== 'Flood' && (
                    <> · Critical ≤{activeHazard.radii.critical}km / High ≤{activeHazard.radii.high}km / Elevated ≤{activeHazard.radii.elevated}km / Stable ≤{activeHazard.radii.stable}km</>
                  )}
                  {activeHazard.type === 'Flood' && (
                    <> · {floodZones.length} polygon zone{floodZones.length !== 1 ? 's' : ''} active</>
                  )}
                </span>
              </div>
            )}
            <HouseholdTable triageOverrides={triageOverrides} />
          </>
        )}
        {activeTab === 'assets' && <AssetTable />}
      </div>
    </div>
  )
}
