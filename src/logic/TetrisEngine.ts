import { Board } from './Board'
import { Piece, createPieceFromBag, type TetrominoType } from './Piece'
import {
  COLS,
  ROWS,
  LINE_SCORES,
  LINES_PER_LEVEL,
  BASE_DROP_INTERVAL_MS,
  MIN_DROP_INTERVAL_MS,
  LEVEL_SPEED_FACTOR,
} from '@/utils/constants'

const SPAWN_X = Math.floor(COLS / 2) - 2
const SPAWN_Y = 0

export type GamePhase = 'menu' | 'playing' | 'paused' | 'gameover'

const LINE_CLEAR_ANIMATION_MS = 400

export interface GameState {
  board: Board
  currentPiece: Piece | null
  nextPiece: Piece | null
  score: number
  level: number
  lines: number
  linesClearedTotal: number
  lastLinesCleared: number
  gameOver: boolean
  paused: boolean
  bag: TetrominoType[]
  linesClearing: number[]
  linesClearingStartTime: number
  particles: Particle[]
  lastDropTime: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  life: number
  size: number
}

export type GameStateCallback = (state: GameState) => void
export type SoundEvent =
  | 'drop'
  | 'rotate'
  | 'move'
  | 'softdrop'
  | 'harddrop'
  | 'levelup'
  | 'lineclear'
  | 'lineclear1'
  | 'lineclear2'
  | 'lineclear3'
  | 'lineclear4'
  | 'gameover'
  | 'click'
  | 'start'

export class TetrisEngine {
  private state: GameState
  private onStateChange: GameStateCallback
  private onSound: ((event: SoundEvent) => void) | null = null
  private dropIntervalMs: number = BASE_DROP_INTERVAL_MS
  private lastTickTime: number = 0
  private fastDrop: boolean = false
  private rafId: number = 0
  private isHardDrop: boolean = false
  private lastSoftDropSoundTime: number = 0
  private readonly SOFTDROP_SOUND_THROTTLE_MS = 120

  constructor(onStateChange: GameStateCallback) {
    this.onStateChange = onStateChange
    this.state = this.getInitialState()
  }

  setSoundCallback(cb: (event: SoundEvent) => void): void {
    this.onSound = cb
  }

  private getInitialState(): GameState {
    const board = new Board()
    let bag: TetrominoType[] = []
    const { piece: nextPiece, nextBag } = createPieceFromBag(bag, SPAWN_X, SPAWN_Y)
    bag = nextBag
    const { piece: currentPiece, nextBag: nextBag2 } = createPieceFromBag(bag, SPAWN_X, SPAWN_Y)
    bag = nextBag2
    return {
      board,
      currentPiece,
      nextPiece,
      score: 0,
      level: 1,
      lines: 0,
      linesClearedTotal: 0,
      gameOver: false,
      paused: false,
      bag,
      linesClearing: [],
      linesClearingStartTime: 0,
      particles: [],
      lastDropTime: 0,
      lastLinesCleared: 0,
    }
  }

  getState(): GameState {
    return this.state
  }

  private emit(): void {
    this.onStateChange(this.state)
  }

  private getDropInterval(): number {
    const level = this.state.level
    const interval = BASE_DROP_INTERVAL_MS * Math.pow(LEVEL_SPEED_FACTOR, level - 1)
    return Math.max(MIN_DROP_INTERVAL_MS, interval)
  }

  private spawnPiece(): boolean {
    const next = this.state.nextPiece
    if (!next) return false
    const piece = next.clone()
    piece.x = SPAWN_X
    piece.y = SPAWN_Y
    if (!this.state.board.isValid(piece)) {
      this.state.gameOver = true
      this.onSound?.('gameover')
      this.emit()
      return false
    }
    const { piece: newNext, nextBag } = createPieceFromBag(
      this.state.bag,
      SPAWN_X,
      SPAWN_Y
    )
    this.state.currentPiece = piece
    this.state.nextPiece = newNext
    this.state.bag = nextBag
    this.emit()
    return true
  }

  private lockPiece(): void {
    const { currentPiece, board } = this.state
    if (!currentPiece) return
    board.mergePiece(currentPiece)
    this.state.currentPiece = null
    if (!this.isHardDrop) this.onSound?.('drop')
    this.isHardDrop = false
    const fullRows = board.clearLines()
    if (fullRows.length > 0) {
      this.state.lastLinesCleared = fullRows.length
      this.state.linesClearing = fullRows
      this.state.linesClearingStartTime = performance.now()
      const lineclearEvent =
        fullRows.length >= 1 && fullRows.length <= 4
          ? (`lineclear${fullRows.length}` as SoundEvent)
          : 'lineclear'
      this.onSound?.(lineclearEvent)
      const points = LINE_SCORES[fullRows.length] ?? 0
      this.state.score += points * this.state.level
      this.state.lines += fullRows.length
      this.state.linesClearedTotal += fullRows.length
      const newLevel = Math.floor(this.state.linesClearedTotal / LINES_PER_LEVEL) + 1
      if (newLevel > this.state.level) {
        this.state.level = newLevel
        this.onSound?.('levelup')
      }
    } else {
      this.spawnPiece()
    }
    this.dropIntervalMs = this.getDropInterval()
    this.emit()
  }

