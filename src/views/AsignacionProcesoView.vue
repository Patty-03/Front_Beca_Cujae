<script setup lang="ts">
import type { NoAlojado, PeriodoRegistro, PreasignacionLeer, ProcesoLeer, RestriccionLeer } from '@/types/alojamiento'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  LoaderCircleIcon,
  ListChecksIcon,
  PlayIcon,
  RefreshCwIcon,
  SettingsIcon,
  Trash2Icon,
} from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ConfirmDialog from '@/components/infraestructura/ConfirmDialog.vue'
import ConfigurarProcesoTab from '@/components/alojamiento/ConfigurarProcesoTab.vue'
import EjecutarProcesoTab from '@/components/alojamiento/EjecutarProcesoTab.vue'
import RevisarProcesoTab from '@/components/alojamiento/RevisarProcesoTab.vue'
import ConfirmarProcesoTab from '@/components/alojamiento/ConfirmarProcesoTab.vue'
import {
  descartarProceso,
  listarNoAlojados,
  listarPeriodosRegistro,
  listarPreasignaciones,
  listarRestricciones,
  obtenerProceso,
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

const route = useRoute()
const router = useRouter()

const proceso = ref<ProcesoLeer | null>(null)
const periodos = ref<PeriodoRegistro[]>([])
const restricciones = ref<RestriccionLeer[]>([])
const preasignaciones = ref<PreasignacionLeer[]>([])
const noAlojados = ref<NoAlojado[]>([])
const cargando = ref(true)
const error = ref('')
const tabActiva = ref('configurar')
const descartarAbierto = ref(false)
const descartando = ref(false)

const procesoId = computed(() => Number(route.params.procesoId))

async function cargarAuxiliares() {
  if (!proceso.value) return
  const [r, p, n] = await Promise.all([
    listarRestricciones(proceso.value.id).catch(() => [] as RestriccionLeer[]),
    listarPreasignaciones(proceso.value.id).catch(() => [] as PreasignacionLeer[]),
    listarNoAlojados(proceso.value.id).catch(() => [] as NoAlojado[]),
  ])
  restricciones.value = r
  preasignaciones.value = p
  noAlojados.value = n
}

async function cargar() {
  const id = procesoId.value
  if (!Number.isFinite(id) || id <= 0) {
    error.value = 'El proceso solicitado no es válido.'
    cargando.value = false
    return
  }
  cargando.value = true
  error.value = ''
  try {
    const [pr, pers] = await Promise.all([obtenerProceso(id), listarPeriodosRegistro()])
    proceso.value = pr
    periodos.value = pers
    await cargarAuxiliares()
  } catch (caught) {
    proceso.value = null
    error.value = caught instanceof Error ? caught.message : 'No se pudo cargar el proceso.'
  } finally {
    cargando.value = false
  }
}

async function recargarProceso() {
  if (!proceso.value) return
  try {
    proceso.value = await obtenerProceso(proceso.value.id)
  } catch {
    /* mantener estado actual */
  }
}

async function recargarTodo() {
  await recargarProceso()
  await cargarAuxiliares()
}

function volver() {
  void router.push('/asignacion-cuartos')
}

async function confirmarDescartar() {
  if (!proceso.value) return
  descartando.value = true
  try {
    await descartarProceso(proceso.value.id)
    toast.success('Proceso descartado')
    descartarAbierto.value = false
    await recargarTodo()
  } catch (caught) {
    toast.error('No se pudo descartar el proceso', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    descartando.value = false
  }
}

function irAProceso(id: number) {
  void router.replace(`/asignacion-cuartos/${id}`)
}

onMounted(cargar)
watch(procesoId, cargar)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4">
      <Button variant="ghost" size="sm" class="w-fit" @click="volver">
        <ArrowLeftIcon />
        Volver a asignación de cuartos
      </Button>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div v-if="proceso">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-2xl font-semibold tracking-tight">{{ proceso.nombre }}</h1>
            <Badge :variant="varianteEstadoProceso(proceso.estado)">
              {{ etiquetaEstadoProceso(proceso.estado) }}
            </Badge>
          </div>
          <p class="text-muted-foreground mt-1 text-sm">
            #{{ proceso.id }} · {{ etiquetaTipoProceso(proceso.tipo) }} · {{ etiquetaPeriodoRegistro(periodos, proceso.periodoRegistroId) }} · {{ proceso.curso }}
          </p>
          <p class="text-muted-foreground text-xs">
            Conjunto: {{ proceso.conjunto || '—' }} (v{{ proceso.conjuntoVersion }}) ·
            {{ formatNumber(proceso.restricciones) }} restricciones ·
            {{ formatNumber(proceso.preasignaciones) }} preasignaciones
            <span v-if="proceso.creadoEn"> · Creado {{ formatDate(proceso.creadoEn) }}</span>
          </p>
        </div>
        <div v-else>
          <h1 class="text-2xl font-semibold tracking-tight">Proceso de asignación</h1>
        </div>

        <div v-if="proceso" class="flex flex-wrap gap-2">
          <Button variant="outline" :disabled="cargando" @click="cargar">
            <RefreshCwIcon :class="{ 'animate-spin': cargando }" />
            Refrescar
          </Button>
          <Button
            v-if="puedeDescartarProceso(proceso.estado)"
            variant="outline"
            @click="descartarAbierto = true"
          >
            <Trash2Icon />
            Descartar
          </Button>
        </div>
      </div>
    </div>

    <Alert v-if="error" variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>No se pudo cargar el proceso</AlertTitle>
      <AlertDescription>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>{{ error }}</span>
          <Button variant="outline" size="sm" @click="cargar">Reintentar</Button>
        </div>
      </AlertDescription>
    </Alert>

    <div v-if="cargando" class="text-muted-foreground flex items-center gap-2 py-10 text-sm">
      <LoaderCircleIcon class="animate-spin" />
      Cargando proceso...
    </div>

    <Tabs v-else-if="proceso" v-model="tabActiva" class="space-y-4">
      <TabsList class="w-full overflow-x-auto sm:w-fit">
        <TabsTrigger value="configurar">
          <SettingsIcon />
          Configurar
        </TabsTrigger>
        <TabsTrigger value="ejecutar">
          <PlayIcon />
          Ejecutar
        </TabsTrigger>
        <TabsTrigger value="revisar">
          <ListChecksIcon />
          Revisar
        </TabsTrigger>
        <TabsTrigger value="confirmar">
          <CheckCircle2Icon />
          Confirmar
        </TabsTrigger>
      </TabsList>

      <TabsContent value="configurar">
        <ConfigurarProcesoTab
          :proceso="proceso"
          :restricciones="restricciones"
          @actualizado="recargarTodo"
          @proceso-cambiado="irAProceso"
        />
      </TabsContent>

      <TabsContent value="ejecutar">
        <EjecutarProcesoTab
          :proceso="proceso"
          :restricciones="restricciones"
          @actualizado="recargarTodo"
          @ir-revisar="tabActiva = 'revisar'"
        />
      </TabsContent>

      <TabsContent value="revisar">
        <RevisarProcesoTab
          :proceso="proceso"
          :preasignaciones="preasignaciones"
          :no-alojados="noAlojados"
          @actualizado="recargarTodo"
        />
      </TabsContent>

      <TabsContent value="confirmar">
        <ConfirmarProcesoTab
          :proceso="proceso"
          :preasignaciones="preasignaciones"
          :no-alojados="noAlojados"
          @actualizado="recargarTodo"
          @confirmado="recargarTodo"
          @descartado="volver"
        />
      </TabsContent>
    </Tabs>

    <ConfirmDialog
      :open="descartarAbierto"
      titulo="Descartar proceso"
      :descripcion="`¿Descartar el proceso &quot;${proceso?.nombre ?? ''}&quot; (#${proceso?.id ?? ''})? Esta acción no se puede deshacer.`"
      confirm-label="Descartar"
      :cargando="descartando"
      @update:open="(v) => { if (!v) descartarAbierto = false }"
      @confirmar="confirmarDescartar"
    />
  </div>
</template>
