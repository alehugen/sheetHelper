const END_TO_END = /^E(\d{8})(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/

const MIN_LENGTH = 21

export function describePixId(value) {
  const id = String(value ?? '').trim()
  if (id.length < MIN_LENGTH) return null

  const match = id.match(END_TO_END)
  if (!match) return null

  const [, ispb, year, month, day, hour, minute] = match
  if (Number(year) < 2000 || Number(year) > 2100) return null
  if (Number(month) < 1 || Number(month) > 12) return null
  if (Number(day) < 1 || Number(day) > 31) return null
  if (Number(hour) > 23 || Number(minute) > 59) return null

  return { ispb, date: `${year}-${month}-${day}`, time: `${hour}:${minute}` }
}

export function daysApart(isoA, isoB) {
  const a = Date.parse(`${isoA}T00:00:00Z`)
  const b = Date.parse(`${isoB}T00:00:00Z`)
  if (Number.isNaN(a) || Number.isNaN(b)) return null
  return Math.abs(a - b) / 86400000
}
