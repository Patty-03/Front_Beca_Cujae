<script setup lang="ts">
import type { ProcesoLeer, RestriccionLeer, ResultadoEjecucion } from '@/types/alojamiento'
import { computed, ref } from 'vue'
import { AlertCircleIcon, LoaderCircleIcon, PlayIcon } from '@lucide/vue'
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
import ResultadoEjecucionPanel from '@/components/alojamiento/ResultadoEjecucionPanel.vue'
import { ejecutarProceso } from '@/services/alojamiento'
import { puedeEjecutarProceso } from '@/lib/alojamiento'
import { toast } from 'vue-sonner'

const props = defineProps<{
  proceso: ProcesoLeer
  restricciones: RestriccionLeer[]
}>()
const emit = defineEmits<{ actualizado: []; 'ir-revisar': [] }>()

const ejecutando = ref(false)
const error = ref('')
const resultado = ref<ResultadoEjecucion | null>(null)

const algoritmo = ref<'VORAZ' | 'VORAZ_REPARADO' | 'CPSAT' | 'CPSAT_VORAZ'>('VORAZ')
const base = ref<'FIJANDO_BLOQUEADAS' | 'DESDE_CERO'>('FIJANDO_BLOQUEADAS')
const tiempoMaximo = ref('')
const relajarSeleccionadas = ref<number[]>([])

const puedeEjecutar = computed(() => puedeEjecutarProceso(props.proceso.estado) && !ejecutando.value)
const relajables = computed(() => props.restricciones.filter((r) => r.relajable))

function toggleRelajar(id: number) {
  const i = relajarSeleccionadas.value.indexOf(id)
  if (i >= 0) relajarSeleccionadas.value.splice(i, 1)
  else relajarSeleccionadas.value.push(id)
}

async function ejecutar() {
  ejecutando.value = true
  error.value = ''
  try {
    const tiempoStr = String(tiempoMaximo.value ?? '').trim()
    const tiempo = tiempoStr ? Number(tiempoStr) : undefined
    resultado.value = await ejecutarProceso(props.proceso.id, {
      algoritmo: algoritmo.value,
      base: base.value,
      relajarRestricciones: relajarSeleccionadas.value.length ? [...relajarSeleccionadas.value] : undefined,
      tiempoMaximo: Number.isFinite(tiempo) ? tiempo : undefined,
    })
    toast.success('Ejecución completada', {
      description: `${resultado.value.alojados} alojados, ${resultado.value.noAlojados.length} no alojados`,
    })
    emit('actualizado')
  } catch (caught) {
    const msg = caught instanceof Error ? caught.message : 'No se pudo ejecutar la asignación.'
    error.value = msg
    toast.error('No se pudo ejecutar', { description: msg })
  } finally {
    ejecutando.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <Alert v-if="!puedeEjecutarProceso(proceso.estado)" variant="default">
      <AlertCircleIcon />
      <AlertTitle>Ejecución no disponible</AlertTitle>
      <AlertDescription>Solo se puede ejecutar en estado BORRADOR o EN_REVISION.</AlertDescription>
    </Alert>

    <Alert v-if="error" variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>Error en la ejecución</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <Card>
      <CardHeader>
        <CardTitle>Ejecutar asignación</CardTitle>
        <CardDescription>Configura los parámetros del motor y ejecuta para generar preasignaciones.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="space-y-1.5">
            <Label>Algoritmo</Label>
            <Select v-model="algoritmo" :disabled="ejecutando">
              <SelectTrigger class="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="VORAZ">Voraz</SelectItem>
                <SelectItem value="VORAZ_REPARADO">Voraz reparado</SelectItem>
                <SelectItem value="CPSAT">CP-SAT</SelectItem>
                <SelectItem value="CPSAT_VORAZ">CP-SAT + Voraz</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1.5">
            <Label>Base</Label>
            <Select v-model="base" :disabled="ejecutando">
              <SelectTrigger class="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FIJANDO_BLOQUEADAS">Fijando bloqueadas</SelectItem>
                <SelectItem value="DESDE_CERO">Desde cero</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1.5">
            <Label for="tiempo-max">Tiempo máximo (s)</Label>
            <Input id="tiempo-max" v-model="tiempoMaximo" type="number" min="1" placeholder="Opcional" :disabled="ejecutando" />
          </div>
        </div>

        <div v-if="relajables.length" class="space-y-2">
          <Label>Relajar restricciones deseables (opcional)</Label>
          <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <label v-for="r in relajables" :key="r.id" class="flex items-start gap-2 rounded border p-2 text-sm">
              <input
                type="checkbox"
                class="border-input mt-0.5 size-4 rounded"
                :checked="relajarSeleccionadas.includes(r.id)"
                :disabled="ejecutando"
                @change="toggleRelajar(r.id)"
              />
              <span><span class="font-medium">{{ r.cuarto }}</span> · {{ r.conjunto }} (v{{ r.conjuntoVersion }})</span>
            </label>
          </div>
        </div>
        <p v-else class="text-muted-foreground text-sm">No hay restricciones deseables (relajables) configuradas.</p>

        <div class="flex flex-wrap gap-2">
          <Button :disabled="!puedeEjecutar" @click="ejecutar">
            <LoaderCircleIcon v-if="ejecutando" class="animate-spin" />
            <PlayIcon v-else />
            Ejecutar asignación
          </Button>
          <Button v-if="resultado" variant="outline" @click="emit('ir-revisar')">Ir a revisar</Button>
        </div>
      </CardContent>
    </Card>

    <ResultadoEjecucionPanel v-if="resultado" :resultado="resultado" :ejecutando="ejecutando" />
  </div>
</template>
