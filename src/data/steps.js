export const steps = {
  'math-multiplication-01': [
    {
      id: 'ge-mult-tables-base',
      type: 'grande_etape',
      title: 'Tables de base',
      icon: '✖',
      color: '#2484e0',
      status: 'in_progress',
      lessons: [
        { id: 'lec-mult-001', type: 'lecon', title: "Qu'est-ce que la multiplication ?", status: 'completed' },
        { id: 'lec-mult-002', type: 'lecon', title: 'La commutativité', status: 'completed' },
        { id: 'lec-mult-003', type: 'lecon', title: 'Exercices — Tables de 2 et 3', status: 'in_progress' },
      ],
    },
    {
      id: 'ge-mult-tables-avancees',
      type: 'grande_etape',
      title: 'Tables avancées',
      icon: '🔢',
      color: '#9c50c8',
      status: 'locked',
      lessons: [
        { id: 'lec-mult-004', type: 'lecon', title: 'Tables de 4 à 6', status: 'locked' },
        { id: 'lec-mult-005', type: 'lecon', title: 'Exercices — Toutes les tables', status: 'locked' },
      ],
    },
  ],

  'math-fractions-01': [
    {
      id: 'ge-frac-bases',
      type: 'grande_etape',
      title: 'Bases',
      icon: '½',
      color: '#2484e0',
      status: 'in_progress',
      lessons: [
        { id: 'lec-frac-001', type: 'lecon', title: "Qu'est-ce qu'une fraction ?", status: 'in_progress' },
        { id: 'lec-frac-002', type: 'lecon', title: 'Numérateur et dénominateur', status: 'locked' },
        { id: 'lec-frac-003', type: 'lecon', title: 'Fractions équivalentes', status: 'locked' },
      ],
    },
    {
      id: 'ge-frac-operations',
      type: 'grande_etape',
      title: 'Opérations',
      icon: '+',
      color: '#9c50c8',
      status: 'locked',
      lessons: [
        { id: 'lec-frac-004', type: 'lecon', title: 'Additionner des fractions', status: 'locked' },
        { id: 'lec-frac-005', type: 'lecon', title: 'Simplifier une fraction', status: 'locked' },
      ],
    },
  ],

  'math-geometrie-01': [
    {
      id: 'ge-geo-figures',
      type: 'grande_etape',
      title: 'Figures planes',
      icon: '△',
      color: '#2484e0',
      status: 'completed',
      lessons: [
        { id: 'lec-geo-001', type: 'lecon', title: 'Les triangles', status: 'completed' },
        { id: 'lec-geo-002', type: 'lecon', title: 'Les quadrilatères', status: 'completed' },
        { id: 'lec-geo-003', type: 'lecon', title: 'Le cercle', status: 'completed' },
      ],
    },
    {
      id: 'ge-geo-mesures',
      type: 'grande_etape',
      title: 'Mesures',
      icon: '◻',
      color: '#9c50c8',
      status: 'completed',
      lessons: [
        { id: 'lec-geo-004', type: 'lecon', title: 'Périmètres et aires', status: 'completed' },
        { id: 'lec-geo-005', type: 'lecon', title: 'Exercices — Mesures', status: 'completed' },
      ],
    },
  ],

  'fr-conjugaison-01': [
    {
      id: 'ge-conj-present',
      type: 'grande_etape',
      title: 'Le présent',
      icon: 'P',
      color: '#27ae60',
      status: 'in_progress',
      lessons: [
        { id: 'lec-conj-001', type: 'lecon', title: "Le présent de l'indicatif", status: 'completed' },
        { id: 'lec-conj-002', type: 'lecon', title: 'Exercices — Présent', status: 'in_progress' },
      ],
    },
    {
      id: 'ge-conj-autres',
      type: 'grande_etape',
      title: 'Autres temps',
      icon: 'T',
      color: '#2484e0',
      status: 'locked',
      lessons: [
        { id: 'lec-conj-003', type: 'lecon', title: 'Le passé composé', status: 'locked' },
        { id: 'lec-conj-004', type: 'lecon', title: 'Le futur simple', status: 'locked' },
      ],
    },
  ],

  'hist-antiquite-01': [
    {
      id: 'ge-ant-rome',
      type: 'grande_etape',
      title: 'Rome antique',
      icon: 'R',
      color: '#2484e0',
      status: 'in_progress',
      lessons: [
        { id: 'lec-ant-001', type: 'lecon', title: 'La fondation de Rome', status: 'in_progress' },
        { id: 'lec-ant-002', type: 'lecon', title: "L'empire romain", status: 'locked' },
      ],
    },
    {
      id: 'ge-ant-grece',
      type: 'grande_etape',
      title: 'Grèce antique',
      icon: 'G',
      color: '#9c50c8',
      status: 'locked',
      lessons: [
        { id: 'lec-ant-003', type: 'lecon', title: 'La cité-état', status: 'locked' },
        { id: 'lec-ant-004', type: 'lecon', title: 'Les dieux grecs', status: 'locked' },
      ],
    },
  ],

  'sci-corps-humain-01': [
    {
      id: 'ge-corps-locomoteur',
      type: 'grande_etape',
      title: 'Locomoteur',
      icon: 'L',
      color: '#2484e0',
      status: 'in_progress',
      lessons: [
        { id: 'lec-corps-001', type: 'lecon', title: 'Le squelette', status: 'in_progress' },
        { id: 'lec-corps-002', type: 'lecon', title: 'Les muscles', status: 'locked' },
      ],
    },
    {
      id: 'ge-corps-systemes',
      type: 'grande_etape',
      title: 'Les systèmes',
      icon: 'S',
      color: '#9c50c8',
      status: 'locked',
      lessons: [
        { id: 'lec-corps-003', type: 'lecon', title: 'La digestion', status: 'locked' },
      ],
    },
  ],
}
