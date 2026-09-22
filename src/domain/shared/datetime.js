const MONTHS = {
  janeiro: 1,
  fevereiro: 2,
  marco: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
  jan: 1,
  fev: 2,
  mar: 3,
  abr: 4,
  mai: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  set: 9,
  out: 10,
  nov: 11,
  dez: 12,
}

function toIsoDate(year, month, day) {
  const y = Number(year)
  const m = Number(month)
  const d = Number(day)
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) return null
  const full = y < 100 ? 2000 + y : y
  return `${full}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function parseDate(input) {
  if (!input) return null
  const text = String(input).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)
  if (iso) return toIsoDate(iso[1], iso[2], iso[3])

  const slashed = text.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/)
  if (slashed) return toIsoDate(slashed[3], slashed[2], slashed[1])

  const written = text.match(
    /\b(\d{1,2})\s*(?:de\s+)?([a-z]{3,9})\.?\s*(?:de\s+)?(\d{4})\b/,
  )
  if (written && MONTHS[written[2]]) {
    return toIsoDate(written[3], MONTHS[written[2]], written[1])
  }

  return null
}

export function parseTime(input) {
  if (!input) return null
  const match = String(input).match(
    /\b([01]?\d|2[0-3])[:h]([0-5]\d)(?::([0-5]\d))?\b/,
  )
  if (!match) return null
  const [, h, m, s] = match
  const base = `${h.padStart(2, '0')}:${m}`
  return s ? `${base}:${s}` : base
}

export function formatDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return y && m && d ? `${d}/${m}/${y}` : iso
}
