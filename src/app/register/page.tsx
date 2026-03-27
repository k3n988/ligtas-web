// src/app/register/page.tsx

import DashboardShell from '@/components/layout/DashboardShell'
import RegistrationForm from '@/components/registration/RegistrationForm'

export const metadata = { title: 'L.I.G.T.A.S. | Register Household' }

export default function RegisterPage() {
  return (
    <DashboardShell>
      <RegistrationForm />
    </DashboardShell>
  )
}
