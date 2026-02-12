export const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

export const hashToUnit = (str) => {
  let h = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 2 ** 32
}

export const pseudoTrend = (key, { base = 2.0, swing = 10.0 } = {}) => {
  const u = hashToUnit(key)
  const sign = u > 0.18 ? 1 : -1
  const magnitude = base + (u * swing)
  return sign * magnitude
}

export const dateMultiplier = (dateRange) => {
  switch (dateRange) {
    case '3m': return 3
    case '6m': return 6
    case 'yoy': return 12
    case '30d':
    default: return 1
  }
}

export const pct = (v) => `${v >= 0 ? '+' : ''}${Number(v || 0).toFixed(1)}%`
export const trendTone = (v) => (v >= 0 ? 'text-emerald-600' : 'text-rose-600')

export const fmtInt = (n) => Math.round(Number(n || 0)).toLocaleString()

export const simulateUnits = (seed, baseUnits, dateRange) => {
  const mult = dateMultiplier(dateRange)
  const wobble = 0.85 + (hashToUnit(`${seed}:w`) * 0.5)
  return Math.max(0, Math.round(Number(baseUnits || 0) * mult * wobble))
}

export const simulateTrends = (seed) => {
  const mom = clamp(pseudoTrend(`${seed}:mom`, { base: 1.0, swing: 8.0 }), -18, 18)
  const qoq = clamp(pseudoTrend(`${seed}:qoq`, { base: 2.0, swing: 10.0 }), -22, 22)
  const yoy = clamp(pseudoTrend(`${seed}:yoy`, { base: 3.0, swing: 12.0 }), -28, 28)
  return { mom, qoq, yoy }
}

export const splitModels = (makeSeed, makeUnits, models) => {
  const weights = models.map((m) => 0.35 + hashToUnit(`${makeSeed}:${m}:mw`) * 0.9)
  const sumW = weights.reduce((s, w) => s + w, 0) || 1
  return models.map((m, idx) => ({
    model: m,
    units: Math.max(0, Math.round(makeUnits * (weights[idx] / sumW))),
  }))
}
