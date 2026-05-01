import { Howl } from 'howler'
import { useRef } from 'react'

export const useAudio = () => {
  const musicRef = useRef(null)

  const playMusic = (src, { loop = true, volume = 0.5 } = {}) => {
    if (musicRef.current) musicRef.current.stop()
    try {
      musicRef.current = new Howl({ src: [src], loop, volume })
      musicRef.current.play()
    } catch {
      // Fichier audio absent — ignoré silencieusement en dev
    }
  }

  const stopMusic = () => musicRef.current?.stop()

  const playSound = (src) => {
    try {
      new Howl({ src: [src], volume: 0.8 }).play()
    } catch {
      // Ignoré silencieusement
    }
  }

  return { playMusic, stopMusic, playSound }
}
