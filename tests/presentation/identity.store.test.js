// @vitest-environment happy-dom
// Precisa de DOM: a store guarda filtro e marcação no localStorage.

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { JobStatus } from '@/application/ReceiptJob'
import { parseDocument } from '@/domain/receipt/parsing'
import { useIdentityStore } from '@/presentation/stores/identity'
import { useReceiptsStore } from '@/presentation/stores/receipts'
import { DOCUMENTOS, fixtures } from '../fixtures/receipts.js'

function sessao() {
  localStorage.clear()
  setActivePinia(createPinia())
  const receipts = useReceiptsStore()
  receipts.jobs = Object.entries(fixtures).map(([fileName, texto], i) => ({
    id: `j${i}`,
    fileName,
    status: JobStatus.READY,
    progress: 1,
    entries: parseDocument(texto, { sourceFile: fileName }).entries,
  }))
  return useIdentityStore()
}

describe('store de identidade', () => {
  let identity

  beforeEach(() => {
    identity = sessao()
  })

  it('sem nada informado, o painel não está pronto', () => {
    expect(identity.isReady).toBe(false)
    expect(identity.resolvedCount).toBe(0)
  })

  it('sem filtro, mostra só as partes que aparecem mais de uma vez', () => {
    expect(identity.listedParties.length).toBeLessThan(identity.parties.length)
    expect(identity.listedParties.every((p) => p.rows > 1)).toBe(true)
  })

  describe('filtro por nome', () => {
    it('estreita a lista conforme se digita, sem nunca zerar no meio', () => {
      for (const parcial of ['A', 'AC', 'ACM', 'ACME']) {
        identity.nameFilter = parcial
        expect(identity.listedParties.length).toBeGreaterThan(0)
      }
    })

    it('acha as duas identidades da mesma empresa, inclusive a truncada do extrato', () => {
      identity.nameFilter = 'ACME'
      const rotulos = identity.listedParties.map((p) => p.label)

      expect(rotulos).toContain('ACME SOLUCOES FINANCEIRAS E')
      expect(rotulos).toContain('ACME S F D LTDA')
    })

    it('filtra, mas não marca sozinho — quem decide é a usuária', () => {
      identity.nameFilter = 'ACME'
      expect(identity.selected).toHaveLength(0)
    })

    it('marcando as duas, o sentido das linhas se resolve', () => {
      identity.nameFilter = 'ACME'
      for (const parte of identity.listedParties) identity.toggle(parte.key)

      expect(identity.isReady).toBe(true)
      expect(identity.resolvedCount).toBe(5)
      expect(identity.unresolved).toBe(2)
    })

    it('limpar o filtro não desmarca o que foi escolhido', () => {
      identity.nameFilter = 'ACME'
      for (const parte of identity.listedParties) identity.toggle(parte.key)
      identity.nameFilter = ''

      expect(identity.selected).toHaveLength(2)
    })

    it('nome inexistente esvazia a lista, em vez de mostrar qualquer coisa', () => {
      identity.nameFilter = 'EMPRESA QUE NAO EXISTE'
      expect(identity.listedParties).toHaveLength(0)
    })
  })

  describe('filtro por documento', () => {
    it('filtra já com dígitos parciais', () => {
      identity.documentFilter = '22'
      expect(identity.listedParties.length).toBeLessThan(
        identity.parties.length,
      )
    })

    it('dígito parcial filtra mas não conclui nada', () => {
      identity.documentFilter = '22.333'
      expect(identity.selected).toHaveLength(0)
    })

    it('documento completo é verificação, então marca sozinho', () => {
      identity.documentFilter = DOCUMENTOS.minhaEmpresa
      expect(identity.selected).toHaveLength(1)
      expect(identity.isReady).toBe(true)
    })

    it('reconhece o mascarado contra o documento informado', () => {
      identity.documentFilter = DOCUMENTOS.minhaEmpresa
      const niveis = identity.matchedBy.map((m) => m.level)

      expect(niveis).toContain('masked')
    })

    it('documento que não existe nos arquivos não casa com nada', () => {
      identity.documentFilter = '11.111.111/0001-11'
      expect(identity.listedParties).toHaveLength(0)
      expect(identity.isReady).toBe(false)
    })
  })

  describe('memória entre visitas', () => {
    it('guarda filtro e marcação para a próxima visita', async () => {
      identity.nameFilter = 'ACME'
      for (const parte of identity.listedParties) identity.toggle(parte.key)
      await Promise.resolve()

      setActivePinia(createPinia())
      const receipts = useReceiptsStore()
      receipts.jobs = Object.entries(fixtures).map(([fileName, texto], i) => ({
        id: `j${i}`,
        fileName,
        status: JobStatus.READY,
        progress: 1,
        entries: parseDocument(texto, { sourceFile: fileName }).entries,
      }))
      const devolta = useIdentityStore()

      expect(devolta.nameFilter).toBe('ACME')
      expect(devolta.isReady).toBe(true)
      expect(devolta.resolvedCount).toBe(5)
    })

    it('desmarcar também é lembrado', async () => {
      identity.documentFilter = DOCUMENTOS.minhaEmpresa
      const sugerida = identity.selected[0]
      identity.toggle(sugerida)
      await Promise.resolve()

      setActivePinia(createPinia())
      const receipts = useReceiptsStore()
      receipts.jobs = []
      expect(useIdentityStore().selected).toHaveLength(0)
    })
  })
})
