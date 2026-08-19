import { motion } from 'motion/react'
import { useEffect } from 'react'

interface InvasionWarningProps {
  invaderName: string
  onComplete: () => void
}

export function InvasionWarning({ invaderName, onComplete }: InvasionWarningProps) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, 1200)
    const skip = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      if (event.key === ' ') event.preventDefault()
      onComplete()
    }
    window.addEventListener('keydown', skip)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', skip)
    }
  }, [onComplete])

  return (
    <motion.div className="invasion-warning-overlay" role="presentation" onClick={onComplete} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.section
        className="invasion-warning"
        role="alertdialog"
        aria-label="던전 침입 경고"
        initial={{ opacity: 0, scale: 0.96, x: -4 }}
        animate={{ opacity: 1, scale: 1, x: [0, -3, 3, -2, 0] }}
        transition={{ duration: 0.42, ease: 'linear' }}
      >
        <p>!! WARNING !!</p>
        <h2>던전 침입 감지</h2>
        <strong>{invaderName}</strong>
        <span>접근 중 · 클릭 / ENTER / SPACE로 넘기기</span>
      </motion.section>
    </motion.div>
  )
}
