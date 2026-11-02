// TEMPORARY mock data — used only until the real backend join endpoint exists.
// Delete this file once actual lobby-fetching is wired up.
import { PLAYER_COLORS } from '../constants/gameConfig'

export const FAKE_HOST_ID = 'host-fake-1'
export const FAKE_PLAYER_2_ID = 'host-fake-2'

export function getFakeExistingPlayers() {
    return [
        {
            id: FAKE_HOST_ID,
            name: 'Ahmad',
            color: PLAYER_COLORS[1],
            isReady: true,
            isActive: true,
        },
        {
            id: FAKE_PLAYER_2_ID,
            name: 'Nayemur',
            color: PLAYER_COLORS[3], // skips index 2, reserved for the real joining player
            isReady: true,
            isActive: true,
        },
    ]
}