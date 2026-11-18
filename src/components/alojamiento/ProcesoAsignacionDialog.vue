<script setup lang="ts">
import type { ConjuntoLeer, CondicionInput, PrioridadInput, AtributoDisponible, OperadorDisponible } from '@/types/reglas'
import type { ProcesoLeer, RestriccionLeer, PeriodoRegistro } from '@/types/alojamiento'
import type { EdificioResumen } from '@/types/infraestructura'
import { computed, ref, watch } from 'vue'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import ConfirmDialog from '@/components/infraestructura/ConfirmDialog.vue'
import { obtenerAtributosRegla, obtenerOperadoresRegla, crearConjunto, crearVersionConjunto, obtenerConjunto } from '@/services/reglas'
import { crearProceso, listarRestricciones, agregarRestricciones, descartarProceso, listarPeriodosRegistro } from '@/services/alojamiento'
import { obtenerEdificios, obtenerEdificio } from '@/services/infraestructura'
import { LoaderCircleIcon, AlertCircleIcon, PlusIcon, Trash2Icon } from '@lucide/vue'
import { toast } from 'vue-sonner'

const props = defineProps<{ open: boolean; proceso: ProcesoLeer | null }>()
const emit = defineEmits<{ 'update:open': [boolean]; guardado: [] }>()

const cargando = ref(false)
const guardando = ref(false)
const borrando = ref(false)
const confirmarBorradoAbierto = ref(false)
const error = ref('')

const periodos = ref<PeriodoRegistro[]>([])
const atributos = ref<AtributoDisponible[]>([])
const operadores = ref<OperadorDisponible[]>([])
const edificios = ref<EdificioResumen[]>([])

const nombreProceso = ref('')
const periodoId = ref('')
const conjunto = ref<ConjuntoLeer | null>(null)
const restricciones = ref<RestriccionLeer[]>([])

const reglaAtributo = ref('')
const reglaOperador = ref('')
const reglaValor = ref('')
const reglaPrioridad = ref('')
const condiciones = ref<CondicionInput[]>([])
const prioridades = ref<PrioridadInput[]>([])

const edificioId = ref('')
const escaleras = ref<{ id: number; nombre: string; cuartos: { id: number; nombre: string }[] }[]>([])
const cuartosSeleccionados = ref<number[]>([])
const tipoReglaUbic = ref<'obligatoria' | 'deseable'>('obligatoria')
const exclusiva = ref(false)

const esEdicion = computed(() => !!props.proceso)
const titulo = computed(() => `Proceso: ${nombreProceso.value || (props.proceso?.nombre ?? 'nuevo')}`)
const puedeEditar = computed(() => !props.proceso || (props.proceso.estado !== 'CONFIRMADO' && props.proceso.estado !== 'DESCARTADO'))
const puedeBorrar = computed(() => !!props.proceso && props.proceso.estado !== 'CONFIRMADO' && props.proceso.estado !== 'DESCARTADO' && !borrando.value)
const puedeGuardar = computed(() => puedeEditar.value && !guardando.value && !!nombreProceso.value.trim() && !!periodoId.value)

function motivo(t: boolean, m: string) { return t ? '' : m }

async function cargarBase() {
  try {
    const [p, a, o, e] = await Promise.all([listarPeriodosRegistro(), obtenerAtributosRegla('ALOJAMIENTO'), obtenerOperadoresRegla(), obtenerEdificios()])
    periodos.value = p; atributos.value = a; operadores.value = o; edificios.value = e
  } catch (e: any) { error.value = e?.message || 'Error cargando datos base' }
}

