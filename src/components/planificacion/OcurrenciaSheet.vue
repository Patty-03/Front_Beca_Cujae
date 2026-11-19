<script setup lang="ts">
import type {
  AsignacionLeer,
  EstadoCumplimiento,
  OcurrenciaLeer,
  PeriodoLeer,
} from '@/types/planificacion'
import type { EstudianteResumen } from '@/types/estudiante'
import { computed, ref, watch } from 'vue'
import {
  AlertCircleIcon,
  CheckIcon,
  LoaderCircleIcon,
  LockIcon,
  LockOpenIcon,
  RotateCcwIcon,
  SearchIcon,
  Trash2Icon,
  UserPlusIcon,
  XIcon,
} from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import ConfirmDialog from '@/components/infraestructura/ConfirmDialog.vue'
import RecuperacionDialog from './RecuperacionDialog.vue'
import {
  actualizarAsignacion,
  asignarManual,
  cancelarOcurrencia,
  listarAsignaciones,
  quitarAsignacion,
  reactivarOcurrencia,
  registrarCumplimiento,
} from '@/services/planificacion'
import { obtenerEstudiantes } from '@/services/estudiantes'
import { formatDate } from '@/lib/format'
import {
  etiquetaEstadoAsignacion,
  estadosPermitidos,
  hoyIso,
  varianteEstadoAsignacion,
} from '@/lib/planificacion'
import { toast } from 'vue-sonner'

const props = defineProps<{ ocurrencia: OcurrenciaLeer | null; periodo: PeriodoLeer }>()
const emit = defineEmits<{ actualizado: [] }>()
const open = defineModel<boolean>('open', { default: false })

const asignaciones = ref<AsignacionLeer[]>([])
const cargando = ref(false)
const error = ref('')

const estados = ref<Record<number, EstadoCumplimiento>>({})
const guardandoCumplimiento = ref(false)

const busqueda = ref('')
const resultados = ref<EstudianteResumen[]>([])
const buscando = ref(false)
const estudianteSeleccionado = ref<EstudianteResumen | null>(null)
const bloqueada = ref(true)
const asignando = ref(false)

const quitarTarget = ref<AsignacionLeer | null>(null)
const quitando = ref(false)
const recuperacionTarget = ref<AsignacionLeer | null>(null)
const recuperacionAbierta = ref(false)

const cancelarAbierto = ref(false)
const motivoCancelacion = ref('')
const cancelando = ref(false)

let temporizador: ReturnType<typeof setTimeout> | null = null

const cerrado = computed(() => props.periodo.estado === 'CERRADO')
const esFutura = computed(() => (props.ocurrencia?.fecha ?? '') > hoyIso())
const bajoCupo = computed(() => {
  const ocurrencia = props.ocurrencia
  return (
    !!ocurrencia &&
    ocurrencia.cantPersonas != null &&
    ocurrencia.asignados < ocurrencia.cantPersonas
  )
})
const hayCambios = computed(() =>
  asignaciones.value.some(
    (asignacion) =>
      estados.value[asignacion.id] != null &&
      estados.value[asignacion.id] !== asignacion.estado,
  ),
)

async function cargarAsignaciones() {
  const ocurrencia = props.ocurrencia
  if (!ocurrencia) return
  cargando.value = true
  error.value = ''
  try {
    asignaciones.value = await listarAsignaciones({
      ocurrenciaDeberId: ocurrencia.id,
    })
    const mapa: Record<number, EstadoCumplimiento> = {}
    for (const asignacion of asignaciones.value) {
      mapa[asignacion.id] = asignacion.estado as EstadoCumplimiento
    }
    estados.value = mapa
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : 'No se pudieron cargar las asignaciones.'
  } finally {
    cargando.value = false
  }
}

watch(
  () => [open.value, props.ocurrencia?.id],
  ([abierto]) => {
    if (!abierto) return
    busqueda.value = ''
    resultados.value = []
    estudianteSeleccionado.value = null
    cancelarAbierto.value = false
    motivoCancelacion.value = ''
    void cargarAsignaciones()
  },
)

watch(busqueda, (texto) => {
  if (temporizador) clearTimeout(temporizador)
  if (!texto.trim()) {
    resultados.value = []
    return
  }
  temporizador = setTimeout(async () => {
    buscando.value = true
    try {
      const lista = await obtenerEstudiantes({ texto: texto.trim() })
      resultados.value = lista.slice(0, 8)
    } catch {
      resultados.value = []
    } finally {
      buscando.value = false
    }
  }, 300)
})

