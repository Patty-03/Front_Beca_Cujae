<script setup lang="ts">
import type {
  CuartoResumen,
  EdificioDetalle,
  EscaleraResumen,
  EstadoConstructivo,
} from '@/types/infraestructura'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  ArrowLeftIcon,
  Building2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  DoorOpenIcon,
  DownloadIcon,
  Layers3Icon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrendingUpIcon,
  UsersIcon,
} from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ConfirmDialog from '@/components/infraestructura/ConfirmDialog.vue'
import CuartoDialog from '@/components/infraestructura/CuartoDialog.vue'
import CuartoTable from '@/components/infraestructura/CuartoTable.vue'
import EdificioDialog from '@/components/infraestructura/EdificioDialog.vue'
import EscaleraCard from '@/components/infraestructura/EscaleraCard.vue'
import EscaleraDialog from '@/components/infraestructura/EscaleraDialog.vue'
import EstadoConstructivoBadge from '@/components/infraestructura/EstadoConstructivoBadge.vue'
import KpiCard from '@/components/infraestructura/KpiCard.vue'
import OcupacionBar from '@/components/infraestructura/OcupacionBar.vue'
import { descargarCsv } from '@/lib/download'
import { colorEstadoConstructivo } from '@/lib/estadoConstructivo'
import { formatNumber, formatPercent } from '@/lib/format'
import { normalizarParaComparar } from '@/lib/validation'
import {
  eliminarCuarto,
  eliminarEscalera,
  exportarCenso,
  obtenerEdificio,
  obtenerEstadosConstructivos,
} from '@/services/infraestructura'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const puedeEscribir = computed(() => auth.can('infraestructura:write'))
const route = useRoute()
const id = computed(() => Number(route.params.id))

const detalle = ref<EdificioDetalle | null>(null)
const estados = ref<EstadoConstructivo[]>([])
const cargando = ref(true)
const error = ref('')
const tab = ref('general')

const editarAbierto = ref(false)
const escaleraAbierta = ref(false)
const cuartoAbierto = ref(false)
const escaleraEditando = ref<EscaleraResumen | null>(null)
const cuartoEditando = ref<CuartoResumen | null>(null)
const escaleraInicial = ref<number | undefined>(undefined)

const confirmacionAbierta = ref(false)
const entidadEliminando = ref<{
  tipo: 'escalera' | 'cuarto'
  id: number
  nombre: string
} | null>(null)
const eliminando = ref(false)

const escaleras = computed(() => detalle.value?.escalerasDetalle ?? [])
const cuartos = computed(() => detalle.value?.cuartosDetalle ?? [])
const cuartosNoHabitables = computed(
  () => cuartos.value.filter((cuarto) => !cuarto.estado.habitable).length,
)

const busquedaCuarto = ref('')
const estadoCuartoFiltro = ref('todos')
const escaleraCuartoFiltro = ref('todas')
const ordenCuarto = ref('nombre')
const paginaCuartos = ref(1)
const TAMANO_PAGINA_CUARTOS = 12

const cuartosFiltrados = computed(() => {
  const texto = normalizarParaComparar(busquedaCuarto.value)
  const filtrados = cuartos.value.filter((cuarto) => {
    const coincideTexto = !texto || normalizarParaComparar(cuarto.nombre).includes(texto)
    const coincideEstado =
      estadoCuartoFiltro.value === 'todos' || String(cuarto.estado.id) === estadoCuartoFiltro.value
    const coincideEscalera =
      escaleraCuartoFiltro.value === 'todas' ||
      String(cuarto.escaleraId) === escaleraCuartoFiltro.value
    return coincideTexto && coincideEstado && coincideEscalera
  })

  return [...filtrados].sort((a, b) => {
    if (ordenCuarto.value === 'ocupacion') return b.ocupacionPct - a.ocupacionPct
    if (ordenCuarto.value === 'capacidad') return b.capacidadMaxima - a.capacidadMaxima
    return a.nombre.localeCompare(b.nombre, 'es', { numeric: true })
  })
})

const totalPaginasCuartos = computed(() =>
  Math.max(1, Math.ceil(cuartosFiltrados.value.length / TAMANO_PAGINA_CUARTOS)),
)

const cuartosPagina = computed(() => {
  const inicio = (paginaCuartos.value - 1) * TAMANO_PAGINA_CUARTOS
  return cuartosFiltrados.value.slice(inicio, inicio + TAMANO_PAGINA_CUARTOS)
})

