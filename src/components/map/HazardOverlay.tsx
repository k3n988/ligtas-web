'use client'
// src/components/map/HazardOverlay.tsx
//
// NOAH-aligned hazard polygons with auto-resolution:
//   • Colors match Project NOAH's scale: Red=High, Orange=Medium, Yellow=Low
//   • Resolution State 1: polygon turns semi-transparent green when every
//     Household inside it is Rescued.
//   • Resolution State 2: clearHazard() removes the polygon + marker entirely.

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { InfoWindow, Marker, useMap } from '@vis.gl/react-google-maps'
import type { HazardArea, HazardLevel } from '@/types'
import { useHazardStore } from '@/store/hazardStore'
import { useHouseholdStore } from '@/store/householdStore'
import { pointInPolygon, polygonCenter } from '@/lib/geo'

// ─── NOAH-aligned color palette ───────────────────────────────────────────────

const FILL: Record<HazardLevel, string> = {
  High:   '#e74c3c', // red
  Medium: '#e67e22', // orange
  Low:    '#f4d03f', // yellow
}

const STROKE: Record<HazardLevel, string> = {
  High:   '#c0392b',
  Medium: '#ca6f1e',
  Low:    '#d4ac0d',
}

const FILL_OPACITY: Record<HazardLevel, number> = {
  High:   0.55,
  Medium: 0.50,
  Low:    0.45,
}

const EMOJI: Record<HazardArea['disasterType'], string> = {
  Flood:      '🌊',
  Fire:       '🔥',
  Landslide:  '⛰️',
  Storm:      '🌀',
  Earthquake: '📳',
}

