export interface AchievementDef {
  id: string
  nameKey: string
  descKey: string
  icon: string
  check: (ctx: AchievementCheckContext) => boolean
}

export interface AchievementCheckContext {
  score: number
  level: number
  lines: number
  linesClearedTotal: number
  lastLinesCleared: number
  gameOver: boolean
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_clear',
    nameKey: 'achievement.first_clear.name',
    descKey: 'achievement.first_clear.desc',
    icon: '🌟',
    check: (ctx) => ctx.linesClearedTotal >= 1,
  },
  {
    id: 'double',
    nameKey: 'achievement.double.name',
    descKey: 'achievement.double.desc',
    icon: '📐',
    check: (ctx) => ctx.lastLinesCleared === 2,
  },
  {
    id: 'triple',
    nameKey: 'achievement.triple.name',
    descKey: 'achievement.triple.desc',
    icon: '🔥',
    check: (ctx) => ctx.lastLinesCleared === 3,
  },
  {
    id: 'tetris',
    nameKey: 'achievement.tetris.name',
    descKey: 'achievement.tetris.desc',
    icon: '🎯',
    check: (ctx) => ctx.lastLinesCleared === 4,
  },
  {
    id: 'score_1k',
    nameKey: 'achievement.score_1k.name',
    descKey: 'achievement.score_1k.desc',
    icon: '💯',
    check: (ctx) => ctx.score >= 1000,
  },
  {
    id: 'score_5k',
    nameKey: 'achievement.score_5k.name',
    descKey: 'achievement.score_5k.desc',
    icon: '⭐',
    check: (ctx) => ctx.score >= 5000,
  },
  {
    id: 'score_10k',
    nameKey: 'achievement.score_10k.name',
    descKey: 'achievement.score_10k.desc',
    icon: '🏆',
    check: (ctx) => ctx.score >= 10000,
  },
  {
    id: 'lines_25',
    nameKey: 'achievement.lines_25.name',
    descKey: 'achievement.lines_25.desc',
    icon: '📊',
    check: (ctx) => ctx.linesClearedTotal >= 25,
  },
  {
    id: 'lines_50',
    nameKey: 'achievement.lines_50.name',
    descKey: 'achievement.lines_50.desc',
    icon: '📈',
    check: (ctx) => ctx.linesClearedTotal >= 50,
  },
  {
    id: 'lines_100',
    nameKey: 'achievement.lines_100.name',
    descKey: 'achievement.lines_100.desc',
    icon: '💎',
    check: (ctx) => ctx.linesClearedTotal >= 100,
  },
  {
    id: 'level_5',
    nameKey: 'achievement.level_5.name',
    descKey: 'achievement.level_5.desc',
    icon: '🚀',
    check: (ctx) => ctx.level >= 5,
  },
  {
    id: 'level_10',
    nameKey: 'achievement.level_10.name',
    descKey: 'achievement.level_10.desc',
    icon: '👑',
    check: (ctx) => ctx.level >= 10,
  },
  {
    id: 'player_of_the_year',
    nameKey: 'achievement.player_of_the_year.name',
    descKey: 'achievement.player_of_the_year.desc',
    icon: '🏅',
    check: (ctx) => ctx.gameOver && ctx.score === 0,
  },
  {
    id: 'speedrun',
    nameKey: 'achievement.speedrun.name',
    descKey: 'achievement.speedrun.desc',
    icon: '⚡',
    check: (ctx) => ctx.gameOver && ctx.linesClearedTotal === 0,
  },
]

export function getNewlyUnlocked(
  ctx: AchievementCheckContext,
  alreadyUnlocked: string[]
): string[] {
  const unlocked: string[] = []
  for (const a of ACHIEVEMENTS) {
    if (alreadyUnlocked.includes(a.id)) continue
    if (a.check(ctx)) unlocked.push(a.id)
  }
  return unlocked
}
