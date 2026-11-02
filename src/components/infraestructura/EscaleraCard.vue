<script setup lang="ts">
import type { EscaleraResumen } from '@/types/infraestructura'
import { computed } from 'vue'
import { PencilIcon, PlusIcon, Trash2Icon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth'
import OcupacionBar from './OcupacionBar.vue'

const props = defineProps<{ escalera: EscaleraResumen }>()
const auth = useAuthStore()
const puedeEscribir = computed(() => auth.can('infraestructura:write'))
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
        <div v-if="puedeEscribir" class="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            class="size-11 xl:size-8"
            :aria-label="`Editar ${props.escalera.nombre}`"
            @click="emit('editar', props.escalera)"
          >
            <PencilIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            class="text-destructive hover:text-destructive size-11 xl:size-8"
            :class="{ 'cursor-not-allowed opacity-50': props.escalera.cuartos > 0 }"
            :aria-disabled="props.escalera.cuartos > 0"
            :title="
              props.escalera.cuartos > 0
                ? 'No se puede eliminar: tiene cuartos registrados'
                : 'Eliminar escalera'
            "
            :aria-label="
              props.escalera.cuartos > 0
                ? `No se puede eliminar ${props.escalera.nombre}: tiene cuartos registrados`
                : `Eliminar ${props.escalera.nombre}`
            "
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
        :etiqueta="`Ocupación de la escalera ${props.escalera.nombre}`"
      />
      <Button
        v-if="puedeEscribir"
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
