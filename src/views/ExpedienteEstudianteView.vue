<script setup lang="ts">
import type {
  CrearEvaluacionInput,
  Evaluacion,
  ExpedienteEstudiante,
  HistorialAlojamiento,
} from '@/types/expediente'
import { computed, onMounted, ref, watch } from 'vue'
import {
  AlertCircleIcon,
  CalendarIcon,
  ClipboardListIcon,
  HomeIcon,
  LoaderCircleIcon,
  PlusIcon,
  Trash2Icon,
  UserIcon,
  ViewIcon,
} from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ETIQUETAS_ESTADO_BECA,
  ETIQUETAS_SEXO,
  ETIQUETAS_TIPO_INGRESO,
  ETIQUETAS_TIPO_DEBER,
} from '@/lib/estudiantes'
import { ETIQUETAS_ESTADO_MEDIO, ETIQUETAS_TIPO_MEDIO, TIPOS_MEDIO } from '@/lib/inventario'
import { formatDate } from '@/lib/format'
import {
  crearEvaluacion,
  obtenerEvaluaciones,
  obtenerExpediente,
  obtenerHistorialAlojamiento,
} from '@/services/expediente'

const props = defineProps<{ estudianteId?: number | null }>()
const open = defineModel<boolean>('open', { default: false })

const detalle = ref<ExpedienteEstudiante | null>(null)
const cargando = ref(false)
const error = ref('')
const tabActivo = ref<'datos' | 'evaluaciones' | 'historial'>('datos')

// Evaluaciones
const nuevaEvaluacion = ref<CrearEvaluacionInput>({
  estudiante_id: 0,
  tipo_evaluacion: 'academica',
  resultado: '',
  fecha: '',
})
const evaluacionDialogo = ref(false)

const tipoEvaluaciones = [
  { valor: 'academica', etiqueta: 'Académica' },
  { valor: 'disciplinaria', etiqueta: 'Disciplinaria' },
  { valor: 'social', etiqueta: 'Social' },
  { valor: 'otra', etiqueta: 'Otra' },
]

const detalleEstudiante = computed(() => detalle.value)

const cargandoEvaluacion = ref(false)

async function cargarExpediente() {
  if (!props.estudianteId) return

  cargando.value = true
  error.value = ''
  detalle.value = null

  try {
    const [expediente, evaluaciones, historial] = await Promise.all([
      obtenerExpediente(props.estudianteId),
      obtenerEvaluaciones(props.estudianteId),
      obtenerHistorialAlojamiento(props.estudianteId),
    ])

    detalle.value = {
      ...expediente,
      evaluaciones,
      historial_alojamiento: historial,
    }
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'No se pudo cargar el expediente.'
  } finally {
    cargando.value = false
  }
}

async function crearNuevaEvaluacion() {
  if (!nuevaEvaluacion.value.estudiante_id) return

  cargandoEvaluacion.value = true
  error.value = ''

  try {
    const creada = await crearEvaluacion({
      ...nuevaEvaluacion,
      estudiante_id: nuevaEvaluacion.value.estudiante_id,
    })

    if (detalle.value) {
      detalle.value.evaluaciones = [creada, ...detalle.value.evaluaciones]
    }

    evaluacionDialogo.value = false
    nuevaEvaluacion.value = {
      estudiante_id: props.estudianteId ?? 0,
      tipo_evaluacion: 'academica',
      resultado: '',
      fecha: '',
    }

    toast.success('Evaluación registrada correctamente')
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : 'No se pudo crear la evaluación.'
  } finally {
    cargandoEvaluacion.value = false
  }
}

function abrirNuevaEvaluacion() {
  if (!props.estudianteId) return

  nuevaEvaluacion.value = {
    estudiante_id: props.estudianteId,
    tipo_evaluacion: 'academica',
    resultado: '',
    fecha: new Date().toISOString().slice(0, 10),
  }
  evaluacionDialogo.value = true
}

const evaluacionesFiltradas = computed(() => {
  if (!detalle.value) return []
  return detalle.value.evaluaciones
})

const historialPorAnio = computed(() => {
  if (!detalle.value?.historial_alojamiento) return []

  const porAnio = new Map<number, HistorialAlojamiento[]>()

  for (const cuarto of detalle.value.historial_alojamiento) {
    const anio = new Date(cuarto.desde).getFullYear()
    if (!porAnio.has(anio)) {
      porAnio.set(anio, [])
    }
    porAnio.get(anio)!.push(cuarto)
  }

  return Array.from(porAnio.entries()).sort(([a], [b]) => b - a)
})

