// src/app/triage/page.tsx

import DashboardShell from '@/components/layout/DashboardShell'
import TriageQueue from './TriageQueue'

export const metadata = { title: 'L.I.G.T.A.S. | Triage Queue' }

export default function TriagePage() {
  return (
    <DashboardShell>
      <TriageQueue />
    </DashboardShell>
  )
}
