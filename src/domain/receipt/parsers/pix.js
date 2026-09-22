import { ReceiptType } from '../ReceiptType.js'
import {
  SHARED_STOP_LABELS,
  extractAmount,
  extractDescription,
  extractDueDate,
  extractEndToEndId,
  extractMoment,
  extractParty,
} from './common.js'
import { scoreKeywords } from './support.js'

const KEYWORDS = [
  ['pix', 3],
  ['chave pix', 2],
  ['quem pagou', 2],
  ['quem recebeu', 2],
  ['end to end', 2],
  ['tipo de transferencia', 1],
  ['id da transacao', 1],
]

const PAYER_LABELS = [
  'quem pagou',
  'dados do pagador',
  'origem',
  'pagador',
  'debitado de',
  'conta debitada',
  'remetente',
  'cliente',
  'titular',
]

const PAYEE_LABELS = [
  'quem recebeu',
  'dados do recebedor',
  'destino',
  'recebedor',
  'favorecido',
  'beneficiario',
  'creditado para',
  'destinatario',
]

export const pixParser = {
  type: ReceiptType.PIX,

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
      ...SHARED_STOP_LABELS,
    ])

    const { date, time } = extractMoment(
      body,
      ['data do pagamento', 'data da transacao', 'data e hora', 'data'],
      ['horario', 'hora'],
    )

    return {
      values: {
        type: ReceiptType.PIX,
        date,
        time,
        dueDate: extractDueDate(body),
        amount: extractAmount(body, ['valor enviado', 'valor do pix', 'valor']),
        payerName: payer.name,
        payerDocument: payer.document,
        payerBank: payer.bank,
        payeeName: payee.name,
        payeeDocument: payee.document,
        payeeBank: payee.bank,
        transactionId: extractEndToEndId(body, footer),
        description: extractDescription(body),
      },
    }
  },
}
