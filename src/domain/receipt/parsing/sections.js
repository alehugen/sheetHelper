import { labelAt } from '../../shared/matching.js'
import { fold } from '../../shared/text.js'

function matchesSection(line, spec) {
  const folded = fold(line)
  if (spec.exact?.some((word) => folded === fold(word))) return true
  return spec.labels?.length ? labelAt(line, spec.labels) !== null : false
}

export function sectionHeaderValue(line, spec) {
  return spec.labels?.length ? labelAt(line, spec.labels) : null
}

export function sliceSection(lines, startSpec, stopSpecs = []) {
  const start = lines.findIndex((line) => matchesSection(line, startSpec))
  if (start === -1) return []

  const rest = lines.slice(start + 1)
  const relativeStop = rest.findIndex((line) =>
    stopSpecs.some((spec) => matchesSection(line, spec)),
  )
  const end = relativeStop === -1 ? lines.length : start + 1 + relativeStop
  return lines.slice(start, end)
}

export function findFirst(lines, pattern) {
  for (const line of lines) {
    const match = line.match(pattern)
    if (match) return match[0]
  }
  return null
}
