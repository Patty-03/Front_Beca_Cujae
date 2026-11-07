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
  ClockIcon,
  DownloadIcon,
  FileTextIcon,
  HomeIcon,
  MailIcon,
  ShieldAlertIcon,
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
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import { ETIQUETAS_SEXO, ETIQUETAS_ESTADO_BECA } from '@/lib/estudiantes'
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
import KpiCard from '@/components/infraestructura/KpiCard.vue'

const auth = useAuthStore()
const estudianteId = computed(() => auth.user?.id ? Number(auth.user.id) : null)

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

const totalDeberesIncumplidos = computed(() =>
  detalle.value?.deberes.filter((d) => d.estado === 'incumplido').length ?? 0,
)

const tieneCuarto = computed(() => !!detalle.value?.asignacion)

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

function variantePrioridad(prioridad: string) {
  if (prioridad === 'alta') return 'destructive'
  if (prioridad === 'media') return 'secondary'
  return 'outline'
}

function varianteTipoNotificacion(tipo: string) {
  if (tipo === 'error') return 'destructive'
  if (tipo === 'advertencia') return 'outline'
  if (tipo === 'exito') return 'secondary'
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
          Bienvenido a su panel personal de la residencia CUJAE.
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

    <section v-if="detalle" class="grid gap-6">
      <!-- KPI Cards -->
      <div class="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          label="Estado de beca"
          :value="ETIQUETAS_ESTADO_BECA[detalle.estadoBeca] ?? detalle.estadoBeca"
          :detail="detalle.estadoBeca"
          :icon="ShieldAlertIcon"
          :tono="detalle.estadoBeca === 'baja' ? 'amber' : detalle.estadoBeca === 'condicional' ? 'amber' : 'emerald'"
        />
        <KpiCard
          label="Cuarto"
          :value="detalle.asignacion?.cuartoNombre ?? 'Sin cuarto'"
          :detail="
            detalle.asignacion?.edificioNombre ??
            'Sin asignación activa'
          "
          :icon="HomeIcon"
          :tono="tieneCuarto ? 'emerald' : 'amber'"
        />
        <KpiCard
          label="Deberes pendientes"
          :value="totalDeberesPendientes"
          :detail="`${totalDeberesIncumplidos} incumplidos`"
          :icon="ClockIcon"
          tono="sky"
        />
        <KpiCard
          label="Documentos por firmar"
          :value="debeFirmar"
          :detail="`${documentos.length - debeFirmar} firmados`"
          :icon="FileTextIcon"
          :tono="debeFirmar > 0 ? 'amber' : 'emerald'"
        />
        <KpiCard
          label="Notificaciones no leídas"
          :value="notificacionesNoLeidas"
          :detail="`${notificaciones.length} en total`"
          :icon="BellIcon"
          :tono="notificacionesNoLeidas > 0 ? 'sky' : 'emerald'"
        />
        <KpiCard
          label="Año académico"
          :value="`${detalle.anioAcademico}.º`"
          :detail="`${detalle.carrera} · ${detalle.especialidad}`"
          :icon="MailIcon"
          tono="primary"
        />
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Mis datos -->
        <article class="card rounded-xl border p-5 lg:col-span-2">
          <CardHeader>
            <CardTitle>Mis datos</CardTitle>
            <CardDescription>
              Información personal y académica del becado.
            </CardDescription>
          </CardHeader>
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
        </article>

        <!-- Mi cuarto -->
        <article class="card rounded-xl border p-5">
          <CardHeader>
            <CardTitle>Mi cuarto</CardTitle>
            <CardDescription>
              Detalle de su asignación de alojamiento.
            </CardDescription>
          </CardHeader>
          <div class="pt-2">
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
          </div>
        </article>

        <!-- Mis deberes -->
        <article class="card rounded-xl border p-5 lg:col-span-2">
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
          <div class="pt-2">
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
          </div>
        </article>
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Avisos de la residencia -->
        <article class="card rounded-xl border p-5 lg:col-span-2">
          <CardHeader class="flex items-center justify-between">
            <div>
              <CardTitle>Avisos de la residencia</CardTitle>
              <CardDescription>
                Comunicados importantes para los becados.
              </CardDescription>
            </div>
            <Badge
              v-if="avisos.length"
              :variant="variantePrioridad(avisos[0]!.prioridad)"
            >
              {{ avisos.length }} nuevo(s)
            </Badge>
          </CardHeader>
          <div class="pt-2">
            <div v-if="avisosCargando" class="grid gap-3">
              <Skeleton v-for="i in 3" :key="i" class="h-16 w-full" />
            </div>
            <div v-else-if="avisos.length === 0" class="text-muted-foreground text-sm py-4">
              No hay avisos disponibles.
            </div>
            <div v-else class="grid gap-3">
              <div
                v-for="aviso in avisos"
                :key="aviso.id"
                class="flex flex-col gap-2 rounded-lg border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p class="font-medium">{{ aviso.titulo }}</p>
                  <p class="text-muted-foreground text-sm line-clamp-2">
                    {{ aviso.contenido }}
                  </p>
                  <p class="text-muted-foreground text-xs">
                    {{ formatDate(aviso.fecha) }}
                  </p>
                </div>
                <Badge :variant="variantePrioridad(aviso.prioridad)">
                  {{ aviso.prioridad }}
                </Badge>
              </div>
            </div>
          </div>
        </article>

        <!-- Notificaciones -->
        <article class="card rounded-xl border p-5">
          <CardHeader class="flex items-center justify-between">
            <div>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>
                Alertas personales sobre su estado en la residencia.
              </CardDescription>
            </div>
            <Badge v-if="notificacionesNoLeidas > 0" variant="destructive">
              {{ notificacionesNoLeidas }} sin leer
            </Badge>
          </CardHeader>
          <div class="pt-2">
            <div v-if="notificacionesCargando" class="grid gap-3">
              <Skeleton v-for="i in 3" :key="i" class="h-16 w-full" />
            </div>
            <div v-else-if="notificaciones.length === 0" class="text-muted-foreground text-sm py-4">
              No tiene notificaciones.
            </div>
            <div v-else class="grid gap-3">
              <div
                v-for="notificacion in notificaciones"
                :key="notificacion.id"
                class="flex flex-col gap-2 rounded-lg border p-3 text-sm sm:flex-row sm:items-center sm:justify-between cursor-pointer"
                :class="
                  notificacion.leida
                    ? 'bg-muted/30 hover:bg-muted/40 transition-colors'
                    : 'bg-primary/5 border-primary/50 hover:bg-primary/10 transition-colors'
                "
                @click="abrirNotificacion(notificacion)"
              >
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <p class="font-medium">{{ notificacion.titulo }}</p>
                    <Badge
                      v-if="!notificacion.leida"
                      variant="outline"
                      class="text-[10px] leading-none px-1.5 py-0.5"
                    >
                      Nuevo
                    </Badge>
                  </div>
                  <p class="text-muted-foreground text-sm line-clamp-1">
                    {{ notificacion.mensaje }}
                  </p>
                  <p class="text-muted-foreground text-xs">
                    {{ formatDate(notificacion.fecha) }}
                    <span v-if="!notificacion.leida" class="ml-2"> · Sin leer</span>
                  </p>
                </div>
                <Badge :variant="varianteTipoNotificacion(notificacion.tipo)">
                  {{
                    notificacion.tipo === 'info'
                      ? 'Información'
                      : notificacion.tipo === 'exito'
                        ? 'Éxito'
                        : notificacion.tipo === 'advertencia'
                          ? 'Advertencia'
                          : 'Error'
                  }}
                </Badge>
              </div>
            </div>
          </div>
        </article>

        <!-- Mis documentos -->
        <article class="card rounded-xl border p-5 lg:col-span-2">
          <CardHeader>
            <CardTitle>Mis documentos</CardTitle>
            <CardDescription>
              Convenio de alojamiento, boleta de la facultad y tarjeta de
              caracterización.
            </CardDescription>
          </CardHeader>
          <div class="pt-2">
            <div v-if="documentosCargando" class="grid gap-3">
              <Skeleton v-for="i in 3" :key="i" class="h-16 w-full" />
            </div>
            <div v-else-if="documentos.length === 0" class="text-muted-foreground text-sm py-4">
              No hay documentos disponibles.
            </div>
            <div v-else class="grid gap-3">
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
          </div>
        </article>

        <!-- Preguntas frecuentes -->
        <article class="card rounded-xl border p-5">
          <CardHeader>
            <CardTitle>Preguntas frecuentes</CardTitle>
            <CardDescription>
              Respuestas a las dudas más comunes de los becados.
            </CardDescription>
          </CardHeader>
          <div class="pt-2 space-y-3">
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
          </div>
        </article>
      </div>
    </section>

    <div v-else class="flex flex-col items-center justify-center py-24 text-center">
      <Skeleton class="h-8 w-32" />
      <p class="mt-4 text-muted-foreground">Cargando su perfil...</p>
    </div>

    <FirmarDocumentoDialog
      v-model:open="firmarAbierto"
      :documento="documentoFirmando"
      @firmado="alFirmarDocumento"
    />
  </div>
</template>
