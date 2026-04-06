// src/store/hazardStore.ts
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { HazardEvent } from '@/types'

// ── Row ↔ HazardEvent mappers ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToHazard(row: any): HazardEvent {
  return {
    id:       row.id,
    type:     row.type,
    center:   { lat: row.center_lat, lng: row.center_lng },
    radii: {
      critical: row.radius_critical,
      high:     row.radius_high,
      elevated: row.radius_elevated,
      stable:   row.radius_stable,
    },
    isActive: row.is_active,
  }
}

function hazardToRow(h: HazardEvent) {
  return {
    id:               h.id,
    type:             h.type,
    center_lat:       h.center.lat,
    center_lng:       h.center.lng,
    radius_critical:  h.radii.critical,
    radius_high:      h.radii.high,
    radius_elevated:  h.radii.elevated,
    radius_stable:    h.radii.stable,
    is_active:        h.isActive,
  }
}

// ── Store ──────────────────────────────────────────────────────────────────

interface HazardStore {
  activeHazard:         HazardEvent | null
  isSelectingCenter:    boolean
  draftCenter:          { lat: number; lng: number } | null

  loadActiveHazard:     () => Promise<void>
  setActiveHazard:      (hazard: HazardEvent | null) => Promise<void>
  clearHazard:          () => Promise<void>
  setIsSelectingCenter: (v: boolean) => void
  setDraftCenter:       (c: { lat: number; lng: number } | null) => void
}

export const useHazardStore = create<HazardStore>((set) => ({
  activeHazard:         null,
  isSelectingCenter:    false,
  draftCenter:          null,

  // ── Load the single active hazard from Supabase ────────────────────────
  loadActiveHazard: async () => {
    const { data, error } = await supabase
      .from('hazard_events')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) { console.error('[LIGTAS] loadActiveHazard:', error.message); return }
    set({ activeHazard: data ? rowToHazard(data) : null })
  },

  // ── Upsert a new active hazard (deactivates any previous one first) ───
  setActiveHazard: async (hazard) => {
    if (!hazard) return

    // Optimistic UI
    set({ activeHazard: hazard })

    // Deactivate all existing active hazards
    await supabase
      .from('hazard_events')
      .update({ is_active: false })
      .eq('is_active', true)

    // Insert the new one
    const { error } = await supabase
      .from('hazard_events')
      .insert(hazardToRow(hazard))

    if (error) {
      console.error('[LIGTAS] setActiveHazard:', error.message)
      set({ activeHazard: null })
    }
  },

  // ── Deactivate — marks is_active = false in Supabase ──────────────────
  clearHazard: async () => {
    set({ activeHazard: null, draftCenter: null })

    const { error } = await supabase
      .from('hazard_events')
      .update({ is_active: false })
      .eq('is_active', true)

    if (error) console.error('[LIGTAS] clearHazard:', error.message)
  },

  setIsSelectingCenter: (v) => set({ isSelectingCenter: v }),
  setDraftCenter:       (c) => set({ draftCenter: c }),
}))
