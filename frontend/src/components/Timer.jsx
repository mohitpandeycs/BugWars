import { useState, useEffect, useRef } from 'react'

const ANNOUNCE_THRESHOLDS = [10, 5, 3, 2, 1]

function Timer({ startSeconds, onComplete }) {
    const isValidStart = typeof startSeconds === 'number' && startSeconds >= 0

    const [seconds, setSeconds] = useState(isValidStart ? startSeconds : 0)
    const [announceText, setAnnounceText] = useState('')
    const hasCompletedRef = useRef(false)
    const onCompleteRef = useRef(onComplete)

    useEffect(() => {
        onCompleteRef.current = onComplete
    }, [onComplete])

    useEffect(() => {
        if (!isValidStart) {
            console.warn(`Timer: invalid startSeconds "${startSeconds}", defaulting to 0`)
            return
        }
        setSeconds(startSeconds)
        hasCompletedRef.current = false
    }, [startSeconds, isValidStart])

    useEffect(() => {
        if (seconds === 0 && !hasCompletedRef.current) {
            hasCompletedRef.current = true
            onCompleteRef.current?.()
        }

        if (ANNOUNCE_THRESHOLDS.includes(seconds)) {
            setAnnounceText(`${seconds} seconds remaining`)
        }
    }, [seconds])

    useEffect(() => {
        if (!isValidStart || seconds <= 0) return

        const interval = setInterval(() => {
            setSeconds((prev) => Math.max(0, prev - 1))
        }, 1000)

        return () => clearInterval(interval)
    }, [startSeconds, isValidStart, seconds <= 0])

    if (!isValidStart) {
        return (
            <div className="font-pixel text-pixel-red bg-pixel-cream border-4 border-pixel-brown-dark w-16 h-16 flex items-center justify-center text-[8px] text-center p-1">
                Timer error
            </div>
        )
    }

    return (
        <div className="font-pixel text-pixel-ink bg-pixel-cream-dark border-4 border-pixel-brown-dark w-16 h-16 flex items-center justify-center">
            <span className="text-xl" aria-hidden="true">{seconds}</span>
            <span className="text-xs ml-1" aria-hidden="true">s</span>
            <span className="sr-only" role="status">{announceText}</span>
        </div>
    )
}

export default Timer