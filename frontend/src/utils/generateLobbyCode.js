import { LOBBY_ID_LENGTH } from '../constants/gameConfig'


export function generateLobbyCode() {
    let code = ''
    while (code.length < LOBBY_ID_LENGTH) {
        code += Math.random().toString(36).slice(2)
    }
    return code.slice(0, LOBBY_ID_LENGTH).toUpperCase()
}