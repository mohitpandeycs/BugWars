import { useEffect } from 'react'
import CloudBackground from '../components/CloudBackground'
import RoleCard from '../components/RoleCard'
import { LOBBY_CLOUDS } from '../constants/cloudPresets'
import { ROLE_REVEAL_DURATION_MS } from '../constants/gameConfig'

function RoleReveal({ role, onRevealComplete }) {
    useEffect(() => {
        if (!role) return // don't start the timer if role hasn't arrived yet

        const timer = setTimeout(() => {
            onRevealComplete?.()
        }, ROLE_REVEAL_DURATION_MS)

        return () => clearTimeout(timer)
    }, [role, onRevealComplete])

    return (
        <div className="min-h-screen bg-gradient-to-b from-pixel-sky-top to-pixel-sky-bottom relative overflow-hidden flex items-center justify-center p-4">
            <CloudBackground clouds={LOBBY_CLOUDS} />

            {role ? (
                <RoleCard role={role} />
            ) : (
                <p className="font-pixel text-pixel-ink text-center" role="status">
                    Assigning roles...
                </p>
            )}
        </div>
    )
}

export default RoleReveal