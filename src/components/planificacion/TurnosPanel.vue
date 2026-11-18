<script setup lang="ts">
import type {
  ConfiguracionCrearInput,
  ConfiguracionLeer,
  ExpandirPor,
  FrecuenciaDeber,
  HorarioLeer,
  ModalidadDeber,
  TipoDeberLeer,
} from '@/types/planificacion'
import type {
  ConjuntoCrearInput,
  ConjuntoResumen,
  ConjuntoVersionInput,
} from '@/types/reglas'
import { computed, onMounted, ref } from 'vue'
import {
  AlertCircleIcon,
  CopyIcon,
  LoaderCircleIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
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
import EditorConjuntoRegla from '@/components/reglas/EditorConjuntoRegla.vue'
import {
  actualizarConfiguracion,
  crearConfiguracion,
  eliminarConfiguracion,
  listarConfiguraciones,
  listarHorarios,
  listarTiposDeber,
  versionarConfiguracion,
} from '@/services/planificacion'
import { crearConjunto, listarConjuntos } from '@/services/reglas'
import { formatDate } from '@/lib/format'
import { hoyIso } from '@/lib/planificacion'
import { toast } from 'vue-sonner'

interface ConfigForm {
  tipoDeberId: number | ''
  nombre: string
  horarioId: number | ''
  conjuntoReglaId: number | ''
  modalidad: ModalidadDeber
  cantPersonas: string
  puntos: string
  frecuencia: FrecuenciaDeber
  intervalo: string
  fechaInicio: string
  fechaFin: string
  expandirPor: ExpandirPor
  diasSemana: number[]
}

const configuraciones = ref<ConfiguracionLeer[]>([])
const tipos = ref<TipoDeberLeer[]>([])
const horarios = ref<HorarioLeer[]>([])
const conjuntos = ref<ConjuntoResumen[]>([])
const cargando = ref(true)
const error = ref('')
const tipoFiltro = ref('todos')
const mostrarHistoricas = ref(false)

const dialogAbierto = ref(false)
const configEditando = ref<ConfiguracionLeer | null>(null)
const guardando = ref(false)
const conjuntoEditorAbierto = ref(false)
const configEliminar = ref<ConfiguracionLeer | null>(null)
const configVersionar = ref<ConfiguracionLeer | null>(null)
const procesando = ref(false)

const configForm = ref<ConfigForm>(formularioVacio())

function formularioVacio(): ConfigForm {
  return {
    tipoDeberId: '',
    nombre: '',
    horarioId: '',
    conjuntoReglaId: '',
    modalidad: 'TURNADA',
    cantPersonas: '1',
    puntos: '1',
    frecuencia: 'DIARIA',
    intervalo: '1',
    fechaInicio: hoyIso(),
    fechaFin: '',
    expandirPor: 'NINGUNO',
    diasSemana: [1, 2, 3, 4, 5, 6, 7],
  }
}

const filtradas = computed(() =>
  configuraciones.value.filter((configuracion) => {
    if (tipoFiltro.value !== 'todos' && configuracion.tipoDeberId !== Number(tipoFiltro.value))
      return false
    if (!mostrarHistoricas.value && !configuracion.esUltima) return false
    return true
  }),
)

const nombreConjuntoSugerido = computed(() => {
  const tipo = tipos.value.find((item) => item.id === configForm.value.tipoDeberId)
  return `Rotación ${tipo?.nombre ?? 'de deber'}`
})

const modalidades: { value: ModalidadDeber; label: string }[] = [
  { value: 'TURNADA', label: 'Turnada (cupos fijos)' },
  { value: 'TODOS_LOS_ELEGIBLES', label: 'Todos los elegibles' },
  { value: 'MANUAL', label: 'Manual' },
]

const frecuencias: { value: FrecuenciaDeber; label: string }[] = [
  { value: 'UNICA', label: 'Única' },
  { value: 'DIARIA', label: 'Diaria' },
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'MENSUAL', label: 'Mensual' },
  { value: 'ANUAL', label: 'Anual' },
]

