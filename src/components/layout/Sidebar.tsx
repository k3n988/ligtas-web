'use client'

import { useEffect, useRef, useState } from 'react'
import Header from './Header'

interface Props {
  children: React.ReactNode
}

const MOBILE_SHEET_COLLAPSED_OFFSET = 180
const MOBILE_SHEET_SNAP_THRESHOLD = 36

export default function Sidebar({ children }: Props) {
  const [sheetOffset, setSheetOffset] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef<number | null>(null)
  const dragStartOffset = useRef(0)
  const dragDelta = useRef(0)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const sync = () => {
      const mobile = media.matches
      setIsMobile(mobile)
      if (!mobile) {
        setSheetOffset(0)
        document.documentElement.removeAttribute('data-mobile-sheet')
      }
    }

    sync()
    media.addEventListener('change', sync)
    return () => {
      media.removeEventListener('change', sync)
      document.documentElement.removeAttribute('data-mobile-sheet')
    }
  }, [])

  useEffect(() => {
    if (!isMobile) {
      document.documentElement.removeAttribute('data-mobile-sheet')
      return
    }

    document.documentElement.setAttribute(
      'data-mobile-sheet',
      sheetOffset >= MOBILE_SHEET_COLLAPSED_OFFSET - 24 ? 'collapsed' : 'expanded',
    )
  }, [isMobile, sheetOffset])

  function clampOffset(value: number) {
    return Math.max(0, Math.min(MOBILE_SHEET_COLLAPSED_OFFSET, value))
  }

  function startDrag(clientY: number) {
    if (!isMobile) return
    setIsDragging(true)
    dragStartY.current = clientY
    dragStartOffset.current = sheetOffset
    dragDelta.current = 0
  }

  function moveDrag(clientY: number) {
    if (!isMobile || dragStartY.current == null) return
    const delta = clientY - dragStartY.current
    dragDelta.current = delta
    setSheetOffset(clampOffset(dragStartOffset.current + delta))
  }

  function endDrag() {
    if (!isMobile || dragStartY.current == null) return
    let nextOffset = sheetOffset > MOBILE_SHEET_COLLAPSED_OFFSET / 2
      ? MOBILE_SHEET_COLLAPSED_OFFSET
      : 0

    if (dragDelta.current > MOBILE_SHEET_SNAP_THRESHOLD) {
      nextOffset = MOBILE_SHEET_COLLAPSED_OFFSET
    } else if (dragDelta.current < -MOBILE_SHEET_SNAP_THRESHOLD) {
      nextOffset = 0
    }

    setSheetOffset(nextOffset)
    dragStartY.current = null
    dragDelta.current = 0
    setIsDragging(false)
  }

  return (
    <aside
      className="sidebar-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        zIndex: 10,
        overflowY: 'hidden',
        transform: isMobile ? `translateY(${sheetOffset}px)` : undefined,
        transition: isDragging ? 'none' : 'transform 0.22s ease',
      }}
    >
      <div className="sidebar-header">
        <div
          className="mobile-sheet-handle"
          aria-hidden="true"
          onMouseDown={(e) => startDrag(e.clientY)}
          onMouseMove={(e) => moveDrag(e.clientY)}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onTouchStart={(e) => startDrag(e.touches[0].clientY)}
          onTouchMove={(e) => moveDrag(e.touches[0].clientY)}
          onTouchEnd={endDrag}
          style={{
            display: 'none',
            justifyContent: 'center',
            paddingTop: 8,
            paddingBottom: 2,
            background: 'var(--bg-surface)',
            touchAction: 'none',
            cursor: isMobile ? 'grab' : 'default',
          }}
        >
          <span
            style={{
              width: 42,
              height: 5,
              borderRadius: 999,
              background: 'var(--border)',
              display: 'block',
            }}
          />
        </div>
        <Header />
      </div>
      <div
        className="mobile-panel-pad"
        style={{
          overflowY: 'auto',
          flexGrow: 1,
          minHeight: 0,
          padding: 20,
          background: 'var(--bg-base)',
        }}
      >
        {children}
      </div>
    </aside>
  )
}
