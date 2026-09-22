import { codeAgreesWithAmount, describeBoletoCode } from '../boletoCode.js'
import { ReceiptType } from '../ReceiptType.js'
import { ReceiptWarning } from '../ReceiptWarning.js'
import {
  SHARED_STOP_LABELS,
  extractAmount,
  extractDescription,
  extractDueDate,
  extractMoment,
  extractParty,
} from './common.js'
import { findLabeled, findLabeledDigits, scoreKeywords } from './support.js'

const KEYWORDS = [
  ['boleto', 3],
  ['codigo de barras', 3],
  ['linha digitavel', 3],
  ['nosso numero', 2],
  ['cedente', 2],
  ['sacado', 2],
  ['vencimento', 1],
  ['beneficiario', 1],
  ['favorecido', 1],
  ['emissor', 1],
]

const PAYER_LABELS = ['pagador', 'sacado', 'debitado de', 'conta debitada']

const PAYEE_LABELS = [
  'beneficiario',
  'cedente',
  'favorecido',
  'recebedor',
  'destino',
]

export const boletoParser = {
  type: ReceiptType.BOLETO,

  score(text) {
    return scoreKeywords(text, KEYWORDS)
  },

  parse({ body, footer }) {
    const payer = extractParty(body, PAYER_LABELS, [
      ...PAYEE_LABELS,
      ...SHARED_STOP_LABELS,
    ])
    const payee = extractParty(body, PAYEE_LABELS, [
      ...PAYER_LABELS,
      'codigo de barras',
      'linha digitavel',
      'autenticacao',
    ])

    const { date, time } = extractMoment(
      body,
      ['data do pagamento', 'data de pagamento', 'pago em', 'data'],
      ['horario', 'hora'],
    )

    const amount = extractAmount(body, [
      'valor pago',
      'valor cobrado',
      'valor do documento',
      'valor total',
      'valor',
    ])

    const code = findLabeledDigits(
      body,
      ['codigo de barras', 'linha digitavel'],
      {
        minDigits: 30,
      },
    )
    const decoded = describeBoletoCode(code)
    const agrees = codeAgreesWithAmount(decoded, amount)

    const warnings = []
    if (decoded && amount !== null && !agrees) {
      warnings.push(ReceiptWarning.BARCODE_MISMATCH)
    } else if (code && !decoded) {
      warnings.push(ReceiptWarning.BARCODE_UNVERIFIED)
    }

    return {
      warnings,
      values: {
        type: ReceiptType.BOLETO,
        date,
        time,
        dueDate: extractDueDate(body) ?? (agrees ? decoded.dueDate : null),
        amount,
        payerName: payer.name,
        payerDocument: payer.document,
        payerBank: payer.bank,
        payeeName: payee.name,
        payeeDocument: payee.document,
        payeeBank: payee.bank,
        transactionId:
          code ??
          findLabeled(body, ['nosso numero', 'autenticacao']) ??
          findLabeled(footer, ['id da transacao']),
        description: extractDescription(body),
      },
    }
  },
}