async function cargarProceso() {
  error.value = ''
  if (!props.proceso) {
    nombreProceso.value = ''; periodoId.value = ''; conjunto.value = null; restricciones.value = []
    condiciones.value = []; prioridades.value = []; cuartosSeleccionados.value = []; edificioId.value = ''; escaleras.value = []
    return
  }
  cargando.value = true
  try {
    nombreProceso.value = props.proceso.nombre
    periodoId.value = String(props.proceso.periodoRegistroId)
    const [c, r] = await Promise.all([obtenerConjunto(props.proceso.conjuntoReglaId), listarRestricciones(props.proceso.id)])
    conjunto.value = c; restricciones.value = r
    condiciones.value = c.condiciones.map(x => ({ atributoDefId: x.atributoDefId, operadorId: x.operadorId, valorTexto: x.valorTexto ?? undefined, valorEntero: x.valorEntero ?? undefined, valorFecha: x.valorFecha ?? undefined, valorBool: x.valorBool ?? undefined, valorPermitidoId: x.valorPermitidoId ?? undefined, parametro: x.parametro ?? undefined }))
    prioridades.value = c.prioridades.map(x => ({ atributoDefId: x.atributoDefId, tipo: 'ORDEN', orden: x.orden, sentido: (x.sentido as any) ?? 'ASC', nulosAlFinal: x.nulosAlFinal, parametro: x.parametro ?? undefined }))
  } catch (e: any) { error.value = e?.message || 'Error cargando proceso' }
  finally { cargando.value = false }
}

watch(() => props.open, async (v) => { if (v) { await cargarBase(); await cargarProceso() } })

watch(edificioId, async (v) => {
  escaleras.value = []; cuartosSeleccionados.value = []
  if (!v) return
  try {
    const d = await obtenerEdificio(Number(v))
    const map = new Map<number, { id: number; nombre: string; cuartos: { id: number; nombre: string }[] }>()
    d.escalerasDetalle.forEach(e => map.set(e.id, { id: e.id, nombre: e.nombre, cuartos: [] }))
    d.cuartosDetalle.forEach(c => { const g = map.get(c.escaleraId) || { id: c.escaleraId, nombre: `Escalera ${c.escaleraId}`, cuartos: [] }; g.cuartos.push({ id: c.id, nombre: c.nombre }); map.set(c.escaleraId, g) })
    escaleras.value = Array.from(map.values())
  } catch { escaleras.value = [] }
})

function agregarRegla() {
  if (!reglaAtributo.value) { const m = 'Selecciona un atributo'; error.value = m; toast.warning(m); return }
  if (!reglaOperador.value && reglaPrioridad.value === '') { const m = 'Selecciona operador (condición) o indica prioridad/orden'; error.value = m; toast.warning(m); return }
  const attr = atributos.value.find(a => String(a.id) === reglaAtributo.value)
  if (reglaOperador.value) {
    const cond: CondicionInput = { atributoDefId: Number(reglaAtributo.value), operadorId: Number(reglaOperador.value) }
    if (reglaValor.value !== '') {
      if (attr?.tipoDatoNombre === 'entero') cond.valorEntero = Number(reglaValor.value)
      else if (attr?.tipoDatoNombre === 'booleano') cond.valorBool = reglaValor.value === 'true'
      else if (attr?.tipoDatoNombre === 'fecha') cond.valorFecha = reglaValor.value
      else cond.valorTexto = reglaValor.value
    }
    condiciones.value.push(cond)
  }
  if (reglaPrioridad.value !== '') {
    const orden = Number(reglaPrioridad.value) || prioridades.value.length + 1
    prioridades.value.push({ atributoDefId: Number(reglaAtributo.value), tipo: 'ORDEN', orden, sentido: 'ASC' })
  }
  reglaAtributo.value = ''; reglaOperador.value = ''; reglaValor.value = ''; reglaPrioridad.value = ''; error.value = ''
}

function quitarCondicion(i: number) { condiciones.value.splice(i, 1) }
function quitarPrioridad(i: number) { prioridades.value.splice(i, 1) }
function toggleCuarto(id: number) { const i = cuartosSeleccionados.value.indexOf(id); if (i >= 0) cuartosSeleccionados.value.splice(i, 1); else cuartosSeleccionados.value.push(id) }

async function aplicarRestricciones(procesoId: number, conjuntoId: number) {
  if (cuartosSeleccionados.value.length === 0) return
  await agregarRestricciones(procesoId, { conjuntoReglaId: conjuntoId, cuartoIds: [...cuartosSeleccionados.value], relajable: tipoReglaUbic.value === 'deseable', exclusiva: exclusiva.value })
}

