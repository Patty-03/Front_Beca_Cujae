<script setup lang="ts">
import type { CuartoResumen, EdificioDetalle, EdificioResumen } from '@/types/infraestructura'
import { computed, onMounted, ref, watch } from 'vue'
import { DoorOpenIcon, UsersIcon } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import EstadoConstructivoBadge from '@/components/infraestructura/EstadoConstructivoBadge.vue'
import KpiCard from '@/components/infraestructura/KpiCard.vue'
import MediosDeCuartoPanel from '@/components/inventario/MediosDeCuartoPanel.vue'
import { formatNumber, formatPercent } from '@/lib/format'
import { obtenerEdificio, obtenerEdificios } from '@/services/infraestructura'

const edificios = ref<EdificioResumen[]>([])
const detalle = ref<EdificioDetalle | null>(null)
const cargandoEdificios = ref(false)
const cargandoDetalle = ref(false)
const error = ref('')

const edificioId = ref('')
const escaleraId = ref('')
const cuartoId = ref('')

const escalerasDetalle = computed(() => detalle.value?.escalerasDetalle ?? [])
const cuartosDetalle = computed(() => detalle.value?.cuartosDetalle ?? [])

const cuartosDisponibles = computed(() =>
  cuartosDetalle.value.filter(
    (cuarto) => escaleraId.value && cuarto.escaleraId.toString() === escaleraId.value,
  ),
)

const cuartoSeleccionado = computed<CuartoResumen | null>(
  () => cuartosDisponibles.value.find((cuarto) => cuarto.id.toString() === cuartoId.value) ?? null,
)

const nombreEdificio = computed(
  () => edificios.value.find((edificio) => edificio.id.toString() === edificioId.value)?.nombre ?? '',
)

const nombreEscalera = computed(
  () =>
    escalerasDetalle.value.find((escalera) => escalera.id.toString() === escaleraId.value)?.nombre ??
    '',
)

async function cargarEdificios() {
  cargandoEdificios.value = true
  error.value = ''
  try {
    edificios.value = await obtenerEdificios()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo cargar la lista de edificios.'
  } finally {
    cargandoEdificios.value = false
  }
}

async function cargarDetalle(id: number) {
  cargandoDetalle.value = true
  error.value = ''
  try {
    detalle.value = await obtenerEdificio(id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo cargar el edificio seleccionado.'
    detalle.value = null
  } finally {
    cargandoDetalle.value = false
  }
}

watch(edificioId, (nuevo) => {
  escaleraId.value = ''
  cuartoId.value = ''
  detalle.value = null

  const id = Number(nuevo)
  if (id) cargarDetalle(id)
})

watch(escaleraId, () => {
  cuartoId.value = ''
})

onMounted(cargarEdificios)
</script>

<template>
  <div class="space-y-6">
    <header class="space-y-1">
      <h1 class="text-2xl font-bold tracking-tight">Inventario de medios</h1>
      <p class="text-muted-foreground text-sm">
        Consulta y administra las taquillas, camas, colchones y demás medios de cada cuarto.
      </p>
    </header>

    <Alert v-if="error" variant="destructive">
      <AlertTitle>No se pudo cargar datos de infraestructura</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
      <Button variant="outline" size="sm" class="mt-3" @click="cargarEdificios">Reintentar</Button>
    </Alert>

    <Card>
      <CardContent class="grid gap-4 p-4 sm:grid-cols-3">
        <div class="grid gap-2">
          <Label for="inventario-edificio">Edificio</Label>
          <Select v-model="edificioId">
            <SelectTrigger id="inventario-edificio" class="w-full">
              <SelectValue placeholder="Seleccione un edificio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="edificio in edificios"
                :key="edificio.id"
                :value="edificio.id.toString()"
              >
                {{ edificio.nombre }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="grid gap-2">
          <Label for="inventario-escalera">Escalera</Label>
          <Select v-model="escaleraId" :disabled="!detalle || !escalerasDetalle.length">
            <SelectTrigger id="inventario-escalera" class="w-full">
              <SelectValue placeholder="Seleccione una escalera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="escalera in escalerasDetalle"
                :key="escalera.id"
                :value="escalera.id.toString()"
              >
                {{ escalera.nombre }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="grid gap-2">
          <Label for="inventario-cuarto">Cuarto</Label>
          <Select v-model="cuartoId" :disabled="!escaleraId">
            <SelectTrigger id="inventario-cuarto" class="w-full">
              <SelectValue placeholder="Seleccione un cuarto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="cuarto in cuartosDisponibles"
                :key="cuarto.id"
                :value="cuarto.id.toString()"
              >
                {{ cuarto.nombre }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>

    <div v-if="cargandoDetalle || cargandoEdificios" class="space-y-4">
      <Skeleton class="h-9 w-full" />
      <Skeleton class="h-40 w-full" />
    </div>

    <template v-else-if="!error">
      <div v-if="!edificioId" class="text-muted-foreground text-sm">
        Comience seleccionando el edificio cuyos medios desea administrar.
      </div>

      <template v-else>
        <div v-if="!escaleraId" class="text-muted-foreground text-sm">
          Seleccione la escalera y el cuarto del edificio {{ nombreEdificio }}.
        </div>

        <template v-else>
          <div v-if="!cuartosDisponibles.length" class="text-muted-foreground text-sm">
            La escalera {{ nombreEscalera }} del edificio {{ nombreEdificio }} no tiene cuartos
            registrados.
          </div>

          <template v-else>
            <div v-if="!cuartoId" class="text-muted-foreground text-sm">
              Por último seleccione el cuarto cuyo inventario de medios desea administrar.
            </div>

            <template v-else>
              <div v-if="cuartoSeleccionado" class="grid gap-4 sm:grid-cols-2">
                <KpiCard
                  label="Capacidad máxima"
                  :value="formatNumber(cuartoSeleccionado.capacidadMaxima)"
                  detail="Plazas del cuarto"
                  :icon="UsersIcon"
                />
                <KpiCard
                  label="Plazas ocupadas"
                  :value="formatNumber(cuartoSeleccionado.ocupados)"
                  :detail="`Ocupación del cuarto: ${formatPercent(cuartoSeleccionado.ocupacionPct)}`"
                  :icon="DoorOpenIcon"
                />
              </div>

              <div v-if="cuartoSeleccionado" class="flex flex-wrap items-center gap-2">
                <span class="text-foreground font-semibold">{{ cuartoSeleccionado.nombre }}</span>
                <EstadoConstructivoBadge :estado="cuartoSeleccionado.estado" />
              </div>

              <MediosDeCuartoPanel
                v-if="cuartoSeleccionado"
                :cuarto-id="cuartoSeleccionado.id"
                :cuarto-nombre="cuartoSeleccionado.nombre"
              />
            </template>
          </template>
        </template>
      </template>
    </template>
  </div>
</template>
