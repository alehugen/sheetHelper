import { describe, expect, it } from 'vitest'

import {
  accountKey,
  discoverParties,
  matchesNameQuery,
  sameName,
} from '@/domain/identity/parties'

const linha = (campos) => ({
  date: '2026-08-14',
  amount: 100,
  payerName: null,
  payerDocument: null,
  payerBank: null,
  payerAccount: null,
  payeeName: null,
  payeeDocument: null,
  payeeBank: null,
  payeeAccount: null,
  ...campos,
})

describe('matchesNameQuery', () => {
  const nomes = ['ACME SOLUCOES FINANCEIRAS E']

  it('casa desde a primeira letra, para servir de filtro ao vivo', () => {
    for (const parcial of ['A', 'AC', 'ACM', 'ACME']) {
      expect(matchesNameQuery(nomes, parcial)).toBe(true)
    }
  })

  it('casa palavra no meio do nome', () => {
    expect(matchesNameQuery(nomes, 'solucoes')).toBe(true)
  })

  it('ignora acento e caixa', () => {
    expect(matchesNameQuery(['SOLUÇÕES LTDA'], 'solucoes')).toBe(true)
  })

  it('não casa o que não é início de palavra', () => {
    expect(matchesNameQuery(nomes, 'OLUCOES')).toBe(false)
  })

  it('consulta vazia não casa nada', () => {
    expect(matchesNameQuery(nomes, '')).toBe(false)
    expect(matchesNameQuery(nomes, '   ')).toBe(false)
  })
})

describe('sameName', () => {
  it('usa limiar conservador: prefixo curto não funde empresas', () => {
    expect(sameName('ACME S F D LTDA', 'ACME SOLUCOES FINANCEIRAS')).toBe(false)
  })

  it('casa quando o prefixo comum é longo', () => {
    expect(sameName('ACME SOLUCOES', 'ACME SOLUCOES FINANCEIRAS E')).toBe(true)
  })
})

describe('accountKey', () => {
  it('normaliza o banco e mantém os dígitos da conta', () => {
    expect(accountKey('BCO DO BRASIL S.A', '1234-5 / 67890-1')).toBe(
      accountKey('Banco do Brasil', '1234-5 / 67890-1'),
    )
  })

  it('devolve null sem banco ou sem conta', () => {
    expect(accountKey(null, '67890-1')).toBeNull()
    expect(accountKey('Banco do Brasil', null)).toBeNull()
  })
})

describe('discoverParties', () => {
  it('agrupa os dois lados de várias linhas na mesma parte pelo documento', () => {
    const partes = discoverParties([
      linha({ payerName: 'ACME LTDA', payerDocument: '22.333.444/0001-81' }),
      linha({ payeeName: 'ACME LTDA', payeeDocument: '22333444000181' }),
    ])

    const acme = partes.find((p) => p.label === 'ACME LTDA')
    expect(acme.rows).toBe(2)
    expect(acme.asPayer).toBe(1)
    expect(acme.asPayee).toBe(1)
  })

  it('agrupa pela conta quando não há documento', () => {
    const partes = discoverParties([
      linha({
        payeeName: 'X',
        payeeBank: 'Banco do Brasil',
        payeeAccount: '1234-5 / 67890-1',
      }),
      linha({
        payeeName: 'Y',
        payeeBank: 'BCO DO BRASIL S.A',
        payeeAccount: '1234-5 / 67890-1',
      }),
    ])

    expect(partes).toHaveLength(1)
    expect(partes[0].rows).toBe(2)
  })

  it('não funde nomes parecidos sem documento nem conta em comum', () => {
    const partes = discoverParties([
      linha({ payerName: 'ACME S F D LTDA' }),
      linha({ payerName: 'ACME SOLUCOES FINANCEIRAS E' }),
    ])

    expect(partes).toHaveLength(2)
  })

  it('guarda o mascarado junto do documento completo', () => {
    const partes = discoverParties([
      linha({ payerName: 'ACME', payerDocument: '22.333.444/0001-81' }),
      linha({ payerName: 'ACME', payerDocument: '*****4440001**' }),
    ])

    const acme = partes[0]
    expect(acme.documents).toContain('22.333.444/0001-81')
    expect(acme.maskedDocuments).toHaveLength(1)
  })

  it('a chave é estável: sai da identidade, não da ordem de descoberta', () => {
    const comDocumento = discoverParties([
      linha({ payerName: 'A', payerDocument: '22.333.444/0001-81' }),
    ])
    const comConta = discoverParties([
      linha({
        payerName: 'B',
        payerBank: 'Banco do Brasil',
        payerAccount: '67890-1',
      }),
    ])
    const soNome = discoverParties([linha({ payerName: 'SO NOME LTDA' })])

    expect(comDocumento[0].key).toBe('d:22333444000181')
    expect(comConta[0].key).toMatch(/^a:/)
    expect(soNome[0].key).toBe('n:so nome ltda')
  })

  it('a chave sobrevive a linhas novas chegando antes', () => {
    const antes = discoverParties([
      linha({ payerName: 'A', payerDocument: '22.333.444/0001-81' }),
    ])
    const depois = discoverParties([
      linha({ payerName: 'OUTRA', payerDocument: '11.222.333/0001-81' }),
      linha({ payerName: 'A', payerDocument: '22.333.444/0001-81' }),
    ])

    expect(depois.map((p) => p.key)).toContain(antes[0].key)
  })

  it('ordena pela quantidade de linhas', () => {
    const partes = discoverParties([
      linha({ payerName: 'UMA VEZ SO' }),
      linha({ payerName: 'DUAS VEZES' }),
      linha({ payerName: 'DUAS VEZES' }),
    ])

    expect(partes[0].label).toBe('DUAS VEZES')
  })

  it('lista vazia não quebra', () => {
    expect(discoverParties([])).toEqual([])
  })
})