  private addParticlesFromPiece(piece: Piece, count: number = 12): void {
    const cells = piece.getCells()
    const color = cells.length ? '#fff' : '#888'
    for (let i = 0; i < count; i++) {
      const c = cells[i % cells.length] ?? { x: piece.x, y: piece.y }
      this.state.particles.push({
        x: c.x * 30 + 15,
        y: c.y * 30 + 15,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 2,
        color,
        life: 1,
        size: 6 + Math.random() * 6,
      })
    }
  }

  tick(now: number): void {
    if (this.state.gameOver || this.state.paused) return
    if (this.state.linesClearing.length > 0) return

    this.lastTickTime = now
    const interval = this.fastDrop ? Math.min(50, this.getDropInterval()) : this.getDropInterval()
    if (now - this.state.lastDropTime < interval) return

    const piece = this.state.currentPiece
    if (!piece) {
      this.state.lastDropTime = now
      this.spawnPiece()
      return
    }

    const moved = piece.withOffset(0, 1)
    if (this.state.board.isValid(moved)) {
      this.state.currentPiece = moved
      this.state.lastDropTime = now
      if (this.fastDrop && now - this.lastSoftDropSoundTime >= this.SOFTDROP_SOUND_THROTTLE_MS) {
        this.lastSoftDropSoundTime = now
        this.onSound?.('softdrop')
      }
    } else {
      this.lockPiece()
    }
    this.emit()
  }

  move(dx: number): void {
    if (this.state.gameOver || this.state.paused || this.state.linesClearing.length > 0) return
    const piece = this.state.currentPiece
    if (!piece) return
    const moved = piece.withOffset(dx, 0)
    if (this.state.board.isValid(moved)) {
      this.state.currentPiece = moved
      this.emit()
    }
  }

  rotate(): void {
    if (this.state.gameOver || this.state.paused || this.state.linesClearing.length > 0) return
    const piece = this.state.currentPiece
    if (!piece) return
    const rotated = piece.rotate()
    if (this.state.board.isValid(rotated)) {
      this.state.currentPiece = rotated
      this.emit()
    }
  }

  hardDrop(): void {
    if (this.state.gameOver || this.state.paused || this.state.linesClearing.length > 0) return
    const piece = this.state.currentPiece
    if (!piece) return
    this.isHardDrop = true
    let dropped = piece.clone()
    while (this.state.board.isValid(dropped.withOffset(0, 1))) {
      dropped = dropped.withOffset(0, 1)
    }
    this.addParticlesFromPiece(dropped)
    this.state.currentPiece = dropped
    this.lockPiece()
  }

  setFastDrop(fast: boolean): void {
    this.fastDrop = fast
  }

  updateLinesClearingAnimation(now: number): void {
    if (this.state.linesClearing.length === 0) return
    if (now - this.state.linesClearingStartTime < LINE_CLEAR_ANIMATION_MS) return
    this.state.board.removeLines(this.state.linesClearing)
    this.state.linesClearing = []
    this.spawnPiece()
    this.emit()
  }

  updateParticles(dt: number): void {
    this.state.particles = this.state.particles
      .map((p) => ({
        ...p,
        x: p.x + p.vx * dt * 0.06,
        y: p.y + p.vy * dt * 0.06,
        life: p.life - dt * 0.02,
        vy: p.vy + 0.3,
      }))
      .filter((p) => p.life > 0)
    if (this.state.particles.length > 0) this.emit()
  }

  togglePause(): boolean {
    if (this.state.gameOver) return false
    this.state.paused = !this.state.paused
    this.emit()
    return true
  }

  restart(): void {
    this.state = this.getInitialState()
    this.dropIntervalMs = this.getDropInterval()
    this.emit()
  }

  startGameLoop(raf: (cb: (t: number) => void) => number): void {
    let last = 0
    const loop = (now: number) => {
      const dt = now - last
      last = now
      this.tick(now)
      this.updateParticles(dt)
      if (this.state.linesClearing.length > 0) {
        this.updateLinesClearingAnimation(now)
      }
      this.rafId = raf(loop)
    }
    this.rafId = raf(loop)
  }

  stopGameLoop(cancelRaf: (id: number) => void): void {
    if (this.rafId) {
      cancelRaf(this.rafId)
      this.rafId = 0
    }
  }
}
