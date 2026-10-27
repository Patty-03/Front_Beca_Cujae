<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowRightIcon,
  AwardIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  ClockIcon,
  PlusIcon,
  TrendingUpIcon,
} from '@lucide/vue'
import ApplicationsTable from '@/components/app/ApplicationsTable.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { becas, solicitudes } from '@/data/mock'
import { formatCurrency } from '@/lib/format'

const aprobadas = solicitudes.filter((solicitud) => solicitud.estado === 'aprobada').length
const pendientes = solicitudes.filter(
  (solicitud) => solicitud.estado === 'pendiente' || solicitud.estado === 'revisando',
).length

const stats = [
  {
    label: 'Becas activas',
    value: becas.length,
    description: 'Programas disponibles este curso',
    icon: AwardIcon,
    accent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    label: 'Solicitudes',
    value: solicitudes.length,
    description: 'Registradas en el período actual',
    icon: ClipboardListIcon,
    accent: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    label: 'Aprobadas',
    value: aprobadas,
    description: 'Estudiantes beneficiados',
    icon: CheckCircle2Icon,
    accent: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  },
  {
    label: 'En proceso',
    value: pendientes,
    description: 'Pendientes de revisión',
    icon: ClockIcon,
    accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
]

const recentSolicitudes = computed(() =>
  [...solicitudes].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 5),
)

const becasDestacadas = computed(() => becas.slice(0, 4))

function porcentaje(solicitantes: number, cupos: number) {
  return Math.min(100, Math.round((solicitantes / cupos) * 100))
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p class="text-muted-foreground text-sm">
          Resumen de la actividad de becas de la universidad.
        </p>
      </div>
      <Button as-child>
        <RouterLink to="/solicitudes">
          <PlusIcon />
          Nueva solicitud
        </RouterLink>
      </Button>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card v-for="stat in stats" :key="stat.label">
        <CardHeader class="flex flex-row items-start justify-between gap-2 space-y-0">
          <div class="space-y-1">
            <CardDescription>{{ stat.label }}</CardDescription>
            <CardTitle class="text-3xl font-semibold tabular-nums">{{ stat.value }}</CardTitle>
          </div>
          <div :class="['flex size-9 items-center justify-center rounded-lg', stat.accent]">
            <component :is="stat.icon" class="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground flex items-center gap-1 text-xs">
            <TrendingUpIcon class="size-3" />
            {{ stat.description }}
          </p>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <Card class="overflow-hidden lg:col-span-2">
        <CardHeader class="flex flex-row items-start justify-between gap-4">
          <div class="space-y-1">
            <CardTitle>Solicitudes recientes</CardTitle>
            <CardDescription>Últimos movimientos registrados en el sistema.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" as-child>
            <RouterLink to="/solicitudes">
              Ver todas
              <ArrowRightIcon />
            </RouterLink>
          </Button>
        </CardHeader>
        <CardContent class="px-0">
          <ApplicationsTable :solicitudes="recentSolicitudes" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Becas destacadas</CardTitle>
          <CardDescription>Ocupación de cupos por programa.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div v-for="beca in becasDestacadas" :key="beca.id" class="space-y-2">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate text-sm font-medium">{{ beca.nombre }}</p>
                <p class="text-muted-foreground text-xs">
                  {{ beca.solicitantes }} de {{ beca.cupos }} cupos
                </p>
              </div>
              <span class="shrink-0 text-sm font-medium tabular-nums">
                {{ formatCurrency(beca.monto) }}
              </span>
            </div>
            <Progress :model-value="porcentaje(beca.solicitantes, beca.cupos)" />
          </div>
          <Separator />
          <Button variant="outline" class="w-full" as-child>
            <RouterLink to="/becas">
              Explorar becas
              <ArrowRightIcon />
            </RouterLink>
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
