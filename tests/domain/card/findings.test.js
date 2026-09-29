import { describe, expect, it } from 'vitest'

import { EntryKind } from '@/domain/card/CardEntry'
import { FindingKind, findings } from '@/domain/card/findings'

const compra = (campos) => ({
  kind: EntryKind.PURCHASE,
  date: '03/08',
  merchant: 'LOJA EXEMPLO',
  amount: 100,
  foreign: null,
  ...campos,
})

const achado = (lista, tipo) => lista.find((f) => f.kind === tipo)

describe('cobrança duplicada', () => {
  it('acusa mesma loja, mesmo dia, mesmo valor', () => {
    const lista = findings([compra({}), compra({})])
    const dup = achado(lista, FindingKind.DUPLICATE)

    expect(dup.count).toBe(2)
    expect(dup.total).toBe(200)
  })

  it('não acusa quando o dia é diferente', () => {
    expect(findings([compra({}), compra({ date: '04/08' })])).toEqual([])
  })

  it('não acusa quando o valor é diferente', () => {
    expect(findings([compra({}), compra({ amount: 101 })])).toEqual([])
  })

  it('ignora acento e caixa no nome da loja', () => {
    const lista = findings([
      compra({ merchant: 'Padaria Açaí' }),
      compra({ merchant: 'PADARIA ACAI' }),
    ])
    expect(achado(lista, FindingKind.DUPLICATE).count).toBe(2)
  })

  it('pagamento repetido não é cobrança duplicada', () => {
    const pagamento = compra({ kind: EntryKind.PAYMENT, amount: -100 })
    expect(findings([pagamento, pagamento])).toEqual([])
  })
})

describe('encargos e internacional', () => {
  it('soma as tarifas', () => {
    const lista = findings([compra({ kind: EntryKind.FEE, amount: 89 })])
    expect(achado(lista, FindingKind.FEE).total).toBe(89)
  })

  it('juros viram achado próprio, porque a conversa é outra', () => {
    const lista = findings([compra({ kind: EntryKind.INTEREST, amount: 250 })])
    expect(achado(lista, FindingKind.INTEREST).total).toBe(250)
  })

  it('soma o IOF', () => {
    const lista = findings([compra({ kind: EntryKind.IOF, amount: 3.29 })])
    expect(achado(lista, FindingKind.IOF).total).toBe(3.29)
  })

  it('conta as compras em moeda estrangeira', () => {
    const lista = findings([
      compra({ foreign: { currency: 'USD', amount: 10 }, amount: 60 }),
      compra({
        date: '05/08',
        foreign: { currency: 'USD', amount: 5 },
        amount: 30,
      }),
    ])
    const inter = achado(lista, FindingKind.INTERNATIONAL)

    expect(inter.count).toBe(2)
    expect(inter.total).toBe(90)
  })

  it('fatura limpa não gera achado nenhum', () => {
    expect(
      findings([compra({}), compra({ date: '04/08', amount: 50 })]),
    ).toEqual([])
  })

  it('lista vazia não quebra', () => {
    expect(findings([])).toEqual([])
  })
})
