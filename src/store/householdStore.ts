// src/store/householdStore.ts

import { create } from 'zustand'
import type { Household } from '@/types'
import { supabase, rowToHousehold, householdToRow } from '@/lib/supabase'

interface HouseholdStore {
  households: Household[]
  panToId: string | null
  selectedId: string | null
  pickingLocation: boolean
  pendingCoords: { lat: number; lng: number } | null
  loadHouseholds: () => Promise<void>
  addHousehold: (h: Household) => Promise<void>
  markRescued: (id: string) => Promise<void>
  restorePending: (id: string) => Promise<void>
  setPanTo: (id: string | null) => void
  setSelectedId: (id: string | null) => void
  dispatchRescue: (householdId: string, assetId: string) => Promise<void>
  setPickingLocation: (v: boolean) => void
  setPendingCoords: (c: { lat: number; lng: number } | null) => void
}

export const useHouseholdStore = create<HouseholdStore>((set) => ({
  households: [],
  panToId: null,
  selectedId: null,
  pickingLocation: false,
  pendingCoords: null,

  loadHouseholds: async () => {
    const { data, error } = await supabase
      .from('households')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { console.error('[LIGTAS] loadHouseholds:', error.message); return }
    set({ households: (data ?? []).map(rowToHousehold) })
  },

  addHousehold: async (h) => {
    // Optimistic — show immediately in UI
    set((s) => ({ households: [h, ...s.households] }))
    const { error } = await supabase.from('households').insert(householdToRow(h))
    if (error) {
      console.error('[LIGTAS] addHousehold:', error.message)
      // Roll back on failure
      set((s) => ({ households: s.households.filter((hh) => hh.id !== h.id) }))
      throw error
    }
  },

  markRescued: async (id) => {
    set((s) => ({
      households: s.households.map((hh) =>
        hh.id === id ? { ...hh, status: 'Rescued' as const } : hh,
      ),
    }))
    const { error } = await supabase
      .from('households').update({ status: 'Rescued' }).eq('id', id)
    if (error) console.error('[LIGTAS] markRescued:', error.message)
  },

  restorePending: async (id) => {
    set((s) => ({
      households: s.households.map((hh) =>
        hh.id === id ? { ...hh, status: 'Pending' as const } : hh,
      ),
    }))
    const { error } = await supabase
      .from('households').update({ status: 'Pending' }).eq('id', id)
    if (error) console.error('[LIGTAS] restorePending:', error.message)
  },

  setPanTo: (id) => set({ panToId: id }),
  setSelectedId: (id) => set({ selectedId: id }),

  dispatchRescue: async (householdId, assetId) => {
    const dispatchedAt = new Date().toISOString()
    set((s) => ({
      households: s.households.map((hh) =>
        hh.id === householdId
          ? { ...hh, assignedAssetId: assetId, dispatchedAt }
          : hh,
      ),
    }))
    const { error } = await supabase
      .from('households')
      .update({ assigned_asset_id: assetId, dispatched_at: dispatchedAt })
      .eq('id', householdId)
    if (error) console.error('[LIGTAS] dispatchRescue:', error.message)
  },

  setPickingLocation: (v) => set({ pickingLocation: v }),
  setPendingCoords: (c) => set({ pendingCoords: c }),
}))
