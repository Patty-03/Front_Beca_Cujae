<script setup lang="ts">
import type {
  AsignacionLeer,
  PeriodoLeer,
  TipoDeberLeer,
} from '@/types/planificacion'
import { computed, onMounted, ref } from 'vue'
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ClockIcon,
  LoaderCircleIcon,
  LockIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  UsersIcon,
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
import RecuperacionDialog from './RecuperacionDialog.vue'
import {
  cerrarPeriodo,
  listarAsignaciones,
  listarDeudas,
  listarOcurrencias,
  listarTiposDeber,
} from '@/services/planificacion'
import { formatDate, formatNumber } from '@/lib/format'
import {
  etiquetaEstadoAsignacion,
  hoyIso,
  puedeRecuperar,
  varianteEstadoAsignacion,
} from '@/lib/planificacion'
import { toast } from 'vue-sonner'

const props = defineProps<{ periodo: PeriodoLeer }>()
const emit = defineEmits<{ 'periodo-actualizado': [] }>()

const asignaciones = ref<AsignacionLeer[]>([])
const deudas = ref<AsignacionLeer[]>([])
const tipos = ref<TipoDeberLeer[]>([])
const cargando = ref(true)
const error = ref('')
const filtroEstado = ref('todos')
const filtroTipo = ref('todos')

const recuperacionTarget = ref<AsignacionLeer | null>(null)
const recuperacionAbierta = ref(false)
const cerrarAbierto = ref(false)
const cerrando = ref(false)

const hoy = hoyIso()

const resumen = computed(() => ({
  total: asignaciones.value.length,
  planificadas: asignaciones.value.filter((item) => item.estado === 'PLANIFICADA').length,
  cumplidas: asignaciones.value.filter((item) => item.estado === 'CUMPLIDA').length,
  incumplidas: asignaciones.value.filter((item) => item.estado === 'INCUMPLIDA').length,
  justificadas: asignaciones.value.filter((item) => item.estado === 'JUSTIFICADA').length,
  permutadas: asignaciones.value.filter((item) => item.estado === 'PERMUTADA').length,
}))

const pendientesPasadas = computed(
  () =>
    asignaciones.value.filter(
      (item) => item.estado === 'PLANIFICADA' && item.fecha < hoy,
    ).length,
)

const filtradas = computed(() =>
  asignaciones.value.filter((asignacion) => {
    if (filtroEstado.value !== 'todos' && asignacion.estado !== filtroEstado.value)
      return false
    if (filtroTipo.value !== 'todos' && asignacion.tipoDeberId !== Number(filtroTipo.value))
      return false
    return true
  }),
)

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const [asignacionesPeriodo, ocurrenciasPeriodo, deudasDeber, tiposDeber] =
      await Promise.all([
        listarAsignaciones({
          periodoPlanificacionId: props.periodo.id,
          limit: 500,
        }),
        listarOcurrencias({
          periodoPlanificacionId: props.periodo.id,
          limit: 500,
        }),
        listarDeudas(),
        listarTiposDeber(),
      ])
    asignaciones.value = asignacionesPeriodo
    tipos.value = tiposDeber
    const ids = new Set(ocurrenciasPeriodo.map((item) => item.id))
    deudas.value = deudasDeber.filter((item) => ids.has(item.ocurrenciaDeberId))
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : 'No se pudo cargar el seguimiento.'
  } finally {
    cargando.value = false
  }
}

function abrirRecuperacion(asignacion: AsignacionLeer) {
  recuperacionTarget.value = asignacion
  recuperacionAbierta.value = true
}

async function alRecuperar() {
  await cargar()
  emit('periodo-actualizado')
}

