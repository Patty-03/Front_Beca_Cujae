<script setup lang="ts">
import type {
  EstadoSolicitudMedio,
  SolicitudMedio,
  TipoMedioSolicitud,
} from '@/types/solicitud-medio'
import { computed, onMounted, ref } from 'vue'
import {
  CheckCircle2Icon,
  CheckIcon,
  ClockIcon,
  InboxIcon,
  LoaderCircleIcon,
  RefreshCwIcon,
  SearchIcon,
  SearchXIcon,
  XCircleIcon,
  XIcon,
} from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import KpiCard from '@/components/infraestructura/KpiCard.vue'
import { formatDateTime, formatNumber } from '@/lib/format'
import {
  ESTADOS_SOLICITUD_MEDIO,
  ETIQUETAS_ESTADO_SOLICITUD_MEDIO,
} from '@/lib/solicitud-medio'
import { normalizarParaComparar, normalizarTexto } from '@/lib/validation'
import {
  aprobarSolicitud,
  obtenerSolicitudes,
  obtenerTiposMedio,
  rechazarSolicitud,
} from '@/services/solicitudes-medios'
import { useAuthStore } from '@/stores/auth'

type AccionResolucion = 'aprobar' | 'rechazar'

const auth = useAuthStore()
const puedeAprobar = computed(() => auth.can('solicitudes-medios:aprobar'))

const solicitudes = ref<SolicitudMedio[]>([])
const tipos = ref<TipoMedioSolicitud[]>([])
const cargando = ref(true)
const error = ref('')

const busqueda = ref('')
const estadoFiltro = ref<EstadoSolicitudMedio | 'todas'>('todas')
const tipoFiltro = ref('todos')

const dialogoAbierto = ref(false)
const solicitudSeleccionada = ref<SolicitudMedio | null>(null)
const accion = ref<AccionResolucion>('aprobar')
const observaciones = ref('')
const dialogoError = ref('')
const resolviendo = ref(false)

const pendientes = computed(
  () => solicitudes.value.filter((solicitud) => solicitud.estado === 'pendiente').length,
)
const aprobadas = computed(
  () => solicitudes.value.filter((solicitud) => solicitud.estado === 'aprobada').length,
)
const rechazadas = computed(
  () => solicitudes.value.filter((solicitud) => solicitud.estado === 'rechazada').length,
)

const filtradas = computed(() => {
  const texto = normalizarParaComparar(busqueda.value)

  return solicitudes.value.filter((solicitud) => {
    if (estadoFiltro.value !== 'todas' && solicitud.estado !== estadoFiltro.value) {
      return false
    }
    if (tipoFiltro.value !== 'todos' && String(solicitud.tipoMedioId) !== tipoFiltro.value) {
      return false
    }
    if (texto) {
      const contenido = normalizarParaComparar(
        `${solicitud.estudianteNombre} ${solicitud.tipoMedioNombre} ${solicitud.motivo}`,
      )
      if (!contenido.includes(texto)) return false
    }
    return true
  })
})

const hayFiltros = computed(
  () =>
    busqueda.value.trim() !== '' ||
    estadoFiltro.value !== 'todas' ||
    tipoFiltro.value !== 'todos',
)

function varianteEstado(estado: EstadoSolicitudMedio) {
  if (estado === 'aprobada') return 'secondary'
  if (estado === 'rechazada') return 'destructive'
  return 'outline'
}

function limpiarFiltros() {
  busqueda.value = ''
  estadoFiltro.value = 'todas'
  tipoFiltro.value = 'todos'
}

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const [solicitudesCargadas, tiposCargados] = await Promise.all([
      obtenerSolicitudes(),
      obtenerTiposMedio(),
    ])
    solicitudes.value = solicitudesCargadas
    tipos.value = tiposCargados
  } catch (caught) {
    error.value =
      caught instanceof Error
        ? caught.message
        : 'No se pudieron cargar las solicitudes de medios.'
  } finally {
    cargando.value = false
  }
}

function abrirResolver(solicitud: SolicitudMedio, nuevaAccion: AccionResolucion) {
  if (!puedeAprobar.value) return
  solicitudSeleccionada.value = solicitud
  accion.value = nuevaAccion
  observaciones.value = ''
  dialogoError.value = ''
  dialogoAbierto.value = true
}

