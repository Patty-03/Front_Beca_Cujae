<script setup lang="ts">
import type { EstadoSolicitudMedio, SolicitudMedio, TipoMedioSolicitud } from '@/types/solicitud-medio'
import { computed, onMounted, ref } from 'vue'
import { InboxIcon, LoaderCircleIcon, PackageIcon, RefreshCwIcon, SendIcon } from '@lucide/vue'
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
import { formatDateTime } from '@/lib/format'
import { ETIQUETAS_ESTADO_SOLICITUD_MEDIO } from '@/lib/solicitud-medio'
import { LIMITES, normalizarTexto, validarCantidadMedio } from '@/lib/validation'
import { crearSolicitud, obtenerMisSolicitudes, obtenerTiposMedio } from '@/services/solicitudes-medios'

const tipos = ref<TipoMedioSolicitud[]>([])
const solicitudes = ref<SolicitudMedio[]>([])
const cargando = ref(true)
const enviando = ref(false)
const error = ref('')
const formError = ref('')

const tipoMedioId = ref('')
const cantidad = ref('1')
const motivo = ref('')

const tiposActivos = computed(() => tipos.value.filter((tipo) => tipo.activo))

function varianteEstado(estado: EstadoSolicitudMedio) {
  if (estado === 'aprobada') return 'secondary'
  if (estado === 'rechazada') return 'destructive'
  return 'outline'
}

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const [tiposCargados, solicitudesCargadas] = await Promise.all([
      obtenerTiposMedio(),
      obtenerMisSolicitudes(),
    ])
    tipos.value = tiposCargados
    solicitudes.value = solicitudesCargadas
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : 'No se pudieron cargar tus solicitudes.'
  } finally {
    cargando.value = false
  }
}

