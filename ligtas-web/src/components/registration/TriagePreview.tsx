// src/components/registration/TriagePreview.tsx

import type { TriageResult } from '@/types'

interface Props {
  triage: TriageResult
}

export default function TriagePreview({ triage }: Props) {
  const isDefault = triage.level === 'STABLE' && !triage.hex

  return (
    <div
      style={{
        marginTop: 15,
        padding: '12px',
        borderRadius: 4,
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        border: `1px dashed ${triage.hex}`,
        background: 'rgba(0,0,0,0.2)',
        color: triage.hex,
        transition: 'all 0.2s',
      }}
    >
      {isDefault ? 'Triage Status: Pending Input' : `TRIAGE: ${triage.level} (${triage.colorName.toUpperCase()})`}
    </div>
  )
}
