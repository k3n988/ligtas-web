// src/store/assetStore.ts

import { create } from 'zustand'
import type { Asset } from '@/types'
import { supabase } from '@/lib/supabase'

interface AssetStore {
  assets: Asset[]
  loadAssets: () => Promise<void>
  setAssetStatus: (id: string, status: Asset['status']) => Promise<void>
}

export const useAssetStore = create<AssetStore>((set) => ({
  assets: [],

  loadAssets: async () => {
    const { data, error } = await supabase.from('assets').select('*').order('id')
    if (error) { console.error('[LIGTAS] loadAssets:', error.message); return }
    set({ assets: (data ?? []) as Asset[] })
  },

  setAssetStatus: async (id, status) => {
    set((s) => ({
      assets: s.assets.map((a) => (a.id === id ? { ...a, status } : a)),
    }))
    const { error } = await supabase.from('assets').update({ status }).eq('id', id)
    if (error) console.error('[LIGTAS] setAssetStatus:', error.message)
  },
}))
