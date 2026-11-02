<script setup lang="ts">
import { CircleAlertIcon } from '@lucide/vue'
import { modoDemo } from '@/services/auth'
</script>

<template>
  <div
    v-if="modoDemo"
    role="status"
    class="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950"
  >
    <CircleAlertIcon class="mt-0.5 size-4 shrink-0" />
    <p class="text-xs leading-relaxed">
      <strong>Modo demo.</strong>
      No hay backend real: la sesión y los cambios viven solo en memoria y se pierden al recargar.
      No uses este modo con datos reales.
    </p>
  </div>
</template>
