import { useState, useRef, useEffect, useCallback } from 'react'
import { TetrisEngine } from '@/logic/TetrisEngine'
import type { GameState } from '@/logic/TetrisEngine'
import { GameBoard } from '@/components/GameBoard'
import { StatsPanel } from '@/components/StatsPanel'
import { NextPiece } from '@/components/NextPiece'
import { Controls } from '@/components/Controls'
import { useGameInput } from '@/hooks/useGameInput'
import {
  getHighScore,
  setHighScore as persistHighScore,
  getSoundEnabled,
  setSoundEnabled as persistSoundEnabled,
  getTheme,
  setTheme as persistTheme,
  getLocale,
  setLocale as persistLocale,
  addScore,
  getUnlockedAchievements,
  unlockAchievement,
  clearAchievements,
  clearAllRecords,
} from '@/utils/storage'
import { getNewlyUnlocked } from '@/utils/achievements'
import { AchievementToast } from '@/components/AchievementToast'
import { AchievementBadges } from '@/components/AchievementBadges'
import { setLocale as setI18nLocale, t } from '@/utils/i18n'
import { playSound, resumeAudio } from '@/utils/audio'
import type { ThemeId, LocaleId } from '@/utils/constants'
import { THEMES, LOCALES } from '@/utils/constants'
import '@/styles/main.scss'

type GameScreen = 'menu' | 'playing' | 'gameover'

