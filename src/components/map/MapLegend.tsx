'use client'

export default function MapLegend() {
  return (
    <div
      className="map-legend-overlay"
      style={{
        position: 'absolute',
        bottom: 30,
        left: 12,
        zIndex: 10,
        background: 'var(--map-panel-bg)',
        padding: '12px 14px',
        border: '1px solid var(--map-panel-border)',
        borderRadius: 12,
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.75rem',
        color: 'var(--fg-default)',
        boxShadow: 'var(--shadow-overlay)',
        lineHeight: 1.3,
        pointerEvents: 'none',
        maxWidth: 'calc(100vw - 24px)',
      }}
    >
      <div className="map-legend-section map-legend-section--triage">
        <div
          style={{
            fontWeight: 700,
            fontSize: '0.72rem',
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: 'var(--fg-default)',
            marginBottom: 8,
          }}
        >
          Triage Levels
        </div>

        {[
          { color: '#ff4d4d', label: 'Critical (Immobile)' },
          { color: '#f39c12', label: 'High (Limited Mob.)' },
          { color: '#f1c40f', label: 'Elevated (Vuln.)' },
          { color: '#58a6ff', label: 'Stable' },
          { color: '#238636', label: 'Rescued' },
        ].map(({ color, label }) => (
          <div
            key={label}
            className="map-legend-row"
            style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: color,
                border: '1px solid rgba(255,255,255,.3)',
                marginRight: 8,
                flexShrink: 0,
              }}
            />
            {label}
          </div>
        ))}
      </div>

      <div className="map-legend-divider" style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />

      <div className="map-legend-section map-legend-section--assets">
        <div
          style={{
            fontWeight: 700,
            fontSize: '0.72rem',
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: 'var(--fg-default)',
            marginBottom: 8,
          }}
        >
          Assets
        </div>

        <div
          className="map-legend-assets-compact"
          style={{ display: 'none', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}
        >
          {[
            { icon: '🚑', label: 'Ambulance' },
            { icon: '🚒', label: 'Truck' },
            { icon: '🚤', label: 'Boat' },
            { icon: '🚁', label: 'Helicopter' },
          ].map(({ icon, label }) => (
            <span
              key={label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 7px',
                borderRadius: 999,
                background: 'color-mix(in srgb, var(--bg-surface) 78%, var(--bg-elevated) 22%)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.62rem',
                fontWeight: 600,
              }}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </span>
          ))}
        </div>

        {[
          { icon: '🚤', label: 'Boat' },
          { icon: '🚛', label: 'Truck' },
          { icon: '🚑', label: 'Ambulance' },
          { icon: '🚁', label: 'Helicopter' },
          { icon: '🏍️', label: 'Motorcycle' },
          { icon: '🚐', label: 'Van' },
        ].map(({ icon, label }) => (
          <div
            key={label}
            className="map-legend-row map-legend-asset-row"
            style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}
          >
            <span style={{ fontSize: 14, marginRight: 8, width: 14, textAlign: 'center' }}>{icon}</span>
            {label}
          </div>
        ))}
      </div>

    </div>
  )
}
