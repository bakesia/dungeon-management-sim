export interface GameIconDefinition {
  id: string
  column: number
  row: number
}

export const GAME_ICON_ATLAS_COLUMNS = 5
export const GAME_ICON_ATLAS_ROWS = 4

export const gameIconDefinitions: GameIconDefinition[] = [
  { id: 'resource_gold', column: 0, row: 0 },
  { id: 'resource_material', column: 1, row: 0 },
  { id: 'resource_food', column: 2, row: 0 },
  { id: 'resource_mana', column: 3, row: 0 },
  { id: 'hud_population', column: 4, row: 0 },
  { id: 'hud_fame', column: 0, row: 1 },
  { id: 'room_dungeon_core', column: 1, row: 1 },
  { id: 'room_quarters', column: 2, row: 1 },
  { id: 'room_mine', column: 3, row: 1 },
  { id: 'room_fungus_farm', column: 4, row: 1 },
  { id: 'room_warehouse', column: 0, row: 2 },
  { id: 'room_guard_post', column: 1, row: 2 },
  { id: 'room_mana_chamber', column: 2, row: 2 },
  { id: 'room_trap_room', column: 3, row: 2 },
  { id: 'room_mana_reservoir', column: 4, row: 2 },
  { id: 'room_infirmary', column: 0, row: 3 },
  { id: 'room_reinforced_gate', column: 1, row: 3 },
]

export const gameIconDefinitionById = Object.fromEntries(
  gameIconDefinitions.map((icon) => [icon.id, icon]),
) as Record<string, GameIconDefinition>
