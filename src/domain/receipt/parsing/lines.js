import { labelAt } from '../../shared/matching.js'
import { fold, normalizeText, repairOcr } from '../../shared/text.js'

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