async function enviar() {
  formError.value = ''

  if (!tipoMedioId.value) {
    formError.value = 'Selecciona el medio que necesitas.'
    return
  }

  let cantidadNumero = 0
  try {
    cantidadNumero = validarCantidadMedio(cantidad.value)
  } catch (caught) {
    formError.value = caught instanceof Error ? caught.message : 'La cantidad no es válida.'
    return
  }

  const motivoLimpio = normalizarTexto(motivo.value)
  if (!motivoLimpio) {
    formError.value = 'Explica brevemente por qué necesitas el medio.'
    return
  }
  if (motivoLimpio.length > 255) {
    formError.value = 'El motivo no puede superar los 255 caracteres.'
    return
  }

  enviando.value = true
  try {
    const creada = await crearSolicitud({
      tipoMedioId: Number(tipoMedioId.value),
      cantidad: cantidadNumero,
      motivo: motivoLimpio,
    })
    solicitudes.value = [creada, ...solicitudes.value]
    tipoMedioId.value = ''
    cantidad.value = '1'
    motivo.value = ''
    toast.success('Solicitud enviada', {
      description: 'El personal de la residencia revisará tu pedido.',
    })
  } catch (caught) {
    formError.value =
      caught instanceof Error ? caught.message : 'No se pudo enviar la solicitud.'
  } finally {
    enviando.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <div class="space-y-6">
    <header class="space-y-1">
      <h1 class="text-2xl font-bold tracking-tight">Solicitar medio</h1>
      <p class="text-muted-foreground text-sm">
        Pide un medio propio para tu cuarto y consulta el estado de tus solicitudes.
      </p>
    </header>

    <Alert v-if="error" variant="destructive">
      <AlertTitle>No se pudieron cargar los datos</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
      <Button variant="outline" size="sm" class="mt-3" @click="cargar">Reintentar</Button>
    </Alert>

    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <Card class="lg:sticky lg:top-6">
        <CardHeader>
          <CardTitle>Nueva solicitud</CardTitle>
          <CardDescription>
            Indica qué medio necesitas y para qué. El personal de la residencia la revisará.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form class="grid gap-4" @submit.prevent="enviar">
            <div class="grid gap-2">
              <Label for="solicitud-tipo">Medio</Label>
              <Select v-model="tipoMedioId" :disabled="cargando || !tiposActivos.length">
                <SelectTrigger id="solicitud-tipo" class="w-full">
                  <SelectValue placeholder="Selecciona un medio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="tipo in tiposActivos"
                    :key="tipo.id"
                    :value="String(tipo.id)"
                  >
                    {{ tipo.nombre }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p v-if="!cargando && !tiposActivos.length" class="text-muted-foreground text-xs">
                No hay tipos de medio disponibles.
              </p>
            </div>

            <div class="grid gap-2">
              <Label for="solicitud-cantidad">Cantidad</Label>
              <Input
                id="solicitud-cantidad"
                v-model="cantidad"
                type="number"
                :min="LIMITES.cantidadMedioMinima"
                :max="LIMITES.cantidadMedioMaxima"
                inputmode="numeric"
              />
            </div>

            <div class="grid gap-2">
              <Label for="solicitud-motivo">Motivo</Label>
              <Textarea
                id="solicitud-motivo"
                v-model="motivo"
                :maxlength="255"
                class="min-h-24"
                placeholder="Ej. El ventilador del cuarto no funciona correctamente."
              />
              <p class="text-muted-foreground text-xs">{{ motivo.length }}/255 caracteres</p>
            </div>

            <p v-if="formError" role="alert" class="text-destructive text-sm">{{ formError }}</p>

            <Button type="submit" :disabled="enviando || cargando">
              <LoaderCircleIcon v-if="enviando" class="animate-spin" />
              <SendIcon v-else />
              Enviar solicitud
            </Button>
          </form>
        </CardContent>
      </Card>

      <section class="space-y-3">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold tracking-tight">Mis solicitudes</h2>
            <p class="text-muted-foreground text-sm">
              {{
                cargando
                  ? 'Cargando solicitudes…'
                  : `${solicitudes.length} ${solicitudes.length === 1 ? 'solicitud registrada' : 'solicitudes registradas'}`
              }}
            </p>
          </div>
          <Button variant="outline" size="sm" :disabled="cargando" @click="cargar">
            <RefreshCwIcon :class="{ 'animate-spin': cargando }" />
            Actualizar
          </Button>
        </div>

        <div v-if="cargando" class="space-y-2">
          <Skeleton v-for="indice in 4" :key="indice" class="h-12 w-full" />
        </div>

        <div
          v-else-if="!solicitudes.length"
          class="bg-card flex flex-col items-center justify-center gap-3 rounded-xl border px-4 py-12 text-center"
        >
          <PackageIcon class="text-muted-foreground size-10" />
          <div>
            <p class="font-medium">Todavía no has solicitado medios</p>
            <p class="text-muted-foreground text-sm">
              Usa el formulario para pedir un medio para tu cuarto.
            </p>
          </div>
        </div>

        <div v-else class="bg-card overflow-hidden rounded-xl border">
          <div class="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medio</TableHead>
                  <TableHead class="text-right">Cantidad</TableHead>
                  <TableHead class="min-w-48">Motivo</TableHead>
                  <TableHead>Solicitada</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead class="min-w-48">Resolución</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="solicitud in solicitudes" :key="solicitud.id">
                  <TableCell class="font-medium">{{ solicitud.tipoMedioNombre }}</TableCell>
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
                    {{ solicitud.observacionesResolucion || '—' }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div class="grid gap-3 p-3 md:hidden">
            <Card v-for="solicitud in solicitudes" :key="solicitud.id">
              <CardContent class="space-y-2 p-4">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-medium">{{ solicitud.tipoMedioNombre }}</p>
                    <p class="text-muted-foreground text-xs">
                      {{ solicitud.cantidad }} unidades · {{ formatDateTime(solicitud.fechaSolicitud) }}
                    </p>
                  </div>
                  <Badge :variant="varianteEstado(solicitud.estado)">
                    {{ ETIQUETAS_ESTADO_SOLICITUD_MEDIO[solicitud.estado] }}
                  </Badge>
                </div>
                <p class="text-muted-foreground text-xs">{{ solicitud.motivo }}</p>
                <p v-if="solicitud.observacionesResolucion" class="text-xs">
                  <span class="font-medium">Resolución:</span>
                  {{ solicitud.observacionesResolucion }}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div
          v-if="!cargando && !solicitudes.length"
          class="text-muted-foreground flex items-center justify-center gap-2 text-xs"
        >
          <InboxIcon class="size-4" />
          Las solicitudes nuevas aparecerán aquí.
        </div>
      </section>
    </div>
  </div>
</template>
