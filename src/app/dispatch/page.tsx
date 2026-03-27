// src/app/dispatch/page.tsx

import DashboardShell from '@/components/layout/DashboardShell'
import DispatchPanel from './DispatchPanel'

export const metadata = { title: 'L.I.G.T.A.S. | Dispatch' }

export default function DispatchPage() {
  return (
    <DashboardShell>
      <DispatchPanel />
    </DashboardShell>
  )
}
