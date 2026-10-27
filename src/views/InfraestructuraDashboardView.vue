<script setup lang="ts">
import type { EstadoConstructivo, InfraestructuraResumen } from '@/types/infraestructura'
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowRightIcon,
  Building2Icon,
  CircleAlertIcon,
  DoorOpenIcon,
  DownloadIcon,
  HistoryIcon,
  Layers3Icon,
  PlusIcon,
  UsersIcon,
} from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import EdificioDialog from '@/components/infraestructura/EdificioDialog.vue'
import KpiCard from '@/components/infraestructura/KpiCard.vue'
import OcupacionBar from '@/components/infraestructura/OcupacionBar.vue'
import { descargarCsv } from '@/lib/download'
import { colorEstadoConstructivo } from '@/lib/estadoConstructivo'
import { formatDateTime, formatNumber, formatPercent } from '@/lib/format'
import {
  exportarReporteGeneral,
  obtenerEstadosConstructivos,
  obtenerResumen,
} from '@/services/infraestructura'

const resumen = ref<InfraestructuraResumen | null>(null)
const estados = ref<EstadoConstructivo[]>([])
const cargando = ref(true)
const error = ref('')
const dialogoAbierto = ref(false)

const edificiosOrdenados = computed(() =>
  [...(resumen.value?.edificios ?? [])].sort((a, b) => b.ocupacionPct - a.ocupacionPct),
)

const cuartosNoHabitables = computed(
  () =>
    resumen.value?.estados
      .filter((item) => !item.estado.habitable)
      .reduce((total, item) => total + item.cuartos, 0) ?? 0,
)

const donutStyle = computed(() => {
  const datos = resumen.value?.estados ?? []
  const total = datos.reduce((suma, item) => suma + item.cuartos, 0)
  if (total === 0) return { background: 'var(--muted)' }

  let acumulado = 0
  const segmentos = datos.map((item) => {
    const inicio = (acumulado / total) * 100
    acumulado += item.cuartos
    const fin = (acumulado / total) * 100
    return `${colorEstadoConstructivo(item.estado.nombre)} ${inicio}% ${fin}%`
  })

  return { background: `conic-gradient(${segmentos.join(', ')})` }
})

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const [datos, catalogo] = await Promise.all([
      obtenerResumen(),
      obtenerEstadosConstructivos(),
    ])
    resumen.value = datos
    estados.value = catalogo
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo cargar el dashboard.'
  } finally {
    cargando.value = false
  }
}

async function exportar() {
  try {
    const csv = await exportarReporteGeneral()
    descargarCsv('reporte-infraestructura.csv', csv)
    toast.success('Reporte exportado', {
      description: 'Se descargó el resumen general en formato CSV.',
    })
  } catch (e) {
    toast.error('No se pudo exportar el reporte', {
      description: e instanceof Error ? e.message : undefined,
    })
  }
}

