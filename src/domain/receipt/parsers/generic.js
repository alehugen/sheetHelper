import { formatDocument } from '../../shared/document.js'
import { ReceiptType } from '../ReceiptType.js'
import {
  SHARED_STOP_LABELS,
  extractAmount,
  extractDescription,
  extractDueDate,
  extractMoment,
  extractParty,
} from './common.js'
import { PATTERNS, findAll, findLabeled } from './support.js'

const PAYER_LABELS = [
  'pagador',
  'origem',
  'debitado de',
  'remetente',
  'cliente',
]
const PAYEE_LABELS = [
  'recebedor',
  'beneficiario',
  'favorecido',
  'destino',
  'emissor',
]

export const genericParser = {
  type: ReceiptType.UNKNOWN,

  score() {
    return 0
  },

  parse({ body, footer }) {
    const payer = extractParty(body, PAYER_LABELS, [
      ...PAYEE_LABELS,
      ...SHARED_STOP_LABELS,
    ])
    const payee = extractParty(body, PAYEE_LABELS, [
      ...PAYER_LABELS,
      ...SHARED_STOP_LABELS,
    ])
    const documents = findAll(body, PATTERNS.document)

    const { date, time } = extractMoment(body, ['data'], ['hora', 'horario'])

    return {
      values: {
        type: ReceiptType.UNKNOWN,
        date,
        time,
        dueDate: extractDueDate(body),
        amount: extractAmount(body),
        payerName: payer.name,
        payerDocument: payer.document ?? formatDocument(documents[0] ?? ''),
        payerBank: payer.bank,
        payeeName: payee.name,
        payeeDocument: payee.document ?? formatDocument(documents[1] ?? ''),
        payeeBank: payee.bank,
        transactionId:
          findLabeled(body, [
            'identificador',
            'autenticacao',
            'id da transacao',
            'protocolo',
          ]) ?? findLabeled(footer, ['id da transacao']),
        description: extractDescription(body),
      },
    }
  },
}
