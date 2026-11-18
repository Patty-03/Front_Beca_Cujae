<script setup lang="ts">
import type { PeriodoLeer } from '@/types/planificacion'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertCircleIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ListChecksIcon,
  LoaderCircleIcon,
  LockIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
  Edit3Icon,
  ArrowRightIcon,
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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ConfirmDialog from '@/components/infraestructura/ConfirmDialog.vue'
import KpiCard from '@/components/infraestructura/KpiCard.vue'
import PeriodoDialog from '@/components/planificacion/PeriodoDialog.vue'
import ConfiguracionGeneralPanel from '@/components/planificacion/ConfiguracionGeneralPanel.vue'
import { eliminarPeriodo, listarPeriodos, publicarPeriodo } from '@/services/planificacion'
import {
  etiquetaEstadoPeriodo,
  puedeEliminarPeriodo,
  puedePublicarPeriodo,
  varianteEstadoPeriodo,
} from '@/lib/planificacion'
import { formatDate, formatNumber } from '@/lib/format'
import { toast } from 'vue-sonner'

const router = useRouter()

const periodos = ref<PeriodoLeer[]>([])
const cargando = ref(true)
const error = ref('')
const busqueda = ref('')
const estadoFiltro = ref('todos')

const dialogPeriodoAbierto = ref(false)
const periodoEditando = ref<PeriodoLeer | null>(null)
const periodoEliminar = ref<PeriodoLeer | null>(null)
const eliminando = ref(false)
const publicandoId = ref<number | null>(null)
const periodoPublicar = ref<PeriodoLeer | null>(null)

const resumen = computed(() => ({
  total: periodos.value.length,
  borradores: periodos.value.filter((item) => item.estado === 'BORRADOR').length,
  publicados: periodos.value.filter((item) => item.estado === 'PUBLICADO').length,
  cerrados: periodos.value.filter((item) => item.estado === 'CERRADO').length,
}))

const filtrados = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  return periodos.value.filter((periodo) => {
    if (estadoFiltro.value !== 'todos' && periodo.estado !== estadoFiltro.value) return false
    if (!texto) return true
    return `${periodo.inicio} ${periodo.fin} ${periodo.estado}`.toLowerCase().includes(texto)
  })
})

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    periodos.value = await listarPeriodos()
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : 'No se pudieron cargar los períodos.'
  } finally {
    cargando.value = false
  }
}

function nuevoPeriodo() {
  periodoEditando.value = null
  dialogPeriodoAbierto.value = true
}

function editarPeriodo(periodo: PeriodoLeer) {
  periodoEditando.value = periodo
  dialogPeriodoAbierto.value = true
}

function abrirPeriodo(periodo: PeriodoLeer) {
  void router.push({ name: 'planificacion-periodo', params: { periodoId: periodo.id } })
}

