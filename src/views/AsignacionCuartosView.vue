<script setup lang="ts">
import type { ProcesoLeer } from '@/types/alojamiento'
import { computed, onMounted, ref } from 'vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import ConfirmDialog from '@/components/infraestructura/ConfirmDialog.vue'
import ProcesoAsignacionDialog from '@/components/alojamiento/ProcesoAsignacionDialog.vue'
import ResultadosAsignacionDialog from '@/components/alojamiento/ResultadosAsignacionDialog.vue'
import { listarProcesos, descartarProceso } from '@/services/alojamiento'
import { formatDate } from '@/lib/format'
import { AlertCircleIcon, PencilIcon, PlayIcon, PlusIcon, RefreshCwIcon, Trash2Icon } from '@lucide/vue'
import { toast } from 'vue-sonner'

const procesos = ref<ProcesoLeer[]>([])
const cargando = ref(true)
const error = ref('')

const modalAbierto = ref(false)
const procesoEditando = ref<ProcesoLeer | null>(null)
const resultadosAbierto = ref(false)
const procesoResultados = ref<ProcesoLeer | null>(null)
const procesandoId = ref<number | null>(null)

const procesoABorrar = ref<ProcesoLeer | null>(null)
const confirmarBorradoAbierto = ref(false)
const borrando = ref(false)

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const lista = await listarProcesos()
    procesos.value = lista.filter((p) => p.estado !== 'DESCARTADO')
    if (procesoResultados.value) {
      procesoResultados.value = procesos.value.find((p) => p.id === procesoResultados.value!.id) ?? procesoResultados.value
    }
  } catch (e: any) {
    error.value = e?.message || 'No se pudieron cargar los procesos'
  } finally {
    cargando.value = false
  }
}

function nuevo() { procesoEditando.value = null; modalAbierto.value = true }
function editar(p: ProcesoLeer) { procesoEditando.value = p; modalAbierto.value = true }
function usar(p: ProcesoLeer) { procesoResultados.value = p; resultadosAbierto.value = true }

const puedeEditar = (p: ProcesoLeer) => p.estado !== 'CONFIRMADO' && procesandoId.value !== p.id
const puedeBorrar = (p: ProcesoLeer) => p.estado !== 'CONFIRMADO' && procesandoId.value !== p.id
const motivoEditar = (p: ProcesoLeer) => p.estado === 'CONFIRMADO' ? 'Proceso confirmado: no editable' : procesandoId.value === p.id ? 'Procesando...' : ''
const motivoBorrar = (p: ProcesoLeer) => p.estado === 'CONFIRMADO' ? 'Proceso confirmado: no se puede borrar' : procesandoId.value === p.id ? 'Procesando...' : ''

function solicitarBorrado(p: ProcesoLeer) {
  if (!puedeBorrar(p)) return
  procesoABorrar.value = p
  confirmarBorradoAbierto.value = true
}

async function confirmarBorrado() {
  const p = procesoABorrar.value
  if (!p) return
  borrando.value = true
  procesandoId.value = p.id
  try {
    await descartarProceso(p.id)
    toast.success('Proceso descartado')
    confirmarBorradoAbierto.value = false
    procesoABorrar.value = null
    await cargar()
  } catch (e: any) {
    toast.error(e?.message || 'No se pudo descartar el proceso')
    error.value = e?.message || 'No se pudo descartar el proceso'
  } finally {
    borrando.value = false
    procesandoId.value = null
  }
}

const placeholders = computed(() => {
  const n = procesos.value.length
  if (n === 0) return [1, 2, 3]
  if (n === 1) return [1, 2]
  if (n === 2) return [1]
  return []
})

function campo1(p: ProcesoLeer) { return p.conjunto ? `${p.conjunto} v${p.conjuntoVersion}` : '-' }
function campo2(p: ProcesoLeer) {
  const parts: string[] = []
  if (p.estado) parts.push(p.estado)
  if (p.restricciones != null) parts.push(`Reglas: ${p.restricciones}`)
  if (p.preasignaciones != null) parts.push(`Asignados: ${p.preasignaciones}`)
  return parts.length ? parts.join(' · ') : '-'
}

