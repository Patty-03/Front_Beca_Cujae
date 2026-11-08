<script setup lang="ts">
import type { Estudiante } from '@/types/estudiante'
import type {
  Aviso,
  Documento,
  Notificacion,
  PreguntaFrecuente,
} from '@/types/estudiante-view'
import { computed, onMounted, ref } from 'vue'
import {
  BellIcon,
  CalendarIcon,
  DownloadIcon,
  FileTextIcon,
  HomeIcon,
  UserIcon,
} from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import { ETIQUETAS_SEXO } from '@/lib/estudiantes'
import { obtenerEstudiante } from '@/services/estudiantes'
import {
  obtenerAvisos,
  descargarDocumento,
  marcarNotificacionLeida,
  obtenerNotificaciones,
  obtenerDocumentos,
  obtenerPreguntasFrecuentes,
} from '@/services/estudiante-view'
import { useAuthStore } from '@/stores/auth'
import FirmarDocumentoDialog from '@/components/estudiante-view/FirmarDocumentoDialog.vue'
import { ETIQUETAS_TIPO_DOCUMENTO } from '@/types/estudiante-view'

const auth = useAuthStore()
const estudianteId = computed(() => {
  if (!auth.user?.id) return null
  if (auth.isDemo) return 1
  return Number(auth.user.id)
})

const detalle = ref<Estudiante | null>(null)
const cargando = ref(false)
const error = ref('')

const firmarAbierto = ref(false)
const documentoFirmando = ref<Documento | null>(null)
const notificacionSeleccionada = ref<Notificacion | null>(null)

const avisos = ref<Aviso[]>([])
const notificaciones = ref<Notificacion[]>([])
const documentos = ref<Documento[]>([])
const preguntasFrecuentes = ref<PreguntaFrecuente[]>([])
const avisosCargando = ref(false)
const notificacionesCargando = ref(false)
const documentosCargando = ref(false)
const preguntasCargando = ref(false)

const notificacionesNoLeidas = computed(() =>
  notificaciones.value.filter((n) => !n.leida).length,
)

const debeFirmar = computed(() =>
  documentos.value.filter((d) => !d.firmado).length,
)

const totalDeberesPendientes = computed(() =>
  detalle.value?.deberes.filter((d) => d.estado === 'pendiente').length ?? 0,
)

