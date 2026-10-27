<script setup lang="ts">
import type { EstadoSolicitud } from '@/types'
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'

const props = defineProps<{ estado: EstadoSolicitud }>()

const variantes: Record<EstadoSolicitud, { label: string; class: string }> = {
  aprobada: {
    label: 'Aprobada',
    class: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
  pendiente: {
    label: 'Pendiente',
    class: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  },
  revisando: {
    label: 'En revisión',
    class: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400',
  },
  rechazada: {
    label: 'Rechazada',
    class: 'border-destructive/30 bg-destructive/10 text-destructive',
  },
}

const config = computed(() => variantes[props.estado])
</script>

<template>
  <Badge variant="outline" :class="config.class">{{ config.label }}</Badge>
</template>