const hayFiltrosCuarto = computed(
  () =>
    busquedaCuarto.value.trim() !== '' ||
    estadoCuartoFiltro.value !== 'todos' ||
    escaleraCuartoFiltro.value !== 'todas' ||
    ordenCuarto.value !== 'nombre',
)

const inicioPaginaCuartos = computed(() =>
  cuartosFiltrados.value.length === 0
    ? 0
    : (paginaCuartos.value - 1) * TAMANO_PAGINA_CUARTOS + 1,
)

const finPaginaCuartos = computed(() =>
  Math.min(paginaCuartos.value * TAMANO_PAGINA_CUARTOS, cuartosFiltrados.value.length),
)

function limpiarFiltrosCuarto() {
  busquedaCuarto.value = ''
  estadoCuartoFiltro.value = 'todos'
  escaleraCuartoFiltro.value = 'todas'
  ordenCuarto.value = 'nombre'
}

watch([busquedaCuarto, estadoCuartoFiltro, escaleraCuartoFiltro, ordenCuarto], () => {
  paginaCuartos.value = 1
})

watch(totalPaginasCuartos, (total) => {
  if (paginaCuartos.value > total) paginaCuartos.value = total
})

const distribucionEstados = computed(() => {
  const mapa = new Map<number, { estado: EstadoConstructivo; cuartos: number }>()
  for (const cuarto of cuartos.value) {
    const actual = mapa.get(cuarto.estado.id)
    if (actual) {
      actual.cuartos++
    } else {
      mapa.set(cuarto.estado.id, { estado: cuarto.estado, cuartos: 1 })
    }
  }
  return [...mapa.values()].sort((a, b) => b.cuartos - a.cuartos)
})

const tituloConfirmacion = computed(() =>
  entidadEliminando.value?.tipo === 'escalera' ? 'Eliminar escalera' : 'Eliminar cuarto',
)

const descripcionConfirmacion = computed(() =>
  entidadEliminando.value
    ? `¿Seguro que deseas eliminar ${entidadEliminando.value.nombre}? Esta acción no se puede deshacer.`
    : '',
)

async function cargar() {
  const identificador = id.value
  if (!Number.isFinite(identificador) || identificador <= 0) {
    error.value = 'El edificio solicitado no es válido.'
    cargando.value = false
    return
  }

  cargando.value = true
  error.value = ''
  try {
    const [datos, catalogo] = await Promise.all([
      obtenerEdificio(identificador),
      obtenerEstadosConstructivos(),
    ])
    detalle.value = datos
    estados.value = catalogo
  } catch (e) {
    detalle.value = null
    error.value = e instanceof Error ? e.message : 'No se pudo cargar el edificio.'
  } finally {
    cargando.value = false
  }
}

function abrirNuevaEscalera() {
  if (!puedeEscribir.value) return
  escaleraEditando.value = null
  escaleraAbierta.value = true
}

function abrirEditarEscalera(escalera: EscaleraResumen) {
  if (!puedeEscribir.value) return
  escaleraEditando.value = escalera
  escaleraAbierta.value = true
}

function abrirNuevoCuarto(escalera?: EscaleraResumen) {
  if (!puedeEscribir.value) return
  cuartoEditando.value = null
  escaleraInicial.value = escalera?.id
  cuartoAbierto.value = true
}

function abrirEditarCuarto(cuarto: CuartoResumen) {
  if (!puedeEscribir.value) return
  cuartoEditando.value = cuarto
  escaleraInicial.value = cuarto.escaleraId
  cuartoAbierto.value = true
}

function solicitarEliminar(tipo: 'escalera' | 'cuarto', entidad: EscaleraResumen | CuartoResumen) {
  if (!puedeEscribir.value) return

  if (tipo === 'escalera' && 'cuartos' in entidad && entidad.cuartos > 0) {
    toast.error('No se puede eliminar la escalera', {
      description: 'Primero debe eliminar los cuartos registrados.',
    })
    return
  }

  if (tipo === 'cuarto' && 'tieneAlojamientos' in entidad && entidad.tieneAlojamientos) {
    toast.error('No se puede eliminar el cuarto', {
      description: 'Tiene alojamientos asociados.',
    })
    return
  }

  entidadEliminando.value = { tipo, id: entidad.id, nombre: entidad.nombre }
  confirmacionAbierta.value = true
}

