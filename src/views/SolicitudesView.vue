<script setup lang="ts">
import { computed, ref } from 'vue'
import { PlusIcon, SearchIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'
import ApplicationsTable from '@/components/app/ApplicationsTable.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { solicitudes } from '@/data/mock'
import type { EstadoSolicitud } from '@/types'

const busqueda = ref('')
const estadoFiltro = ref<'todas' | EstadoSolicitud>('todas')

const estados: { value: 'todas' | EstadoSolicitud; label: string }[] = [
  { value: 'todas', label: 'Todos los estados' },
  { value: 'aprobada', label: 'Aprobadas' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'revisando', label: 'En revisión' },
  { value: 'rechazada', label: 'Rechazadas' },
]

const solicitudesFiltradas = computed(() => {
  const termino = busqueda.value.trim().toLowerCase()

  return solicitudes.filter((solicitud) => {
    const coincideTexto =
      !termino ||
      [solicitud.estudiante, solicitud.carrera, solicitud.beca, solicitud.email].some((valor) =>
        valor.toLowerCase().includes(termino),
      )

    const coincideEstado = estadoFiltro.value === 'todas' || solicitud.estado === estadoFiltro.value

    return coincideTexto && coincideEstado
  })
})

function nuevaSolicitud() {
  toast.info('El formulario de solicitud estará disponible próximamente')
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Solicitudes</h1>
        <p class="text-muted-foreground text-sm">
          Consulta y filtra las solicitudes de becas registradas.
        </p>
      </div>
      <Button @click="nuevaSolicitud">
        <PlusIcon />
        Nueva solicitud
      </Button>
    </div>

    <Card>
      <CardHeader>
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="space-y-1">
            <CardTitle>Listado de solicitudes</CardTitle>
            <CardDescription>
              {{ solicitudesFiltradas.length }} de {{ solicitudes.length }} solicitudes visibles.
            </CardDescription>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row">
            <div class="relative">
              <SearchIcon
                class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
              />
              <Input
                v-model="busqueda"
                placeholder="Buscar por estudiante, carrera o beca…"
                class="pl-9 sm:w-72"
              />
            </div>
            <Select v-model="estadoFiltro">
              <SelectTrigger class="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="estado in estados" :key="estado.value" :value="estado.value">
                  {{ estado.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent class="px-0">
        <ApplicationsTable :solicitudes="solicitudesFiltradas" />
      </CardContent>
    </Card>
  </div>
</template>
