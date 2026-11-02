<script setup lang="ts">
import type { CuartoResumen } from '@/types/infraestructura'
import { computed } from 'vue'
import { PencilIcon, Trash2Icon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuthStore } from '@/stores/auth'
import EstadoConstructivoBadge from './EstadoConstructivoBadge.vue'
import OcupacionBar from './OcupacionBar.vue'

const props = defineProps<{ cuartos: CuartoResumen[] }>()
const auth = useAuthStore()
const puedeEscribir = computed(() => auth.can('infraestructura:write'))
const emit = defineEmits<{
  editar: [cuarto: CuartoResumen]
  eliminar: [cuarto: CuartoResumen]
}>()
</script>

<template>
  <div>
    <div class="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cuarto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead class="text-right">Capacidad</TableHead>
            <TableHead class="min-w-40">Ocupación</TableHead>
            <TableHead class="w-24 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="cuarto in props.cuartos" :key="cuarto.id">
            <TableCell class="font-medium">{{ cuarto.nombre }}</TableCell>
            <TableCell>
              <EstadoConstructivoBadge :estado="cuarto.estado" />
            </TableCell>
            <TableCell class="text-right tabular-nums">{{ cuarto.capacidadMaxima }}</TableCell>
            <TableCell>
              <div class="flex items-center gap-3">
                <OcupacionBar
                  :ocupados="cuarto.ocupados"
                  :capacidad="cuarto.capacidadMaxima"
                  :etiqueta="`Ocupación del cuarto ${cuarto.nombre}`"
                  compacto
                  class="min-w-24 flex-1"
                />
                <span class="text-muted-foreground w-12 text-right text-xs tabular-nums">
                  {{ cuarto.ocupacionPct }}%
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div class="flex items-center justify-end gap-1">
                <Button
                  v-if="puedeEscribir"
                  variant="ghost"
                  size="icon-sm"
                  class="size-11 lg:size-8"
                  :aria-label="`Editar cuarto ${cuarto.nombre}`"
                  @click="emit('editar', cuarto)"
                >
                  <PencilIcon />
                </Button>
                <Button
                  v-if="puedeEscribir"
                  variant="ghost"
                  size="icon-sm"
                  class="text-destructive hover:text-destructive size-11 lg:size-8"
                  :class="{ 'cursor-not-allowed opacity-50': cuarto.tieneAlojamientos }"
                  :aria-disabled="cuarto.tieneAlojamientos"
                  :title="
                    cuarto.tieneAlojamientos
                      ? 'No se puede eliminar: tiene alojamientos asociados'
                      : 'Eliminar cuarto'
                  "
                  :aria-label="
                    cuarto.tieneAlojamientos
                      ? `No se puede eliminar el cuarto ${cuarto.nombre}: tiene alojamientos asociados`
                      : `Eliminar cuarto ${cuarto.nombre}`
                  "
                  @click="emit('eliminar', cuarto)"
                >
                  <Trash2Icon />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <div class="grid gap-3 md:hidden">
      <Card v-for="cuarto in props.cuartos" :key="cuarto.id">
        <CardContent class="space-y-3 p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-medium">{{ cuarto.nombre }}</p>
              <p class="text-muted-foreground text-xs">
                {{ cuarto.capacidadMaxima }} plazas · {{ cuarto.ocupados }} ocupadas ·
                {{ cuarto.ocupacionPct }}%
              </p>
            </div>
            <EstadoConstructivoBadge :estado="cuarto.estado" />
          </div>

          <OcupacionBar
            :ocupados="cuarto.ocupados"
            :capacidad="cuarto.capacidadMaxima"
            :etiqueta="`Ocupación del cuarto ${cuarto.nombre}`"
            compacto
          />

          <div class="flex items-center justify-end gap-1">
            <Button
              v-if="puedeEscribir"
              variant="outline"
              size="sm"
              @click="emit('editar', cuarto)"
            >
              <PencilIcon />
              Editar
            </Button>
            <Button
              v-if="puedeEscribir"
              variant="ghost"
              size="icon-sm"
              class="text-destructive hover:text-destructive size-11"
              :class="{ 'cursor-not-allowed opacity-50': cuarto.tieneAlojamientos }"
              :aria-disabled="cuarto.tieneAlojamientos"
              :aria-label="
                cuarto.tieneAlojamientos
                  ? `No se puede eliminar el cuarto ${cuarto.nombre}: tiene alojamientos asociados`
                  : `Eliminar cuarto ${cuarto.nombre}`
              "
              @click="emit('eliminar', cuarto)"
            >
              <Trash2Icon />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
