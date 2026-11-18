<script setup lang="ts">
import type { PeriodoRegistro, ProcesoLeer } from '@/types/alojamiento'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertCircleIcon,
  ArrowRightIcon,
  BedDoubleIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  Edit3Icon,
  LoaderCircleIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
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
import { Input } from '@/components/ui/input'
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
import KpiCard from '@/components/infraestructura/KpiCard.vue'
import NuevoProcesoDialog from '@/components/alojamiento/NuevoProcesoDialog.vue'
import {
  descartarProceso,
  listarPeriodosRegistro,
  listarProcesos,
} from '@/services/alojamiento'
import { formatDate, formatNumber } from '@/lib/format'
import {
  etiquetaEstadoProceso,
  etiquetaPeriodoRegistro,
  etiquetaTipoProceso,
  puedeDescartarProceso,
  varianteEstadoProceso,
} from '@/lib/alojamiento'
import { toast } from 'vue-sonner'

const router = useRouter()

const procesos = ref<ProcesoLeer[]>([])
const periodos = ref<PeriodoRegistro[]>([])
const cargando = ref(true)
const error = ref('')
const busqueda = ref('')
const estadoFiltro = ref('todos')

const dialogNuevoAbierto = ref(false)
const procesoADescartar = ref<ProcesoLeer | null>(null)
const descartando = ref(false)

const visibles = computed(() => procesos.value.filter((p) => p.estado !== 'DESCARTADO'))

const resumen = computed(() => ({
  total: visibles.value.length,
  borradores: visibles.value.filter((p) => p.estado === 'BORRADOR').length,
  revision: visibles.value.filter((p) => p.estado === 'EN_REVISION').length,
  confirmados: visibles.value.filter((p) => p.estado === 'CONFIRMADO').length,
}))

const filtrados = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  return visibles.value.filter((p) => {
    if (estadoFiltro.value !== 'todos' && p.estado !== estadoFiltro.value) return false
    if (!texto) return true
    return `${p.nombre} ${p.conjunto} ${p.curso}`.toLowerCase().includes(texto)
  })
})

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const [lista, pers] = await Promise.all([listarProcesos(), listarPeriodosRegistro()])
    procesos.value = lista
    periodos.value = pers
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'No se pudieron cargar los procesos.'
  } finally {
    cargando.value = false
  }
}

function abrir(p: ProcesoLeer) {
  void router.push(`/asignacion-cuartos/${p.id}`)
}

function solicitarDescartar(p: ProcesoLeer) {
  if (!puedeDescartarProceso(p.estado)) return
  procesoADescartar.value = p
}

