<script setup lang="ts">
import type { EdificioResumen, EstadoConstructivo } from '@/types/infraestructura'
import { computed, onMounted, ref } from 'vue'
import {
  Building2Icon,
  CircleAlertIcon,
  DoorOpenIcon,
  Layers3Icon,
  PlusIcon,
  SearchIcon,
  SearchXIcon,
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
import ConfirmDialog from '@/components/infraestructura/ConfirmDialog.vue'
import EdificioDialog from '@/components/infraestructura/EdificioDialog.vue'
import EdificioTable from '@/components/infraestructura/EdificioTable.vue'
import KpiCard from '@/components/infraestructura/KpiCard.vue'
import { formatNumber, formatPercent } from '@/lib/format'
import {
  eliminarEdificio,
  obtenerEdificios,
  obtenerEstadosConstructivos,
} from '@/services/infraestructura'

const edificios = ref<EdificioResumen[]>([])
const estados = ref<EstadoConstructivo[]>([])
const cargando = ref(true)
const error = ref('')
const busqueda = ref('')
const estadoFiltro = ref('todos')
const dialogoAbierto = ref(false)
const edificioEditando = ref<EdificioResumen | null>(null)
const edificioEliminando = ref<EdificioResumen | null>(null)
const confirmacionAbierta = ref(false)
const eliminando = ref(false)

const filtrados = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  return edificios.value.filter((edificio) => {
    const coincideNombre = !texto || edificio.nombre.toLowerCase().includes(texto)
    const coincideEstado =
      estadoFiltro.value === 'todos' || String(edificio.estado.id) === estadoFiltro.value
    return coincideNombre && coincideEstado
  })
})

const hayFiltros = computed(() => busqueda.value.trim() !== '' || estadoFiltro.value !== 'todos')

const totalEscaleras = computed(() =>
  edificios.value.reduce((total, edificio) => total + edificio.escaleras, 0),
)
const totalCuartos = computed(() =>
  edificios.value.reduce((total, edificio) => total + edificio.cuartos, 0),
)
const totalCapacidad = computed(() =>
  edificios.value.reduce((total, edificio) => total + edificio.capacidad, 0),
)
const totalOcupados = computed(() =>
  edificios.value.reduce((total, edificio) => total + edificio.ocupados, 0),
)
const ocupacionGeneral = computed(() =>
  totalCapacidad.value > 0 ? Math.round((totalOcupados.value / totalCapacidad.value) * 100) : 0,
)

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const [datos, catalogo] = await Promise.all([
      obtenerEdificios(),
      obtenerEstadosConstructivos(),
    ])
    edificios.value = datos
    estados.value = catalogo
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo cargar el inventario.'
  } finally {
    cargando.value = false
  }
}

function abrirNuevo() {
  edificioEditando.value = null
  dialogoAbierto.value = true
}

function abrirEditar(edificio: EdificioResumen) {
  edificioEditando.value = edificio
  dialogoAbierto.value = true
}

function solicitarEliminar(edificio: EdificioResumen) {
  if (edificio.escaleras > 0) {
    toast.error('No se puede eliminar el edificio', {
      description: 'Primero debe eliminar las escaleras registradas.',
    })
    return
  }
  edificioEliminando.value = edificio
  confirmacionAbierta.value = true
}

async function confirmarEliminacion() {
  if (!edificioEliminando.value) return
  eliminando.value = true
  try {
    await eliminarEdificio(edificioEliminando.value.id)
    toast.success('Edificio eliminado', {
      description: edificioEliminando.value.nombre,
    })
    confirmacionAbierta.value = false
    edificioEliminando.value = null
    await cargar()
  } catch (e) {
    toast.error('No se pudo eliminar el edificio', {
      description: e instanceof Error ? e.message : undefined,
    })
  } finally {
    eliminando.value = false
  }
}

async function alGuardar() {
  edificioEditando.value = null
  await cargar()
}

function limpiarFiltros() {
  busqueda.value = ''
  estadoFiltro.value = 'todos'
}

