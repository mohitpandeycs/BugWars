import { useState, useEffect, useRef } from 'react'
import CloudBackground from '../components/CloudBackground'
import CategoryButton from '../components/CategoryButton'
import Timer from '../components/Timer'
import { VOTE_CLOUDS } from '../constants/cloudPresets'
import { CATEGORIES, CATEGORY_VOTE_DURATION_MS, VOTE_RESULT_DISPLAY_MS } from '../constants/gameConfig'
import { scheduleFakeCategoryVotes } from '../mocks/fakeCategoryVotes'

function VoteCategory({ myPlayerId = 'you', fakePlayerIds = [], onVoteComplete }) {
    const [selected, setSelected] = useState(null)
    const [locked, setLocked] = useState(false)
    const [winningCategory, setWinningCategory] = useState(null)
    const votesRef = useRef({})

    const handleSelect = (category) => {
        if (locked) return
        setSelected(category)
        votesRef.current[myPlayerId] = category
    }

    const resolveWinner = () => {
        const counts = {}
        Object.values(votesRef.current).forEach((cat) => {
            counts[cat] = (counts[cat] || 0) + 1
        })

        let winner = null
        let maxVotes = 0
        Object.entries(counts).forEach(([cat, count]) => {
            if (count > maxVotes) {
                maxVotes = count
                winner = cat
            }
        })

        return winner ?? CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
    }

    useEffect(() => {
        const lockTimer = setTimeout(() => {
            setLocked(true)
            const winner = resolveWinner()
            setWinningCategory(winner)

            const navigateTimer = setTimeout(() => {
                onVoteComplete?.(winner)
            }, VOTE_RESULT_DISPLAY_MS)

            return () => clearTimeout(navigateTimer)
        }, CATEGORY_VOTE_DURATION_MS)

        return () => clearTimeout(lockTimer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const cancel = scheduleFakeCategoryVotes(fakePlayerIds, CATEGORIES, (playerId, category) => {
            votesRef.current[playerId] = category
        })
        return cancel
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-b from-pixel-sky-top to-pixel-sky-bottom relative overflow-hidden flex flex-col items-center justify-center gap-6 p-4">
            <CloudBackground clouds={VOTE_CLOUDS} />

            <h1 className="font-pixel text-pixel-orange text-2xl text-center">VOTE CATEGORY</h1>

            {!locked && <Timer startSeconds={CATEGORY_VOTE_DURATION_MS / 1000} className="text-pixel-cream-dark" />}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md" role="group" aria-label="Category options">
                {CATEGORIES.map((cat) => (
                    <CategoryButton
                        key={cat}
                        label={cat}
                        selected={locked ? cat === winningCategory : selected === cat}
                        disabled={locked}
                        onClick={() => handleSelect(cat)}
                    />
                ))}
            </div>

            {!locked && selected && (
                <p className="font-pixel text-[10px] text-pixel-brown-dark text-center" role="status">
                    vote recorded! waiting for others...
                </p>
            )}

            {locked && winningCategory && (
                <p className="font-pixel text-[10px] text-pixel-ink text-center" role="status">
                    {selected
                        ? `Category decided: ${winningCategory}`
                        : `You didn't vote — category decided: ${winningCategory}`}
                </p>
            )}
        </div>
    )
}

export default VoteCategory