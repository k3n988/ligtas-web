// src/app/map/page.tsx — Map overview with live stats

import DashboardShell from '@/components/layout/DashboardShell'
import MapStatsPanel from './MapStatsPanel'

export const metadata = { title: 'L.I.G.T.A.S. | Map' }

export default function MapPage() {
  return (
    <DashboardShell>
      <MapStatsPanel />
    </DashboardShell>
  )
}
