import {
  Radar, RadarChart, PolarGrid,
  PolarAngleAxis, ResponsiveContainer
} from 'recharts'

export default function SkillRadarChart({ skills, subjectColor }) {
  if (!skills?.length) {
    return (
      <div className="radar-empty">
        Fais des exercices pour voir tes compétences !
      </div>
    )
  }

  const data = skills.map(s => ({
    skill:    s.label ?? s.skill_tag.split('/').pop(),
    score:    Math.round(s.score * 100),
    fullMark: 100,
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
        <Radar
          name="Compétences"
          dataKey="score"
          stroke={subjectColor ?? '#4F46E5'}
          fill={subjectColor ?? '#4F46E5'}
          fillOpacity={0.3}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