function seleccionarEstudiante(estudiante: EstudianteResumen) {
  estudianteSeleccionado.value = estudiante
  busqueda.value = ''
  resultados.value = []
}

async function asignar() {
  const ocurrencia = props.ocurrencia
  if (!ocurrencia || !estudianteSeleccionado.value) {
    toast.warning('Selecciona un estudiante.')
    return
  }
  asignando.value = true
  try {
    await asignarManual(ocurrencia.id, {
      estudianteId: estudianteSeleccionado.value.id,
      bloqueada: bloqueada.value,
    })
    toast.success('Estudiante asignado')
    estudianteSeleccionado.value = null
    await cargarAsignaciones()
    emit('actualizado')
  } catch (caught) {
    toast.error('No se pudo asignar el estudiante', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    asignando.value = false
  }
}

async function confirmarQuitar() {
  const asignacion = quitarTarget.value
  if (!asignacion) return
  quitando.value = true
  try {
    await quitarAsignacion(asignacion.id)
    toast.success('Asignación retirada')
    quitarTarget.value = null
    await cargarAsignaciones()
    emit('actualizado')
  } catch (caught) {
    toast.error('No se pudo quitar la asignación', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    quitando.value = false
  }
}

async function alternarBloqueo(asignacion: AsignacionLeer) {
  try {
    await actualizarAsignacion(asignacion.id, { bloqueada: !asignacion.bloqueada })
    await cargarAsignaciones()
  } catch (caught) {
    toast.error('No se pudo cambiar el bloqueo', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  }
}

async function guardarCumplimiento() {
  const items = asignaciones.value
    .filter(
      (asignacion) =>
        estados.value[asignacion.id] != null &&
        estados.value[asignacion.id] !== asignacion.estado,
    )
    .map((asignacion) => ({
      asignacionId: asignacion.id,
      estado: estados.value[asignacion.id] as Exclude<EstadoCumplimiento, 'PERMUTADA'>,
    }))
  if (items.length === 0) {
    toast.info('No hay cambios de cumplimiento.')
    return
  }
  guardandoCumplimiento.value = true
  try {
    const resultado = await registrarCumplimiento({ items })
    toast.success('Cumplimiento actualizado', {
      description: `${resultado.actualizadas} asignaciones actualizadas.`,
    })
    await cargarAsignaciones()
    emit('actualizado')
  } catch (caught) {
    toast.error('No se pudo registrar el cumplimiento', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    guardandoCumplimiento.value = false
  }
}

async function cancelar() {
  const ocurrencia = props.ocurrencia
  if (!ocurrencia) return
  if (!motivoCancelacion.value.trim()) {
    toast.warning('Indica el motivo de la cancelación.')
    return
  }
  cancelando.value = true
  try {
    await cancelarOcurrencia(ocurrencia.id, { motivo: motivoCancelacion.value.trim() })
    toast.success('Ocurrencia cancelada')
    cancelarAbierto.value = false
    motivoCancelacion.value = ''
    await cargarAsignaciones()
    emit('actualizado')
  } catch (caught) {
    toast.error('No se pudo cancelar la ocurrencia', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    cancelando.value = false
  }
}

async function reactivar() {
  const ocurrencia = props.ocurrencia
  if (!ocurrencia) return
  try {
    await reactivarOcurrencia(ocurrencia.id)
    toast.success('Ocurrencia reactivada')
    await cargarAsignaciones()
    emit('actualizado')
  } catch (caught) {
    toast.error('No se pudo reactivar la ocurrencia', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  }
}

function abrirRecuperacion(asignacion: AsignacionLeer) {
  recuperacionTarget.value = asignacion
  recuperacionAbierta.value = true
}

async function alRecuperar() {
  await cargarAsignaciones()
  emit('actualizado')
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent class="w-full overflow-y-auto sm:max-w-2xl">
      <SheetHeader>
        <SheetTitle>
          {{ ocurrencia ? `${ocurrencia.tipoDeber} · ${formatDate(ocurrencia.fecha)}` : 'Ocurrencia' }}
        </SheetTitle>
        <SheetDescription>
          <template v-if="ocurrencia">
            {{ ocurrencia.configuracion }}
            <span v-if="ocurrencia.horario"> · {{ ocurrencia.horario }}</span>
            <span v-if="ocurrencia.lugar"> · {{ ocurrencia.lugar }}</span>
          </template>
        </SheetDescription>
      </SheetHeader>

      <div v-if="ocurrencia" class="space-y-4">
        <div class="flex flex-wrap items-center gap-2">
          <Badge :variant="ocurrencia.cancelada ? 'destructive' : 'secondary'">
            {{ ocurrencia.cancelada ? 'Cancelada' : 'Activa' }}
          </Badge>
          <Badge v-if="bajoCupo" variant="outline">
            Faltan {{ (ocurrencia.cantPersonas ?? 0) - ocurrencia.asignados }} cupos
          </Badge>
          <Badge v-else-if="ocurrencia.cantPersonas != null" variant="outline">
            {{ ocurrencia.asignados }}/{{ ocurrencia.cantPersonas }} asignados
          </Badge>
          <Badge v-if="esFutura" variant="outline">Fecha futura</Badge>
          <Badge v-if="cerrado" variant="outline">Período cerrado</Badge>
        </div>

        <Alert v-if="ocurrencia.cancelada">
          <AlertCircleIcon />
          <AlertTitle>Ocurrencia cancelada</AlertTitle>
          <AlertDescription>
            {{ ocurrencia.motivoCancelacion ?? 'Sin motivo registrado.' }}
          </AlertDescription>
        </Alert>

        <Alert v-if="cerrado">
          <LockIcon />
          <AlertTitle>Período cerrado</AlertTitle>
          <AlertDescription>
            Las asignaciones y el cumplimiento ya no se pueden modificar.
          </AlertDescription>
        </Alert>

        <Alert v-if="error" variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>No se pudieron cargar las asignaciones</AlertTitle>
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-semibold">Asignaciones</h4>
            <Button
              v-if="!ocurrencia.cancelada"
              variant="ghost"
              size="sm"
              :disabled="cerrado"
              @click="cancelarAbierto = true"
            >
              <XIcon />
              Cancelar ocurrencia
            </Button>
            <Button
              v-else
              variant="outline"
              size="sm"
              :disabled="cerrado"
              @click="reactivar"
            >
              <RotateCcwIcon />
              Reactivar
            </Button>
          </div>

          <div v-if="cargando" class="text-muted-foreground flex items-center gap-2 py-4 text-sm">
            <LoaderCircleIcon class="animate-spin" />
            Cargando asignaciones…
          </div>

          <div v-else-if="asignaciones.length === 0" class="text-muted-foreground rounded-md border py-6 text-center text-sm">
            No hay estudiantes asignados a esta ocurrencia.
          </div>

          <div v-else class="divide-y rounded-md border">
            <div
              v-for="asignacion in asignaciones"
              :key="asignacion.id"
              class="space-y-2 px-3 py-2.5"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="min-w-0">
                  <div class="truncate text-sm font-medium">{{ asignacion.estudiante }}</div>
                  <div class="text-muted-foreground text-xs">
                    {{ asignacion.puntosCarga }} punto(s)
                    <span v-if="asignacion.asignacionOrigenId">
                      · recuperación de #{{ asignacion.asignacionOrigenId }}
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <Badge :variant="varianteEstadoAsignacion(asignacion.estado)">
                    {{ etiquetaEstadoAsignacion(asignacion.estado) }}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    :title="asignacion.bloqueada ? 'Desbloquear' : 'Bloquear'"
                    @click="alternarBloqueo(asignacion)"
                  >
                    <LockIcon v-if="asignacion.bloqueada" />
                    <LockOpenIcon v-else />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Quitar asignación"
                    :disabled="cerrado || asignacion.estado !== 'PLANIFICADA'"
                    @click="quitarTarget = asignacion"
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <template v-if="asignacion.estado === 'PERMUTADA'">
                  <span class="text-muted-foreground text-xs">
                    Permutada: no se puede modificar el cumplimiento.
                  </span>
                </template>
                <template v-else>
                  <Select v-model="estados[asignacion.id]" :disabled="cerrado">
                    <SelectTrigger class="h-8 w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        v-for="estado in estadosPermitidos(asignacion)"
                        :key="estado"
                        :value="estado"
                      >
                        {{ etiquetaEstadoAsignacion(estado) }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    v-if="
                      asignacion.estado === 'INCUMPLIDA' ||
                      asignacion.estado === 'JUSTIFICADA'
                    "
                    variant="outline"
                    size="sm"
                    :disabled="cerrado"
                    @click="abrirRecuperacion(asignacion)"
                  >
                    <RotateCcwIcon />
                    Recuperar
                  </Button>
                </template>
              </div>
            </div>
          </div>

          <div class="flex justify-end">
            <Button
              size="sm"
              :disabled="cerrado || !hayCambios || guardandoCumplimiento"
              @click="guardarCumplimiento"
            >
              <LoaderCircleIcon v-if="guardandoCumplimiento" class="animate-spin" />
              <CheckIcon v-else />
              Guardar cumplimiento
            </Button>
          </div>
        </div>

        <div v-if="!ocurrencia.cancelada" class="space-y-2 rounded-md border p-3">
          <h4 class="text-sm font-semibold">Asignar estudiante</h4>

          <div v-if="estudianteSeleccionado" class="flex items-center justify-between rounded-md border px-2.5 py-2">
            <span class="text-sm font-medium">{{ estudianteSeleccionado.nombre }}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              title="Quitar selección"
              @click="estudianteSeleccionado = null"
            >
              <XIcon />
            </Button>
          </div>

          <div v-else class="space-y-2">
            <div class="relative">
              <SearchIcon
                class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
              />
              <Input
                v-model="busqueda"
                placeholder="Buscar estudiante por nombre o carnet"
                class="pl-8"
                :disabled="cerrado"
              />
            </div>
            <div v-if="buscando" class="text-muted-foreground text-xs">Buscando…</div>
            <div v-else-if="resultados.length" class="rounded-md border">
              <button
                v-for="estudiante in resultados"
                :key="estudiante.id"
                type="button"
                class="hover:bg-muted flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left text-sm"
                @click="seleccionarEstudiante(estudiante)"
              >
                <span class="truncate">{{ estudiante.nombre }}</span>
                <span class="text-muted-foreground text-xs">{{ estudiante.carnet }}</span>
              </button>
            </div>
          </div>

          <label class="flex items-center gap-2 text-sm">
            <input
              v-model="bloqueada"
              type="checkbox"
              class="border-input size-4 rounded"
              :disabled="cerrado"
            />
            Bloquear la asignación (no se mueve al regenerar)
          </label>

          <div class="flex justify-end">
            <Button
              size="sm"
              :disabled="
                cerrado ||
                asignando ||
                !estudianteSeleccionado ||
                (ocurrencia.cantPersonas != null &&
                  ocurrencia.asignados >= ocurrencia.cantPersonas)
              "
              @click="asignar"
            >
              <LoaderCircleIcon v-if="asignando" class="animate-spin" />
              <UserPlusIcon v-else />
              Asignar
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        :open="quitarTarget !== null"
        titulo="Quitar asignación"
        :descripcion="`Se quitará a ${quitarTarget?.estudiante ?? ''} de esta ocurrencia. Solo se permite si está planificada.`"
        confirm-label="Quitar"
        :cargando="quitando"
        @update:open="(valor) => { if (!valor) quitarTarget = null }"
        @confirmar="confirmarQuitar"
      />

      <Dialog v-model:open="cancelarAbierto">
        <DialogContent class="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar ocurrencia</DialogTitle>
            <DialogDescription>
              Se cancelará la ocurrencia y se retirarán sus asignaciones planificadas. Las
              asignaciones ya cumplidas o incumplidas se conservan.
            </DialogDescription>
          </DialogHeader>
          <div class="space-y-1.5">
            <Label for="motivo-cancelacion">Motivo</Label>
            <Textarea
              id="motivo-cancelacion"
              v-model="motivoCancelacion"
              placeholder="Feriado, actividad extraordinaria…"
            />
          </div>
          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">Volver</Button>
            </DialogClose>
            <Button variant="destructive" :disabled="cancelando" @click="cancelar">
              <LoaderCircleIcon v-if="cancelando" class="animate-spin" />
              Cancelar ocurrencia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RecuperacionDialog
        v-model:open="recuperacionAbierta"
        :asignacion="recuperacionTarget"
        :periodo-planificacion-id="periodo.id"
        @recuperado="alRecuperar"
      />
    </SheetContent>
  </Sheet>
</template>
