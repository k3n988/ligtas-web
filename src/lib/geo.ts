// src/lib/geo.ts
import type { HazardEvent, TriageLevel } from '@/types'
import type { Household } from '@/types'

// ─── EXISTING CODE (unchanged) ───────────────────────────────────────────────

export function getDynamicTriage(
  lat: number,
  lng: number,
  originalLevel: TriageLevel,
  hazard: HazardEvent | null,
): TriageLevel {
  if (!hazard?.isActive) return originalLevel
  const d = haversineKm(lat, lng, hazard.center.lat, hazard.center.lng)
  if (d <= hazard.radii.critical) return 'CRITICAL'
  if (d <= hazard.radii.high)     return 'HIGH'
  if (d <= hazard.radii.elevated) return 'ELEVATED'
  if (d <= hazard.radii.stable)   return 'STABLE'
  return originalLevel
}

export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

export function pointInPolygon(
  point: { lat: number; lng: number },
  polygon: Array<{ lat: number; lng: number }>,
): boolean {
  let inside = false
  const { lat: y, lng: x } = point
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const { lat: yi, lng: xi } = polygon[i]
    const { lat: yj, lng: xj } = polygon[j]
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

// ─── NEW: Hazard zone filtering & queue prioritization ────────────────────────

/** Returns only households within the outermost hazard ring (stable radius). */
export function filterHouseholdsInHazardZone(
  households: Household[],
  hazard: HazardEvent,
): Household[] {
  return households.filter((hh) => {
    const dist = haversineKm(hh.lat, hh.lng, hazard.center.lat, hazard.center.lng)
    return dist <= hazard.radii.stable
  })
}

/**
 * Sorts hazard-affected households by ring priority then by proximity.
 *
 *   0 → Critical  (closest to epicenter first within ring)
 *   1 → High
 *   2 → Elevated
 *   3 → Stable
 */
export function sortHouseholdsByHazardProximity(
  households: Household[],
  hazard: HazardEvent,
): Household[] {
  function ringPriority(distKm: number): number {
    if (distKm <= hazard.radii.critical) return 0
    if (distKm <= hazard.radii.high)     return 1
    if (distKm <= hazard.radii.elevated) return 2
    return 3
  }

  return [...households].sort((a, b) => {
    const distA = haversineKm(a.lat, a.lng, hazard.center.lat, hazard.center.lng)
    const distB = haversineKm(b.lat, b.lng, hazard.center.lat, hazard.center.lng)
    const ringDiff = ringPriority(distA) - ringPriority(distB)
    if (ringDiff !== 0) return ringDiff
    return distA - distB  // same ring → closer first
  })
}

/**
 * Convenience: filter + sort in one call.
 * Falls back to the full unfiltered list when no hazard is active.
 *
 * Usage in a component:
 *   const queue = getHazardPrioritizedQueue(households, activeHazard)
 *
 * Usage in a Zustand selector:
 *   const queue = useHouseholdStore((s) => getHazardPrioritizedQueue(s.households, activeHazard))
 */
export function getHazardPrioritizedQueue(
  households: Household[],
  hazard: HazardEvent | null,
): Household[] {
  if (!hazard?.isActive) return households
  const affected = filterHouseholdsInHazardZone(households, hazard)
  return sortHouseholdsByHazardProximity(affected, hazard)
}