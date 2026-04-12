/**
 * Lighten a hex color if it has poor contrast against #0d0f12.
 * Returns the original or lightened hex string.
 */
export function ensureContrast(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  // relative luminance (sRGB)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  if (luminance > 0.25) return hex

  // lighten by 30%
  const lift = (c) => Math.min(255, Math.round(c + (255 - c) * 0.3))
  const toHex = (c) => lift(c).toString(16).padStart(2, '0')

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}
