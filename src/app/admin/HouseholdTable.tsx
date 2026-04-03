'use client'
// src/app/admin/HouseholdTable.tsx

import { useState } from 'react'
import { useHouseholdStore } from '@/store/householdStore'
import { assessTriage } from '@/lib/triage'
import type { Household, RegistrySource, Vulnerability } from '@/types'

const TRIAGE_COLOR: Record<string, string> = {
  CRITICAL: '#ff4d4d',
  HIGH: '#f39c12',
  ELEVATED: '#f1c40f',
  STABLE: '#58a6ff',
}

const VULN_OPTIONS: { value: Vulnerability; label: string }[] = [
  { value: 'Bedridden',  label: 'Bedridden'        },
  { value: 'Senior',     label: 'Senior Citizen'    },
  { value: 'Wheelchair', label: 'Wheelchair User'   },
  { value: 'Infant',     label: 'Infant / Toddler'  },
  { value: 'Pregnant',   label: 'Pregnant'           },
  { value: 'PWD',        label: 'PWD'                },
  { value: 'Oxygen',     label: 'Oxygen Dependent'  },
  { value: 'Dialysis',   label: 'Dialysis Patient'  },
]

const SOURCE_OPTIONS: RegistrySource[] = [
  'Senior Citizen Registry', 'PWD Registry', 'Maternal Health Record',
  'CSWDO Database', 'BHW Field Survey', 'Self-Reported',
]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px',
  background: '#0d1117', border: '1px solid #30363d',
  color: '#fff', borderRadius: 4,
  fontFamily: 'Inter, sans-serif', fontSize: '0.82rem',
  boxSizing: 'border-box',
}

