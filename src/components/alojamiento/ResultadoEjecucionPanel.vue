<script setup lang="ts">
import type { ResultadoEjecucion } from '@/types/alojamiento'
import { computed, ref } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatNumber } from '@/lib/format'
import { AlertCircleIcon, ClockIcon, LockKeyholeIcon, RefreshCwIcon, SearchIcon, UsersIcon } from '@lucide/vue'
import KpiCard from '@/components/infraestructura/KpiCard.vue'

const props = withDefaults(
  defineProps<{ resultado: ResultadoEjecucion | null; ejecutando?: boolean }>(),
  { ejecutando: false },
)

const busqueda = ref('')
const noAlojadosFiltrados = computed(() => {
  const texto = busqueda.value.toLowerCase()
  if (!texto) return props.resultado?.noAlojados ?? []
  return (props.resultado?.noAlojados ?? []).filter(
    (n) => n.estudiante.toLowerCase().includes(texto) || n.motivo.toLowerCase().includes(texto) || n.detalle.toLowerCase().includes(texto),
  )
})

function varianteEstado(estado: string) {
  const e = estado.toLowerCase()
  if (e.includes('ok') || e.includes('exito') || e.includes('optimal')) return 'default'
  if (e.includes('error') || e.includes('fail') || e.includes('infeasible')) return 'destructive'
  return 'secondary'
}
</script>

<template>
  <div v-if="!resultado" class="flex flex-col items-center gap-2 py-6 text-center">
    <p class="text-muted-foreground text-sm">Sin resultados de ejecución.</p>
  </div>

  <div v-else class="space-y-4">
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <KpiCard label="Alojados" :value="formatNumber(resultado.alojados)" :icon="UsersIcon" tono="emerald" />
      <KpiCard label="No alojados" :value="formatNumber(resultado.noAlojados.length)" :icon="AlertCircleIcon" tono="amber" />
      <KpiCard label="Fijadas" :value="formatNumber(resultado.fijadas)" :icon="LockKeyholeIcon" tono="sky" />
      <KpiCard label="Tiempo" :value="`${resultado.tiempoSegundos.toFixed(1)} s`" :icon="ClockIcon" tono="primary" />
      <KpiCard label="Relajadas" :value="formatNumber(resultado.restriccionesRelajadas.length)" :icon="RefreshCwIcon" tono="primary" />
    </div>

    <div class="flex items-center gap-2">
      <span class="text-xs font-medium text-muted-foreground">Solver:</span>
      <Badge :variant="varianteEstado(resultado.estadoSolver)">{{ resultado.estadoSolver }}</Badge>
    </div>

    <Card v-if="resultado.noAlojados.length || busqueda">
      <CardHeader class="flex flex-row items-center justify-between gap-2">
        <CardTitle>No alojados</CardTitle>
        <div class="relative md:w-64">
          <SearchIcon class="text-muted-foreground pointer-events-none absolute left-2.5 top-2.5 size-4" />
          <Input v-model="busqueda" class="pl-8 w-full" placeholder="Buscar estudiante o motivo..." />
        </div>
      </CardHeader>
      <CardContent>
        <div v-if="!noAlojadosFiltrados.length" class="py-4 text-center text-xs text-muted-foreground">
          {{ busqueda ? `Sin resultados para "${busqueda}".` : 'Todos los candidatos fueron alojados.' }}
        </div>
        <Table v-else>
          <TableHeader><TableRow><TableHead>Estudiante</TableHead><TableHead>Motivo</TableHead><TableHead>Detalle</TableHead><TableHead class="w-28">¿Relajando?</TableHead></TableRow></TableHeader>
          <TableBody>
            <TableRow v-for="n in noAlojadosFiltrados" :key="n.estudianteId" :class="n.seResolveriaRelajando ? 'bg-amber-50' : ''">
              <TableCell class="font-medium">{{ n.estudiante }}</TableCell>
              <TableCell class="text-sm">{{ n.motivo }}</TableCell>
              <TableCell class="text-sm text-muted-foreground">{{ n.detalle }}</TableCell>
              <TableCell class="text-center"><Badge :variant="n.seResolveriaRelajando ? 'outline' : 'secondary'" class="text-xs">{{ n.seResolveriaRelajando ? 'Sí' : 'No' }}</Badge></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Card v-if="resultado.omitidos.length">
      <CardHeader><CardTitle>Omitidos</CardTitle><CardDescription>Estudiantes que no entraron en la asignación.</CardDescription></CardHeader>
      <CardContent class="space-y-2">
        <div v-for="o in resultado.omitidos" :key="o.estudianteId" class="flex flex-wrap items-center justify-between gap-2 rounded border bg-muted/50 p-2 text-sm">
          <span class="font-medium">{{ o.estudiante }}</span>
          <span class="text-muted-foreground">{{ o.motivo }}</span>
          <span class="text-xs text-muted-foreground">{{ o.detalle }}</span>
        </div>
      </CardContent>
    </Card>

    <Card v-if="resultado.metricas.length">
      <CardHeader><CardTitle>Métricas de preferencia</CardTitle></CardHeader>
      <CardContent class="grid gap-2 sm:grid-cols-3">
        <div v-for="m in resultado.metricas" :key="m.preferencia" class="rounded border bg-muted/50 p-2 text-sm">
          <div class="text-xs text-muted-foreground">{{ m.preferencia }}</div>
          <div class="font-semibold">{{ m.valor }}</div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
