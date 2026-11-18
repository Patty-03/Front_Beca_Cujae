<script setup lang="ts">
import type {
  DiaSinDeberesLeer,
  ExencionLeer,
  TipoDeberLeer,
} from '@/types/planificacion'
import { computed, onMounted, ref, watch } from 'vue'
import {
  AlertCircleIcon,
  LoaderCircleIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
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
import { Label } from '@/components/ui/label'
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
import {
  actualizarDiaSinDeberes,
  actualizarExencion,
  crearDiaSinDeberes,
  crearExencion,
  eliminarDiaSinDeberes,
  eliminarExencion,
  listarDiasSinDeberes,
  listarExenciones,
  listarTiposDeber,
} from '@/services/planificacion'
import { obtenerEstudiantes } from '@/services/estudiantes'
import type { EstudianteResumen } from '@/types/estudiante'
import { formatDate } from '@/lib/format'
import { hoyIso } from '@/lib/planificacion'
import { toast } from 'vue-sonner'

interface DiaForm {
  desde: string
  hasta: string
  motivo: string
  tipoDeberId: number
  cancelarOcurrencias: boolean
}

interface ExencionForm {
  tipoDeberId: number
  desde: string
  hasta: string
  motivo: string
}

const dias = ref<DiaSinDeberesLeer[]>([])
const exenciones = ref<ExencionLeer[]>([])
const tipos = ref<TipoDeberLeer[]>([])
const cargando = ref(true)
const error = ref('')
const procesando = ref(false)
const hoy = hoyIso()

const diaDialogAbierto = ref(false)
const diaEditando = ref<DiaSinDeberesLeer | null>(null)
const diaEliminar = ref<DiaSinDeberesLeer | null>(null)
const diaForm = ref<DiaForm>(diaVacio())

const exencionDialogAbierto = ref(false)
const exencionEditando = ref<ExencionLeer | null>(null)
const exencionEliminar = ref<ExencionLeer | null>(null)
const exencionForm = ref<ExencionForm>(exencionVacia())
const estudianteSeleccionado = ref<{ id: number; nombre: string } | null>(null)
const busquedaEstudiante = ref('')
const resultadosEstudiantes = ref<EstudianteResumen[]>([])
const buscando = ref(false)
const filtroEstudiante = ref('')
const filtroTipo = ref('todos')
let temporizador: ReturnType<typeof setTimeout> | null = null

function diaVacio(): DiaForm {
  return {
    desde: hoyIso(),
    hasta: hoyIso(),
    motivo: '',
    tipoDeberId: 0,
    cancelarOcurrencias: true,
  }
}

function exencionVacia(): ExencionForm {
  return { tipoDeberId: 0, desde: hoyIso(), hasta: '', motivo: '' }
}

const exencionesFiltradas = computed(() => {
  const texto = filtroEstudiante.value.trim().toLowerCase()
  return exenciones.value.filter((exencion) => {
    if (filtroTipo.value !== 'todos' && exencion.tipoDeberId !== Number(filtroTipo.value))
      return false
    if (texto && !exencion.estudiante.toLowerCase().includes(texto)) return false
    return true
  })
})

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const [diasSinDeberes, exencionesDeber, tiposDeber] = await Promise.all([
      listarDiasSinDeberes(),
      listarExenciones(),
      listarTiposDeber(),
    ])
    dias.value = diasSinDeberes
    exenciones.value = exencionesDeber
    tipos.value = tiposDeber
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : 'No se pudieron cargar las excepciones.'
  } finally {
    cargando.value = false
  }
}

function abrirNuevoDia() {
  diaEditando.value = null
  diaForm.value = diaVacio()
  diaDialogAbierto.value = true
}

function abrirEditarDia(dia: DiaSinDeberesLeer) {
  diaEditando.value = dia
  diaForm.value = {
    desde: dia.desde,
    hasta: dia.hasta,
    motivo: dia.motivo,
    tipoDeberId: dia.tipoDeberId ?? 0,
    cancelarOcurrencias: false,
  }
  diaDialogAbierto.value = true
}

