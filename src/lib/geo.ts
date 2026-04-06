// src/lib/geo.ts
import type { HazardEvent, TriageLevel } from '@/types'

/**
 * Dynamically overrides a household's triage level based on its distance
 * from an active hazard center. Returns the original level if no hazard is active
 * or the household is outside all radii.
 */
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

/** Haversine distance between two lat/lng pairs in kilometers. */
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

/**
 * Ray-casting point-in-polygon check.
 * Accurate for local-scale polygons where earth curvature is negligible.
 * Replaces the need for maps_toolkit in the web context.
 */
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