watch(
  [props.estudianteId, open],
  ([estudianteId, abierto]) => {
    if (abierto && estudianteId) {
      cargarExpediente()
    }
  },
  { immediate: true }
)
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-5xl lg:max-w-7xl xl:max-w-9xl">
      <DialogHeader>
        <DialogTitle v-if="detalle">{{ detalle.nombre }}</DialogTitle>
        <DialogDescription v-if="detalle">
          {{ detalle.carnet }} · {{ detalle.carrera }} · {{ detalle.especialidad.nombre }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="cargando" class="grid gap-4 p-8">
        <Skeleton class="h-24 w-full" />
        <Skeleton class="h-40 w-full" />
        <Skeleton class="h-96 w-full" />
      </div>

      <Alert v-else-if="error" variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>No se pudo cargar el expediente</AlertTitle>
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div v-else-if="detalle" class="space-y-6">
        <!-- Información personal -->
        <Card class="rounded-xl border p-6">
          <CardHeader>
            <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Datos Personales</CardTitle>
                <CardDescription>Información personal y académica del estudiante.</CardDescription>
              </div>
              <Badge :variant="varianteEstadoBeca(detalle.estadoBeca)">
                {{ ETIQUETAS_ESTADO_BECA[detalle.estadoBeca] }}
              </Badge>
            </div>
          </CardHeader>
          <CardContent class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div class="bg-muted/50 rounded-lg border p-4">
              <p class="text-muted-foreground text-xs uppercase tracking-wider">Nombre completo</p>
              <p class="mt-1 font-medium">{{ detalle.nombre }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg border p-4">
              <p class="text-muted-foreground text-xs uppercase tracking-wider">Carné</p>
              <p class="mt-1 text-sm">{{ detalle.carnet_de_identidad }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg border p-4">
              <p class="text-muted-foreground text-xs uppercase tracking-wider">Pasaporte</p>
              <p class="mt-1 text-sm">{{ detalle.pasaporte || 'No registrado' }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg border p-4">
              <p class="text-muted-foreground text-xs uppercase tracking-wider">Sexo</p>
              <p class="mt-1 text-sm">{{ ETIQUETAS_SEXO[detalle.sexo.nombre] }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg border p-4">
              <p class="text-muted-foreground text-xs uppercase tracking-wider">País</p>
              <p class="mt-1 text-sm">{{ detalle.pais.nombre }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg border p-4">
              <p class="text-muted-foreground text-xs uppercase tracking-wider">Municipio</p>
              <p class="mt-1 text-sm">{{ detalle.municipio?.nombre || 'No registrado' }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg border p-4">
              <p class="text-muted-foreground text-xs uppercase tracking-wider">Teléfono</p>
              <p class="mt-1 text-sm">{{ detalle.telefono || 'No registrado' }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg border p-4">
              <p class="text-muted-foreground text-xs uppercase tracking-wider">Fecha de nacimiento</p>
              <p class="mt-1 text-sm">{{ formatDate(detalle.fecha_nacimiento) }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg border p-4">
              <p class="text-muted-foreground text-xs uppercase tracking-wider">Fecha de ingreso</p>
              <p class="mt-1 text-sm">{{ formatDate(detalle.fecha_de_ingreso) }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg border p-4">
              <p class="text-muted-foreground text-xs uppercase tracking-wider">Tipo de ingreso</p>
              <p class="mt-1 text-sm">{{ detalle.tipo_ingreso?.nombre || 'No registrado' }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg border p-4">
              <p class="text-muted-foreground text-xs uppercase tracking-wider">Padecimiento</p>
              <p class="mt-1 text-sm">{{ detalle.padecimiento || 'Sin padecimientos registrados' }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg border p-4">
              <p class="text-muted-foreground text-xs uppercase tracking-wider">Observaciones</p>
              <p class="mt-1 text-sm">{{ detalle.observaciones || 'Sin observaciones' }}</p>
            </div>
        </CardContent>
        </Card>

        <Tabs v-model="tabActivo" class="space-y-4">
          <TabsList class="w-full gap-1 overflow-x-auto rounded-none border-b bg-transparent p-0!">
            <TabsTrigger value="datos" class="flex-none! gap-2 px-3">
              <UsersIcon />
              Datos Personales
            </TabsTrigger>
            <TabsTrigger value="evaluaciones" class="flex-none! gap-2 px-3">
              <ClipboardListIcon />
              Evaluaciones
              <span
                class="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums"
              >
                {{ detalle.evaluaciones.length }}
              </span>
            </TabsTrigger>
            <TabsTrigger value="historial" class="flex-none! gap-2 px-3">
              <HomeIcon />
              Historial de Cuartos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="datos" class="space-y-4">
            <!-- Ya mostrado arriba -->
          </TabsContent>

          <TabsContent value="evaluaciones" class="space-y-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="min-w-0">
                <h2 class="text-base font-semibold">Evaluaciones</h2>
                <p class="text-muted-foreground text-sm">
                  Historial de evaluaciones realizadas al estudiante.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                class="justify-start"
                @click="abrirNuevaEvaluacion"
              >
                <PlusIcon />
                Nueva Evaluación
              </Button>
            </div>

            <div class="bg-card rounded-xl border p-3">
              <div v-if="evaluacionesFiltradas.length === 0" class="flex flex-col items-center gap-3 py-12 text-center">
                <ClipboardListIcon class="text-muted-foreground size-5" />
                <p class="font-medium">No hay evaluaciones registradas</p>
                <p class="text-muted-foreground text-sm">Comience registrando la primera evaluación.</p>
              </div>

              <div v-else class="divide-y divide-muted">
                <div
                  v-for="evaluacion in evaluacionesFiltradas"
                  :key="evaluacion.id"
                  class="bg-card rounded-lg border p-3 space-y-2"
                >
                  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div class="space-y-1">
                      <p class="font-medium text-sm">{{ ETIQUETAS_TIPO_DEBER[evaluacion.tipo_evaluacion] }}</p>
                      <p class="text-muted-foreground text-xs">{{ formatDate(evaluacion.fecha) }}</p>
                    </div>
                    <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <Badge :variant="varianteEstadoDeber(evaluacion.estado)">
                        {{ ETIQUETAS_ESTADO_DEBER[evaluacion.estado] }}
                      </Badge>
                    </div>
                  </div>
                  <p class="mt-2 text-sm text-muted-foreground">{{ evaluacion.resultado }}</p>
                  <p class="text-xs text-muted-foreground mt-1">
                    Registrado por: {{ evaluacion.resuelto_por_nombre || 'Desconocido' }}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="historial" class="space-y-4">
            <div class="space-y-4">
              <h2 class="text-base font-semibold">Historial de Cuartos</h2>
              <p class="text-muted-foreground text-sm">
                Historial de asignaciones de cuartos por año académico.
              </p>
            </div>

            <div v-if="historialPorAnio.length === 0" class="flex flex-col items-center gap-3 py-12 text-center">
              <HomeIcon class="text-muted-foreground size-5" />
              <p class="font-medium">No hay historial de cuartos</p>
              <p class="text-muted-foreground text-sm">El estudiante no tiene asignaciones registradas.</p>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="[anio, cuartos] in historialPorAnio"
                :key="anio"
                class="bg-card rounded-xl border p-4"
              >
                <h3 class="text-lg font-semibold mb-3">{{ anio }}</h3>
                <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div
                    v-for="cuarto in cuartos"
                    :key="cuarto.id"
                    class="bg-muted/50 rounded-lg border p-3"
                  >
                    <p class="font-medium text-sm">{{ cuarto.nombre }}</p>
                    <p class="text-muted-foreground text-xs">
                      {{ cuarto.escalera_nombre }} · {{ cuarto.edificio_nombre }}
                    </p>
                    <p class="text-muted-foreground text-xs mt-1">
                      Desde {{ formatDate(cuarto.desde) }}
                      {{ cuarto.hasta ? ' hasta ' + formatDate(cuarto.hasta) : '' }}
                    </p>
                    <p class="text-xs text-muted-foreground mt-1">
                      {{ ETIQUETAS_ESTADO_MEDIO[cuarto.estado_constructivo_nombre] }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DialogContent>
  </Dialog>

    <!-- Dialogo Nueva Evaluación -->
    <Dialog v-model:open="evaluacionDialogo">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Evaluación</DialogTitle>
          <DialogDescription>Registre una evaluación para {{ detalle?.nombre }}</DialogDescription>
        </DialogHeader>
        <form @submit.prevent="crearNuevaEvaluacion" class="space-y-4 py-2">
          <div class="space-y-2">
            <Label>Tipo de Evaluación</Label>
            <Select v-model="nuevaEvaluacion.tipo_evaluacion">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Seleccione un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="tipo in tipoEvaluaciones"
                  :key="tipo.valor"
                  :value="tipo.valor"
                >
                  {{ tipo.etiqueta }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label>Fecha</Label>
            <Input type="date" v-model="nuevaEvaluacion.fecha" />
          </div>

          <div class="space-y-2">
            <Label>Resultado</Label>
            <textarea
              v-model="nuevaEvaluacion.resultado"
              rows="4"
              class="w-full border border-input bg-input rounded-md p-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
            ></textarea>
          </div>

          <div class="text-muted-foreground text-sm">
            {{ nuevaEvaluacion.resultado.length }} / 1000 caracteres
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" @click="evaluacionDialogo = false">
            Cancelar
          </Button>
          <Button type="submit" :disabled="cargandoEvaluacion" form>
            {{ cargandoEvaluacion ? 'Guardando...' : 'Guardar Evaluación' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
</template>
