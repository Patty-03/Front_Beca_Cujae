<script setup lang="ts">
import type { EdificioResumen } from '@/types/infraestructura'
import type { EstudianteResumen, ResultadoImportacion } from '@/types/estudiante'
import { computed, onMounted, ref } from 'vue'
import {
  BedDoubleIcon,
  CircleAlertIcon,
  ClipboardListIcon,
  FileUpIcon,
  HomeIcon,
  RotateCcwIcon,
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
import AsignarCuartoDialog from '@/components/estudiantes/AsignarCuartoDialog.vue'
import EstudianteDetalleDialog from '@/components/estudiantes/EstudianteDetalleDialog.vue'
import EstudianteTable from '@/components/estudiantes/EstudianteTable.vue'
import ImportarEstudiantesDialog from '@/components/estudiantes/ImportarEstudiantesDialog.vue'
import KpiCard from '@/components/infraestructura/KpiCard.vue'
import {
  ESTADOS_BECA,
  ETIQUETAS_ESTADO_BECA,
  ETIQUETAS_TIPO_INGRESO,
  TIPOS_INGRESO,
  normalizarClave,
} from '@/lib/estudiantes'
import { formatNumber } from '@/lib/format'
import { obtenerEdificios } from '@/services/infraestructura'
import { eliminarEstudiante, obtenerEstudiantes } from '@/services/estudiantes'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const puedeEscribir = computed(() => auth.can('estudiantes:write'))

const estudiantes = ref<EstudianteResumen[]>([])
const edificios = ref<EdificioResumen[]>([])
const cargando = ref(true)
const error = ref('')

const busqueda = ref('')
const carreraFiltro = ref('todas')
const provinciaFiltro = ref('todas')
const edificioFiltro = ref('todos')
const tipoFiltro = ref('todos')
const estadoFiltro = ref('todos')

const importarAbierto = ref(false)
const detalleAbierto = ref(false)
const asignarAbierto = ref(false)
const confirmacionAbierta = ref(false)
const estudianteSeleccionado = ref<EstudianteResumen | null>(null)
const estudianteEliminando = ref<EstudianteResumen | null>(null)
const eliminando = ref(false)

const carrerasDisponibles = computed(() =>
  [
    ...new Set(
      estudiantes.value
        .map((estudiante) => estudiante.carrera.trim())
        .filter((carrera) => carrera !== ''),
    ),
  ].sort((a, b) => a.localeCompare(b, 'es')),
)

const provinciasDisponibles = computed(() =>
  [
    ...new Set(
      estudiantes.value
        .map((estudiante) => estudiante.provincia.trim())
        .filter((provincia) => provincia !== ''),
    ),
  ].sort((a, b) => a.localeCompare(b, 'es')),
)

const carnetsExistentes = computed(() => estudiantes.value.map((estudiante) => estudiante.carnet))

const filtrados = computed(() => {
  const texto = normalizarClave(busqueda.value)

  return estudiantes.value.filter((estudiante) => {
    const contenido = normalizarClave(
      `${estudiante.nombre} ${estudiante.carnet} ${estudiante.carrera} ${estudiante.municipio} ${estudiante.provincia}`,
    )

    if (texto && !contenido.includes(texto)) return false
    if (carreraFiltro.value !== 'todas' && estudiante.carrera !== carreraFiltro.value) return false
    if (provinciaFiltro.value !== 'todas' && estudiante.provincia !== provinciaFiltro.value) {
      return false
    }
    if (tipoFiltro.value !== 'todos' && estudiante.tipoIngreso !== tipoFiltro.value) return false
    if (estadoFiltro.value !== 'todos' && estudiante.estadoBeca !== estadoFiltro.value) return false
    if (edificioFiltro.value !== 'todos') {
      if (String(estudiante.asignacion?.edificioId ?? '') !== edificioFiltro.value) return false
    }
    return true
  })
})

const hayFiltros = computed(
  () =>
    busqueda.value.trim() !== '' ||
    carreraFiltro.value !== 'todas' ||
    provinciaFiltro.value !== 'todas' ||
    edificioFiltro.value !== 'todos' ||
    tipoFiltro.value !== 'todos' ||
    estadoFiltro.value !== 'todos',
)

const totalAsignados = computed(
  () => estudiantes.value.filter((estudiante) => estudiante.asignacion).length,
)
const totalSinCuarto = computed(() => estudiantes.value.length - totalAsignados.value)
const totalPendientes = computed(() =>
  estudiantes.value.reduce((total, estudiante) => total + estudiante.deberesPendientes, 0),
)
const totalIncumplidos = computed(() =>
  estudiantes.value.reduce((total, estudiante) => total + estudiante.deberesIncumplidos, 0),
)

async function cargar() {
  cargando.value = true
  error.value = ''

  try {
    estudiantes.value = await obtenerEstudiantes()
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : 'No se pudo cargar el listado de estudiantes.'
  } finally {
    cargando.value = false
  }

  try {
    edificios.value = await obtenerEdificios()
  } catch {
    edificios.value = []
  }
}

function abrirEditar(estudiante: EstudianteResumen) {
  if (!puedeEscribir.value) return
  // Por ahora mostramos la ficha o se puede implementar modal de edición si se requiere, pero abrimos el detalle o notificamos
  toast.info('Edición de estudiante', {
    description: `Editando a ${estudiante.nombre} (Funcionalidad próximamente)`,
  })
}

function solicitarEliminar(estudiante: EstudianteResumen) {
  if (!puedeEscribir.value) return
  estudianteEliminando.value = estudiante
  confirmacionAbierta.value = true
}

async function confirmarEliminacion() {
  const estudiante = estudianteEliminando.value
  if (!estudiante) return
  eliminando.value = true
  try {
    await eliminarEstudiante(estudiante.id)
    toast.success('Estudiante eliminado', {
      description: estudiante.nombre,
    })
    confirmacionAbierta.value = false
    estudianteEliminando.value = null
    await cargar()
  } catch (e) {
    toast.error('No se pudo eliminar el estudiante', {
      description: e instanceof Error ? e.message : undefined,
    })
  } finally {
    eliminando.value = false
  }
}
function limpiarFiltros() {
  busqueda.value = ''
  carreraFiltro.value = 'todas'
  provinciaFiltro.value = 'todas'
  edificioFiltro.value = 'todos'
  tipoFiltro.value = 'todos'
  estadoFiltro.value = 'todos'
}

function verEstudiante(estudiante: EstudianteResumen) {
  estudianteSeleccionado.value = estudiante
  detalleAbierto.value = true
}

function abrirAsignacion(estudiante: EstudianteResumen) {
  if (!puedeEscribir.value) return
  estudianteSeleccionado.value = estudiante
  asignarAbierto.value = true
}

function alImportar(resultado: ResultadoImportacion) {
  toast.success('Listado actualizado', {
    description: `${resultado.resumen.validas} estudiantes nuevos disponibles.`,
  })
  importarAbierto.value = false
  void cargar()
}

function alAsignar() {
  asignarAbierto.value = false
  void cargar()
}

onMounted(cargar)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Estudiantes</h1>
        <p class="text-muted-foreground mt-1 text-sm">
          Consulta la matrícula becada, su procedencia, cuarto y deberes asignados.
        </p>
      </div>
      <Button v-if="puedeEscribir" @click="importarAbierto = true">
        <FileUpIcon />
        Importar estudiantes
      </Button>
    </div>

    <Alert v-if="error" variant="destructive">
      <CircleAlertIcon />
      <AlertTitle>No se pudo cargar el listado</AlertTitle>
      <AlertDescription>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>{{ error }}</span>
          <Button variant="outline" size="sm" @click="cargar">Reintentar</Button>
        </div>
      </AlertDescription>
    </Alert>

    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Matrícula"
        :value="formatNumber(estudiantes.length)"
        detail="Estudiantes de provincia en el sistema"
        :icon="UsersIcon"
      />
      <KpiCard
        label="Con cuarto"
        :value="formatNumber(totalAsignados)"
        detail="Asignaciones activas"
        :icon="BedDoubleIcon"
        tono="emerald"
      />
      <KpiCard
        label="Sin cuarto"
        :value="formatNumber(totalSinCuarto)"
        detail="Pendientes de asignación"
        :icon="HomeIcon"
        tono="amber"
      />
      <KpiCard
        label="Deberes pendientes"
        :value="formatNumber(totalPendientes)"
        :detail="`${formatNumber(totalIncumplidos)} incumplidos`"
        :icon="ClipboardListIcon"
        tono="sky"
      />
    </div>

    <Card>
      <CardHeader class="gap-4">
        <div>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busca por nombre, carnet, carrera o procedencia.</CardDescription>
        </div>
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div class="relative md:col-span-2 xl:col-span-1">
            <SearchIcon class="text-muted-foreground pointer-events-none absolute top-2.5 left-2.5 size-4" />
            <Input
              v-model="busqueda"
              class="pl-8"
              placeholder="Buscar estudiante..."
              aria-label="Buscar estudiante"
            />
          </div>

          <Select v-model="provinciaFiltro">
            <SelectTrigger class="w-full" aria-label="Filtrar por provincia">
              <SelectValue placeholder="Provincia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las provincias</SelectItem>
              <SelectItem
                v-for="provincia in provinciasDisponibles"
                :key="provincia"
                :value="provincia"
              >
                {{ provincia }}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select v-model="carreraFiltro">
            <SelectTrigger class="w-full" aria-label="Filtrar por carrera">
              <SelectValue placeholder="Carrera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las carreras</SelectItem>
              <SelectItem v-for="carrera in carrerasDisponibles" :key="carrera" :value="carrera">
                {{ carrera }}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select v-model="edificioFiltro">
            <SelectTrigger class="w-full" aria-label="Filtrar por edificio">
              <SelectValue placeholder="Edificio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los edificios</SelectItem>
              <SelectItem
                v-for="edificio in edificios"
                :key="edificio.id"
                :value="String(edificio.id)"
              >
                {{ edificio.nombre }}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select v-model="tipoFiltro">
            <SelectTrigger class="w-full" aria-label="Filtrar por tipo de ingreso">
              <SelectValue placeholder="Ingreso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los ingresos</SelectItem>
              <SelectItem v-for="tipo in TIPOS_INGRESO" :key="tipo" :value="tipo">
                {{ ETIQUETAS_TIPO_INGRESO[tipo] }}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select v-model="estadoFiltro">
            <SelectTrigger class="w-full" aria-label="Filtrar por estado de beca">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem v-for="estado in ESTADOS_BECA" :key="estado" :value="estado">
                {{ ETIQUETAS_ESTADO_BECA[estado] }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex items-center justify-between gap-3">
          <p class="text-muted-foreground text-xs">
            Mostrando {{ formatNumber(filtrados.length) }} de
            {{ formatNumber(estudiantes.length) }} estudiantes.
          </p>
          <Button v-if="hayFiltros" variant="ghost" size="sm" @click="limpiarFiltros">
            <RotateCcwIcon />
            Limpiar filtros
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div v-if="cargando" class="grid gap-3">
          <Skeleton v-for="indice in 5" :key="indice" class="h-14 w-full" />
        </div>

        <div
          v-else-if="estudiantes.length === 0"
          class="flex flex-col items-center gap-3 py-12 text-center"
        >
          <UsersIcon class="text-muted-foreground size-10" />
          <div>
            <p class="font-medium">No hay estudiantes registrados</p>
            <p class="text-muted-foreground text-sm">
              Importa la matrícula desde la plantilla XLSX para comenzar.
            </p>
          </div>
          <Button v-if="puedeEscribir" @click="importarAbierto = true">
            <FileUpIcon />
            Importar estudiantes
          </Button>
        </div>

        <div
          v-else-if="filtrados.length === 0"
          class="flex flex-col items-center gap-3 py-12 text-center"
        >
          <SearchXIcon class="text-muted-foreground size-10" />
          <div>
            <p class="font-medium">Sin resultados</p>
            <p class="text-muted-foreground text-sm">
              Ajusta la búsqueda o limpia los filtros para ver más estudiantes.
            </p>
          </div>
          <Button variant="outline" @click="limpiarFiltros">Limpiar filtros</Button>
        </div>

        <EstudianteTable
          v-else
          :estudiantes="filtrados"
          :puede-asignar="puedeEscribir"
          @ver="verEstudiante"
          @asignar="abrirAsignacion"
          @editar="abrirEditar"
          @eliminar="solicitarEliminar"
        />
      </CardContent>
    </Card>

    <ConfirmDialog
      v-model:open="confirmacionAbierta"
      titulo="Eliminar estudiante"
      :descripcion="`¿Estás seguro de que deseas dar de baja al estudiante ${estudianteEliminando?.nombre}? Dejará de aparecer como activo.`"
      :cargando="eliminando"
      @confirmar="confirmarEliminacion"
    />

    <ImportarEstudiantesDialog
      v-model:open="importarAbierto"
      :carnets-existentes="carnetsExistentes"
      @importado="alImportar"
    />

    <EstudianteDetalleDialog
      v-model:open="detalleAbierto"
      :estudiante-id="estudianteSeleccionado?.id"
    />

    <AsignarCuartoDialog
      v-model:open="asignarAbierto"
      :estudiante="estudianteSeleccionado"
      @asignado="alAsignar"
    />
  </div>
</template>
