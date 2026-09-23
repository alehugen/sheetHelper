const EPOCH_OFFSET = 25569
const DAY_MS = 86400000

export function toUtcDate(iso) {
  const [year, month, day] = String(iso).split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(Date.UTC(year, month - 1, day))
}

export function toSerial(iso) {
  const date = toUtcDate(iso)
  return date ? date.getTime() / DAY_MS + EPOCH_OFFSET : null
}

export function columnIndex(letter) {
  return [...letter].reduce(
    (total, char) => total * 26 + (char.charCodeAt(0) - 64),
    0,
  )
}

export function serialToIso(serial) {
  const value = Number(serial)
  if (!Number.isFinite(value)) return null
  const ms = (value - EPOCH_OFFSET) * DAY_MS
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}
