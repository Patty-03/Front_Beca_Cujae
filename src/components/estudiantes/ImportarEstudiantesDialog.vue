<script setup lang="ts">
import type {
  FilaImportacionEstudiante,
  PrevisualizacionImportacion,
  ResultadoImportacion,
} from '@/types/estudiante'
import { computed, ref, watch } from 'vue'
import {
  CheckCircle2Icon,
  CircleAlertIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  LoaderCircleIcon,
  UploadIcon,
  XCircleIcon,
} from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { leerArchivoEstudiantes } from '@/lib/leerExcelEstudiantes'
import { descargarPlantillaEstudiantes } from '@/lib/plantillaEstudiantes'
import { formatNumber } from '@/lib/format'
import { importarEstudiantes } from '@/services/estudiantes'

const props = defineProps<{ carnetsExistentes: string[] }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ importado: [resultado: ResultadoImportacion] }>()

const inputArchivo = ref<HTMLInputElement | null>(null)
const archivoNombre = ref('')
const previsualizacion = ref<PrevisualizacionImportacion | null>(null)
const error = ref('')
const leyendo = ref(false)
const importando = ref(false)
const descargandoPlantilla = ref(false)

const filasVisibles = computed(() => previsualizacion.value?.filas.slice(0, 80) ?? [])
const filasOcultas = computed(() =>
  Math.max(0, (previsualizacion.value?.filas.length ?? 0) - filasVisibles.value.length),
)

