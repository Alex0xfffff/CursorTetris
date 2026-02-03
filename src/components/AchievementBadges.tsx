import { useState } from 'react'
import { t } from '@/utils/i18n'
import { ACHIEVEMENTS } from '@/utils/achievements'
import type { AchievementDef } from '@/utils/achievements'

interface AchievementBadgesProps {
  unlockedIds: string[]
}

function Badge({
  achievement,
  unlocked,
  selected,
  onSelect,
}: {
  achievement: AchievementDef
  unlocked: boolean
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={`achievement-badge ${unlocked ? 'achievement-badge--unlocked' : 'achievement-badge--locked'} ${selected ? 'achievement-badge--selected' : ''}`}
      onClick={onSelect}
      title={t(achievement.descKey)}
    >
      <span className="achievement-badge__icon">{achievement.icon}</span>
      <span className="achievement-badge__name">{t(achievement.nameKey)}</span>
    </button>
  )
}

export function AchievementBadges({ unlockedIds }: AchievementBadgesProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = selectedId ? ACHIEVEMENTS.find((a) => a.id === selectedId) : null

  return (
    <div className="achievement-badges">
      <span className="achievement-badges__label">{t('menu.achievements')}</span>
      <p className="achievement-badges__desc">{t('menu.achievementsDesc')}</p>
      <div className="achievement-badges__grid">
        {ACHIEVEMENTS.map((a) => (
          <Badge
            key={a.id}
            achievement={a}
            unlocked={unlockedIds.includes(a.id)}
            selected={selectedId === a.id}
            onSelect={() => setSelectedId((prev) => (prev === a.id ? null : a.id))}
          />
        ))}
      </div>
      {selected && (
        <div className="achievement-badges__detail">
          <span className="achievement-badges__detail-name">
            {selected.icon} {t(selected.nameKey)}
          </span>
          <span className="achievement-badges__detail-desc">{t(selected.descKey)}</span>
        </div>
      )}
    </div>
  )
}
