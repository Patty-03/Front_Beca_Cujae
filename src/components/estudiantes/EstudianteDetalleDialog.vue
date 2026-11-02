<script setup lang="ts">
import type { EstadoDeber, Estudiante } from '@/types/estudiante'
import { ref, watch } from 'vue'
import {
  BedDoubleIcon,
  CalendarIcon,
  CircleAlertIcon,
  ClipboardListIcon,
  HomeIcon,
  KeyRoundIcon,
  LoaderCircleIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
} from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ETIQUETAS_ESTADO_BECA,
  ETIQUETAS_ESTADO_DEBER,
  ETIQUETAS_SEXO,
  ETIQUETAS_TIPO_DEBER,
  ETIQUETAS_TIPO_INGRESO,
} from '@/lib/estudiantes'
import { formatDate } from '@/lib/format'
import { obtenerEstudiante } from '@/services/estudiantes'

const props = defineProps<{ estudianteId?: number | null }>()
const open = defineModel<boolean>('open', { default: false })

const detalle = ref<Estudiante | null>(null)
const cargando = ref(false)
const error = ref('')

watch(open, async (abierto) => {
  if (!abierto || !props.estudianteId) return

  detalle.value = null
  error.value = ''
  cargando.value = true

  try {
    detalle.value = await obtenerEstudiante(props.estudianteId)
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : 'No se pudo cargar la ficha del estudiante.'
  } finally {
    cargando.value = false
  }
})

function varianteEstadoBeca(estado: Estudiante['estadoBeca']) {
  if (estado === 'baja') return 'destructive' as const
  if (estado === 'condicional') return 'outline' as const
  return 'secondary' as const
}

