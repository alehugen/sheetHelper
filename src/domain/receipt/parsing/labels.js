import {
  cleanValue,
  fold,
  normalizeText,
  onlyDigits,
  repairOcr,
} from '../../shared/text.js'

export const PATTERNS = {
  document:
    /[*x\d]{2}\.[*x\d]{3}\.[*x\d]{3}\/[*x\d]{4}-[*x\d]{2}|[*x\d]{3}\.[*x\d]{3}\.[*x\d]{3}-[*x\d]{2}|[*x]{2,}[*x\d]{6,}|[*x\d]{6,}[*x]{2,}|(?<!\d)\d{14}(?!\d)|(?<!\d)\d{11}(?!\d)/i,
  amount: /R?\$?\s*\d[\d.]*,\d{2}/,
  date: /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\s+(?:de\s+)?[a-zà-ÿ]{3,9}\.?,?\s+(?:de\s+)?\d{4}\b/i,
  time: /\b([01]?\d|2[0-3])[:h][0-5]\d(?::[0-5]\d)?\b/,
  endToEndId: /\bE[0-9A-Za-zÀ-ÿ]{25,35}\b/,
  authCode: /\b[0-9A-F]{16,64}\b/i,
}

const FOOTER_MARKERS = [
  /estamos aqui para ajudar/,
  /^ouvidoria/,
  /^me ajuda/,
  /^central de atendimento/,
  /^sac /,
  /^em caso de duvida/,
]

const FOOTER_OPENERS = [/^nu pagamentos s\.?\s?a/, /^instituicao de pagamento/]

const FOOTER_LOOKBACK = 6

const NOISE_LABELS = [
  'nome',
  'cpf',
  'cnpj',
  'cpf/cnpj',
  'documento',
  'banco',
  'instituicao',
  'instituicao financeira',
  'agencia',
  'conta',
  'tipo de conta',
  'chave pix',
  'chave',
  'valor',
  'data',
  'hora',
  'horario',
  'vencimento',
  'emissor',
  'tipo de transferencia',
  'id da transacao',
  'identificador',
  'expiracao',
  'codigo de barras',
  'linha digitavel',
  'informacoes adicionais',
  'valor original',
  'autenticacao',
  'finalidade',
  'descricao',
]

const MIN_PREFIX = 6

function isBoundary(char) {
  return char === undefined || !/[\p{L}\d]/u.test(char)
}

export function labelAt(line, labels) {
  const folded = fold(line)
  let best = -1

  for (const label of labels) {
    const needle = fold(label)
    if (folded.startsWith(needle) && isBoundary(folded[needle.length])) {
      if (needle.length > best) best = needle.length
      continue
    }
    if (needle.length < MIN_PREFIX + 2) continue
    for (let size = needle.length - 1; size >= MIN_PREFIX; size -= 1) {
      if (isBoundary(needle[size])) continue
      if (
        folded.startsWith(needle.slice(0, size)) &&
        isBoundary(folded[size])
      ) {
        if (size > best) best = size
        break
      }
    }
  }

  return best === -1 ? null : cleanValue(line.slice(best))
}

export function isNoiseLine(line) {
  return labelAt(line, NOISE_LABELS) !== null
}

export function toLines(text) {
  return normalizeText(repairOcr(text))
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function splitBody(lines) {
  const marker = lines.findIndex((line) =>
    FOOTER_MARKERS.some((pattern) => pattern.test(fold(line))),
  )
  if (marker === -1) return { body: lines, footer: [] }

  let start = marker
  for (let i = marker - 1; i >= 0 && marker - i <= FOOTER_LOOKBACK; i -= 1) {
    if (FOOTER_OPENERS.some((pattern) => pattern.test(fold(lines[i])))) {
      start = i
    }
  }

  return { body: lines.slice(0, start), footer: lines.slice(start) }
}

export function scoreKeywords(text, weighted) {
  const haystack = fold(text)
  return weighted.reduce((total, [keyword, weight]) => {
    const needle = fold(keyword).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const matcher = new RegExp(`(?<![\\p{L}\\d])${needle}(?![\\p{L}\\d])`, 'u')
    return matcher.test(haystack) ? total + weight : total
  }, 0)
}

function extract(value, pattern) {
  if (!value) return null
  if (!pattern) return value
  const match = value.match(pattern)
  return match ? cleanValue(match[0]) : null
}

export function findLabeled(lines, labels, options = {}) {
  const { pattern = null, lookahead = 2 } = options

  for (let i = 0; i < lines.length; i += 1) {
    const inline = labelAt(lines[i], labels)
    if (inline === null) continue

    const direct = extract(inline, pattern)
    if (direct) return direct

    for (let step = 1; step <= lookahead; step += 1) {
      const next = lines[i + step]
      if (next === undefined) break
      if (!pattern && isNoiseLine(next)) break
      const candidate = extract(cleanValue(next), pattern)
      if (candidate) return candidate
    }
  }
  return null
}

export function findLabeledDigits(lines, labels, options = {}) {
  const { minDigits = 20, maxLines = 3 } = options

  for (let i = 0; i < lines.length; i += 1) {
    const inline = labelAt(lines[i], labels)
    if (inline === null) continue

    let digits = onlyDigits(inline)
    for (let step = 1; step <= maxLines; step += 1) {
      const next = lines[i + step]
      if (next === undefined) break
      const compact = next.replace(/\s/g, '')
      const found = onlyDigits(compact)
      if (!found || found.length / compact.length < 0.7) break
      digits += found
    }

    if (digits.length >= minDigits) return digits
  }
  return null
}

export function matchesSection(line, spec) {
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

export function guessName(lines) {
  for (const line of lines) {
    const value = cleanValue(line)
    if (!value || value.length < 5 || value.length > 80) continue
    if (isNoiseLine(value)) continue
    if (/\d/.test(value)) continue
    if (value.includes(':')) continue
    if (value.split(/\s+/).length < 2) continue
    if (!/^[\p{L}\s'.&-]+$/u.test(value)) continue
    return value
  }
  return null
}
