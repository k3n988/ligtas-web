// src/store/assetStore.ts

import { create } from 'zustand'
import type { Asset } from '@/types'
import { mockAssets } from '@/lib/mockData'

interface AssetStore {
  assets: Asset[]
}

export const useAssetStore = create<AssetStore>(() => ({
  assets: mockAssets,
}))