async function confirmarPublicar() {
  const periodo = periodoPublicar.value
  if (!periodo) return
  publicandoId.value = periodo.id
  try {
    await publicarPeriodo(periodo.id)
    toast.success('Período publicado')
    periodoPublicar.value = null
    await cargar()
  } catch (caught) {
    toast.error('No se pudo publicar el período', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    publicandoId.value = null
  }
}

async function confirmarEliminar() {
  const periodo = periodoEliminar.value
  if (!periodo) return
  eliminando.value = true
  try {
    await eliminarPeriodo(periodo.id)
    toast.success('Período eliminado')
    periodoEliminar.value = null
    await cargar()
  } catch (caught) {
    toast.error('No se pudo eliminar el período', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    eliminando.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Planificación de deberes</h1>
        <p class="text-muted-foreground mt-1 text-sm">
          Configura los turnos y catálogos, planifica cada período y controla el
          cumplimiento de los deberes.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" :disabled="cargando" @click="cargar">
          <RefreshCwIcon :class="{ 'animate-spin': cargando }" />
          Refrescar
        </Button>
        <Button @click="nuevoPeriodo">
          <PlusIcon />
          Nuevo período
        </Button>
      </div>
    </div>

    <Alert v-if="error" variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>No se pudieron cargar los períodos</AlertTitle>
      <AlertDescription>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>{{ error }}</span>
          <Button variant="outline" size="sm" @click="cargar">Reintentar</Button>
        </div>
      </AlertDescription>
    </Alert>

    <Tabs default-value="periodos" class="space-y-4">
      <TabsList>
        <TabsTrigger value="periodos">
          <CalendarIcon />
          Períodos
        </TabsTrigger>
        <TabsTrigger value="configuracion">
          <ListChecksIcon />
          Configuración general
        </TabsTrigger>
      </TabsList>

      <TabsContent value="periodos" class="space-y-4">
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Períodos" :value="formatNumber(resumen.total)" :icon="CalendarIcon" />
          <KpiCard
            label="Borradores"
            :value="formatNumber(resumen.borradores)"
            :icon="Edit3Icon"
            tono="amber"
          />
          <KpiCard
            label="Publicados"
            :value="formatNumber(resumen.publicados)"
            :icon="CheckCircle2Icon"
            tono="emerald"
          />
          <KpiCard
            label="Cerrados"
            :value="formatNumber(resumen.cerrados)"
            :icon="LockIcon"
            tono="sky"
          />
        </div>

        <Card>
          <CardHeader class="gap-3">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Períodos de planificación</CardTitle>
                <CardDescription>
                  Abre un período para planificar, generar y revisar sus deberes.
                </CardDescription>
              </div>
              <div class="flex flex-col gap-2 sm:flex-row">
                <div class="relative">
                  <SearchIcon
                    class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
                  />
                  <Input
                    v-model="busqueda"
                    placeholder="Buscar por fecha o estado"
                    class="w-full pl-8 sm:w-64"
                  />
                </div>
                <Select v-model="estadoFiltro">
                  <SelectTrigger class="w-full sm:w-40">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="BORRADOR">Borradores</SelectItem>
                    <SelectItem value="PUBLICADO">Publicados</SelectItem>
                    <SelectItem value="CERRADO">Cerrados</SelectItem>
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
                    <TableHead>Rango</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead class="text-right">Planes</TableHead>
                    <TableHead class="text-right">Ocurrencias</TableHead>
                    <TableHead class="text-right">Asignaciones</TableHead>
                    <TableHead class="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-if="cargando">
                    <TableCell colspan="6">
                      <div class="text-muted-foreground flex items-center gap-2 py-6">
                        <LoaderCircleIcon class="animate-spin" />
                        Cargando períodos…
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow v-else-if="filtrados.length === 0">
                    <TableCell colspan="6">
                      <div class="text-muted-foreground py-8 text-center text-sm">
                        No hay períodos que coincidan con el filtro.
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow
                    v-for="periodo in filtrados"
                    v-else
                    :key="periodo.id"
                    class="cursor-pointer"
                    @click="abrirPeriodo(periodo)"
                  >
                    <TableCell>
                      <div class="font-medium">
                        {{ formatDate(periodo.inicio) }} — {{ formatDate(periodo.fin) }}
                      </div>
                      <div class="text-muted-foreground text-xs">Período #{{ periodo.id }}</div>
                    </TableCell>
                    <TableCell>
                      <Badge :variant="varianteEstadoPeriodo(periodo.estado)">
                        {{ etiquetaEstadoPeriodo(periodo.estado) }}
                      </Badge>
                    </TableCell>
                    <TableCell class="text-right tabular-nums">
                      {{ formatNumber(periodo.planes) }}
                    </TableCell>
                    <TableCell class="text-right tabular-nums">
                      {{ formatNumber(periodo.ocurrencias) }}
                    </TableCell>
                    <TableCell class="text-right tabular-nums">
                      {{ formatNumber(periodo.asignaciones) }}
                    </TableCell>
                    <TableCell>
                      <div class="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Abrir período"
                          @click.stop="abrirPeriodo(periodo)"
                        >
                          <ArrowRightIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          :disabled="periodo.estado === 'CERRADO'"
                          title="Publicar"
                          @click.stop="periodoPublicar = periodo"
                        >
                          <CheckCircle2Icon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          :disabled="periodo.estado !== 'BORRADOR'"
                          title="Editar"
                          @click.stop="editarPeriodo(periodo)"
                        >
                          <Edit3Icon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          :disabled="!puedeEliminarPeriodo(periodo)"
                          title="Eliminar"
                          @click.stop="periodoEliminar = periodo"
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
      </TabsContent>

      <TabsContent value="configuracion">
        <ConfiguracionGeneralPanel />
      </TabsContent>
    </Tabs>

    <PeriodoDialog
      v-model:open="dialogPeriodoAbierto"
      :periodo="periodoEditando"
      @guardado="cargar"
    />

    <ConfirmDialog
      :open="periodoEliminar !== null"
      titulo="Eliminar período"
      :descripcion="`Se eliminará el período ${periodoEliminar ? `${formatDate(periodoEliminar.inicio)} — ${formatDate(periodoEliminar.fin)}` : ''}. Solo es posible en BORRADOR y sin ocurrencias generadas.`"
      :cargando="eliminando"
      @update:open="(valor) => { if (!valor) periodoEliminar = null }"
      @confirmar="confirmarEliminar"
    />

    <Dialog :open="periodoPublicar !== null" @update:open="(valor) => { if (!valor) periodoPublicar = null }">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publicar período</DialogTitle>
          <DialogDescription>
            Al publicar el período se habilita el trabajo operativo: generar asignaciones,
            revisarlas y registrar cumplimiento. El período debe tener al menos un plan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            :disabled="publicandoId !== null || !periodoPublicar || !puedePublicarPeriodo(periodoPublicar)"
            @click="confirmarPublicar"
          >
            <LoaderCircleIcon v-if="publicandoId !== null" class="animate-spin" />
            Publicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
