const variants = {
    orange: "bg-pixel-orange border-pixel-brown-dark text-pixel-ink hover:bg-pixel-orange-dark",
    green: "bg-pixel-green border-pixel-brown-dark text-white hover:bg-pixel-green-dark",
    red: "bg-pixel-red border-pixel-brown-dark text-white hover:bg-pixel-red-dark",
    outline: "bg-pixel-cream border-pixel-brown-dark text-pixel-ink hover:bg-pixel-cream-dark",
}

function Button({ children, variant = "orange", onClick, className = "", disabled = false, ...rest }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        font-pixel text-sm border-4 px-6 py-3
        shadow-[4px_4px_0px_0px_rgba(59,42,20,0.4)]
        active:shadow-[2px_2px_0px_0px_rgba(59,42,20,0.4)]
        active:translate-x-[2px] active:translate-y-[2px]
        transition-all disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
            {...rest}
        >
            {children}
        </button>
    )
}

export default Button