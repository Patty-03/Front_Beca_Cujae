<script setup lang="ts">
import type { EdificioResumen } from '@/types/infraestructura'
import { computed } from 'vue'
import { EyeIcon, PencilIcon, Trash2Icon } from '@lucide/vue'
import { RouterLink } from 'vue-router'
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

const props = defineProps<{ edificios: EdificioResumen[] }>()
const auth = useAuthStore()
const puedeEscribir = computed(() => auth.can('infraestructura:write'))
const emit = defineEmits<{
  editar: [edificio: EdificioResumen]
  eliminar: [edificio: EdificioResumen]
}>()
</script>

<template>
  <div>
    <div class="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Edificio</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead class="text-center">Escaleras</TableHead>
            <TableHead class="text-center">Cuartos</TableHead>
            <TableHead class="min-w-44">Ocupación</TableHead>
            <TableHead class="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="edificio in props.edificios" :key="edificio.id">
            <TableCell class="font-medium">
              <RouterLink
                :to="`/infraestructura/edificios/${edificio.id}`"
                class="hover:text-primary transition-colors"
              >
                {{ edificio.nombre }}
              </RouterLink>
            </TableCell>
             <TableCell>
               <div class="space-y-1">
                 <EstadoConstructivoBadge :estado="edificio.estado" />
                 <p v-if="edificio.observacionEstado" class="text-xs text-muted-foreground truncate max-w-xs" :title="edificio.observacionEstado">
                   obs: {{ edificio.observacionEstado }}
                 </p>
               </div>
             </TableCell>
            <TableCell class="text-center tabular-nums">{{ edificio.escaleras }}</TableCell>
            <TableCell class="text-center tabular-nums">{{ edificio.cuartos }}</TableCell>
            <TableCell>
              <OcupacionBar
                :ocupados="edificio.ocupados"
                :capacidad="edificio.capacidad"
                :etiqueta="`Ocupación de ${edificio.nombre}`"
                compacto
              />
            </TableCell>
            <TableCell>
              <div class="flex items-center justify-end gap-1">
                <Button as-child variant="ghost" size="icon-sm">
                  <RouterLink
                    :to="`/infraestructura/edificios/${edificio.id}`"
                    :aria-label="`Ver ${edificio.nombre}`"
                  >
                    <EyeIcon />
                  </RouterLink>
                </Button>
                <Button
                  v-if="puedeEscribir"
                  variant="ghost"
                  size="icon-sm"
                  :aria-label="`Editar ${edificio.nombre}`"
                  @click="emit('editar', edificio)"
                >
                  <PencilIcon />
                </Button>
                <Button
                  v-if="puedeEscribir"
                  variant="ghost"
                  size="icon-sm"
                  class="text-destructive hover:text-destructive size-11 lg:size-8"
                  :class="{ 'cursor-not-allowed opacity-50': edificio.escaleras > 0 }"
                  :aria-disabled="edificio.escaleras > 0"
                  :title="
                    edificio.escaleras > 0
                      ? 'No se puede eliminar: tiene escaleras registradas'
                      : 'Eliminar edificio'
                  "
                  :aria-label="
                    edificio.escaleras > 0
                      ? `No se puede eliminar ${edificio.nombre}: tiene escaleras registradas`
                      : `Eliminar ${edificio.nombre}`
                  "
                  @click="emit('eliminar', edificio)"
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
      <Card v-for="edificio in props.edificios" :key="edificio.id">
        <CardContent class="space-y-3 p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <RouterLink
                :to="`/infraestructura/edificios/${edificio.id}`"
                class="font-medium hover:text-primary transition-colors"
              >
                {{ edificio.nombre }}
              </RouterLink>
              <p class="text-muted-foreground text-xs">
                {{ edificio.escaleras }} escaleras · {{ edificio.cuartos }} cuartos
              </p>
            </div>
            <EstadoConstructivoBadge :estado="edificio.estado" />
          </div>

          <OcupacionBar
            :ocupados="edificio.ocupados"
            :capacidad="edificio.capacidad"
            :etiqueta="`Ocupación de ${edificio.nombre}`"
          />

          <div class="flex items-center justify-end gap-1">
            <Button as-child variant="outline" size="sm">
              <RouterLink :to="`/infraestructura/edificios/${edificio.id}`">
                <EyeIcon />
                Ver
              </RouterLink>
            </Button>
            <Button
              v-if="puedeEscribir"
              variant="ghost"
              size="icon-sm"
              class="size-11"
              :aria-label="`Editar ${edificio.nombre}`"
              @click="emit('editar', edificio)"
            >
              <PencilIcon />
            </Button>
            <Button
              v-if="puedeEscribir"
              variant="ghost"
              size="icon-sm"
              class="text-destructive hover:text-destructive size-11"
              :class="{ 'cursor-not-allowed opacity-50': edificio.escaleras > 0 }"
              :aria-disabled="edificio.escaleras > 0"
              :aria-label="
                edificio.escaleras > 0
                  ? `No se puede eliminar ${edificio.nombre}: tiene escaleras registradas`
                  : `Eliminar ${edificio.nombre}`
              "
              @click="emit('eliminar', edificio)"
            >
              <Trash2Icon />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
