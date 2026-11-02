export const CLOUD_SHAPES = {
    wide: `polygon(
    0% 100%, 0% 60%, 15% 60%, 15% 30%, 35% 30%, 35% 0%,
    65% 0%, 65% 30%, 85% 30%, 85% 60%, 100% 60%, 100% 100%
  )`,
    small: `polygon(
    0% 100%, 0% 70%, 20% 70%, 20% 40%, 40% 40%, 40% 0%,
    60% 0%, 60% 40%, 80% 40%, 80% 70%, 100% 70%, 100% 100%
  )`,
}


const CLOUD_ANIMATIONS = {
    none: '',
    drift: 'animate-drift',
    driftSlow: 'animate-driftSlow',
    bob: 'animate-bob',
    driftBob: 'animate-driftBob',
}

function Cloud({ top, left, size = 60, opacity = 0.9, shape = 'wide', animation = 'none' }) {
    const animationClass = CLOUD_ANIMATIONS[animation] ?? CLOUD_ANIMATIONS.none

    return (
        <div
            className={`absolute bg-white pointer-events-none ${animationClass}`}
            style={{
                top,
                left,
                width: `${size}px`,
                height: `${size * 0.4}px`,
                clipPath: CLOUD_SHAPES[shape],
                opacity,
            }}
        />
    )
}

export default Cloud