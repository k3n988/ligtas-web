// src/types/index.ts

export type TriageLevel = 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'STABLE'

/**
 * Source of the household registration — aligns with the LGU-led
 * "Digitizing Existing Registries" approach in the LIGTAS solution.
 */
export type RegistrySource =
  | 'Senior Citizen Registry'
  | 'PWD Registry'
  | 'Maternal Health Record'
  | 'CSWDO Database'
  | 'BHW Field Survey'
  | 'Self-Reported'

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
  /** Which LGU registry or method this record originated from. */
  source?: RegistrySource
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