const dias = [
  { value: 1, label: 'L' },
  { value: 2, label: 'M' },
  { value: 3, label: 'X' },
  { value: 4, label: 'J' },
  { value: 5, label: 'V' },
  { value: 6, label: 'S' },
  { value: 7, label: 'D' },
]

function etiquetaModalidad(valor: string) {
  return modalidades.find((item) => item.value === valor)?.label ?? valor
}

function etiquetaFrecuencia(valor: string) {
  return frecuencias.find((item) => item.value === valor)?.label ?? valor
}

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const [lista, tiposDeber, horariosDeber, conjuntosDeber] = await Promise.all([
      listarConfiguraciones(),
      listarTiposDeber(),
      listarHorarios(),
      listarConjuntos({ ambito: 'DEBER', vigente: true }),
    ])
    configuraciones.value = lista
    tipos.value = tiposDeber
    horarios.value = horariosDeber
    conjuntos.value = conjuntosDeber
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : 'No se pudieron cargar los turnos.'
  } finally {
    cargando.value = false
  }
}

function nuevoTurno() {
  configEditando.value = null
  configForm.value = formularioVacio()
  dialogAbierto.value = true
}

function editarTurno(configuracion: ConfiguracionLeer) {
  configEditando.value = configuracion
  configForm.value = {
    tipoDeberId: configuracion.tipoDeberId,
    nombre: configuracion.nombre,
    horarioId: configuracion.horarioId ?? '',
    conjuntoReglaId: configuracion.conjuntoReglaId ?? '',
    modalidad: configuracion.modalidad as ModalidadDeber,
    cantPersonas: String(configuracion.cantPersonas ?? ''),
    puntos: String(configuracion.puntos ?? 1),
    frecuencia: configuracion.frecuencia as FrecuenciaDeber,
    intervalo: String(configuracion.intervalo ?? 1),
    fechaInicio: configuracion.fechaInicio,
    fechaFin: configuracion.fechaFin ?? '',
    expandirPor: configuracion.expandirPor as ExpandirPor,
    diasSemana: [...configuracion.diasSemana],
  }
  dialogAbierto.value = true
}

