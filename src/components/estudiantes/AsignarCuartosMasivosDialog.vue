<script setup lang="ts">
import type {
  AsignarCuartosMasivosInput,
  AsignarCuartosMasivosResultado,
  EstudianteResumen,
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
import { asignarCuartosMasivamente, crearConjuntoRegla, obtenerAtributos, obtenerOperadores } from '@/services/estudiantes'
import type { AtributoDisponible, CondicionRegla, OperadorDisponible } from '@/types/estudiante'
import { apiFetch, apiJson } from '@/lib/api'

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

const props = defineProps<{ estudiantes: EstudianteResumen[] }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ asignados: [resultado: AsignarCuartosMasivosResultado] }>()

const cargando = ref(false)
const asignando = ref(false)
const errorGlobal = ref('')
const cuartosDisponibles = ref<CuartoDisponible[]>([])
const cuartosSeleccionados = ref<Record<number, number>>({})
const atributos = ref<AtributoDisponible[]>([])
const operadores = ref<OperadorDisponible[]>([])
const condiciones = ref<CondicionRegla[]>([])
const paso = ref<'configurar' | 'confirmar'>('configurar')

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

watch(open, async (abierto) => {
  if (!abierto) return

  cuartosSeleccionados.value = {}
  errorGlobal.value = ''
  paso.value = 'configurar'
  await Promise.all([cargarAtributosYOperadores(), cargarCuartosDisponibles()])
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
  } else if (valorBool.value !== null) {
    condicion.valorBool = valorBool.value
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
      toast.warning('Asignacion parcial', {
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
    errorGlobal.value = caught instanceof Error ? caught.message : 'No se pudo completar la asignacion masiva.'
  } finally {
    asignando.value = false
  }
}

function capacidadDe(cuartoId: number | undefined): number {
  if (!cuartoId) return 0
  const cuarto = cuartosDisponibles.value.find((c) => c.id === cuartoId)
  return cuarto?.capacidad ?? 0
}

function valorTextoEsValido(atributoId: number, operadorId: number): boolean {
  const a = atributos.value.find((at) => at.id === atributoId)
  const o = operadores.value.find((op) => op.id === operadorId)
  return a?.tipoDatoNombre === 'texto' && o?.simbolo === 'IGUAL'
}

function valorEnteroEsValido(atributoId: number, operadorId: number): boolean {
  const a = atributos.value.find((at) => at.id === atributoId)
  const o = operadores.value.find((op) => op.id === operadorId)
  return ['entero'].includes(a?.tipoDatoNombre ?? '') && ['IGUAL', 'MAYOR_IGUAL', 'MENOR_IGUAL'].includes(o?.simbolo ?? '')
}

function valorFechaEsValido(atributoId: number, operadorId: number): boolean {
  const a = atributos.value.find((at) => at.id === atributoId)
  const o = operadores.value.find((op) => op.id === operadorId)
  return a?.tipoDatoNombre === 'fecha' && o?.simbolo === 'IGUAL'
}

function valorBoolEsValido(atributoId: number, operadorId: number): boolean {
  const a = atributos.value.find((at) => at.id === atributoId)
  const o = operadores.value.find((op) => op.id === operadorId)
  return a?.tipoDatoNombre === 'booleano' && o?.simbolo === 'IGUAL'
}

function valorPermitidoEsValido(atributoId: number, operadorId: number): boolean {
  const a = atributos.value.find((at) => at.id === atributoId)
  const o = operadores.value.find((op) => op.id === operadorId)
  return a?.tipoDatoNombre === 'referencia a entidad' && o?.simbolo === 'IGUAL'
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
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-5xl">
      <DialogHeader>
        <DialogTitle>Asignar cuartos masivamente</DialogTitle>
        <DialogDescription v-if="paso === 'configurar'">
          Configura las reglas de asignacion. El sistema asignara cuartos automaticamente a cada estudiante.
        </DialogDescription>
        <DialogDescription v-if="paso === 'confirmar'">
          Revisa las asignaciones antes de confirmar.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4">
        <!-- Paso 1: Configurar reglas -->
        <div v-if="paso === 'configurar'">
          <div v-if="cargando" class="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircleIcon class="size-4 animate-spin" />
            <span>Cargando atributos y cuartos...</span>
          </div>

          <Alert v-if="errorGlobal" variant="destructive">
            <CircleAlertIcon />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{{ errorGlobal }}</AlertDescription>
          </Alert>

          <!-- Resumen -->
          <div class="grid gap-4">
            <Card class="p-4">
              <CardHeader>
                <CardTitle>Estudiantes sin cuarto</CardTitle>
              </CardHeader>
              <CardContent>
                <p class="text-2xl font-bold">{{ totalSinCuarto }}</p>
                <p class="text-sm text-muted-foreground">Estudiantes que necesitan cuarto.</p>
              </CardContent>
            </Card>
            <Card class="p-4">
              <CardHeader>
                <CardTitle>Cuartos disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <p class="text-2xl font-bold">{{ cuartosDisponibles.length }}</p>
                <p class="text-sm text-muted-foreground">Cuartos habitables para asignar.</p>
              </CardContent>
            </Card>
          </div>

          <!-- Formulario de reglas -->
          <Card class="p-4">
            <CardHeader>
              <CardTitle>Condiciones de asignacion</CardTitle>
              <CardDescription>
                Define quien puede recibir cuarto segun sus atributos.
                Las condiciones del mismo atributo se combinan con "O";
                de atributos distintos, con "Y".
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div class="">
                  <label class="text-sm font-medium mb-1">Atributo</label>
                  <select
                    v-model="atributoSeleccionado"
                    class="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="" disabled>Seleccionar atributo...</option>
                    <option v-for="atributo in atributos" :key="atributo.id" :value="atributo.id">
                      {{ atributo.nombre }}
                    </option>
                  </select>
                </div>
                <div class="">
                  <label class="text-sm font-medium mb-1">Operador</label>
                  <select
                    v-model="operadorSeleccionado"
                    class="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="" disabled>Seleccionar operador...</option>
                    <option v-for="operador in operadores" :key="operador.id" :value="operador.id">
                      {{ operador.simbolo }} - {{ operador.nombre }}
                    </option>
                  </select>
                </div>
                <div class="">
                  <label class="text-sm font-medium mb-1">Valor</label>
                  <div v-if="atributoSeleccionado && operadorSeleccionado">
                    <div v-if="valorTextoEsValido(atributoSeleccionado, operadorSeleccionado)">
                      <input
                        v-model="valorTexto"
                        type="text"
                        placeholder="Valor de texto"
                        class="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div v-else-if="valorEnteroEsValido(atributoSeleccionado, operadorSeleccionado)">
                      <input
                        v-model="valorEntero"
                        type="number"
                        placeholder="Valor numerico"
                        class="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div v-else-if="valorFechaEsValido(atributoSeleccionado, operadorSeleccionado)">
                      <input
                        v-model="valorFecha"
                        type="date"
                        class="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div v-else-if="valorBoolEsValido(atributoSeleccionado, operadorSeleccionado)">
                      <select
                        v-model="valorBool"
                        class="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="true">Verdadero</option>
                        <option value="false">Falso</option>
                      </select>
                    </div>
                    <div v-else-if="valorPermitidoEsValido(atributoSeleccionado, operadorSeleccionado)">
                      <select
                        v-model="valorPermitidoId"
                        class="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="" disabled>Seleccionar valor...</option>
                        <option
                          v-for="valor in obtenerValoresPermitidos(atributoSeleccionado)"
                          :key="valor.id"
                          :value="valor.id"
                        >
                          {{ valor.valor }}
                        </option>
                      </select>
                    </div>
                    <div v-else class="text-sm text-muted-foreground">
                      No hay campo de valor disponible para este atributo y operador.
                    </div>
                  </div>
                  <button
                    v-if="atributoSeleccionado && operadorSeleccionado"
                    class="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    @click="agregarCondicion"
                  >
                    Agregar condicion
                  </button>
                </div>
              </div>

              <div v-if="condiciones.length > 0" class="mt-4">
                <p class="text-sm font-medium mb-2">Condiciones activas:</p>
                <div class="space-y-2">
                  <div
                    v-for="(condicion, idx) in condiciones"
                    :key="idx"
                    class="flex items-center gap-2 p-2 rounded-md border bg-muted/50"
                  >
                    <span class="text-sm">
                      {{ obtenerAtributoNombre(condicion.atributoDefId) }}
                      {{ obtenerOperadorNombre(condicion.operadorId) }}
                      {{ obtenerValorTexto(condicion) }}
                    </span>
                    <button
                      class="ml-auto p-1 hover:bg-red-50 rounded"
                      @click="quitarCondicion(idx)"
                      title="Quitar condicion"
                    >
                      <span class="text-red-500">x</span>
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div class="flex justify-end mt-6">
            <Button type="button" variant="outline" @click="paso = 'configurar'">
              Volver
            </Button>
            <Button
              type="button"
              :disabled="condiciones.length === 0 || cuartosDisponibles.length === 0"
              @click="avanzarARedesignar"
            >
              Siguiente: Crear proceso y asignar
            </Button>
          </div>
        </div>

        <!-- Paso 2: Confirmar -->
        <div v-if="paso === 'confirmar'">
          <p class="text-muted-foreground text-sm">
            {{ totalSinCuarto }} estudiante(s) sin cuarto asignado.
            {{ cuartosDisponibles.length }} cuarto(s) habitable(s) disponible(s).
            El sistema asignara automaticamente un cuarto a cada estudiante en orden.
          </p>

          <div class="max-h-[500px] overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead class="w-64">Cuarto asignado</TableHead>
                  <TableHead class="w-32">Capacidad</TableHead>
                  <TableHead class="w-20">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="estudiante in estudiantesSinCuarto"
                  :key="estudiante.id"
                >
                  <TableCell class="font-medium">
                    {{ estudiante.nombre }}
                    <p class="text-muted-foreground text-xs">{{ estudiante.carnet }}</p>
                  </TableCell>
                  <TableCell>
                    <span v-if="cuartosSeleccionados[estudiante.id]" class="text-sm">
                      Cuarto {{ cuartosDisponibles.find(c => c.id === cuartosSeleccionados[estudiante.id])?.nombre }}
                      <span class="text-muted-foreground text-xs ml-2">
                        {{ cuartosDisponibles.find(c => c.id === cuartosSeleccionados[estudiante.id])?.edificio }}
                      </span>
                    </span>
                    <span v-else class="text-muted-foreground text-xs">
                      Sin cuarto disponible
                    </span>
                  </TableCell>
                  <TableCell class="text-center">
                    <Badge variant="secondary">{{ capacidadDe(cuartosSeleccionados[estudiante.id]) }}</Badge>
                  </TableCell>
                  <TableCell class="text-center">
                    <span v-if="cuartosSeleccionados[estudiante.id]" class="text-emerald-600 text-sm">
                      Asignado
                    </span>
                    <span v-else class="text-muted-foreground text-xs">
                      –
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <div v-if="cuartosDisponibles.length === 0 && !cargando && paso === 'configurar'" class="text-center py-8 text-muted-foreground">
          <p>No hay cuartos habitables disponibles para asignar.</p>
        </div>
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button type="button" variant="outline">
            {{ paso === 'configurar' ? 'Cancelar' : 'Volver' }}
          </Button>
        </DialogClose>
        <Button
          type="button"
          :disabled="asignando || Object.keys(cuartosSeleccionados).length === 0 || cuartosDisponibles.length === 0"
          @click="paso === 'configurar' ? avanzarARedesignar : guardar"
        >
          <LoaderCircleIcon v-if="asignando" class="animate-spin" />
          {{ paso === 'configurar' ? 'Crear proceso y asignar' : 'Asignar a ' + Object.keys(cuartosSeleccionados).length + ' estudiante(s)' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>