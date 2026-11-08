<script setup lang="ts">
import type { EstadoConstructivo } from '@/types/infraestructura'
import type { PrevisualizacionImportacionInfraestructura } from '@/lib/importarInfraestructura'
import { computed, ref, watch } from 'vue'
import {
  CircleAlertIcon,
  DownloadIcon,
  LoaderCircleIcon,
  UploadIcon,
} from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { leerArchivoInfraestructura } from '@/lib/leerExcelInfraestructura'
import { descargarPlantillaInfraestructura } from '@/lib/plantillaInfraestructura'
import { formatNumber } from '@/lib/format'
import {
  crearCuarto,
  crearEdificio,
  crearEscalera,
  obtenerEdificios,
} from '@/services/infraestructura'

const props = defineProps<{ estados: EstadoConstructivo[] }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ importado: [] }>()

const inputArchivo = ref<HTMLInputElement | null>(null)
const archivoNombre = ref('')
const previsualizacion = ref<PrevisualizacionImportacionInfraestructura | null>(null)
const error = ref('')
const leyendo = ref(false)
const importando = ref(false)
const descargandoPlantilla = ref(false)

const filasVisibles = computed(() => previsualizacion.value?.filas.slice(0, 80) ?? [])

const filasValidas = computed(
  () =>
    previsualizacion.value?.filas.flatMap((fila) =>
      fila.datos && fila.errores.length === 0 ? [fila.datos] : [],
    ) ?? [],
)

watch(open, (abierto) => {
  if (!abierto) return
  limpiar()
})

function limpiar() {
  archivoNombre.value = ''
  previsualizacion.value = null
  error.value = ''
  leyendo.value = false
  importando.value = false
  if (inputArchivo.value) inputArchivo.value.value = ''
}

async function alSeleccionar(event: Event) {
  const input = event.target as HTMLInputElement
  const archivo = input.files?.[0]
  if (!archivo) return

  previsualizacion.value = null
  error.value = ''
  archivoNombre.value = archivo.name

  if (!archivo.name.toLowerCase().endsWith('.xlsx')) {
    error.value = 'El archivo debe tener formato .xlsx. Descarga la plantilla para comenzar.'
    return
  }

  leyendo.value = true
  try {
    previsualizacion.value = await leerArchivoInfraestructura(archivo, props.estados)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'No se pudo leer el archivo.'
  } finally {
    leyendo.value = false
  }
}

async function descargarPlantilla() {
  descargandoPlantilla.value = true
  try {
    await descargarPlantillaInfraestructura(props.estados)
    toast.success('Plantilla descargada')
  } catch {
    toast.error('No se pudo descargar la plantilla')
  } finally {
    descargandoPlantilla.value = false
  }
}

