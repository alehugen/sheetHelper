import { EntryKind } from '../CardEntry.js'

const CATEGORIES = [
  'restaurante',
  'supermercado',
  'saúde',
  'vestuário',
  'serviços',
  'combustível',
  'farmácia',
  'transporte',
  'lazer',
  'educação',
  'viagem',
  'outros',
]

export const itau = {
  id: 'itau',
  label: 'Itaú',

  sections: {
    payments: /^Pagamentos efetuados/i,
    purchases: /^Lançamentos: compras e saques/i,
    international: /^Lançamentos internacionais/i,
    upcoming: /^Compras parceladas - próximas faturas/i,
    charges: /^Encargos cobrados nesta fatura/i,
  },

  kinds: {
    payments: EntryKind.PAYMENT,
    purchases: EntryKind.PURCHASE,
    international: EntryKind.PURCHASE,
    upcoming: EntryKind.PURCHASE,
    charges: EntryKind.FEE,
  },

  entry:
    /^(?<date>\d{2}\/\d{2})\s+(?<merchant>.+?)(?:\s+(?<current>\d{2})\/(?<total>\d{2}))?\s+(?<amount>-?[\d.]+,\d{2})$/,

  attachments: [
    {
      field: 'category',
      pattern: new RegExp(`^(${CATEGORIES.join('|')})\\s`, 'i'),
      map: (match) => match[1].toLowerCase(),
    },
  ],

  declared: {
    previousBalance: /^Total da fatura anterior\s+([\d.]+,\d{2})$/,
    purchases: /^Lançamentos no cartão\s+([\d.]+,\d{2})$/,
    international: /^Total transações inter\. em R\$\s+([\d.]+,\d{2})$/,
    iof: /^Repasse de IOF em R\$\s+([\d.]+,\d{2})$/,
    current: /^Total dos lançamentos atuais\s+([\d.]+,\d{2})$/,
    total: /^Total desta fatura\s+([\d.]+,\d{2})$/,
    nextInvoice: /^Próxima fatura\s+([\d.]+,\d{2})$/,
    futureTotal: /^Total para próximas faturas\s+([\d.]+,\d{2})$/,
  },

  checks: [
    { section: 'purchases', declared: 'purchases', label: 'compras do cartão' },
    {
      section: 'international',
      declared: 'international',
      label: 'compras internacionais',
    },
    {
      section: 'upcoming',
      declared: 'nextInvoice',
      label: 'parcelas da próxima fatura',
    },
  ],
}