async function guardar() {
  if (!nombreProceso.value.trim()) { const m = 'Ingresa el nombre del proceso'; error.value = m; toast.warning(m); return }
  if (!periodoId.value) { const m = periodos.value.length ? 'Selecciona un período de registro' : 'No hay períodos de registro disponibles (/periodos-registro)'; error.value = m; toast.warning(m); return }
  guardando.value = true
  error.value = ''
  try {
    const payload = { condiciones: condiciones.value, prioridades: prioridades.value.map((p, i) => ({ atributoDefId: p.atributoDefId, tipo: 'ORDEN' as const, orden: p.orden ?? i + 1, sentido: p.sentido ?? 'ASC', nulosAlFinal: p.nulosAlFinal ?? false, parametro: p.parametro })) }
    if (!props.proceso) {
      const suf = Date.now().toString().slice(-6)
      const c = await crearConjunto({ nombre: `Reglas ${nombreProceso.value.trim()} ${suf}`.slice(0, 120), ambito: 'ALOJAMIENTO', ...payload })
      const pr = await crearProceso({ nombre: nombreProceso.value.trim(), tipo: 'MASIVO', periodoRegistroId: Number(periodoId.value), conjuntoReglaId: c.id })
      await aplicarRestricciones(pr.id, c.id)
      toast.success('Proceso creado')
    } else {
      const v = await crearVersionConjunto(props.proceso.conjuntoReglaId, payload)
      const pr = await crearProceso({ nombre: nombreProceso.value.trim(), tipo: (props.proceso.tipo as any) || 'MASIVO', periodoRegistroId: Number(periodoId.value), conjuntoReglaId: v.id, procesoOrigenId: props.proceso.id })
      await aplicarRestricciones(pr.id, v.id)
      if (props.proceso.estado !== 'CONFIRMADO') {
        try { await descartarProceso(props.proceso.id) } catch { /* anterior ya no crítico */ }
      }
      toast.success('Proceso actualizado (nueva versión)')
    }
    emit('guardado')
    emit('update:open', false)
  } catch (e: any) {
    const msg = e?.message || 'No se pudo guardar el proceso'
    error.value = msg
    toast.error(msg)
  } finally {
    guardando.value = false
  }
}

function borrar() { if (!props.proceso || !puedeBorrar.value) return; confirmarBorradoAbierto.value = true }
async function borrarConfirmado() {
  if (!props.proceso) return
  borrando.value = true
  try {
    await descartarProceso(props.proceso.id)
    toast.success('Proceso descartado')
    confirmarBorradoAbierto.value = false
    emit('guardado')
    emit('update:open', false)
  } catch (e: any) { const m = e?.message || 'No se pudo descartar'; error.value = m; toast.error(m) }
  finally { borrando.value = false }
}

const nombreAttr = (id: number) => atributos.value.find(a => a.id === id)?.nombre || String(id)
const nombreOp = (id: number) => { const o = operadores.value.find(x => x.id === id); return o ? `${o.simbolo}` : String(id) }
</script>

