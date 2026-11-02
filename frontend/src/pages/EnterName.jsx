import { useState, useEffect } from 'react'
import Panel from '../components/Panel'
import Button from '../components/Button'
import Input from '../components/Input'
import CloudBackground from '../components/CloudBackground'
import GameHeader from '../components/GameHeader'
import { HOME_CLOUDS } from '../constants/cloudPresets'
import { MAX_NAME_LENGTH } from '../constants/gameConfig'

const VALID_MODES = ['create', 'join']

function EnterName({ mode = 'create', onBack, onSubmitName, submitting = false, submitError = "" }) {
    const [name, setName] = useState('')

    const safeMode = VALID_MODES.includes(mode) ? mode : 'create'

    useEffect(() => {
        if (!VALID_MODES.includes(mode)) {
            console.warn(`EnterName: invalid mode "${mode}", defaulting to "create"`)
        }
    }, [mode])

    const trimmedName = name.trim()
    const canSubmit = trimmedName.length > 0 && !submitting

    const handleNameChange = (e) => {
        setName(e.target.value.slice(0, MAX_NAME_LENGTH))
    }

    const handleSubmit = () => {
        if (!canSubmit) return
        onSubmitName?.(trimmedName)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSubmit()
    }

    const handleBack = () => {
        onBack?.()
    }

    const heading = safeMode === 'join' ? 'Enter your name to join!' : 'Enter your name!'
    const submitLabel = submitting ? '...' : safeMode === 'join' ? 'JOIN' : 'CREATE'

    return (
        <div className="min-h-screen bg-gradient-to-b from-pixel-sky-top to-pixel-sky-bottom relative overflow-hidden flex flex-col items-center justify-center gap-6 p-4">
            <CloudBackground clouds={HOME_CLOUDS} />
            <GameHeader />

            <Panel className="w-full max-w-sm">
                <p className="font-pixel text-xs text-pixel-ink mb-3">{heading}</p>
                <Input
                    value={name}
                    onChange={handleNameChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Player name..."
                    aria-label="Player name"
                    maxLength={MAX_NAME_LENGTH}
                />
                {submitError && (
                    <p className="font-pixel text-[10px] text-pixel-red mt-2 flex items-center gap-1" role="alert">
                        ⚠ {submitError}
                    </p>
                )}
                <div className="flex gap-2 mt-4">
                    <Button variant="outline" onClick={handleBack} className="flex-1">
                        BACK
                    </Button>
                    <Button variant="orange" onClick={handleSubmit} disabled={!canSubmit} className="flex-1">
                        {submitLabel}
                    </Button>
                </div>
            </Panel>

            <p className="font-pixel text-[10px] text-pixel-ink text-center">
                3-5 Players • Find the Impostor
            </p>
        </div>
    )
}

export default EnterName