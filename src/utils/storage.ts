import type { ThemeId, LocaleId } from './constants'

const KEY_HIGH_SCORE = 'tetris_high_score'
const KEY_TOP_SCORES = 'tetris_top_scores'
const KEY_SOUND_ENABLED = 'tetris_sound_enabled'
const KEY_THEME = 'tetris_theme'
const KEY_LOCALE = 'tetris_locale'
const KEY_SESSION = 'tetris_session'
const KEY_ACHIEVEMENTS = 'tetris_achievements'
const TOP_N = 5

export interface TopScoreEntry {
  score: number
  date: string
  level?: number
  lines?: number
}

export function getHighScore(): number {
  try {
    const v = localStorage.getItem(KEY_HIGH_SCORE)
    return v != null ? parseInt(v, 10) : 0
  } catch {
    return 0
  }
}

export function setHighScore(score: number): void {
  try {
    localStorage.setItem(KEY_HIGH_SCORE, String(score))
  } catch {
    // ignore
  }
}

export function getTopScores(): TopScoreEntry[] {
  try {
    const v = localStorage.getItem(KEY_TOP_SCORES)
    if (!v) return []
    const parsed = JSON.parse(v) as TopScoreEntry[]
    return Array.isArray(parsed) ? parsed.slice(0, TOP_N) : []
  } catch {
    return []
  }
}

export function addScore(score: number, level?: number, lines?: number): void {
  const list = getTopScores()
  const entry: TopScoreEntry = {
    score,
    date: new Date().toISOString(),
    level,
    lines,
  }
  const next = [...list, entry].sort((a, b) => b.score - a.score).slice(0, TOP_N)
  try {
    localStorage.setItem(KEY_TOP_SCORES, JSON.stringify(next))
  } catch {
    // ignore
  }
}

export function getSoundEnabled(): boolean {
  try {
    const v = localStorage.getItem(KEY_SOUND_ENABLED)
    if (v === null) return true
    return v === 'true'
  } catch {
    return true
  }
}

export function setSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(KEY_SOUND_ENABLED, String(enabled))
  } catch {
    // ignore
  }
}

export function getTheme(): ThemeId {
  try {
    const v = localStorage.getItem(KEY_THEME)
    if (v === 'classic' || v === 'neon' || v === 'retro') return v
    return 'classic'
  } catch {
    return 'classic'
  }
}

export function setTheme(theme: ThemeId): void {
  try {
    localStorage.setItem(KEY_THEME, theme)
  } catch {
    // ignore
  }
}

export function getLocale(): LocaleId {
  try {
    const v = localStorage.getItem(KEY_LOCALE)
    if (v === 'en' || v === 'ru') return v
    return 'en'
  } catch {
    return 'en'
  }
}

export function setLocale(locale: LocaleId): void {
  try {
    localStorage.setItem(KEY_LOCALE, locale)
  } catch {
    // ignore
  }
}

export interface SessionData {
  board: { grid: { filled: boolean; color?: string }[][] }
  score: number
  level: number
  lines: number
  linesClearedTotal: number
}

export function getSession(): SessionData | null {
  try {
    const v = localStorage.getItem(KEY_SESSION)
    if (!v) return null
    return JSON.parse(v) as SessionData
  } catch {
    return null
  }
}

export function setSession(data: SessionData): void {
  try {
    localStorage.setItem(KEY_SESSION, JSON.stringify(data))
  } catch {
    // ignore
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY_SESSION)
  } catch {
    // ignore
  }
}

export function getUnlockedAchievements(): string[] {
  try {
    const v = localStorage.getItem(KEY_ACHIEVEMENTS)
    if (!v) return []
    const parsed = JSON.parse(v) as string[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function unlockAchievement(id: string): void {
  try {
    const list = getUnlockedAchievements()
    if (list.includes(id)) return
    const next = [...list, id]
    localStorage.setItem(KEY_ACHIEVEMENTS, JSON.stringify(next))
  } catch {
    // ignore
  }
}

export function clearAchievements(): void {
  try {
    localStorage.removeItem(KEY_ACHIEVEMENTS)
  } catch {
    // ignore
  }
}

export function clearTopScores(): void {
  try {
    localStorage.removeItem(KEY_TOP_SCORES)
  } catch {
    // ignore
  }
}

export function resetHighScore(): void {
  try {
    localStorage.removeItem(KEY_HIGH_SCORE)
  } catch {
    // ignore
  }
}

/** Clear top 5 list and high score (for "Reset records") */
export function clearAllRecords(): void {
  clearTopScores()
  resetHighScore()
}
