// src/store/householdStore.ts

import { create } from 'zustand'
import type { Household } from '@/types'
import { mockHouseholds } from '@/lib/mockData'

interface HouseholdStore {
  households: Household[]
  panToId: string | null
  selectedId: string | null          // drives the route overlay
  addHousehold: (h: Household) => void
  markRescued: (id: string) => void
  restorePending: (id: string) => void
  setPanTo: (id: string | null) => void
  setSelectedId: (id: string | null) => void
  dispatchRescue: (householdId: string, assetId: string) => void
}

export const useHouseholdStore = create<HouseholdStore>((set) => ({
  households: mockHouseholds,
  panToId: null,
  selectedId: null,
  addHousehold: (h) =>
    set((state) => ({ households: [...state.households, h] })),
  markRescued: (id) =>
    set((state) => ({
      households: state.households.map((hh) =>
        hh.id === id ? { ...hh, status: 'Rescued' as const } : hh,
      ),
    })),
  restorePending: (id) =>
    set((state) => ({
      households: state.households.map((hh) =>
        hh.id === id ? { ...hh, status: 'Pending' as const } : hh,
      ),
    })),
  setPanTo: (id) => set({ panToId: id }),
  setSelectedId: (id) => set({ selectedId: id }),
  dispatchRescue: (householdId, assetId) =>
    set((state) => ({
      households: state.households.map((hh) =>
        hh.id === householdId
          ? { ...hh, assignedAssetId: assetId, dispatchedAt: new Date().toISOString() }
          : hh,
      ),
    })),
}))
