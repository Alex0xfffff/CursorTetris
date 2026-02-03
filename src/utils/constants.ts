export const COLS = 10
export const ROWS = 20
export const CELL_SIZE = 30
export const BOARD_WIDTH = COLS * CELL_SIZE
export const BOARD_HEIGHT = ROWS * CELL_SIZE

export const LINE_SCORES = [0, 100, 300, 500, 800] as const
export const LINES_PER_LEVEL = 10
export const BASE_DROP_INTERVAL_MS = 1000
export const MIN_DROP_INTERVAL_MS = 100
export const LEVEL_SPEED_FACTOR = 0.8

export type ThemeId = 'classic' | 'neon' | 'retro'
export type LocaleId = 'en' | 'ru'

export const THEMES: ThemeId[] = ['classic', 'neon', 'retro']
export const LOCALES: LocaleId[] = ['en', 'ru']