async function confirmarEliminacion() {
  const entidad = entidadEliminando.value
  if (!entidad) return

  eliminando.value = true
  try {
    if (entidad.tipo === 'escalera') {
      await eliminarEscalera(entidad.id)
    } else {
      await eliminarCuarto(entidad.id)
    }
    toast.success(entidad.tipo === 'escalera' ? 'Escalera eliminada' : 'Cuarto eliminado', {
      description: entidad.nombre,
    })
    confirmacionAbierta.value = false
    entidadEliminando.value = null
    await cargar()
  } catch (e) {
    toast.error('No se pudo eliminar el registro', {
      description: e instanceof Error ? e.message : undefined,
    })
  } finally {
    eliminando.value = false
  }
}

async function alGuardarEscalera() {
  escaleraEditando.value = null
  tab.value = 'escaleras'
  await cargar()
}

async function alGuardarCuarto() {
  cuartoEditando.value = null
  tab.value = 'cuartos'
  await cargar()
}

async function exportar() {
  if (!detalle.value) return
  try {
    const csv = await exportarCenso(detalle.value.id)
    const nombre = detalle.value.nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    descargarCsv(`censo-${nombre || 'edificio'}.csv`, csv)
    toast.success('Censo exportado', {
      description: `Se descargó el censo de ${detalle.value.nombre}.`,
    })
  } catch (e) {
    toast.error('No se pudo exportar el censo', {
      description: e instanceof Error ? e.message : undefined,
    })
  }
}

watch(id, cargar, { immediate: true })
</script>

