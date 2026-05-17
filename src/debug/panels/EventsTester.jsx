// src/debug/panels/EventsTester.jsx
// Panel debug pour tester toutes les animations mascotte et tous les événements.

import { useState } from 'react'
import { useEventContext } from '../../context/EventContext'
import MascotteAvatar from '../../components/mascotte/MascotteAvatar'

// ─── Données ──────────────────────────────────────────────────────────────────

const ANIMATIONS = [
  { id: 'wave',      label: 'Wave',      emoji: '👋' },
  { id: 'happy',     label: 'Happy',     emoji: '😄' },
  { id: 'excited',   label: 'Excited',   emoji: '🎉' },
  { id: 'jump',      label: 'Jump',      emoji: '⬆️'  },
  { id: 'concerned', label: 'Concerned', emoji: '😟' },
  { id: 'thinking',  label: 'Thinking',  emoji: '🤔' },
  { id: 'proud',     label: 'Proud',     emoji: '😤' },
  { id: 'celebrate', label: 'Celebrate', emoji: '🥳' },
  { id: 'amazed',    label: 'Amazed',    emoji: '😲' },
  { id: 'sleepy',    label: 'Sleepy',    emoji: '😴' },
]

const NARRATIONS = [
  {
    id: 'mono-math-intro',
    label: '📖 Monologue — Intro Maths',
    payload: { type: 'monologue', dialogueRef: 'dialogues/math_intro.yaml' },
  },
  {
    id: 'mono-mul-intro',
    label: '📖 Monologue — Intro Multiplication',
    payload: { type: 'monologue', dialogueRef: 'dialogues/mul_intro.yaml' },
  },
  {
    id: 'dia-fractions',
    label: '💬 Dialogue — Crac & Moggy Fractions',
    payload: { type: 'dialogue', dialogueRef: 'dialogues/crac_moggy_fractions.yaml' },
  },
]

const PRESET_EVENTS = [
  {
    id: 'evt-first-launch',
    label: 'Premier lancement',
    payload: {
      type: 'dialog', animation: 'wave',
      messages: ["Bienvenue ! Je m'appelle Lumio 👋", "Je vais t'accompagner dans ton apprentissage.", "Choisis une matière pour commencer !"],
    },
  },
  {
    id: 'evt-long-absence',
    label: 'Retour après absence',
    payload: {
      type: 'dialog', animation: 'concerned',
      messages: ["Ça fait 5 jours qu'on ne s'est pas vus !", "Voici quelques exercices pour se remettre dans le bain :"],
    },
  },
  {
    id: 'evt-daily-login',
    label: 'Connexion quotidienne',
    payload: {
      type: 'dialog', animation: 'happy',
      messages: ["Bonjour Damien ! 🌟", "Tu es là depuis 3 jours d'affilée !"],
    },
  },
  {
    id: 'evt-first-subject',
    label: 'Première matière',
    payload: {
      type: 'dialog', animation: 'excited',
      messages: ["Tu commences Mathématiques pour la première fois !", "Prends ton temps, on y va étape par étape. 😊"],
    },
  },
  {
    id: 'evt-streak-7',
    label: 'Streak 7 jours',
    payload: {
      type: 'dialog', animation: 'amazed',
      messages: ["7 jours d'affilée ! Tu es incroyable Damien ! 🔥🔥🔥"],
    },
  },
  {
    id: 'evt-badge-earned',
    label: 'Badge débloqué',
    payload: {
      type: 'dialog', animation: 'celebrate',
      messages: ["Tu as débloqué le badge Première victoire 🏅 !"],
    },
  },
  {
    id: 'evt-weak-skill',
    label: 'Compétence faible',
    payload: {
      type: 'dialog', animation: 'thinking',
      messages: ["J'ai remarqué que tu galères un peu sur arithmétique.", "Je te propose quelques exercices de renforcement ! 💪"],
    },
  },
  {
    id: 'evt-long-session',
    label: 'Session longue',
    payload: {
      type: 'dialog', animation: 'sleepy',
      messages: ["Tu travailles depuis 35 minutes !", "Tu veux faire une petite pause ?"],
      buttons: [{ label: 'Continuer', action: 'dismiss' }, { label: 'Faire une pause', action: 'go_to_menu' }],
    },
  },
  {
    id: 'evt-exercise-perfect',
    label: 'Exercice parfait',
    payload: {
      type: 'dialog', animation: 'jump',
      messages: ["Parfait ! 100% — tu maîtrises ça ! ⭐", "Tu as gagné 40 XP !"],
    },
  },
  {
    id: 'evt-exercise-encouragement',
    label: 'Exercice difficile',
    payload: {
      type: 'dialog', animation: 'concerned',
      messages: ["C'est difficile, mais tu vas y arriver ! 💪", "Réessaie, je crois en toi !"],
    },
  },
  {
    id: 'evt-first-course-complete',
    label: 'Premier cours terminé',
    payload: [
      { type: 'celebration', animation: 'confetti' },
      { type: 'dialog', animation: 'proud', messages: ["Bravo ! Tu viens de finir ton premier cours ! 🎉", "Tu as gagné 120 points d'expérience !"] },
    ],
  },
]

