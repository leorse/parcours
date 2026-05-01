const CENTER_X  = 200
const PADDING_TOP    = 80
const PADDING_BOTTOM = 100

function buildSentierPath(totalHeight) {
  const yStart    = PADDING_TOP
  const yEnd      = totalHeight - PADDING_BOTTOM
  const pathHeight = yEnd - yStart
  const numWaves  = Math.max(5, Math.ceil(pathHeight / 110))

  let d = `M ${CENTER_X} ${yStart}`
  for (let i = 0; i < numWaves; i++) {
    const t0   = i / numWaves
    const t1   = (i + 1) / numWaves
    const y0   = yStart + t0 * pathHeight
    const y1   = yStart + t1 * pathHeight
    const midY = (y0 + y1) / 2
    const off  = (i % 2 === 0 ? 1 : -1) * 16
    d += ` C ${CENTER_X + off} ${midY - 12} ${CENTER_X - off} ${midY + 12} ${CENTER_X} ${y1}`
  }
  return d
}

export default function ParcPath({ totalHeight }) {
  const d = buildSentierPath(totalHeight)
  return (
    <g>
      {/* Bordure ombragée */}
      <path d={d} stroke="#8a6030" strokeWidth="36" fill="none" strokeLinecap="round" opacity="0.6" />
      {/* Couche principale (terre) */}
      <path d={d} stroke="#c4964a" strokeWidth="28" fill="none" strokeLinecap="round" />
      {/* Reflet central */}
      <path d={d} stroke="#d4a85a" strokeWidth="16" fill="none" strokeLinecap="round" opacity="0.5" />
      {/* Texture cailloux (tirets discrets) */}
      <path d={d} stroke="rgba(0,0,0,0.07)" strokeWidth="2" fill="none" strokeLinecap="round"
            strokeDasharray="3 14" />
    </g>
  )
}