async function guardarTurno() {
  const form = configForm.value
  if (!form.tipoDeberId || !form.nombre.trim() || !form.fechaInicio) {
    toast.warning('Completa el tipo de deber, el nombre y la fecha de inicio.')
    return
  }
  if (form.diasSemana.length === 0) {
    toast.warning('Selecciona al menos un día de la semana.')
    return
  }
  if (form.frecuencia !== 'UNICA' && form.fechaFin && form.fechaFin < form.fechaInicio) {
    toast.warning('La fecha fin no puede ser anterior al inicio.')
    return
  }
  const input: ConfiguracionCrearInput = {
    tipoDeberId: Number(form.tipoDeberId),
    nombre: form.nombre.trim(),
    horarioId:
      form.horarioId === '' || form.horarioId === 0 ? null : Number(form.horarioId),
    conjuntoReglaId:
      form.conjuntoReglaId === '' || form.conjuntoReglaId === 0
        ? null
        : Number(form.conjuntoReglaId),
    modalidad: form.modalidad,
    cantPersonas: form.modalidad === 'TURNADA' ? Number(form.cantPersonas || 1) : null,
    puntos: Number(form.puntos || 1),
    frecuencia: form.frecuencia,
    intervalo: Number(form.intervalo || 1),
    fechaInicio: form.fechaInicio,
    fechaFin: form.frecuencia === 'UNICA' ? null : form.fechaFin || null,
    expandirPor: form.expandirPor,
    diasSemana: form.diasSemana,
  }
  guardando.value = true
  try {
    if (configEditando.value) {
      await actualizarConfiguracion(configEditando.value.id, input)
      toast.success('Turno actualizado')
    } else {
      await crearConfiguracion(input)
      toast.success('Turno creado')
    }
    dialogAbierto.value = false
    await cargar()
  } catch (caught) {
    toast.error('No se pudo guardar el turno', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    guardando.value = false
  }
}

async function confirmarVersionar() {
  const configuracion = configVersionar.value
  if (!configuracion) return
  procesando.value = true
  try {
    await versionarConfiguracion(configuracion.id)
    toast.success('Nueva versión creada')
    configVersionar.value = null
    await cargar()
  } catch (caught) {
    toast.error('No se pudo versionar el turno', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    procesando.value = false
  }
}

async function confirmarRetirar() {
  const configuracion = configEliminar.value
  if (!configuracion) return
  procesando.value = true
  try {
    await eliminarConfiguracion(configuracion.id)
    toast.success(
      configuracion.enUso
        ? 'Turno retirado: termina hoy y no generará nuevas ocurrencias'
        : 'Turno eliminado',
    )
    configEliminar.value = null
    await cargar()
  } catch (caught) {
    toast.error('No se pudo retirar el turno', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    procesando.value = false
  }
}

async function crearConjuntoDeber(input: ConjuntoCrearInput | ConjuntoVersionInput) {
  if (!('nombre' in input)) return
  try {
    const creado = await crearConjunto(input)
    toast.success('Conjunto de reglas creado', { description: creado.nombre })
    conjuntoEditorAbierto.value = false
    const lista = await listarConjuntos({ ambito: 'DEBER', vigente: true })
    conjuntos.value = lista
    configForm.value.conjuntoReglaId = creado.id
  } catch (caught) {
    toast.error('No se pudo crear el conjunto de reglas', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  }
}

onMounted(cargar)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h3 class="text-base font-semibold">Turnos de deberes</h3>
        <p class="text-muted-foreground mt-0.5 text-sm">
          Cada turno define cuándo y para cuántas personas se genera una ocurrencia. Si ya
          tiene ocurrencias, crea una versión nueva.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" :disabled="cargando" @click="cargar">
          <RefreshCwIcon :class="{ 'animate-spin': cargando }" />
          Refrescar
        </Button>
        <Button variant="outline" @click="conjuntoEditorAbierto = true">
          <PlusIcon />
          Conjunto de reglas
        </Button>
        <Button @click="nuevoTurno">
          <PlusIcon />
          Nuevo turno
        </Button>
      </div>
    </div>

    <Alert v-if="error" variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>No se pudieron cargar los turnos</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <Card>
      <CardHeader class="gap-3">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Configuraciones</CardTitle>
            <CardDescription>
              Los turnos activos alimentan la generación de ocurrencias.
            </CardDescription>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select v-model="tipoFiltro">
              <SelectTrigger class="w-full sm:w-44">
                <SelectValue placeholder="Tipo de deber" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem v-for="tipo in tipos" :key="tipo.id" :value="String(tipo.id)">
                  {{ tipo.nombre }}
                </SelectItem>
              </SelectContent>
            </Select>
            <label class="flex items-center gap-2 text-sm">
              <input
                v-model="mostrarHistoricas"
                type="checkbox"
                class="border-input size-4 rounded"
              />
              Ver versiones anteriores
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent class="px-0">
        <div class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Turno</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Modalidad</TableHead>
                <TableHead>Frecuencia</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Versión</TableHead>
                <TableHead class="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="cargando">
                <TableCell colspan="8">
                  <div class="text-muted-foreground flex items-center gap-2 py-6">
                    <LoaderCircleIcon class="animate-spin" />
                    Cargando turnos…
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-else-if="filtradas.length === 0">
                <TableCell colspan="8">
                  <div class="text-muted-foreground py-8 text-center text-sm">
                    No hay turnos configurados con ese filtro.
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-for="configuracion in filtradas" v-else :key="configuracion.id">
                <TableCell>
                  <div class="font-medium">{{ configuracion.nombre }}</div>
                  <div class="text-muted-foreground text-xs">#{{ configuracion.id }}</div>
                </TableCell>
                <TableCell>{{ configuracion.tipoDeber }}</TableCell>
                <TableCell>{{ configuracion.horario ?? '—' }}</TableCell>
                <TableCell>
                  <div>{{ etiquetaModalidad(configuracion.modalidad) }}</div>
                  <div v-if="configuracion.cantPersonas != null" class="text-muted-foreground text-xs">
                    {{ configuracion.cantPersonas }} personas
                  </div>
                </TableCell>
                <TableCell>
                  <div>{{ etiquetaFrecuencia(configuracion.frecuencia) }}</div>
                  <div class="text-muted-foreground text-xs">
                    cada {{ configuracion.intervalo }}
                  </div>
                </TableCell>
                <TableCell>
                  <div class="text-xs">
                    {{ formatDate(configuracion.fechaInicio) }}
                    {{ configuracion.fechaFin ? `— ${formatDate(configuracion.fechaFin)}` : '' }}
                  </div>
                  <Badge :variant="configuracion.vigente ? 'secondary' : 'outline'" class="mt-1">
                    {{ configuracion.vigente ? 'Vigente' : 'Histórico' }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge :variant="configuracion.esUltima ? 'default' : 'outline'">
                    v{{ configuracion.esUltima ? 'actual' : 'anterior' }}
                  </Badge>
                  <Badge v-if="configuracion.enUso" variant="outline" class="mt-1">
                    En uso
                  </Badge>
                </TableCell>
                <TableCell>
                  <div class="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Editar"
                      :disabled="configuracion.enUso || !configuracion.esUltima"
                      @click="editarTurno(configuracion)"
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Versionar"
                      :disabled="
                        !configuracion.esUltima || configuracion.frecuencia === 'UNICA'
                      "
                      @click="configVersionar = configuracion"
                    >
                      <CopyIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Retirar"
                      :disabled="
                        !configuracion.esUltima ||
                        (configuracion.enUso && configuracion.frecuencia === 'UNICA')
                      "
                      @click="configEliminar = configuracion"
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

    <Dialog v-model:open="dialogAbierto">
      <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ configEditando ? 'Editar turno' : 'Nuevo turno' }}</DialogTitle>
          <DialogDescription>
            Un turno con ocurrencias no se edita: crea una versión nueva para cambiar sus
            reglas de generación.
          </DialogDescription>
        </DialogHeader>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-1.5 sm:col-span-2">
            <Label for="turno-nombre">Nombre</Label>
            <Input id="turno-nombre" v-model="configForm.nombre" placeholder="Turno de desayuno" />
          </div>

          <div class="space-y-1.5">
            <Label>Tipo de deber</Label>
            <Select v-model="configForm.tipoDeberId">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="tipo in tipos" :key="tipo.id" :value="tipo.id">
                  {{ tipo.nombre }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label>Horario</Label>
            <Select v-model="configForm.horarioId">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Sin horario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="0">Sin horario</SelectItem>
                <SelectItem v-for="horario in horarios" :key="horario.id" :value="horario.id">
                  {{ horario.inicio.slice(0, 5) }} - {{ horario.fin.slice(0, 5) }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label>Conjunto de reglas</Label>
            <div class="flex gap-2">
              <Select v-model="configForm.conjuntoReglaId" class="flex-1">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Sin conjunto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem :value="0">Sin conjunto</SelectItem>
                  <SelectItem
                    v-for="conjunto in conjuntos"
                    :key="conjunto.id"
                    :value="conjunto.id"
                  >
                    {{ conjunto.nombre }} (v{{ conjunto.version }})
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Crear conjunto de reglas"
                @click="conjuntoEditorAbierto = true"
              >
                <PlusIcon />
              </Button>
            </div>
          </div>

          <div class="space-y-1.5">
            <Label>Modalidad</Label>
            <Select v-model="configForm.modalidad">
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="item in modalidades" :key="item.value" :value="item.value">
                  {{ item.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div v-if="configForm.modalidad === 'TURNADA'" class="space-y-1.5">
            <Label for="turno-cant">Personas por ocurrencia</Label>
            <Input id="turno-cant" v-model="configForm.cantPersonas" type="number" min="1" />
          </div>

          <div class="space-y-1.5">
            <Label for="turno-puntos">Puntos de carga</Label>
            <Input id="turno-puntos" v-model="configForm.puntos" type="number" min="0" />
          </div>

          <div class="space-y-1.5">
            <Label>Frecuencia</Label>
            <Select v-model="configForm.frecuencia">
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="item in frecuencias" :key="item.value" :value="item.value">
                  {{ item.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label for="turno-intervalo">Intervalo</Label>
            <Input id="turno-intervalo" v-model="configForm.intervalo" type="number" min="1" />
          </div>

          <div class="space-y-1.5">
            <Label for="turno-inicio">Vigente desde</Label>
            <Input id="turno-inicio" v-model="configForm.fechaInicio" type="date" />
          </div>

          <div v-if="configForm.frecuencia !== 'UNICA'" class="space-y-1.5">
            <Label for="turno-fin">Vigente hasta</Label>
            <Input id="turno-fin" v-model="configForm.fechaFin" type="date" />
          </div>

          <div class="space-y-1.5">
            <Label>Expandir por</Label>
            <Select v-model="configForm.expandirPor">
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NINGUNO">No expandir</SelectItem>
                <SelectItem value="EDIFICIO">Edificio</SelectItem>
                <SelectItem value="ESCALERA">Escalera</SelectItem>
                <SelectItem value="CUARTO">Cuarto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5 sm:col-span-2">
            <Label>Días de la semana</Label>
            <div class="flex flex-wrap gap-3">
              <label
                v-for="dia in dias"
                :key="dia.value"
                class="flex items-center gap-2 text-sm"
              >
                <input
                  v-model="configForm.diasSemana"
                  type="checkbox"
                  :value="dia.value"
                  class="border-input size-4 rounded"
                />
                {{ dia.label }}
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose as-child>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button type="button" :disabled="guardando" @click="guardarTurno">
            <LoaderCircleIcon v-if="guardando" class="animate-spin" />
            {{ configEditando ? 'Guardar cambios' : 'Crear turno' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="conjuntoEditorAbierto">
      <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Nuevo conjunto de reglas de deber</DialogTitle>
          <DialogDescription>
            Define las condiciones y prioridades que usarán los turnos al asignar deberes.
          </DialogDescription>
        </DialogHeader>
        <EditorConjuntoRegla
          ambito="DEBER"
          :modelo="null"
          :nombre-sugerido="nombreConjuntoSugerido"
          @guardar="crearConjuntoDeber"
          @cancelar="conjuntoEditorAbierto = false"
        />
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      :open="configVersionar !== null"
      titulo="Crear nueva versión"
      :descripcion="`La versión actual de ${configVersionar?.nombre ?? ''} terminará el día anterior a la nueva. La nueva versión empieza como pronto mañana.`"
      confirm-label="Versionar"
      :cargando="procesando"
      @update:open="(valor) => { if (!valor) configVersionar = null }"
      @confirmar="confirmarVersionar"
    />

    <ConfirmDialog
      :open="configEliminar !== null"
      titulo="Retirar turno"
      :descripcion="
        configEliminar?.enUso
          ? 'El turno tiene ocurrencias: se fijará su fin hoy y no generará nuevas ocurrencias. Las ocurrencias existentes se conservan.'
          : 'El turno no tiene ocurrencias: se eliminará definitivamente.'
      "
      confirm-label="Retirar"
      :cargando="procesando"
      @update:open="(valor) => { if (!valor) configEliminar = null }"
      @confirmar="confirmarRetirar"
    />
  </div>
</template>
