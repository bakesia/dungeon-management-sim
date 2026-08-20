import type { CSSProperties } from 'react'
import iconAtlas from '../../assets/icons/game-icons-atlas.png'
import { GAME_ICON_ATLAS_COLUMNS, GAME_ICON_ATLAS_ROWS, gameIconDefinitionById } from '../../content/icons/gameIcons'

interface GameIconProps {
  iconId: string
  label?: string
  size?: number
  className?: string
}

export function GameIcon({ iconId, label, size = 24, className = '' }: GameIconProps) {
  const icon = gameIconDefinitionById[iconId]
  if (!icon) return null
  const style = {
    width: size,
    height: size,
    backgroundImage: `url(${iconAtlas})`,
    backgroundSize: `${GAME_ICON_ATLAS_COLUMNS * 100}% ${GAME_ICON_ATLAS_ROWS * 100}%`,
    backgroundPosition: `${icon.column * (100 / (GAME_ICON_ATLAS_COLUMNS - 1))}% ${icon.row * (100 / (GAME_ICON_ATLAS_ROWS - 1))}%`,
  } as CSSProperties
  return <span className={`game-icon ${className}`.trim()} style={style} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} />
}
