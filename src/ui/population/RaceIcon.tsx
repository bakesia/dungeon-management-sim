import goblinIcon from '../../assets/races/goblin.svg'
import impIcon from '../../assets/races/imp.svg'
import orcIcon from '../../assets/races/orc.svg'

const icons: Record<string, string> = { race_goblin: goblinIcon, race_orc: orcIcon, race_imp: impIcon }

export function RaceIcon({ iconId, name, size = 28 }: { iconId: string; name: string; size?: number }) {
  return <img className="race-icon" src={icons[iconId]} alt={`${name} 픽셀 초상`} width={size} height={size} />
}
