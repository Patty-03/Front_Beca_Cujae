<script setup lang="ts">
import type {
  AsignacionLeer,
  OcurrenciaLeer,
  PeriodoLeer,
} from '@/types/planificacion'
import { computed, onMounted, ref } from 'vue'
import {
  AlertCircleIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LoaderCircleIcon,
  RefreshCwIcon,
  UsersIcon,
  XCircleIcon,
} from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import KpiCard from '@/components/infraestructura/KpiCard.vue'
import OcurrenciaSheet from './OcurrenciaSheet.vue'
import { listarAsignaciones, listarOcurrencias } from '@/services/planificacion'
import { formatDate, formatNumber } from '@/lib/format'
import {
  diasDelMes,
  nombreMes,
  rangoMes,
  sumarMes,
  type DiaCalendario,
} from '@/lib/calendario'
import { hoyIso, parseFecha } from '@/lib/planificacion'
import { cn } from 'cn'

const props = defineProps<{ periodo: PeriodoLeer }>()
const emit = defineEmits<{ actualizado: [] }>()

const inicial = referenciarMesInicial()
const anio = ref(inicial.anio)
const mes = ref(inicial.mes)
const ocurrencias = ref<OcurrenciaLeer[]>([])
const asignaciones = ref<AsignacionLeer[]>([])
const cargando = ref(true)
const error = ref('')
const fechaSeleccionada = ref<string | null>(null)
const ocurrenciaSeleccionada = ref<OcurrenciaLeer | null>(null)
const sheetAbierto = ref(false)

function referenciarMesInicial() {
  const hoy = hoyIso()
  const base =
    hoy >= props.periodo.inicio && hoy <= props.periodo.fin ? hoy : props.periodo.inicio
  const fecha = parseFecha(base)
  return { anio: fecha.getFullYear(), mes: fecha.getMonth() + 1 }
}

const tituloMes = computed(() => nombreMes(anio.value, mes.value))
const celdas = computed(() => diasDelMes(anio.value, mes.value))
const resumen = computed(() => ({
  ocurrencias: ocurrencias.value.length,
  bajoCupo: ocurrencias.value.filter(
    (item) =>
      !item.cancelada &&
      item.cantPersonas != null &&
      item.asignados < item.cantPersonas,
  ).length,
  canceladas: ocurrencias.value.filter((item) => item.cancelada).length,
  asignaciones: asignaciones.value.length,
}))
const ocurrenciasFiltradas = computed(() =>
  fechaSeleccionada.value
    ? ocurrencias.value.filter((item) => item.fecha === fechaSeleccionada.value)
    : ocurrencias.value,
)
const ocurrenciasPorFecha = computed(() => {
  const mapa: Record<string, OcurrenciaLeer[]> = {}
  for (const ocurrencia of ocurrencias.value) {
    const lista = mapa[ocurrencia.fecha] ?? []
    lista.push(ocurrencia)
    mapa[ocurrencia.fecha] = lista
  }
  return mapa
})

function ocurrenciasDe(fecha: string): OcurrenciaLeer[] {
  return ocurrenciasPorFecha.value[fecha] ?? []
}

function diaTieneBajoCupo(fecha: string): boolean {
  return ocurrenciasDe(fecha).some(
    (item) =>
      !item.cancelada &&
      item.cantPersonas != null &&
      item.asignados < item.cantPersonas,
  )
}

function diaTieneCancelada(fecha: string): boolean {
  return ocurrenciasDe(fecha).some((item) => item.cancelada)
}

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const rango = rangoMes(anio.value, mes.value)
    const [ocurrenciasMes, asignacionesMes] = await Promise.all([
      listarOcurrencias({
        periodoPlanificacionId: props.periodo.id,
        desde: rango.desde,
        hasta: rango.hasta,
      }),
      listarAsignaciones({
        periodoPlanificacionId: props.periodo.id,
        desde: rango.desde,
        hasta: rango.hasta,
      }),
    ])
    ocurrencias.value = ocurrenciasMes
    asignaciones.value = asignacionesMes
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : 'No se pudo cargar el calendario.'
  } finally {
    cargando.value = false
  }
}

