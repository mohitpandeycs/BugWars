import { PLAYER_COLORS } from '../constants/gameConfig'

export function getNextPlayerColor(existingPlayers) {
    const usedColors = new Set(existingPlayers.map((p) => p.color))
    const nextColor = PLAYER_COLORS.find((c) => !usedColors.has(c))
    return nextColor ?? PLAYER_COLORS[existingPlayers.length % PLAYER_COLORS.length]
}