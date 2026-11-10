<script setup lang="ts">
import type { Estudiante } from '@/types/estudiante'
import { computed, onMounted, ref } from 'vue'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { obtenerEstudiante } from '@/services/estudiantes'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@/lib/format'

const auth = useAuthStore()
const estudianteId = computed(() => auth.user?.estudianteId ?? null)

const detalle = ref<Estudiante | null>(null)
const cargando = ref(false)
const error = ref('')

const year = ref(new Date().getFullYear())
const month = ref(new Date().getMonth())

const mesEtiquetas = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const diasSemana = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

const tipoClases: Record<string, string> = {
  guardia: 'bg-amber-100 text-amber-700 border-amber-200',
  limpieza_areas_verdes: 'bg-green-100 text-green-700 border-green-200',
  limpieza_escaleras: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  limpieza_cuarto: 'bg-teal-100 text-teal-700 border-teal-200',
}

const estadoClases: Record<string, string> = {
  pendiente: 'border-blue-200 text-blue-700 bg-blue-50',
  cumplido: 'border-green-200 text-green-700 bg-green-50',
  incumplido: 'border-red-200 text-red-700 bg-red-50',
}

async function cargarEstudiante() {
  const id = estudianteId.value
  if (id == null) {
    detalle.value = null
    error.value = 'Su cuenta no está asociada a un estudiante.'
    return
  }

  cargando.value = true
  error.value = ''
  try {
    detalle.value = await obtenerEstudiante(id)
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : 'No se pudo cargar la información del estudiante.'
  } finally {
    cargando.value = false
  }
}

const mesInicio = computed(() => new Date(year.value, month.value, 1))
const mesFin = computed(() => new Date(year.value, month.value + 1, 0))

const diasDelMes = computed(() => {
  const inicio = mesInicio.value
  const fin = mesFin.value
  const primerDiaSemana = (inicio.getDay() + 6) % 7
  const totalDias = fin.getDate()
  const dias: Array<{ fecha: string; numero: number; esDelMes: boolean }> = []

  for (let i = 0; i < primerDiaSemana; i += 1) {
    const fecha = new Date(inicio)
    fecha.setDate(fecha.getDate() - (primerDiaSemana - i))
    dias.push({ fecha: fecha.toISOString().slice(0, 10), numero: fecha.getDate(), esDelMes: false })
  }

  for (let i = 1; i <= totalDias; i += 1) {
    const fecha = new Date(inicio)
    fecha.setDate(i)
    dias.push({ fecha: fecha.toISOString().slice(0, 10), numero: i, esDelMes: true })
  }

  const resto = 7 - (dias.length % 7)
  for (let i = 0; i < (resto === 7 ? 0 : resto); i += 1) {
    const fecha = new Date(fin)
    fecha.setDate(fecha.getDate() + (i + 1))
    dias.push({ fecha: fecha.toISOString().slice(0, 10), numero: fecha.getDate(), esDelMes: false })
  }

  return dias
})

const agruparSemanas = computed(() => {
  const semanas: Array<typeof diasDelMes.value[number][]> = []
  for (let i = 0; i < diasDelMes.value.length; i += 7) {
    semanas.push(diasDelMes.value.slice(i, i + 7))
  }
  return semanas
})

const deberesPorFecha = computed(() => {
  const grupo: Record<string, typeof detalle.value['deberes']> = {}
  detalle.value?.deberes.forEach((deber) => {
    if (!grupo[deber.fecha]) grupo[deber.fecha] = []
    grupo[deber.fecha].push(deber)
  })
  return grupo
})

const resumen = computed(() => {
  const deberes = detalle.value?.deberes ?? []
  return {
    total: deberes.length,
    pendientes: deberes.filter((d) => d.estado === 'pendiente').length,
    cumplidos: deberes.filter((d) => d.estado === 'cumplido').length,
    incumplidos: deberes.filter((d) => d.estado === 'incumplido').length,
  }
})

function mesAnterior() {
  month.value -= 1
  if (month.value < 0) {
    month.value = 11
    year.value -= 1
  }
}

function mesSiguiente() {
  month.value += 1
  if (month.value > 11) {
    month.value = 0
    year.value += 1
  }
}

function tipoClase(tipo: string) {
  return tipoClases[tipo] || 'bg-muted text-muted-foreground border-border'
}

function estadoClase(estado: string) {
  return estadoClases[estado] || 'bg-muted text-muted-foreground border-border'
}

