function generateParams(defs) {
  const vals = {}
  for (const def of defs) {
    if (def.formula !== undefined) {
      let expr = def.formula
      for (const [k, v] of Object.entries(vals)) expr = expr.replaceAll(k, String(v))
      if (!/^[\d\s+\-*/%().*]+$/.test(expr)) throw new Error(`Formule invalide : ${def.name}`)
      // eslint-disable-next-line no-new-func
      vals[def.name] = Function('"use strict"; return (' + expr + ')')()
    } else if (def.type === 'int') {
      const [min, max] = def.range
      vals[def.name] = Math.floor(Math.random() * (max - min + 1)) + min
    } else if (def.type === 'float') {
      const [min, max] = def.range
      vals[def.name] = parseFloat((Math.random() * (max - min) + min).toFixed(def.decimals ?? 1))
    } else if (def.type === 'choice') {
      vals[def.name] = def.values[Math.floor(Math.random() * def.values.length)]
    }
  }
  return vals
}

function substitute(obj, vals) {
  if (typeof obj === 'string')
    return obj.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vals ? vals[k] : `{{${k}}}`))
  if (Array.isArray(obj)) return obj.map(i => substitute(i, vals))
  if (obj && typeof obj === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(obj)) out[k] = substitute(v, vals)
    return out
  }
  return obj
}

export function instantiateExercise(exo) {
  if (!exo || exo.generation === 'fixe' || !exo.params?.length) return exo
  const vals = generateParams(exo.params)
  return { ...exo, exercise: substitute(exo.exercise, vals) }
}
