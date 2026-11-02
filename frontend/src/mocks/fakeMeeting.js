// TEMPORARY mock — real backend will broadcast real votes from real players.
// This simulates fake players casting a vote (or skipping) after a random
// short delay, so the Emergency Meeting screen can be tested and actually
// resolve without needing real other players connected. Delete once real
// multiplayer voting exists.
import { SKIP_VOTE } from '../constants/gameConfig'

const MIN_VOTE_DELAY_MS = 800
const MAX_VOTE_DELAY_MS = 3300
const SKIP_CHANCE = 0.15 // 15% chance a fake player skips instead of voting

export function scheduleFakeVotes(fakePlayers, activeIds, onVoteCast) {
    if (!Array.isArray(fakePlayers) || !Array.isArray(activeIds) || typeof onVoteCast !== 'function') {
        console.warn('scheduleFakeVotes: invalid arguments — no fake votes will be simulated', {
            fakePlayers,
            activeIds,
            onVoteCast,
        })
        return () => { }
    }

    const timers = fakePlayers.map((player) => {
        const delayMs = MIN_VOTE_DELAY_MS + Math.random() * (MAX_VOTE_DELAY_MS - MIN_VOTE_DELAY_MS)

        return setTimeout(() => {
            const votableIds = activeIds.filter((id) => id !== player.id)

            if (votableIds.length === 0) {
                onVoteCast(player.id, SKIP_VOTE)
                return
            }

            const shouldSkip = Math.random() < SKIP_CHANCE
            const target = shouldSkip
                ? SKIP_VOTE
                : votableIds[Math.floor(Math.random() * votableIds.length)]

            onVoteCast(player.id, target)
        }, delayMs)
    })

    return () => timers.forEach(clearTimeout)
}