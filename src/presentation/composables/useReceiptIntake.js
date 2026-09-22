import { useRouter } from 'vue-router'
import { ref } from 'vue'

import { useReceiptsStore } from '../stores/receipts'

export function useReceiptIntake() {
  const store = useReceiptsStore()
  const router = useRouter()
  const rejected = ref([])

  async function accept(files) {
    const result = store.enqueue(files)
    rejected.value = result.rejected

    if (!result.accepted) return

    router.push({ name: 'review' })
    await store.processQueue()
  }

  function dismissRejected() {
    rejected.value = []
  }

  return { rejected, accept, dismissRejected }
}