function App() {
  const [gameScreen, setGameScreen] = useState<GameScreen>('menu')
  const [engineState, setEngineState] = useState<GameState | null>(null)
  const engineRef = useRef<TetrisEngine | null>(null)
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const [theme, setThemeState] = useState<ThemeId>(() => getTheme())
  const [locale, setLocaleState] = useState<LocaleId>(() => {
    const l = getLocale()
    setI18nLocale(l)
    return l
  })
  const [soundEnabled, setSoundEnabledState] = useState(() => getSoundEnabled())
  const [highScore, setHighScoreState] = useState(() => getHighScore())
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(() =>
    getUnlockedAchievements()
  )
  const [toastAchievementId, setToastAchievementId] = useState<string | null>(null)
  const prevGameOverRef = useRef(false)
  const toastQueueRef = useRef<string[]>([])
  const toastShowingRef = useRef(false)
  const soundCallbackRef = useRef<(event: import('@/logic/TetrisEngine').SoundEvent) => void>(
    () => {}
  )
  soundCallbackRef.current = (event) => playSound(event, !soundEnabled)

  useEffect(() => {
    setI18nLocale(locale)
  }, [locale])

  useEffect(() => {
    const engine = new TetrisEngine((state) => {
      setEngineState({ ...state })
      if (state.gameOver && !prevGameOverRef.current) {
        prevGameOverRef.current = true
        setGameScreen('gameover')
        const score = state.score
        setHighScoreState((prev) => {
          const next = Math.max(prev, score)
          persistHighScore(next)
          return next
        })
        addScore(score, state.level, state.lines)
      }
      const ctx = {
        score: state.score,
        level: state.level,
        lines: state.lines,
        linesClearedTotal: state.linesClearedTotal,
        lastLinesCleared: state.lastLinesCleared,
        gameOver: state.gameOver,
      }
      const currentUnlocked = getUnlockedAchievements()
      const newlyUnlocked = getNewlyUnlocked(ctx, currentUnlocked)
      newlyUnlocked.forEach((id) => {
        unlockAchievement(id)
        toastQueueRef.current.push(id)
      })
      if (newlyUnlocked.length > 0) {
        setUnlockedAchievements(getUnlockedAchievements())
        if (!toastShowingRef.current && toastQueueRef.current.length > 0) {
          const id = toastQueueRef.current.shift() ?? null
          if (id) {
            toastShowingRef.current = true
            setToastAchievementId(id)
          }
        }
      }
    })
    engine.setSoundCallback((event) => soundCallbackRef.current(event))
    engineRef.current = engine
    setEngineState({ ...engine.getState() })
    return () => {
      engine.stopGameLoop(cancelAnimationFrame)
      engineRef.current = null
    }
  }, [])

  useEffect(() => {
    if (gameScreen !== 'playing') return
    prevGameOverRef.current = false
    toastQueueRef.current = []
    setToastAchievementId(null)
    toastShowingRef.current = false
    engineRef.current?.restart()
    engineRef.current?.startGameLoop(requestAnimationFrame)
    return () => engineRef.current?.stopGameLoop(cancelAnimationFrame)
  }, [gameScreen])

  useEffect(() => {
    engineRef.current?.setSoundCallback((event) => soundCallbackRef.current(event))
  }, [soundEnabled])

  useGameInput(
    engineRef,
    gameScreen === 'playing' || gameScreen === 'gameover',
    (event) => playSound(event, !soundEnabled)
  )

  useEffect(() => {
    if (gameScreen === 'playing') {
      gameContainerRef.current?.focus({ preventScroll: true })
    }
  }, [gameScreen])

  const handleStart = useCallback(() => {
    resumeAudio()
    playSound('start', false)
    setGameScreen('playing')
  }, [])

  const handleStartPause = useCallback(() => {
    if (gameScreen === 'gameover') {
      engineRef.current?.restart()
      setGameScreen('playing')
      return
    }
    if (gameScreen === 'menu') {
      handleStart()
      return
    }
    engineRef.current?.togglePause()
  }, [gameScreen, handleStart])

  const handleRestart = useCallback(() => {
    engineRef.current?.restart()
    setGameScreen('playing')
  }, [])

  const handleToggleSound = useCallback(() => {
    setSoundEnabledState((v) => {
      const next = !v
      persistSoundEnabled(next)
      return next
    })
    playSound('click', true)
  }, [])

  const handleTheme = useCallback((id: ThemeId) => {
    setThemeState(id)
    persistTheme(id)
  }, [])

  const handleLocale = useCallback((id: LocaleId) => {
    setI18nLocale(id)
    setLocaleState(id)
    persistLocale(id)
  }, [])

  const handleToastDismiss = useCallback(() => {
    toastShowingRef.current = false
    const next = toastQueueRef.current.shift() ?? null
    setToastAchievementId(next)
    if (next) toastShowingRef.current = true
  }, [])

  const handleResetAchievements = useCallback(() => {
    if (!window.confirm(t('menu.resetConfirm'))) return
    clearAchievements()
    setUnlockedAchievements([])
  }, [])

  const handleResetRecords = useCallback(() => {
    if (!window.confirm(t('menu.resetConfirm'))) return
    clearAllRecords()
    setHighScoreState(0)
  }, [])

  if (gameScreen === 'menu') {
    return (
      <div className={`app theme-${theme}`}>
        <div className="menu">
          <h1 className="menu__title">{t('menu.title')}</h1>
          <button type="button" className="menu__btn menu__btn--primary" onClick={handleStart}>
            {t('menu.start')}
          </button>
          <div className="menu__section">
            <span className="menu__label">{t('menu.theme')}</span>
            <div className="menu__options">
              {THEMES.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`menu__opt ${theme === id ? 'menu__opt--active' : ''}`}
                  onClick={() => handleTheme(id)}
                >
                  {t(`theme.${id}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="menu__section">
            <span className="menu__label">{t('menu.language')}</span>
            <div className="menu__options">
              {LOCALES.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`menu__opt ${locale === id ? 'menu__opt--active' : ''}`}
                  onClick={() => handleLocale(id)}
                  aria-pressed={locale === id}
                >
                  {id === 'en' ? 'EN' : 'RU'}
                </button>
              ))}
            </div>
          </div>
          <AchievementBadges unlockedIds={unlockedAchievements} />
          <div className="menu__section">
            <span className="menu__label">{t('menu.data')}</span>
            <div className="menu__options menu__options--stack">
              <button
                type="button"
                className="menu__btn menu__btn--secondary menu__btn--small"
                onClick={handleResetAchievements}
              >
                {t('menu.resetAchievements')}
              </button>
              <button
                type="button"
                className="menu__btn menu__btn--secondary menu__btn--small"
                onClick={handleResetRecords}
              >
                {t('menu.resetRecords')}
              </button>
            </div>
          </div>
          <button
            type="button"
            className="menu__btn menu__btn--icon"
            onClick={handleToggleSound}
            title={soundEnabled ? t('game.soundOff') : t('game.soundOn')}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
        </div>
      </div>
    )
  }

  if (gameScreen === 'gameover' && engineState) {
    return (
      <div className={`app theme-${theme}`}>
        <div className="gameover">
          <h2 className="gameover__title">{t('gameover.title')}</h2>
          <p className="gameover__score">
            {t('gameover.score')}: {engineState.score}
          </p>
          <p className="gameover__high">
            {t('gameover.highScore')}: {highScore}
          </p>
          <div className="gameover__actions">
            <button type="button" className="gameover__btn" onClick={handleRestart}>
              {t('gameover.restart')}
            </button>
            <button
              type="button"
              className="gameover__btn gameover__btn--secondary"
              onClick={() => setGameScreen('menu')}
            >
              {t('gameover.menu')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const state = engineState ?? (null as GameState | null)
  if (!state) return null
  return (
    <div className={`app theme-${theme}`}>
      <div
        className="game"
        ref={gameContainerRef}
        tabIndex={0}
        role="application"
        aria-label="Tetris game"
      >
        <div className="game__main">
          <GameBoard state={state} theme={theme} />
          <div className="game__side">
            <StatsPanel
              score={state?.score ?? 0}
              level={state?.level ?? 1}
              lines={state?.lines ?? 0}
              highScore={highScore}
            />
            <div className="game__next-wrap">
              <span className="game__next-label">{t('game.next')}</span>
              <NextPiece piece={state.nextPiece} theme={theme} />
            </div>
            <Controls
              paused={state.paused}
              gameOver={state.gameOver}
              onStartPause={handleStartPause}
              onRestart={handleRestart}
              soundEnabled={soundEnabled}
              onToggleSound={handleToggleSound}
            />
          </div>
        </div>
        {state.paused && (
          <div className="game__overlay">
            <span className="game__overlay-text">{t('game.pause')}</span>
          </div>
        )}
        <AchievementToast
          achievementId={toastAchievementId}
          onDismiss={handleToastDismiss}
        />
      </div>
    </div>
  )
}

export default App