<template>
  <div class="space-y-6">
    <RouterLink
      to="/infraestructura/edificios"
      class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
    >
      <ArrowLeftIcon class="size-4" />
      Volver a edificios
    </RouterLink>

    <Alert v-if="error" variant="destructive">
      <CircleAlertIcon />
      <AlertTitle>No se pudo cargar el edificio</AlertTitle>
      <AlertDescription>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>{{ error }}</span>
          <Button variant="outline" size="sm" @click="cargar">Reintentar</Button>
        </div>
      </AlertDescription>
    </Alert>

    <div v-if="cargando" class="space-y-6">
      <div class="space-y-2">
        <Skeleton class="h-8 w-56" />
        <Skeleton class="h-4 w-80 max-w-full" />
      </div>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton v-for="indice in 4" :key="indice" class="h-28 rounded-xl" />
      </div>
      <Skeleton class="h-96 rounded-xl" />
    </div>

    <template v-else-if="detalle">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="min-w-0 space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-2xl font-semibold tracking-tight">{{ detalle.nombre }}</h1>
            <EstadoConstructivoBadge :estado="detalle.estado" />
            <span v-if="detalle.estadoManual" class="text-xs font-medium text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Estado fijado manualmente
            </span>
          </div>
          <p v-if="detalle.observacionEstado" class="text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg border">
            <span class="font-medium text-foreground">Observación:</span> {{ detalle.observacionEstado }}
          </p>
          <p class="text-muted-foreground text-sm">
            {{ detalle.escaleras }} escaleras · {{ formatNumber(detalle.cuartos) }} cuartos ·
            {{ formatNumber(detalle.capacidad) }} plazas
          </p>
          <p class="text-muted-foreground text-xs">
            Ocupación actual: {{ formatNumber(detalle.ocupados) }} de
            {{ formatNumber(detalle.capacidad) }} plazas
            ({{ formatPercent(detalle.ocupacionPct) }}).
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button variant="outline" :disabled="cargando" @click="exportar">
            <DownloadIcon />
            Exportar censo
          </Button>
          <Button v-if="puedeEscribir" @click="editarAbierto = true">
            <PencilIcon />
            Editar edificio
          </Button>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Capacidad"
          :value="formatNumber(detalle.capacidad)"
          detail="Plazas de alojamiento"
          :icon="Layers3Icon"
          tono="emerald"
        />
        <KpiCard
          label="Ocupados"
          :value="formatNumber(detalle.ocupados)"
          detail="Plazas con alojamiento activo"
          :icon="UsersIcon"
          tono="sky"
        />
        <KpiCard
          label="Ocupación"
          :value="formatPercent(detalle.ocupacionPct)"
          detail="Uso de la capacidad instalada"
          :icon="TrendingUpIcon"
          tono="primary"
        />
        <KpiCard
          label="No habitables"
          :value="formatNumber(cuartosNoHabitables)"
          detail="Cuartos fuera de uso"
          :icon="CircleAlertIcon"
          tono="amber"
        />
      </div>

      <Tabs v-model="tab" class="space-y-4">
        <TabsList
          variant="line"
          class="w-full justify-start gap-1 overflow-x-auto rounded-none border-b bg-transparent p-0!"
        >
          <TabsTrigger value="general" class="flex-none! gap-2 px-3">
            <Building2Icon />
            General
          </TabsTrigger>
          <TabsTrigger value="escaleras" class="flex-none! gap-2 px-3">
            <Layers3Icon />
            Escaleras
            <span
              class="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums"
            >
              {{ escaleras.length }}
            </span>
          </TabsTrigger>
          <TabsTrigger value="cuartos" class="flex-none! gap-2 px-3">
            <DoorOpenIcon />
            Cuartos
            <span
              class="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums"
            >
              {{ cuartos.length }}
            </span>
          </TabsTrigger>
          <TabsTrigger value="estadisticas" class="flex-none! gap-2 px-3">
            <TrendingUpIcon />
            Estadísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" class="space-y-4">
          <div class="grid gap-4 lg:grid-cols-3">
            <Card class="lg:col-span-2">
              <CardHeader>
                <CardTitle>Resumen del edificio</CardTitle>
                <CardDescription>
                  Indicadores generales de capacidad y ocupación.
                </CardDescription>
              </CardHeader>
              <CardContent class="grid gap-4 sm:grid-cols-2">
                <div class="bg-muted/40 rounded-lg border p-4">
                  <p class="text-muted-foreground text-xs uppercase">Escaleras</p>
                  <p class="mt-1 text-xl font-semibold tabular-nums">{{ escaleras.length }}</p>
                </div>
                <div class="bg-muted/40 rounded-lg border p-4">
                  <p class="text-muted-foreground text-xs uppercase">Cuartos</p>
                  <p class="mt-1 text-xl font-semibold tabular-nums">
                    {{ formatNumber(detalle.cuartos) }}
                  </p>
                </div>
                <div class="bg-muted/40 rounded-lg border p-4">
                  <p class="text-muted-foreground text-xs uppercase">Capacidad total</p>
                  <p class="mt-1 text-xl font-semibold tabular-nums">
                    {{ formatNumber(detalle.capacidad) }}
                  </p>
                </div>
                <div class="bg-muted/40 rounded-lg border p-4">
                  <p class="text-muted-foreground text-xs uppercase">Plazas ocupadas</p>
                  <p class="mt-1 text-xl font-semibold tabular-nums">
                    {{ formatNumber(detalle.ocupados) }}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución por estado</CardTitle>
                <CardDescription>Cuartos según su estado constructivo.</CardDescription>
              </CardHeader>
              <CardContent class="space-y-3">
                <div
                  v-for="item in distribucionEstados"
                  :key="item.estado.id"
                  class="space-y-1"
                >
                  <div class="flex items-center justify-between gap-3 text-sm">
                    <div class="flex min-w-0 items-center gap-2">
                      <span
                        class="size-2.5 shrink-0 rounded-full"
                        :style="{
                          backgroundColor: colorEstadoConstructivo(item.estado.nombre),
                        }"
                      />
                      <span class="truncate">{{ item.estado.nombre }}</span>
                    </div>
                    <span class="text-muted-foreground shrink-0 text-xs tabular-nums">
                      {{ item.cuartos }} ·
                      {{ formatPercent((item.cuartos / detalle.cuartos) * 100) }}
                    </span>
                  </div>
                  <div class="bg-muted h-1.5 overflow-hidden rounded-full">
                    <div
                      class="h-full rounded-full"
                      :style="{
                        width: `${(item.cuartos / detalle.cuartos) * 100}%`,
                        backgroundColor: colorEstadoConstructivo(item.estado.nombre),
                      }"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>Escaleras del edificio</CardTitle>
                  <CardDescription>Acceso rápido a la ocupación por escalera.</CardDescription>
                </div>
                <Button
                  v-if="puedeEscribir"
                  variant="outline"
                  size="sm"
                  @click="abrirNuevaEscalera"
                >
                  <PlusIcon />
                  Agregar escalera
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div v-if="escaleras.length" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div
                  v-for="escalera in escaleras"
                  :key="escalera.id"
                  class="bg-muted/40 space-y-2 rounded-lg border p-3"
                >
                  <p class="truncate text-sm font-medium">{{ escalera.nombre }}</p>
                  <OcupacionBar
                    :ocupados="escalera.ocupados"
                    :capacidad="escalera.capacidad"
                    :etiqueta="`Ocupación de la escalera ${escalera.nombre}`"
                    compacto
                  />
                </div>
              </div>
              <p v-else class="text-muted-foreground text-sm">
                Este edificio todavía no tiene escaleras registradas.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escaleras" class="space-y-4">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-muted-foreground text-sm">
              {{ escaleras.length }} escaleras registradas en {{ detalle.nombre }}.
            </p>
            <Button v-if="puedeEscribir" size="sm" @click="abrirNuevaEscalera">
              <PlusIcon />
              Agregar escalera
            </Button>
          </div>

          <div v-if="escaleras.length" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <EscaleraCard
              v-for="escalera in escaleras"
              :key="escalera.id"
              :escalera="escalera"
              @editar="abrirEditarEscalera"
              @eliminar="solicitarEliminar('escalera', $event)"
              @agregar-cuarto="abrirNuevoCuarto"
            />
          </div>

          <div
            v-else
            class="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center"
          >
            <Building2Icon class="text-muted-foreground size-6" />
            <p class="font-medium">Sin escaleras registradas</p>
            <p class="text-muted-foreground text-sm">
              Agrega la primera escalera para organizar los cuartos del edificio.
            </p>
            <Button
              v-if="puedeEscribir"
              variant="outline"
              size="sm"
              @click="abrirNuevaEscalera"
            >
              <PlusIcon />
              Agregar escalera
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="cuartos" class="space-y-4">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0 space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-base font-semibold">Cuartos</h2>
                <span
                  class="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium tabular-nums"
                >
                  {{ cuartosFiltrados.length }} de {{ cuartos.length }}
                </span>
              </div>
              <p class="text-muted-foreground text-sm">
                Administra los cuartos del edificio {{ detalle.nombre }}.
              </p>
            </div>
            <Button
              v-if="puedeEscribir"
              size="sm"
              :disabled="!escaleras.length"
              :title="!escaleras.length ? 'Primero registra una escalera' : undefined"
              @click="abrirNuevoCuarto()"
            >
              <PlusIcon />
              Agregar cuarto
            </Button>
          </div>

          <div class="bg-card rounded-xl border p-3">
            <div class="flex flex-col gap-2 xl:flex-row xl:items-center">
              <div class="relative min-w-0 xl:max-w-xs xl:flex-1">
                <SearchIcon
                  class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
                />
                <Input
                  v-model="busquedaCuarto"
                  class="pl-8"
                  placeholder="Buscar por nombre"
                  aria-label="Buscar cuarto por nombre"
                />
              </div>

              <div
                class="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:flex xl:flex-1 xl:items-center"
              >
                <Select v-model="estadoCuartoFiltro">
                  <SelectTrigger
                    class="w-full xl:w-40"
                    aria-label="Filtrar cuartos por estado"
                  >
                    <SelectValue placeholder="Estado constructivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem
                      v-for="estado in estados"
                      :key="estado.id"
                      :value="String(estado.id)"
                    >
                      {{ estado.nombre }}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select v-model="escaleraCuartoFiltro">
                  <SelectTrigger
                    class="w-full xl:w-40"
                    aria-label="Filtrar cuartos por escalera"
                  >
                    <SelectValue placeholder="Escalera" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las escaleras</SelectItem>
                    <SelectItem
                      v-for="escalera in escaleras"
                      :key="escalera.id"
                      :value="String(escalera.id)"
                    >
                      {{ escalera.nombre }}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select v-model="ordenCuarto">
                  <SelectTrigger class="w-full xl:w-40" aria-label="Ordenar cuartos">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nombre">Nombre (A-Z)</SelectItem>
                    <SelectItem value="ocupacion">Mayor ocupación</SelectItem>
                    <SelectItem value="capacidad">Mayor capacidad</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                v-if="hayFiltrosCuarto"
                variant="ghost"
                size="sm"
                class="self-start xl:ml-auto"
                @click="limpiarFiltrosCuarto"
              >
                Limpiar filtros
              </Button>
            </div>
          </div>

          <div class="bg-card overflow-hidden rounded-xl border">
            <CuartoTable
              v-if="cuartosPagina.length"
              :cuartos="cuartosPagina"
              @editar="abrirEditarCuarto"
              @eliminar="solicitarEliminar('cuarto', $event)"
            />
            <div
              v-else-if="cuartos.length"
              class="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center"
            >
              <p class="font-medium">No hay cuartos que coincidan</p>
              <p class="text-muted-foreground text-sm">
                Ajusta la búsqueda o los filtros para ver otros resultados.
              </p>
              <Button variant="outline" size="sm" @click="limpiarFiltrosCuarto">
                Limpiar filtros
              </Button>
            </div>
            <div
              v-else
              class="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center"
            >
              <p class="font-medium">Sin cuartos registrados</p>
              <p class="text-muted-foreground text-sm">
                {{
                  escaleras.length
                    ? 'Agrega el primer cuarto para completar el inventario.'
                    : 'Primero debes registrar una escalera.'
                }}
              </p>
              <Button
                v-if="escaleras.length && puedeEscribir"
                variant="outline"
                size="sm"
                @click="abrirNuevoCuarto()"
              >
                <PlusIcon />
                Agregar cuarto
              </Button>
            </div>

            <div
              v-if="cuartosPagina.length"
              class="flex flex-col gap-2 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <p class="text-muted-foreground text-xs">
                Mostrando {{ inicioPaginaCuartos }}–{{ finPaginaCuartos }} de
                {{ cuartosFiltrados.length }}
                {{ cuartosFiltrados.length === 1 ? 'cuarto' : 'cuartos' }}
              </p>
              <div v-if="totalPaginasCuartos > 1" class="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  :disabled="paginaCuartos <= 1"
                  @click="paginaCuartos--"
                >
                  <ChevronLeftIcon />
                  Anterior
                </Button>
                <span class="text-muted-foreground text-xs tabular-nums">
                  Página {{ paginaCuartos }} de {{ totalPaginasCuartos }}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  :disabled="paginaCuartos >= totalPaginasCuartos"
                  @click="paginaCuartos++"
                >
                  Siguiente
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="estadisticas" class="space-y-4">
          <div class="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Ocupación por escalera</CardTitle>
                <CardDescription>Comparación de plazas ocupadas y disponibles.</CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <div v-for="escalera in escaleras" :key="escalera.id" class="space-y-1.5">
                  <div class="flex items-center justify-between gap-3 text-sm">
                    <span class="truncate font-medium">{{ escalera.nombre }}</span>
                    <span class="text-muted-foreground shrink-0 text-xs tabular-nums">
                      {{ formatPercent(escalera.ocupacionPct) }}
                    </span>
                  </div>
                  <OcupacionBar
                    :ocupados="escalera.ocupados"
                    :capacidad="escalera.capacidad"
                    :etiqueta="`Ocupación de la escalera ${escalera.nombre}`"
                    compacto
                  />
                </div>
                <p v-if="!escaleras.length" class="text-muted-foreground text-sm">
                  No hay escaleras para mostrar.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución por estado</CardTitle>
                <CardDescription>Porcentaje de cuartos según su estado.</CardDescription>
              </CardHeader>
              <CardContent class="space-y-3">
                <div
                  v-for="item in distribucionEstados"
                  :key="item.estado.id"
                  class="space-y-1"
                >
                  <div class="flex items-center justify-between gap-3 text-sm">
                    <div class="flex min-w-0 items-center gap-2">
                      <span
                        class="size-2.5 shrink-0 rounded-full"
                        :style="{
                          backgroundColor: colorEstadoConstructivo(item.estado.nombre),
                        }"
                      />
                      <span class="truncate">{{ item.estado.nombre }}</span>
                    </div>
                    <span class="text-muted-foreground shrink-0 text-xs tabular-nums">
                      {{ item.cuartos }} cuartos
                    </span>
                  </div>
                  <div class="bg-muted h-1.5 overflow-hidden rounded-full">
                    <div
                      class="h-full rounded-full"
                      :style="{
                        width: `${(item.cuartos / detalle.cuartos) * 100}%`,
                        backgroundColor: colorEstadoConstructivo(item.estado.nombre),
                      }"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </template>

    <EdificioDialog
      v-model:open="editarAbierto"
      :estados="estados"
      :edificio="detalle"
      @guardado="cargar"
    />

    <EscaleraDialog
      v-model:open="escaleraAbierta"
      :edificio-id="id"
      :escalera="escaleraEditando"
      @guardado="alGuardarEscalera"
    />

    <CuartoDialog
      v-model:open="cuartoAbierto"
      :estados="estados"
      :escaleras="escaleras"
      :cuarto="cuartoEditando"
      :escalera-id-inicial="escaleraInicial"
      @guardado="alGuardarCuarto"
    />

    <ConfirmDialog
      v-model:open="confirmacionAbierta"
      :titulo="tituloConfirmacion"
      :descripcion="descripcionConfirmacion"
      :cargando="eliminando"
      @confirmar="confirmarEliminacion"
    />
  </div>
</template>
