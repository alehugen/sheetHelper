import { ReceiptType } from '../ReceiptType.js'
import {
  SHARED_STOP_LABELS,
  extractAmount,
  extractDescription,
  extractMoment,
  extractParty,
} from './common.js'
import { PATTERNS, findFirst, findLabeled, scoreKeywords } from './support.js'

const KEYWORDS = [
  ['ted', 3],
  ['doc', 2],
  ['transferencia eletronica disponivel', 3],
  ['conta de origem', 2],
  ['conta de destino', 2],
  ['codigo de autenticacao', 2],
  ['favorecido', 1],
]

const PAYER_LABELS = [
  'conta de origem',
  'dados da origem',
  'debitado de',
  'pagador',
  'remetente',
  'origem',
]

const PAYEE_LABELS = [
  'conta de destino',
  'dados do favorecido',
  'favorecido',
  'beneficiario',
  'creditado para',
  'destino',
]

export const tedParser = {
  type: ReceiptType.TED,

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
      ['data da transferencia', 'data do pagamento', 'data'],
      ['horario', 'hora'],
    )

    return {
      values: {
        type: ReceiptType.TED,
        date,
        time,
        amount: extractAmount(body, [
          'valor da transferencia',
          'valor total',
          'valor',
        ]),
        payerName: payer.name,
        payerDocument: payer.document,
        payerBank: payer.bank,
        payeeName: payee.name,
        payeeDocument: payee.document,
        payeeBank: payee.bank,
        transactionId:
          findLabeled(body, [
            'codigo de autenticacao',
            'autenticacao',
            'numero do documento',
            'identificador',
          ]) ??
          findFirst(body, PATTERNS.authCode) ??
          findLabeled(footer, ['id da transacao']),
        description: extractDescription(body),
      },
    }
  },
}
