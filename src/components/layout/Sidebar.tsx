// src/components/layout/Sidebar.tsx

import Header from './Header'

interface Props {
  children: React.ReactNode
}

export default function Sidebar({ children }: Props) {
  return (
    <aside
      className="sidebar-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        zIndex: 10,
        overflowY: 'hidden',
      }}
    >
      <div className="sidebar-header">
        <Header />
      </div>
      <div
        className="mobile-panel-pad"
        style={{
          overflowY: 'auto',
          flexGrow: 1,
          padding: 20,
          background: 'var(--bg-base)',
        }}
      >
        {children}
      </div>
    </aside>
  )
}
