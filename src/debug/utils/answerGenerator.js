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
    default:
      return null
  }
}