const estudiantesValidos = computed(
  () =>
    previsualizacion.value?.filas.flatMap((fila) =>
      fila.datos && fila.errores.length === 0 && !fila.omision ? [fila.datos] : [],
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

  if (archivo.size > 5 * 1024 * 1024) {
    error.value = 'El archivo no puede superar los 5 MB.'
    return
  }

  leyendo.value = true
  try {
    previsualizacion.value = await leerArchivoEstudiantes(archivo, props.carnetsExistentes)
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : 'No se pudo leer el archivo seleccionado.'
  } finally {
    leyendo.value = false
  }
}

async function confirmarImportacion() {
  const validos = estudiantesValidos.value
  if (validos.length === 0) {
    toast.error('No hay filas válidas para importar.')
    return
  }

  importando.value = true
  try {
    const resultado = await importarEstudiantes(validos)
    toast.success('Importación completada', {
      description: `${resultado.resumen.validas} estudiantes importados de ${resultado.resumen.total} filas.`,
    })
    open.value = false
    emit('importado', resultado)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'No se pudo importar el archivo.'
  } finally {
    importando.value = false
  }
}

async function descargarPlantilla() {
  descargandoPlantilla.value = true
  try {
    await descargarPlantillaEstudiantes()
    toast.success('Plantilla descargada', {
      description: 'Completa la hoja Estudiantes y vuelve a importarla.',
    })
  } catch (caught) {
    toast.error('No se pudo descargar la plantilla', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    descargandoPlantilla.value = false
  }
}

function estadoFila(fila: FilaImportacionEstudiante): {
  etiqueta: string
  variante: 'secondary' | 'outline' | 'destructive'
  motivo: string
} {
  if (fila.errores.length > 0) {
    return {
      etiqueta: 'Rechazada',
      variante: 'destructive',
      motivo: fila.errores.join(' '),
    }
  }
  if (fila.omision) {
    return { etiqueta: 'Omitida', variante: 'outline', motivo: fila.omision }
  }
  return { etiqueta: 'Válida', variante: 'secondary', motivo: 'Lista para importar.' }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>Importar estudiantes</DialogTitle>
        <DialogDescription>
          Carga un archivo XLSX con el formato de la plantilla institucional.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-5">
        <Alert>
          <FileSpreadsheetIcon />
          <AlertTitle>Solo residentes en provincia</AlertTitle>
          <AlertDescription>
            Se importan únicamente estudiantes con tipo de ingreso
            <strong>Residente en provincia</strong>. La Habana y los extranjeros se omiten.
          </AlertDescription>
        </Alert>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div class="grid flex-1 gap-2">
            <label for="archivo-estudiantes" class="text-sm font-medium">Archivo XLSX</label>
            <Input
              id="archivo-estudiantes"
              ref="inputArchivo"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              :disabled="leyendo || importando"
              @change="alSeleccionar"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            :disabled="descargandoPlantilla"
            @click="descargarPlantilla"
          >
            <LoaderCircleIcon v-if="descargandoPlantilla" class="animate-spin" />
            <DownloadIcon v-else />
            Plantilla
          </Button>
        </div>

        <p v-if="archivoNombre" class="text-muted-foreground text-xs">
          Archivo seleccionado: {{ archivoNombre }}
        </p>

        <div v-if="leyendo" class="text-muted-foreground flex items-center gap-2 text-sm">
          <LoaderCircleIcon class="size-4 animate-spin" />
          Leyendo y validando el archivo...
        </div>

        <Alert v-if="error" variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>No se pudo procesar el archivo</AlertTitle>
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>

        <template v-if="previsualizacion">
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div class="rounded-md border p-3">
              <p class="text-muted-foreground text-xs">Filas</p>
              <p class="text-xl font-semibold tabular-nums">
                {{ formatNumber(previsualizacion.resumen.total) }}
              </p>
            </div>
            <div class="rounded-md border p-3">
              <p class="text-muted-foreground text-xs">Válidas</p>
              <p class="text-xl font-semibold text-emerald-700 tabular-nums">
                {{ formatNumber(previsualizacion.resumen.validas) }}
              </p>
            </div>
            <div class="rounded-md border p-3">
              <p class="text-muted-foreground text-xs">Omitidas</p>
              <p class="text-xl font-semibold text-amber-700 tabular-nums">
                {{ formatNumber(previsualizacion.resumen.omitidas) }}
              </p>
            </div>
            <div class="rounded-md border p-3">
              <p class="text-muted-foreground text-xs">Rechazadas</p>
              <p class="text-xl font-semibold text-destructive tabular-nums">
                {{ formatNumber(previsualizacion.resumen.rechazadas) }}
              </p>
            </div>
          </div>

          <div class="max-h-72 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="w-16">Fila</TableHead>
                  <TableHead>Estudiante</TableHead>
                  <TableHead class="w-28">Estado</TableHead>
                  <TableHead>Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="fila in filasVisibles" :key="fila.fila">
                  <TableCell class="tabular-nums">{{ fila.fila }}</TableCell>
                  <TableCell>
                    <p class="font-medium">{{ fila.datos?.nombre ?? 'Sin datos' }}</p>
                    <p class="text-muted-foreground text-xs">{{ fila.datos?.carnet }}</p>
                  </TableCell>
                  <TableCell>
                    <Badge :variant="estadoFila(fila).variante">
                      <CheckCircle2Icon
                        v-if="fila.errores.length === 0 && !fila.omision"
                        class="size-3"
                      />
                      <XCircleIcon v-else-if="fila.errores.length > 0" class="size-3" />
                      {{ estadoFila(fila).etiqueta }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-muted-foreground text-xs">
                    {{ estadoFila(fila).motivo }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <p v-if="filasOcultas" class="text-muted-foreground text-xs">
            Se muestran las primeras {{ filasVisibles.length }} filas; hay
            {{ filasOcultas }} más.
          </p>
        </template>
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button type="button" variant="outline">Cancelar</Button>
        </DialogClose>
        <Button
          type="button"
          :disabled="importando || leyendo || estudiantesValidos.length === 0"
          @click="confirmarImportacion"
        >
          <LoaderCircleIcon v-if="importando" class="animate-spin" />
          <UploadIcon v-else />
          Importar {{ estudiantesValidos.length }} estudiantes
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