onMounted(cargarEstudiante)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1">
        <h1 class="text-2xl font-bold tracking-tight">Mis deberes</h1>
        <p class="text-muted-foreground text-sm">
          Calendario mensual de responsabilidades asignadas.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" @click="mesAnterior">
          <ChevronLeftIcon class="size-4" />
        </Button>
        <h2 class="text-base font-semibold">
          {{ mesEtiquetas[month.value] }} {{ year.value }}
        </h2>
        <Button variant="outline" size="sm" @click="mesSiguiente">
          <ChevronRightIcon class="size-4" />
        </Button>
      </div>
    </div>

    <Alert v-if="error" variant="destructive">
      <AlertTitle>No se pudieron cargar los deberes</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <Card v-if="!cargando && !detalle && !error">
      <CardHeader>
        <CardTitle>Sin datos del estudiante</CardTitle>
        <CardDescription>No se encontró información del estudiante.</CardDescription>
      </CardHeader>
      <CardContent class="pt-4">
        <div class="text-center text-muted-foreground text-sm py-8">
          Actualmente no hay datos disponibles.
        </div>
      </CardContent>
    </Card>

    <Card v-if="detalle && !cargando">
      <CardHeader>
        <CardTitle>{{ detalle.nombre }}</CardTitle>
        <CardDescription>Resumen de deberes del mes</CardDescription>
      </CardHeader>
      <CardContent class="pt-2">
        <div class="grid gap-2 sm:grid-cols-4">
          <div class="rounded-lg border p-3 bg-muted/50">
            <p class="text-xs text-muted-foreground uppercase tracking-wider text-[10px]">
              Total
            </p>
            <p class="text-lg font-semibold">{{ resumen.total }}</p>
          </div>
          <div class="rounded-lg border p-3 bg-blue-50 border-blue-100 text-blue-900">
            <p class="text-xs text-blue-700 uppercase tracking-wider text-[10px]">
              Pendientes
            </p>
            <p class="text-lg font-semibold">{{ resumen.pendientes }}</p>
          </div>
          <div class="rounded-lg border p-3 bg-green-50 border-green-100 text-green-900">
            <p class="text-xs text-green-700 uppercase tracking-wider text-[10px]">
              Cumplidos
            </p>
            <p class="text-lg font-semibold">{{ resumen.cumplidos }}</p>
          </div>
          <div class="rounded-lg border p-3 bg-red-50 border-red-100 text-red-900">
            <p class="text-xs text-red-700 uppercase tracking-wider text-[10px]">
              Incumplidos
            </p>
            <p class="text-lg font-semibold">{{ resumen.incumplidos }}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card v-if="detalle && !cargando">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <CalendarIcon class="size-4" />
          {{ mesEtiquetas[month.value] }} {{ year.value }}
        </CardTitle>
      </CardHeader>
      <CardContent class="pt-0">
        <div class="overflow-x-auto">
          <table class="w-full text-center border-collapse">
            <thead>
              <tr>
                <th
                  v-for="dia in diasSemana"
                  :key="dia"
                  class="text-xs text-muted-foreground uppercase tracking-wider border-b border-border pb-2"
                >
                  {{ dia }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="semana in agruparSemanas"
                :key="semana[0].fecha"
                class="border-b border-border"
              >
                <td
                  v-for="dia in semana"
                  :key="dia.fecha"
                  class="relative border-r border-border p-3 h-24 vertical-middle"
                >
                  <div v-if="dia.esDelMes" class="flex flex-col items-center justify-center gap-1">
                    <span class="text-sm font-medium">{{ dia.numero }}</span>
                    <div class="flex flex-wrap justify-center gap-1 mt-1">
                      <Badge
                        v-for="deber in deberesPorFecha[dia.fecha] || []"
                        :key="deber.id"
                        class="text-[10px] leading-none px-1.5 py-0.5 block"
                        :class="tipoClase(deber.tipo)"
                        :variant="deber.estado"
                      >
                        {{ deber.tipo }}
                      </Badge>
                    </div>
                  </div>
                  <div v-else class="flex items-center justify-center text-muted-foreground">
                    {{ dia.numero }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="detalle.deberes.length === 0" class="mt-4 text-center text-muted-foreground text-sm py-8">
          No hay deberes registrados.
        </div>

        <div v-else class="mt-4 grid gap-2 sm:grid-cols-3">
          <div
            v-for="deber in detalle.deberes.slice(0, 9)"
            :key="deber.id"
            class="rounded-lg border p-3 text-sm"
          >
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="font-medium">{{ deber.tipo }}</span>
              <Badge
                :variant="
                  deber.estado === 'incumplido'
                    ? 'destructive'
                    : deber.estado === 'cumplido'
                    ? 'secondary'
                    : 'outline'
                "
              >
                {{ deber.estado }}
              </Badge>
            </div>
            <p class="text-xs text-muted-foreground truncate">{{ deber.descripcion }}</p>
            <p class="text-xs text-muted-foreground mt-1">
              {{ formatDate(deber.fecha) }}
              <span v-if="deber.turno"> · {{ deber.turno }}</span>
              <span v-if="deber.cuartoNombre"> · {{ deber.cuartoNombre }}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