// ─── Composant principal ──────────────────────────────────────────────────────

export default function EventsTester() {
  const { pushEvents, queue, currentEvent } = useEventContext()
  const [previewAnim, setPreviewAnim] = useState('wave')

  const firePayload = (payload) => {
    const payloads = Array.isArray(payload) ? payload : [payload]
    pushEvents(payloads.map(p => ({ ...p, eventId: 'debug' })))
  }

  const fireCelebration = (animation) => {
    pushEvents([{ type: 'celebration', animation, eventId: 'debug' }])
  }

  const queueSize = queue.length + (currentEvent ? 1 : 0)

  return (
    <div style={s.root}>

      {/* Barre de statut queue */}
      <div style={s.status}>
        <span style={{ color: queueSize > 0 ? '#e3b341' : '#3fb950' }}>
          {queueSize > 0 ? `⏳ ${queueSize} événement(s) en file` : '✅ File vide'}
        </span>
        {currentEvent && (
          <span style={s.current}>
            ▶ {
              currentEvent.type === 'dialog'      ? `💬 ${currentEvent.animation}` :
              currentEvent.type === 'monologue'   ? `📖 monologue — ${currentEvent.dialogueRef}` :
              currentEvent.type === 'dialogue'    ? `🎭 dialogue — ${currentEvent.dialogueRef}` :
              currentEvent.type === 'celebration' ? `🎊 ${currentEvent.animation}` :
              currentEvent.type
            }
          </span>
        )}
      </div>

      {/* Colonnes */}
      <div style={s.columns}>

        {/* ── Colonne gauche : animations + célébrations ── */}
        <div style={s.col}>
          <Section title="ANIMATIONS — aperçu live">
            <div style={s.avatarPreview}>
              <MascotteAvatar animation={previewAnim} />
              <span style={s.animLabel}>{previewAnim}</span>
            </div>
            <div style={s.animGrid}>
              {ANIMATIONS.map(a => (
                <button
                  key={a.id}
                  style={{ ...s.animBtn, ...(previewAnim === a.id ? s.animBtnActive : {}) }}
                  onClick={() => setPreviewAnim(a.id)}
                >
                  {a.emoji} {a.label}
                </button>
              ))}
            </div>
          </Section>

          <Section title="CÉLÉBRATIONS">
            <div style={s.btnRow}>
              <Btn label="🎊 Confettis"       color="#4f46e5" onClick={() => fireCelebration('confetti')} />
              <Btn label="🎆 Feux d'artifice" color="#f59e0b" onClick={() => fireCelebration('fireworks')} />
            </div>
          </Section>

          <Section title="STRESS TEST — FILE D'ATTENTE">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Btn
                label="🔥 Empiler 3 dialogues"
                color="#ef4444"
                onClick={() => pushEvents([
                  { type: 'dialog', animation: 'wave',      messages: ['Message 1 sur 3 — wave'],      eventId: 'debug' },
                  { type: 'dialog', animation: 'happy',     messages: ['Message 2 sur 3 — happy'],     eventId: 'debug' },
                  { type: 'dialog', animation: 'celebrate', messages: ['Message 3 sur 3 — celebrate'], eventId: 'debug' },
                ])}
              />
              <Btn
                label="🎊 Célébration + dialog"
                color="#10b981"
                onClick={() => pushEvents([
                  { type: 'celebration', animation: 'fireworks', eventId: 'debug' },
                  { type: 'dialog', animation: 'amazed', messages: ["Wouah ! 🔥🔥🔥"], eventId: 'debug' },
                ])}
              />
            </div>
          </Section>
        </div>

        {/* ── Colonne centre : événements présets ── */}
        <div style={s.col}>
          <Section title="ÉVÉNEMENTS PRÉSETS (conditions ignorées)">
            <div style={s.eventList}>
              {PRESET_EVENTS.map(evt => (
                <div key={evt.id} style={s.eventRow}>
                  <span style={s.eventLabel}>{evt.label}</span>
                  <button style={s.fireBtn} onClick={() => firePayload(evt.payload)}>
                    ▶ Lancer
                  </button>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* ── Colonne droite : narrations + dialog custom ── */}
        <div style={s.col}>
          <Section title="NARRATIONS (monologue / dialogue)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {NARRATIONS.map(n => (
                <div key={n.id} style={s.eventRow}>
                  <span style={s.eventLabel}>{n.label}</span>
                  <button style={s.fireBtn} onClick={() => firePayload(n.payload)}>
                    ▶ Lancer
                  </button>
                </div>
              ))}
              <Btn
                label="📖+🎭 Les trois enchaînés"
                color="#7c3aed"
                onClick={() => pushEvents(NARRATIONS.map(n => ({ ...n.payload, eventId: 'debug' })))}
              />
            </div>
          </Section>

          <Section title="DIALOG CUSTOM">
            <CustomDialog onFire={firePayload} previewAnim={previewAnim} />
          </Section>
        </div>

      </div>
    </div>
  )
}