onMounted(cargar)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Dashboard de infraestructura</h1>
        <p class="text-muted-foreground mt-1 text-sm">
          Estado consolidado de edificios, escaleras y cuartos de la residencia.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" :disabled="cargando" @click="exportar">
          <DownloadIcon />
          Exportar reporte
        </Button>
        <Button @click="dialogoAbierto = true">
          <PlusIcon />
          Nuevo edificio
        </Button>
      </div>
    </div>

    <Alert v-if="error" variant="destructive">
      <CircleAlertIcon />
      <AlertTitle>No se pudo cargar la información</AlertTitle>
      <AlertDescription>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>{{ error }}</span>
          <Button variant="outline" size="sm" @click="cargar">Reintentar</Button>
        </div>
      </AlertDescription>
    </Alert>

    <div v-if="cargando" class="space-y-6">
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton v-for="indice in 4" :key="indice" class="h-28 rounded-xl" />
      </div>
      <div class="grid gap-4 lg:grid-cols-5">
        <Skeleton class="h-80 rounded-xl lg:col-span-3" />
        <Skeleton class="h-80 rounded-xl lg:col-span-2" />
      </div>
    </div>

    <template v-else-if="resumen">
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Edificios"
          :value="resumen.totalEdificios"
          :detail="`${resumen.totalEscaleras} escaleras registradas`"
          :icon="Building2Icon"
          tono="primary"
        />
        <KpiCard
          label="Cuartos"
          :value="formatNumber(resumen.totalCuartos)"
          :detail="`${formatNumber(cuartosNoHabitables)} no habitables`"
          :icon="DoorOpenIcon"
          tono="sky"
        />
        <KpiCard
          label="Capacidad"
          :value="formatNumber(resumen.capacidadTotal)"
          detail="Plazas de alojamiento"
          :icon="Layers3Icon"
          tono="emerald"
        />
        <KpiCard
          label="Ocupación"
          :value="formatPercent(resumen.ocupacionPct)"
          :detail="`${formatNumber(resumen.ocupados)} plazas ocupadas`"
          :icon="UsersIcon"
          tono="amber"
        />
      </div>

      <div class="grid gap-4 lg:grid-cols-5">
        <Card class="lg:col-span-3">
          <CardHeader>
            <CardTitle>Ocupación por edificio</CardTitle>
            <CardDescription>Plazas ocupadas sobre la capacidad instalada.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div v-for="edificio in edificiosOrdenados" :key="edificio.id" class="space-y-1.5">
              <div class="flex items-center justify-between gap-3 text-sm">
                <RouterLink
                  :to="`/infraestructura/edificios/${edificio.id}`"
                  class="hover:text-primary truncate font-medium transition-colors"
                >
                  {{ edificio.nombre }}
                </RouterLink>
                <span class="text-muted-foreground shrink-0 text-xs tabular-nums">
                  {{ formatPercent(edificio.ocupacionPct) }}
                </span>
              </div>
              <OcupacionBar
                :ocupados="edificio.ocupados"
                :capacidad="edificio.capacidad"
                compacto
              />
            </div>
            <p v-if="!edificiosOrdenados.length" class="text-muted-foreground text-sm">
              No hay edificios registrados.
            </p>
          </CardContent>
        </Card>

        <Card class="lg:col-span-2">
          <CardHeader>
            <CardTitle>Estado constructivo</CardTitle>
            <CardDescription>Distribución de cuartos por estado.</CardDescription>
          </CardHeader>
          <CardContent class="flex flex-col items-center gap-5 sm:flex-row lg:flex-col">
            <div
              class="relative size-36 shrink-0 rounded-full"
              :style="donutStyle"
              role="img"
              aria-label="Distribución de cuartos por estado constructivo"
            >
              <div
                class="bg-card absolute inset-8 flex flex-col items-center justify-center rounded-full"
              >
                <span class="text-2xl font-semibold tabular-nums">
                  {{ formatNumber(resumen.totalCuartos) }}
                </span>
                <span class="text-muted-foreground text-xs">cuartos</span>
              </div>
            </div>

            <div class="w-full min-w-0 space-y-2">
              <div
                v-for="item in resumen.estados"
                :key="item.estado.id"
                class="flex items-center justify-between gap-3 text-sm"
              >
                <div class="flex min-w-0 items-center gap-2">
                  <span
                    class="size-2.5 shrink-0 rounded-full"
                    :style="{ backgroundColor: colorEstadoConstructivo(item.estado.nombre) }"
                  />
                  <span class="truncate">{{ item.estado.nombre }}</span>
                </div>
                <span class="text-muted-foreground shrink-0 text-xs tabular-nums">
                  {{ item.cuartos }} ·
                  {{ formatPercent((item.cuartos / resumen.totalCuartos) * 100) }}
                </span>
              </div>
              <p v-if="!resumen.estados.length" class="text-muted-foreground text-sm">
                No hay cuartos registrados.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="grid gap-4 lg:grid-cols-5">
        <Card class="lg:col-span-3">
          <CardHeader>
            <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Cambios recientes</CardTitle>
                <CardDescription>Últimas acciones registradas en auditoría.</CardDescription>
              </div>
              <Button as-child variant="ghost" size="sm" class="self-start">
                <RouterLink to="/infraestructura/edificios">
                  Ver edificios
                  <ArrowRightIcon />
                </RouterLink>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div v-if="resumen.eventos.length" class="divide-y">
              <div
                v-for="evento in resumen.eventos"
                :key="evento.id"
                class="flex gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div
                  class="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full"
                >
                  <HistoryIcon class="size-4" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm">{{ evento.funcionalidad }}</p>
                  <p class="text-muted-foreground mt-0.5 text-xs">
                    {{ evento.usuario }} · {{ formatDateTime(evento.fecha) }}
                  </p>
                </div>
              </div>
            </div>
            <p v-else class="text-muted-foreground text-sm">
              No hay cambios registrados todavía.
            </p>
          </CardContent>
        </Card>

        <Card class="lg:col-span-2">
          <CardHeader>
            <CardTitle>Acciones rápidas</CardTitle>
            <CardDescription>Atajos para las tareas más frecuentes.</CardDescription>
          </CardHeader>
          <CardContent class="grid gap-2">
            <Button variant="outline" class="justify-start" @click="dialogoAbierto = true">
              <PlusIcon />
              Registrar edificio
            </Button>
            <Button as-child variant="outline" class="justify-start">
              <RouterLink to="/infraestructura/edificios">
                <Building2Icon />
                Ver inventario
              </RouterLink>
            </Button>
            <Button variant="outline" class="justify-start" @click="exportar">
              <DownloadIcon />
              Exportar reporte
            </Button>
          </CardContent>
        </Card>
      </div>
    </template>

    <EdificioDialog
      v-model:open="dialogoAbierto"
      :estados="estados"
      @guardado="cargar"
    />
  </div>
</template>
