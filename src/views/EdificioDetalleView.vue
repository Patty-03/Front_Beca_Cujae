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
  CircleAlertIcon,
  DownloadIcon,
  Layers3Icon,
  PencilIcon,
  PlusIcon,
  TrendingUpIcon,
  UsersIcon,
} from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  eliminarCuarto,
  eliminarEscalera,
  exportarCenso,
  obtenerEdificio,
  obtenerEstadosConstructivos,
} from '@/services/infraestructura'

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
  escaleraEditando.value = null
  escaleraAbierta.value = true
}

function abrirEditarEscalera(escalera: EscaleraResumen) {
  escaleraEditando.value = escalera
  escaleraAbierta.value = true
}

function abrirNuevoCuarto(escalera?: EscaleraResumen) {
  cuartoEditando.value = null
  escaleraInicial.value = escalera?.id
  cuartoAbierto.value = true
}

function abrirEditarCuarto(cuarto: CuartoResumen) {
  cuartoEditando.value = cuarto
  escaleraInicial.value = cuarto.escaleraId
  cuartoAbierto.value = true
}

function solicitarEliminar(tipo: 'escalera' | 'cuarto', entidad: EscaleraResumen | CuartoResumen) {
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
          </div>
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
          <Button @click="editarAbierto = true">
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
        <TabsList class="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="escaleras">Escaleras ({{ escaleras.length }})</TabsTrigger>
          <TabsTrigger value="cuartos">Cuartos ({{ cuartos.length }})</TabsTrigger>
          <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
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
                <Button variant="outline" size="sm" @click="abrirNuevaEscalera">
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
            <Button size="sm" @click="abrirNuevaEscalera">
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
            <Button variant="outline" size="sm" @click="abrirNuevaEscalera">
              <PlusIcon />
              Agregar escalera
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="cuartos" class="space-y-4">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-muted-foreground text-sm">
              {{ cuartos.length }} cuartos registrados en {{ detalle.nombre }}.
            </p>
            <Button size="sm" :disabled="!escaleras.length" @click="abrirNuevoCuarto()">
              <PlusIcon />
              Agregar cuarto
            </Button>
          </div>

          <Card>
            <CardContent class="pt-0">
              <CuartoTable
                v-if="cuartos.length"
                :cuartos="cuartos"
                @editar="abrirEditarCuarto"
                @eliminar="solicitarEliminar('cuarto', $event)"
              />
              <div
                v-else
                class="flex flex-col items-center justify-center gap-2 py-10 text-center"
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
                  v-if="escaleras.length"
                  variant="outline"
                  size="sm"
                  @click="abrirNuevoCuarto()"
                >
                  <PlusIcon />
                  Agregar cuarto
                </Button>
              </div>
            </CardContent>
          </Card>
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
