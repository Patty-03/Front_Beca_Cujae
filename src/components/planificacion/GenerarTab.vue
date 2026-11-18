<script setup lang="ts">
import type {
  AlgoritmoGeneracion,
  GenerarInput,
  PeriodoLeer,
  PlanLeer,
  ResultadoGeneracion,
} from '@/types/planificacion'
import { computed, ref, watch } from 'vue'
import {
  AlertCircleIcon,
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  LoaderCircleIcon,
  PlayIcon,
  SparklesIcon,
  UsersIcon,
} from '@lucide/vue'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import KpiCard from '@/components/infraestructura/KpiCard.vue'
import { generarPlanificacion } from '@/services/planificacion'
import { formatDate, formatNumber } from '@/lib/format'
import { rangoPorDefecto } from '@/lib/planificacion'
import { toast } from 'vue-sonner'

const props = defineProps<{ periodo: PeriodoLeer; planes: PlanLeer[] }>()
const emit = defineEmits<{ actualizado: []; 'ir-revisar': [] }>()

const desde = ref('')
const hasta = ref('')
const seleccionados = ref<number[]>([])
const algoritmo = ref<AlgoritmoGeneracion>('SECUENCIAL')
const tiempoMaximo = ref('10')
const metaPorMes = ref('2')
const generando = ref(false)
const resultado = ref<ResultadoGeneracion | null>(null)
const errorGeneracion = ref<string | null>(null)

const cerrado = computed(() => props.periodo.estado === 'CERRADO')
const tiposPlan = computed(() => {
  const vistos = new Set<number>()
  return props.planes.filter((plan) => {
    if (vistos.has(plan.tipoDeberId)) return false
    vistos.add(plan.tipoDeberId)
    return true
  })
})

const algoritmos: { value: AlgoritmoGeneracion; label: string }[] = [
  { value: 'SECUENCIAL', label: 'Secuencial (rápido)' },
  { value: 'CPSAT', label: 'CPSAT (óptimo)' },
  { value: 'CPSAT_SECUENCIAL', label: 'CPSAT + secuencial' },
]

function reiniciar() {
  const rango = rangoPorDefecto(props.periodo)
  desde.value = rango.desde
  hasta.value = rango.hasta
  seleccionados.value = tiposPlan.value.map((plan) => plan.tipoDeberId)
  algoritmo.value = 'SECUENCIAL'
  tiempoMaximo.value = '10'
  metaPorMes.value = '2'
  resultado.value = null
  errorGeneracion.value = null
}

watch(
  () => [props.periodo.id, props.planes.length],
  reiniciar,
  { immediate: true },
)

function alternarTipo(tipoId: number) {
  if (seleccionados.value.includes(tipoId)) {
    seleccionados.value = seleccionados.value.filter((id) => id !== tipoId)
  } else {
    seleccionados.value = [...seleccionados.value, tipoId]
  }
}

