import { describe, expect, it } from 'vitest'

import { labelAt, scoreKeywords } from '@/domain/shared/matching'

describe('labelAt', () => {
  it('devolve o que vem depois do rótulo', () => {
    expect(labelAt('Valor: R$ 1.000,00', ['valor'])).toBe('R$ 1.000,00')
  })

  it('ignora acento e caixa', () => {
    expect(labelAt('AGÊNCIA 0340', ['agencia'])).toBe('0340')
  })

  it('devolve null quando o rótulo não abre a linha', () => {
    expect(labelAt('total do valor: 10', ['valor'])).toBeNull()
  })

  it('exige fronteira de palavra — não casa dentro de outra palavra', () => {
    expect(labelAt('BANCO DO BRASIL S.A', ['banco'])).toBe('DO BRASIL S.A')
    expect(labelAt('UNIBANCO S.A', ['banco'])).toBeNull()
  })

  it('aceita rótulo truncado quando o corte cai no meio de uma palavra', () => {
    expect(labelAt('identificad 123', ['identificador'])).toBe('123')
  })

  it('não trata "data de" como truncamento de "data de vencimento"', () => {
    expect(labelAt('data de 22/09/2026', ['data de vencimento'])).toBeNull()
  })

  it('prefere o rótulo mais longo quando vários casam', () => {
    expect(
      labelAt('data de vencimento 22/09/2026', ['data', 'data de vencimento']),
    ).toBe('22/09/2026')
  })

  it('devolve string vazia quando o rótulo está sozinho na linha', () => {
    expect(labelAt('Valor', ['valor'])).toBe('')
  })
})

describe('scoreKeywords', () => {
  const pesos = [
    ['pix', 3],
    ['comprovante', 1],
    ['boleto', 3],
  ]

  it('soma os pesos das palavras presentes', () => {
    expect(scoreKeywords('Comprovante de PIX enviado', pesos)).toBe(4)
  })

  it('exige palavra inteira', () => {
    expect(scoreKeywords('pixel art', pesos)).toBe(0)
  })

  it('devolve zero quando nada casa', () => {
    expect(scoreKeywords('texto qualquer', pesos)).toBe(0)
  })
})
