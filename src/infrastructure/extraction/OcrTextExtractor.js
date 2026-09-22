import { ExtractionError, SourceKind } from '@/application/ports/TextExtractor'

import { collectWords, composeLayout } from './layout'
import { renderPdfPages } from './pdfjs'

const LANGUAGE = 'por'

let workerPromise = null

async function getWorker(onStatus) {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js')
      return createWorker(LANGUAGE, 1, {
        logger: (message) => onStatus?.(message),
      })
    })()
  }
  return workerPromise
}

export async function terminateOcr() {
  if (!workerPromise) return
  const worker = await workerPromise
  workerPromise = null
  await worker.terminate()
}

async function recognizeAll(images, { onProgress } = {}) {
  const worker = await getWorker()
  const texts = []

  for (const [index, image] of images.entries()) {
    const { data } = await worker.recognize(
      image,
      {},
      { blocks: true, text: true },
    )
    const words = collectWords(data.blocks)
    texts.push(words.length ? composeLayout(words) : (data.text ?? ''))
    onProgress?.((index + 1) / images.length)
  }

  return texts.join('\n\n').trim()
}

export function createOcrTextExtractor() {
  return {
    supports: (file) => file.type.startsWith('image/'),

    async extract(file, { onProgress } = {}) {
      try {
        const text = await recognizeAll([file], { onProgress })
        return { text, kind: SourceKind.IMAGE }
      } catch (error) {
        throw new ExtractionError('Não foi possível ler a imagem.', error)
      }
    },

    dispose: terminateOcr,
  }
}

export async function extractScannedPdf(file, { onProgress } = {}) {
  try {
    const canvases = await renderPdfPages(file, {
      onProgress: (ratio) => onProgress?.(ratio * 0.3),
    })
    const text = await recognizeAll(canvases, {
      onProgress: (ratio) => onProgress?.(0.3 + ratio * 0.7),
    })
    for (const canvas of canvases) {
      canvas.width = 0
      canvas.height = 0
    }
    return { text, kind: SourceKind.PDF_SCAN }
  } catch (error) {
    throw new ExtractionError('Não foi possível ler o PDF digitalizado.', error)
  }
}
