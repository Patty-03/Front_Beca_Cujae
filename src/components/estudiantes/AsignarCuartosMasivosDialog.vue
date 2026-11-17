<script setup lang="ts">
import type {
  AsignarCuartosMasivosInput,
  AsignarCuartosMasivosResultado,
  EstadoBeca,
  EstudianteResumen,
  PreasignacionLeer,
  ProcesoAlojamiento,
  TipoIngreso,
} from '@/types/estudiante'
import { computed, ref, watch } from 'vue'
import { LoaderCircleIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  asignarCuartosMasivamente,
  crearConjuntoRegla,
  obtenerAtributos,
  obtenerOperadores,
  obtenerPreasignacionesProceso,
  obtenerProcesoAlojamiento,
  obtenerProcesosAlojamiento,
} from '@/services/estudiantes'
import type { AtributoDisponible, CondicionRegla, OperadorDisponible } from '@/types/estudiante'
import { apiFetch, apiJson } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

interface CuartoDisponible {
  id: number
  nombre: string
  edificio: string
  capacidad: number
  habitable: boolean
}

interface CondicionForm {
  atributoDefId: number
  operadorId: number
  valorTexto?: string
  valorEntero?: number
  valorFecha?: string
  valorBool?: boolean
  valorPermitidoId?: number
}

const VALORES_TIPO_INGRESO: string[] = [
  'extranjero_convenio',
  'extranjero_autofinanciado',
  'residente_provincia',
  'caso_excepcional',
  'lejania',
  'traslado',
]

const props = defineProps<{ estudiantes: EstudianteResumen[] }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ asignados: [resultado: AsignarCuartosMasivosResultado] }>()

const auth = useAuthStore()
const cargando = ref(false)
const asignando = ref(false)
const errorGlobal = ref('')
const cuartosDisponibles = ref<CuartoDisponible[]>([])
const cuartosSeleccionados = ref<Record<number, number>>({})
const atributos = ref<AtributoDisponible[]>([])
const operadores = ref<OperadorDisponible[]>([])
const condiciones = ref<CondicionRegla[]>([])
const paso = ref<'configurar' | 'confirmar'>('configurar')

const procesosPrevios = ref<ProcesoAlojamiento[]>([])
const procesoSeleccionado = ref<ProcesoAlojamiento | null>(null)
const preasignacionesProceso = ref<PreasignacionLeer[]>([])
const procesosCargando = ref(false)

const puedeEscribir = computed(() => auth.can('estudiantes:write'))

async function cargarAtributosYOperadores() {
  try {
    const [attrs, ops] = await Promise.all([obtenerAtributos(), obtenerOperadores()])
    atributos.value = attrs
    operadores.value = ops
  } catch {
    atributos.value = []
    operadores.value = []
  }
}

async function cargarCuartosDisponibles() {
  try {
    const respuesta = await apiFetch('/api/v1/cuartos?activo=true')
    const cuartosRaw = await apiJson<any[]>(respuesta)

    cuartosDisponibles.value = cuartosRaw
      .filter((c: any) => c.estado_constructivo?.habitable && c.activo && c.capacidad_maxima > 0)
      .map((c: any): CuartoDisponible => ({
        id: c.id,
        nombre: c.nombre,
        edificio: c.escalera?.edificio?.nombre ?? 'Sin edificio',
        capacidad: c.capacidad_maxima,
        habitable: true,
      }))
  } catch {
    cuartosDisponibles.value = []
  }
}

async function cargarProcesosAlojamiento() {
  try {
    procesosCargando.value = true
    procesosPrevios.value = await obtenerProcesosAlojamiento()
  } catch {
    procesosPrevios.value = []
  } finally {
    procesosCargando.value = false
  }
}

watch(open, async (abierto) => {
  if (!abierto) return

  cuartosSeleccionados.value = {}
  errorGlobal.value = ''
  paso.value = 'configurar'
  await Promise.all([
    cargarAtributosYOperadores(),
    cargarCuartosDisponibles(),
    cargarProcesosAlojamiento(),
  ])
})

const estudiantesSinCuarto = computed(() => props.estudiantes.filter((e) => !e.asignacion))
const totalSinCuarto = computed(() => estudiantesSinCuarto.value.length)

