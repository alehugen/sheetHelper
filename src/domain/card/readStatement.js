import { EntryKind } from './CardEntry.js'

function toNumber(raw) {
  const text = String(raw ?? '')
  const negative = /^[-−]/.test(text.trim())
  const digits = text
    .replace(/[^\d,.]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const value = Number(digits)
  if (!Number.isFinite(value)) return null
  return negative ? -value : value
}

function sectionAt(line, sections) {
  const found = Object.entries(sections).find(([, pattern]) =>
    pattern.test(line),
  )
  return found ? found[0] : null
}

function readDeclared(line, declared) {
  for (const [name, pattern] of Object.entries(declared)) {
    const match = line.match(pattern)
    if (match) return [name, toNumber(match[1])]
  }
  return null
}

function entryFrom(match, section, kinds) {
  const { date, merchant, current, total, amount } = match.groups ?? {}
  return {
    section,
    kind: kinds[section] ?? EntryKind.PURCHASE,
    date: date ?? null,
    merchant: (merchant ?? '').trim() || null,
    amount: amount === undefined ? null : toNumber(amount),
    installment:
      current && total
        ? { current: Number(current), total: Number(total) }
        : null,
    category: null,
    foreign: null,
  }
}

function attach(entry, line, attachments) {
  for (const { field, pattern, map } of attachments) {
    const match = line.match(pattern)
    if (!match) continue
    entry[field] = map ? map(match) : match[1]
    return true
  }
  return false
}

export function readStatement(text, issuer) {
  // O extrator de PDF junta os fragmentos de texto com espaço, e colunas
  // alinhadas viram vários espaços seguidos: "Fatura anterior   R$ 5.772,14".
  // Colapsar aqui deixa cada descritor escrever um espaço só.
  const lines = String(text ?? '')
    .split('\n')
    .map((line) => line.trim().replace(/\s+/g, ' '))
    .filter(Boolean)

  const entries = []
  const declared = {}
  let section = null
  let pending = null

  for (const line of lines) {
    const next = sectionAt(line, issuer.sections)
    if (next) {
      section = next
      pending = null
      continue
    }

    const total = readDeclared(line, issuer.declared ?? {})
    if (total) {
      const [name, value] = total
      declared[name] = issuer.negate?.includes(name) ? -value : value
      pending = null
      continue
    }

    if (pending && issuer.looseAmount) {
      const amount = line.match(issuer.looseAmount)
      if (amount) {
        pending.amount = toNumber(amount[1])
        pending = null
        continue
      }
    }

    const match = section ? line.match(issuer.entry) : null
    if (match) {
      const entry = entryFrom(match, section, issuer.kinds ?? {})
      entries.push(entry)
      pending = entry.amount === null ? entry : null
      continue
    }

    const last = entries.at(-1)
    if (last && issuer.attachments?.length)
      attach(last, line, issuer.attachments)
  }

  return {
    issuer: issuer.id,
    entries: entries.filter((entry) => entry.amount !== null),
    declared,
  }
}

export function checkStatement(statement, issuer, tolerance = 0.05) {
  const sum = (section) =>
    Math.round(
      statement.entries
        .filter((entry) => entry.section === section)
        .reduce((total, entry) => total + entry.amount, 0) * 100,
    ) / 100

  return (issuer.checks ?? []).map(({ section, formula, declared, label }) => {
    const read = formula
      ? Math.round(
          formula.reduce(
            (total, name) => total + (statement.declared[name] ?? 0),
            0,
          ) * 100,
        ) / 100
      : sum(section)
    const stated = statement.declared[declared]
    return {
      label: label ?? `${section ?? 'soma'} = ${declared}`,
      read,
      stated: stated ?? null,
      ok: stated !== undefined && Math.abs(read - stated) <= tolerance,
    }
  })
}
