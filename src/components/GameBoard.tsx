import { useRef, useEffect, useCallback } from 'react'
import type { GameState } from '@/logic/TetrisEngine'
import type { Piece } from '@/logic/Piece'
import { PIECE_COLORS } from '@/logic/Piece'
import { BOARD_WIDTH, BOARD_HEIGHT, CELL_SIZE, COLS, ROWS } from '@/utils/constants'
import type { ThemeId } from '@/utils/constants'

const LINE_CLEAR_ANIMATION_MS = 400

interface GameBoardProps {
  state: GameState
  theme: ThemeId
}

const themeColors: Record<ThemeId, { grid: string; ghost: string; flash: string; bg: string }> = {
  classic: { grid: 'rgba(255,255,255,0.1)', ghost: 'rgba(255,255,255,0.2)', flash: 'rgba(255,255,255,0.9)', bg: 'rgba(0,0,0,0.3)' },
  neon: { grid: 'rgba(0,255,255,0.15)', ghost: 'rgba(0,255,255,0.25)', flash: 'rgba(0,255,255,0.95)', bg: 'rgba(0,5,15,0.5)' },
  retro: { grid: 'rgba(180,180,180,0.2)', ghost: 'rgba(200,200,100,0.3)', flash: 'rgba(255,255,200,0.9)', bg: 'rgba(20,20,20,0.6)' },
}

function getGhostY(state: GameState): number | null {
  const piece = state.currentPiece
  if (!piece) return null
  let y = piece.y
  while (y < ROWS) {
    const test = piece.withOffset(0, y - piece.y + 1)
    if (!state.board.isValid(test)) break
    y++
  }
  return y - piece.y
}

export function GameBoard({ state, theme }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const s = stateRef.current
    const colors = themeColors[theme]
    const dpr = Math.min(window.devicePixelRatio ?? 1, 2)
    const w = BOARD_WIDTH
    const h = BOARD_HEIGHT
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.scale(dpr, dpr)
    }
    ctx.fillStyle = colors.bg
    ctx.fillRect(0, 0, w, h)

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cell = s.board.getGrid()[row]?.[col]
        const isClearing = s.linesClearing.includes(row)
        const elapsed = performance.now() - s.linesClearingStartTime
        const progress = Math.min(1, elapsed / LINE_CLEAR_ANIMATION_MS)
        if (cell?.filled) {
          if (isClearing) {
            ctx.fillStyle = colors.flash
            ctx.globalAlpha = 1 - progress * 0.8
            ctx.fillRect(col * CELL_SIZE + 1, row * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2)
            ctx.globalAlpha = 1
          } else {
            ctx.fillStyle = cell.color ?? '#888'
            ctx.shadowBlur = theme === 'neon' ? 8 : 0
            ctx.shadowColor = cell.color ?? '#888'
            ctx.fillRect(col * CELL_SIZE + 1, row * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2)
            ctx.shadowBlur = 0
          }
        }
      }
    }

    ctx.strokeStyle = colors.grid
    ctx.lineWidth = 1
    for (let row = 0; row <= ROWS; row++) {
      ctx.beginPath()
      ctx.moveTo(0, row * CELL_SIZE)
      ctx.lineTo(w, row * CELL_SIZE)
      ctx.stroke()
    }
    for (let col = 0; col <= COLS; col++) {
      ctx.beginPath()
      ctx.moveTo(col * CELL_SIZE, 0)
      ctx.lineTo(col * CELL_SIZE, h)
      ctx.stroke()
    }

    const piece = s.currentPiece
    const ghostOffset = getGhostY(s)
    if (piece && ghostOffset !== null && ghostOffset > 0) {
      const cells = piece.getCells().map((c) => ({ x: c.x, y: c.y + ghostOffset }))
      ctx.fillStyle = colors.ghost
      ctx.globalAlpha = 0.5
      for (const c of cells) {
        if (c.y >= 0 && c.y < ROWS)
          ctx.fillRect(c.x * CELL_SIZE + 2, c.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4)
      }
      ctx.globalAlpha = 1
    }

    if (piece) {
      const color = PIECE_COLORS[piece.type as keyof typeof PIECE_COLORS]
      ctx.fillStyle = color
      if (theme === 'neon') {
        ctx.shadowBlur = 10
        ctx.shadowColor = color
      }
      for (const { x, y } of piece.getCells()) {
        if (y >= 0 && y < ROWS)
          ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2)
      }
      ctx.shadowBlur = 0
    }

    for (const p of s.particles) {
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }
  }, [theme])

  useEffect(() => {
    let rafId = 0
    const loop = () => {
      draw()
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [draw])

  return (
    <div className="game__board-wrap">
      <canvas ref={canvasRef} className="game__board" width={BOARD_WIDTH} height={BOARD_HEIGHT} />
    </div>
  )
}