async function confirmarImportacion() {
  const validas = filasValidas.value
  if (validas.length === 0) {
    toast.error('No hay filas válidas para importar.')
    return
  }

  importando.value = true
  try {
    const edificiosActuales = await obtenerEdificios()
    const estadosMap = new Map(props.estados.map((e) => [e.nombre.toLowerCase().trim(), e.id]))

    // Operaciones de servicio
    for (const fila of validas) {
      let edificioReg = edificiosActuales.find(
        (e) => e.nombre.toLowerCase() === fila.edificio.toLowerCase(),
      )

      const estadoEdId = estadosMap.get(fila.estadoEdificio.toLowerCase()) ?? props.estados[0]?.id ?? 1

      if (!edificioReg) {
        edificioReg = await crearEdificio({
          nombre: fila.edificio,
          estadoConstructivoId: estadoEdId,
        })
      }

      // Obtener detalle para ver escaleras
      const detalleEd = await obtenerEdificioDetalleAux(edificioReg.id)
      let escaleraReg = detalleEd.escalerasDetalle.find(
        (es) => es.nombre.toLowerCase() === fila.escalera.toLowerCase(),
      )

      if (!escaleraReg) {
        escaleraReg = await crearEscalera(edificioReg.id, {
          nombre: fila.escalera,
        })
      }

      const estadoCuartoId = estadosMap.get(fila.estadoCuarto.toLowerCase()) ?? props.estados[0]?.id ?? 1
      await crearCuarto(escaleraReg.id, {
        nombre: fila.cuarto,
        capacidadMaxima: fila.capacidad,
        estadoConstructivoId: estadoCuartoId,
      })
    }

    toast.success('Infraestructura importada correctamente')
    open.value = false
    emit('importado')
  } catch (caught) {
    toast.error('Error al importar infraestructura', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    importando.value = false
  }
}

async function obtenerEdificioDetalleAux(id: number) {
  const { obtenerEdificio } = await import('@/services/infraestructura')
  return obtenerEdificio(id)
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-4xl max-h-[90vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>Importar infraestructura desde Excel</DialogTitle>
        <DialogDescription>
          Sube un archivo .xlsx con el inventario de edificios, escaleras y cuartos.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 overflow-y-auto flex-1 pr-1">
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 bg-muted/30">
          <div class="space-y-1">
            <p class="text-sm font-medium">Plantilla oficial</p>
            <p class="text-xs text-muted-foreground">
              Descarga la plantilla con el formato requerido y los estados disponibles.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            :disabled="descargandoPlantilla"
            @click="descargarPlantilla"
          >
            <DownloadIcon class="size-4 mr-1" />
            Descargar plantilla
          </Button>
        </div>

        <div class="grid gap-2">
          <Label>Seleccionar archivo .xlsx</Label>
          <div class="flex items-center gap-3">
            <Input
              ref="inputArchivo"
              type="file"
              accept=".xlsx"
              class="cursor-pointer"
              @change="alSeleccionar"
            />
          </div>
        </div>

        <Alert v-if="error" variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>Archivo no válido</AlertTitle>
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>

        <div v-if="leyendo" class="flex flex-col items-center justify-center py-10 gap-3">
          <LoaderCircleIcon class="size-8 animate-spin text-primary" />
          <p class="text-sm text-muted-foreground">Analizando estructura del archivo...</p>
        </div>

        <div v-if="previsualizacion" class="space-y-4">
          <div class="grid grid-cols-3 gap-3">
            <div class="rounded-lg border p-3 text-center bg-card">
              <p class="text-2xl font-bold">{{ previsualizacion.edificiosNuevos }}</p>
              <p class="text-xs text-muted-foreground">Edificios detectados</p>
            </div>
            <div class="rounded-lg border p-3 text-center bg-card">
              <p class="text-2xl font-bold">{{ previsualizacion.escalerasNuevas }}</p>
              <p class="text-xs text-muted-foreground">Escaleras detectadas</p>
            </div>
            <div class="rounded-lg border p-3 text-center bg-card">
              <p class="text-2xl font-bold">{{ previsualizacion.cuartosNuevos }}</p>
              <p class="text-xs text-muted-foreground">Cuartos detectados</p>
            </div>
          </div>

          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="w-16">Fila</TableHead>
                  <TableHead>Edificio</TableHead>
                  <TableHead>Escalera</TableHead>
                  <TableHead>Cuarto</TableHead>
                  <TableHead>Capacidad</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="item in filasVisibles" :key="item.fila">
                  <TableCell class="font-mono text-xs">{{ item.fila }}</TableCell>
                  <TableCell>{{ item.datos?.edificio ?? '-' }}</TableCell>
                  <TableCell>{{ item.datos?.escalera ?? '-' }}</TableCell>
                  <TableCell>{{ item.datos?.cuarto ?? '-' }}</TableCell>
                  <TableCell>{{ item.datos?.capacidad ?? '-' }}</TableCell>
                  <TableCell>
                    <Badge v-if="item.errores.length === 0" variant="secondary">Válido</Badge>
                    <Badge v-else variant="destructive" :title="item.errores.join(', ')">
                      Error
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="open = false">Cancelar</Button>
        <Button
          :disabled="!filasValidas.length || importando"
          @click="confirmarImportacion"
        >
          <LoaderCircleIcon v-if="importando" class="size-4 mr-1 animate-spin" />
          <UploadIcon v-else class="size-4 mr-1" />
          Importar {{ formatNumber(filasValidas.length) }} registros
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
