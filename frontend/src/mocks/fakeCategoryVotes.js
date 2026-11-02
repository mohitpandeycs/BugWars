// TEMPORARY mock — real backend will broadcast real category votes from
// real players. This simulates fake players voting for a random category
// shortly after the screen loads, so a winner can be determined by majority
// even if the real player never votes. Delete once real multiplayer voting
// exists.
const MIN_VOTE_DELAY_MS = 500
const MAX_VOTE_DELAY_MS = 2000

export function scheduleFakeCategoryVotes(fakePlayerIds, categories, onVoteCast) {
    if (!Array.isArray(fakePlayerIds) || !Array.isArray(categories) || typeof onVoteCast !== 'function') {
        console.warn('scheduleFakeCategoryVotes: invalid arguments — no fake votes will be simulated')
        return () => { }
    }

    const timers = fakePlayerIds.map((playerId) => {
        const delayMs = MIN_VOTE_DELAY_MS + Math.random() * (MAX_VOTE_DELAY_MS - MIN_VOTE_DELAY_MS)
        return setTimeout(() => {
            const randomCategory = categories[Math.floor(Math.random() * categories.length)]
            onVoteCast(playerId, randomCategory)
        }, delayMs)
    })

    return () => timers.forEach(clearTimeout)
}