function cambiarMes(delta: number) {
  const siguiente = sumarMes(anio.value, mes.value, delta)
  anio.value = siguiente.anio
  mes.value = siguiente.mes
  fechaSeleccionada.value = null
  void cargar()
}

function irAHoy() {
  const hoy = hoyIso()
  const fecha = parseFecha(hoy)
  anio.value = fecha.getFullYear()
  mes.value = fecha.getMonth() + 1
  fechaSeleccionada.value = hoy
  void cargar()
}

function seleccionarDia(dia: DiaCalendario) {
  if (!dia.esDelMes) {
    const fecha = parseFecha(dia.fecha)
    anio.value = fecha.getFullYear()
    mes.value = fecha.getMonth() + 1
    fechaSeleccionada.value = dia.fecha
    void cargar()
    return
  }
  fechaSeleccionada.value =
    fechaSeleccionada.value === dia.fecha ? null : dia.fecha
}

function abrirOcurrencia(ocurrencia: OcurrenciaLeer) {
  ocurrenciaSeleccionada.value = ocurrencia
  sheetAbierto.value = true
}

async function alActualizar() {
  const id = ocurrenciaSeleccionada.value?.id
  await cargar()
  if (id != null) {
    ocurrenciaSeleccionada.value =
      ocurrencias.value.find((item) => item.id === id) ?? null
  }
  emit('actualizado')
}

function etiquetaCupo(ocurrencia: OcurrenciaLeer): string {
  if (ocurrencia.cancelada) return 'Cancelada'
  if (ocurrencia.cantPersonas == null) return `${ocurrencia.asignados} asignados`
  if (ocurrencia.asignados < ocurrencia.cantPersonas) {
    return `Faltan ${ocurrencia.cantPersonas - ocurrencia.asignados}`
  }
  return 'Completa'
}

function varianteCupo(
  ocurrencia: OcurrenciaLeer,
): 'destructive' | 'outline' | 'secondary' {
  if (ocurrencia.cancelada) return 'destructive'
  if (
    ocurrencia.cantPersonas != null &&
    ocurrencia.asignados < ocurrencia.cantPersonas
  )
    return 'outline'
  return 'secondary'
}

const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

