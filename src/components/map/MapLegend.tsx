'use client'
// src/components/map/MapLegend.tsx

import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

export default function MapLegend() {
  const map = useMap()

  useEffect(() => {
    const legend = new (L.Control.extend({
      options: { position: 'bottomleft' },
      onAdd() {
        const div = L.DomUtil.create('div', 'ligtas-legend')
        div.innerHTML = `
          <h4 style="margin:0 0 10px;color:#fff;font-size:.8rem;letter-spacing:1px;text-transform:uppercase">Triage Levels</h4>
          <div class="lr"><span class="dot" style="background:#ff4d4d"></span> Critical (Immobile)</div>
          <div class="lr"><span class="dot" style="background:#f39c12"></span> High (Limited Mob.)</div>
          <div class="lr"><span class="dot" style="background:#f1c40f"></span> Elevated (Vuln.)</div>
          <div class="lr"><span class="dot" style="background:#58a6ff"></span> Stable</div>
          <div class="lr"><span class="dot" style="background:#238636"></span> Rescued</div>
          <hr style="border:0;border-top:1px solid #30363d;margin:10px 0"/>
          <h4 style="margin:0 0 10px;color:#fff;font-size:.8rem;letter-spacing:1px;text-transform:uppercase">Assets</h4>
          <div class="lr"><span class="sym">🚤</span> Rescue Boat</div>
          <div class="lr"><span class="sym">🛻</span> Transport Truck</div>
          <div class="lr"><span class="sym">🚑</span> Ambulance Team</div>
        `
        return div
      },
    }))()
    legend.addTo(map)
    return () => {
      legend.remove()
    }
  }, [map])

  return null
}
