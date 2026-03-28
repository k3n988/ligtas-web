// src/types/index.ts

export type TriageLevel = 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'STABLE'

export type Vulnerability =
  | 'Bedridden'
  | 'Senior'
  | 'Wheelchair'
  | 'Infant'
  | 'Pregnant'
  | 'PWD'
  | 'Oxygen'
  | 'Dialysis'

export interface TriageResult {
  level: TriageLevel
  hex: string
  colorName: string
}

export interface Household {
  id: string
  lat: number
  lng: number
  city: string
  barangay: string
  purok: string
  street: string
  structure: string
  head: string
  contact: string
  occupants: number
  vulnArr: Vulnerability[]
  notes: string
  status: 'Pending' | 'Rescued'
  triage: TriageResult
  assignedAssetId?: string
  dispatchedAt?: string
}

export interface Asset {
  id: string
  name: string
  type: string
  unit: string
  status: 'Active' | 'Dispatching' | 'Standby'
  lat: number
  lng: number
  icon: string
}

// ─── Hazard Overlay types ─────────────────────────────────────────────────────

export type DisasterType = 'Flood' | 'Fire' | 'Landslide' | 'Storm' | 'Earthquake'

/** NOAH-aligned hazard scale: High > Medium > Low */
export type HazardLevel = 'High' | 'Medium' | 'Low'

export interface HazardArea {
  id: string
  /** Human-readable zone name shown in the InfoWindow header. */
  label: string
  disasterType: DisasterType
  /** Scale of the disaster, set by the command center. */
  level: HazardLevel
  /** Ordered list of lat/lng vertices defining the polygon boundary. */
  polygon: Array<{ lat: number; lng: number }>
}
