import { describe, expect, it } from 'vitest'

import { Category, categorize, fromMerchant } from '@/domain/card/categories'

describe('categorize — três camadas, nessa ordem', () => {
  it('1ª: a correção da usuária vence tudo', () => {
    const r = categorize(
      { merchant: 'Dm *Spotify', category: 'restaurante' },
      { 'dm *spotify': Category.SERVICES },
    )
    expect(r).toEqual({ category: Category.SERVICES, source: 'manual' })
  })

  it('2ª: a categoria do arquivo vence o dicionário', () => {
    const r = categorize({
      merchant: 'IFD*OUTBACK STEAKHOUSEC',
      category: 'restaurante',
    })
    expect(r).toEqual({ category: Category.FOOD, source: 'issuer' })
  })

  it('3ª: sem categoria no arquivo, cai no dicionário', () => {
    const r = categorize({ merchant: 'Dm *Spotify', category: null })
    expect(r).toEqual({ category: Category.SUBSCRIPTION, source: 'dictionary' })
  })

  it('quando nada reconhece, fica sem categoria — não inventa "outros"', () => {
    const r = categorize({
      merchant: 'ESTABELECIMENTO XYZ 123',
      category: null,
    })
    expect(r).toEqual({ category: null, source: null })
  })

  it('"outros" do emissor não conta como categoria', () => {
    const r = categorize({
      merchant: 'ESTABELECIMENTO XYZ 123',
      category: 'outros',
    })
    expect(r.category).toBeNull()
  })
})

describe('fromMerchant', () => {
  it('reconhece o prefixo de adquirente', () => {
    expect(fromMerchant('IFD*MILANO COMERCIO VAC')).toBe(Category.FOOD)
    expect(fromMerchant('EBN *SPOTIFYCUR')).toBe(Category.SUBSCRIPTION)
  })

  it('reconhece com a cidade colada, como o Itaú escreve', () => {
    expect(fromMerchant('NETFLIX ENTRETENIMENTOB')).toBe(Category.SUBSCRIPTION)
  })

  it('ignora acento e caixa', () => {
    expect(fromMerchant('farmácia central')).toBe(Category.HEALTH)
  })

  it('devolve null para desconhecido, em vez de chutar', () => {
    expect(fromMerchant('QWERTY 123')).toBeNull()
    expect(fromMerchant(null)).toBeNull()
  })
})
