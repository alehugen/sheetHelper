import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { JobStatus, createJob, isPending } from '@/application/ReceiptJob'
import { container } from '@/container'
import { missingRequiredFields, withField } from '@/domain/receipt/Receipt'

export const useReceiptsStore = defineStore('receipts', () => {
  const jobs = ref([])
  const isRunning = ref(false)

  const readyJobs = computed(() =>
    jobs.value.filter((job) => job.status === JobStatus.READY),
  )
  const failedJobs = computed(() =>
    jobs.value.filter((job) => job.status === JobStatus.FAILED),
  )
  const pendingJobs = computed(() => jobs.value.filter(isPending))

  const rows = computed(() =>
    readyJobs.value.flatMap((job) =>
      job.entries.map((entry, index) => ({
        key: `${job.id}:${index}`,
        jobId: job.id,
        index,
        fileName: job.fileName,
        receipt: entry.receipt,
        confidence: entry.confidence,
        warnings: entry.warnings,
        sheetOverride: entry.sheetOverride ?? null,
      })),
    ),
  )

  const receipts = computed(() => rows.value.map((row) => row.receipt))

  const hasReceipts = computed(() => jobs.value.length > 0)

  const incompleteRows = computed(() =>
    rows.value.filter((row) => missingRequiredFields(row.receipt).length),
  )

  const warnedRows = computed(() =>
    rows.value.filter((row) => row.warnings.length),
  )

  const totalAmount = computed(() =>
    receipts.value.reduce(
      (sum, receipt) => sum + (Number(receipt.amount) || 0),
      0,
    ),
  )

  const overallProgress = computed(() => {
    if (!jobs.value.length) return 0
    const done = jobs.value.reduce(
      (sum, job) => sum + (isPending(job) ? job.progress : 1),
      0,
    )
    return Math.round((done / jobs.value.length) * 100)
  })

  function find(jobId) {
    return jobs.value.find((job) => job.id === jobId) ?? null
  }

  function enqueue(files) {
    const accepted = files.filter((file) =>
      container.textExtractor.supports(file),
    )
    const rejected = files.filter(
      (file) => !container.textExtractor.supports(file),
    )

    jobs.value.push(...accepted.map((file) => createJob(file)))
    return { accepted: accepted.length, rejected: rejected.map((f) => f.name) }
  }

  async function runJob(job) {
    job.status = JobStatus.PROCESSING
    job.progress = 0
    job.error = null

    try {
      const result = await container.extractReceiptsFromFile(job.file, {
        onProgress: (ratio) => {
          job.progress = Math.min(1, Math.max(0, ratio))
        },
      })
      job.entries = result.entries
      job.rawText = result.rawText
      job.status = JobStatus.READY
    } catch (error) {
      job.error = error?.message ?? 'Falha ao ler o arquivo.'
      job.status = JobStatus.FAILED
    } finally {
      job.progress = 1
    }
  }

  async function processQueue() {
    if (isRunning.value) return
    isRunning.value = true
    try {
      while (true) {
        const next = jobs.value.find((job) => job.status === JobStatus.QUEUED)
        if (!next) break
        await runJob(next)
      }
    } finally {
      isRunning.value = false
    }
  }

  async function retry(jobId) {
    const job = find(jobId)
    if (!job) return
    job.status = JobStatus.QUEUED
    await processQueue()
  }

  function updateField(jobId, index, key, value) {
    const entry = find(jobId)?.entries[index]
    if (!entry) return
    entry.receipt = withField(entry.receipt, key, value)
  }

  function setSheetOverride(jobId, index, sheetIndex) {
    const entry = find(jobId)?.entries[index]
    if (entry) entry.sheetOverride = sheetIndex
  }

  function removeRow(jobId, index) {
    const job = find(jobId)
    if (!job) return
    job.entries.splice(index, 1)
    if (!job.entries.length) removeJob(jobId)
  }

  function removeJob(jobId) {
    jobs.value = jobs.value.filter((job) => job.id !== jobId)
  }

  function reset() {
    jobs.value = []
  }

  return {
    jobs,
    isRunning,
    readyJobs,
    failedJobs,
    pendingJobs,
    rows,
    receipts,
    hasReceipts,
    incompleteRows,
    warnedRows,
    totalAmount,
    overallProgress,
    enqueue,
    processQueue,
    retry,
    updateField,
    setSheetOverride,
    removeRow,
    removeJob,
    reset,
  }
})