const atributoSeleccionado = ref<number | null>(null)
const operadorSeleccionado = ref<number | null>(null)
const valorTexto = ref('')
const valorEntero = ref<number | null>(null)
const valorFecha = ref('')
const valorBool = ref(false)
const valorPermitidoId = ref<number | null>(null)

function obtenerAtributoNombre(id: number): string {
  const a = atributos.value.find((at) => at.id === id)
  return a ? a.nombre : 'Atributo ' + id
}

function obtenerOperadorNombre(id: number): string {
  const o = operadores.value.find((op) => op.id === id)
  return o ? o.simbolo : 'Operador ' + id
}

function obtenerValoresPermitidos(atributoId: number) {
  const a = atributos.value.find((at) => at.id === atributoId)
  return a ? a.valoresPermitidos : []
}

function obtenerValorTexto(condicion: CondicionRegla): string {
  if (condicion.valorTexto) return `= "${condicion.valorTexto}"`
  if (condicion.valorEntero !== undefined) return `= ${condicion.valorEntero}`
  if (condicion.valorFecha) return `= ${condicion.valorFecha}`
  if (condicion.valorBool !== undefined) return `= ${condicion.valorBool ? 'Verdadero' : 'Falso'}`
  if (condicion.valorPermitidoId !== undefined) {
    const a = atributos.value.find((at) => at.id === condicion.atributoDefId)
    const v = a?.valoresPermitidos.find((val) => val.id === condicion.valorPermitidoId)
    return `= ${v?.valor ?? condicion.valorPermitidoId}`
  }
  return ''
}

function valoresPermitidosDisponibles(atributoId: number): boolean {
  const a = atributos.value.find((at) => at.id === atributoId)
  return (a?.valoresPermitidos?.length ?? 0) > 0
}

function agregarCondicion() {
  if (!atributoSeleccionado.value || !operadorSeleccionado.value) {
    errorGlobal.value = 'Selecciona un atributo y un operador.'
    return
  }

  const condicion: CondicionRegla = {
    atributoDefId: atributoSeleccionado.value,
    operadorId: operadorSeleccionado.value,
  }

  if (valorTexto.value.trim()) {
    condicion.valorTexto = valorTexto.value.trim()
  } else if (valorEntero.value !== null) {
    condicion.valorEntero = valorEntero.value
  } else if (valorFecha.value.trim()) {
    condicion.valorFecha = valorFecha.value.trim()
  } else if (valorBool.value != null) {
    condicion.valorBool = Boolean(valorBool.value)
  } else if (valorPermitidoId.value !== null) {
    condicion.valorPermitidoId = valorPermitidoId.value
  }

  condiciones.value.push(condicion)
  limpiarFormularioCondicion()
}

function limpiarFormularioCondicion() {
  atributoSeleccionado.value = null
  operadorSeleccionado.value = null
  valorTexto.value = ''
  valorEntero.value = null
  valorFecha.value = ''
  valorBool.value = false
  valorPermitidoId.value = null
}

function quitarCondicion(index: number) {
  condiciones.value.splice(index, 1)
}

async function avanzarARedesignar() {
  if (condiciones.value.length === 0) {
    errorGlobal.value = 'Agrega al menos una condicion de regla.'
    return
  }

  if (cuartosDisponibles.value.length === 0) {
    errorGlobal.value = 'No hay cuartos habitables disponibles para asignar.'
    return
  }

  try {
    await crearConjuntoRegla({
      nombre: 'Asignacion cuartos ' + new Date().toISOString().slice(0, 10),
      ambito: 'ALOJAMIENTO',
      desde: new Date().toISOString().slice(0, 10),
      hasta: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      condiciones: condiciones.value,
      prioridades: [
        {
          atributoDefId: 2,
          tipo: 'ORDEN',
          orden: 1,
          sentido: 'ASC',
        },
      ],
    })

    const estudiantesSinCuarto = props.estudiantes.filter((e) => !e.asignacion)
    const cuartosHabitables = cuartosDisponibles.value.filter((c) => c.capacidad > 0)

    estudiantesSinCuarto.forEach((estudiante, idx) => {
      if (cuartosHabitables[idx]) {
        cuartosSeleccionados.value[estudiante.id] = cuartosHabitables[idx].id
      }
    })

    paso.value = 'confirmar'
  } catch (caught) {
    errorGlobal.value = caught instanceof Error ? caught.message : 'No se pudo crear el conjunto de reglas.'
  }
}

