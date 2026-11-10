<script setup lang="ts">
import type { Estudiante } from '@/types/estudiante'
import type { Aviso } from '@/types/estudiante-view'
import { computed, onMounted, ref } from 'vue'
import { HomeIcon, UserIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { formatDate } from '@/lib/format'
import { ETIQUETAS_SEXO } from '@/lib/estudiantes'
import { obtenerEstudiante } from '@/services/estudiantes'
import { obtenerAvisos } from '@/services/estudiante-view'
import { useAuthStore } from '@/stores/auth'
import AvisosHero from '@/components/estudiante-view/AvisosHero.vue'

const auth = useAuthStore()
const estudianteId = computed(() => auth.user?.estudianteId ?? null)

const detalle = ref<Estudiante | null>(null)
const cargando = ref(false)
const error = ref('')

const avisos = ref<Aviso[]>([])
const avisosCargando = ref(false)

const varianteEstadoBeca = (estado: Estudiante['estadoBeca']) => {
  if (estado === 'baja') return 'destructive'
  if (estado === 'condicional') return 'outline'
  return 'secondary'
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

async function cargarAvisos() {
  avisosCargando.value = true
  try {
    avisos.value = await obtenerAvisos()
  } catch {
    avisos.value = []
  } finally {
    avisosCargando.value = false
  }
}

onMounted(async () => {
  await cargarEstudiante()
  await cargarAvisos()
})
</script>

<template>
  <div class="space-y-6">
    <AvisosHero :avisos="avisos" />

    <header class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1">
        <h1 class="text-2xl font-bold tracking-tight">Mi Perfil</h1>
        <p class="text-muted-foreground text-sm">
          Bienvenido a su panel personal de la residencia CUJA{' '}
          <span class="font-semibold text-primary">{{ detalle?.nombre ?? '' }}</span>
        </p>
      </div>
    </header>

    <Alert v-if="error" variant="destructive">
      <AlertTitle>No se pudo cargar la información</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- Banner de bienvenida -->
    <article class="rounded-2xl bg-blue-50 border border-blue-100 p-6">
      <div class="flex items-center justify-between">
        <div>
          <span class="text-blue-600 text-xs font-semibold tracking-wider uppercase"
            >CUJA · Residencia</span
          >
          <h2 class="text-2xl font-bold text-blue-900 mt-1">
            Hola, {{ detalle?.nombre ?? 'Estudiante' }}
          </h2>
          <p class="text-blue-600 text-sm mt-2">
            Bienvenido al panel general de la residencia estudiantil.
          </p>
        </div>
        <div class="hidden lg:flex items-end gap-4">
          <div class="text-right">
            <p class="text-sm text-blue-700 font-medium">
              {{ detalle?.carnet ?? 'Sin datos' }}
            </p>
            <p class="text-xs text-blue-600 uppercase">
              {{ detalle?.carrera ?? 'Sin datos' }}
            </p>
          </div>
          <div class="flex items-center gap-2 p-2 rounded-lg bg-blue-100">
            <UserIcon class="size-4 text-blue-600" />
            <span class="text-xs text-blue-700 font-medium">
              {{ detalle?.anioAcademico ?? '--' }}.º año
            </span>
          </div>
        </div>
      </div>
    </article>

    <!-- Sección inferior: datos personales y cuarto -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Mis datos -->
      <article v-if="detalle" class="rounded-xl border bg-card p-5 lg:col-span-2">
        <CardHeader>
          <CardTitle>Mis datos</CardTitle>
          <CardDescription>
            Información personal y académica del becado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-4 pt-2">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="flex items-start gap-3">
                <div class="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-full">
                  <UserIcon class="size-6" />
                </div>
                <div>
                  <h2 class="text-lg font-semibold">{{ detalle.nombre }}</h2>
                  <p class="text-muted-foreground text-sm">
                    {{ detalle.carnet }} ·
                    {{ ETIQUETAS_SEXO[detalle.sexo] }} ·
                    {{ detalle.anioAcademico }}.º año
                  </p>
                  <p class="text-muted-foreground text-sm">
                    {{ detalle.carrera }} · {{ detalle.especialidad }}
                  </p>
                </div>
              </div>
              <Badge :variant="varianteEstadoBeca(detalle.estadoBeca)">
                {{ detalle.estadoBeca }}
              </Badge>
            </div>
            <Separator />
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="space-y-2">
                <p class="text-muted-foreground text-xs uppercase tracking-wider text-[10px]">
                  Facultad
                </p>
                <p>{{ detalle.facultad }}</p>
              </div>
              <div class="space-y-2">
                <p class="text-muted-foreground text-xs uppercase tracking-wider text-[10px]">
                  Grupo
                </p>
                <p>{{ detalle.grupo || 'No registrado' }}</p>
              </div>
              <div class="space-y-2">
                <p class="text-muted-foreground text-xs uppercase tracking-wider text-[10px]">
                  Tipo de ingreso
                </p>
                <p>{{ detalle.tipoIngreso }}</p>
              </div>
              <div class="space-y-2">
                <p class="text-muted-foreground text-xs uppercase tracking-wider text-[10px]">
                  Teléfono
                </p>
                <p>{{ detalle.telefono }}</p>
              </div>
              <div class="space-y-2">
                <p class="text-muted-foreground text-xs uppercase tracking-wider text-[10px]">
                  Provincia / municipio
                </p>
                <p>{{ detalle.provincia }} · {{ detalle.municipio }}</p>
              </div>
              <div class="space-y-2">
                <p class="text-muted-foreground text-xs uppercase tracking-wider text-[10px]">
                  Fecha de ingreso
                </p>
                <p>{{ formatDate(detalle.fechaIngreso) }}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </article>
      <article v-else class="rounded-xl border bg-card p-5 lg:col-span-2">
        <CardHeader>
          <CardTitle>Mis datos</CardTitle>
          <CardDescription>
            Información personal y académica del becado.
          </CardDescription>
        </CardHeader>
        <CardContent class="pt-4">
          <div class="text-center text-muted-foreground text-sm py-8">
            Actualmente no hay datos personales disponibles.
          </div>
        </CardContent>
      </article>

      <!-- Mi cuarto detalle -->
      <article v-if="detalle" class="rounded-xl border bg-card p-5">
        <CardHeader>
          <CardTitle>Mi cuarto (detalle)</CardTitle>
          <CardDescription>
            Detalle completo de su asignación de alojamiento.
          </CardDescription>
        </CardHeader>
        <CardContent class="pt-2">
          <div
            v-if="detalle.asignacion"
            class="bg-muted/40 grid gap-2 rounded-lg border p-4 text-sm"
          >
            <p class="flex items-center gap-2 font-medium">
              <HomeIcon class="size-4" />
              {{ detalle.asignacion.cuartoNombre }} ·
              {{ detalle.asignacion.edificioNombre }}
            </p>
            <p class="text-muted-foreground text-xs">
              {{ detalle.asignacion.escaleraNombre }} · desde
              {{ formatDate(detalle!.asignacion.desde) }}
            </p>
            <div class="flex flex-wrap gap-2 mt-2">
              <Badge v-if="detalle.asignacion.taquilla" variant="outline">
                Taquilla {{ detalle.asignacion.taquilla }}
              </Badge>
              <Badge
                :variant="detalle.asignacion.llaveEntregada ? 'secondary' : 'outline'"
              >
                {{
                  detalle.asignacion.llaveEntregada
                    ? 'Llave entregada'
                    : 'Llave pendiente'
                }}
              </Badge>
              <Badge
                :variant="
                  detalle.asignacion.llaveTaquillaEntregada
                    ? 'secondary'
                    : 'outline'
                "
              >
                {{
                  detalle.asignacion.llaveTaquillaEntregada
                    ? 'Taquilla entregada'
                    : 'Taquilla pendiente'
                }}
              </Badge>
            </div>
          </div>
          <Alert v-else>
            <HomeIcon />
            <AlertTitle>Sin cuarto asignado</AlertTitle>
            <AlertDescription>
              Aún no tiene una asignación de cuarto activa. Contacte a la
              administración de la residencia.
            </AlertDescription>
          </Alert>
        </CardContent>
      </article>
      <article v-else class="rounded-xl border bg-card p-5">
        <CardHeader>
          <CardTitle>Mi cuarto (detalle)</CardTitle>
          <CardDescription>
            Detalle completo de su asignación de alojamiento.
          </CardDescription>
        </CardHeader>
        <CardContent class="pt-4">
          <div class="text-center text-muted-foreground text-sm py-8">
            Actualmente no hay datos de cuarto disponibles.
          </div>
        </CardContent>
      </article>
    </div>
  </div>
</template>
