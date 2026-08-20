import { motion } from 'motion/react'

interface TierPromotionOverlayProps {
  fromName: string
  toName: string
  tierLevel: number
  summary: string[]
  onClose: () => void
}

export function TierPromotionOverlay({ fromName, toName, tierLevel, summary, onClose }: TierPromotionOverlayProps) {
  return <motion.div className="tier-up-overlay" role="dialog" aria-modal="true" aria-label="던전 승급 완료" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.12 }}>
    <motion.section className="tier-up-panel" initial={{ y: 16 }} animate={{ y: 0 }} transition={{ duration: 0.16, ease: 'linear' }}>
      <p>TIER UP</p><strong>TIER {tierLevel}</strong>
      <h2><span>{fromName}</span><b>→</b>{toName}</h2>
      <div>{summary.map((line) => <span key={line}>{line}</span>)}</div>
      <button type="button" onClick={onClose}>확인</button>
    </motion.section>
  </motion.div>
}
