import CloudBackground from '../components/CloudBackground'
import { LOBBY_CLOUDS } from '../constants/cloudPresets'

function Results({ winner, players = [], allRoles = {}, onPlayAgain }) {
    const imposter = players.find((p) => allRoles[p.id] === 'imposter')
    const civiliansWon = winner === 'civilians'

    return (
        <div className="min-h-screen bg-gradient-to-b from-pixel-sky-top to-pixel-sky-bottom flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <CloudBackground clouds={LOBBY_CLOUDS} />

            <div className="absolute bottom-0 left-0 right-0 h-12 bg-pixel-grass" />

            <div className="flex flex-col items-center justify-center z-10">
                <div className="text-7xl mb-6 animate-bounce" aria-hidden="true">
                    🏆
                </div>

                <h1
                    className={`font-pixel text-2xl md:text-4xl mb-2 text-center leading-relaxed ${civiliansWon ? 'text-pixel-green' : 'text-pixel-red'
                        }`}
                >
                    {civiliansWon ? 'CIVILIANS WIN!' : 'IMPOSTER WINS!'}
                </h1>

                <p className="font-pixel text-[10px] text-pixel-ink mb-8 text-center max-w-xs">
                    {civiliansWon
                        ? 'The Imposter was caught and ejected!'
                        : 'The Imposter survived all rounds without being caught.'}
                </p>

                <div className="bg-pixel-ink border-4 border-white rounded-xl px-10 py-6 text-center mb-6 w-full max-w-sm">
                    <p className="font-pixel text-white text-xs mb-4 leading-relaxed">The Imposter Was:</p>
                    <p className="font-pixel text-blue-400 text-base">{imposter?.name ?? 'Unknown'}</p>
                </div>

                <div className="w-full max-w-sm mb-8">
                    {players.length === 0 ? (
                        <p className="font-pixel text-[10px] text-pixel-ink/70 text-center">No players</p>
                    ) : (
                        players.map((p) => {
                            const role = allRoles[p.id] ?? 'civilian'
                            const isImposter = role === 'imposter'
                            return (
                                <div
                                    key={p.id}
                                    className="flex items-center justify-between bg-pixel-cream border-4 border-pixel-brown px-4 py-2 mb-2"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div
                                            className="w-4 h-4 border-2 border-pixel-brown shrink-0"
                                            style={{ backgroundColor: p.color }}
                                            aria-hidden="true"
                                        />
                                        <span className="font-pixel text-pixel-ink text-xs truncate">
                                            {p.name}
                                            {p.isYou ? ' (You)' : ''}
                                        </span>
                                    </div>
                                    <span
                                        className={`font-pixel text-xs shrink-0 ${isImposter ? 'text-pixel-red' : 'text-pixel-green'
                                            }`}
                                    >
                                        {isImposter ? 'IMPOSTER' : 'CIVILIAN'}
                                    </span>
                                </div>
                            )
                        })
                    )}
                </div>

                <button
                    onClick={() => onPlayAgain?.()}
                    className="font-pixel text-white text-xs bg-pixel-brown border-4 border-pixel-brown-dark px-12 py-4 hover:brightness-110 transition-all active:scale-95"
                >
                    Play Again
                </button>
            </div>
        </div>
    )
}

export default Results