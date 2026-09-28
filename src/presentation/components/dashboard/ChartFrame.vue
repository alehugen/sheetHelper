<script setup>
import { onMounted, ref } from 'vue'

defineProps({
  series: { type: Array, default: () => [] },
  height: { type: Number, default: 240 },
})

const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})
</script>

<template>
  <figure class="m-0">
    <div :style="{ minHeight: `${height}px` }">
      <slot v-if="mounted" />
    </div>

    <figcaption v-if="series.length > 1" class="mt-3">
      <ul class="flex flex-wrap items-center justify-center gap-4">
        <li
          v-for="item in series"
          :key="item.label"
          class="text-body flex items-center gap-1.5 text-xs"
        >
          <span
            class="size-2.5 rounded-xs"
            :style="{ background: item.color }"
            aria-hidden="true"
          />
          {{ item.label }}
        </li>
      </ul>
    </figcaption>
  </figure>
</template>
