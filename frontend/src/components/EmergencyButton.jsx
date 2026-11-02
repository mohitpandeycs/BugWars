import { useState, useEffect } from 'react'

function EmergencyButton({ onConfirm, cooldownSeconds = 0 }) {
    const [remaining, setRemaining] = useState(cooldownSeconds)
    const [confirming, setConfirming] = useState(false)

    // jab bhi naya cooldownSeconds aaye (jaise round change ho), reset karo
    useEffect(() => {
        setRemaining(cooldownSeconds)
    }, [cooldownSeconds])

    // khud countdown karo
    useEffect(() => {
        if (remaining <= 0) return
        const interval = setInterval(() => {
            setRemaining((prev) => prev - 1)
        }, 1000)
        return () => clearInterval(interval)
    }, [remaining])

    const isLocked = remaining > 0

    const handleClick = () => {
        if (isLocked) return
        if (!confirming) {
            setConfirming(true)
            return
        }
        onConfirm?.()
        setConfirming(false)
    }

    return (
        <button
            onClick={handleClick}
            disabled={isLocked}
            className={`
        w-full font-pixel text-sm
        border-4 border-pixel-brown-dark
        text-white py-4
        shadow-[4px_4px_0px_0px_rgba(59,42,20,0.4)]
        active:shadow-[2px_2px_0px_0px_rgba(59,42,20,0.4)]
        active:translate-x-[2px] active:translate-y-[2px]
        transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        ${confirming ? "bg-pixel-brown-dark animate-pulse" : "bg-pixel-red"}
      `}
        >
            {isLocked
                ? `⚠ EMERGENCY (${remaining}s)`
                : confirming
                    ? "TAP AGAIN TO CONFIRM"
                    : "⚠ EMERGENCY"}
        </button>
    )
}

export default EmergencyButton;