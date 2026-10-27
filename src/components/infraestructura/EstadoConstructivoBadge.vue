<script setup lang="ts">
import type { EstadoConstructivo } from '@/types/infraestructura'
import { Badge } from '@/components/ui/badge'
import { clasesEstadoConstructivo } from '@/lib/estadoConstructivo'

const props = defineProps<{
  estado: EstadoConstructivo
  class?: string
}>()
</script>

<template>
  <Badge variant="outline" :class="[clasesEstadoConstructivo(estado.nombre), props.class]">
    <span class="size-1.5 rounded-full bg-current" aria-hidden="true" />
    {{ estado.nombre }}
  </Badge>
</template>
