import { describe, expect, it } from 'vitest'

import {
  byOwnAccount,
  byPeriod,
  byType,
  dateRange,
  suggestUnit,
  summarize,
} from '@/domain/insights/aggregate'
import { Direction } from '@/domain/shared/direction'

const entrada = (campos) => ({
  direction: Direction.CREDIT,
  receipt: { date: '2026-08-14', amount: 100, type: 'pix', ...campos },
})

const saida = (campos) => ({
  direction: Direction.DEBIT,
  receipt: { date: '2026-08-14', amount: 100, type: 'pix', ...campos },
})

const indefinida = (campos) => ({
  direction: null,
  receipt: { date: '2026-08-14', amount: 100, type: 'pix', ...campos },
})

describe('summarize', () => {
  it('separa o que entrou do que saiu e fecha o saldo', () => {
    const total = summarize([entrada({ amount: 300 }), saida({ amount: 100 })])

    expect(total.credit).toBe(300)
    expect(total.debit).toBe(100)
    expect(total.net).toBe(200)
    expect(total.count).toBe(2)
  })

  it('deixa as indefinidas de fora e as conta à parte', () => {
    const total = summarize([entrada({}), indefinida({})])

    expect(total.count).toBe(1)
    expect(total.skipped).toBe(1)
    expect(total.credit).toBe(100)
  })

  it('valor não numérico conta como zero, sem contaminar o total', () => {
    const total = summarize([
      entrada({ amount: 'abc' }),
      entrada({ amount: 50 }),
    ])

    expect(total.credit).toBe(50)
    expect(total.count).toBe(2)
  })

  it('lista vazia devolve zeros', () => {
    expect(summarize([])).toEqual({
      credit: 0,
      debit: 0,
      net: 0,
      count: 0,
      skipped: 0,
    })
  })
})

describe('dateRange e suggestUnit', () => {
  it('encontra a primeira e a última data', () => {
    expect(
      dateRange([
        entrada({ date: '2026-09-22' }),
        entrada({ date: '2026-08-14' }),
      ]),
    ).toEqual({ first: '2026-08-14', last: '2026-09-22' })
  })

  it('sem data devolve null', () => {
    expect(dateRange([entrada({ date: null })])).toBeNull()
    expect(dateRange([])).toBeNull()
  })

  it('período curto usa dia, longo usa mês', () => {
    expect(
      suggestUnit([
        entrada({ date: '2026-08-01' }),
        entrada({ date: '2026-08-20' }),
      ]),
    ).toBe('day')
    expect(
      suggestUnit([
        entrada({ date: '2026-01-01' }),
        entrada({ date: '2026-08-20' }),
      ]),
    ).toBe('month')
  })

  it('uma data só usa dia', () => {
    expect(suggestUnit([entrada({})])).toBe('day')
  })
})

describe('byPeriod', () => {
  it('preenche os períodos vazios, para o eixo não mentir sobre o ritmo', () => {
    const buckets = byPeriod(
      [entrada({ date: '2026-08-01' }), entrada({ date: '2026-08-05' })],
      'day',
    )

    expect(buckets).toHaveLength(5)
    expect(buckets[0].key).toBe('2026-08-01')
    expect(buckets.at(-1).key).toBe('2026-08-05')
    expect(buckets[2].credit).toBe(0)
  })

  it('agrupa por mês quando pedido', () => {
    const buckets = byPeriod(
      [entrada({ date: '2026-08-14' }), entrada({ date: '2026-09-22' })],
      'month',
    )

    expect(buckets.map((b) => b.key)).toEqual(['2026-08', '2026-09'])
  })

  it('cada período fecha: entrada menos saída é o líquido', () => {
    const buckets = byPeriod(
      [entrada({ amount: 300 }), saida({ amount: 100 })],
      'day',
    )

    expect(buckets[0]).toMatchObject({ credit: 300, debit: 100, net: 200 })
  })

  it('linha sem data fica de fora', () => {
    expect(byPeriod([entrada({ date: null })], 'day')).toEqual([])
  })
})

