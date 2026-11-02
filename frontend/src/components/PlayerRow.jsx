function PlayerRow({
    name = 'Unknown Player',
    color = '#D9534F',
    isYou = false,
    isHost = false,
    isReady = false,
    isActive = true,
    voteCount = null,
    votedFor = false,
    onClick,
    disabled = false,
}) {
    const isClickable = typeof onClick === 'function'
    const showVoteCount = typeof voteCount === 'number' && voteCount > 0

    const content = (
        <>
            <div className="flex items-center gap-3 min-w-0">
                <div
                    className="w-5 h-5 border-2 border-pixel-brown-dark shrink-0"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                />
                <span
                    className={`font-pixel text-xs text-pixel-ink truncate ${!isActive ? 'line-through text-pixel-brown/50' : ''
                        }`}
                >
                    {name} {isYou && '(You)'}
                </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {isHost && (
                    <span className="text-pixel-orange" aria-label="Host" title="Host">★</span>
                )}
                {isReady && !votedFor && (
                    <span className="text-pixel-green" aria-label="Ready" title="Ready">✔</span>
                )}
                {votedFor && (
                    <span
                        className="text-pixel-green font-pixel text-[10px]"
                        aria-label="Your vote"
                        title="Your vote"
                    >
                        YOUR VOTE
                    </span>
                )}
                {showVoteCount && (
                    <span
                        className="font-pixel text-xs bg-pixel-red text-white px-2 py-1 border-2 border-pixel-brown-dark"
                        aria-label={`${voteCount} votes`}
                        title={`${voteCount} vote${voteCount === 1 ? '' : 's'}`}
                    >
                        {voteCount}
                    </span>
                )}
                {!isActive && (
                    <span className="font-pixel text-[10px] text-pixel-red" title="Eliminated">DEAD</span>
                )}
            </div>
        </>
    )

    const sharedClasses =
        'flex items-center justify-between bg-pixel-cream border-4 border-pixel-brown-dark px-4 py-2 mb-2 w-full text-left'

    if (isClickable) {
        return (
            <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                aria-pressed={votedFor}
                className={`${sharedClasses} transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:bg-pixel-cream-dark'
                    }`}
            >
                {content}
            </button>
        )
    }

    return <div className={sharedClasses}>{content}</div>
}

export default PlayerRow