// ── Timestamp helpers ─────────────────────────────────────────────────────────

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatTime(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('en-PH', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

// ── Timestamp cell ─────────────────────────────────────────────────────────────

function TimestampCell({
  createdAt,
  updatedAt,
}: {
  createdAt?: string | null
  updatedAt?: string | null
}) {
  const wasEdited = updatedAt && updatedAt !== createdAt

  return (
    <td style={{ padding: '12px 14px', minWidth: 148 }}>
      {/* Created */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: '0.62rem', color: '#58a6ff', fontWeight: 700, letterSpacing: 0.5 }}>
          CREATED
        </span>
      </div>
      <div style={{ fontSize: '0.74rem', color: '#c9d1d9', marginTop: 1 }}>
        {formatDate(createdAt)}
      </div>
      <div style={{ fontSize: '0.68rem', color: '#8b949e' }}>
        {formatTime(createdAt)}
      </div>

      {/* Updated — only show when different from created */}
      {wasEdited && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
            <span style={{ fontSize: '0.62rem', color: '#f39c12', fontWeight: 700, letterSpacing: 0.5 }}>
              UPDATED
            </span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#c9d1d9', marginTop: 1 }}>
            {formatDate(updatedAt)}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#8b949e' }}>
            {formatTime(updatedAt)}
          </div>
        </>
      )}
    </td>
  )
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({ hh, onClose }: { hh: Household; onClose: () => void }) {
  const updateHousehold = useHouseholdStore((s) => s.updateHousehold)

  const [head,      setHead]      = useState(hh.head)
  const [contact,   setContact]   = useState(hh.contact)
  const [occupants, setOccupants] = useState(hh.occupants)
  const [notes,     setNotes]     = useState(hh.notes)
  const [source,    setSource]    = useState<RegistrySource | ''>(hh.source ?? '')
  const [status,    setStatus]    = useState<'Pending' | 'Rescued'>(hh.status)
  const [vulnArr,   setVulnArr]   = useState<Vulnerability[]>(hh.vulnArr)
  const [saving,    setSaving]    = useState(false)

  const toggleVuln = (v: Vulnerability) =>
    setVulnArr((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    )

  const handleSave = async () => {
    setSaving(true)
    const triage = assessTriage(vulnArr)
    // Stamp updated_at with the current time on every admin edit
    const updated_at = new Date().toISOString()
    await updateHousehold(hh.id, {
      head, contact, occupants, notes,
      source: source as RegistrySource || undefined,
      status, vulnArr, triage,
      updated_at,
    })
    setSaving(false)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)', zIndex: 1000,
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(540px, 95vw)',
        maxHeight: '88vh', overflowY: 'auto',
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: 10, zIndex: 1001,
        fontFamily: 'Inter, sans-serif',
        color: '#c9d1d9',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: '1px solid #30363d',
          position: 'sticky', top: 0, background: '#161b22', zIndex: 1,
        }}>
          <div>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
              Edit Household
            </div>
            <div style={{ fontSize: '0.72rem', color: '#8b949e', marginTop: 2 }}>
              ID: {hh.id} &mdash; {hh.street}, Brgy. {hh.barangay}
            </div>
            {/* Timestamps in modal header */}
            <div style={{ display: 'flex', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.68rem', color: '#8b949e' }}>
                <span style={{ color: '#58a6ff', fontWeight: 700 }}>Created:</span>{' '}
                {formatDate(hh.created_at)} {formatTime(hh.created_at)}
              </span>
              {hh.updated_at && hh.updated_at !== hh.created_at && (
                <span style={{ fontSize: '0.68rem', color: '#8b949e' }}>
                  <span style={{ color: '#f39c12', fontWeight: 700 }}>Last edited:</span>{' '}
                  {formatDate(hh.updated_at)} {formatTime(hh.updated_at)}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none',
              color: '#8b949e', fontSize: '1.1rem', cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '0.7rem', color: '#8b949e', marginBottom: 4, textTransform: 'uppercase' }}>
              Household Head
            </label>
            <input value={head} onChange={(e) => setHead(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#8b949e', marginBottom: 4, textTransform: 'uppercase' }}>
                Contact
              </label>
              <input value={contact} onChange={(e) => setContact(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#8b949e', marginBottom: 4, textTransform: 'uppercase' }}>
                Occupants
              </label>
              <input
                type="number" min={1}
                value={occupants}
                onChange={(e) => setOccupants(parseInt(e.target.value) || 1)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#8b949e', marginBottom: 4, textTransform: 'uppercase' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Pending' | 'Rescued')}
                style={inputStyle}
              >
                <option value="Pending">Pending</option>
                <option value="Rescued">Rescued</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#8b949e', marginBottom: 4, textTransform: 'uppercase' }}>
                Source Registry
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as RegistrySource)}
                style={inputStyle}
              >
                <option value="">— None —</option>
                {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '0.7rem', color: '#8b949e', marginBottom: 6, textTransform: 'uppercase' }}>
              Vulnerability Profile
            </label>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
              background: '#21262d', padding: 10, borderRadius: 4,
              border: '1px solid #30363d',
            }}>
              {VULN_OPTIONS.map(({ value, label }) => (
                <label key={value} style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={vulnArr.includes(value)}
                    onChange={() => toggleVuln(value)}
                    style={{ width: 'auto', marginRight: 8 }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.7rem', color: '#8b949e', marginBottom: 4, textTransform: 'uppercase' }}>
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1, padding: '10px',
                background: saving ? '#1a3a5c' : '#238636',
                color: saving ? '#8b949e' : '#fff',
                border: 'none', borderRadius: 6,
                fontWeight: 700, fontSize: '0.85rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {saving ? '⏳ Saving…' : '✓ Save Changes'}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                border: '1px solid #30363d',
                color: '#8b949e', borderRadius: 6,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Main Table ────────────────────────────────────────────────────────────────

export default function HouseholdTable() {
  const households       = useHouseholdStore((s) => s.households)
  const deleteHousehold  = useHouseholdStore((s) => s.deleteHousehold)
  const approveHousehold = useHouseholdStore((s) => s.approveHousehold)
  const rejectHousehold  = useHouseholdStore((s) => s.rejectHousehold)

  const [activeTab,    setActiveTab]    = useState<'registry' | 'pending'>('registry')
  const [search,       setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Rescued'>('All')
  const [editTarget,   setEditTarget]   = useState<Household | null>(null)
  const [confirmId,    setConfirmId]    = useState<string | null>(null)
  const [approvingId,  setApprovingId]  = useState<string | null>(null)

  const pendingApprovals = households.filter((hh) => hh.approvalStatus === 'pending_review')

  const filtered = households
    .filter((hh) => hh.approvalStatus === 'approved')
    .filter((hh) => {
      const matchStatus = filterStatus === 'All' || hh.status === filterStatus
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        hh.head.toLowerCase().includes(q) ||
        hh.barangay.toLowerCase().includes(q) ||
        hh.city.toLowerCase().includes(q) ||
        hh.id.toLowerCase().includes(q)
      return matchStatus && matchSearch
    })

  const handleApprove = async (id: string) => {
    setApprovingId(id)
    await approveHousehold(id)
    setApprovingId(null)
  }

  const handleReject = async (id: string) => {
    setApprovingId(id)
    await rejectHousehold(id)
    setApprovingId(null)
  }

  return (
    <>
      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #30363d', paddingBottom: 0 }}>
        {(['registry', 'pending'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '9px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #58a6ff' : '2px solid transparent',
              color: activeTab === tab ? '#58a6ff' : '#8b949e',
              fontWeight: 700, fontSize: '0.8rem',
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              textTransform: 'uppercase', letterSpacing: 0.8,
              marginBottom: -1,
            }}
          >
            {tab === 'registry' ? 'Household Registry' : (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Pending Approvals
                {pendingApprovals.length > 0 && (
                  <span style={{
                    background: '#f39c12', color: '#0d1117',
                    borderRadius: 10, fontSize: '0.68rem',
                    fontWeight: 800, padding: '1px 6px', lineHeight: '1.4',
                  }}>
                    {pendingApprovals.length}
                  </span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'pending' ? (
        /* ── Pending Approvals Tab ── */
        pendingApprovals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#8b949e', fontSize: '0.9rem' }}>
            No pending submissions.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pendingApprovals.map((hh) => (
              <div
                key={hh.id}
                style={{
                  background: '#161b22',
                  border: '1px solid #30363d',
                  borderRadius: 8, padding: '16px 18px',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 12,
                  alignItems: 'start',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>{hh.head}</span>
                    <span style={{
                      padding: '2px 7px', borderRadius: 4, fontSize: '0.68rem', fontWeight: 700,
                      background: '#1e1810', color: '#f39c12', border: '1px solid #f39c1266',
                    }}>
                      Self-Reported
                    </span>
                    <span style={{
                      padding: '2px 7px', borderRadius: 4, fontSize: '0.68rem', fontWeight: 700,
                      color: TRIAGE_COLOR[hh.triage.level],
                    }}>
                      {hh.triage.level}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#8b949e', lineHeight: 1.6 }}>
                    <span>Brgy. {hh.barangay}, {hh.city}</span>
                    {hh.street && <span> &mdash; {hh.street}</span>}
                    <span style={{ margin: '0 8px' }}>·</span>
                    <span>{hh.contact}</span>
                    <span style={{ margin: '0 8px' }}>·</span>
                    <span>{hh.occupants} occupant{hh.occupants !== 1 ? 's' : ''}</span>
                    {/* Submitted timestamp */}
                    {hh.created_at && (
                      <>
                        <span style={{ margin: '0 8px' }}>·</span>
                        <span style={{ color: '#58a6ff' }}>
                          Submitted {formatDate(hh.created_at)} {formatTime(hh.created_at)}
                        </span>
                      </>
                    )}
                  </div>
                  {hh.vulnArr.length > 0 && (
                    <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {hh.vulnArr.map((v) => (
                        <span key={v} style={{
                          padding: '2px 7px', borderRadius: 4, fontSize: '0.68rem',
                          background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d',
                        }}>{v}</span>
                      ))}
                    </div>
                  )}
                  {hh.notes && (
                    <div style={{ marginTop: 6, fontSize: '0.75rem', color: '#8b949e', fontStyle: 'italic' }}>
                      &ldquo;{hh.notes}&rdquo;
                    </div>
                  )}
                  {hh.documentUrl && (
                    <div style={{ marginTop: 8 }}>
                      <a
                        href={hh.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.75rem', color: '#58a6ff',
                          textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}
                      >
                        📎 View Supporting Document
                      </a>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => { void handleApprove(hh.id) }}
                    disabled={approvingId === hh.id}
                    style={{
                      padding: '7px 14px',
                      background: approvingId === hh.id ? '#12261e' : '#238636',
                      color: approvingId === hh.id ? '#8b949e' : '#fff',
                      border: 'none', borderRadius: 6,
                      fontWeight: 700, fontSize: '0.78rem',
                      cursor: approvingId === hh.id ? 'not-allowed' : 'pointer',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => { void handleReject(hh.id) }}
                    disabled={approvingId === hh.id}
                    style={{
                      padding: '7px 14px',
                      background: '#2d1a1a', color: '#ff4d4d',
                      border: '1px solid #ff4d4d33',
                      borderRadius: 6,
                      fontWeight: 700, fontSize: '0.78rem',
                      cursor: approvingId === hh.id ? 'not-allowed' : 'pointer',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* ── Registry Tab ── */
        <>
          {/* Controls */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍  Search by name, barangay, city, or ID…"
              style={{
                flex: 1, minWidth: 220,
                padding: '9px 12px',
                background: '#161b22', border: '1px solid #30363d',
                color: '#fff', borderRadius: 6,
                fontFamily: 'Inter, sans-serif', fontSize: '0.83rem',
              }}
            />
            {(['All', 'Pending', 'Rescued'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: '8px 16px',
                  background: filterStatus === s ? '#58a6ff' : '#21262d',
                  color: filterStatus === s ? '#0d1117' : '#c9d1d9',
                  border: 'none', borderRadius: 6,
                  fontWeight: 700, fontSize: '0.78rem',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                {s}
              </button>
            ))}
            <span style={{ fontSize: '0.78rem', color: '#8b949e', marginLeft: 'auto' }}>
              {filtered.length} of {households.filter((hh) => hh.approvalStatus === 'approved').length} households
            </span>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #30363d' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: 980 }}>
              <thead>
                <tr style={{
                  background: '#161b22', color: '#8b949e',
                  textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.8,
                }}>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600 }}>ID</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600 }}>Household Head</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600 }}>Location</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600 }}>Triage</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600 }}>Source</th>
                  {/* ── New timestamps column ── */}
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600 }}>Timestamps</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#8b949e' }}>
                      No households found.
                    </td>
                  </tr>
                )}
                {filtered.map((hh) => (
                  <tr
                    key={hh.id}
                    style={{
                      borderTop: '1px solid #21262d',
                      background: confirmId === hh.id ? '#2d1a1a' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: '12px 14px', color: '#8b949e', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {hh.id}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{hh.head}</div>
                      <div style={{ fontSize: '0.72rem', color: '#8b949e', marginTop: 2 }}>
                        {hh.contact} &mdash; {hh.occupants} occ.
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#c9d1d9' }}>
                      <div>Brgy. {hh.barangay}</div>
                      <div style={{ fontSize: '0.72rem', color: '#8b949e' }}>{hh.city}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        color: TRIAGE_COLOR[hh.triage.level],
                        fontWeight: 700, fontSize: '0.75rem',
                      }}>
                        {hh.triage.level}
                      </span>
                      {hh.vulnArr.length > 0 && (
                        <div style={{ fontSize: '0.68rem', color: '#8b949e', marginTop: 2 }}>
                          {hh.vulnArr.join(', ')}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: hh.status === 'Rescued' ? '#12261e' : '#1e1810',
                        color: hh.status === 'Rescued' ? '#238636' : '#f39c12',
                        border: `1px solid ${hh.status === 'Rescued' ? '#238636' : '#f39c12'}`,
                      }}>
                        {hh.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#8b949e', fontSize: '0.75rem' }}>
                      {hh.source ?? '—'}
                    </td>

                    {/* ── Timestamps ── */}
                    <TimestampCell
                      createdAt={hh.created_at}
                      updatedAt={hh.updated_at}
                    />

                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {confirmId === hh.id ? (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', color: '#ff4d4d', fontWeight: 600 }}>Delete?</span>
                          <button
                            onClick={() => { void deleteHousehold(hh.id); setConfirmId(null) }}
                            style={{
                              padding: '4px 10px', background: '#ff4d4d',
                              color: '#fff', border: 'none', borderRadius: 4,
                              cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700,
                            }}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            style={{
                              padding: '4px 10px', background: 'transparent',
                              color: '#8b949e', border: '1px solid #30363d',
                              borderRadius: 4, cursor: 'pointer', fontSize: '0.72rem',
                            }}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button
                            onClick={() => setEditTarget(hh)}
                            style={{
                              padding: '5px 12px',
                              background: '#1f4170', color: '#58a6ff',
                              border: '1px solid #58a6ff33',
                              borderRadius: 4, cursor: 'pointer',
                              fontSize: '0.75rem', fontWeight: 600,
                              fontFamily: 'Inter, sans-serif',
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => setConfirmId(hh.id)}
                            style={{
                              padding: '5px 12px',
                              background: '#2d1a1a', color: '#ff4d4d',
                              border: '1px solid #ff4d4d33',
                              borderRadius: 4, cursor: 'pointer',
                              fontSize: '0.75rem', fontWeight: 600,
                              fontFamily: 'Inter, sans-serif',
                            }}
                          >
                            🗑 Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editTarget && <EditModal hh={editTarget} onClose={() => setEditTarget(null)} />}
    </>
  )
}