function hazardCenterIcon(emoji: string, bg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44">
    <circle cx="22" cy="22" r="20" fill="${bg}" stroke="white" stroke-width="2.5"/>
    <text x="22" y="30" text-anchor="middle" font-size="22"
      font-family="Apple Color Emoji,Segoe UI Emoji,NotoColorEmoji,sans-serif">${emoji}</text>
  </svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

// ─── Imperative polygon renderer ──────────────────────────────────────────────

interface HazardPolygonProps {
  hazard: HazardArea
  allRescued: boolean
  onClick: () => void
}

function HazardPolygon({ hazard, allRescued, onClick }: HazardPolygonProps) {
  const map        = useMap()
  const polyRef    = useRef<google.maps.Polygon | null>(null)
  const onClickRef = useRef(onClick)
  onClickRef.current = onClick

  useEffect(() => {
    if (!map) return

    const poly = new google.maps.Polygon({
      paths:        hazard.polygon,
      fillColor:    FILL[hazard.level],
      fillOpacity:  FILL_OPACITY[hazard.level],
      strokeColor:  STROKE[hazard.level],
      strokeWeight: 2,
      zIndex:       1,
      map,
    })
    polyRef.current = poly

    const listener = poly.addListener('click', () => onClickRef.current())

    return () => {
      google.maps.event.removeListener(listener)
      poly.setMap(null)
      polyRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, hazard.id])

  // Resolution State 1: patch colors without rebuilding the polygon object.
  useEffect(() => {
    polyRef.current?.setOptions({
      fillColor:   allRescued ? '#238636'             : FILL[hazard.level],
      fillOpacity: allRescued ? 0.25                  : FILL_OPACITY[hazard.level],
      strokeColor: allRescued ? '#238636'             : STROKE[hazard.level],
    })
  }, [allRescued, hazard.level])

  return null
}

// ─── Main overlay ─────────────────────────────────────────────────────────────

export default function HazardOverlay() {
  const hazards     = useHazardStore((s) => s.hazards)
  const clearHazard = useHazardStore((s) => s.clearHazard)
  const households  = useHouseholdStore((s) => s.households)

  const [activeId, setActiveId] = useState<string | null>(null)

  const rescueStatus = useMemo(
    () =>
      Object.fromEntries(
        hazards.map((h) => {
          const inside       = households.filter((hh) =>
            pointInPolygon({ lat: hh.lat, lng: hh.lng }, h.polygon),
          )
          const rescuedCount = inside.filter((hh) => hh.status === 'Rescued').length
          const allRescued   = inside.length > 0 && rescuedCount === inside.length
          return [h.id, { allRescued, inside, rescuedCount }]
        }),
      ),
    [hazards, households],
  )

  const handleClear = useCallback(
    (id: string) => { clearHazard(id); setActiveId(null) },
    [clearHazard],
  )

  const activeHazard = hazards.find((h) => h.id === activeId) ?? null

  return (
    <>
      {hazards.map((hazard) => {
        const center    = polygonCenter(hazard.polygon)
        const { allRescued } = rescueStatus[hazard.id] ?? { allRescued: false }
        const bgColor   = allRescued ? '#238636' : FILL[hazard.level]

        return (
          <Fragment key={hazard.id}>
            <HazardPolygon
              hazard={hazard}
              allRescued={allRescued}
              onClick={() => setActiveId(hazard.id)}
            />
            <Marker
              position={center}
              icon={hazardCenterIcon(EMOJI[hazard.disasterType], bgColor)}
              title={`${hazard.label} — ${hazard.level}`}
              zIndex={2}
              onClick={() => setActiveId(hazard.id)}
            />
          </Fragment>
        )
      })}

      {activeHazard && (() => {
        const center = polygonCenter(activeHazard.polygon)
        const { allRescued, inside, rescuedCount } =
          rescueStatus[activeHazard.id] ?? { allRescued: false, inside: [], rescuedCount: 0 }
        const total    = inside.length
        const levelClr = FILL[activeHazard.level]

        return (
          <InfoWindow position={center} onCloseClick={() => setActiveId(null)}>
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                minWidth: 230,
                background: '#161b22',
                color: '#c9d1d9',
                padding: 4,
              }}
            >
              {/* Header */}
              <div
                style={{
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  color: '#fff',
                  borderBottom: '1px solid #30363d',
                  paddingBottom: 6,
                  marginBottom: 6,
                }}
              >
                {EMOJI[activeHazard.disasterType]} {activeHazard.label}
              </div>

              {/* NOAH-style hazard level badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 4,
                  background: `${levelClr}22`,
                  border: `1px solid ${levelClr}`,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: levelClr,
                  }}
                />
                <span style={{ fontWeight: 800, color: levelClr, fontSize: '0.8rem', letterSpacing: 1 }}>
                  {activeHazard.level.toUpperCase()} HAZARD LEVEL
                </span>
              </div>

              {/* Rescue progress */}
              <div
                style={{
                  padding: '8px 10px',
                  background: '#0d1117',
                  borderRadius: 4,
                  marginBottom: 12,
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ marginBottom: 6 }}>
                  Citizens in zone:{' '}
                  <strong style={{ color: '#fff' }}>{rescuedCount} / {total} rescued</strong>
                </div>
                <div style={{ height: 6, background: '#30363d', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${total ? (rescuedCount / total) * 100 : 0}%`,
                      background: allRescued ? '#238636' : '#58a6ff',
                      borderRadius: 3,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                {allRescued && (
                  <div style={{ marginTop: 6, color: '#238636', fontWeight: 700, fontSize: '0.73rem' }}>
                    ✓ All citizens rescued — zone ready to clear
                  </div>
                )}
              </div>

              {/* Resolution State 2 */}
              <button
                onClick={() => handleClear(activeHazard.id)}
                disabled={!allRescued}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'transparent',
                  border: `1px solid ${allRescued ? '#238636' : '#30363d'}`,
                  color: allRescued ? '#238636' : '#6e7681',
                  borderRadius: 4,
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: allRescued ? 'pointer' : 'not-allowed',
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: 0.3,
                }}
              >
                {allRescued ? '✓ Clear Hazard Area (Hazard Receded)' : '🔒 Clear Hazard Area'}
              </button>

              {!allRescued && total > 0 && (
                <div style={{ marginTop: 6, fontSize: '0.7rem', color: '#f85149' }}>
                  {total - rescuedCount} citizen(s) still awaiting rescue.
                </div>
              )}
            </div>
          </InfoWindow>
        )
      })()}
    </>
  )
}
