<script setup lang="ts">
import type {
  ConfiguracionCrearInput,
  ConfiguracionLeer,
  GenerarInput,
  HorarioLeer,
  PeriodoLeer,
  PlanLeer,
  ResultadoGeneracion,
  TipoDeberLeer,
  UbicacionLeer,
} from '@/types/planificacion'
import type {
  ConjuntoCrearInput,
  ConjuntoResumen,
  ConjuntoVersionInput,
} from '@/types/reglas'
import { computed, onMounted, ref } from 'vue'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import KpiCard from '@/components/infraestructura/KpiCard.vue'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import ConfirmDialog from '@/components/infraestructura/ConfirmDialog.vue'
import EditorConjuntoRegla from '@/components/reglas/EditorConjuntoRegla.vue'
import {
  agregarPlan,
  cerrarPeriodo,
  crearConfiguracion,
  crearPeriodo,
  eliminarConfiguracion,
  eliminarPeriodo,
  generarPlanificacion,
  listarConfiguraciones,
  listarHorarios,
  listarPeriodos,
  listarPlanes,
  listarTiposDeber,
  listarUbicaciones,
  publicarPeriodo,
  quitarPlan,
  versionarConfiguracion,
  actualizarConfiguracion,
  actualizarPeriodo,
} from '@/services/planificacion'
import { crearConjunto, listarConjuntos } from '@/services/reglas'
import { formatDate, formatNumber } from '@/lib/format'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertCircleIcon,
  CalendarIcon,
  ClockIcon,
  CopyIcon,
  LoaderCircleIcon,
  PlayIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
  UsersIcon,
  XIcon,
} from '@lucide/vue'
import { toast } from 'vue-sonner'

const periodos = ref<PeriodoLeer[]>([])
const cargando = ref(true)
const error = ref('')
const periodoSeleccionado = ref<PeriodoLeer | null>(null)
const tabActiva = ref<'planes' | 'configuraciones' | 'generar'>('planes')

const planes = ref<PlanLeer[]>([])
const configuraciones = ref<ConfiguracionLeer[]>([])
const tiposDeber = ref<TipoDeberLeer[]>([])
const horarios = ref<HorarioLeer[]>([])
const ubicaciones = ref<UbicacionLeer[]>([])

const periodoFiltro = ref('todos')
const busquedaPeriodo = ref('')

const nuevoPeriodoAbierto = ref(false)
const editarPeriodoAbierto = ref(false)
const confirmarEliminarPeriodoAbierto = ref(false)
const agregarPlanAbierto = ref(false)
const editorConjuntoAbierto = ref(false)
const nuevaConfiguracionAbierto = ref(false)
const editarConfiguracionAbierto = ref(false)


const periodoFormAbierto = computed({
  get: () => nuevoPeriodoAbierto.value || editarPeriodoAbierto.value,
  set: (valor: boolean) => {
    if (!valor) {
      nuevoPeriodoAbierto.value = false
      editarPeriodoAbierto.value = false
      periodoEditId.value = null
      periodoInicio.value = ''
      periodoFin.value = ''
    }
  },
})

const configuracionFormAbierto = computed({
  get: () => nuevaConfiguracionAbierto.value || editarConfiguracionAbierto.value,
  set: (valor: boolean) => {
    if (!valor) {
      nuevaConfiguracionAbierto.value = false
      editarConfiguracionAbierto.value = false
      configEditId.value = null
    }
  },
})

const confirmarEliminarConfiguracionAbierto = computed({
  get: () => configuracionParaEliminar.value !== null,
  set: (valor: boolean) => {
    if (!valor) configuracionParaEliminar.value = null
  },
})

const confirmarVersionarConfiguracionAbierto = computed({
  get: () => configuracionParaVersionar.value !== null,
  set: (valor: boolean) => {
    if (!valor) configuracionParaVersionar.value = null
  },
})

const periodoParaEliminar = ref<PeriodoLeer | null>(null)
const configuracionParaEliminar = ref<ConfiguracionLeer | null>(null)
const configuracionParaVersionar = ref<ConfiguracionLeer | null>(null)

const periodoInicio = ref('')
const periodoFin = ref('')
const periodoEditId = ref<number | null>(null)

const planTipoDeberId = ref<number | ''>('')
const planConjuntoId = ref<number | '' | 'nuevo'>('')
const conjuntosDeberVigentes = ref<ConjuntoResumen[]>([])

