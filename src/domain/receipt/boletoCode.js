import { dadosBoleto } from 'boletos-desc-br'

import { parseDate } from '../shared/datetime.js'

export function describeBoletoCode(digits) {
  if (!digits || digits.length < 40) return null

  let result
  try {
    result = dadosBoleto(digits)
  } catch {
    return null
  }
  if (!result?.sucesso) return null

  return {
    code: digits,
    barcode: result.codigoBarras ?? null,
    bankCode: result.codigoBarras ? result.codigoBarras.slice(0, 3) : null,
    dueDate: parseDate(result.vencimento),
    amount: Number.isFinite(result.valor) ? result.valor : null,
    kind: result.tipoBoleto ?? null,
  }
}

export function codeAgreesWithAmount(decoded, amount) {
  if (!decoded || decoded.amount === null || amount === null) return false
  return Math.abs(decoded.amount - amount) < 0.01
}