onMounted(cargar)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="min-w-0 break-words text-2xl font-semibold tracking-tight">Procesos de asignación de cuartos</h1>
      <div class="flex w-full flex-wrap gap-2 sm:w-auto">
        <Button variant="outline" class="flex-1 sm:flex-none" @click="cargar" :disabled="cargando"><RefreshCwIcon class="size-4 mr-1" />Refrescar</Button>
        <Button class="flex-1 sm:flex-none" @click="nuevo"><PlusIcon class="size-4 mr-1" />Nuevo proceso</Button>
      </div>
    </div>

    <Alert v-if="error" variant="destructive">
      <AlertCircleIcon class="size-4" />
      <AlertTitle>No se pudieron cargar los procesos</AlertTitle>
      <AlertDescription class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><span>{{ error }}</span><Button variant="outline" size="sm" @click="cargar">Reintentar</Button></AlertDescription>
    </Alert>

    <div v-if="cargando" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <Skeleton v-for="i in 3" :key="i" class="h-56 w-full rounded-xl" />
    </div>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <Card v-for="p in procesos" :key="p.id" class="flex h-full flex-col justify-between">
        <CardContent class="flex h-full flex-col p-4">
          <div class="flex-1 space-y-2">
            <div class="flex items-start justify-between gap-2">
              <div class="text-base font-medium leading-tight break-words">{{ p.nombre }}</div>
              <span class="shrink-0 text-xs text-muted-foreground">#{{ p.id }}</span>
            </div>
            <div class="text-sm text-muted-foreground">Reglas</div>
            <div class="text-sm break-words">{{ campo1(p) }}</div>
            <div class="text-sm text-muted-foreground break-words">{{ campo2(p) }}</div>
            <div v-if="p.creadoEn" class="text-xs text-muted-foreground">{{ formatDate(p.creadoEn) }}</div>
          </div>
          <div class="mt-auto flex flex-col gap-2 pt-4">
            <Button size="sm" class="w-full" @click="usar(p)"><PlayIcon class="size-4 mr-1" />Usar asignación</Button>
            <div class="flex justify-center gap-4">
              <button type="button" class="flex size-9 items-center justify-center rounded-full border bg-background hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40" :disabled="!puedeEditar(p)" :title="motivoEditar(p) || 'Editar proceso'" @click="editar(p)"><PencilIcon class="size-4" /></button>
              <button type="button" class="flex size-9 items-center justify-center rounded-full border bg-background hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40" :disabled="!puedeBorrar(p)" :title="motivoBorrar(p) || 'Borrar proceso'" @click="solicitarBorrado(p)"><Trash2Icon class="size-4" /></button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card v-for="i in placeholders" :key="'ph'+i" class="border-dashed opacity-60">
        <CardContent class="flex h-full min-h-[220px] flex-col justify-between p-4">
          <div class="space-y-2">
            <div class="text-base font-medium">-</div>
            <div class="text-sm text-muted-foreground">Reglas</div>
            <div class="text-sm">-</div>
            <div class="text-sm">-</div>
          </div>
          <div class="flex flex-col gap-2 pt-4">
            <div class="h-8 rounded border" />
            <div class="flex justify-center gap-4"><div class="size-9 rounded-full border" /><div class="size-9 rounded-full border" /></div>
          </div>
        </CardContent>
      </Card>
    </div>

    <ProcesoAsignacionDialog v-model:open="modalAbierto" :proceso="procesoEditando" @guardado="cargar" />
    <ResultadosAsignacionDialog v-model:open="resultadosAbierto" :proceso="procesoResultados" @actualizado="cargar" />

    <ConfirmDialog
      v-model:open="confirmarBorradoAbierto"
      titulo="Descartar proceso"
      :descripcion="`¿Descartar el proceso &quot;${procesoABorrar?.nombre ?? ''}&quot; (#${procesoABorrar?.id ?? ''})? Esta acción no se puede deshacer.`"
      confirm-label="Descartar"
      :cargando="borrando"
      @confirmar="confirmarBorrado"
    />
  </div>
</template>
