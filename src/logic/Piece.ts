export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'
export type RotationState = 0 | 1 | 2 | 3

export interface CellPosition {
  x: number
  y: number
}

const SHAPES: Record<TetrominoType, number[][]> = {
  I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
  J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
}

export const PIECE_COLORS: Record<TetrominoType, string> = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000',
}

export interface IPiece {
  type: TetrominoType
  rotation: RotationState
  x: number
  y: number
  getCells(): CellPosition[]
  clone(): Piece
  rotate(): Piece
  getBoundingBox(): { width: number; height: number }
}

function rotateMatrix<T>(matrix: T[][]): T[][] {
  const rows = matrix.length
  const cols = matrix[0]?.length ?? 0
  const result: T[][] = []
  for (let c = 0; c < cols; c++) {
    result[c] = []
    for (let r = rows - 1; r >= 0; r--) {
      result[c].push(matrix[r][c])
    }
  }
  return result
}

function getShapeMatrix(type: TetrominoType, rotation: RotationState): number[][] {
  let matrix = SHAPES[type].map((row) => [...row])
  for (let i = 0; i < rotation; i++) {
    matrix = rotateMatrix(matrix)
  }
  return matrix
}

export class Piece implements IPiece {
  constructor(
    public type: TetrominoType,
    public rotation: RotationState,
    public x: number,
    public y: number
  ) {}

  getCells(): CellPosition[] {
    const matrix = getShapeMatrix(this.type, this.rotation)
    const cells: CellPosition[] = []
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < (matrix[row]?.length ?? 0); col++) {
        if (matrix[row]![col]) {
          cells.push({ x: this.x + col, y: this.y + row })
        }
      }
    }
    return cells
  }

  clone(): Piece {
    return new Piece(this.type, this.rotation, this.x, this.y)
  }

  rotate(): Piece {
    return new Piece(this.type, ((this.rotation + 1) % 4) as RotationState, this.x, this.y)
  }

  getBoundingBox(): { width: number; height: number } {
    const matrix = getShapeMatrix(this.type, this.rotation)
    return {
      width: matrix[0]?.length ?? 0,
      height: matrix.length,
    }
  }

  withOffset(dx: number, dy: number): Piece {
    return new Piece(this.type, this.rotation, this.x + dx, this.y + dy)
  }
}

export const TETROMINO_TYPES: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']

export function createRandomPiece(spawnX: number, spawnY: number): Piece {
  const type = TETROMINO_TYPES[Math.floor(Math.random() * TETROMINO_TYPES.length)]!
  return new Piece(type, 0, spawnX, spawnY)
}

export function createPieceFromBag(
  bag: TetrominoType[],
  spawnX: number,
  spawnY: number
): { piece: Piece; nextBag: TetrominoType[] } {
  let nextBag = bag.length > 0 ? [...bag] : [...TETROMINO_TYPES].sort(() => Math.random() - 0.5)
  const type = nextBag.shift()!
  if (nextBag.length === 0) {
    nextBag = [...TETROMINO_TYPES].sort(() => Math.random() - 0.5)
  }
  return { piece: new Piece(type, 0, spawnX, spawnY), nextBag }
}
