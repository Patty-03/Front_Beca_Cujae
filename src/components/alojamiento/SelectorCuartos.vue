<script setup lang="ts">
import type {
  CuartoResumen,
  EdificioDetalle,
  EdificioResumen,
} from '@/types/infraestructura'
import { computed, onMounted, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { obtenerEdificios, obtenerEdificio } from '@/services/infraestructura'
import {
  LoaderCircleIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
} from '@lucide/vue'

const props = withDefaults(defineProps<{ modeloValue?: number[] }>(), {})
const emit = defineEmits<{
  'update:modeloValue': [number[]]
}>()

const edificios = ref<EdificioResumen[]>([])
const edificioSeleccionado = ref<number | null>(null)
const detalle = ref<EdificioDetalle | null>(null)
const cargandoEdificios = ref(false)
const cargandoDetalle = ref(false)

const seleccionados = ref<number[]>(props.modeloValue ? [...props.modeloValue] : [])

watch(
  () => props.modeloValue,
  (nuevo) => {
    seleccionados.value = nuevo ? [...nuevo] : []
  },
)

watch(
  seleccionados,
  (nuevo) => {
    emit('update:modeloValue', nuevo)
  },
  { deep: true },
)

async function cargarEdificios() {
  cargandoEdificios.value = true
  try {
    edificios.value = await obtenerEdificios()
  } catch {
    edificios.value = []
  } finally {
    cargandoEdificios.value = false
  }
}

async function seleccionarEdificio(id: unknown) {
  const idNumero = id === '' || id === null || id === undefined ? null : Number(id)
  edificioSeleccionado.value = idNumero && !Number.isNaN(idNumero) ? idNumero : null
  detalle.value = null
  if (!edificioSeleccionado.value) return
  cargandoDetalle.value = true
  try {
    detalle.value = await obtenerEdificio(edificioSeleccionado.value)
  } catch {
    detalle.value = null
  } finally {
    cargandoDetalle.value = false
  }
}

interface GrupoCuartos {
  id: number
  nombre: string
  cuartos: CuartoResumen[]
}

const cuartosPorEscalera = computed<GrupoCuartos[]>(() => {
  if (!detalle.value) return []
  const porEscalera = new Map<number, GrupoCuartos>()
  detalle.value.escalerasDetalle.forEach((e) => {
    porEscalera.set(e.id, { id: e.id, nombre: e.nombre, cuartos: [] })
  })
  detalle.value.cuartosDetalle.forEach((c) => {
    const grupo = porEscalera.get(c.escaleraId)
    if (grupo) grupo.cuartos.push(c)
    else {
      porEscalera.set(c.escaleraId, {
        id: c.escaleraId,
        nombre: `Escalera ${c.escaleraId}`,
        cuartos: [c],
      })
    }
  })
  return Array.from(porEscalera.values()).sort((a, b) =>
    a.nombre.localeCompare(b.nombre),
  )
})

const cuartoMap = computed(() => {
  const m = new Map<number, CuartoResumen>()
  detalle.value?.cuartosDetalle.forEach((c) => m.set(c.id, c))
  return m
})

const nombreCuarto = (id: number) => cuartoMap.value.get(id)?.nombre ?? String(id)

const seleccionadosCount = computed(() => seleccionados.value.length)

function estaSeleccionado(id: number) {
  return seleccionados.value.includes(id)
}

function toggleCuarto(id: number) {
  const idx = seleccionados.value.indexOf(id)
  if (idx >= 0) seleccionados.value.splice(idx, 1)
  else seleccionados.value.push(id)
}

function seleccionarTodos() {
  if (!detalle.value) return
  seleccionados.value = [...new Set([...seleccionados.value, ...detalle.value.cuartosDetalle.map((c) => c.id)])]
}

function limpiarSeleccion() {
  seleccionados.value = []
}

function quitarChip(id: number) {
  toggleCuarto(id)
}

onMounted(cargarEdificios)
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-3 sm:grid-cols-3 items-end">
      <div class="flex flex-col gap-1">
        <Label for="selector-edificio">Edificio</Label>
        <Select
          id="selector-edificio"
          :model-value="edificioSeleccionado ?? ''"
          :disabled="cargandoEdificios || cargandoDetalle"
          @update:model-value="seleccionarEdificio"
          class="w-full"
        >
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Seleccionar edificio..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="e in edificios"
              :key="e.id"
              :value="String(e.id)"
            >
              {{ e.nombre }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex flex-col gap-1 h-10 flex items-end">
        <Button
          type="button"
          :disabled="cargandoEdificios || cargandoDetalle"
          variant="outline"
          size="sm"
          @click="cargarEdificios"
        >
          <LoaderCircleIcon
            v-if="cargandoEdificios || cargandoDetalle"
            class="size-4 animate-spin mr-1"
          />
          <RefreshCwIcon v-else />
        </Button>
      </div>
    </div>

    <div v-if="seleccionadosCount > 0" class="flex flex-wrap gap-2">
      <span class="text-xs font-medium text-muted-foreground">Seleccionados:</span>
      <span
        v-for="id in seleccionados"
        :key="id"
        class="inline-flex items-center gap-1.5 rounded-full border bg-primary px-2 py-0.5 text-xs text-primary-foreground"
      >
        {{ nombreCuarto(id) }}
        <button
          type="button"
          class="ml-1 p-0.5 rounded hover:bg-red-50 text-red-500"
          @click="quitarChip(id)"
          title="Quitar"
        >
          <Trash2Icon class="size-3" />
        </button>
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        @click="limpiarSeleccion"
      >
        Limpiar selección
      </Button>
    </div>

    <div v-if="cargandoEdificios" class="flex gap-2 text-sm text-muted-foreground">
      <LoaderCircleIcon class="size-4 animate-spin" />
      <span>Cargando edificios…</span>
    </div>

    <Card v-if="edificioSeleccionado && !detalle && !cargandoDetalle" class="border-dashed">
      <CardContent class="p-6 text-center text-muted-foreground">
        <RefreshCwIcon class="size-6 mx-auto mb-2 opacity-50" />
        <p>Selecciona un edificio para ver sus cuartos.</p>
      </CardContent>
    </Card>

    <div v-if="detalle && cargandoDetalle" class="flex gap-2 text-sm text-muted-foreground">
      <LoaderCircleIcon class="size-4 animate-spin" />
      <span>Cargando cuartos de {{ detalle.nombre }}…</span>
    </div>

    <Card v-if="detalle && !cargandoDetalle">
      <CardHeader class="flex flex-row items-center justify-between gap-2">
        <CardTitle>
          Cuartos de {{ detalle.nombre }}
          <Badge variant="secondary">{{ detalle.cuartosDetalle.length }}</Badge>
        </CardTitle>
        <div class="flex gap-1">
          <Button
            type="button"
            size="sm"
            :disabled="seleccionadosCount === detalle.cuartosDetalle.length"
            @click="seleccionarTodos"
          >
            <PlusIcon class="size-4 mr-1" /> Seleccionar todos
          </Button>
        </div>
      </CardHeader>
      <CardContent class="space-y-3">
        <div v-if="cuartosPorEscalera.length === 0" class="text-center py-6 text-muted-foreground text-sm">
          Sin cuartos registrados en este edificio.
        </div>
        <div
          v-else
          class="grid gap-3"
        >
          <div
            v-for="grupo in cuartosPorEscalera"
            :key="grupo.id"
            class="border rounded-lg p-3"
          >
            <div class="flex items-center gap-2 mb-2">
              <span class="font-semibold text-sm">{{ grupo.nombre }}</span>
              <Badge variant="outline">{{ grupo.cuartos.length }} cuarto(s)</Badge>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                v-for="c in grupo.cuartos"
                :key="c.id"
                class="flex items-center gap-2 rounded border border-input bg-background p-2 text-sm cursor-pointer hover:bg-accent/50"
              >
                <input
                  type="checkbox"
                  :checked="estaSeleccionado(c.id)"
                  @change="toggleCuarto(c.id)"
                  class="rounded border-input text-primary"
                />
                <span class="shrink-0 font-medium">{{ c.nombre }}</span>
                <span class="ml-auto text-xs text-muted-foreground">
                  {{ c.capacidadMaxima }} pl.
                </span>
              </label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <div v-if="detalle && detalle.cuartosDetalle.length === 0" class="text-center py-4 text-muted-foreground text-sm">
      Sin cuartos para seleccionar.
    </div>
  </div>
</template>
