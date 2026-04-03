// src/app/(dashboard)/admin/AssetTable.tsx
'use client'

import { useAssetStore } from '@/store/assetStore'

export default function AssetTable() {
  const assets = useAssetStore((s) => s.assets)
  const deleteAsset = useAssetStore((s) => s.deleteAsset) // Make sure you have this in your store

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      deleteAsset(id)
    }
  }

  return (
    <div className="w-full bg-[#0d1117] rounded-md border border-[#30363d] overflow-hidden">
      <table className="w-full text-left text-sm text-gray-300">
        <thead className="bg-[#161b22] text-xs uppercase text-gray-500 border-b border-[#30363d]">
          <tr>
            <th className="px-4 py-3 font-semibold">Asset ID</th>
            <th className="px-4 py-3 font-semibold">Name</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 font-semibold">Unit / Agency</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#30363d]">
          {assets.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                No assets registered yet.
              </td>
            </tr>
          ) : (
            assets.map((asset) => (
              <tr key={asset.id} className="hover:bg-[#1c2128] transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {/* Pinuputol natin ng konti yung ID para di masyadong mahaba sa table, optional 'to */}
                  {asset.id.substring(0, 8)}...
                </td>
                <td className="px-4 py-3 font-medium text-white">{asset.name}</td>
                <td className="px-4 py-3">{asset.type}</td>
                <td className="px-4 py-3">{asset.unit}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    asset.status === 'Active' ? 'bg-green-900/30 text-green-500' : 
                    asset.status === 'Dispatching' ? 'bg-yellow-900/30 text-yellow-500' : 
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {asset.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button 
                    onClick={() => alert(`Edit functionality for ${asset.id} coming soon!`)}
                    className="mr-2 px-3 py-1 bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 rounded text-xs font-semibold border border-blue-900/50 cursor-pointer"
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(asset.id)}
                    className="px-3 py-1 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded text-xs font-semibold border border-red-900/50 cursor-pointer"
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}