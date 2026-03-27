// src/app/assets/page.tsx

import DashboardShell from '@/components/layout/DashboardShell'
import DispatchPanel from './DispatchPanel'

export const metadata = { title: 'L.I.G.T.A.S. | Assets' }

export default function AssetsPage() {
  return (
    <DashboardShell>
      <DispatchPanel />
    </DashboardShell>
  )
}
