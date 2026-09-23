import { fold } from './text.js'

export const BANKS = [
  {
    id: 'bb',
    label: 'Banco do Brasil',
    aliases: ['banco do brasil', 'bco do brasil', 'bb'],
  },
  { id: 'sicredi', label: 'Sicredi', aliases: ['sicredi'] },
  { id: 'sicoob', label: 'Sicoob', aliases: ['sicoob'] },
  {
    id: 'itau',
    label: 'Itaú Unibanco',
    aliases: ['itau unibanco', 'itau', 'unibanco'],
  },
  { id: 'bradesco', label: 'Bradesco', aliases: ['bco bradesco', 'bradesco'] },
  {
    id: 'caixa',
    label: 'Caixa Econômica',
    aliases: ['caixa economica', 'caixa'],
  },
  { id: 'santander', label: 'Santander', aliases: ['santander'] },
  { id: 'nubank', label: 'Nubank', aliases: ['nu pagamentos', 'nubank'] },
  { id: 'inter', label: 'Banco Inter', aliases: ['banco inter', 'bco inter'] },
  { id: 'c6', label: 'C6 Bank', aliases: ['c6 bank', 'c6'] },
  { id: 'safra', label: 'Safra', aliases: ['safra'] },
  { id: 'btg', label: 'BTG Pactual', aliases: ['btg pactual', 'btg'] },
  {
    id: 'mercadopago',
    label: 'Mercado Pago',
    aliases: ['mercado pago', 'mercadopago'],
  },
  { id: 'pagbank', label: 'PagBank', aliases: ['pagseguro', 'pagbank'] },
  {
    id: 'infinitepay',
    label: 'InfinitePay',
    aliases: ['infinitepay', 'cloudwalk'],
  },
  { id: 'stone', label: 'Stone', aliases: ['stone'] },
  { id: 'original', label: 'Banco Original', aliases: ['banco original'] },
]

const MATCHERS = BANKS.flatMap((bank) =>
  bank.aliases.map((alias) => ({ id: bank.id, alias: fold(alias) })),
).sort((a, b) => b.alias.length - a.alias.length)

export function identifyBank(text) {
  const haystack = fold(text)
  if (!haystack) return null

  for (const { id, alias } of MATCHERS) {
    const pattern = new RegExp(`(?<![\\p{L}\\d])${alias}(?![\\p{L}\\d])`, 'u')
    if (pattern.test(haystack)) return id
  }
  return null
}
