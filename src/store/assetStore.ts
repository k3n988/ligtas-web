// src/store/assetStore.ts

import { create } from 'zustand'
import type { Asset } from '@/types'
import { mockAssets } from '@/lib/mockData'

interface AssetStore {
  assets: Asset[]
  setAssetStatus: (id: string, status: Asset['status']) => void
}

export const useAssetStore = create<AssetStore>((set) => ({
  assets: mockAssets,
  setAssetStatus: (id, status) =>
    set((state) => ({
      assets: state.assets.map((a) => (a.id === id ? { ...a, status } : a)),
    })),
}))
