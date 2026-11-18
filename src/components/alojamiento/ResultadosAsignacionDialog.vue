<script setup lang="ts">
import type { NoAlojado, PreasignacionLeer, ProcesoLeer, ResultadoEjecucion } from '@/types/alojamiento'
import { computed, ref, watch } from 'vue'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ResultadoEjecucionPanel from '@/components/alojamiento/ResultadoEjecucionPanel.vue'
import { ejecutarProceso, listarPreasignaciones, listarNoAlojados, actualizarPreasignacion, agregarPreasignacion, quitarPreasignacion, confirmarProceso, obtenerProceso } from '@/services/alojamiento'
import { obtenerEdificios, obtenerEdificio } from '@/services/infraestructura'
import { LoaderCircleIcon, AlertCircleIcon, PlayIcon, RefreshCwIcon, CheckIcon, ArrowRightLeftIcon, UserPlusIcon, Trash2Icon } from '@lucide/vue'
import { toast } from 'vue-sonner'

const props = defineProps<{ open: boolean; proceso: ProcesoLeer | null }>()
const emit = defineEmits<{ 'update:open': [boolean]; actualizado: [] }>()

const cargando = ref(false)
const ejecutando = ref(false)
const confirmando = ref(false)
const error = ref('')
const resultado = ref<ResultadoEjecucion | null>(null)
const preasignaciones = ref<PreasignacionLeer[]>([])
const noAlojados = ref<NoAlojado[]>([])
const cuartosHabitables = ref<{ id: number; label: string }[]>([])
const moverDestino = ref<Record<number, string>>({})
const asignarCuarto = ref<Record<number, string>>({})
const ocupando = ref<number | null>(null)
const procesoActual = ref<ProcesoLeer | null>(null)

const actual = computed(() => procesoActual.value ?? props.proceso)
const puedeEjecutar = computed(() => !!actual.value && (actual.value.estado === 'BORRADOR' || actual.value.estado === 'EN_REVISION') && !ejecutando.value)
const puedeConfirmar = computed(() => actual.value?.estado === 'EN_REVISION' && preasignaciones.value.length > 0 && !ejecutando.value && !confirmando.value)

const gruposPorCuarto = computed(() => {
  const map = new Map<number, { cuartoId: number; cuarto: string; items: PreasignacionLeer[] }>()
  for (const p of preasignaciones.value) {
    if (!map.has(p.cuartoId)) map.set(p.cuartoId, { cuartoId: p.cuartoId, cuarto: p.cuarto, items: [] })
    map.get(p.cuartoId)!.items.push(p)
  }
  return Array.from(map.values()).sort((a, b) => a.cuarto.localeCompare(b.cuarto))
})

async function cargarCuartos() {
  try {
    const eds = await obtenerEdificios()
    const detalles = await Promise.all(eds.map(e => obtenerEdificio(e.id).catch(() => null)))
    const lista: { id: number; label: string }[] = []
    for (const d of detalles) {
      if (!d) continue
      const escMap = new Map(d.escalerasDetalle.map(e => [e.id, e.nombre]))
      for (const c of d.cuartosDetalle) {
        if (!c.estado?.habitable) continue
        const esc = escMap.get(c.escaleraId) || `Escalera ${c.escaleraId}`
        lista.push({ id: c.id, label: `${d.nombre} · ${esc} · ${c.nombre}` })
      }
    }
    lista.sort((a, b) => a.label.localeCompare(b.label))
    cuartosHabitables.value = lista
  } catch { cuartosHabitables.value = [] }
}

async function recargarProceso() {
  if (!actual.value) return
  try { procesoActual.value = await obtenerProceso(actual.value.id) } catch { /* mantener estado actual */ }
}

async function cargarDatos() {
  if (!actual.value) return
  cargando.value = true
  error.value = ''
  try {
    const [pres, noal] = await Promise.all([
      listarPreasignaciones(actual.value.id).catch(() => [] as PreasignacionLeer[]),
      listarNoAlojados(actual.value.id).catch(() => [] as NoAlojado[]),
    ])
    preasignaciones.value = pres
    noAlojados.value = noal
  } catch (e: any) { error.value = e?.message || 'Error cargando asignaciones' }
  finally { cargando.value = false }
}