async function cargarEstudiante() {
  if (!estudianteId.value) return
  cargando.value = true
  error.value = ''
  try {
    detalle.value = await obtenerEstudiante(estudianteId.value)
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

async function cargarNotificaciones() {
  notificacionesCargando.value = true
  try {
    notificaciones.value = await obtenerNotificaciones()
  } catch {
    notificaciones.value = []
  } finally {
    notificacionesCargando.value = false
  }
}

async function cargarDocumentos() {
  documentosCargando.value = true
  try {
    documentos.value = await obtenerDocumentos()
  } catch {
    documentos.value = []
  } finally {
    documentosCargando.value = false
  }
}

async function cargarPreguntasFrecuentes() {
  preguntasCargando.value = true
  try {
    preguntasFrecuentes.value = await obtenerPreguntasFrecuentes()
  } catch {
    preguntasFrecuentes.value = []
  } finally {
    preguntasCargando.value = false
  }
}

function varianteEstadoBeca(estado: Estudiante['estadoBeca']) {
  if (estado === 'baja') return 'destructive'
  if (estado === 'condicional') return 'outline'
  return 'secondary'
}

function varianteEstadoDeber(estado: string) {
  if (estado === 'incumplido') return 'destructive'
  if (estado === 'cumplido') return 'secondary'
  return 'outline'
}

async function firmarDoc(documento: Documento) {
  documentoFirmando.value = documento
  firmarAbierto.value = true
}

async function descargarDoc(documento: Documento) {
  try {
    await descargarDocumento(documento.id)
    toast.success('Descarga iniciada', {
      description: documento.nombre,
    })
  } catch (caught) {
    toast.error('No se pudo descargar el documento', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  }
}

function alFirmarDocumento() {
  firmarAbierto.value = false
  documentoFirmando.value = null
  void cargarDocumentos()
}

async function marcarLeida(notificacion: Notificacion) {
  if (notificacion.leida) return
  await marcarNotificacionLeida(notificacion.id)
  const idx = notificaciones.value.findIndex((n) => n.id === notificacion.id)
  if (idx !== -1) {
    notificaciones.value[idx] = { ...notificacion, leida: true }
  }
}

function abrirNotificacion(notificacion: Notificacion) {
  notificacionSeleccionada.value = notificacion
  void marcarLeida(notificacion)
}

onMounted(async () => {
  await cargarEstudiante()
  await cargarAvisos()
  await cargarNotificaciones()
  await cargarDocumentos()
  await cargarPreguntasFrecuentes()
})
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1">
        <h1 class="text-2xl font-bold tracking-tight">Mi Perfil</h1>
        <p class="text-muted-foreground text-sm">
          Bienvenido a su panel personal de la residencia CUJA{' '}
          <span class="font-semibold text-primary">{{ detalle?.nombre ?? '' }}</span>
        </p>
      </div>

      <div class="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              class="relative p-2"
              :aria-label="`Notificaciones (${notificacionesNoLeidas})`"
            >
              <BellIcon class="size-5" />
              <span v-if="notificacionesNoLeidas > 0" class="absolute top-1 right-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-white font-bold ring-1 ring-background">
                {{ notificacionesNoLeidas }}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuGroup>
              <template #label>Notificaciones recientes</template>
              <DropdownMenuItem
                v-if="notificacionesCargando"
                disabled
                class="cursor-default"
              >
                Cargando...
              </DropdownMenuItem>
              <DropdownMenuItem
                v-else-if="notificaciones.length === 0"
                disabled
                class="cursor-default text-muted-foreground"
              >
                Sin notificaciones.
              </DropdownMenuItem>
              <DropdownMenuItem
                v-for="notificacion in notificaciones.slice(0, 5)"
                :key="notificacion.id"
                class="cursor-pointer"
                @click="abrirNotificacion(notificacion)"
              >
                <div class="flex items-center justify-between gap-2">
                  <span class="truncate">{{ notificacion.titulo }}</span>
                  <Badge
                    v-if="!notificacion.leida"
                    variant="outline"
                    class="text-[10px] leading-none px-1.5 py-0.5"
                  >
                    Nuevo
                  </Badge>
                </div>
                <p class="text-xs text-muted-foreground truncate">
                  {{ notificacion.mensaje }}
                </p>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>

    <Alert v-if="error" variant="destructive">
      <AlertTitle>No se pudo cargar la información</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <section class="grid gap-6">
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
              Bienvenido al panel general de la residencia estudiantil. Selecciona un módulo para
              comenzar a trabajar.
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

      <!-- Accesos rápidos -->
      <div>
        <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Accesos rápidos
        </h3>
        <div class="grid gap-4 lg:grid-cols-4">
          <!-- Cuarto -->
          <article class="rounded-xl border bg-card p-5 hover:shadow-sm transition-shadow">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg"
                >
                  <HomeIcon class="size-5" />
                </div>
                <div>
                  <h4 class="font-semibold text-sm">Cuarto</h4>
                  <p class="text-muted-foreground text-xs">
                    Su asignación de alojamiento
                  </p>
                </div>
              </div>
              <Badge
                v-if="detalle?.asignacion"
                variant="secondary"
                class="text-xs"
              >
                Asignado
              </Badge>
              <Badge v-else variant="outline" class="text-xs">
                Sin cuarto
              </Badge>
            </div>
            <div class="mt-4">
              <Button variant="outline" size="sm" class="w-full" @click="abrirNotificacion">
                Ver módulo
              </Button>
            </div>
          </article>

          <!-- Avisos -->
          <article class="rounded-xl border bg-card p-5 hover:shadow-sm transition-shadow">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="bg-amber/10 text-amber-700 flex size-10 shrink-0 items-center justify-center rounded-lg"
                >
                  <BellIcon class="size-5" />
                </div>
                <div>
                  <h4 class="font-semibold text-sm">Avisos</h4>
                  <p class="text-muted-foreground text-xs">
                    Comunicados de la residencia
                  </p>
                </div>
              </div>
              <Badge
                v-if="avisos.length > 0"
                variant="outline"
                class="text-xs"
              >
                {{ avisos.length }}
              </Badge>
            </div>
            <div class="mt-4">
              <Button variant="outline" size="sm" class="w-full">
                Ver módulo
              </Button>
            </div>
          </article>

          <!-- Evaluación -->
          <article class="rounded-xl border bg-card p-5 hover:shadow-sm transition-shadow">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="bg-emerald/10 text-emerald-700 flex size-10 shrink-0 items-center justify-center rounded-lg"
                >
                  <CalendarIcon class="size-5" />
                </div>
                <div>
                  <h4 class="font-semibold text-sm">Evaluación</h4>
                  <p class="text-muted-foreground text-xs">
                    Estado de su beca y deberes
                  </p>
                </div>
              </div>
              <Badge :variant="varianteEstadoBeca(detalle?.estadoBeca ?? 'activo')" class="text-xs">
                {{ detalle?.estadoBeca ?? 'Sin datos' }}
              </Badge>
            </div>
            <div class="mt-4">
              <Button variant="outline" size="sm" class="w-full">
                Ver módulo
              </Button>
            </div>
          </article>

          <!-- Documentos -->
          <article class="rounded-xl border bg-card p-5 hover:shadow-sm transition-shadow">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="bg-blue/10 text-blue-700 flex size-10 shrink-0 items-center justify-center rounded-lg"
                >
                  <FileTextIcon class="size-5" />
                </div>
                <div>
                  <h4 class="font-semibold text-sm">Documentos</h4>
                  <p class="text-muted-foreground text-xs">
                    Firme y descargue sus documentos
                  </p>
                </div>
              </div>
              <Badge v-if="debeFirmar > 0" variant="outline" class="text-xs">
                {{ debeFirmar }} pendiente(s)
              </Badge>
            </div>
            <div class="mt-4">
              <Button variant="outline" size="sm" class="w-full">
                Ver módulo
              </Button>
            </div>
          </article>
        </div>
      </div>

      <!-- Sección inferior: 3 columnas -->
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

        <!-- Mis deberes -->
        <article v-if="detalle" class="rounded-xl border bg-card p-5 lg:col-span-2">
          <CardHeader class="flex items-center justify-between">
            <div>
              <CardTitle>Mis deberes</CardTitle>
              <CardDescription>
                Responsabilidades asignadas y su estado de cumplimiento.
              </CardDescription>
            </div>
            <Badge :variant="totalDeberesPendientes > 0 ? 'outline' : 'secondary'">
              {{ totalDeberesPendientes }} pendiente(s)
            </Badge>
          </CardHeader>
          <CardContent class="pt-2">
            <div v-if="detalle.deberes.length === 0" class="text-muted-foreground text-sm">
              No tiene deberes registrados.
            </div>
            <div v-else class="grid gap-2">
              <div
                v-for="deber in detalle.deberes"
                :key="deber.id"
                class="flex flex-col gap-2 rounded-lg border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p class="font-medium">{{ deber.tipo }}</p>
                  <p class="text-muted-foreground text-xs">{{ deber.descripcion }}</p>
                  <p class="text-muted-foreground text-xs">
                    {{ formatDate(deber.fecha) }}
                    <span v-if="deber.turno"> · {{ deber.turno }}</span>
                    <span v-if="deber.cuartoNombre"> · {{ deber.cuartoNombre }}</span>
                  </p>
                </div>
                <Badge :variant="varianteEstadoDeber(deber.estado)">
                  {{ deber.estado }}
                </Badge>
              </div>
            </div>
          </CardContent>
        </article>
        <article v-else class="rounded-xl border bg-card p-5 lg:col-span-2">
          <CardHeader>
            <CardTitle>Mis deberes</CardTitle>
            <CardDescription>
              Responsabilidades asignadas y su estado de cumplimiento.
            </CardDescription>
          </CardHeader>
          <CardContent class="pt-4">
            <div class="text-center text-muted-foreground text-sm py-8">
              Actualmente no hay datos de deberes disponibles.
            </div>
          </CardContent>
        </article>

        <!-- Mis documentos completos -->
        <article v-if="documentos.length > 0" class="rounded-xl border bg-card p-5 lg:col-span-2">
          <CardHeader>
            <CardTitle>Mis documentos</CardTitle>
            <CardDescription>
              Convenio de alojamiento, boleta de la facultad y tarjeta de
              caracterización.
            </CardDescription>
          </CardHeader>
          <CardContent class="pt-2">
            <div class="grid gap-3">
              <div
                v-for="documento in documentos"
                :key="documento.id"
                class="flex flex-col gap-2 rounded-lg border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p class="font-medium">{{ documento.nombre }}</p>
                  <p class="text-muted-foreground text-sm">{{ documento.descripcion }}</p>
                  <p class="text-muted-foreground text-xs">
                    {{ ETIQUETAS_TIPO_DOCUMENTO[documento.tipo] }} ·
                    {{ formatDate(documento.fechaSubida) }}
                    <span v-if="documento.firmado">
                      · Firmado
                      <span v-if="documento.fechaFirma">
                        el {{ formatDate(documento.fechaFirma) }}
                      </span>
                    </span>
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <Button
                    v-if="!documento.firmado"
                    variant="outline"
                    size="sm"
                    @click="firmarDoc(documento)"
                  >
                    <FileTextIcon class="size-4" />
                    Firmar
                  </Button>
                  <Button
                    v-else
                    variant="outline"
                    size="sm"
                    @click="descargarDoc(documento)"
                  >
                    <DownloadIcon class="size-4" />
                    Descargar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </article>
        <article v-else class="rounded-xl border bg-card p-5 lg:col-span-2">
          <CardHeader>
            <CardTitle>Mis documentos</CardTitle>
            <CardDescription>
              Convenio de alojamiento, boleta de la facultad y tarjeta de
              caracterización.
            </CardDescription>
          </CardHeader>
          <CardContent class="pt-4">
            <div class="text-center text-muted-foreground text-sm py-8">
              No hay documentos disponibles.
            </div>
          </CardContent>
        </article>

        <!-- Preguntas frecuentes -->
        <article class="rounded-xl border bg-card p-5">
          <CardHeader>
            <CardTitle>Preguntas frecuentes</CardTitle>
            <CardDescription>
              Respuestas a las dudas más comunes de los becados.
            </CardDescription>
          </CardHeader>
          <CardContent class="pt-2 space-y-3">
            <div v-if="preguntasCargando" class="grid gap-3">
              <Skeleton v-for="i in 3" :key="i" class="h-16 w-full" />
            </div>
            <div v-else-if="preguntasFrecuentes.length === 0" class="text-muted-foreground text-sm py-4">
              No hay preguntas frecuentes disponibles.
            </div>
            <div v-else>
              <div
                v-for="pregunta in preguntasFrecuentes"
                :key="pregunta.id"
                class="rounded-lg border p-4"
              >
                <div class="flex items-start justify-between gap-2 mb-1">
                  <p class="font-medium">{{ pregunta.pregunta }}</p>
                  <Badge variant="outline" class="text-[10px]">
                    {{ pregunta.categoria }}
                  </Badge>
                </div>
                <p class="text-sm text-muted-foreground">{{ pregunta.respuesta }}</p>
              </div>
            </div>
          </CardContent>
        </article>
      </div>
    </section>

    <FirmarDocumentoDialog
      v-model:open="firmarAbierto"
      :documento="documentoFirmando"
      @firmado="alFirmarDocumento"
    />
  </div>
</template>
