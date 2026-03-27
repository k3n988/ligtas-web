// src/app/queue/page.tsx

import DashboardShell from '@/components/layout/DashboardShell'
import TriageQueue from './TriageQueue'

export const metadata = { title: 'L.I.G.T.A.S. | Queue' }

export default function QueuePage() {
  return (
    <DashboardShell>
      <TriageQueue />
    </DashboardShell>
  )
}