watch(() => props.open, async (v) => {
  if (v && props.proceso) {
    procesoActual.value = props.proceso
    resultado.value = null; moverDestino.value = {}; asignarCuarto.value = {}
    await Promise.all([cargarDatos(), cargarCuartos(), recargarProceso()])
  }
})

async function ejecutar() {
  if (!actual.value) return
  ejecutando.value = true
  error.value = ''
  try {
    resultado.value = await ejecutarProceso(actual.value.id, { algoritmo: 'VORAZ' })
    await Promise.all([cargarDatos(), recargarProceso()])
    toast.success(`Ejecución: ${resultado.value.alojados} alojados, ${resultado.value.noAlojados?.length ?? 0} no alojados`)
    emit('actualizado')
  } catch (e: any) { const m = e?.message || 'No se pudo ejecutar'; error.value = m; toast.error(m) }
  finally { ejecutando.value = false }
}

async function confirmar() {
  if (!actual.value) return
  confirmando.value = true
  error.value = ''
  try {
    await confirmarProceso(actual.value.id)
    toast.success('Proceso confirmado')
    emit('actualizado')
    emit('update:open', false)
  } catch (e: any) { const m = e?.message || 'No se pudo confirmar'; error.value = m; toast.error(m) }
  finally { confirmando.value = false }
}

async function mover(p: PreasignacionLeer) {
  if (!actual.value) return
  const dest = moverDestino.value[p.estudianteId]
  if (!dest) { toast.warning('Selecciona un cuarto destino'); return }
  ocupando.value = p.estudianteId
  try {
    await actualizarPreasignacion(actual.value.id, p.estudianteId, { cuartoId: Number(dest) })
    toast.success(`${p.estudiante} movido`)
    moverDestino.value[p.estudianteId] = ''
    await cargarDatos()
    emit('actualizado')
  } catch (e: any) { const m = e?.message || 'No se pudo mover'; error.value = m; toast.error(m) }
  finally { ocupando.value = null }
}

async function asignar(n: NoAlojado) {
  if (!actual.value) return
  const dest = asignarCuarto.value[n.estudianteId]
  if (!dest) { toast.warning('Selecciona un cuarto'); return }
  ocupando.value = n.estudianteId
  try {
    await agregarPreasignacion(actual.value.id, { estudianteId: n.estudianteId, cuartoId: Number(dest), bloqueada: true })
    toast.success(`${n.estudiante} asignado`)
    asignarCuarto.value[n.estudianteId] = ''
    await cargarDatos()
    emit('actualizado')
  } catch (e: any) { const m = e?.message || 'No se pudo asignar'; error.value = m; toast.error(m) }
  finally { ocupando.value = null }
}

async function quitar(p: PreasignacionLeer) {
  if (!actual.value) return
  ocupando.value = p.estudianteId
  try {
    await quitarPreasignacion(actual.value.id, p.estudianteId)
    toast.success('Preasignación quitada')
    await cargarDatos()
    emit('actualizado')
  } catch (e: any) { const m = e?.message || 'No se pudo quitar'; error.value = m; toast.error(m) }
  finally { ocupando.value = null }
}

const labelCuarto = (id: number) => cuartosHabitables.value.find(c => c.id === id)?.label || String(id)
</script>