onMounted(cargar)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h3 class="text-base font-semibold">Revisar y publicar</h3>
        <p class="text-muted-foreground mt-0.5 text-sm">
          Navega el calendario, ajusta las asignaciones y registra el cumplimiento del día.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" :disabled="cargando" @click="cargar">
          <RefreshCwIcon :class="{ 'animate-spin': cargando }" />
          Refrescar
        </Button>
        <Button variant="outline" @click="irAHoy">Hoy</Button>
      </div>
    </div>

    <Alert v-if="error" variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>No se pudo cargar el calendario</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Ocurrencias del mes"
        :value="formatNumber(resumen.ocurrencias)"
        :icon="CalendarDaysIcon"
      />
      <KpiCard
        label="Sin cubrir"
        :value="formatNumber(resumen.bajoCupo)"
        detail="Ocurrencias con cupos faltantes"
        :icon="AlertCircleIcon"
        tono="amber"
      />
      <KpiCard
        label="Canceladas"
        :value="formatNumber(resumen.canceladas)"
        :icon="XCircleIcon"
        tono="sky"
      />
      <KpiCard
        label="Asignaciones"
        :value="formatNumber(resumen.asignaciones)"
        :icon="UsersIcon"
        tono="emerald"
      />
    </div>

    <Card>
      <CardHeader>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle class="capitalize">{{ tituloMes }}</CardTitle>
            <CardDescription>
              Haz clic en un día para filtrar la tabla. Los puntos ámbar indican cupos
              faltantes.
            </CardDescription>
          </div>
          <div class="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" title="Mes anterior" @click="cambiarMes(-1)">
              <ChevronLeftIcon />
            </Button>
            <Button variant="outline" size="icon-sm" title="Mes siguiente" @click="cambiarMes(1)">
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-7 gap-1 text-center">
          <div
            v-for="dia in diasSemana"
            :key="dia"
            class="text-muted-foreground py-1 text-xs font-medium"
          >
            {{ dia }}
          </div>
          <button
            v-for="celda in celdas"
            :key="celda.fecha"
            type="button"
            :class="
              cn(
                'relative flex h-20 flex-col items-start gap-1 rounded-md border p-1.5 text-left transition-colors',
                celda.esDelMes ? 'bg-background hover:bg-muted' : 'bg-muted/30 opacity-50',
                fechaSeleccionada === celda.fecha && 'ring-ring ring-2',
                celda.esHoy && 'border-primary',
              )
            "
            @click="seleccionarDia(celda)"
          >
            <span
              :class="
                cn(
                  'text-xs font-medium tabular-nums',
                  celda.esHoy && 'text-primary',
                  !celda.esDelMes && 'text-muted-foreground',
                )
              "
            >
              {{ celda.dia }}
            </span>
            <div v-if="ocurrenciasDe(celda.fecha).length" class="flex flex-wrap gap-1">
              <Badge variant="secondary" class="h-4 px-1 text-[10px]">
                {{ ocurrenciasDe(celda.fecha).length }}
              </Badge>
              <span
                v-if="diaTieneBajoCupo(celda.fecha)"
                class="size-2 rounded-full bg-amber-500"
                title="Cupos faltantes"
              />
              <span
                v-if="diaTieneCancelada(celda.fecha)"
                class="size-2 rounded-full bg-red-500"
                title="Ocurrencia cancelada"
              />
            </div>
          </button>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>
              {{ fechaSeleccionada ? `Ocurrencias del ${formatDate(fechaSeleccionada)}` : 'Ocurrencias del mes' }}
            </CardTitle>
            <CardDescription>
              Gestiona cupos, bloqueos, cancelaciones y recuperaciones.
            </CardDescription>
          </div>
          <Button
            v-if="fechaSeleccionada"
            variant="outline"
            size="sm"
            @click="fechaSeleccionada = null"
          >
            Ver todo el mes
          </Button>
        </div>
      </CardHeader>
      <CardContent class="px-0">
        <div class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Deber</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Lugar</TableHead>
                <TableHead>Cupos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead class="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="cargando">
                <TableCell colspan="7">
                  <div class="text-muted-foreground flex items-center gap-2 py-6">
                    <LoaderCircleIcon class="animate-spin" />
                    Cargando ocurrencias…
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-else-if="ocurrenciasFiltradas.length === 0">
                <TableCell colspan="7">
                  <div class="text-muted-foreground py-8 text-center text-sm">
                    No hay ocurrencias en este rango.
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-for="ocurrencia in ocurrenciasFiltradas" v-else :key="ocurrencia.id">
                <TableCell>
                  <div class="font-medium">{{ formatDate(ocurrencia.fecha) }}</div>
                </TableCell>
                <TableCell>
                  <div>{{ ocurrencia.tipoDeber }}</div>
                  <div class="text-muted-foreground text-xs">
                    {{ ocurrencia.configuracion }}
                  </div>
                </TableCell>
                <TableCell>{{ ocurrencia.horario ?? '—' }}</TableCell>
                <TableCell>{{ ocurrencia.lugar ?? '—' }}</TableCell>
                <TableCell class="tabular-nums">
                  {{ ocurrencia.asignados }}/{{ ocurrencia.cantPersonas ?? '∞' }}
                </TableCell>
                <TableCell>
                  <Badge :variant="varianteCupo(ocurrencia)">
                    {{ etiquetaCupo(ocurrencia) }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div class="flex justify-end">
                    <Button variant="outline" size="sm" @click="abrirOcurrencia(ocurrencia)">
                      Gestionar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <OcurrenciaSheet
      v-model:open="sheetAbierto"
      :ocurrencia="ocurrenciaSeleccionada"
      :periodo="periodo"
      @actualizado="alActualizar"
    />
  </div>
</template>
