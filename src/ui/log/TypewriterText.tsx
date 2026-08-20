import { useEffect, useRef, useState } from 'react'

interface TypewriterTextProps {
  text: string
  enabled: boolean
  onComplete?: () => void
  onSkip?: () => void
  className?: string
}

export function TypewriterText({ text, enabled, onComplete, onSkip, className }: TypewriterTextProps) {
  const [length, setLength] = useState(enabled ? 0 : text.length)
  const didComplete = useRef(!enabled)

  useEffect(() => {
    if (!enabled || length >= text.length) {
      if (length >= text.length && !didComplete.current) {
        didComplete.current = true
        onComplete?.()
      }
      return
    }
    const timer = window.setTimeout(() => setLength((current) => Math.min(text.length, current + 1)), 25)
    return () => window.clearTimeout(timer)
  }, [enabled, length, onComplete, text.length])

  useEffect(() => {
    if (!enabled || length >= text.length) return
    const skip = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      if (event.key === ' ') event.preventDefault()
      onSkip?.()
      setLength(text.length)
    }
    window.addEventListener('keydown', skip)
    return () => window.removeEventListener('keydown', skip)
  }, [enabled, length, onSkip, text.length])

  const skip = () => {
    if (!enabled || length >= text.length) return
    onSkip?.()
    setLength(text.length)
  }

  return <p className={className} onClick={skip}>{text.slice(0, length)}{enabled && length < text.length && <span className="typing-caret">▌</span>}</p>
}
