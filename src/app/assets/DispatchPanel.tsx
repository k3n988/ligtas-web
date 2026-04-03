// src/app/dispatch/DispatchPanel.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAssetStore } from '@/store/assetStore'
import { useHouseholdStore } from '@/store/householdStore'
import { TRIAGE_ORDER } from '@/lib/triage'
import AssetCard from '@/components/dispatch/AssetCard'
import AddAssetForm from '@/components/dispatch/AddAssetForm'

export default function DispatchPanel() {
  const assets = useAssetStore((s) => s.assets)
  const households = useHouseholdStore((s) => s.households)
  const setPanTo = useHouseholdStore((s) => s.setPanTo)
  const [showAddForm, setShowAddForm] = useState(false)

  // Memoize the filtering logic so it only recalculates when 'households' change
  const { pending, critical } = useMemo(() => {
    const pendingList = households.filter((h) => h.status === 'Pending')
    const criticalList = pendingList.filter((h) => h.triage.level === 'CRITICAL')
    return { pending: pendingList, critical: criticalList }
  }, [households])

  // TODO: Consider moving this event logic into Zustand instead of window events
  useEffect(() => {
    const handler = (e: Event) => {
      const { lat, lng } = (e as CustomEvent<{ lat: number; lng: number }>).detail
      
      if (pending.length === 0) return
      
      const sorted = [...pending].sort(
        (a, b) => TRIAGE_ORDER[a.triage.level] - TRIAGE_ORDER[b.triage.level]
      )
      
      // Temporary hack: ignoring lat/lng to pan to the first critical household
      setPanTo(sorted[0].id)
    }
    
    window.addEventListener('ligtas:panToAsset', handler)
    return () => window.removeEventListener('ligtas:panToAsset', handler)
  }, [pending, setPanTo])

  const activeAssetsCount = assets.filter((a) => a.status === 'Active').length
  const dispatchingAssetsCount = assets.filter((a) => a.status === 'Dispatching').length

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-1.5">
        <h2 className="m-0 text-xs text-gray-400 uppercase tracking-wide">
          Assets
        </h2>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className={`px-3 py-1.5 rounded text-xs font-bold font-sans text-white border-none cursor-pointer ${
            showAddForm ? 'bg-[#21262d]' : 'bg-[#238636]'
          }`}
        >
          {showAddForm ? '✕ Cancel' : '+ Add Asset'}
        </button>
      </div>

      <p className="m-0 mb-4 text-xs text-gray-400">
        {activeAssetsCount} active &mdash; {dispatchingAssetsCount} dispatching
      </p>

      {showAddForm && <AddAssetForm onClose={() => setShowAddForm(false)} />}

      <div className="flex flex-col gap-2">
        {assets.map((asset) => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
      </div>

      {critical.length > 0 && (
        <>
          <h2 className="mt-5 mb-2.5 text-xs text-red-500 uppercase tracking-wide">
            🚨 Critical — Awaiting Dispatch ({critical.length})
          </h2>
          {critical.map((hh) => (
            <div
              key={hh.id}
              className="px-3.5 py-2.5 mb-2 bg-[#21262d] rounded-md border-l-4 border-red-500 text-sm flex justify-between items-center"
            >
              <div>
                <div className="font-semibold text-white mb-0.5">{hh.head}</div>
                <div className="text-gray-400 text-xs">
                  {hh.street}, {hh.barangay}
                </div>
              </div>
              <button
                onClick={() => setPanTo(hh.id)}
                className="bg-[#30363d] text-white border-none rounded px-2.5 py-1.5 cursor-pointer text-xs font-semibold"
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