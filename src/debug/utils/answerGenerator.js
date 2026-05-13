export function generateCorrectAnswer(exercise) {
  switch (exercise.type) {
    case 'multiple_choice': {
      const choice = exercise.choices.find((c) => c.correct)
      return choice?.id ?? null
    }
    case 'fill_in_the_blank':
      return Object.fromEntries(
        exercise.segments.filter((s) => s.blank).map((s) => [s.blank.id, s.blank.answer])
      )
    case 'image_tap': {
      const zone = exercise.zones.find((z) => z.correct)
      return zone?.id ?? null
    }
    case 'drag_drop':
      return Object.fromEntries(exercise.pairs.map((p) => [p.source.id, p.target.id]))
    case 'timeline':
      return [...exercise.items]
        .sort((a, b) => a.correct_position - b.correct_position)
        .map((item) => item.id)
    case 'matching':
      return Object.fromEntries(exercise.pairs.map((p) => [p.left.id, p.right.id]))
    case 'free_text':
      return {
        __debug_info__: 'Exercice texte libre — correction via IA',
        context:   exercise.ai_correction?.context ?? 'Pas de contexte défini',
        min_words: exercise.min_words,
        max_words: exercise.max_words,
      }
    case 'fraction_tap': {
      const pieces = exercise.pieces ?? 8
      const targetNum = exercise.target_numerator ?? 1
      const targetDen = exercise.target_denominator ?? 2
      const count = (pieces * targetNum) / targetDen
      return { selected: Array.from({ length: count }, (_, i) => i), pieces }
    }
    case 'dictation':
      return (exercise.words ?? []).map((w) => w.text)
    default:
      return null
  }
}

export function generateWrongAnswer(exercise) {
  switch (exercise.type) {
    case 'multiple_choice': {
      const choice = exercise.choices.find((c) => !c.correct)
      return choice?.id ?? null
    }
    case 'fill_in_the_blank':
      return Object.fromEntries(
        exercise.segments.filter((s) => s.blank).map((s) => [s.blank.id, 'MAUVAISE_RÉPONSE'])
      )
    case 'image_tap': {
      const zone = exercise.zones.find((z) => !z.correct)
      return zone?.id ?? null
    }
    case 'drag_drop': {
      const pairs = exercise.pairs
      return Object.fromEntries(
        pairs.map((p, i) => [p.source.id, pairs[(i + 1) % pairs.length].target.id])
      )
    }
    case 'timeline':
      return [...exercise.items]
        .sort((a, b) => a.correct_position - b.correct_position)
        .map((item) => item.id)
        .reverse()
    case 'matching': {
      const rights = exercise.pairs.map((p) => p.right.id)
      return Object.fromEntries(
        exercise.pairs.map((p, i) => [p.left.id, rights[(i + 1) % rights.length]])
      )
    }
    case 'fraction_tap': {
      const pieces = exercise.pieces ?? 8
      const targetNum = exercise.target_numerator ?? 1
      const targetDen = exercise.target_denominator ?? 2
      const correctCount = (pieces * targetNum) / targetDen
      const wrongCount = Math.max(0, correctCount - 1)
      return { selected: Array.from({ length: wrongCount }, (_, i) => i), pieces }
    }
    case 'dictation':
      return (exercise.words ?? []).map((w) => w.text + 'x')
    default:
      return null
  }
}
