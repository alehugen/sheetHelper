import { describe, expect, it } from 'vitest'

import {
  MatchLevel,
  createProfile,
  resolveDirection,
} from '@/domain/identity/direction'
import { discoverParties } from '@/domain/identity/parties'
import { Direction } from '@/domain/shared/direction'

const CNPJ = '22.333.444/0001-81'

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

// O perfil é sempre montado a partir das partes que a usuária MARCOU como
// dela — por isso o filtro. Montar com todas as partes da linha faria os dois
// lados serem "eu" e toda transferência viraria interna.
const perfilDe = (receipts, sou, documentos = []) =>
  createProfile(
    discoverParties(receipts).filter((party) => sou.test(party.label)),
    documentos,
  )

describe('resolveDirection', () => {
  it('recebeu: sou o favorecido', () => {
    const minha = linha({
      payeeName: 'EU LTDA',
      payeeDocument: CNPJ,
      payerName: 'CLIENTE',
    })
    const { direction, via } = resolveDirection(minha, perfilDe([minha], /EU/))

    expect(direction).toBe(Direction.CREDIT)
    expect(via).toBe(MatchLevel.DOCUMENT)
  })

  it('paguei: sou o pagador', () => {
    const minha = linha({
      payerName: 'EU LTDA',
      payerDocument: CNPJ,
      payeeName: 'FORNECEDOR',
    })
    const { direction } = resolveDirection(minha, perfilDe([minha], /EU/))

    expect(direction).toBe(Direction.DEBIT)
  })

  it('dos dois lados é transferência interna', () => {
    const minha = linha({
      payerName: 'EU LTDA',
      payerDocument: CNPJ,
      payeeName: 'EU LTDA',
      payeeDocument: CNPJ,
    })
    const { direction } = resolveDirection(minha, perfilDe([minha], /EU/))

    expect(direction).toBe(Direction.INTERNAL)
  })

  it('não sou parte: fica indefinido, e isso é a resposta certa', () => {
    const alheia = linha({ payerName: 'TERCEIRO A', payeeName: 'TERCEIRO B' })
    const perfil = perfilDe(
      [linha({ payerName: 'EU LTDA', payerDocument: CNPJ })],
      /EU/,
    )
    const { direction, via } = resolveDirection(alheia, perfil)

    expect(direction).toBeNull()
    expect(via).toBeNull()
  })

  describe('a escada de confiança', () => {
    it('documento completo é o degrau mais forte', () => {
      const minha = linha({ payeeName: 'EU LTDA', payeeDocument: CNPJ })
      expect(resolveDirection(minha, perfilDe([minha], /EU/)).via).toBe(
        MatchLevel.DOCUMENT,
      )
    })

    it('mascarado vale quando confere contra o CNPJ informado', () => {
      const minha = linha({ payeeName: 'EU', payeeDocument: '*****4440001**' })
      const perfil = createProfile([], [CNPJ])
      const { direction, via } = resolveDirection(minha, perfil)

      expect(direction).toBe(Direction.CREDIT)
      expect(via).toBe(MatchLevel.MASKED)
    })

    it('conta vale quando banco e número batem', () => {
      const conhecida = linha({
        payeeName: 'EU',
        payeeBank: 'Banco do Brasil',
        payeeAccount: '1234-5 / 67890-1',
      })
      const outra = linha({
        payeeName: 'EU',
        payeeBank: 'BCO DO BRASIL S.A',
        payeeAccount: '1234-5 / 67890-1',
        payerName: 'CLIENTE',
      })
      const { via } = resolveDirection(
        outra,
        perfilDe([conhecida], /EU|EMPRESA/),
      )

      expect(via).toBe(MatchLevel.ACCOUNT)
    })

    it('nome é o último recurso', () => {
      const conhecida = linha({ payeeName: 'EMPRESA EXEMPLO LTDA' })
      const outra = linha({
        payeeName: 'EMPRESA EXEMPLO LTDA',
        payerName: 'CLIENTE',
      })
      const { via } = resolveDirection(
        outra,
        perfilDe([conhecida], /EU|EMPRESA/),
      )

      expect(via).toBe(MatchLevel.NAME)
    })
  })
})

describe('createProfile', () => {
  it('junta documentos das partes marcadas com os informados à mão', () => {
    const perfil = createProfile(
      discoverParties([linha({ payerName: 'EU', payerDocument: CNPJ })]),
      ['11.222.333/0001-81'],
    )

    expect(perfil.documents).toHaveLength(2)
  })

  it('perfil vazio não resolve nada', () => {
    const perfil = createProfile([], [])
    expect(
      resolveDirection(linha({ payerDocument: CNPJ }), perfil).direction,
    ).toBeNull()
  })
})
