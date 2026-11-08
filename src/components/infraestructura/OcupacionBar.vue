<script setup lang="ts">
import { computed } from 'vue'
import { Progress } from '@/components/ui/progress'

const props = withDefaults(
  defineProps<{
    ocupados: number
    capacidad: number
    compacto?: boolean
    etiqueta?: string
  }>(),
  {
    compacto: false,
    etiqueta: 'Ocupación',
  },
)

const porcentaje = computed(() =>
  props.capacidad > 0 ? Math.round((props.ocupados / props.capacidad) * 100) : 0,
)

const porcentajeVisual = computed(() => Math.min(100, Math.max(0, porcentaje.value)))

const color = computed(() => {
  if (porcentaje.value >= 100) return '[&_[data-slot=progress-indicator]]:bg-red-700'
  if (porcentaje.value >= 90) return '[&_[data-slot=progress-indicator]]:bg-amber-700'
  return '[&_[data-slot=progress-indicator]]:bg-emerald-700'
})

const etiquetaAccesible = computed(
  () => `${props.etiqueta}: ${porcentaje.value}% (${props.ocupados} de ${props.capacidad} plazas)`,
)
</script>

<template>
  <div class="space-y-1.5">
    <Progress
      :model-value="porcentajeVisual"
      :class="color"
      :aria-label="etiquetaAccesible"
      :aria-valuetext="etiquetaAccesible"
    />
    <div
      v-if="!compacto"
      class="text-muted-foreground flex items-center justify-between gap-2 text-xs tabular-nums"
    >
      <span>{{ ocupados }} / {{ capacidad }} plazas</span>
      <span class="text-foreground font-medium">{{ porcentaje }}%</span>
    </div>
  </div>
</template>
