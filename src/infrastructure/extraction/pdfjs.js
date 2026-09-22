let pdfjsPromise = null

export function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import('pdfjs-dist')
      const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default
      return pdfjs
    })()
  }
  return pdfjsPromise
}

export async function renderPdfPages(file, { scale = 2.5, onProgress } = {}) {
  const pdfjs = await loadPdfjs()
  const data = new Uint8Array(await file.arrayBuffer())
  const doc = await pdfjs.getDocument({ data, isEvalSupported: false }).promise

  try {
    const canvases = []
    for (let index = 1; index <= doc.numPages; index += 1) {
      const page = await doc.getPage(index)
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)

      await page.render({ canvas, viewport }).promise
      page.cleanup()

      canvases.push(canvas)
      onProgress?.(index / doc.numPages)
    }
    return canvases
  } finally {
    await doc.destroy()
  }
}