// ─── Dialog custom ─────────────────────────────────────────────────────────────

function CustomDialog({ onFire, previewAnim }) {
  const [msg1, setMsg1] = useState("Bonjour Damien ! 👋")
  const [msg2, setMsg2] = useState("")
  const [anim, setAnim] = useState(previewAnim)

  const fire = () => {
    const messages = [msg1, msg2].filter(Boolean)
    if (!messages.length) return
    onFire({ type: 'dialog', animation: anim, messages })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <select
        style={s.select}
        value={anim}
        onChange={e => setAnim(e.target.value)}
      >
        {ANIMATIONS.map(a => (
          <option key={a.id} value={a.id}>{a.emoji} {a.label}</option>
        ))}
      </select>
      <input
        style={s.input}
        placeholder="Message 1 (obligatoire)"
        value={msg1}
        onChange={e => setMsg1(e.target.value)}
      />
      <input
        style={s.input}
        placeholder="Message 2 (optionnel)"
        value={msg2}
        onChange={e => setMsg2(e.target.value)}
      />
      <Btn label="▶ Envoyer" color="#4f46e5" onClick={fire} />
    </div>
  )
}

// ─── Sous-composants ─────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>{title}</div>
      {children}
    </div>
  )
}

function Btn({ label, color, onClick }) {
  return (
    <button style={{ ...s.btn, background: color }} onClick={onClick}>
      {label}
    </button>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = {
  root: {
    flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column',
    background: '#0d1117', color: '#c9d1d9', fontFamily: 'monospace', fontSize: '12px',
  },
  status: {
    display: 'flex', gap: 12, alignItems: 'center',
    padding: '6px 12px', background: '#161b22', borderBottom: '1px solid #30363d',
    fontSize: '11px', flexShrink: 0,
  },
  current: { color: '#8b949e' },

  columns: {
    display: 'flex', flex: 1, overflow: 'hidden',
  },
  col: {
    flex: 1, overflow: 'auto', borderRight: '1px solid #21262d',
    display: 'flex', flexDirection: 'column',
  },

  section: { padding: '10px 12px', borderBottom: '1px solid #21262d' },
  sectionTitle: {
    fontSize: '10px', color: '#8b949e', letterSpacing: '1px',
    textTransform: 'uppercase', marginBottom: '8px',
  },

  avatarPreview: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    marginBottom: 10, background: '#161b22', borderRadius: 8, padding: '12px',
  },
  animLabel: { color: '#00ff88', fontSize: '11px' },

  animGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 },
  animBtn: {
    background: '#21262d', border: '1px solid #30363d', borderRadius: 4,
    color: '#c9d1d9', cursor: 'pointer', fontSize: '11px', padding: '5px 8px',
    textAlign: 'left', fontFamily: 'monospace',
  },
  animBtnActive: {
    background: '#0d2027', border: '1px solid #00ff88', color: '#00ff88',
  },

  btnRow: { display: 'flex', gap: 8 },
  btn: {
    flex: 1, border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer',
    fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold', padding: '7px 10px',
  },

  eventList: { display: 'flex', flexDirection: 'column', gap: 4 },
  eventRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '5px 8px', background: '#161b22', borderRadius: 4,
  },
  eventLabel: { color: '#c9d1d9', fontSize: '11px' },
  fireBtn: {
    background: '#1f6feb', border: 'none', borderRadius: 3, color: '#fff',
    cursor: 'pointer', fontSize: '10px', fontFamily: 'monospace', padding: '3px 8px',
    flexShrink: 0,
  },

  input: {
    width: '100%', background: '#161b22', border: '1px solid #30363d', borderRadius: 4,
    color: '#c9d1d9', fontFamily: 'monospace', fontSize: '11px', padding: '5px 8px',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%', background: '#161b22', border: '1px solid #30363d', borderRadius: 4,
    color: '#c9d1d9', fontFamily: 'monospace', fontSize: '11px', padding: '5px 8px',
  },
}