<template>
  <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
    <DialogContent class="flex max-h-[90dvh] w-[calc(100vw-1rem)] max-w-6xl flex-col gap-4 overflow-hidden p-4 sm:w-full sm:max-w-6xl lg:max-w-7xl sm:p-6">
      <DialogHeader class="shrink-0 pr-8 text-left">
        <DialogTitle class="break-words">{{ titulo }}</DialogTitle>
      </DialogHeader>

      <div class="flex-1 min-h-0 overflow-y-auto pr-1">
        <div v-if="cargando" class="flex items-center gap-2 py-8 text-sm text-muted-foreground"><LoaderCircleIcon class="size-4 animate-spin" />Cargando...</div>
        <Alert v-if="error" variant="destructive" class="mb-4"><AlertCircleIcon /><AlertTitle>Error</AlertTitle><AlertDescription>{{ error }}</AlertDescription></Alert>

        <div v-if="!cargando" class="space-y-4">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div class="flex min-w-0 flex-col gap-1 sm:col-span-1"><Label>Nombre del proceso</Label><Input v-model="nombreProceso" :disabled="!puedeEditar || guardando" class="w-full" /></div>
            <div class="flex min-w-0 flex-col gap-1"><Label>Período de registro</Label>
              <Select v-model="periodoId" :disabled="!puedeEditar || guardando || esEdicion"><SelectTrigger class="w-full"><SelectValue :placeholder="periodos.length ? 'Seleccionar período' : 'Sin períodos disponibles'" /></SelectTrigger>
                <SelectContent><SelectItem v-for="p in periodos" :key="p.id" :value="String(p.id)">{{ p.inicio }} - {{ p.fin }}</SelectItem></SelectContent>
              </Select>
              <p v-if="!periodos.length" class="text-xs text-muted-foreground">Viene del backend (/periodos-registro). Debe existir un período para guardar.</p>
            </div>
            <div v-if="proceso" class="flex items-center gap-2 text-sm text-muted-foreground sm:items-end sm:pb-2">Estado: <Badge variant="secondary">{{ proceso.estado }}</Badge> <span class="text-xs">#{{ proceso.id }}</span></div>
          </div>

          <div class="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-8">
            <div class="min-w-0 space-y-4 rounded-lg border p-4 sm:p-5">
              <h3 class="font-semibold">Definición de Reglas</h3>
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div class="flex min-w-0 flex-col gap-1"><Label>Atributo</Label>
                  <Select v-model="reglaAtributo" :disabled="!puedeEditar || guardando"><SelectTrigger class="w-full"><SelectValue placeholder="Atributo" /></SelectTrigger>
                    <SelectContent><SelectItem v-for="a in atributos" :key="a.id" :value="String(a.id)">{{ a.nombre }}</SelectItem></SelectContent></Select>
                </div>
                <div class="flex min-w-0 flex-col gap-1"><Label>Operador (condición)</Label>
                  <Select v-model="reglaOperador" :disabled="!puedeEditar || guardando"><SelectTrigger class="w-full"><SelectValue placeholder="Opcional si solo prioridad" /></SelectTrigger>
                    <SelectContent><SelectItem v-for="o in operadores" :key="o.id" :value="String(o.id)">{{ o.simbolo }} - {{ o.nombre }}</SelectItem></SelectContent></Select>
                </div>
                <div class="flex min-w-0 flex-col gap-1"><Label>Valor</Label><Input v-model="reglaValor" placeholder="Valor de la condición" :disabled="!puedeEditar || guardando" class="w-full" /></div>
                <div class="flex min-w-0 flex-col gap-1"><Label>Prioridad (orden)</Label><Input v-model="reglaPrioridad" type="number" min="1" placeholder="Nº de orden (opcional)" :disabled="!puedeEditar || guardando" class="w-full" /></div>
              </div>
              <p class="text-xs text-muted-foreground">Agrega condiciones (Atributo + Operador + Valor) y/o prioridades. La prioridad define el orden en que se aplican.</p>
              <Button type="button" variant="outline" size="sm" class="w-full sm:w-auto" @click="agregarRegla" :disabled="!puedeEditar || guardando" :title="motivo(puedeEditar,'Proceso confirmado: no editable')"><PlusIcon class="size-4 mr-1" />Agregar regla</Button>

              <div v-if="condiciones.length" class="space-y-1">
                <div class="text-xs font-medium text-muted-foreground">Condiciones</div>
                <div v-for="(c,i) in condiciones" :key="'c'+i" class="flex items-start justify-between gap-2 rounded border p-2 text-sm">
                  <span class="min-w-0 break-words">{{ nombreAttr(c.atributoDefId) }} {{ nombreOp(c.operadorId) }} {{ c.valorTexto ?? c.valorEntero ?? c.valorFecha ?? c.valorPermitidoId ?? c.parametro ?? (c.valorBool!=null?String(c.valorBool):'') }}</span>
                  <Button variant="ghost" size="icon" class="shrink-0" @click="quitarCondicion(i)" :disabled="!puedeEditar || guardando"><Trash2Icon class="size-4" /></Button>
                </div>
              </div>
              <div v-if="prioridades.length" class="space-y-1">
                <div class="text-xs font-medium text-muted-foreground">Prioridades (orden)</div>
                <div v-for="(p,i) in prioridades" :key="'p'+i" class="flex items-start justify-between gap-2 rounded border p-2 text-sm">
                  <span class="min-w-0 break-words">{{ nombreAttr(p.atributoDefId) }} · orden {{ p.orden }}</span>
                  <Button variant="ghost" size="icon" class="shrink-0" @click="quitarPrioridad(i)" :disabled="!puedeEditar || guardando"><Trash2Icon class="size-4" /></Button>
                </div>
              </div>
            </div>

            <div class="min-w-0 space-y-4 rounded-lg border p-4 sm:p-5">
              <h3 class="font-semibold">Asignación de Ubicación</h3>
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div class="flex min-w-0 flex-col gap-1"><Label>Edificio</Label>
                  <Select v-model="edificioId" :disabled="!puedeEditar || guardando"><SelectTrigger class="w-full"><SelectValue placeholder="Edificio" /></SelectTrigger>
                    <SelectContent><SelectItem v-for="e in edificios" :key="e.id" :value="String(e.id)">{{ e.nombre }}</SelectItem></SelectContent></Select>
                </div>
                <div class="flex min-w-0 flex-col gap-1"><Label>Tipo</Label>
                  <Select v-model="tipoReglaUbic" :disabled="!puedeEditar || guardando"><SelectTrigger class="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="obligatoria">Obligatoria</SelectItem><SelectItem value="deseable">Deseable</SelectItem></SelectContent></Select>
                </div>
              </div>
              <label class="flex items-start gap-2 text-sm"><input type="checkbox" v-model="exclusiva" :disabled="!puedeEditar || guardando" class="mt-0.5" /> <span><span class="font-medium">Exclusiva</span>: quienes cumplan estas reglas solo podrán ir a los cuartos seleccionados.</span></label>
              <p class="text-xs text-muted-foreground">Tipo <strong>Obligatoria</strong>: condición estricta. <strong>Deseable</strong>: relajable en una segunda ejecución. Al guardar se agregan los cuartos seleccionados como restricción.</p>

              <div class="max-h-56 space-y-2 overflow-auto pr-1 sm:max-h-64">
                <div v-for="esc in escaleras" :key="esc.id" class="rounded border p-2">
                  <div class="mb-1 text-sm font-medium">{{ esc.nombre }}</div>
                  <div class="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    <label v-for="c in esc.cuartos" :key="c.id" class="flex items-center gap-2 text-sm"><input type="checkbox" :checked="cuartosSeleccionados.includes(c.id)" @change="toggleCuarto(c.id)" :disabled="!puedeEditar || guardando" /> <span class="break-words">{{ c.nombre }}</span></label>
                  </div>
                </div>
                <div v-if="edificioId && !escaleras.length" class="text-sm text-muted-foreground">Sin cuartos/escaleras.</div>
                <div v-if="!edificioId" class="text-sm text-muted-foreground">Selecciona un edificio para ver cuartos.</div>
              </div>
              <div v-if="cuartosSeleccionados.length" class="text-xs text-muted-foreground">{{ cuartosSeleccionados.length }} cuarto(s) seleccionados para agregar como restricción al guardar.</div>

              <div v-if="restricciones.length" class="space-y-1">
                <div class="text-xs font-medium text-muted-foreground">Restricciones actuales</div>
                <div v-for="r in restricciones" :key="r.id" class="flex items-center justify-between gap-2 rounded border p-2 text-sm">
                  <span class="min-w-0 break-words">{{ r.cuarto }} <Badge variant="outline" class="ml-1">{{ r.relajable ? 'Deseable' : 'Obligatoria' }}</Badge></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter class="shrink-0 flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex w-full flex-wrap gap-2 sm:w-auto">
          <Button v-if="proceso" variant="outline" class="w-full sm:w-auto" @click="borrar" :disabled="!puedeBorrar" :title="motivo(!!puedeBorrar,'No se puede borrar en este estado')"><Trash2Icon class="size-4 mr-1" />Borrar</Button>
        </div>
        <div class="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          <Button variant="outline" class="w-full sm:w-auto" @click="emit('update:open', false)">Cancelar</Button>
          <Button class="w-full sm:w-auto" @click="guardar" :disabled="!puedeGuardar" :title="!puedeEditar ? 'Proceso confirmado: no editable' : (!nombreProceso.trim() ? 'Ingresa nombre' : (!periodoId ? 'Selecciona período' : ''))"><LoaderCircleIcon v-if="guardando" class="size-4 animate-spin mr-1" />Guardar</Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <ConfirmDialog
    v-model:open="confirmarBorradoAbierto"
    titulo="Descartar proceso"
    :descripcion="`¿Descartar el proceso &quot;${proceso?.nombre ?? ''}&quot; (#${proceso?.id ?? ''})? Esta acción no se puede deshacer.`"
    confirm-label="Descartar"
    :cargando="borrando"
    @confirmar="borrarConfirmado"
  />
</template>
