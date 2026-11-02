function CategoryButton({ label, onClick, selected = false, disabled = false }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-pressed={selected}
            className={`
        font-pixel text-xs border-4 border-pixel-brown-dark px-4 py-3
        max-w-xs whitespace-normal text-center
        shadow-[4px_4px_0px_0px_rgba(59,42,20,0.4)]
        active:shadow-[2px_2px_0px_0px_rgba(59,42,20,0.4)]
        active:translate-x-[2px] active:translate-y-[2px]
        transition-all disabled:opacity-40 disabled:cursor-not-allowed
        ${selected && !disabled ? 'bg-pixel-orange text-pixel-ink' : 'bg-pixel-cream-dark text-pixel-ink'}
      `}
        >
            {label}
        </button>
    )
}

export default CategoryButton