async function confirmarResolucion() {
  const solicitud = solicitudSeleccionada.value
  if (!solicitud) return

  const observacionesLimpias = normalizarTexto(observaciones.value)
  if (accion.value === 'rechazar' && !observacionesLimpias) {
    dialogoError.value = 'Indica el motivo del rechazo.'
    return
  }
  if (observacionesLimpias.length > 500) {
    dialogoError.value = 'Las observaciones no pueden superar los 500 caracteres.'
    return
  }

  dialogoError.value = ''
  resolviendo.value = true
  try {
    const input = observacionesLimpias ? { observacionesResolucion: observacionesLimpias } : undefined
    const actualizada =
      accion.value === 'aprobar'
        ? await aprobarSolicitud(solicitud.id, input)
        : await rechazarSolicitud(solicitud.id, input)

    const indice = solicitudes.value.findIndex((item) => item.id === actualizada.id)
    if (indice >= 0) solicitudes.value[indice] = actualizada

    toast.success(
      accion.value === 'aprobar' ? 'Solicitud aprobada' : 'Solicitud rechazada',
      { description: `${solicitud.tipoMedioNombre} · ${solicitud.estudianteNombre}` },
    )
    dialogoAbierto.value = false
    solicitudSeleccionada.value = null
  } catch (caught) {
    dialogoError.value =
      caught instanceof Error ? caught.message : 'No se pudo resolver la solicitud.'
  } finally {
    resolviendo.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Solicitudes de medios</h1>
        <p class="text-muted-foreground mt-1 text-sm">
          Revisa las solicitudes de medios propios y apruébalas o recházalas.
        </p>
      </div>
      <Button variant="outline" :disabled="cargando" @click="cargar">
        <RefreshCwIcon :class="{ 'animate-spin': cargando }" />
        Actualizar
      </Button>
    </div>

    <Alert v-if="error" variant="destructive">
      <AlertTitle>No se pudieron cargar las solicitudes</AlertTitle>
      <AlertDescription>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>{{ error }}</span>
          <Button variant="outline" size="sm" @click="cargar">Reintentar</Button>
        </div>
      </AlertDescription>
    </Alert>

    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Total"
        :value="formatNumber(solicitudes.length)"
        detail="Solicitudes registradas"
        :icon="InboxIcon"
      />
      <KpiCard
        label="Pendientes"
        :value="formatNumber(pendientes)"
        detail="Por revisar"
        :icon="ClockIcon"
        tono="amber"
      />
      <KpiCard
        label="Aprobadas"
        :value="formatNumber(aprobadas)"
        detail="Medios autorizados"
        :icon="CheckCircle2Icon"
        tono="emerald"
      />
      <KpiCard
        label="Rechazadas"
        :value="formatNumber(rechazadas)"
        detail="Sin autorización"
        :icon="XCircleIcon"
      />
    </div>

    <Card>
      <CardHeader class="gap-4">
        <div>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busca por estudiante, medio o motivo de la solicitud.</CardDescription>
        </div>
        <div class="grid gap-3 md:grid-cols-3">
          <div class="relative">
            <SearchIcon class="text-muted-foreground pointer-events-none absolute top-2.5 left-2.5 size-4" />
            <Input
              v-model="busqueda"
              class="pl-8"
              placeholder="Buscar solicitud..."
              aria-label="Buscar solicitud"
            />
          </div>

          <Select v-model="estadoFiltro">
            <SelectTrigger class="w-full" aria-label="Filtrar por estado">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos los estados</SelectItem>
              <SelectItem v-for="estado in ESTADOS_SOLICITUD_MEDIO" :key="estado" :value="estado">
                {{ ETIQUETAS_ESTADO_SOLICITUD_MEDIO[estado] }}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select v-model="tipoFiltro">
            <SelectTrigger class="w-full" aria-label="Filtrar por tipo de medio">
              <SelectValue placeholder="Medio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los medios</SelectItem>
              <SelectItem v-for="tipo in tipos" :key="tipo.id" :value="String(tipo.id)">
                {{ tipo.nombre }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex items-center justify-between gap-3">
          <p class="text-muted-foreground text-xs">
            Mostrando {{ formatNumber(filtradas.length) }} de
            {{ formatNumber(solicitudes.length) }} solicitudes.
          </p>
          <Button v-if="hayFiltros" variant="ghost" size="sm" @click="limpiarFiltros">
            Limpiar filtros
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div v-if="cargando" class="grid gap-3">
          <Skeleton v-for="indice in 5" :key="indice" class="h-14 w-full" />
        </div>

        <div
          v-else-if="!solicitudes.length"
          class="flex flex-col items-center gap-3 py-12 text-center"
        >
          <InboxIcon class="text-muted-foreground size-10" />
          <div>
            <p class="font-medium">No hay solicitudes registradas</p>
            <p class="text-muted-foreground text-sm">
              Cuando un estudiante solicite un medio aparecerá aquí.
            </p>
          </div>
        </div>

        <div
          v-else-if="!filtradas.length"
          class="flex flex-col items-center gap-3 py-12 text-center"
        >
          <SearchXIcon class="text-muted-foreground size-10" />
          <div>
            <p class="font-medium">Sin resultados</p>
            <p class="text-muted-foreground text-sm">
              Ajusta la búsqueda o limpia los filtros para ver más solicitudes.
            </p>
          </div>
          <Button variant="outline" @click="limpiarFiltros">Limpiar filtros</Button>
        </div>

        <template v-else>
          <div class="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Medio</TableHead>
                  <TableHead class="text-right">Cantidad</TableHead>
                  <TableHead class="min-w-48">Motivo</TableHead>
                  <TableHead>Solicitada</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead class="min-w-40">Resolución</TableHead>
                  <TableHead v-if="puedeAprobar" class="w-44 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="solicitud in filtradas" :key="solicitud.id">
                  <TableCell class="font-medium">{{ solicitud.estudianteNombre }}</TableCell>
                  <TableCell>{{ solicitud.tipoMedioNombre }}</TableCell>
                  <TableCell class="text-right tabular-nums">{{ solicitud.cantidad }}</TableCell>
                  <TableCell class="text-muted-foreground text-xs">{{ solicitud.motivo }}</TableCell>
                  <TableCell class="text-muted-foreground text-xs">
                    {{ formatDateTime(solicitud.fechaSolicitud) }}
                  </TableCell>
                  <TableCell>
                    <Badge :variant="varianteEstado(solicitud.estado)">
                      {{ ETIQUETAS_ESTADO_SOLICITUD_MEDIO[solicitud.estado] }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-muted-foreground text-xs">
                    <p>{{ solicitud.observacionesResolucion || '—' }}</p>
                    <p v-if="solicitud.fechaResolucion" class="mt-1">
                      {{ formatDateTime(solicitud.fechaResolucion) }}
                    </p>
                  </TableCell>
                  <TableCell v-if="puedeAprobar">
                    <div
                      v-if="solicitud.estado === 'pendiente'"
                      class="flex items-center justify-end gap-2"
                    >
                      <Button size="sm" @click="abrirResolver(solicitud, 'aprobar')">
                        <CheckIcon />
                        Aprobar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        @click="abrirResolver(solicitud, 'rechazar')"
                      >
                        <XIcon />
                        Rechazar
                      </Button>
                    </div>
                    <p v-else class="text-muted-foreground text-right text-xs">Resuelta</p>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div class="grid gap-3 md:hidden">
            <Card v-for="solicitud in filtradas" :key="solicitud.id">
              <CardContent class="space-y-3 p-4">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-medium">{{ solicitud.estudianteNombre }}</p>
                    <p class="text-muted-foreground text-xs">
                      {{ solicitud.tipoMedioNombre }} · {{ solicitud.cantidad }} unidades
                    </p>
                  </div>
                  <Badge :variant="varianteEstado(solicitud.estado)">
                    {{ ETIQUETAS_ESTADO_SOLICITUD_MEDIO[solicitud.estado] }}
                  </Badge>
                </div>
                <p class="text-muted-foreground text-xs">{{ solicitud.motivo }}</p>
                <p class="text-muted-foreground text-xs">
                  Solicitada: {{ formatDateTime(solicitud.fechaSolicitud) }}
                </p>
                <p v-if="solicitud.observacionesResolucion" class="text-xs">
                  <span class="font-medium">Resolución:</span>
                  {{ solicitud.observacionesResolucion }}
                </p>
                <div
                  v-if="puedeAprobar && solicitud.estado === 'pendiente'"
                  class="flex items-center justify-end gap-2"
                >
                  <Button size="sm" @click="abrirResolver(solicitud, 'aprobar')">
                    <CheckIcon />
                    Aprobar
                  </Button>
                  <Button variant="outline" size="sm" @click="abrirResolver(solicitud, 'rechazar')">
                    <XIcon />
                    Rechazar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </template>
      </CardContent>
    </Card>

    <Dialog v-model:open="dialogoAbierto">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {{ accion === 'aprobar' ? 'Aprobar solicitud' : 'Rechazar solicitud' }}
          </DialogTitle>
          <DialogDescription>
            {{
              solicitudSeleccionada
                ? `${solicitudSeleccionada.tipoMedioNombre} (${solicitudSeleccionada.cantidad}) para ${solicitudSeleccionada.estudianteNombre}.`
                : ''
            }}
          </DialogDescription>
        </DialogHeader>

        <div class="grid gap-2">
          <Label for="solicitud-observaciones">
            {{ accion === 'rechazar' ? 'Motivo del rechazo' : 'Observaciones (opcional)' }}
          </Label>
          <Textarea
            id="solicitud-observaciones"
            v-model="observaciones"
            :maxlength="500"
            class="min-h-24"
            :placeholder="
              accion === 'rechazar'
                ? 'Explica por qué no se puede aprobar la solicitud.'
                : 'Ej. Se entregará en el almacén de la residencia.'
            "
          />
          <p class="text-muted-foreground text-xs">{{ observaciones.length }}/500 caracteres</p>
        </div>

        <p v-if="dialogoError" role="alert" class="text-destructive text-sm">
          {{ dialogoError }}
        </p>

        <DialogFooter>
          <Button variant="outline" :disabled="resolviendo" @click="dialogoAbierto = false">
            Cancelar
          </Button>
          <Button
            :variant="accion === 'rechazar' ? 'destructive' : 'default'"
            :disabled="resolviendo"
            @click="confirmarResolucion"
          >
            <LoaderCircleIcon v-if="resolviendo" class="animate-spin" />
            {{ accion === 'aprobar' ? 'Aprobar' : 'Rechazar' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
