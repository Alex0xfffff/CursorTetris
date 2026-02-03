import { useRef, useEffect } from 'react'
import type { Piece } from '@/logic/Piece'
import { PIECE_COLORS } from '@/logic/Piece'
import { CELL_SIZE } from '@/utils/constants'

const PREVIEW_SIZE = 4
const PREVIEW_CELL = 18
const PREVIEW_PX = PREVIEW_SIZE * PREVIEW_CELL

interface NextPieceProps {
  piece: Piece | null
  theme: string
}

export function NextPiece({ piece, theme }: NextPieceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio ?? 1, 2)
    canvas.width = PREVIEW_PX * dpr
    canvas.height = PREVIEW_PX * dpr
    canvas.style.width = `${PREVIEW_PX}px`
    canvas.style.height = `${PREVIEW_PX}px`
    ctx.scale(dpr, dpr)
    ctx.fillStyle = 'rgba(0,0,0,0.2)'
    ctx.fillRect(0, 0, PREVIEW_PX, PREVIEW_PX)
    if (!piece) return
    const cells = piece.getCells()
    const minX = Math.min(...cells.map((c) => c.x))
    const minY = Math.min(...cells.map((c) => c.y))
    const color = PIECE_COLORS[piece.type as keyof typeof PIECE_COLORS]
    ctx.fillStyle = color
    if (theme === 'neon') {
      ctx.shadowBlur = 6
      ctx.shadowColor = color
    }
    for (const { x, y } of cells) {
      const px = (x - minX) * PREVIEW_CELL + 1
      const py = (y - minY) * PREVIEW_CELL + 1
      ctx.fillRect(px, py, PREVIEW_CELL - 2, PREVIEW_CELL - 2)
    }
    ctx.shadowBlur = 0
  }, [piece, theme])

  return (
    <div className="next-piece">
      <canvas ref={canvasRef} className="next-piece__canvas" width={PREVIEW_PX} height={PREVIEW_PX} />
    </div>
  )
}
