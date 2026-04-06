// src/store/hazardStore.ts
import { create } from 'zustand'
import type { HazardEvent } from '@/types'

interface HazardStore {
  activeHazard:       HazardEvent | null
  setActiveHazard:    (hazard: HazardEvent | null) => void
  isSelectingCenter:  boolean
  setIsSelectingCenter: (v: boolean) => void
  draftCenter:        { lat: number; lng: number } | null
  setDraftCenter:     (c: { lat: number; lng: number } | null) => void
}

export const useHazardStore = create<HazardStore>((set) => ({
  activeHazard:         null,
  setActiveHazard:      (hazard) => set({ activeHazard: hazard }),
  isSelectingCenter:    false,
  setIsSelectingCenter: (v) => set({ isSelectingCenter: v }),
  draftCenter:          null,
  setDraftCenter:       (c) => set({ draftCenter: c }),
}))