async function confirmarCerrar() {
  cerrando.value = true
  try {
    await cerrarPeriodo(props.periodo.id)
    toast.success('Período cerrado')
    cerrarAbierto.value = false
    emit('periodo-actualizado')
  } catch (caught) {
    toast.error('No se pudo cerrar el período', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    cerrando.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h3 class="text-base font-semibold">Seguimiento y cierre</h3>
        <p class="text-muted-foreground mt-0.5 text-sm">
          Consulta el cumplimiento del período, recupera deudas y cierra el período cuando
          todo esté resuelto.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" :disabled="cargando" @click="cargar">
          <RefreshCwIcon :class="{ 'animate-spin': cargando }" />
          Refrescar
        </Button>
        <Button
          variant="destructive"
          :disabled="periodo.estado !== 'PUBLICADO'"
          @click="cerrarAbierto = true"
        >
          <LockIcon />
          Cerrar período
        </Button>
      </div>
    </div>

    <Alert v-if="error" variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>No se pudo cargar el seguimiento</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <Alert v-if="periodo.estado === 'CERRADO'">
      <LockIcon />
      <AlertTitle>Período cerrado</AlertTitle>
      <AlertDescription>
        El período quedó inmutable. Esta vista es solo de consulta.
      </AlertDescription>
    </Alert>

    <Alert v-else-if="periodo.estado === 'BORRADOR'">
      <AlertCircleIcon />
      <AlertTitle>Período en borrador</AlertTitle>
      <AlertDescription>
        Publica el período antes de cerrarlo. Para cerrar no deben quedar asignaciones
        planificadas con fecha pasada.
      </AlertDescription>
    </Alert>

    <Alert v-else-if="pendientesPasadas > 0">
      <AlertCircleIcon />
      <AlertTitle>Hay deberes pasados sin resolver</AlertTitle>
      <AlertDescription>
        {{ pendientesPasadas }} asignaciones planificadas con fecha pasada impiden el cierre.
        Márcalas como cumplidas, incumplidas o justificadas.
      </AlertDescription>
    </Alert>

    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <KpiCard
        label="Asignaciones"
        :value="formatNumber(resumen.total)"
        :icon="UsersIcon"
      />
      <KpiCard
        label="Planificadas"
        :value="formatNumber(resumen.planificadas)"
        :icon="ClockIcon"
        tono="sky"
      />
      <KpiCard
        label="Cumplidas"
        :value="formatNumber(resumen.cumplidas)"
        :icon="CheckCircle2Icon"
        tono="emerald"
      />
      <KpiCard
        label="Incumplidas"
        :value="formatNumber(resumen.incumplidas)"
        :icon="AlertCircleIcon"
        tono="amber"
      />
      <KpiCard
        label="Justificadas"
        :value="formatNumber(resumen.justificadas)"
        :icon="CheckCircle2Icon"
      />
      <KpiCard
        label="Deudas"
        :value="formatNumber(deudas.length)"
        detail="Sin recuperación registrada"
        :icon="RotateCcwIcon"
        tono="amber"
      />
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Deudas pendientes</CardTitle>
        <CardDescription>
          Asignaciones incumplidas o justificadas de este período sin una recuperación
          posterior.
        </CardDescription>
      </CardHeader>
      <CardContent class="px-0">
        <div class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Deber</TableHead>
                <TableHead>Fecha original</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead class="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="cargando">
                <TableCell colspan="5">
                  <div class="text-muted-foreground flex items-center gap-2 py-6">
                    <LoaderCircleIcon class="animate-spin" />
                    Cargando deudas…
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-else-if="deudas.length === 0">
                <TableCell colspan="5">
                  <div class="text-muted-foreground py-8 text-center text-sm">
                    No hay deudas pendientes en este período.
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-for="deuda in deudas" v-else :key="deuda.id">
                <TableCell>
                  <div class="font-medium">{{ deuda.estudiante }}</div>
                  <div class="text-muted-foreground text-xs">{{ deuda.configuracion }}</div>
                </TableCell>
                <TableCell>{{ deuda.tipoDeber }}</TableCell>
                <TableCell>{{ formatDate(deuda.fecha) }}</TableCell>
                <TableCell>
                  <Badge :variant="varianteEstadoAsignacion(deuda.estado)">
                    {{ etiquetaEstadoAsignacion(deuda.estado) }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div class="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      :disabled="periodo.estado === 'CERRADO'"
                      @click="abrirRecuperacion(deuda)"
                    >
                      <RotateCcwIcon />
                      Recuperar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="gap-3">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Asignaciones del período</CardTitle>
            <CardDescription>
              Registro completo de deberes asignados y su estado de cumplimiento.
            </CardDescription>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row">
            <Select v-model="filtroEstado">
              <SelectTrigger class="w-full sm:w-44">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="PLANIFICADA">Planificadas</SelectItem>
                <SelectItem value="CUMPLIDA">Cumplidas</SelectItem>
                <SelectItem value="INCUMPLIDA">Incumplidas</SelectItem>
                <SelectItem value="JUSTIFICADA">Justificadas</SelectItem>
                <SelectItem value="PERMUTADA">Permutadas</SelectItem>
              </SelectContent>
            </Select>
            <Select v-model="filtroTipo">
              <SelectTrigger class="w-full sm:w-44">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem v-for="tipo in tipos" :key="tipo.id" :value="String(tipo.id)">
                  {{ tipo.nombre }}
                </SelectItem>
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
                <TableHead>Fecha</TableHead>
                <TableHead>Estudiante</TableHead>
                <TableHead>Deber</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead class="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="cargando">
                <TableCell colspan="6">
                  <div class="text-muted-foreground flex items-center gap-2 py-6">
                    <LoaderCircleIcon class="animate-spin" />
                    Cargando asignaciones…
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-else-if="filtradas.length === 0">
                <TableCell colspan="6">
                  <div class="text-muted-foreground py-8 text-center text-sm">
                    No hay asignaciones que coincidan con el filtro.
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-for="asignacion in filtradas" v-else :key="asignacion.id">
                <TableCell>{{ formatDate(asignacion.fecha) }}</TableCell>
                <TableCell>
                  <div class="font-medium">{{ asignacion.estudiante }}</div>
                  <div class="text-muted-foreground text-xs">{{ asignacion.configuracion }}</div>
                </TableCell>
                <TableCell>{{ asignacion.tipoDeber }}</TableCell>
                <TableCell>{{ asignacion.horario ?? '—' }}</TableCell>
                <TableCell>
                  <Badge :variant="varianteEstadoAsignacion(asignacion.estado)">
                    {{ etiquetaEstadoAsignacion(asignacion.estado) }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div class="flex justify-end">
                    <Button
                      v-if="puedeRecuperar(asignacion)"
                      variant="outline"
                      size="sm"
                      :disabled="periodo.estado === 'CERRADO'"
                      @click="abrirRecuperacion(asignacion)"
                    >
                      <RotateCcwIcon />
                      Recuperar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <RecuperacionDialog
      v-model:open="recuperacionAbierta"
      :asignacion="recuperacionTarget"
      :periodo-planificacion-id="periodo.id"
      @recuperado="alRecuperar"
    />

    <ConfirmDialog
      :open="cerrarAbierto"
      titulo="Cerrar período"
      :descripcion="
        pendientesPasadas > 0
          ? `Quedan ${pendientesPasadas} asignaciones planificadas con fecha pasada. El cierre fallará hasta resolverlas.`
          : 'El período quedará inmutable. No se podrá generar, editar ni registrar cumplimiento después.'
      "
      confirm-label="Cerrar período"
      :cargando="cerrando"
      @update:open="(valor) => { if (!valor) cerrarAbierto = false }"
      @confirmar="confirmarCerrar"
    />
  </div>
</template>