function varianteEstadoDeber(estado: EstadoDeber) {
  if (estado === 'incumplido') return 'destructive' as const
  if (estado === 'cumplido') return 'secondary' as const
  return 'outline' as const
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>Ficha del estudiante</DialogTitle>
        <DialogDescription>
          Datos académicos, procedencia, cuarto y deberes registrados.
        </DialogDescription>
      </DialogHeader>

      <div v-if="cargando" class="grid gap-4">
        <Skeleton class="h-24 w-full" />
        <Skeleton class="h-40 w-full" />
        <Skeleton class="h-32 w-full" />
      </div>

      <Alert v-else-if="error" variant="destructive">
        <CircleAlertIcon />
        <AlertTitle>No se pudo cargar la ficha</AlertTitle>
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div v-else-if="detalle" class="grid gap-5">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex items-start gap-3">
            <div class="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-full">
              <UserIcon class="size-6" />
            </div>
            <div>
              <h2 class="text-lg font-semibold">{{ detalle.nombre }}</h2>
              <p class="text-muted-foreground text-sm">
                {{ detalle.carnet }} · {{ ETIQUETAS_SEXO[detalle.sexo] }} ·
                {{ detalle.anioAcademico }}.º año
              </p>
              <p class="text-muted-foreground text-sm">
                {{ detalle.carrera }} · {{ detalle.especialidad }}
              </p>
            </div>
          </div>
          <div class="flex flex-wrap gap-1">
            <Badge :variant="varianteEstadoBeca(detalle.estadoBeca)">
              {{ ETIQUETAS_ESTADO_BECA[detalle.estadoBeca] }}
            </Badge>
            <Badge variant="outline">{{ ETIQUETAS_TIPO_INGRESO[detalle.tipoIngreso] }}</Badge>
          </div>
        </div>

        <Separator />

        <div class="grid gap-5 sm:grid-cols-2">
          <section class="space-y-3">
            <div class="flex items-center gap-2">
              <MapPinIcon class="size-4" />
              <h3 class="text-sm font-medium">Procedencia y contacto</h3>
            </div>
            <dl class="grid gap-2 text-sm">
              <div>
                <dt class="text-muted-foreground text-xs">Provincia / municipio</dt>
                <dd>{{ detalle.provincia }} · {{ detalle.municipio }}</dd>
              </div>
              <div>
                <dt class="text-muted-foreground text-xs">Dirección particular</dt>
                <dd>{{ detalle.direccionParticular || 'No registrada' }}</dd>
              </div>
              <div>
                <dt class="text-muted-foreground text-xs">Teléfono</dt>
                <dd class="flex items-center gap-1.5">
                  <PhoneIcon class="size-3.5" />
                  {{ detalle.telefono }}
                </dd>
              </div>
              <div>
                <dt class="text-muted-foreground text-xs">Preuniversitario</dt>
                <dd>{{ detalle.preuniversitario || 'No registrado' }}</dd>
              </div>
            </dl>
          </section>

          <section class="space-y-3">
            <div class="flex items-center gap-2">
              <CalendarIcon class="size-4" />
              <h3 class="text-sm font-medium">Datos académicos</h3>
            </div>
            <dl class="grid gap-2 text-sm">
              <div>
                <dt class="text-muted-foreground text-xs">Facultad</dt>
                <dd>{{ detalle.facultad }}</dd>
              </div>
              <div>
                <dt class="text-muted-foreground text-xs">Grupo</dt>
                <dd>{{ detalle.grupo || 'No registrado' }}</dd>
              </div>
              <div>
                <dt class="text-muted-foreground text-xs">Fecha de nacimiento</dt>
                <dd>{{ formatDate(detalle.fechaNacimiento) }}</dd>
              </div>
              <div>
                <dt class="text-muted-foreground text-xs">Fecha de ingreso</dt>
                <dd>{{ formatDate(detalle.fechaIngreso) }}</dd>
              </div>
              <div>
                <dt class="text-muted-foreground text-xs">Militancia</dt>
                <dd>{{ detalle.militancia || 'No registrada' }}</dd>
              </div>
              <div>
                <dt class="text-muted-foreground text-xs">País</dt>
                <dd>{{ detalle.pais }}</dd>
              </div>
            </dl>
          </section>
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <section class="space-y-3">
            <div class="flex items-center gap-2">
              <HomeIcon class="size-4" />
              <h3 class="text-sm font-medium">Cuarto asignado</h3>
            </div>
            <div v-if="detalle.asignacion" class="bg-muted/40 grid gap-2 rounded-lg border p-3 text-sm">
              <p class="flex items-center gap-2 font-medium">
                <BedDoubleIcon class="size-4" />
                {{ detalle.asignacion.cuartoNombre }} · {{ detalle.asignacion.edificioNombre }}
              </p>
              <p class="text-muted-foreground text-xs">
                {{ detalle.asignacion.escaleraNombre }} · desde
                {{ formatDate(detalle.asignacion.desde) }}
              </p>
              <div class="flex flex-wrap gap-1">
                <Badge v-if="detalle.asignacion.taquilla" variant="outline">
                  Taquilla {{ detalle.asignacion.taquilla }}
                </Badge>
                <Badge :variant="detalle.asignacion.llaveEntregada ? 'secondary' : 'outline'">
                  <KeyRoundIcon class="size-3" />
                  Llave {{ detalle.asignacion.llaveEntregada ? 'entregada' : 'pendiente' }}
                </Badge>
                <Badge
                  :variant="detalle.asignacion.llaveTaquillaEntregada ? 'secondary' : 'outline'"
                >
                  <KeyRoundIcon class="size-3" />
                  Taquilla
                  {{ detalle.asignacion.llaveTaquillaEntregada ? 'entregada' : 'pendiente' }}
                </Badge>
              </div>
            </div>
            <Alert v-else>
              <BedDoubleIcon />
              <AlertTitle>Sin cuarto asignado</AlertTitle>
              <AlertDescription>
                El estudiante aún no tiene una asignación de cuarto activa.
              </AlertDescription>
            </Alert>
          </section>

          <section class="space-y-3">
            <div class="flex items-center gap-2">
              <UserIcon class="size-4" />
              <h3 class="text-sm font-medium">Contactos familiares</h3>
            </div>
            <dl class="grid gap-2 text-sm">
              <div>
                <dt class="text-muted-foreground text-xs">Madre</dt>
                <dd>
                  {{ detalle.madre || 'No registrada' }}
                  <span v-if="detalle.telefonoMadre" class="text-muted-foreground">
                    · {{ detalle.telefonoMadre }}
                  </span>
                </dd>
              </div>
              <div>
                <dt class="text-muted-foreground text-xs">Padre</dt>
                <dd>
                  {{ detalle.padre || 'No registrado' }}
                  <span v-if="detalle.telefonoPadre" class="text-muted-foreground">
                    · {{ detalle.telefonoPadre }}
                  </span>
                </dd>
              </div>
              <div>
                <dt class="text-muted-foreground text-xs">Padecimiento</dt>
                <dd>{{ detalle.padecimiento || 'Sin padecimientos registrados' }}</dd>
              </div>
              <div>
                <dt class="text-muted-foreground text-xs">Observaciones</dt>
                <dd>{{ detalle.observaciones || 'Sin observaciones' }}</dd>
              </div>
            </dl>
          </section>
        </div>

        <Separator />

        <section class="space-y-3">
          <div class="flex items-center gap-2">
            <ClipboardListIcon class="size-4" />
            <h3 class="text-sm font-medium">Deberes</h3>
          </div>

          <div v-if="detalle.deberes.length === 0" class="text-muted-foreground text-sm">
            No tiene deberes registrados.
          </div>

          <div v-else class="grid gap-2">
            <div
              v-for="deber in detalle.deberes"
              :key="deber.id"
              class="flex flex-col gap-2 rounded-lg border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p class="font-medium">{{ ETIQUETAS_TIPO_DEBER[deber.tipo] }}</p>
                <p class="text-muted-foreground text-xs">
                  {{ deber.descripcion }}
                </p>
                <p class="text-muted-foreground text-xs">
                  {{ formatDate(deber.fecha) }}
                  <span v-if="deber.turno"> · {{ deber.turno }}</span>
                  <span v-if="deber.cuartoNombre"> · {{ deber.cuartoNombre }}</span>
                </p>
              </div>
              <Badge :variant="varianteEstadoDeber(deber.estado)">
                {{ ETIQUETAS_ESTADO_DEBER[deber.estado] }}
              </Badge>
            </div>
          </div>
        </section>
      </div>

      <div v-else class="text-muted-foreground flex items-center gap-2 text-sm">
        <LoaderCircleIcon class="size-4 animate-spin" />
        Cargando ficha...
      </div>
    </DialogContent>
  </Dialog>
</template>
