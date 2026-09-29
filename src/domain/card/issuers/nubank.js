import { EntryKind } from '../CardEntry.js'

export const nubank = {
  id: 'nubank',
  label: 'Nubank',

  sections: {
    purchases: /^TRANSAÇÕES DE\b/i,
    payments: /^Pagamentos e Financiamentos\b/i,
  },

  kinds: {
    purchases: EntryKind.PURCHASE,
    payments: EntryKind.PAYMENT,
  },

  entry:
    /^(?<date>\d{2}\s+[A-Za-zÀ-ÿ]{3})\s+(?:•+\s*\d{4}\s+)?(?<merchant>.+?)(?:\s+-\s+Parcela\s+(?<current>\d+)\/(?<total>\d+))?(?:\s+(?<amount>[-−]?R\$\s*[\d.]+,\d{2}))?$/,

  looseAmount: /^([-−]?R\$\s*[\d.]+,\d{2})$/,

  attachments: [
    {
      field: 'foreign',
      pattern: /^([A-Z]{3})\s+([\d.]+)$/,
      map: (match) => ({ currency: match[1], amount: Number(match[2]) }),
    },
  ],

  declared: {
    previousBalance: /^Fatura anterior R\$ ([\d.]+,\d{2})$/,
    payments: /^Pagamento recebido [-−]R\$ ([\d.]+,\d{2})$/,
    purchases: /^Total de compras de todos os cartões[^R]*R\$ ([\d.]+,\d{2})$/,
    iof: /^IOF de compras internacionais R\$ ([\d.]+,\d{2})$/,
    others: /^Outros lançamentos R\$ ([\d.]+,\d{2})$/,
    total: /^Total a pagar R\$ ([\d.]+,\d{2})$/,
    nextInvoice: /^Saldo em aberto da próxima fatura R\$ ([\d.]+,\d{2})$/,
    futureTotal: /^Saldo em aberto total R\$ ([\d.]+,\d{2})$/,
  },

  negate: ['payments'],

  checks: [
    {
      formula: ['previousBalance', 'payments', 'purchases', 'iof', 'others'],
      declared: 'total',
      label: 'o resumo fecha no total a pagar',
    },
  ],
}
