export type SoundId =
  | 'ui_click'
  | 'dig'
  | 'build_complete'
  | 'event_positive'
  | 'event_negative'
  | 'event_mixed'
  | 'event_neutral'
  | 'invasion_warning'
  | 'defense_win'
  | 'defense_loss'
  | 'tier_up'
  | 'special_visitor'

type Tone = { frequency: number; duration: number; delay?: number; type?: OscillatorType; gain?: number }

const sounds: Record<SoundId, Tone[]> = {
  ui_click: [{ frequency: 680, duration: 0.035, gain: 0.025, type: 'square' }],
  dig: [{ frequency: 95, duration: 0.09, gain: 0.07, type: 'sawtooth' }],
  build_complete: [{ frequency: 330, duration: 0.07 }, { frequency: 495, duration: 0.1, delay: 0.07 }],
  event_positive: [{ frequency: 440, duration: 0.07 }, { frequency: 660, duration: 0.1, delay: 0.07 }],
  event_negative: [{ frequency: 300, duration: 0.08 }, { frequency: 170, duration: 0.13, delay: 0.08 }],
  event_mixed: [{ frequency: 330, duration: 0.06 }, { frequency: 280, duration: 0.08, delay: 0.07 }],
  event_neutral: [{ frequency: 360, duration: 0.045, gain: 0.025 }],
  invasion_warning: [
    { frequency: 220, duration: 0.1, gain: 0.08, type: 'square' },
    { frequency: 220, duration: 0.1, delay: 0.18, gain: 0.08, type: 'square' },
    { frequency: 220, duration: 0.1, delay: 0.36, gain: 0.08, type: 'square' },
  ],
  defense_win: [{ frequency: 392, duration: 0.08 }, { frequency: 523, duration: 0.08, delay: 0.08 }, { frequency: 659, duration: 0.14, delay: 0.16 }],
  defense_loss: [{ frequency: 294, duration: 0.09 }, { frequency: 220, duration: 0.1, delay: 0.09 }, { frequency: 147, duration: 0.16, delay: 0.19 }],
  tier_up: [{ frequency: 330, duration: 0.1 }, { frequency: 440, duration: 0.1, delay: 0.1 }, { frequency: 554, duration: 0.1, delay: 0.2 }, { frequency: 659, duration: 0.2, delay: 0.3 }],
  special_visitor: [{ frequency: 196, duration: 0.07, type: 'triangle' }, { frequency: 392, duration: 0.12, delay: 0.08, type: 'square' }],
}

class SoundManager {
  private context: AudioContext | null = null
  private enabled = true
  private masterGain = 0.55

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  async unlock(): Promise<void> {
    if (!this.enabled || typeof window === 'undefined') return
    this.context ??= new AudioContext()
    if (this.context.state === 'suspended') await this.context.resume().catch(() => undefined)
  }

  play(id: SoundId): void {
    if (!this.enabled) return
    void this.unlock().then(() => {
      const context = this.context
      if (!context || context.state !== 'running') return
      sounds[id].forEach((tone) => {
        const start = context.currentTime + (tone.delay ?? 0)
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        oscillator.type = tone.type ?? 'square'
        oscillator.frequency.setValueAtTime(tone.frequency, start)
        gain.gain.setValueAtTime((tone.gain ?? 0.05) * this.masterGain, start)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.duration)
        oscillator.connect(gain).connect(context.destination)
        oscillator.start(start)
        oscillator.stop(start + tone.duration)
      })
    })
  }
}

export const soundManager = new SoundManager()