async function generar() {
  if (props.planes.length === 0) {
    toast.warning('El período no tiene planes: agrega uno antes de generar.')
    return
  }
  if (!desde.value || !hasta.value) {
    toast.warning('Indica el rango de fechas a generar.')
    return
  }
  if (hasta.value < desde.value) {
    toast.warning('La fecha hasta no puede ser anterior a desde.')
    return
  }
  if (desde.value < props.periodo.inicio || hasta.value > props.periodo.fin) {
    toast.warning('El rango debe estar dentro del período.')
    return
  }
  const input: GenerarInput = {
    desde: desde.value,
    hasta: hasta.value,
    algoritmo: algoritmo.value,
    tiempoMaximo: Number(tiempoMaximo.value || 10),
    metaPorMes: metaPorMes.value === '' ? null : Number(metaPorMes.value),
  }
  const seleccionValida = seleccionados.value.filter((id) =>
    tiposPlan.value.some((plan) => plan.tipoDeberId === id),
  )
  if (seleccionValida.length > 0 && seleccionValida.length < tiposPlan.value.length) {
    input.tipoDeberIds = seleccionValida
  }
  generando.value = true
  resultado.value = null
  errorGeneracion.value = null
  try {
    resultado.value = await generarPlanificacion(props.periodo.id, input)
    toast.success('Planificación generada', {
      description: `${resultado.value.asignacionesCreadas} asignaciones creadas.`,
    })
    emit('actualizado')
  } catch (caught) {
    const mensaje = caught instanceof Error ? caught.message : 'Error desconocido.'
    errorGeneracion.value = mensaje
    toast.error('No se pudo generar la planificación', {
      description: mensaje,
    })
  } finally {
    generando.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <h3 class="text-base font-semibold">Generar planificación</h3>
      <p class="text-muted-foreground mt-0.5 text-sm">
        Crea las ocurrencias del rango y reparte las asignaciones según los planes y turnos
        configurados.
      </p>
    </div>

    <Alert v-if="cerrado">
      <AlertCircleIcon />
      <AlertTitle>Período cerrado</AlertTitle>
      <AlertDescription>
        No se puede volver a generar: el período cerrado es inmutable.
      </AlertDescription>
    </Alert>

    <Alert v-else-if="periodo.estado === 'BORRADOR'">
      <CalendarIcon />
      <AlertTitle>El período está en borrador</AlertTitle>
      <AlertDescription>
        Puedes generar para revisar el resultado, pero recuerda publicar el período antes de
        usarlo operativamente.
      </AlertDescription>
    </Alert>

    <Alert v-if="planes.length === 0">
      <AlertCircleIcon />
      <AlertTitle>Sin planes</AlertTitle>
      <AlertDescription>
        Agrega al menos un plan en la pestaña Planificar para poder generar.
      </AlertDescription>
    </Alert>

    <Card>
      <CardHeader>
        <CardTitle>Parámetros de generación</CardTitle>
        <CardDescription>
          La generación es idempotente para las ocurrencias ya existentes: solo crea lo que
          falta.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="space-y-1.5">
            <Label for="generar-desde">Desde</Label>
            <Input id="generar-desde" v-model="desde" type="date" :disabled="cerrado" />
          </div>
          <div class="space-y-1.5">
            <Label for="generar-hasta">Hasta</Label>
            <Input id="generar-hasta" v-model="hasta" type="date" :disabled="cerrado" />
          </div>
          <div class="space-y-1.5">
            <Label>Algoritmo</Label>
            <Select v-model="algoritmo" :disabled="cerrado">
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="item in algoritmos" :key="item.value" :value="item.value">
                  {{ item.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1.5">
            <Label for="generar-tiempo">Tiempo máximo (s)</Label>
            <Input
              id="generar-tiempo"
              v-model="tiempoMaximo"
              type="number"
              min="1"
              :disabled="cerrado"
            />
          </div>
          <div class="space-y-1.5">
            <Label for="generar-meta">Meta por mes</Label>
            <Input
              id="generar-meta"
              v-model="metaPorMes"
              type="number"
              min="0"
              :disabled="cerrado"
            />
          </div>
        </div>

        <div class="space-y-2">
          <div class="text-sm font-medium">Tipos de deber a generar</div>
          <div v-if="tiposPlan.length === 0" class="text-muted-foreground text-sm">
            Sin tipos planificados.
          </div>
          <div v-else class="flex flex-wrap gap-3">
            <label
              v-for="plan in tiposPlan"
              :key="plan.tipoDeberId"
              class="flex items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                class="border-input size-4 rounded"
                :checked="seleccionados.includes(plan.tipoDeberId)"
                :disabled="cerrado"
                @change="alternarTipo(plan.tipoDeberId)"
              />
              {{ plan.tipoDeber }}
            </label>
          </div>
          <p class="text-muted-foreground text-xs">
            Si no seleccionas ninguno, se generan todos los tipos con plan.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Button :disabled="generando || cerrado || planes.length === 0" @click="generar">
            <LoaderCircleIcon v-if="generando" class="animate-spin" />
            <PlayIcon v-else />
            {{ generando ? 'Generando…' : 'Generar planificación' }}
          </Button>
          <span class="text-muted-foreground text-xs">
            Rango del período: {{ formatDate(periodo.inicio) }} — {{ formatDate(periodo.fin) }}
          </span>
        </div>

        <p v-if="generando" class="text-muted-foreground text-sm">
          Procesando ocurrencias y asignaciones. Esto puede tardar unos segundos.
        </p>

        <Alert v-if="errorGeneracion" variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>No se pudo generar la planificación</AlertTitle>
          <AlertDescription>{{ errorGeneracion }}</AlertDescription>
        </Alert>
      </CardContent>
    </Card>

    <template v-if="resultado">
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Ocurrencias creadas"
          :value="formatNumber(resultado.ocurrenciasCreadas)"
          :detail="`${resultado.ocurrenciasExistentes} ya existían`"
          :icon="CalendarIcon"
        />
        <KpiCard
          label="Asignaciones creadas"
          :value="formatNumber(resultado.asignacionesCreadas)"
          :detail="`${resultado.asignacionesConservadas} conservadas`"
          :icon="UsersIcon"
          tono="emerald"
        />
        <KpiCard
          label="Sin cubrir"
          :value="formatNumber(resultado.sinCubrir.length)"
          detail="Ocurrencias con cupos faltantes"
          :icon="AlertCircleIcon"
          tono="amber"
        />
        <KpiCard
          label="Tiempo"
          :value="`${resultado.tiempoSegundos.toFixed(2)} s`"
          :detail="`Algoritmo ${resultado.algoritmo}`"
          :icon="ClockIcon"
          tono="sky"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ocurrencias sin cubrir</CardTitle>
          <CardDescription>
            Revisa estas ocurrencias y asigna estudiantes manualmente si hace falta.
          </CardDescription>
        </CardHeader>
        <CardContent class="px-0">
          <div class="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Configuración</TableHead>
                  <TableHead>Lugar</TableHead>
                  <TableHead class="text-right">Faltan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="resultado.sinCubrir.length === 0">
                  <TableCell colspan="4">
                    <div class="text-muted-foreground py-6 text-center text-sm">
                      Todas las ocurrencias generadas quedaron cubiertas.
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow
                  v-for="item in resultado.sinCubrir"
                  :key="item.ocurrenciaId"
                >
                  <TableCell>{{ formatDate(item.fecha) }}</TableCell>
                  <TableCell>{{ item.configuracion }}</TableCell>
                  <TableCell>{{ item.lugar ?? '—' }}</TableCell>
                  <TableCell class="text-right tabular-nums">{{ item.faltan }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div class="flex justify-end">
        <Button variant="outline" @click="emit('ir-revisar')">
          <SparklesIcon />
          Revisar y publicar
          <ArrowRightIcon />
        </Button>
      </div>
    </template>
  </div>
</template>
