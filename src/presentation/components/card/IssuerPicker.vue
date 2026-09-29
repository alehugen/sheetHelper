<script setup>
import { useI18n } from 'vue-i18n'

import BankMark from '@/presentation/components/card/BankMark.vue'
import { useCardStore } from '@/presentation/stores/card'

const MARK_SIZE = 56

const { t } = useI18n()
const card = useCardStore()
</script>

<template>
  <div>
    <p class="text-muted text-xs font-medium">{{ t('card.issuer.label') }}</p>

    <ul class="mt-4 flex flex-wrap gap-6">
      <li v-for="issuer in card.issuers" :key="issuer.id">
        <button
          type="button"
          class="issuer-mark"
          :aria-pressed="card.issuerId === issuer.id"
          :aria-label="issuer.label"
          :title="issuer.label"
          @click="card.setIssuer(issuer.id)"
        >
          <BankMark
            :issuer="issuer.id"
            :label="issuer.label"
            :size="MARK_SIZE"
          />
        </button>
      </li>
    </ul>

    <p class="text-subtle mt-5 text-xs">{{ t('card.issuer.others') }}</p>
  </div>
</template>

<style scoped>
/* O brilho sai da própria escala ink, que inverte com o tema: quase preto sobre
   fundo claro, quase branco sobre fundo escuro. O drop-shadow segue a silhueta
   do glifo em vez de desenhar um retângulo em volta. */
.issuer-mark {
  --glow: color-mix(in oklab, var(--color-ink-800) 38%, transparent);

  display: block;
  line-height: 0;
  opacity: 0.55;
  transition:
    transform 300ms var(--ease-soft),
    filter 300ms var(--ease-soft),
    opacity 300ms var(--ease-soft);
}

.issuer-mark:hover,
.issuer-mark:focus-visible {
  opacity: 1;
  transform: scale(1.1);
  filter: drop-shadow(0 0 3px var(--glow)) drop-shadow(0 0 9px var(--glow));
}

.issuer-mark[aria-pressed='true'] {
  --glow: color-mix(in oklab, var(--color-ink-800) 48%, transparent);

  opacity: 1;
  transform: scale(1.1);
  filter: drop-shadow(0 0 2px var(--glow)) drop-shadow(0 0 11px var(--glow));
}

.issuer-mark:focus-visible {
  outline: none;
}

@media (prefers-reduced-motion: reduce) {
  .issuer-mark,
  .issuer-mark:hover,
  .issuer-mark:focus-visible,
  .issuer-mark[aria-pressed='true'] {
    transform: none;
    transition:
      filter 300ms var(--ease-soft),
      opacity 300ms var(--ease-soft);
  }
}
</style>