const configForm = ref<{
  tipoDeberId: number | ''
  nombre: string
  horarioId: number | ''
  conjuntoReglaId: number | ''
  modalidad: 'TURNADA' | 'TODOS_LOS_ELEGIBLES' | 'MANUAL'
  cantPersonas: string
  puntos: string
  frecuencia: 'UNICA' | 'DIARIA' | 'SEMANAL' | 'MENSUAL' | 'ANUAL'
  intervalo: string
  fechaInicio: string
  fechaFin: string
  expandirPor: 'NINGUNO' | 'EDIFICIO' | 'ESCALERA' | 'CUARTO'
  diasSemana: number[]
}>({
  tipoDeberId: '',
  nombre: '',
  horarioId: '',
  conjuntoReglaId: '',
  modalidad: 'TODOS_LOS_ELEGIBLES',
  cantPersonas: '',
  puntos: '',
  frecuencia: 'UNICA',
  intervalo: '',
  fechaInicio: '',
  fechaFin: '',
  expandirPor: 'NINGUNO',
  diasSemana: [],
})

const configEditId = ref<number | null>(null)

const generarDesde = ref('')
const generarHasta = ref('')
const generarTiposDeber = ref<number[]>([])
const generarAlgoritmo = ref<'SECUENCIAL' | 'CPSAT' | 'CPSAT_SECUENCIAL'>('CPSAT')
const generarTiempoMaximo = ref(300)
const generarMetaPorMes = ref<number | ''>('')
const generando = ref(false)
const resultadoGeneracion = ref<ResultadoGeneracion | null>(null)

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    periodos.value = await listarPeriodos()
    await Promise.all([listarTiposDeber(), listarHorarios(), listarUbicaciones()])
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : 'No se pudieron cargar los períodos.'
  } finally {
    cargando.value = false
  }
}

const filtrados = computed(() => {
  const texto = busquedaPeriodo.value.toLowerCase()
  return periodos.value.filter((p) => {
    const contenido = `${p.inicio} ${p.fin} ${p.estado}`.toLowerCase()
    if (texto && !contenido.includes(texto)) return false
    if (periodoFiltro.value !== 'todos' && p.estado !== periodoFiltro.value) return false
    return true
  })
})

function varianteEstado(estado: string) {
  const e = estado.toLowerCase()
  if (e === 'publicado') return 'default'
  if (e === 'cerrado') return 'secondary'
  return 'outline'
}

function etiquetaEstado(estado: string) {
  const map: Record<string, string> = { BORRADOR: 'Borrador', PUBLICADO: 'Publicado', CERRADO: 'Cerrado' }
  return map[estado] ?? estado
}

async function cargarDetalle(periodo: PeriodoLeer) {
  periodoSeleccionado.value = periodo
  await Promise.all([cargarPlanes(periodo.id), cargarConfiguraciones()])
}

async function cargarPlanes(periodoId: number) {
  try {
    planes.value = await listarPlanes(periodoId)
  } catch {
    planes.value = []
  }
}

async function cargarConfiguraciones() {
  try {
    configuraciones.value = await listarConfiguraciones()
    const [td, h, u] = await Promise.all([
      listarTiposDeber(),
      listarHorarios(),
      listarUbicaciones(),
    ])
    tiposDeber.value = td
    horarios.value = h
    ubicaciones.value = u
    await cargarConjuntosDeber()
  } catch {
    tiposDeber.value = []
    horarios.value = []
    ubicaciones.value = []
    conjuntosDeberVigentes.value = []
  }
}

async function cargarConjuntosDeber() {
  try {
    conjuntosDeberVigentes.value = await listarConjuntos({
      ambito: 'DEBER',
      vigente: true,
    })
  } catch {
    conjuntosDeberVigentes.value = []
  }
}