describe('byType e byOwnAccount', () => {
  it('soma por tipo de pagamento', () => {
    const tipos = byType([
      entrada({ type: 'pix', amount: 100 }),
      saida({ type: 'pix', amount: 50 }),
      entrada({ type: 'boleto', amount: 30 }),
    ])

    expect(tipos.map((t) => [t.label, t.total])).toEqual([
      ['pix', 150],
      ['boleto', 30],
    ])
  })

  it('nada é descartado em silêncio: o que não tem chave vira um balde visível', () => {
    const tipos = byType([
      entrada({ type: null, amount: 70 }),
      entrada({ type: 'pix', amount: 30 }),
    ])

    expect(tipos).toHaveLength(2)
    expect(tipos.find((t) => t.label === null).total).toBe(70)
  })

  it('a conta é a MINHA: favorecido quando recebi, pagador quando paguei', () => {
    const contas = byOwnAccount([
      entrada({
        payeeBank: 'Banco do Brasil',
        payeeAccount: '67890-1',
        amount: 300,
      }),
      saida({
        payerBank: 'Banco do Brasil',
        payerAccount: '67890-1',
        amount: 100,
      }),
    ])

    expect(contas).toHaveLength(1)
    expect(contas[0].net).toBe(200)
    expect(contas[0].total).toBe(400)
  })

  it('valor final pode ser negativo', () => {
    const contas = byOwnAccount([
      saida({
        payerBank: 'Banco do Brasil',
        payerAccount: '67890-1',
        amount: 100,
      }),
    ])

    expect(contas[0].net).toBe(-100)
  })
})

describe('coerência entre os gráficos', () => {
  const linhas = [
    entrada({
      date: '2026-08-14',
      amount: 300,
      type: 'pix',
      payeeBank: 'Banco do Brasil',
      payeeAccount: '67890-1',
    }),
    saida({
      date: '2026-09-22',
      amount: 100,
      type: 'boleto',
      payerBank: 'Nubank',
      payerAccount: '123456789-0',
    }),
    entrada({ date: '2026-09-22', amount: 50, type: 'pix' }),
    indefinida({ amount: 999 }),
  ]
  const total = summarize(linhas)
  const movimentado = total.credit + total.debit

  it('os tipos somam o total movimentado', () => {
    expect(byType(linhas).reduce((soma, t) => soma + t.total, 0)).toBeCloseTo(
      movimentado,
    )
  })

  it('os períodos somam o total movimentado', () => {
    const soma = byPeriod(linhas, suggestUnit(linhas)).reduce(
      (acc, b) => acc + b.credit + b.debit,
      0,
    )
    expect(soma).toBeCloseTo(movimentado)
  })

  it('o valor final das contas soma o saldo geral', () => {
    expect(
      byOwnAccount(linhas).reduce((soma, c) => soma + c.net, 0),
    ).toBeCloseTo(total.net)
  })

  it('a linha indefinida não entra em gráfico nenhum', () => {
    expect(movimentado).toBe(450)
    expect(total.skipped).toBe(1)
  })
})

describe('formato dos baldes — trava campo calculado que ninguém lê', () => {
  const linhas = [entrada({ payeeBank: 'Banco do Brasil', payeeAccount: '1' })]

  it('grupo tem exatamente key, label, net e total', () => {
    expect(Object.keys(byType(linhas)[0]).sort()).toEqual([
      'key',
      'label',
      'net',
      'total',
    ])
  })

  it('período tem exatamente key, credit, debit e net', () => {
    expect(Object.keys(byPeriod(linhas, 'day')[0]).sort()).toEqual([
      'credit',
      'debit',
      'key',
      'net',
    ])
  })

  it('resumo tem exatamente count, credit, debit, net e skipped', () => {
    expect(Object.keys(summarize(linhas)).sort()).toEqual([
      'count',
      'credit',
      'debit',
      'net',
      'skipped',
    ])
  })
})
