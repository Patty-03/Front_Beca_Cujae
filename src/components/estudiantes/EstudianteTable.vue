<script setup lang="ts">
import type { EstadoBeca, EstudianteResumen } from '@/types/estudiante'
import { computed } from 'vue'
import { BedDoubleIcon, ClipboardListIcon, EyeIcon, PencilIcon, Trash2Icon } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { Badge } from '@/components/ui/badge'
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
import { ETIQUETAS_ESTADO_BECA, ETIQUETAS_TIPO_INGRESO } from '@/lib/estudiantes'

const props = defineProps<{
  estudiantes: EstudianteResumen[]
  puedeAsignar: boolean
}>()

const auth = useAuthStore()
const puedeEscribir = computed(() => auth.can('estudiantes:write'))

const emit = defineEmits<{
  ver: [estudiante: EstudianteResumen]
  asignar: [estudiante: EstudianteResumen]
  editar: [estudiante: EstudianteResumen]
  eliminar: [estudiante: EstudianteResumen]
}>()

function varianteEstado(estado: EstadoBeca): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (estado === 'baja') return 'destructive'
  if (estado === 'condicional') return 'outline'
  return 'secondary'
}

function puedeAsignarA(estudiante: EstudianteResumen): boolean {
  return props.puedeAsignar && estudiante.estadoBeca !== 'baja'
}
</script>

<template>
  <div>
    <div class="hidden lg:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Estudiante</TableHead>
            <TableHead>Procedencia</TableHead>
            <TableHead>Carrera</TableHead>
            <TableHead>Beca</TableHead>
            <TableHead>Cuarto</TableHead>
            <TableHead>Deberes</TableHead>
            <TableHead class="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="estudiante in props.estudiantes" :key="estudiante.id">
            <TableCell>
              <div class="min-w-0">
                <p class="font-medium">{{ estudiante.nombre }}</p>
                <p class="text-muted-foreground text-xs">{{ estudiante.carnet }}</p>
              </div>
            </TableCell>
            <TableCell>
              <p>{{ estudiante.provincia }}</p>
              <p class="text-muted-foreground text-xs">{{ estudiante.municipio }}</p>
            </TableCell>
            <TableCell>
              <p class="max-w-52 truncate">{{ estudiante.carrera }}</p>
              <p class="text-muted-foreground text-xs">
                {{ estudiante.anioAcademico }}.º año
                <span v-if="estudiante.grupo"> · {{ estudiante.grupo }}</span>
              </p>
            </TableCell>
            <TableCell>
              <div class="space-y-1">
                <Badge :variant="varianteEstado(estudiante.estadoBeca)">
                  {{ ETIQUETAS_ESTADO_BECA[estudiante.estadoBeca] }}
                </Badge>
                <p class="text-muted-foreground text-xs">
                  {{ ETIQUETAS_TIPO_INGRESO[estudiante.tipoIngreso] }}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <div v-if="estudiante.asignacion">
                <p class="font-medium">{{ estudiante.asignacion.cuartoNombre }}</p>
                <p class="text-muted-foreground text-xs">
                  {{ estudiante.asignacion.edificioNombre }}
                </p>
              </div>
              <Badge v-else variant="outline">Sin cuarto</Badge>
            </TableCell>
            <TableCell>
              <div class="flex flex-wrap gap-1">
                <Badge v-if="estudiante.deberesPendientes" variant="outline">
                  <ClipboardListIcon />
                  {{ estudiante.deberesPendientes }} pendientes
                </Badge>
                <Badge v-if="estudiante.deberesIncumplidos" variant="destructive">
                  {{ estudiante.deberesIncumplidos }} incumplidos
                </Badge>
                <span
                  v-if="!estudiante.deberesPendientes && !estudiante.deberesIncumplidos"
                  class="text-muted-foreground text-xs"
                >
                  Sin deberes activos
                </span>
              </div>
            </TableCell>
             <TableCell>
               <div class="flex items-center justify-end gap-1">
                 <Button
                   variant="ghost"
                   size="icon-sm"
                   :aria-label="`Ver ${estudiante.nombre}`"
                   @click="emit('ver', estudiante)"
                 >
                   <EyeIcon />
                 </Button>
                 <Button
                   v-if="puedeEscribir"
                   variant="ghost"
                   size="icon-sm"
                   :aria-label="`Editar ${estudiante.nombre}`"
                   @click="emit('editar', estudiante)"
                 >
                   <PencilIcon />
                 </Button>
                 <Button
                   v-if="puedeEscribir"
                   variant="ghost"
                   size="icon-sm"
                   class="text-destructive hover:text-destructive"
                   :aria-label="`Eliminar ${estudiante.nombre}`"
                   @click="emit('eliminar', estudiante)"
                 >
                   <Trash2Icon />
                 </Button>
                 <Button
                   v-if="puedeAsignarA(estudiante)"
                   variant="outline"
                   size="sm"
                   @click="emit('asignar', estudiante)"
                 >
                   <BedDoubleIcon />
                   {{ estudiante.asignacion ? 'Cambiar' : 'Asignar' }}
                 </Button>
               </div>
             </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <div class="grid gap-3 lg:hidden">
      <Card v-for="estudiante in props.estudiantes" :key="estudiante.id">
        <CardContent class="space-y-4 p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-medium">{{ estudiante.nombre }}</p>
              <p class="text-muted-foreground text-xs">
                {{ estudiante.carnet }} · {{ estudiante.provincia }}
              </p>
            </div>
            <Badge :variant="varianteEstado(estudiante.estadoBeca)">
              {{ ETIQUETAS_ESTADO_BECA[estudiante.estadoBeca] }}
            </Badge>
          </div>

          <div class="grid gap-2 text-sm">
            <p class="truncate">{{ estudiante.carrera }}</p>
            <p class="text-muted-foreground text-xs">
              {{ estudiante.anioAcademico }}.º año
              <span v-if="estudiante.grupo"> · {{ estudiante.grupo }}</span>
            </p>
            <p v-if="estudiante.asignacion" class="flex items-center gap-1.5">
              <BedDoubleIcon class="size-4" />
              {{ estudiante.asignacion.cuartoNombre }} ·
              {{ estudiante.asignacion.edificioNombre }}
            </p>
            <Badge v-else variant="outline" class="w-fit">Sin cuarto</Badge>
            <div class="flex flex-wrap gap-1">
              <Badge v-if="estudiante.deberesPendientes" variant="outline">
                {{ estudiante.deberesPendientes }} deberes pendientes
              </Badge>
              <Badge v-if="estudiante.deberesIncumplidos" variant="destructive">
                {{ estudiante.deberesIncumplidos }} incumplidos
              </Badge>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" @click="emit('ver', estudiante)">
              <EyeIcon />
              Ver
            </Button>
            <Button
              v-if="puedeEscribir"
              variant="ghost"
              size="icon-sm"
              class="size-9"
              :aria-label="`Editar ${estudiante.nombre}`"
              @click="emit('editar', estudiante)"
            >
              <PencilIcon />
            </Button>
            <Button
              v-if="puedeEscribir"
              variant="ghost"
              size="icon-sm"
              class="text-destructive hover:text-destructive size-9"
              :aria-label="`Eliminar ${estudiante.nombre}`"
              @click="emit('eliminar', estudiante)"
            >
              <Trash2Icon />
            </Button>
            <Button
              v-if="puedeAsignarA(estudiante)"
              size="sm"
              @click="emit('asignar', estudiante)"
            >
              <BedDoubleIcon />
              {{ estudiante.asignacion ? 'Cambiar' : 'Asignar' }}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
