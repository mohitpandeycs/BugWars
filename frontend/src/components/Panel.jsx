function Panel({ children, className = "" }) {
    return (
        <div
            className={`bg-pixel-cream border-4 border-pixel-brown p-6 shadow-[6px_6px_0px_0px_rgba(59,42,20,0.4)] ${className}`}
        >
            {children}
        </div>
    )
}

export default Panel;