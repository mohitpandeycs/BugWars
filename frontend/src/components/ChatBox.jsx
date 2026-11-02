import { useState, useRef, useEffect } from 'react'

const MAX_LENGTH = 200

function ChatBox({ messages = [], onSendMessage }) {
    const [text, setText] = useState('')
    const [sending, setSending] = useState(false)
    const scrollContainerRef = useRef(null)
    const bottomRef = useRef(null)

    // sirf tab auto-scroll karo agar user pehle se bottom ke paas hai
    useEffect(() => {
        const container = scrollContainerRef.current
        if (!container) return

        const isNearBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight < 100

        if (isNearBottom) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    const handleSend = async () => {
        const trimmed = text.trim()
        if (trimmed === '' || sending) return

        if (!onSendMessage) {
            console.warn('ChatBox: onSendMessage prop is missing!')
            return
        }

        setSending(true)
        await onSendMessage(trimmed)
        setText('')
        setSending(false)
    }

    const charsLeft = MAX_LENGTH - text.length

    return (
        <div className="bg-pixel-cream border-4 border-pixel-brown-dark flex flex-col h-full">
            <h2 className="font-pixel text-sm text-pixel-ink text-center border-b-4 border-pixel-brown-dark py-2">
                Chat
            </h2>

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-3">
                {messages.length === 0 ? (
                    <p className="font-pixel text-[10px] text-pixel-brown/60 text-center mt-4">
                        No messages yet...
                    </p>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className="mb-2">
                            <span
                                className="font-pixel text-[10px]"
                                style={{ color: msg.color || "#5C4324" }}
                            >
                                {msg.sender}:
                            </span>
                            <span className="font-pixel text-[10px] text-pixel-ink ml-1">
                                {msg.text}
                            </span>
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            <div className="border-t-4 border-pixel-brown-dark p-3">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your message"
                        maxLength={MAX_LENGTH}
                        disabled={sending}
                        className="font-pixel text-[10px] flex-1 bg-white border-2 border-pixel-brown-dark px-2 py-2 outline-none disabled:opacity-50"
                    />
                    <button
                        onClick={handleSend}
                        disabled={sending}
                        aria-label="Send message"
                        className="bg-pixel-orange border-2 border-pixel-brown-dark px-3 font-pixel text-xs disabled:opacity-50"
                    >
                        ➤
                    </button>
                </div>
                <p className="font-pixel text-[8px] text-pixel-brown/60 mt-1 text-right">
                    {charsLeft} left
                </p>
            </div>
        </div>
    )
}

export default ChatBox