async function guardarDia() {
  const form = diaForm.value
  if (!form.desde || !form.hasta || !form.motivo.trim()) {
    toast.warning('Completa el rango de fechas y el motivo.')
    return
  }
  if (form.hasta < form.desde) {
    toast.warning('La fecha hasta no puede ser anterior a desde.')
    return
  }
  procesando.value = true
  try {
    if (diaEditando.value) {
      await actualizarDiaSinDeberes(diaEditando.value.id, {
        desde: form.desde,
        hasta: form.hasta,
        motivo: form.motivo.trim(),
      })
      toast.success('Día sin deberes actualizado')
    } else {
      const creado = await crearDiaSinDeberes({
        desde: form.desde,
        hasta: form.hasta,
        motivo: form.motivo.trim(),
        tipoDeberId: form.tipoDeberId === 0 ? null : form.tipoDeberId,
        cancelarOcurrencias: form.cancelarOcurrencias,
      })
      toast.success('Día sin deberes creado', {
        description:
          creado.ocurrenciasCanceladas > 0
            ? `${creado.ocurrenciasCanceladas} ocurrencias canceladas.`
            : undefined,
      })
    }
    diaDialogAbierto.value = false
    await cargar()
  } catch (caught) {
    toast.error('No se pudo guardar el día sin deberes', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    procesando.value = false
  }
}

async function confirmarEliminarDia() {
  const dia = diaEliminar.value
  if (!dia) return
  procesando.value = true
  try {
    await eliminarDiaSinDeberes(dia.id)
    toast.success('Día sin deberes eliminado')
    diaEliminar.value = null
    await cargar()
  } catch (caught) {
    toast.error('No se pudo eliminar el día sin deberes', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    procesando.value = false
  }
}

watch(busquedaEstudiante, (texto) => {
  if (temporizador) clearTimeout(temporizador)
  if (!texto.trim()) {
    resultadosEstudiantes.value = []
    return
  }
  temporizador = setTimeout(async () => {
    buscando.value = true
    try {
      const lista = await obtenerEstudiantes({ texto: texto.trim() })
      resultadosEstudiantes.value = lista.slice(0, 8)
    } catch {
      resultadosEstudiantes.value = []
    } finally {
      buscando.value = false
    }
  }, 300)
})

function seleccionarEstudiante(estudiante: EstudianteResumen) {
  estudianteSeleccionado.value = { id: estudiante.id, nombre: estudiante.nombre }
  busquedaEstudiante.value = ''
  resultadosEstudiantes.value = []
}

function abrirNuevaExencion() {
  exencionEditando.value = null
  exencionForm.value = exencionVacia()
  estudianteSeleccionado.value = null
  busquedaEstudiante.value = ''
  resultadosEstudiantes.value = []
  exencionDialogAbierto.value = true
}

function abrirEditarExencion(exencion: ExencionLeer) {
  exencionEditando.value = exencion
  exencionForm.value = {
    tipoDeberId: exencion.tipoDeberId ?? 0,
    desde: exencion.desde,
    hasta: exencion.hasta ?? '',
    motivo: exencion.motivo ?? '',
  }
  estudianteSeleccionado.value = {
    id: exencion.estudianteId,
    nombre: exencion.estudiante,
  }
  exencionDialogAbierto.value = true
}

async function guardarExencion() {
  const form = exencionForm.value
  if (!estudianteSeleccionado.value) {
    toast.warning('Selecciona un estudiante.')
    return
  }
  if (!form.desde) {
    toast.warning('Indica desde cuándo aplica la exención.')
    return
  }
  if (form.hasta && form.hasta < form.desde) {
    toast.warning('La fecha hasta no puede ser anterior a desde.')
    return
  }
  procesando.value = true
  try {
    if (exencionEditando.value) {
      await actualizarExencion(exencionEditando.value.id, {
        hasta: form.hasta || null,
        motivo: form.motivo.trim() || null,
      })
      toast.success('Exención actualizada')
    } else {
      await crearExencion({
        estudianteId: estudianteSeleccionado.value.id,
        tipoDeberId: form.tipoDeberId === 0 ? null : form.tipoDeberId,
        desde: form.desde,
        hasta: form.hasta || null,
        motivo: form.motivo.trim() || null,
      })
      toast.success('Exención creada')
    }
    exencionDialogAbierto.value = false
    await cargar()
  } catch (caught) {
    toast.error('No se pudo guardar la exención', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    procesando.value = false
  }
}

async function confirmarEliminarExencion() {
  const exencion = exencionEliminar.value
  if (!exencion) return
  procesando.value = true
  try {
    await eliminarExencion(exencion.id)
    toast.success('Exención eliminada')
    exencionEliminar.value = null
    await cargar()
  } catch (caught) {
    toast.error('No se pudo eliminar la exención', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    procesando.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h3 class="text-base font-semibold">Excepciones</h3>
        <p class="text-muted-foreground mt-0.5 text-sm">
          Los días sin deberes evitan generar ocurrencias; las exenciones sacan a un
          estudiante de un tipo de deber durante un rango de fechas.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" :disabled="cargando" @click="cargar">
          <RefreshCwIcon :class="{ 'animate-spin': cargando }" />
          Refrescar
        </Button>
        <Button variant="outline" @click="abrirNuevaExencion">
          <PlusIcon />
          Nueva exención
        </Button>
        <Button @click="abrirNuevoDia">
          <PlusIcon />
          Nuevo día sin deberes
        </Button>
      </div>
    </div>

    <Alert v-if="error" variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>No se pudieron cargar las excepciones</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <div v-if="cargando" class="text-muted-foreground flex items-center gap-2 py-6 text-sm">
      <LoaderCircleIcon class="animate-spin" />
      Cargando excepciones…
    </div>

    <div v-else class="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Días sin deberes</CardTitle>
          <CardDescription>
            Fechas en las que no se generan deberes. Puede aplicar a un tipo concreto.
          </CardDescription>
        </CardHeader>
        <CardContent class="px-0">
          <div class="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rango</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead class="text-right">Canceladas</TableHead>
                  <TableHead class="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="dias.length === 0">
                  <TableCell colspan="5">
                    <div class="text-muted-foreground py-6 text-center text-sm">
                      No hay días sin deberes registrados.
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow v-for="dia in dias" :key="dia.id">
                  <TableCell>
                    <div class="text-sm font-medium">
                      {{ formatDate(dia.desde) }} — {{ formatDate(dia.hasta) }}
                    </div>
                  </TableCell>
                  <TableCell>{{ dia.motivo }}</TableCell>
                  <TableCell>{{ dia.tipoDeber ?? 'Todos' }}</TableCell>
                  <TableCell class="text-right tabular-nums">
                    {{ dia.ocurrenciasCanceladas }}
                  </TableCell>
                  <TableCell>
                    <div class="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Editar"
                        @click="abrirEditarDia(dia)"
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Eliminar"
                        @click="diaEliminar = dia"
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

      <Card>
        <CardHeader class="gap-3">
          <div>
            <CardTitle>Exenciones de estudiantes</CardTitle>
            <CardDescription>
              Un estudiante exento no se asigna a ese tipo de deber mientras esté vigente.
            </CardDescription>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row">
            <div class="relative flex-1">
              <SearchIcon
                class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
              />
              <Input
                v-model="filtroEstudiante"
                placeholder="Filtrar por estudiante"
                class="pl-8"
              />
            </div>
            <Select v-model="filtroTipo">
              <SelectTrigger class="w-full sm:w-40">
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
        </CardHeader>
        <CardContent class="px-0">
          <div class="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead class="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="exencionesFiltradas.length === 0">
                  <TableCell colspan="5">
                    <div class="text-muted-foreground py-6 text-center text-sm">
                      No hay exenciones que coincidan con el filtro.
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow v-for="exencion in exencionesFiltradas" :key="exencion.id">
                  <TableCell>
                    <div class="font-medium">{{ exencion.estudiante }}</div>
                    <div v-if="exencion.motivo" class="text-muted-foreground text-xs">
                      {{ exencion.motivo }}
                    </div>
                  </TableCell>
                  <TableCell>{{ exencion.tipoDeber ?? 'Todos' }}</TableCell>
                  <TableCell class="text-sm">
                    {{ formatDate(exencion.desde) }}
                    {{ exencion.hasta ? `— ${formatDate(exencion.hasta)}` : '' }}
                  </TableCell>
                  <TableCell>
                    <Badge :variant="exencion.vigente ? 'secondary' : 'outline'">
                      {{ exencion.vigente ? 'Vigente' : 'Fuera de fecha' }}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div class="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Editar"
                        @click="abrirEditarExencion(exencion)"
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        :disabled="exencion.desde <= hoy"
                        :title="
                          exencion.desde <= hoy
                            ? 'Ya empezó: ciérrala indicando una fecha hasta'
                            : 'Eliminar'
                        "
                        @click="exencionEliminar = exencion"
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
    </div>

    <Dialog v-model:open="diaDialogAbierto">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {{ diaEditando ? 'Editar día sin deberes' : 'Nuevo día sin deberes' }}
          </DialogTitle>
          <DialogDescription>
            Al crearlo puedes cancelar las ocurrencias del rango. Las asignaciones
            planificadas de esas ocurrencias se retiran.
          </DialogDescription>
        </DialogHeader>

        <div class="grid gap-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="dia-desde">Desde</Label>
              <Input id="dia-desde" v-model="diaForm.desde" type="date" />
            </div>
            <div class="space-y-1.5">
              <Label for="dia-hasta">Hasta</Label>
              <Input id="dia-hasta" v-model="diaForm.hasta" type="date" />
            </div>
          </div>

          <div class="space-y-1.5">
            <Label for="dia-motivo">Motivo</Label>
            <Input id="dia-motivo" v-model="diaForm.motivo" placeholder="Feriado, actividad…" />
          </div>

          <div v-if="!diaEditando" class="space-y-1.5">
            <Label>Tipo de deber</Label>
            <Select v-model="diaForm.tipoDeberId">
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="0">Todos los tipos</SelectItem>
                <SelectItem v-for="tipo in tipos" :key="tipo.id" :value="tipo.id">
                  {{ tipo.nombre }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <label v-if="!diaEditando" class="flex items-start gap-2 text-sm">
            <input
              v-model="diaForm.cancelarOcurrencias"
              type="checkbox"
              class="border-input mt-0.5 size-4 rounded"
            />
            <span>
              Cancelar las ocurrencias existentes del rango (desde hoy en adelante).
            </span>
          </label>
        </div>

        <DialogFooter>
          <DialogClose as-child>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button type="button" :disabled="procesando" @click="guardarDia">
            <LoaderCircleIcon v-if="procesando" class="animate-spin" />
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="exencionDialogAbierto">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {{ exencionEditando ? 'Editar exención' : 'Nueva exención' }}
          </DialogTitle>
          <DialogDescription>
            Al editar solo se puede cambiar la fecha hasta y el motivo. Una exención que ya
            empezó no se elimina: se cierra.
          </DialogDescription>
        </DialogHeader>

        <div class="grid gap-4">
          <div class="space-y-1.5">
            <Label>Estudiante</Label>
            <div v-if="exencionEditando || estudianteSeleccionado" class="space-y-2">
              <div class="flex items-center justify-between rounded-md border px-2.5 py-2">
                <span class="text-sm font-medium">
                  {{ estudianteSeleccionado?.nombre }}
                </span>
                <Button
                  v-if="!exencionEditando"
                  variant="ghost"
                  size="icon-sm"
                  title="Quitar selección"
                  @click="estudianteSeleccionado = null"
                >
                  <XIcon />
                </Button>
              </div>
            </div>
            <div v-else class="space-y-2">
              <div class="relative">
                <SearchIcon
                  class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
                />
                <Input
                  v-model="busquedaEstudiante"
                  placeholder="Buscar por nombre o carnet"
                  class="pl-8"
                />
              </div>
              <div v-if="buscando" class="text-muted-foreground text-xs">Buscando…</div>
              <div v-else-if="resultadosEstudiantes.length" class="rounded-md border">
                <button
                  v-for="estudiante in resultadosEstudiantes"
                  :key="estudiante.id"
                  type="button"
                  class="hover:bg-muted flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left text-sm"
                  @click="seleccionarEstudiante(estudiante)"
                >
                  <span class="truncate">{{ estudiante.nombre }}</span>
                  <span class="text-muted-foreground text-xs">{{ estudiante.carnet }}</span>
                </button>
              </div>
            </div>
          </div>

          <div v-if="!exencionEditando" class="space-y-1.5">
            <Label>Tipo de deber</Label>
            <Select v-model="exencionForm.tipoDeberId">
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="0">Todos los tipos</SelectItem>
                <SelectItem v-for="tipo in tipos" :key="tipo.id" :value="tipo.id">
                  {{ tipo.nombre }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="exencion-desde">Desde</Label>
              <Input
                id="exencion-desde"
                v-model="exencionForm.desde"
                type="date"
                :disabled="!!exencionEditando"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="exencion-hasta">Hasta</Label>
              <Input id="exencion-hasta" v-model="exencionForm.hasta" type="date" />
            </div>
          </div>

          <div class="space-y-1.5">
            <Label for="exencion-motivo">Motivo</Label>
            <Input
              id="exencion-motivo"
              v-model="exencionForm.motivo"
              placeholder="Lesión, viaje, trámite…"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose as-child>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button type="button" :disabled="procesando" @click="guardarExencion">
            <LoaderCircleIcon v-if="procesando" class="animate-spin" />
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      :open="diaEliminar !== null"
      titulo="Eliminar día sin deberes"
      descripcion="Se eliminará el registro. Las ocurrencias ya canceladas no se reactivan automáticamente."
      :cargando="procesando"
      @update:open="(valor) => { if (!valor) diaEliminar = null }"
      @confirmar="confirmarEliminarDia"
    />

    <ConfirmDialog
      :open="exencionEliminar !== null"
      titulo="Eliminar exención"
      descripcion="Se eliminará la exención. Solo es posible si aún no ha empezado."
      :cargando="procesando"
      @update:open="(valor) => { if (!valor) exencionEliminar = null }"
      @confirmar="confirmarEliminarExencion"
    />
  </div>
</template>