<template>
  <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
    <DialogContent class="flex max-h-[92dvh] w-[calc(100vw-1rem)] max-w-6xl flex-col gap-4 overflow-hidden p-4 sm:w-full lg:max-w-7xl sm:p-6">
      <DialogHeader class="shrink-0 pr-8 text-left">
        <DialogTitle class="break-words">Asignación: {{ actual?.nombre }} <span class="text-sm font-normal text-muted-foreground">(#{{ actual?.id }} · {{ actual?.estado }})</span></DialogTitle>
      </DialogHeader>

      <div class="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4">
        <Alert v-if="error" variant="destructive"><AlertCircleIcon /><AlertTitle>Error</AlertTitle><AlertDescription>{{ error }}</AlertDescription></Alert>

        <div class="flex flex-wrap gap-2">
          <Button @click="ejecutar" :disabled="!puedeEjecutar" :title="puedeEjecutar ? 'Ejecutar asignación' : 'Solo disponible en BORRADOR o EN_REVISION'"><PlayIcon v-if="!ejecutando" class="size-4 mr-1" /><LoaderCircleIcon v-else class="size-4 mr-1 animate-spin" />Ejecutar asignación</Button>
          <Button variant="outline" @click="async () => { await cargarDatos(); await recargarProceso() }" :disabled="cargando"><RefreshCwIcon class="size-4 mr-1" :class="cargando && 'animate-spin'" />Refrescar</Button>
          <Button v-if="actual?.estado === 'EN_REVISION'" variant="secondary" @click="confirmar" :disabled="!puedeConfirmar"><CheckIcon class="size-4 mr-1" />Confirmar proceso</Button>
        </div>

        <ResultadoEjecucionPanel v-if="resultado" :resultado="resultado" :ejecutando="ejecutando" />

        <div v-if="cargando" class="flex items-center gap-2 py-6 text-sm text-muted-foreground"><LoaderCircleIcon class="size-4 animate-spin" />Cargando asignaciones...</div>

        <Card v-if="!cargando">
          <CardHeader><CardTitle>Asignaciones por cuarto</CardTitle></CardHeader>
          <CardContent>
            <div v-if="!gruposPorCuarto.length" class="text-sm text-muted-foreground">Sin preasignaciones. Ejecuta la asignación para ubicar estudiantes.</div>
            <div v-else class="space-y-3">
              <div v-for="g in gruposPorCuarto" :key="g.cuartoId" class="rounded border p-3">
                <div class="mb-2 font-medium">{{ g.cuarto }} <Badge variant="outline" class="ml-1">{{ g.items.length }}</Badge></div>
                <div class="space-y-2">
                  <div v-for="p in g.items" :key="p.estudianteId" class="flex flex-col gap-2 rounded bg-muted/30 p-2 sm:flex-row sm:items-center sm:justify-between">
                    <div class="min-w-0"><div class="font-medium break-words">{{ p.estudiante }}</div><div class="text-xs text-muted-foreground">ID {{ p.estudianteId }} · {{ p.estado }} <span v-if="p.bloqueada">· bloqueada</span></div></div>
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Select v-model="moverDestino[p.estudianteId]"><SelectTrigger class="w-full sm:w-64"><SelectValue placeholder="Mover a cuarto..." /></SelectTrigger>
                        <SelectContent><SelectItem v-for="c in cuartosHabitables" :key="c.id" :value="String(c.id)">{{ c.label }}</SelectItem></SelectContent>
                      </Select>
                      <div class="flex gap-2">
                        <Button size="sm" variant="outline" @click="mover(p)" :disabled="ocupando === p.estudianteId"><ArrowRightLeftIcon class="size-4 mr-1" />Mover</Button>
                        <Button size="sm" variant="ghost" @click="quitar(p)" :disabled="ocupando === p.estudianteId" title="Quitar preasignación"><Trash2Icon class="size-4" /></Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card v-if="!cargando">
          <CardHeader><CardTitle>Estudiantes sin cuarto (no alojados)</CardTitle></CardHeader>
          <CardContent>
            <div v-if="!noAlojados.length" class="text-sm text-muted-foreground">No hay estudiantes pendientes sin cuarto.</div>
            <div v-else class="space-y-2">
              <div v-for="n in noAlojados" :key="n.estudianteId" class="flex flex-col gap-2 rounded border p-2 sm:flex-row sm:items-center sm:justify-between">
                <div class="min-w-0"><div class="font-medium break-words">{{ n.estudiante }}</div><div class="text-xs text-muted-foreground">{{ n.motivo }} — {{ n.detalle }}</div></div>
                <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Select v-model="asignarCuarto[n.estudianteId]"><SelectTrigger class="w-full sm:w-64"><SelectValue placeholder="Asignar a cuarto..." /></SelectTrigger>
                    <SelectContent><SelectItem v-for="c in cuartosHabitables" :key="c.id" :value="String(c.id)">{{ c.label }}</SelectItem></SelectContent>
                  </Select>
                  <Button size="sm" @click="asignar(n)" :disabled="ocupando === n.estudianteId"><UserPlusIcon class="size-4 mr-1" />Asignar</Button>
                </div>
              </div>
            </div>
            <p class="mt-2 text-xs text-muted-foreground">Puedes ubicar manualmente en cualquier cuarto habitable (sujeto a capacidad/habitabilidad del backend).</p>
          </CardContent>
        </Card>
      </div>

      <DialogFooter class="shrink-0 border-t pt-4"><Button variant="outline" @click="emit('update:open', false)">Cerrar</Button></DialogFooter>
    </DialogContent>
  </Dialog>
</template>