async function crearPeriodoNuevo() {
  if (!periodoInicio.value || !periodoFin.value) {
    toast.warning('Ingresa fechas de inicio y fin.')
    return
  }
  if (periodoFin.value < periodoInicio.value) {
    toast.warning('La fecha fin debe ser mayor o igual a la de inicio.')
    return
  }
  try {
    await crearPeriodo({ inicio: periodoInicio.value, fin: periodoFin.value })
    toast.success('Período creado')
    nuevoPeriodoAbierto.value = false
    periodoInicio.value = ''
    periodoFin.value = ''
    await cargar()
  } catch (caught) {
    toast.error('No se pudo crear el período', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  }
}

async function actualizarPeriodoActual() {
  const p = periodoSeleccionado.value
  if (!p || !periodoInicio.value || !periodoFin.value) return
  if (periodoFin.value < periodoInicio.value) {
    toast.warning('La fecha fin debe ser mayor o igual a la de inicio.')
    return
  }
  try {
    await actualizarPeriodo(p.id, { inicio: periodoInicio.value, fin: periodoFin.value })
    toast.success('Período actualizado')
    editarPeriodoAbierto.value = false
    await cargar()
  } catch (caught) {
    toast.error('No se pudo actualizar el período', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  }
}

function solicitarEliminar(p: PeriodoLeer) {
  periodoParaEliminar.value = p
  confirmarEliminarPeriodoAbierto.value = true
}

async function confirmarEliminarPeriodo() {
  const p = periodoParaEliminar.value
  if (!p) return
  try {
    await eliminarPeriodo(p.id)
    toast.success('Período eliminado')
    confirmarEliminarPeriodoAbierto.value = false
    periodoParaEliminar.value = null
    if (periodoSeleccionado.value?.id === p.id) periodoSeleccionado.value = null
    await cargar()
  } catch (caught) {
    toast.error('No se pudo eliminar el período', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  }
}

async function publicar(p: PeriodoLeer) {
  try {
    await publicarPeriodo(p.id)
    toast.success('Período publicado')
    await cargar()
  } catch (caught) {
    toast.error('No se pudo publicar el período', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  }
}

async function cerrar(p: PeriodoLeer) {
  try {
    await cerrarPeriodo(p.id)
    toast.success('Período cerrado')
    await cargar()
  } catch (caught) {
    toast.error('No se pudo cerrar el período', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  }
}

function abrirAgregarPlan() {
  planTipoDeberId.value = ''
  planConjuntoId.value = ''
  agregarPlanAbierto.value = true
}

async function agregarPlanActual() {
  if (!planTipoDeberId.value || !planConjuntoId.value) {
    toast.warning('Selecciona tipo de deber y conjunto de reglas.')
    return
  }
  const periodoId = periodoSeleccionado.value?.id
  if (!periodoId) return
  try {
    await agregarPlan(periodoId, {
      tipoDeberId: Number(planTipoDeberId.value),
      conjuntoReglaId: Number(planConjuntoId.value),
    })
    toast.success('Plan agregado')
    agregarPlanAbierto.value = false
    planTipoDeberId.value = ''
    planConjuntoId.value = ''
    await cargarPlanes(periodoId)
  } catch (caught) {
    toast.error('No se pudo agregar el plan', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  }
}

async function quitarPlanActual(planId: number) {
  const periodoId = periodoSeleccionado.value?.id
  if (!periodoId) return
  try {
    await quitarPlan(periodoId, planId)
    toast.success('Plan quitado')
    await cargarPlanes(periodoId)
  } catch (caught) {
    toast.error('No se pudo quitar el plan', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  }
}

function abrirNuevaConfiguracion() {
  configEditId.value = null
  configForm.value = {
    tipoDeberId: '',
    nombre: '',
    horarioId: '',
    conjuntoReglaId: '',
    modalidad: 'TODOS_LOS_ELEGIBLES',
    cantPersonas: '',
    puntos: '',
    frecuencia: 'UNICA',
    intervalo: '',
    fechaInicio: '',
    fechaFin: '',
    expandirPor: 'NINGUNO',
    diasSemana: [],
  }
  nuevaConfiguracionAbierto.value = true
}

function editarConfiguracion(c: ConfiguracionLeer) {
  configEditId.value = c.id
  configForm.value = {
    tipoDeberId: c.tipoDeberId,
    nombre: c.nombre,
    horarioId: c.horarioId ?? '',
    conjuntoReglaId: c.conjuntoReglaId ?? '',
    modalidad: c.modalidad as ConfiguracionCrearInput['modalidad'],
    cantPersonas: String(c.cantPersonas ?? ''),
    puntos: String(c.puntos ?? ''),
    frecuencia: c.frecuencia as ConfiguracionCrearInput['frecuencia'],
    intervalo: String(c.intervalo ?? ''),
    fechaInicio: c.fechaInicio,
    fechaFin: c.fechaFin ?? '',
    expandirPor: c.expandirPor as NonNullable<ConfiguracionCrearInput['expandirPor']>,
    diasSemana: c.diasSemana ?? [],
  }
  editarConfiguracionAbierto.value = true
}

async function guardarConfiguracion() {
  const f = configForm.value
  if (!f.tipoDeberId || !f.nombre || !f.fechaInicio) {
    toast.warning('Completa tipo de deber, nombre y fecha de inicio.')
    return
  }
  if (f.fechaFin && f.fechaFin < f.fechaInicio) {
    toast.warning('La fecha fin debe ser mayor o igual a la de inicio.')
    return
  }
  const input: ConfiguracionCrearInput = {
    tipoDeberId: Number(f.tipoDeberId),
    nombre: f.nombre,
    horarioId: f.horarioId ? Number(f.horarioId) : null,
    conjuntoReglaId: f.conjuntoReglaId ? Number(f.conjuntoReglaId) : null,
    modalidad: f.modalidad,
    cantPersonas: f.modalidad === 'TURNADA' && f.cantPersonas ? Number(f.cantPersonas) : null,
    puntos: f.puntos ? Number(f.puntos) : 0,
    frecuencia: f.frecuencia,
    intervalo: f.intervalo ? Number(f.intervalo) : undefined,
    fechaInicio: f.fechaInicio,
    fechaFin: f.fechaFin || null,
    expandirPor: f.expandirPor,
    diasSemana: f.diasSemana.length ? f.diasSemana : undefined,
  }
  try {
    if (configEditId.value) {
      await actualizarConfiguracion(configEditId.value, input)
      toast.success('Configuración actualizada')
    } else {
      await crearConfiguracion(input)
      toast.success('Configuración creada')
    }
    nuevaConfiguracionAbierto.value = false
    editarConfiguracionAbierto.value = false
    await cargarConfiguraciones()
  } catch (caught) {
    toast.error('No se pudo guardar la configuración', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  }
}

function eliminarConfiguracionActual() {
  const c = configuracionParaEliminar.value
  if (!c) return
  void eliminarConfiguracion(c.id).then(() => {
    toast.success('Configuración eliminada')
    configuracionParaEliminar.value = null
    void cargarConfiguraciones()
  })
}

function seleccionarVersionar(c: ConfiguracionLeer) {
  configuracionParaVersionar.value = c
  editarConfiguracionAbierto.value = false
}

function versionarConfiguracionActual() {
  const c = configuracionParaVersionar.value
  if (!c) return
  void versionarConfiguracion(c.id).then(() => {
    toast.success('Versión creada')
    configuracionParaVersionar.value = null
    void cargarConfiguraciones()
  })
}

async function generarPlanificacionActual() {
  const periodoId = periodoSeleccionado.value?.id
  if (!periodoId) {
    toast.warning('Selecciona un período.')
    return
  }
  const p = periodos.value.find((x) => x.id === periodoId)
  if (p?.estado !== 'PUBLICADO') {
    toast.error('El período debe estar PUBLICADO para generar la planificación.')
    return
  }
  generando.value = true
  try {
    const input: GenerarInput = {
      desde: generarDesde.value || undefined,
      hasta: generarHasta.value || undefined,
      tipoDeberIds: generarTiposDeber.value.length ? generarTiposDeber.value : undefined,
      algoritmo: generarAlgoritmo.value,
      tiempoMaximo: generarTiempoMaximo.value,
      metaPorMes: generarMetaPorMes.value === '' ? undefined : Number(generarMetaPorMes.value),
    }
    const resultado = await generarPlanificacion(periodoId, input)
    resultadoGeneracion.value = resultado
    generando.value = false
    toast.success('Planificación generada', {
      description: `${resultado.asignacionesCreadas} asignaciones creadas.`,
    })
  } catch (caught) {
    generando.value = false
    toast.error('No se pudo generar la planificación', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  }
}

function abrirEditorDesdePlan() {
  planConjuntoId.value = ''
  editorConjuntoAbierto.value = true
  agregarPlanAbierto.value = false
}

async function crearConjuntoDeber(input: ConjuntoCrearInput | ConjuntoVersionInput) {
  if (!('nombre' in input)) {
    toast.error('No se pudo crear el conjunto: faltan datos.')
    return
  }
  try {
    const creado = await crearConjunto(input)
    toast.success('Conjunto creado', { description: creado.nombre })
    editorConjuntoAbierto.value = false
    await cargarConjuntosDeber()
    planConjuntoId.value = creado.id
    agregarPlanAbierto.value = true
  } catch (caught) {
    toast.error('No se pudo crear el conjunto', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  }
}

onMounted(cargar)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Planificación de deberes</h1>
        <p class="text-muted-foreground mt-1 text-sm">
          Organiza períodos, planes y configuraciones de deberes de los estudiantes.
        </p>
      </div>
      <div class="flex gap-2">
        <Button @click="() => { periodoInicio = ''; periodoFin = ''; periodoEditId = null; nuevoPeriodoAbierto = true }">
          <CalendarIcon />
          Nuevo período
        </Button>
        <Button variant="outline" @click="cargar" :disabled="cargando">
          <RefreshCwIcon />
          Refrescar
        </Button>
      </div>
    </div>

    <Alert v-if="error" variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>No se pudo cargar los períodos</AlertTitle>
      <AlertDescription>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>{{ error }}</span>
          <Button variant="outline" size="sm" @click="cargar">Reintentar</Button>
        </div>
      </AlertDescription>
    </Alert>

    <div class="grid gap-6 lg:grid-cols-12">
      <!-- Izquierda: lista de períodos -->
      <div class="lg:col-span-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Períodos</CardTitle>
            <CardDescription>Selecciona un período para ver su detalle.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="grid gap-3 md:grid-cols-2">
              <Select v-model="periodoFiltro" class="w-full">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="BORRADOR">Borrador</SelectItem>
                  <SelectItem value="PUBLICADO">Publicado</SelectItem>
                  <SelectItem value="CERRADO">Cerrado</SelectItem>
                </SelectContent>
              </Select>
              <Input
                v-model="busquedaPeriodo"
                placeholder="Buscar período..."
                class="w-full"
                aria-label="Buscar período"
              />
            </div>
            <div v-if="cargando" class="flex gap-2 text-sm text-muted-foreground">
              <LoaderCircleIcon class="size-4 animate-spin" />
              <span>Cargando…</span>
            </div>
            <div v-else-if="filtrados.length === 0" class="py-4 text-center text-xs text-muted-foreground">
              Sin períodos.
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="p in filtrados"
                :key="p.id"
                class="cursor-pointer rounded border p-3 hover:bg-accent/50"
                :class="{ 'bg-primary/10 border-primary': periodoSeleccionado?.id === p.id }"
                @click="cargarDetalle(p)"
              >
                <div class="flex items-center justify-between gap-2 mb-1">
                  <span class="font-semibold text-sm">{{ formatDate(p.inicio) }} - {{ formatDate(p.fin) }}</span>
                  <Badge :variant="varianteEstado(p.estado)" class="text-xs">{{ etiquetaEstado(p.estado) }}</Badge>
                </div>
                <div class="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{{ formatNumber(p.planes) }} planes</span>
                  <span>{{ formatNumber(p.ocurrencias) }} ocurrencias</span>
                  <span>{{ formatNumber(p.asignaciones) }} asignaciones</span>
                </div>
                <div class="flex gap-1 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    @click.stop="() => { periodoInicio = p.inicio; periodoFin = p.fin; periodoEditId = p.id; editarPeriodoAbierto = true }"
                  >
                    <XIcon class="size-3" /> Editar
                  </Button>
                  <Button
                    v-if="p.estado !== 'PUBLICADO'"
                    variant="outline"
                    size="sm"
                    @click.stop="publicar(p)"
                  >
                    Publicar
                  </Button>
                  <Button
                    v-if="p.estado === 'PUBLICADO'"
                    variant="outline"
                    size="sm"
                    @click.stop="cerrar(p)"
                  >
                    Cerrar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    @click.stop="solicitarEliminar(p)"
                  >
                    <Trash2Icon class="size-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Derecha: detalle -->
      <div class="lg:col-span-8 space-y-4">
        <div v-if="!periodoSeleccionado" class="flex flex-col items-center gap-2 py-8 text-center">
          <CalendarIcon class="size-10 text-muted-foreground mx-auto" />
          <p class="text-muted-foreground text-sm">Selecciona un período para gestionar planes y configuraciones.</p>
        </div>

        <div v-if="periodoSeleccionado">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 class="text-lg font-semibold tracking-tight">
                Período: {{ formatDate(periodoSeleccionado.inicio) }} - {{ formatDate(periodoSeleccionado.fin) }}
              </h2>
              <p class="text-muted-foreground text-sm">
                {{ etiquetaEstado(periodoSeleccionado.estado) }} ·
                {{ formatNumber(periodoSeleccionado.planes) }} planes
              </p>
            </div>
            <div class="flex gap-2">
              <Button
                v-if="periodoSeleccionado.estado !== 'PUBLICADO'"
                @click="publicar(periodoSeleccionado)"
              >
                Publicar período
              </Button>
              <Button
                v-if="periodoSeleccionado.estado === 'PUBLICADO'"
                @click="cerrar(periodoSeleccionado)"
              >
                Cerrar período
              </Button>
            </div>
          </div>

          <Tabs v-model="tabActiva" class="w-full">
            <TabsList>
              <TabsTrigger value="planes">Planes</TabsTrigger>
              <TabsTrigger value="configuraciones">Configuraciones</TabsTrigger>
              <TabsTrigger value="generar">Generar</TabsTrigger>
            </TabsList>

            <!-- Tab Planes -->
            <TabsContent value="planes" class="mt-4">
              <div class="flex items-center justify-between mb-3">
                <CardTitle>Planes del período</CardTitle>
                <Button @click="abrirAgregarPlan">
                  <PlusIcon class="size-4 mr-1" /> Agregar plan
                </Button>
              </div>
              <div v-if="planes.length === 0" class="py-4 text-center text-xs text-muted-foreground">
                Sin planes. Agrega un plan para asociar un tipo de deber y un conjunto de reglas.
              </div>
              <Table v-else class="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo de deber</TableHead>
                    <TableHead>Conjunto · versión</TableHead>
                    <TableHead class="w-32 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="plan in planes" :key="plan.id">
                    <TableCell class="font-medium">{{ plan.tipoDeber }}</TableCell>
                    <TableCell>{{ plan.conjunto }} v{{ plan.conjuntoVersion }}</TableCell>
                    <TableCell class="text-right">
                      <Button variant="ghost" size="sm" @click.stop="quitarPlanActual(plan.id)">
                        <Trash2Icon class="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TabsContent>

            <!-- Tab Configuraciones -->
            <TabsContent value="configuraciones" class="mt-4">
              <div class="flex items-center justify-between mb-3">
                <CardTitle>Configuraciones de deber</CardTitle>
                <Button @click="abrirNuevaConfiguracion">
                  <PlusIcon class="size-4 mr-1" /> Nueva configuración
                </Button>
              </div>
              <div v-if="configuraciones.length === 0" class="py-4 text-center text-xs text-muted-foreground">
                Sin configuraciones.
              </div>
              <Table v-else class="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo de deber</TableHead>
                    <TableHead>Modalidad</TableHead>
                    <TableHead class="w-24">Frecuencia</TableHead>
                    <TableHead class="w-32">Conjunto</TableHead>
                    <TableHead class="w-32 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="c in configuraciones" :key="c.id">
                    <TableCell class="font-medium">{{ c.nombre }}</TableCell>
                    <TableCell>{{ c.tipoDeber }}</TableCell>
                    <TableCell class="text-sm">{{ c.modalidad }}</TableCell>
                    <TableCell class="text-sm">{{ c.frecuencia }}</TableCell>
                    <TableCell class="text-sm">{{ c.conjuntoReglaId ? c.conjuntoReglaId : '—' }}</TableCell>
                    <TableCell class="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        @click.stop="editarConfiguracion(c)"
                      >
                        <XIcon class="size-4" /> Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        @click.stop="seleccionarVersionar(c)"
                      >
                        <CopyIcon class="size-4" /> Versión
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        @click.stop="
                          configuracionParaEliminar = c

                        "
                      >
                        <Trash2Icon class="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TabsContent>

            <!-- Tab Generar -->
            <TabsContent value="generar" class="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Generar planificación</CardTitle>
                  <CardDescription>
                    Genera ocurrencias y asignaciones para el período seleccionado.
                    Requiere que el período esté PUBLICADO.
                  </CardDescription>
                </CardHeader>
                <CardContent class="space-y-3">
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="flex flex-col gap-1">
                      <Label>Desde</Label>
                      <Input v-model="generarDesde" type="date" class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1">
                      <Label>Hasta</Label>
                      <Input v-model="generarHasta" type="date" class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1">
                      <Label>Algoritmo</Label>
                      <Select v-model="generarAlgoritmo" class="w-full">
                        <SelectTrigger class="w-full">
                          <SelectValue placeholder="Algoritmo..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SECUENCIAL">Secuencial</SelectItem>
                          <SelectItem value="CPSAT">CP-SAT</SelectItem>
                          <SelectItem value="CPSAT_SECUENCIAL">CP-SAT + Secuencial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div class="flex flex-col gap-1">
                      <Label>Tiempo máximo (s)</Label>
                      <Input v-model="generarTiempoMaximo" type="number" class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1">
                      <Label>Meta por mes</Label>
                      <Input v-model="generarMetaPorMes" type="number" class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1">
                      <Label>Tipos de deber (opcional)</Label>
                      <Select v-model="generarTiposDeber" multiple class="w-full">
                        <SelectTrigger class="w-full">
                          <SelectValue placeholder="Todos..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            v-for="t in tiposDeber"
                            :key="t.id"
                            :value="t.id"
                          >
                            {{ t.nombre }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    type="button"
                    :disabled="generando"
                    @click="generarPlanificacionActual"
                  >
                    <LoaderCircleIcon v-if="generando" class="size-4 animate-spin mr-1" />
                    <PlayIcon v-else />
                    Generar planificación
                  </Button>
                </CardContent>
              </Card>

              <div v-if="resultadoGeneracion" class="space-y-4">
                <div class="grid gap-3 sm:grid-cols-5">
                  <KpiCard label="Creadas" :value="formatNumber(resultadoGeneracion.ocurrenciasCreadas)" :icon="CalendarIcon" tono="emerald" />
                  <KpiCard label="Existentes" :value="formatNumber(resultadoGeneracion.ocurrenciasExistentes)" :icon="RefreshCwIcon" tono="primary" />
                  <KpiCard label="Retiradas" :value="formatNumber(resultadoGeneracion.ocurrenciasRetiradas)" :icon="Trash2Icon" tono="amber" />
                  <KpiCard label="Asignaciones" :value="formatNumber(resultadoGeneracion.asignacionesCreadas)" :icon="UsersIcon" tono="emerald" />
                  <KpiCard label="Tiempo" :value="`${resultadoGeneracion.tiempoSegundos.toFixed(1)} s`" :icon="ClockIcon" tono="sky" />
                </div>
                <Card v-if="resultadoGeneracion.sinCubrir.length > 0">
                  <CardHeader>
                    <CardTitle>Sin cubrir</CardTitle>
                    <CardDescription>Ocurrencias que no alcanzaron la meta de personas.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table class="w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Configuración</TableHead>
                          <TableHead>Lugar</TableHead>
                          <TableHead class="w-20 text-right">Faltan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow v-for="s in resultadoGeneracion.sinCubrir" :key="s.ocurrenciaId">
                          <TableCell>{{ s.fecha }}</TableCell>
                          <TableCell>{{ s.configuracion }}</TableCell>
                          <TableCell>{{ s.lugar ?? '—' }}</TableCell>
                          <TableCell class="text-right text-sm font-medium">{{ s.faltan }}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>

    <!-- Nuevo / Editar período -->
    <Dialog v-model:open="periodoFormAbierto">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {{ periodoEditId ? 'Editar período' : 'Nuevo período' }}
          </DialogTitle>
          <DialogDescription>
            Define las fechas de inicio y fin del período de planificación.
          </DialogDescription>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="periodoEditId ? actualizarPeriodoActual() : crearPeriodoNuevo()">
          <div class="grid gap-3">
            <div class="flex flex-col gap-1">
              <Label for="periodo-inicio">Fecha de inicio</Label>
              <Input id="periodo-inicio" v-model="periodoInicio" type="date" />
            </div>
            <div class="flex flex-col gap-1">
              <Label for="periodo-fin">Fecha de fin</Label>
              <Input id="periodo-fin" v-model="periodoFin" type="date" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" :disabled="!periodoInicio || !periodoFin">
              {{ periodoEditId ? 'Guardar' : 'Crear' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Agregar plan -->
    <Dialog v-model:open="agregarPlanAbierto">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar plan</DialogTitle>
          <DialogDescription>
            Asocia un tipo de deber con un conjunto de reglas de deber vigente.
          </DialogDescription>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="agregarPlanActual">
            <div class="grid gap-3">
              <div class="flex flex-col gap-1">
                <Label>Tipo de deber</Label>
                <Select v-model="planTipoDeberId" class="w-full">
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="Seleccionar tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Seleccionar tipo de deber...</SelectItem>
                    <SelectItem v-for="t in tiposDeber" :key="t.id" :value="t.id">{{ t.nombre }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="flex flex-col gap-1">
                <Label>Conjunto de deber (vigente)</Label>
                <Select v-model="planConjuntoId" class="w-full">
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="Seleccionar conjunto..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Seleccionar conjunto...</SelectItem>
                    <SelectItem
                      v-for="c in conjuntosDeberVigentes"
                      :key="c.id"
                      :value="String(c.id)"
                    >
                      {{ c.nombre }} (v{{ c.version }})
                    </SelectItem>
                    <SelectItem value="nuevo">Crear conjunto…</SelectItem>
                  </SelectContent>
                </Select>
                <div v-if="planConjuntoId === 'nuevo'" class="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    @click="
                      abrirEditorDesdePlan
                    "
                  >
                    <PlusIcon class="size-4 mr-1" />
                    Crear conjunto de deber
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose as-child>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button
                type="submit"
                :disabled="!planTipoDeberId || !planConjuntoId || planConjuntoId === 'nuevo'"
              >
                Agregar plan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
    </Dialog>

    <!-- Editor conjunto (reutilizable) -->
    <Dialog v-model:open="editorConjuntoAbierto">
      <DialogContent class="sm:max-w-3xl">
        <EditorConjuntoRegla
          ambito="DEBER"
          :nombre-sugerido="''"
          :modelo="null"
          :cargando="false"
          @guardar="
            (input) => {
              crearConjuntoDeber(input)
            }
          "
          @cancelar="editorConjuntoAbierto = false"
        />
      </DialogContent>
    </Dialog>

    <!-- Nueva / Editar configuración -->
    <Dialog v-model:open="configuracionFormAbierto">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {{ configEditId ? 'Editar configuración' : 'Nueva configuración' }}
          </DialogTitle>
          <DialogDescription>
            Configura cómo se genera y asigna un tipo de deber.
          </DialogDescription>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="guardarConfiguracion">
            <div class="grid gap-4">
              <div class="flex flex-col gap-1">
                <Label>Tipo de deber</Label>
                <Select v-model="configForm.tipoDeberId" class="w-full">
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Seleccionar tipo de deber...</SelectItem>
                    <SelectItem v-for="t in tiposDeber" :key="t.id" :value="t.id">{{ t.nombre }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="flex flex-col gap-1">
                <Label>Nombre</Label>
                <Input v-model="configForm.nombre" placeholder="Nombre de la configuración" />
              </div>
              <div class="flex flex-col gap-1">
                <Label>Horario</Label>
                <Select v-model="configForm.horarioId" class="w-full">
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Ninguno</SelectItem>
                    <SelectItem v-for="h in horarios" :key="h.id" :value="h.id">{{ h.inicio }} - {{ h.fin }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="flex flex-col gap-1">
                <Label>Conjunto de deber (opcional)</Label>
                <Select v-model="configForm.conjuntoReglaId" class="w-full">
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Ninguno</SelectItem>
                    <SelectItem v-for="c in conjuntosDeberVigentes" :key="c.id" :value="String(c.id)">
                      {{ c.nombre }} (v{{ c.version }})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="flex flex-col gap-1">
                <Label>Modalidad</Label>
                <Select v-model="configForm.modalidad" class="w-full">
                  <SelectItem value="TURNADA">Turnada</SelectItem>
                  <SelectItem value="TODOS_LOS_ELEGIBLES">Todos los elegibles</SelectItem>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                </Select>
              </div>
              <div class="flex flex-col gap-1">
                <Label>Personas por turno (si turnada)</Label>
                <Input v-model="configForm.cantPersonas" type="number" />
              </div>
              <div class="flex flex-col gap-1">
                <Label>Puntos</Label>
                <Input v-model="configForm.puntos" type="number" />
              </div>
              <div class="flex flex-col gap-1">
                <Label>Frecuencia</Label>
                <Select v-model="configForm.frecuencia" class="w-full">
                  <SelectItem value="UNICA">Única</SelectItem>
                  <SelectItem value="DIARIA">Diaria</SelectItem>
                  <SelectItem value="SEMANAL">Semanal</SelectItem>
                  <SelectItem value="MENSUAL">Mensual</SelectItem>
                  <SelectItem value="ANUAL">Anual</SelectItem>
                </Select>
              </div>
              <div class="flex flex-col gap-1">
                <Label>Intervalo</Label>
                <Input v-model="configForm.intervalo" type="number" />
              </div>
              <div class="grid gap-4">
                <div class="flex flex-col gap-1">
                  <Label>Fecha de inicio</Label>
                  <Input v-model="configForm.fechaInicio" type="date" />
                </div>
                <div class="flex flex-col gap-1">
                  <Label>Fecha de fin</Label>
                  <Input v-model="configForm.fechaFin" type="date" />
                </div>
              </div>
              <div class="flex flex-col gap-1">
                <Label>Expandir por</Label>
                <Select v-model="configForm.expandirPor" class="w-full">
                  <SelectItem value="NINGUNO">Ninguno</SelectItem>
                  <SelectItem value="EDIFICIO">Edificio</SelectItem>
                  <SelectItem value="ESCALERA">Escalera</SelectItem>
                  <SelectItem value="CUARTO">Cuarto</SelectItem>
                </Select>
              </div>
              <div class="flex flex-col gap-1">
                <Label>Días de la semana</Label>
                <div class="flex gap-2">
                  <label v-for="d in [1,2,3,4,5,6,7]" :key="d" class="flex items-center gap-1 cursor-pointer select-none text-xs">
                    <input type="checkbox" :value="d" v-model="configForm.diasSemana" class="rounded border-input text-primary" />
                    <span>{{ ['L','M','M','J','V','S','D'][d-1] }}</span>
                  </label>
                </div>
                <p class="text-xs text-muted-foreground">Visible para frecuencia semanal.</p>
              </div>
            </div>
            <DialogFooter>
              <DialogClose as-child>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit">
                {{ configEditId ? 'Guardar' : 'Crear' }}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
    </Dialog>

    <!-- Eliminar período -->
    <ConfirmDialog
      v-model:open="confirmarEliminarPeriodoAbierto"
      titulo="Eliminar período"
      :descripcion="`¿Eliminar el período ${formatDate(periodoParaEliminar?.inicio ?? '')} - ${formatDate(periodoParaEliminar?.fin ?? '')}?`"
      :cargando="false"
      confirmLabel="Eliminar"
      @confirmar="confirmarEliminarPeriodo"
    />

    <!-- Eliminar configuración -->
    <ConfirmDialog
      v-model:open="confirmarEliminarConfiguracionAbierto"
      titulo="Eliminar configuración"
      :descripcion="`¿Eliminar la configuración ${configuracionParaEliminar?.nombre}?`"
      :cargando="false"
      confirmLabel="Eliminar"
      @confirmar="eliminarConfiguracionActual"
    />

    <!-- Versionar configuración -->
    <ConfirmDialog
      v-model:open="confirmarVersionarConfiguracionAbierto"
      titulo="Versionar configuración"
      :descripcion="`¿Crear una nueva versión de la configuración ${configuracionParaVersionar?.nombre}?`"
      :cargando="false"
      confirmLabel="Versionar"
      @confirmar="versionarConfiguracionActual"
    />
  </div>
</template>








