<script setup lang="ts">
import type {
  AmbitoRegla,
  CondicionInput,
  ConjuntoCrearInput,
  ConjuntoLeer,
  ConjuntoVersionInput,
  PrioridadInput,
} from '@/types/reglas'
import type { AtributoDisponible, OperadorDisponible } from '@/types/estudiante'
import { computed, onMounted, ref } from 'vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { obtenerAtributosRegla, obtenerOperadoresRegla } from '@/services/reglas'
import {
  AlertCircleIcon,
  Edit3Icon,
  LoaderCircleIcon,
} from '@lucide/vue'
import { toast } from 'vue-sonner'

const props = withDefaults(
  defineProps<{
    ambito: AmbitoRegla
    nombreSugerido?: string
    modelo?: ConjuntoLeer | null
    cargando?: boolean
  }>(),
  { cargando: false },
)

const emit = defineEmits<{
  guardar: [ConjuntoCrearInput | ConjuntoVersionInput]
  cancelar: []
}>()

const esNuevo = computed(() => props.modelo === null)
const enUso = computed(() => !!props.modelo?.enUso)

const atributos = ref<AtributoDisponible[]>([])
const operadores = ref<OperadorDisponible[]>([])
const cargandoRefs = ref(false)

const nombre = ref(esNuevo.value ? (props.nombreSugerido ?? '') : props.modelo?.nombre ?? '')

const condiciones = ref<CondicionInput[]>(
  props.modelo?.condiciones.map((c) => {
    const entrada: CondicionInput = {
      atributoDefId: c.atributoDefId,
      operadorId: c.operadorId,
    }
    if (c.valorTexto != null) entrada.valorTexto = c.valorTexto
    if (c.valorEntero != null) entrada.valorEntero = c.valorEntero
    if (c.valorFecha != null) entrada.valorFecha = c.valorFecha
    if (c.valorBool != null) entrada.valorBool = c.valorBool
    if (c.valorPermitidoId != null) entrada.valorPermitidoId = c.valorPermitidoId
    if (c.parametro != null) entrada.parametro = c.parametro
    return entrada
  }) ?? [],
)
const prioridades = ref<PrioridadInput[]>(
  props.modelo?.prioridades.map((p) => {
    const entrada: PrioridadInput = {
      atributoDefId: p.atributoDefId,
      tipo: p.tipo as PrioridadInput['tipo'],
      orden: p.orden,
    }
    if (p.sentido != null) entrada.sentido = p.sentido as PrioridadInput['sentido']
    if (p.nivelAgrupamiento != null)
      entrada.nivelAgrupamiento = p.nivelAgrupamiento as PrioridadInput['nivelAgrupamiento']
    if (p.parametro != null) entrada.parametro = p.parametro
    return entrada
  }) ?? [],
)

type ValorTipo =
  | 'texto'
  | 'entero'
  | 'fecha'
  | 'booleano'
  | 'permitido'
  | 'parametro'

interface CondicionForm {
  atributoId: number | ''
  operadorId: number | ''
  valorTexto: string
  valorEntero: string
  valorFecha: string
  valorBool: 'true' | 'false' | ''
  valorPermitidoId: number | ''
  parametro: string
}

interface PrioridadForm {
  atributoId: number | ''
  tipo: 'ORDEN' | 'AGRUPAMIENTO' | 'CONSERVAR' | ''
  orden: string
  sentido: 'ASC' | 'DESC' | ''
  nivelAgrupamiento: 'CUARTO' | 'ESCALERA' | 'EDIFICIO' | ''
  nulosAlFinal: boolean
  parametro: string
}

const editarCondicionIdx = ref<number | null>(null)
const condicionForm = ref<CondicionForm>({
  atributoId: '',
  operadorId: '',
  valorTexto: '',
  valorEntero: '',
  valorFecha: '',
  valorBool: '',
  valorPermitidoId: '',
  parametro: '',
})

const editarPrioridadIdx = ref<number | null>(null)
const prioridadForm = ref<PrioridadForm>({
  atributoId: '',
  tipo: '',
  orden: '',
  sentido: '',
  nivelAgrupamiento: '',
  nulosAlFinal: false,
  parametro: '',
})

