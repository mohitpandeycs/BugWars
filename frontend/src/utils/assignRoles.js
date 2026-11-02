import { MIN_PLAYERS_TO_START } from '../constants/gameConfig'


export function assignRoles(players, imposterCount = 1) {
    if (!players || players.length < MIN_PLAYERS_TO_START) {
        console.warn(
            `assignRoles: need at least ${MIN_PLAYERS_TO_START} players, got ${players?.length ?? 0}`
        )
        return { roles: {}, imposterIds: [], ok: false }
    }

    const safeImposterCount = Math.max(1, Math.min(imposterCount, players.length - 1))


    const shuffled = [...players]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    const imposterIds = shuffled.slice(0, safeImposterCount).map((p) => p.id)
    const imposterIdSet = new Set(imposterIds)

    const roles = {}
    players.forEach((p) => {
        roles[p.id] = imposterIdSet.has(p.id) ? 'imposter' : 'civilian'
    })

    return { roles, imposterIds, ok: true }
}