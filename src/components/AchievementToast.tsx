import { useEffect, useState } from 'react'
import { t } from '@/utils/i18n'
import { ACHIEVEMENTS } from '@/utils/achievements'
import type { AchievementDef } from '@/utils/achievements'

interface AchievementToastProps {
  achievementId: string | null
  onDismiss: () => void
  duration?: number
}

export function AchievementToast({
  achievementId,
  onDismiss,
  duration = 3000,
}: AchievementToastProps) {
  const [visible, setVisible] = useState(false)
  const achievement: AchievementDef | undefined = achievementId
    ? ACHIEVEMENTS.find((a) => a.id === achievementId)
    : undefined

  useEffect(() => {
    if (!achievementId) {
      setVisible(false)
      return
    }
    setVisible(true)
    const t = setTimeout(() => {
      setVisible(false)
      onDismiss()
    }, duration)
    return () => clearTimeout(t)
  }, [achievementId, duration, onDismiss])

  if (!achievement || !visible) return null

  return (
    <div className="achievement-toast" role="status" aria-live="polite">
      <span className="achievement-toast__icon">{achievement.icon}</span>
      <div className="achievement-toast__text">
        <span className="achievement-toast__title">{t('achievement.unlocked')}</span>
        <span className="achievement-toast__name">{t(achievement.nameKey)}</span>
      </div>
    </div>
  )
}
