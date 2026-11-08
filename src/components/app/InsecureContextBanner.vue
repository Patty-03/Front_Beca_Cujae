<script setup lang="ts">
import { CircleAlertIcon } from '@lucide/vue'

const esContextoSeguro = typeof window === 'undefined' || window.isSecureContext
</script>

<template>
  <div
    v-if="!esContextoSeguro"
    role="alert"
    class="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-3 text-red-950"
  >
    <CircleAlertIcon class="mt-0.5 size-4 shrink-0" />
    <p class="text-xs leading-relaxed">
      <strong>Conexión no segura.</strong>
      La aplicación debe servirse por HTTPS. En HTTP las cookies seguras y la protección de la
      sesión no funcionan correctamente.
    </p>
  </div>
</template>
