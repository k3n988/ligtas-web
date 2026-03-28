// src/store/hazardStore.ts

import { create } from 'zustand'
import type { HazardArea } from '@/types'
import { mockHazards } from '@/lib/mockData'

interface HazardStore {
  hazards: HazardArea[]
  addHazard: (h: HazardArea) => void
  /**
   * Resolution State 2 — completely removes a hazard zone's polygon and
   * center marker from the map (simulates floodwaters receding, fire out, etc.)
   * Only the command center should call this; the UI enforces allRescued first.
   */
  clearHazard: (id: string) => void
}

export const useHazardStore = create<HazardStore>((set) => ({
  hazards: mockHazards,
  addHazard: (h) => set((s) => ({ hazards: [...s.hazards, h] })),
  clearHazard: (id) => set((s) => ({ hazards: s.hazards.filter((h) => h.id !== id) })),
}))
