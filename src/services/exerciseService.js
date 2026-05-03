export function validateAnswer(exercise, userAnswer) {
  switch (exercise.type) {
    case 'multiple_choice':
      return validateMultipleChoice(exercise, userAnswer)
    case 'fill_in_the_blank':
      return validateFillInTheBlank(exercise, userAnswer)
    case 'image_tap':
      return validateImageTap(exercise, userAnswer)
    case 'drag_drop':
      return validateDragDrop(exercise, userAnswer)
    case 'timeline':
      return validateTimeline(exercise, userAnswer)
    case 'matching':
      return validateMatching(exercise, userAnswer)
    case 'free_text':
      return { correct: null, score: null, details: {} }
    default:
      return { correct: false, score: 0, details: {} }
  }
}

function validateMultipleChoice(exercise, userAnswer) {
  const choice = exercise.choices.find((c) => c.id === userAnswer)
  return {
    correct: choice?.correct ?? false,
    score: choice?.correct ? 1.0 : 0.0,
    details: { feedback: choice?.feedback ?? null },
  }
}

function validateFillInTheBlank(exercise, userAnswer) {
  const blanks = exercise.segments.filter((s) => s.blank)
  let correct = 0
  const feedbacks = []
  const isCaseSensitive = exercise.settings?.case_sensitive ?? false

  blanks.forEach((s) => {
    const expected = s.blank.answer
    const variants = s.blank.accept_variants ?? []
    const given = (userAnswer[s.blank.id] ?? '').trim()

    const normalize = (v) => (isCaseSensitive ? v : v.toLowerCase())
    const match =
      normalize(given) === normalize(expected) ||
      variants.some((v) => normalize(given) === normalize(v))

    if (match) {
      correct++
    } else {
      feedbacks.push(`Attendu : "${expected}"`)
    }
  })

  return {
    correct: correct === blanks.length,
    score: blanks.length > 0 ? correct / blanks.length : 0,
    details: { feedback: feedbacks.length > 0 ? feedbacks.join(' — ') : null },
  }
}

function validateImageTap(exercise, userAnswer) {
  const zone = exercise.zones.find((z) => z.id === userAnswer)
  return {
    correct: zone?.correct ?? false,
    score: zone?.correct ? 1.0 : 0.0,
    details: { feedback: zone?.feedback ?? null },
  }
}

function validateDragDrop(exercise, userAnswer) {
  let correct = 0
  exercise.pairs.forEach((pair) => {
    if (userAnswer[pair.source.id] === pair.target.id) correct++
  })
  return {
    correct: correct === exercise.pairs.length,
    score: exercise.pairs.length > 0 ? correct / exercise.pairs.length : 0,
    details: { feedback: null },
  }
}

function validateTimeline(exercise, userAnswer) {
  const expected = [...exercise.items]
    .sort((a, b) => a.correct_position - b.correct_position)
    .map((item) => item.id)

  const correctCount = userAnswer.filter((id, i) => id === expected[i]).length
  return {
    correct: correctCount === exercise.items.length,
    score: exercise.items.length > 0 ? correctCount / exercise.items.length : 0,
    details: { feedback: null },
  }
}

function validateMatching(exercise, userAnswer) {
  let correct = 0
  exercise.pairs.forEach((pair) => {
    if (userAnswer[pair.left.id] === pair.right.id) correct++
  })
  return {
    correct: correct === exercise.pairs.length,
    score: exercise.pairs.length > 0 ? correct / exercise.pairs.length : 0,
    details: { feedback: null },
  }
}