async function confirmarDescartar() {
  const p = procesoADescartar.value
  if (!p) return
  descartando.value = true
  try {
    await descartarProceso(p.id)
    toast.success('Proceso descartado')
    procesoADescartar.value = null
    await cargar()
  } catch (caught) {
    toast.error('No se pudo descartar el proceso', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    descartando.value = false
  }
}

function alCrear(proceso: ProcesoLeer) {
  void router.push(`/asignacion-cuartos/${proceso.id}`)
}

onMounted(cargar)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Asignación de cuartos</h1>
        <p class="text-muted-foreground mt-1 text-sm">
          Crea procesos de asignación, configura reglas y restricciones, ejecuta el motor y confirma los resultados.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" :disabled="cargando" @click="cargar">
          <RefreshCwIcon :class="{ 'animate-spin': cargando }" />
          Refrescar
        </Button>
        <Button @click="dialogNuevoAbierto = true">
          <PlusIcon />
          Nuevo proceso
        </Button>
      </div>
    </div>

    <Alert v-if="error" variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>No se pudieron cargar los procesos</AlertTitle>
      <AlertDescription>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>{{ error }}</span>
          <Button variant="outline" size="sm" @click="cargar">Reintentar</Button>
        </div>
      </AlertDescription>
    </Alert>

    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Procesos" :value="formatNumber(resumen.total)" :icon="BedDoubleIcon" />
      <KpiCard label="Borradores" :value="formatNumber(resumen.borradores)" :icon="Edit3Icon" tono="amber" />
      <KpiCard label="En revisión" :value="formatNumber(resumen.revision)" :icon="ClipboardListIcon" tono="sky" />
      <KpiCard label="Confirmados" :value="formatNumber(resumen.confirmados)" :icon="CheckCircle2Icon" tono="emerald" />
    </div>

    <Card>
      <CardHeader class="gap-3">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Procesos de asignación</CardTitle>
            <CardDescription>Abre un proceso para configurar, ejecutar, revisar y confirmar la asignación.</CardDescription>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row">
            <div class="relative">
              <SearchIcon class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input v-model="busqueda" placeholder="Buscar por nombre" class="w-full pl-8 sm:w-64" />
            </div>
            <Select v-model="estadoFiltro">
              <SelectTrigger class="w-full sm:w-44">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="BORRADOR">Borrador</SelectItem>
                <SelectItem value="EN_REVISION">En revisión</SelectItem>
                <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent class="px-0">
        <div class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proceso</TableHead>
                <TableHead>Período / Curso</TableHead>
                <TableHead>Conjunto de reglas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead class="text-right">Restricciones</TableHead>
                <TableHead class="text-right">Preasignaciones</TableHead>
                <TableHead class="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="cargando">
                <TableCell colspan="7">
                  <div class="text-muted-foreground flex items-center gap-2 py-6">
                    <LoaderCircleIcon class="animate-spin" />
                    Cargando procesos...
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-else-if="filtrados.length === 0">
                <TableCell colspan="7">
                  <div class="text-muted-foreground py-8 text-center text-sm">
                    No hay procesos que coincidan con el filtro.
                  </div>
                </TableCell>
              </TableRow>
              <TableRow
                v-for="p in filtrados"
                v-else
                :key="p.id"
                class="cursor-pointer"
                @click="abrir(p)"
              >
                <TableCell>
                  <div class="font-medium">{{ p.nombre }}</div>
                  <div class="text-muted-foreground text-xs">#{{ p.id }} · {{ etiquetaTipoProceso(p.tipo) }}</div>
                </TableCell>
                <TableCell>
                  <div class="text-sm">{{ etiquetaPeriodoRegistro(periodos, p.periodoRegistroId) }}</div>
                  <div class="text-muted-foreground text-xs">{{ p.curso }}</div>
                </TableCell>
                <TableCell>
                  <div class="text-sm">{{ p.conjunto || '—' }}</div>
                  <div class="text-muted-foreground text-xs">v{{ p.conjuntoVersion }}</div>
                </TableCell>
                <TableCell>
                  <Badge :variant="varianteEstadoProceso(p.estado)">{{ etiquetaEstadoProceso(p.estado) }}</Badge>
                </TableCell>
                <TableCell class="text-right tabular-nums">{{ formatNumber(p.restricciones) }}</TableCell>
                <TableCell class="text-right tabular-nums">{{ formatNumber(p.preasignaciones) }}</TableCell>
                <TableCell>
                  <div class="flex justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" title="Abrir proceso" @click.stop="abrir(p)">
                      <ArrowRightIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      :disabled="!puedeDescartarProceso(p.estado)"
                      title="Descartar"
                      @click.stop="solicitarDescartar(p)"
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <NuevoProcesoDialog v-model:open="dialogNuevoAbierto" @creado="alCrear" />

    <ConfirmDialog
      :open="procesoADescartar !== null"
      titulo="Descartar proceso"
      :descripcion="`¿Descartar el proceso &quot;${procesoADescartar?.nombre ?? ''}&quot; (#${procesoADescartar?.id ?? ''})? Esta acción no se puede deshacer.`"
      confirm-label="Descartar"
      :cargando="descartando"
      @update:open="(v) => { if (!v) procesoADescartar = null }"
      @confirmar="confirmarDescartar"
    />
  </div>
</template>
