<script setup lang="ts">
import type { EscaleraResumen } from '@/types/infraestructura'
import { PencilIcon, PlusIcon, Trash2Icon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import OcupacionBar from './OcupacionBar.vue'

const props = defineProps<{ escalera: EscaleraResumen }>()
const emit = defineEmits<{
  editar: [escalera: EscaleraResumen]
  eliminar: [escalera: EscaleraResumen]
  agregarCuarto: [escalera: EscaleraResumen]
}>()
</script>

<template>
  <Card class="gap-0 py-0 shadow-xs">
    <CardHeader class="gap-1 p-4 pb-3">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <CardTitle class="truncate text-base">{{ props.escalera.nombre }}</CardTitle>
          <CardDescription class="mt-1 text-xs">
            {{ props.escalera.cuartos }} cuartos · {{ props.escalera.capacidad }} plazas
          </CardDescription>
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            :aria-label="`Editar ${props.escalera.nombre}`"
            @click="emit('editar', props.escalera)"
          >
            <PencilIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            class="text-destructive hover:text-destructive"
            :disabled="props.escalera.cuartos > 0"
            :title="
              props.escalera.cuartos > 0
                ? 'No se puede eliminar: tiene cuartos registrados'
                : 'Eliminar escalera'
            "
            :aria-label="`Eliminar ${props.escalera.nombre}`"
            @click="emit('eliminar', props.escalera)"
          >
            <Trash2Icon />
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent class="space-y-3 p-4 pt-0">
      <OcupacionBar
        :ocupados="props.escalera.ocupados"
        :capacidad="props.escalera.capacidad"
      />
      <Button
        variant="outline"
        size="sm"
        class="w-full"
        @click="emit('agregarCuarto', props.escalera)"
      >
        <PlusIcon />
        Agregar cuarto
      </Button>
    </CardContent>
  </Card>
</template>
