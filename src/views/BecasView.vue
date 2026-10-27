<script setup lang="ts">
import type { Component } from 'vue'
import {
  AwardIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CircleDollarSignIcon,
  DumbbellIcon,
  FlaskConicalIcon,
  HeartHandshakeIcon,
  UsersIcon,
} from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { becas } from '@/data/mock'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Beca } from '@/types'

const iconos: Record<string, Component> = {
  Excelencia: AwardIcon,
  'Ayuda económica': HeartHandshakeIcon,
  Investigación: FlaskConicalIcon,
  Deporte: DumbbellIcon,
}

const acentos: Record<string, string> = {
  Excelencia: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'Ayuda económica': 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  Investigación: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  Deporte: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

function porcentaje(beca: Beca) {
  return Math.min(100, Math.round((beca.solicitantes / beca.cupos) * 100))
}

function solicitar(beca: Beca) {
  toast.info('El formulario de solicitud estará disponible próximamente', {
    description: `Beca ${beca.nombre}`,
  })
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Becas</h1>
      <p class="text-muted-foreground text-sm">
        Explora los programas disponibles y sus requisitos de solicitud.
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card v-for="beca in becas" :key="beca.id" class="flex flex-col">
        <CardHeader>
          <div class="flex items-start justify-between gap-3">
            <div
              :class="[
                'flex size-10 items-center justify-center rounded-lg',
                acentos[beca.categoria] ?? 'bg-muted text-muted-foreground',
              ]"
            >
              <component :is="iconos[beca.categoria] ?? AwardIcon" class="size-5" />
            </div>
            <Badge variant="secondary">{{ beca.categoria }}</Badge>
          </div>
          <CardTitle class="line-clamp-2 min-h-14 pt-2 text-lg">{{ beca.nombre }}</CardTitle>
          <CardDescription>{{ beca.descripcion }}</CardDescription>
        </CardHeader>

        <CardContent class="flex flex-1 flex-col gap-5">
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-0.5">
              <p class="text-muted-foreground flex items-center gap-1 text-xs">
                <CircleDollarSignIcon class="size-3" />
                Monto mensual
              </p>
              <p class="text-sm font-medium">{{ formatCurrency(beca.monto) }}</p>
            </div>
            <div class="space-y-0.5">
              <p class="text-muted-foreground flex items-center gap-1 text-xs">
                <CalendarIcon class="size-3" />
                Cierre
              </p>
              <p class="text-sm font-medium">{{ formatDate(beca.fechaCierre) }}</p>
            </div>
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs">
              <span class="text-muted-foreground flex items-center gap-1">
                <UsersIcon class="size-3" />
                Cupos solicitados
              </span>
              <span class="font-medium tabular-nums">
                {{ beca.solicitantes }}/{{ beca.cupos }}
              </span>
            </div>
            <Progress :model-value="porcentaje(beca)" />
          </div>

          <ul class="text-muted-foreground space-y-1 text-xs">
            <li
              v-for="requisito in beca.requisitos"
              :key="requisito"
              class="flex items-start gap-1.5"
            >
              <CheckCircle2Icon class="mt-0.5 size-3 shrink-0 text-emerald-500" />
              <span>{{ requisito }}</span>
            </li>
          </ul>
        </CardContent>

        <CardFooter>
          <Button class="w-full" @click="solicitar(beca)">Solicitar beca</Button>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>
