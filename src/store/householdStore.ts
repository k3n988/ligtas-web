// src/store/householdStore.ts

import { create } from 'zustand'
import type { Household } from '@/types'
import { mockHouseholds } from '@/lib/mockData'

interface HouseholdStore {
  households: Household[]
  panToId: string | null
  addHousehold: (h: Household) => void
  markRescued: (id: string) => void
  setPanTo: (id: string | null) => void
}

export const useHouseholdStore = create<HouseholdStore>((set) => ({
  households: mockHouseholds,
  panToId: null,
  addHousehold: (h) =>
    set((state) => ({ households: [...state.households, h] })),
  markRescued: (id) =>
    set((state) => ({
      households: state.households.map((hh) =>
        hh.id === id ? { ...hh, status: 'Rescued' as const } : hh,
      ),
    })),
  setPanTo: (id) => set({ panToId: id }),
}))
