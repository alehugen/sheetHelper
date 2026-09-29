import { fold } from '../shared/text.js'

export const Category = {
  FOOD: 'food',
  MARKET: 'market',
  TRANSPORT: 'transport',
  HEALTH: 'health',
  SUBSCRIPTION: 'subscription',
  SHOPPING: 'shopping',
  TRAVEL: 'travel',
  SERVICES: 'services',
  OTHER: 'other',
}

const MERCHANTS = [
  [
    Category.FOOD,
    [
      'ifood',
      'ifd',
      'rappi',
      'outback',
      'mcdonald',
      'burger king',
      'subway',
      'starbucks',
      'pizzaria',
      'restaurante',
      'padaria',
      'confeitaria',
      'cafeteria',
      'hamburgueria',
      'grill',
    ],
  ],
  [
    Category.MARKET,
    [
      'carrefour',
      'pao de acucar',
      'assai',
      'atacadao',
      'shopper',
      'supermercado',
      'mercado',
      'hortifruti',
      'zona sul',
      'big',
    ],
  ],
  [
    Category.TRANSPORT,
    [
      'uber',
      'noventa nove',
      '99app',
      'cabify',
      'posto',
      'shell',
      'ipiranga',
      'petrobras',
      'estacionamento',
      'nutag',
      'sem parar',
      'conectcar',
      'pedagio',
    ],
  ],
  [
    Category.HEALTH,
    [
      'drogaria',
      'drogasil',
      'pacheco',
      'raia',
      'farmacia',
      'panvel',
      'laboratorio',
      'clinica',
      'hospital',
      'dimed',
    ],
  ],
  [
    Category.SUBSCRIPTION,
    [
      'netflix',
      'spotify',
      'disney',
      'amazon prime',
      'primebr',
      'hbo',
      'max',
      'youtube premium',
      'apple.com',
      'icloud',
      'google',
      'canva',
      'adobe',
      'microsoft',
      'openai',
      'twitch',
      'deezer',
      'globoplay',
      'paramount',
    ],
  ],
  [
    Category.SHOPPING,
    [
      'amazon',
      'mercado livre',
      'mercadolivre',
      'magazine',
      'magalu',
      'americanas',
      'shopee',
      'aliexpress',
      'shein',
      'renner',
      'riachuelo',
      'c&a',
      'zara',
      'nike',
      'adidas',
      'centauro',
    ],
  ],
  [
    Category.TRAVEL,
    [
      'latam',
      'gol ',
      'azul ',
      'airlines',
      'british',
      'booking',
      'airbnb',
      'decolar',
      'cvc',
      'hotel',
      'pousada',
    ],
  ],
  [
    Category.SERVICES,
    [
      'vivo',
      'claro',
      'tim ',
      'oi ',
      'copel',
      'sanepar',
      'enel',
      'cemig',
      'seguro',
      'academia',
      'smartfit',
    ],
  ],
]

// O Itaú já categoriza na própria fatura; estes são os rótulos dele.
const ISSUER_CATEGORIES = {
  restaurante: Category.FOOD,
  supermercado: Category.MARKET,
  saúde: Category.HEALTH,
  transporte: Category.TRANSPORT,
  vestuário: Category.SHOPPING,
  viagem: Category.TRAVEL,
  serviços: Category.SERVICES,
  combustível: Category.TRANSPORT,
  farmácia: Category.HEALTH,
  lazer: Category.OTHER,
  educação: Category.SERVICES,
  outros: null,
}

export function fromIssuerCategory(label) {
  if (!label) return null
  return ISSUER_CATEGORIES[fold(label)] ?? ISSUER_CATEGORIES[label] ?? null
}

export function fromMerchant(merchant) {
  const haystack = fold(merchant)
  if (!haystack) return null

  for (const [category, needles] of MERCHANTS) {
    if (needles.some((needle) => haystack.includes(fold(needle))))
      return category
  }
  return null
}

export function categorize(entry, overrides = {}) {
  const manual = overrides[fold(entry.merchant)]
  if (manual) return { category: manual, source: 'manual' }

  const fromFile = fromIssuerCategory(entry.category)
  if (fromFile) return { category: fromFile, source: 'issuer' }

  const guessed = fromMerchant(entry.merchant)
  if (guessed) return { category: guessed, source: 'dictionary' }

  return { category: null, source: null }
}
