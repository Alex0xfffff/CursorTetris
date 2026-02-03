import { useCallback } from 'react'
import { t } from '@/utils/i18n'

interface ControlsProps {
  paused: boolean
  gameOver: boolean
  onStartPause: () => void
  onRestart: () => void
  soundEnabled: boolean
  onToggleSound: () => void
}

export function Controls({
  paused,
  gameOver,
  onStartPause,
  onRestart,
  soundEnabled,
  onToggleSound,
}: ControlsProps) {
  const handleStartPause = useCallback(() => {
    onStartPause()
  }, [onStartPause])

  return (
    <div className="controls">
      <button
        type="button"
        className="controls__btn controls__btn--primary"
        onClick={handleStartPause}
        aria-label={paused ? t('game.resume') : t('game.start')}
      >
        {gameOver ? t('game.restart') : paused ? t('game.resume') : t('game.pause')}
      </button>
      <button
        type="button"
        className="controls__btn controls__btn--secondary"
        onClick={onRestart}
        aria-label={t('game.restart')}
      >
        {t('game.restart')}
      </button>
      <button
        type="button"
        className="controls__btn controls__btn--icon"
        onClick={onToggleSound}
        aria-label={soundEnabled ? t('game.soundOff') : t('game.soundOn')}
        title={soundEnabled ? t('game.soundOff') : t('game.soundOn')}
      >
        {soundEnabled ? (
          <span className="controls__icon" aria-hidden>🔊</span>
        ) : (
          <span className="controls__icon" aria-hidden>🔇</span>
        )}
      </button>
    </div>
  )
}
