import { describe, expect, it } from 'vitest'

import { EntryKind, remainingInstallments } from '@/domain/card/CardEntry'
import {
  committedNext,
  committedTotal,
  futureCommitment,
  installmentShare,
} from '@/domain/card/installments'
import { TOTAIS } from '../../fixtures/statements.js'

const parcela = (amount, current, total) => ({
  kind: EntryKind.PURCHASE,
  amount,
  installment: { current, total },
})

const avista = (amount) => ({
  kind: EntryKind.PURCHASE,
  amount,
  installment: null,
})

describe('remainingInstallments', () => {
  it('a parcela 5 de 10 tem cinco pela frente', () => {
    expect(remainingInstallments(parcela(100, 5, 10))).toBe(5)
  })

  it('a última parcela não tem nenhuma', () => {
    expect(remainingInstallments(parcela(100, 2, 2))).toBe(0)
  })

  it('compra à vista não tem parcela', () => {
    expect(remainingInstallments(avista(100))).toBe(0)
  })

  it('dados incoerentes não viram número negativo', () => {
    expect(remainingInstallments(parcela(100, 11, 10))).toBe(0)
    expect(remainingInstallments(parcela(100, 0, 10))).toBe(0)
    expect(remainingInstallments({})).toBe(0)
  })
})

describe('futureCommitment', () => {
  it('a curva desce à medida que as parcelas terminam', () => {
    const curva = futureCommitment([parcela(100, 1, 3), parcela(50, 2, 3)])

    expect(curva).toEqual([
      { offset: 1, amount: 150 },
      { offset: 2, amount: 100 },
    ])
  })

  it('o horizonte vai até a parcela mais longa', () => {
    expect(futureCommitment([parcela(10, 1, 8)])).toHaveLength(7)
  })

  it('compra à vista não compromete mês nenhum', () => {
    expect(futureCommitment([avista(1000)])).toEqual([])
  })

  it('fatura sem parcela devolve curva vazia, não zeros', () => {
    expect(futureCommitment([])).toEqual([])
  })

  it('a soma da curva é o total comprometido', () => {
    const entradas = [parcela(100, 1, 3), parcela(50, 2, 3)]
    expect(committedTotal(entradas)).toBe(100 * 2 + 50 * 1)
  })

  it('o primeiro mês é o piso da próxima fatura', () => {
    expect(committedNext([parcela(100, 1, 3), parcela(50, 3, 3)])).toBe(100)
  })
})

describe('installmentShare', () => {
  it('diz quanto da fatura é parcela de compra antiga', () => {
    expect(installmentShare([parcela(300, 2, 3), avista(100)])).toBe(0.75)
  })

  it('fatura sem nada devolve zero em vez de dividir por zero', () => {
    expect(installmentShare([])).toBe(0)
  })
})

describe('contra a fatura de exemplo', () => {
  // As parcelas visíveis na fixture, com valor e posição.
  const visiveis = [
    parcela(150, 5, 10),
    parcela(300, 2, 5),
    parcela(80, 9, 10),
    parcela(500, 1, 8),
  ]

  it('o piso da próxima fatura bate com o que o emissor declara', () => {
    expect(committedNext(visiveis)).toBe(TOTAIS.saldoProximaFatura)
  })

  it('o total comprometido bate com o saldo em aberto declarado', () => {
    expect(committedTotal(visiveis)).toBe(TOTAIS.saldoTotal)
  })

  it('a curva termina quando a parcela mais longa acaba', () => {
    const curva = futureCommitment(visiveis)
    expect(curva).toHaveLength(7)
    expect(curva.at(-1).amount).toBe(500)
  })
})
