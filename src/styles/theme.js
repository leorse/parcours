export const theme = {
  colors: {
    primary:   '#316735',
    secondary: '#85BB4B',
    success:   '#85BB4B',
    danger:    '#EC6D5C',
    warning:   '#EC6D5C',

    // Couleurs de la palette
    brand: {
      1: '#316735',  // vert forêt (fond principal)
      2: '#85BB4B',  // vert lime (actions principales)
      3: '#61CDFB',  // bleu ciel (accents froids)
      4: '#C7E8F9',  // bleu glacier (très clair)
      5: '#D7E4C4',  // vert sauge clair (textes secondaires)
      6: '#EC6D5C',  // corail (danger, warmth)
      7: '#5F4B31',  // marron foncé (texte sur fond clair)
    },

    subjects: {
      mathematiques: '#85BB4B',
      francais:      '#61CDFB',
      histoire:      '#EC6D5C',
      sciences:      '#D7E4C4',
    },

    status: {
      completed: '#85BB4B',
      current:   '#61CDFB',
      locked:    '#9CA3AF',
    },
  },

  fonts: {
    display: "'Nunito', sans-serif",
    body:    "'Inter', sans-serif",
    mono:    "'JetBrains Mono', monospace",
  },

  // Couleurs des grandes étapes par matière (début → fin du parcours)
  subjectStepColors: {
    mathematiques: { grandeEtape: ['#2484e0', '#9c50c8', '#e05c24', '#24a0a0'] },
    histoire:      { grandeEtape: ['#2484e0', '#9c50c8', '#c0392b', '#27ae60'] },
    francais:      { grandeEtape: ['#27ae60', '#2484e0', '#e05c24', '#9c50c8'] },
    sciences:      { grandeEtape: ['#2484e0', '#27ae60', '#e05c24', '#9c50c8'] },
  },
}
