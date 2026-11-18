<script setup lang="ts">
import type { PeriodoLeer, PlanLeer } from '@/types/planificacion'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ListChecksIcon,
  LoaderCircleIcon,
  LockIcon,
  PlayIcon,
  RefreshCwIcon,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PlanificarTab from '@/components/planificacion/PlanificarTab.vue'
import GenerarTab from '@/components/planificacion/GenerarTab.vue'
import RevisarTab from '@/components/planificacion/RevisarTab.vue'
import SeguimientoTab from '@/components/planificacion/SeguimientoTab.vue'
import {
  leerPeriodo,
  listarPlanes,
  publicarPeriodo,
} from '@/services/planificacion'
import { formatDate } from '@/lib/format'
import {
  etiquetaEstadoPeriodo,
  puedePublicarPeriodo,
  varianteEstadoPeriodo,
} from '@/lib/planificacion'
import { toast } from 'vue-sonner'

const route = useRoute()
const router = useRouter()

const periodo = ref<PeriodoLeer | null>(null)
const planes = ref<PlanLeer[]>([])
const cargando = ref(true)
const error = ref('')
const tabActiva = ref('planificar')
const publicarAbierto = ref(false)
const publicando = ref(false)

const periodoId = computed(() => Number(route.params.periodoId))

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const encontrado = await leerPeriodo(periodoId.value)
    periodo.value = encontrado
    planes.value = await listarPlanes(encontrado.id)
  } catch (caught) {
    periodo.value = null
    error.value =
      caught instanceof Error ? caught.message : 'No se pudo cargar el período.'
  } finally {
    cargando.value = false
  }
}

async function recargarPeriodo() {
  try {
    periodo.value = await leerPeriodo(periodoId.value)
  } catch (caught) {
    toast.error('No se pudo refrescar el período', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  }
}

async function recargarPlanes() {
  if (!periodo.value) return
  try {
    planes.value = await listarPlanes(periodo.value.id)
  } catch {
    planes.value = []
  }
}

async function alActualizarPlanificacion() {
  await Promise.all([recargarPeriodo(), recargarPlanes()])
}

async function confirmarPublicar() {
  if (!periodo.value) return
  publicando.value = true
  try {
    await publicarPeriodo(periodo.value.id)
    toast.success('Período publicado')
    publicarAbierto.value = false
    await recargarPeriodo()
  } catch (caught) {
    toast.error('No se pudo publicar el período', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    publicando.value = false
  }
}

function volver() {
  void router.push({ name: 'planificacion-deberes' })
}

onMounted(cargar)
watch(periodoId, cargar)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4">
      <Button variant="ghost" size="sm" class="w-fit" @click="volver">
        <ArrowLeftIcon />
        Volver a planificación
      </Button>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div v-if="periodo">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-2xl font-semibold tracking-tight">
              Período {{ formatDate(periodo.inicio) }} — {{ formatDate(periodo.fin) }}
            </h1>
            <Badge :variant="varianteEstadoPeriodo(periodo.estado)">
              {{ etiquetaEstadoPeriodo(periodo.estado) }}
            </Badge>
          </div>
          <p class="text-muted-foreground mt-1 text-sm">
            {{ periodo.planes }} planes · {{ periodo.ocurrencias }} ocurrencias ·
            {{ periodo.asignaciones }} asignaciones
          </p>
        </div>
        <div v-else>
          <h1 class="text-2xl font-semibold tracking-tight">Período de planificación</h1>
        </div>

        <div v-if="periodo" class="flex flex-wrap gap-2">
          <Button variant="outline" :disabled="cargando" @click="cargar">
            <RefreshCwIcon :class="{ 'animate-spin': cargando }" />
            Refrescar
          </Button>
          <Button
            v-if="periodo.estado === 'BORRADOR'"
            :disabled="!puedePublicarPeriodo(periodo)"
            @click="publicarAbierto = true"
          >
            <CheckCircle2Icon />
            Publicar período
          </Button>
        </div>
      </div>
    </div>

    <Alert v-if="error" variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>No se pudo cargar el período</AlertTitle>
      <AlertDescription>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>{{ error }}</span>
          <Button variant="outline" size="sm" @click="cargar">Reintentar</Button>
        </div>
      </AlertDescription>
    </Alert>

    <div v-if="cargando" class="text-muted-foreground flex items-center gap-2 py-10 text-sm">
      <LoaderCircleIcon class="animate-spin" />
      Cargando período…
    </div>

    <Tabs v-else-if="periodo" v-model="tabActiva" class="space-y-4">
      <TabsList class="w-full overflow-x-auto sm:w-fit">
        <TabsTrigger value="planificar">
          <ListChecksIcon />
          Planificar
        </TabsTrigger>
        <TabsTrigger value="generar">
          <PlayIcon />
          Generar
        </TabsTrigger>
        <TabsTrigger value="revisar">
          <CalendarDaysIcon />
          Revisar y publicar
        </TabsTrigger>
        <TabsTrigger value="seguimiento">
          <LockIcon />
          Seguimiento y cierre
        </TabsTrigger>
      </TabsList>

      <TabsContent value="planificar">
        <PlanificarTab
          :periodo="periodo"
          @actualizado="alActualizarPlanificacion"
          @ir-generar="tabActiva = 'generar'"
        />
      </TabsContent>

      <TabsContent value="generar">
        <GenerarTab
          :periodo="periodo"
          :planes="planes"
          @actualizado="alActualizarPlanificacion"
          @ir-revisar="tabActiva = 'revisar'"
        />
      </TabsContent>

      <TabsContent value="revisar">
        <RevisarTab :periodo="periodo" @actualizado="recargarPeriodo" />
      </TabsContent>

      <TabsContent value="seguimiento">
        <SeguimientoTab :periodo="periodo" @periodo-actualizado="recargarPeriodo" />
      </TabsContent>
    </Tabs>

    <Dialog
      :open="publicarAbierto"
      @update:open="(valor) => { if (!valor) publicarAbierto = false }"
    >
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publicar período</DialogTitle>
          <DialogDescription>
            Al publicar se habilita el uso operativo del período. Debe tener al menos un plan
            y ya puede tener ocurrencias generadas.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button :disabled="publicando" @click="confirmarPublicar">
            <LoaderCircleIcon v-if="publicando" class="animate-spin" />
            Publicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
