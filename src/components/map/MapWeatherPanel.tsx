'use client'

import { formatWeatherMetric, type WeatherResponse } from '@/lib/weather'

interface Props {
  weather: WeatherResponse | null
  loading: boolean
  refreshing: boolean
  error: string | null
  sourceLabel: string
  showFloodRisk: boolean
}

export default function MapWeatherPanel({
  weather,
  loading,
  refreshing,
  error,
  sourceLabel,
  showFloodRisk,
}: Props) {
  const iconUrl = weather?.icon
    ? `https://openweathermap.org/img/wn/${weather.icon}@2x.png`
    : null

  return (
    <div
      style={{
        position: 'absolute',
        left: 12,
        top: 12,
        zIndex: 20,
        width: 320,
        maxWidth: 'calc(100vw - 24px)',
        background: 'rgba(13, 17, 23, 0.94)',
        border: '1px solid #30363d',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.32)',
        color: '#f0f6fc',
        padding: 14,
        fontFamily: 'Inter, sans-serif',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: '0.68rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1 }}>
            Operational Weather
          </div>
          <div style={{ fontSize: '0.72rem', color: '#9fb3c8' }}>
            {sourceLabel}
          </div>
        </div>
        {refreshing && (
          <div style={{ fontSize: '0.68rem', color: '#58a6ff', fontWeight: 600 }}>
            Refreshing
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ fontSize: '0.82rem', color: '#9fb3c8' }}>
          Loading weather for this map area...
        </div>
      ) : error ? (
        <div style={{ fontSize: '0.82rem', color: '#ff7b72' }}>
          {error}
        </div>
      ) : weather && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                background: '#161b22',
                border: '1px solid #30363d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={iconUrl} alt={weather.condition} width={52} height={52} />
              ) : (
                <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>WX</span>
              )}
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {weather.location}, {weather.country}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#9fb3c8', textTransform: 'capitalize' }}>
                {weather.description}
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#7ee787', marginTop: 2 }}>
                {formatWeatherMetric(weather.temperatureC, ' C')}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <MetricCard label="Rain Now" value={formatWeatherMetric(weather.rain1h, ' mm')} tone="#58a6ff" />
            <MetricCard label="Next 6h" value={formatWeatherMetric(weather.next6hRainMm, ' mm')} tone="#58a6ff" />
            <MetricCard label="Clouds" value={formatWeatherMetric(weather.cloudiness, '%')} tone="#f2cc60" />
            <MetricCard label="Wind" value={formatWeatherMetric(weather.windSpeedMps, ' m/s')} tone="#79c0ff" />
          </div>

          <div style={{ marginBottom: showFloodRisk && weather.shouldSurfaceFloodRisk ? 12 : 0 }}>
            <div style={{ fontSize: '0.68rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              Forecast Window
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
              {weather.forecast.slice(0, 3).map((step) => (
                <div
                  key={step.time}
                  style={{
                    minWidth: 84,
                    padding: '8px 9px',
                    background: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: 8,
                    fontSize: '0.7rem',
                  }}
                >
                  <div style={{ color: '#9fb3c8', marginBottom: 4 }}>
                    {new Date(step.time).toLocaleTimeString([], { hour: 'numeric' })}
                  </div>
                  <div style={{ color: '#f0f6fc', fontWeight: 700 }}>
                    {formatWeatherMetric(step.temperatureC, ' C')}
                  </div>
                  <div style={{ color: '#58a6ff', marginTop: 3 }}>
                    {formatWeatherMetric(step.rainMm, ' mm')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showFloodRisk && weather.shouldSurfaceFloodRisk && (
            <div
              style={{
                background: weather.floodRiskLevel === 'elevated' ? '#3d1a1a' : '#2d2416',
                border: `1px solid ${weather.floodRiskLevel === 'elevated' ? '#da3633' : '#d29922'}`,
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: weather.floodRiskLevel === 'elevated' ? '#ff7b72' : '#f2cc60', marginBottom: 4 }}>
                {weather.floodRiskTitle}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#c9d1d9', lineHeight: 1.45 }}>
                {weather.floodRiskMessage}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div
      style={{
        background: '#161b22',
        border: '1px solid #30363d',
        borderLeft: `3px solid ${tone}`,
        borderRadius: 8,
        padding: '8px 10px',
      }}
    >
      <div style={{ fontSize: '0.66rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {label}
      </div>
      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f0f6fc', marginTop: 3 }}>
        {value}
      </div>
    </div>
  )
}
