import { describe, expect, it } from 'vitest'

import {
  chartTooltip,
  escapeHtml,
} from '@/presentation/components/dashboard/tooltip'

describe('escapeHtml', () => {
  it('escapa o que quebraria a marcação', () => {
    expect(escapeHtml('J & M')).toBe('J &amp; M')
    expect(escapeHtml('<b>x</b>')).toBe('&lt;b&gt;x&lt;/b&gt;')
    expect(escapeHtml('ACME "X"')).toBe('ACME &quot;X&quot;')
    expect(escapeHtml("O'BRIEN")).toBe('O&#39;BRIEN')
  })

  it('nulo vira vazio', () => {
    expect(escapeHtml(null)).toBe('')
  })
})

describe('chartTooltip', () => {
  it('nome vindo de OCR nunca vira marcação', () => {
    const html = chartTooltip({
      title: 'J & M <b>COMERCIO</b>',
      rows: [{ value: '1' }],
    })

    expect(html).not.toContain('<b>COMERCIO</b>')
    expect(html).toContain('&lt;b&gt;COMERCIO&lt;/b&gt;')
  })

  it('monta uma linha por série, com o marcador de cor', () => {
    const html = chartTooltip({
      title: 'ago/26',
      rows: [
        {
          label: 'Entradas',
          value: 'R$ 10,00',
          color: 'var(--color-chart-in)',
        },
      ],
    })

    expect(html).toContain('chart-tooltip-bullet')
    expect(html).toContain('Entradas')
    expect(html).toContain('R$ 10,00')
  })

  it('linha sem rótulo não deixa elemento vazio', () => {
    expect(chartTooltip({ title: 'x', rows: [{ value: '1' }] })).not.toContain(
      '<span></span>',
    )
  })

  it('o rodapé só aparece quando pedido', () => {
    const semRodape = chartTooltip({ title: 'x', rows: [{ value: '1' }] })
    const comRodape = chartTooltip({
      title: 'x',
      rows: [{ value: '1' }],
      footer: { label: 'Saldo', value: '2' },
    })

    expect(semRodape).not.toContain('chart-tooltip-net')
    expect(comRodape).toContain('chart-tooltip-net')
  })
})