async function guardar() {
  if (Object.keys(cuartosSeleccionados.value).length === 0) {
    errorGlobal.value = 'No hay cuartos disponibles para asignar.'
    return
  }

  asignando.value = true
  errorGlobal.value = ''

  const asignaciones: AsignarCuartosMasivosInput[] = Object.entries(
    cuartosSeleccionados.value,
  ).map(([estudianteIdStr, cuartoId]) => ({
    estudianteId: Number(estudianteIdStr),
    cuartoId,
  }))

  try {
    const resultado = await asignarCuartosMasivamente(asignaciones)

    const exitosos = resultado.detalles.filter((d) => d.exitoso).length
    const fallidos = resultado.detalles.filter((d) => !d.exitoso).length

    if (fallidos > 0) {
      const errores = resultado.detalles
        .filter((d) => !d.exitoso)
        .map((d) => d.error)
        .filter(Boolean)
        .join('; ')
      toast.warning('Asignación parcial', {
        description: `${exitosos} asignados, ${fallidos} fallidos.${errores ? ' Errores: ' + errores : ''}`,
      })
    } else {
      toast.success('Cuartos asignados', {
        description: `Se asignaron ${exitosos} cuartos correctamente.`,
      })
    }

    open.value = false
    emit('asignados', resultado)
  } catch (caught) {
    const mensaje = caught instanceof Error ? caught.message : 'No se pudo completar la asignación masiva.'
    errorGlobal.value = mensaje
    toast.error('Error al asignar cuartos', {
      description: mensaje,
    })
  } finally {
    asignando.value = false
  }
}

function capacidadDe(cuartoId: number | undefined): number {
  if (!cuartoId) return 0
  const cuarto = cuartosDisponibles.value.find((c) => c.id === cuartoId)
  return cuarto?.capacidad ?? 0
}

function varianteEstadoBeca(estado: EstadoBeca): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (estado === 'baja') return 'destructive'
  if (estado === 'condicional') return 'outline'
  return 'secondary'
}

function tipoIngresoEsValido(tipo: string): boolean {
  return VALORES_TIPO_INGRESO.includes(tipo)
}

function varianteEstadoDeber(estado: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' {
  if (estado === 'pendiente') return 'secondary'
  if (estado === 'cumplido') return 'success'
  if (estado === 'incumplido') return 'destructive'
  return 'secondary'
}

function verificarAsignacion(valor: string, tipo: 'cuarto' | 'deber') {
  if (tipo === 'cuarto') {
    const cuartosValidos = ['cuarto_1', 'cuarto_2', 'cuarto_3']
    return cuartosValidos.includes(valor)
  }
  if (tipo === 'deber') {
    const deberesValidos = ['guardia', 'limpieza_areas_verdes', 'limpieza_escaleras', 'limpieza_cuarto']
    return deberesValidos.includes(valor)
  }
  return false
}

async function validarCuarto(cuartoId: number): Promise<boolean> {
  if (!cuartoId) return false
  const cuarto = cuartosDisponibles.value.find((c) => c.id === cuartoId)
  return cuarto ? cuarto.capacidad > 0 : false
}

async function validarEstudiante(estudianteId: number): Promise<boolean> {
  if (!estudianteId) return false
  const cuarto = cuartosDisponibles.value.find((c) => c.id === estudianteId)
  return cuarto ? cuarto.capacidad > 0 : false
}

function cuartodaAprobada(cuartoId: number): boolean {
  const cuarto = cuartosDisponibles.value.find((c) => c.id === cuartoId)
  return cuarto ? cuarto.capacidad > 0 : false
}

function validarAsignacion(estudianteId: number, cuartoId: number): boolean {
  if (!cuartoId) return false
  const cuarto = cuartosDisponibles.value.find((c) => c.id === cuartoId)
  return cuarto ? cuarto.capacidad > 0 : false
}

function seleccionarProcesoPrevio(proceso: ProcesoAlojamiento) {
  procesoSeleccionado.value = proceso
  async function cargarPreasignaciones() {
    try {
      preasignacionesProceso.value = await obtenerPreasignacionesProceso(proceso.id)
    } catch {
      preasignacionesProceso.value = []
    }
  }
  cargarPreasignaciones()
}
</script>