onMounted(cargar)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Gestión de edificios</h1>
        <p class="text-muted-foreground mt-1 text-sm">
          Consulta y administra el inventario de infraestructura de la residencia.
        </p>
      </div>
      <Button @click="abrirNuevo">
        <PlusIcon />
        Nuevo edificio
      </Button>
    </div>

    <Alert v-if="error" variant="destructive">
      <CircleAlertIcon />
      <AlertTitle>No se pudo cargar el inventario</AlertTitle>
      <AlertDescription>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>{{ error }}</span>
          <Button variant="outline" size="sm" @click="cargar">Reintentar</Button>
        </div>
      </AlertDescription>
    </Alert>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Edificios"
        :value="edificios.length"
        :detail="`${totalEscaleras} escaleras`"
        :icon="Building2Icon"
        tono="primary"
      />
      <KpiCard
        label="Cuartos"
        :value="formatNumber(totalCuartos)"
        detail="Inventario total"
        :icon="DoorOpenIcon"
        tono="sky"
      />
      <KpiCard
        label="Capacidad"
        :value="formatNumber(totalCapacidad)"
        detail="Plazas de alojamiento"
        :icon="Layers3Icon"
        tono="emerald"
      />
      <KpiCard
        label="Ocupación"
        :value="formatPercent(ocupacionGeneral)"
        :detail="`${formatNumber(totalOcupados)} plazas ocupadas`"
        :icon="UsersIcon"
        tono="amber"
      />
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Inventario de edificios</CardTitle>
        <CardDescription>
          Selecciona un edificio para revisar sus escaleras y cuartos.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div class="relative w-full sm:max-w-xs">
            <SearchIcon
              class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            />
            <Input
              v-model="busqueda"
              class="pl-8"
              placeholder="Buscar por nombre"
              aria-label="Buscar edificio por nombre"
            />
          </div>

          <Select v-model="estadoFiltro">
            <SelectTrigger class="w-full sm:w-48" aria-label="Filtrar por estado">
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

          <Button
            v-if="hayFiltros"
            variant="ghost"
            size="sm"
            class="self-start sm:ml-auto sm:self-auto"
            @click="limpiarFiltros"
          >
            Limpiar filtros
          </Button>
        </div>

        <div v-if="cargando" class="space-y-2">
          <Skeleton v-for="indice in 6" :key="indice" class="h-12 rounded-lg" />
        </div>

        <template v-else>
          <p class="text-muted-foreground text-xs">
            Mostrando {{ filtrados.length }} de {{ edificios.length }} edificios.
          </p>

          <EdificioTable
            v-if="filtrados.length"
            :edificios="filtrados"
            @editar="abrirEditar"
            @eliminar="solicitarEliminar"
          />

          <div v-else class="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div class="bg-muted rounded-full p-3">
              <SearchXIcon class="text-muted-foreground size-5" />
            </div>
            <div>
              <p class="font-medium">No se encontraron edificios</p>
              <p class="text-muted-foreground text-sm">
                Ajusta los filtros o registra un nuevo edificio.
              </p>
            </div>
            <Button v-if="hayFiltros" variant="outline" size="sm" @click="limpiarFiltros">
              Limpiar filtros
            </Button>
            <Button v-else size="sm" @click="abrirNuevo">
              <PlusIcon />
              Nuevo edificio
            </Button>
          </div>
        </template>
      </CardContent>
    </Card>

    <EdificioDialog
      v-model:open="dialogoAbierto"
      :estados="estados"
      :edificio="edificioEditando"
      @guardado="alGuardar"
    />

    <ConfirmDialog
      v-model:open="confirmacionAbierta"
      titulo="Eliminar edificio"
      :descripcion="
        edificioEliminando
          ? `¿Seguro que deseas eliminar ${edificioEliminando.nombre}? Esta acción no se puede deshacer.`
          : ''
      "
      :cargando="eliminando"
      @confirmar="confirmarEliminacion"
    />
  </div>
</template>
