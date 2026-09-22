export const JobStatus = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  READY: 'ready',
  FAILED: 'failed',
}

export function createJob(file, id = crypto.randomUUID()) {
  return {
    id,
    file,
    fileName: file.name,
    size: file.size,
    status: JobStatus.QUEUED,
    progress: 0,
    entries: [],
    rawText: null,
    error: null,
  }
}

export function isPending(job) {
  return job.status === JobStatus.QUEUED || job.status === JobStatus.PROCESSING
}
