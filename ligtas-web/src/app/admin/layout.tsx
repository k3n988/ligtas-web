// src/app/admin/layout.tsx
// Full-width layout — no map sidebar

import Header from '@/components/layout/Header'

export const metadata = { title: 'L.I.G.T.A.S. | Admin' }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#0d1117' }}>
      {/* Reuse the sidebar header but full-width */}
      <aside style={{ background: 'var(--panel-bg)', borderBottom: '1px solid var(--border-color)' }}>
        <Header />
      </aside>
      <main style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        {children}
      </main>
    </div>
  )
}
