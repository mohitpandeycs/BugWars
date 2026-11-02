function Input({ value, onChange, placeholder = "" }) {
    return (
        <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="font-pixel text-xs bg-white border-4 border-pixel-brown-dark px-3 py-3 w-full outline-none placeholder:text-pixel-brown/50"
        />
    )
}

export default Input