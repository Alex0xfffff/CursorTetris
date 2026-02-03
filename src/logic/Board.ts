import type { Piece } from './Piece'
import type { TetrominoType } from './Piece'
import { PIECE_COLORS } from './Piece'
import { COLS, ROWS } from '@/utils/constants'

export type Cell = { filled: boolean; color?: string }

export class Board {
  private grid: Cell[][]

  constructor() {
    this.grid = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => ({ filled: false }))
    )
  }

  getGrid(): Cell[][] {
    return this.grid.map((row) => row.map((cell) => ({ ...cell })))
  }

  clone(): Board {
    const b = new Board()
    b.grid = this.grid.map((row) => row.map((c) => ({ ...c })))
    return b
  }

  isValid(piece: Piece): boolean {
    const cells = piece.getCells()
    for (const { x, y } of cells) {
      if (x < 0 || x >= COLS || y >= ROWS) return false
      if (y >= 0 && this.grid[y]![x]!.filled) return false
    }
    return true
  }

  collides(piece: Piece): boolean {
    return !this.isValid(piece)
  }

  mergePiece(piece: Piece): void {
    const color = PIECE_COLORS[piece.type as TetrominoType]
    for (const { x, y } of piece.getCells()) {
      if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
        this.grid[y]![x] = { filled: true, color }
      }
    }
  }

  clearLines(): number[] {
    const fullRows: number[] = []
    for (let row = ROWS - 1; row >= 0; row--) {
      if (this.grid[row]!.every((cell) => cell.filled)) {
        fullRows.push(row)
      }
    }
    return fullRows
  }

  removeLines(rows: number[]): void {
    const set = new Set(rows)
    const newGrid: Cell[][] = []
    for (let row = ROWS - 1; row >= 0; row--) {
      if (!set.has(row)) {
        newGrid.unshift(this.grid[row]!.map((c) => ({ ...c })))
      }
    }
    while (newGrid.length < ROWS) {
      newGrid.unshift(
        Array.from({ length: COLS }, () => ({ filled: false }))
      )
    }
    this.grid = newGrid
  }

  static fromSerialized(data: { grid: Cell[][] }): Board {
    const b = new Board()
    b.grid = data.grid.map((row) => row.map((c) => ({ ...c })))
    return b
  }

  serialize(): { grid: Cell[][] } {
    return { grid: this.getGrid() }
  }
}
