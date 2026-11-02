const ROLES = {
    imposter: {
        label: "IMPOSTER",
        color: "text-pixel-red",
        objective: [
            "Sabotage the code without getting caught!",
            "Make the code fail by round 4.",
        ],
    },
    civilian: {
        label: "CIVILIAN",
        color: "text-pixel-green",
        objective: [
            "Fix the bugs and complete the code",
            "Before round 4 ends!",
        ],
    },
}

function RoleCard({ role }) {
    const data = ROLES[role]

    if (!data) {
        return (
            <p className="font-pixel text-pixel-red text-center mt-10">
                Unknown role: "{role}"
            </p>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center gap-6 text-center px-4 py-10">
            <h1 className={`font-pixel text-4xl ${data.color}`}>{data.label}</h1>

            <div className="font-pixel text-xs text-pixel-ink leading-relaxed">
                {data.objective.map((line, i) => (
                    <p key={i}>{line}</p>
                ))}
            </div>

            <p className="font-pixel text-xs text-pixel-green mt-4">
                Game starting soon...
            </p>
        </div>
    )
}

export default RoleCard