async function cargarCatalogos() {
  cargandoRefs.value = true
  try {
    const [ats, ops] = await Promise.all([
      obtenerAtributosRegla(props.ambito),
      obtenerOperadoresRegla(),
    ])
    atributos.value = ats.filter((a) => a.activo)
    operadores.value = ops
  } catch (caught) {
    toast.error('No se pudieron cargar atributos y operadores', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    cargandoRefs.value = false
  }
}

onMounted(cargarCatalogos)

const atributoSeleccionado = computed<AtributoDisponible | undefined>(() =>
  atributos.value.find((a) => a.id === Number(condicionForm.value.atributoId)),
)
const operadorSeleccionado = computed<OperadorDisponible | undefined>(() =>
  operadores.value.find((o) => o.id === Number(condicionForm.value.operadorId)),
)

function tipoValor(): ValorTipo | null {
  const a = atributoSeleccionado.value
  const o = operadorSeleccionado.value
  if (!a || !o) return null
  if (a.tipoDatoNombre === 'texto' && o.simbolo === 'IGUAL') return 'texto'
  if (
    a.tipoDatoNombre === 'entero' &&
    ['IGUAL', 'MAYOR_IGUAL', 'MENOR_IGUAL'].includes(o.simbolo)
  )
    return 'entero'
  if (a.tipoDatoNombre === 'fecha' && o.simbolo === 'IGUAL') return 'fecha'
  if (a.tipoDatoNombre === 'booleano' && o.simbolo === 'IGUAL') return 'booleano'
  if (
    a.tipoDatoNombre === 'referencia a entidad' &&
    o.simbolo === 'IGUAL'
  )
    return 'permitido'
  if (o.simbolo === 'PARAMETRO') return 'parametro'
  return null
}

const tipoValorLabel = computed(() => {
  const map: Record<ValorTipo, string> = {
    texto: 'Texto',
    entero: 'Número entero',
    fecha: 'Fecha',
    booleano: 'Sí / No',
    permitido: 'Valor permitido',
    parametro: 'Parámetro numérico',
  }
  return map[tipoValor() as ValorTipo] ?? '—'
})

function valoresPermitidosDe(atributoId: number) {
  const a = atributos.value.find((at) => at.id === atributoId)
  return a?.valoresPermitidos ?? []
}

function obtenerOperadorNombre(operadorId: number) {
  const o = operadores.value.find((op) => op.id === operadorId)
  return o ? `${o.simbolo} - ${o.nombre}` : ''
}

function obtenerValorTexto(c: CondicionInput): string {
  if (c.valorTexto != null) return `= "${c.valorTexto}"`
  if (c.valorEntero !== undefined) return `= ${c.valorEntero}`
  if (c.valorFecha != null) return `= ${c.valorFecha}`
  if (c.valorBool !== undefined) return `= ${c.valorBool ? 'Verdadero' : 'Falso'}`
  if (c.valorPermitidoId != null) return `= ${c.valorPermitidoId}`
  if (c.parametro != null) return `= ${c.parametro}`
  return ''
}

function resetearCondicionForm() {
  condicionForm.value = {
    atributoId: '',
    operadorId: '',
    valorTexto: '',
    valorEntero: '',
    valorFecha: '',
    valorBool: '',
    valorPermitidoId: '',
    parametro: '',
  }
  editarCondicionIdx.value = null
}

function abrirEditarCondicion(idx: number) {
  const c = condiciones.value[idx]
  if (!c) return
  condicionForm.value = {
    atributoId: c.atributoDefId,
    operadorId: c.operadorId,
    valorTexto: c.valorTexto ?? '',
    valorEntero: String(c.valorEntero ?? ''),
    valorFecha: c.valorFecha ?? '',
    valorBool: c.valorBool === true ? 'true' : c.valorBool === false ? 'false' : '',
    valorPermitidoId: c.valorPermitidoId ?? '',
    parametro: String(c.parametro ?? ''),
  }
  editarCondicionIdx.value = idx
}

function guardarCondicion() {
  const atributoId = Number(condicionForm.value.atributoId)
  const operadorId = Number(condicionForm.value.operadorId)
  if (!atributoId || !operadorId) {
    toast.warning('Selecciona atributo y operador.')
    return
  }
  const tipo = tipoValor()
  const entrada: CondicionInput = { atributoDefId: atributoId, operadorId }
  switch (tipo) {
    case 'texto':
      if (!condicionForm.value.valorTexto.trim()) {
        toast.warning('Ingresa el valor de texto.')
        return
      }
      entrada.valorTexto = condicionForm.value.valorTexto.trim()
      break
    case 'entero': {
      const valor = String(condicionForm.value.valorEntero ?? '').trim()
      if (!valor) {
        toast.warning('Ingresa el valor numérico.')
        return
      }
      entrada.valorEntero = Number(valor)
      break
    }
    case 'fecha':
      if (!condicionForm.value.valorFecha) {
        toast.warning('Ingresa la fecha.')
        return
      }
      entrada.valorFecha = condicionForm.value.valorFecha
      break
    case 'booleano':
      if (!condicionForm.value.valorBool) {
        toast.warning('Selecciona Verdadero o Falso.')
        return
      }
      entrada.valorBool = condicionForm.value.valorBool === 'true'
      break
    case 'permitido':
      if (!condicionForm.value.valorPermitidoId) {
        toast.warning('Selecciona un valor permitido.')
        return
      }
      entrada.valorPermitidoId = Number(condicionForm.value.valorPermitidoId)
      break
    case 'parametro': {
      const valor = String(condicionForm.value.parametro ?? '').trim()
      const parametro = Number(valor)
      if (!valor || !Number.isFinite(parametro) || parametro <= 0) {
        toast.warning('Ingresa un parámetro numérico mayor que 0.')
        return
      }
      entrada.parametro = parametro
      break
    }
    default:
      toast.warning('No hay campo de valor disponible para esta combinación.')
      return
  }

  if (editarCondicionIdx.value !== null) {
    condiciones.value[editarCondicionIdx.value] = entrada
  } else {
    condiciones.value.push(entrada)
  }
  resetearCondicionForm()
}

function quitarCondicion(idx: number) {
  condiciones.value.splice(idx, 1)
  if (editarCondicionIdx.value === idx) resetearCondicionForm()
  else if (
    editarCondicionIdx.value !== null &&
    editarCondicionIdx.value > idx
  )
    editarCondicionIdx.value = editarCondicionIdx.value - 1
}

const prioridadAtributoSeleccionado = computed<AtributoDisponible | undefined>(() =>
  atributos.value.find((a) => a.id === Number(prioridadForm.value.atributoId)),
)

function resetearPrioridadForm() {
  prioridadForm.value = {
    atributoId: '',
    tipo: '',
    orden: '',
    sentido: '',
    nivelAgrupamiento: '',
    nulosAlFinal: true,
    parametro: '',
  }
  editarPrioridadIdx.value = null
}

function abrirEditarPrioridad(idx: number) {
  const p = prioridades.value[idx]
  if (!p) return
  prioridadForm.value = {
    atributoId: p.atributoDefId,
    tipo: p.tipo as 'ORDEN' | 'AGRUPAMIENTO' | 'CONSERVAR',
    orden: String(p.orden ?? ''),
    sentido: p.sentido ?? '',
    nivelAgrupamiento: p.nivelAgrupamiento ?? '',
    nulosAlFinal: p.nulosAlFinal ?? true,
    parametro: String(p.parametro ?? ''),
  }
  editarPrioridadIdx.value = idx
}

const prioridadValida = computed(() => {
  if (props.cargando || cargandoRefs.value) return false
  const atributoId = Number(prioridadForm.value.atributoId)
  const tipo = prioridadForm.value.tipo
  if (!atributoId || !tipo) return false
  if (tipo === 'ORDEN') {
    const orden = Number(prioridadForm.value.orden)
    if (!Number.isFinite(orden) || orden < 1) return false
    if (!prioridadForm.value.sentido) return false
  }
  if (tipo === 'AGRUPAMIENTO' && !prioridadForm.value.nivelAgrupamiento) return false
  const parametro = String(prioridadForm.value.parametro ?? '').trim()
  if (parametro) {
    const valor = Number(parametro)
    if (!Number.isFinite(valor) || valor <= 0) return false
  }
  return true
})

function guardarPrioridad() {
  const atributoId = Number(prioridadForm.value.atributoId)
  const tipo = prioridadForm.value.tipo
  if (!atributoId || !tipo) {
    toast.warning('Selecciona atributo y tipo de prioridad.')
    return
  }

  if (tipo === 'ORDEN') {
    const orden = Number(prioridadForm.value.orden)
    if (!Number.isFinite(orden) || orden < 1) {
      toast.warning('Ingresa un orden numérico mayor o igual que 1.')
      return
    }
    if (!prioridadForm.value.sentido) {
      toast.warning('Selecciona el sentido de la prioridad.')
      return
    }
  }

  if (tipo === 'AGRUPAMIENTO' && !prioridadForm.value.nivelAgrupamiento) {
    toast.warning('Selecciona el nivel de agrupamiento.')
    return
  }

  const parametroTexto = String(prioridadForm.value.parametro ?? '').trim()
  let parametro: number | undefined
  if (parametroTexto) {
    parametro = Number(parametroTexto)
    if (!Number.isFinite(parametro) || parametro <= 0) {
      toast.warning('El parámetro debe ser un número mayor que 0.')
      return
    }
  }

  const ordenActual = Number(prioridadForm.value.orden)
  const orden =
    tipo === 'ORDEN'
      ? ordenActual
      : Number.isFinite(ordenActual) && ordenActual >= 1
        ? ordenActual
        : prioridades.value.length + 1

  const entrada: PrioridadInput = {
    atributoDefId: atributoId,
    tipo,
    orden,
  }

  if (tipo === 'ORDEN') {
    entrada.sentido = prioridadForm.value.sentido as 'ASC' | 'DESC'
    entrada.nulosAlFinal = prioridadForm.value.nulosAlFinal
  }

  if (tipo === 'AGRUPAMIENTO') {
    entrada.nivelAgrupamiento = prioridadForm.value
      .nivelAgrupamiento as 'CUARTO' | 'ESCALERA' | 'EDIFICIO'
  }

  if (parametro !== undefined) entrada.parametro = parametro

  if (editarPrioridadIdx.value !== null) {
    prioridades.value[editarPrioridadIdx.value] = entrada
  } else {
    prioridades.value.push(entrada)
  }
  resetearPrioridadForm()
}

function quitarPrioridad(idx: number) {
  prioridades.value.splice(idx, 1)
  if (editarPrioridadIdx.value === idx) resetearPrioridadForm()
  else if (
    editarPrioridadIdx.value !== null &&
    editarPrioridadIdx.value > idx
  )
    editarPrioridadIdx.value = editarPrioridadIdx.value - 1
}

function esValido() {
  if (esNuevo.value && !nombre.value.trim()) return false
  return true
}

function manejarGuardar() {
  if (!esValido()) {
    toast.warning('Ingresa el nombre del conjunto de reglas.')
    return
  }
  if (esNuevo.value) {
    const input: ConjuntoCrearInput = {
      nombre: nombre.value.trim(),
      ambito: props.ambito,
      condiciones: condiciones.value.length ? condiciones.value : undefined,
      prioridades: prioridades.value.length ? prioridades.value : undefined,
    }
    emit('guardar', input)
  } else {
    const input: ConjuntoVersionInput = {
      condiciones: condiciones.value.length ? condiciones.value : undefined,
      prioridades: prioridades.value.length ? prioridades.value : undefined,
    }
    emit('guardar', input)
  }
}

function etiquetaAtributo(id: number | '') {
  const a = atributos.value.find((at) => at.id === Number(id))
  return a ? a.nombre : 'Seleccionar atributo'
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="props.cargando || cargandoRefs" class="flex gap-2 text-sm text-muted-foreground">
      <LoaderCircleIcon class="size-4 animate-spin" />
      <span>Cargando atributos y operadores…</span>
    </div>

    <div v-if="esNuevo" class="grid gap-2">
      <Label for="editor-nombre">Nombre del conjunto</Label>
      <Input
        id="editor-nombre"
        v-model="nombre"
        placeholder="Ej. Reglas de asignación de cuartos"
        :disabled="props.cargando || cargandoRefs"
      />
    </div>

    <Alert v-if="enUso">
      <AlertCircleIcon />
      <AlertTitle>Conjunto en uso</AlertTitle>
      <AlertDescription>
        Este conjunto ya está asignado a procesos activos. Al guardar se creará
        una versión nueva; no se modificarán los procesos existentes.
      </AlertDescription>
    </Alert>

    <Card>
      <CardHeader>
        <CardTitle>Condiciones (obligatorias)</CardTitle>
        <CardDescription>
          Un estudiante cumple el conjunto si cumple todas las condiciones.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div class="flex flex-col gap-1">
            <Label>Atributo</Label>
            <Select
              v-model="condicionForm.atributoId"
              :disabled="props.cargando || cargandoRefs"
              class="w-full"
            >
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="a in atributos"
                  :key="a.id"
                  :value="String(a.id)"
                >
                  {{ a.nombre }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex flex-col gap-1">
            <Label>Operador</Label>
            <Select
              v-model="condicionForm.operadorId"
              :disabled="
                props.cargando ||
                cargandoRefs ||
                !atributoSeleccionado
              "
              class="w-full"
            >
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="o in operadores"
                  :key="o.id"
                  :value="String(o.id)"
                >
                  {{ o.simbolo }} - {{ o.nombre }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex flex-col gap-1 w-full">
            <Label>Valor ({{ tipoValorLabel }})</Label>
            <div v-if="tipoValor() === 'texto'">
              <Input
                v-model="condicionForm.valorTexto"
                placeholder="Valor de texto"
                class="w-full"
              />
            </div>
            <div v-else-if="tipoValor() === 'entero'">
              <Input
                v-model="condicionForm.valorEntero"
                type="number"
                placeholder="0"
                class="w-full"
              />
            </div>
            <div v-else-if="tipoValor() === 'fecha'">
              <Input
                v-model="condicionForm.valorFecha"
                type="date"
                class="w-full"
              />
            </div>
            <div v-else-if="tipoValor() === 'booleano'">
              <Select v-model="condicionForm.valorBool" class="w-full">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Verdadero</SelectItem>
                  <SelectItem value="false">Falso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div v-else-if="tipoValor() === 'permitido'">
              <Select v-model="condicionForm.valorPermitidoId" class="w-full">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Seleccionar valor..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="v in valoresPermitidosDe(
                      Number(condicionForm.atributoId)
                    )"
                    :key="v.id"
                    :value="String(v.id)"
                  >
                    {{ v.valor }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div v-else-if="tipoValor() === 'parametro'">
              <Input
                v-model="condicionForm.parametro"
                type="number"
                placeholder="Parámetro"
                class="w-full"
              />
            </div>
            <div v-else class="text-xs text-muted-foreground">
              Selecciona atributo y operador para habilitar el valor.
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <div class="h-[38px]"></div>
            <Button
              type="button"
              :disabled="
                props.cargando ||
                cargandoRefs ||
                !atributoSeleccionado ||
                !operadorSeleccionado
              "
              @click="guardarCondicion"
            >
              {{
                editarCondicionIdx !== null ? 'Actualizar' : 'Agregar'
              }}
            </Button>
            <Button
              v-if="editarCondicionIdx !== null"
              variant="outline"
              type="button"
              size="sm"
              @click="resetearCondicionForm"
            >
              Cancelar
            </Button>
          </div>
        </div>

        <Separator v-if="condiciones.length" />
        <div v-if="condiciones.length" class="space-y-1">
          <div
            v-for="(c, idx) in condiciones"
            :key="idx"
            class="flex items-center gap-2 p-2 rounded-md border bg-muted/50 text-sm"
          >
            <span class="shrink-0 font-medium">
              {{ etiquetaAtributo(c.atributoDefId) }}
            </span>
            <span class="text-muted-foreground shrink-0">
              {{ obtenerOperadorNombre(c.operadorId) }}
            </span>
            <span class="shrink-0">{{ obtenerValorTexto(c) }}</span>
            <button
              v-if="!enUso || esNuevo"
              class="ml-auto p-1 hover:bg-red-50 rounded"
              @click="quitarCondicion(idx)"
              title="Quitar condición"
            >
              <span class="text-red-500">×</span>
            </button>
            <button
              v-if="!enUso || esNuevo"
              class="ml-1 p-1 hover:bg-blue-50 rounded"
              @click="abrirEditarCondicion(idx)"
              title="Editar condición"
            >
              <Edit3Icon class="size-4" />
            </button>
          </div>
        </div>
        <div
          v-else
          class="text-xs text-muted-foreground text-center py-2"
        >
          Sin condiciones agregadas.
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Prioridades (deseables)</CardTitle>
        <CardDescription>
          Orden de preferencia para resolver empates entre candidatos.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div class="flex flex-col gap-1">
            <Label>Atributo</Label>
            <Select
              v-model="prioridadForm.atributoId"
              :disabled="props.cargando || cargandoRefs"
              class="w-full"
            >
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="a in atributos"
                  :key="a.id"
                  :value="String(a.id)"
                >
                  {{ a.nombre }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex flex-col gap-1">
            <Label>Tipo</Label>
            <Select v-model="prioridadForm.tipo" class="w-full">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Tipo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ORDEN">Orden</SelectItem>
                <SelectItem value="AGRUPAMIENTO">Agrupamiento</SelectItem>
                <SelectItem value="CONSERVAR">Conservar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div
            v-if="prioridadForm.tipo === 'ORDEN'"
            class="flex flex-col gap-1"
          >
            <Label>Orden numérico</Label>
            <Input
              v-model="prioridadForm.orden"
              type="number"
              placeholder="1"
              class="w-full"
            />
          </div>
          <div
            v-if="prioridadForm.tipo === 'ORDEN'"
            class="flex flex-col gap-1"
          >
            <Label>Sentido</Label>
            <Select v-model="prioridadForm.sentido" class="w-full">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ASC">Ascendente</SelectItem>
                <SelectItem value="DESC">Descendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div
            v-if="prioridadForm.tipo === 'AGRUPAMIENTO'"
            class="flex flex-col gap-1"
          >
            <Label>Nivel</Label>
            <Select v-model="prioridadForm.nivelAgrupamiento" class="w-full">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CUARTO">Cuarto</SelectItem>
                <SelectItem value="ESCALERA">Escalera</SelectItem>
                <SelectItem value="EDIFICIO">Edificio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div
            v-if="prioridadForm.tipo === 'ORDEN'"
            class="flex flex-col gap-1"
          >
            <Label class="flex items-center gap-1">
              <input
                type="checkbox"
                v-model="prioridadForm.nulosAlFinal"
                class="rounded border-input bg-background"
              />
              Nulos al final (orden)
            </Label>
          </div>
          <div class="flex flex-col gap-1">
            <Label>Parámetro</Label>
            <Input
              v-model="prioridadForm.parametro"
              type="number"
              placeholder="Parámetro"
              class="w-full"
            />
          </div>
          <div class="flex flex-col gap-1">
            <div class="h-[38px]"></div>
            <Button
              type="button"
              :disabled="!prioridadValida"
              @click="guardarPrioridad"
            >
              {{
                editarPrioridadIdx !== null ? 'Actualizar' : 'Agregar'
              }}
            </Button>
            <Button
              v-if="editarPrioridadIdx !== null"
              variant="outline"
              type="button"
              size="sm"
              @click="resetearPrioridadForm"
            >
              Cancelar
            </Button>
          </div>
        </div>

        <Separator v-if="prioridades.length" />
        <div v-if="prioridades.length" class="space-y-1">
          <div
            v-for="(p, idx) in prioridades"
            :key="idx"
            class="flex items-center gap-2 p-2 rounded-md border bg-muted/50 text-sm"
          >
            <span class="shrink-0 font-medium">
              {{ etiquetaAtributo(p.atributoDefId) }}
            </span>
            <span class="text-muted-foreground shrink-0">{{ p.tipo }}</span>
            <span class="shrink-0">
              {{
                p.tipo === 'ORDEN'
                  ? `orden ${p.orden} ${
                      p.sentido ?? ''
                    }${p.nulosAlFinal ? ', nulos al final' : ''}`
                : p.tipo === 'AGRUPAMIENTO'
                  ? `nivel ${p.nivelAgrupamiento ?? ''}`
                  : ''
              }}
            </span>
            <button
              v-if="!enUso || esNuevo"
              class="ml-auto p-1 hover:bg-red-50 rounded"
              @click="quitarPrioridad(idx)"
              title="Quitar prioridad"
            >
              <span class="text-red-500">×</span>
            </button>
            <button
              v-if="!enUso || esNuevo"
              class="ml-1 p-1 hover:bg-blue-50 rounded"
              @click="abrirEditarPrioridad(idx)"
              title="Editar prioridad"
            >
              <Edit3Icon class="size-4" />
            </button>
          </div>
        </div>
        <div
          v-else
          class="text-xs text-muted-foreground text-center py-2"
        >
          Sin prioridades agregadas.
        </div>
      </CardContent>
    </Card>

    <div class="flex justify-end gap-2 pt-2">
      <Button type="button" variant="outline" @click="emit('cancelar')">
        Cancelar
      </Button>
      <Button
        type="button"
        :disabled="
          props.cargando ||
          cargandoRefs ||
          !esValido() ||
          (enUso && !condiciones.length && !prioridades.length)
        "
        @click="manejarGuardar"
      >
        {{
          esNuevo
            ? 'Crear conjunto'
            : enUso
              ? 'Crear versión nueva'
              : 'Guardar cambios'
        }}
      </Button>
    </div>
  </div>
</template>
