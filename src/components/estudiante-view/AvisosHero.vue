<script setup lang="ts">
import type { Aviso } from '@/types/estudiante-view'
import { computed } from 'vue'
import { AlertTriangleIcon, CheckCircle2Icon, ClockIcon } from '@lucide/vue'
import { formatDate } from '@/lib/format'
import { ETIQUETAS_PRIORIDAD } from '@/types/estudiante-view'

const hoy = () => new Date().toISOString().slice(0, 10)

const props = defineProps<{
  avisos: Aviso[]
}>()

const iconoPorPrioridad = {
  alta: AlertTriangleIcon,
  media: ClockIcon,
  baja: CheckCircle2Icon,
}

const contenedorIconoPorPrioridad = {
  alta: 'bg-red-100 text-red-600',
  media: 'bg-blue-100 text-blue-600',
  baja: 'bg-green-100 text-green-600',
}

const clasesTarjetaPorPrioridad = {
  alta: 'border-red-200 bg-red-50 border-l-4 border-red-600 text-red-900',
  media: 'border-blue-200 bg-blue-50 border-l-4 border-blue-600 text-blue-900',
  baja: 'border-green-200 bg-green-50 border-l-4 border-green-600 text-green-900',
}

const avisosValidos = computed(() => {
  const fechaHoy = hoy()

  return props.avisos
    .filter((aviso) => aviso.fecha >= fechaHoy)
    .sort((a, b) => {
      const ordenPrioridad = {
        alta: 0,
        media: 1,
        baja: 2,
      }[a.prioridad] - { alta: 0, media: 1, baja: 2 }[b.prioridad]

      if (ordenPrioridad !== 0) return ordenPrioridad

      return b.fecha.localeCompare(a.fecha)
    })
})
</script>

<template>
  <section v-if="avisosValidos.length > 0" class="grid gap-3">
    <div
      v-for="aviso in avisosValidos"
      :key="aviso.id"
      class="flex gap-3 p-4 rounded-xl border"
      :class="clasesTarjetaPorPrioridad[aviso.prioridad]"
    >
      <div
        class="flex shrink-0 items-center justify-center rounded-lg p-1.5"
        :class="contenedorIconoPorPrioridad[aviso.prioridad]"
      >
        <component :is="iconoPorPrioridad[aviso.prioridad]" class="size-5" />
      </div>

      <div class="flex-1 min-w-0">
        <p class="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
          {{ ETIQUETAS_PRIORIDAD[aviso.prioridad] }} · {{ formatDate(aviso.fecha) }}
        </p>
        <h3 class="text-base font-semibold leading-tight">{{ aviso.titulo }}</h3>
        <p class="mt-1 text-sm text-muted-foreground leading-relaxed">{{ aviso.contenido }}</p>
      </div>
    </div>
  </section>
</template>
