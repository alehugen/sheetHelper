import { describe, expect, it } from 'vitest'

import { documentMatches, maskedMatches } from '@/domain/identity/documents'

const CNPJ = '22.333.444/0001-81'

describe('maskedMatches', () => {
  it('confirma quando os dígitos visíveis batem', () => {
    expect(maskedMatches('*****4440001**', CNPJ)).toBe(true)
  })

  it('recusa quando um dígito visível difere', () => {
    expect(maskedMatches('*****4450001**', CNPJ)).toBe(false)
  })

  it('recusa quando o comprimento não bate', () => {
    expect(maskedMatches('*****444000**', CNPJ)).toBe(false)
  })

  it('exige um mínimo de dígitos visíveis para afirmar algo', () => {
    expect(maskedMatches('************81', CNPJ)).toBe(false)
  })

  it('sem máscara, compara os dígitos direto', () => {
    expect(maskedMatches('22333444000181', CNPJ)).toBe(true)
    expect(maskedMatches('11111111000111', CNPJ)).toBe(false)
  })

  it('entrada vazia nunca confirma', () => {
    expect(maskedMatches('', CNPJ)).toBe(false)
    expect(maskedMatches('*****4440001**', '')).toBe(false)
  })
})

describe('documentMatches', () => {
  it('diz por qual via casou', () => {
    expect(documentMatches(CNPJ, [CNPJ])).toBe('document')
    expect(documentMatches('*****4440001**', [CNPJ])).toBe('masked')
  })

  it('devolve null quando nenhum documento conhecido casa', () => {
    expect(documentMatches('11.111.111/0001-11', [CNPJ])).toBeNull()
    expect(documentMatches(CNPJ, [])).toBeNull()
    expect(documentMatches(null, [CNPJ])).toBeNull()
  })
})
