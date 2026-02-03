import { t } from '@/utils/i18n'

interface StatsPanelProps {
  score: number
  level: number
  lines: number
  highScore: number
}

export function StatsPanel({ score, level, lines, highScore }: StatsPanelProps) {
  return (
    <div className="stats">
      <div className="stats__item">
        <span className="stats__label">{t('game.score')}</span>
        <span className="stats__value">{score}</span>
      </div>
      <div className="stats__item">
        <span className="stats__label">{t('game.level')}</span>
        <span className="stats__value">{level}</span>
      </div>
      <div className="stats__item">
        <span className="stats__label">{t('game.lines')}</span>
        <span className="stats__value">{lines}</span>
      </div>
      <div className="stats__item stats__item--highlight">
        <span className="stats__label">{t('game.highScore')}</span>
        <span className="stats__value">{highScore}</span>
      </div>
    </div>
  )
}
