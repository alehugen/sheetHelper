const ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ESCAPES[char])
}

function row({ label, value, color }) {
  const bullet = color
    ? `<span class="chart-tooltip-bullet" style="background:${escapeHtml(color)}"></span>`
    : ''
  const name = label ? `<span>${escapeHtml(label)}</span>` : ''
  return `<p>${bullet}${name}<b>${escapeHtml(value)}</b></p>`
}

export function chartTooltip({ title, rows, footer }) {
  const total = footer
    ? `<div class="chart-tooltip-net">${row(footer)}</div>`
    : ''
  return `<div class="chart-tooltip">
    <p class="chart-tooltip-title">${escapeHtml(title)}</p>
    ${rows.map(row).join('')}
    ${total}
  </div>`
}
