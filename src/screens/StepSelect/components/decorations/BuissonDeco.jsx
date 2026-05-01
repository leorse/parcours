export default function BuissonDeco({ x, y }) {
  return (
    <g fill="#228B22" opacity="0.88">
      <ellipse cx={x} cy={y} rx="20" ry="12" />
      <ellipse cx={x - 13} cy={y + 3} rx="14" ry="9" />
      <ellipse cx={x + 11} cy={y + 2} rx="13" ry="8" />
      <ellipse cx={x - 4} cy={y - 6} rx="10" ry="7" />
    </g>
  )
}
