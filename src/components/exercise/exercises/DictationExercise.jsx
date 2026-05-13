// ═══════════════════════════════════════════════════════
// JALON 8a — Android natif :
// Remplacer window.speechSynthesis par TextToSpeech Android
// Voir : android.speech.tts.TextToSpeech
// Rate  : tts.setSpeechRate(0.85f)
// Lang  : Locale.FRENCH
// ═══════════════════════════════════════════════════════
import { useState, useEffect, useRef } from 'react'

export default function DictationExercise({ exercise, onSubmit }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers,      setAnswers]      = useState([])
  const [input,        setInput]        = useState('')
  const [spoken,       setSpoken]       = useState(false)
  const [speaking,     setSpeaking]     = useState(false)
  const [speechAvailable, setSpeechAvailable] = useState(false)
  const [showHint,     setShowHint]     = useState(false)
  const inputRef = useRef(null)

  const words      = exercise.words ?? []
  const totalWords = words.length
  const currentWord = words[currentIndex]
  const isLast     = currentIndex === totalWords - 1

  useEffect(() => {
    const check = () => {
      const available =
        'speechSynthesis' in window &&
        window.speechSynthesis.getVoices().length > 0
      setSpeechAvailable(available)
    }
    window.speechSynthesis?.addEventListener('voiceschanged', check)
    check()
    return () => {
      window.speechSynthesis?.removeEventListener('voiceschanged', check)
      window.speechSynthesis?.cancel()
    }
  }, [])

  useEffect(() => {
    if (spoken) inputRef.current?.focus()
  }, [spoken])

  const speak = () => {
    if (speaking) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(currentWord.text)
    utterance.lang = 'fr-FR'
    utterance.rate = 0.85
    utterance.onstart = () => setSpeaking(true)
    utterance.onend   = () => { setSpeaking(false); setSpoken(true) }
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const handleValidate = () => {
    if (!input.trim()) return
    const newAnswers = [...answers, input.trim()]
    setAnswers(newAnswers)
    if (isLast) {
      onSubmit(newAnswers)
    } else {
      setCurrentIndex((i) => i + 1)
      setInput('')
      setSpoken(false)
      setShowHint(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input.trim() && spoken) handleValidate()
  }

  if (!speechAvailable) {
    return (
      <div className="exercise-dictation-unavailable">
        <span>🔇</span>
        <p>La dictée n'est pas disponible sur ce navigateur.</p>
        <p className="dictation-unavailable-hint">Utilise Chrome pour accéder à cet exercice.</p>
      </div>
    )
  }

  return (
    <div className="exercise-dictation">
      <div className="dictation-progress">
        Mot {currentIndex + 1} / {totalWords}
      </div>

      <div className="dictation-input-row">
        <button
          className={`dictation-btn-listen ${speaking ? 'speaking' : ''}`}
          onClick={speak}
          disabled={speaking}
          title={spoken ? 'Réécouter' : 'Écouter'}
        >
          🔊
        </button>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!spoken}
          placeholder={spoken ? 'Écris le mot…' : ''}
          className="dictation-input"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          inputMode="text"
        />
      </div>

      {currentWord.hint && (
        <div className="dictation-hint-container">
          {!showHint ? (
            <button
              className="dictation-btn-hint"
              onClick={() => setShowHint(true)}
              disabled={!spoken}
            >
              💡 Voir un indice
            </button>
          ) : (
            <p className="dictation-hint">Indice : {currentWord.hint}</p>
          )}
        </div>
      )}

      <button
        className="exercise-btn-validate"
        disabled={!input.trim() || !spoken}
        onClick={handleValidate}
      >
        {isLast ? '✅' : '➡️'}
      </button>
    </div>
  )
}
