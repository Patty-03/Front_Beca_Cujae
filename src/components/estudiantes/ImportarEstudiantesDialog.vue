<script setup lang="ts">
import type {
  FilaImportacionEstudiante,
  PrevisualizacionImportacion,
  ResultadoImportacion,
} from '@/types/estudiante'
import { computed, ref, watch } from 'vue'
import {
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
const progreso = ref({ completados: 0, total: 0 })
const descargandoPlantilla = ref(false)

const filasIncidencias = computed(
  () =>
    previsualizacion.value?.filas.filter((fila) => fila.errores.length > 0 || !!fila.omision) ?? [],
)
const filasVisibles = computed(() => filasIncidencias.value.slice(0, 80))
const filasOcultas = computed(() => Math.max(0, filasIncidencias.value.length - filasVisibles.value.length))

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
  progreso.value = { completados: 0, total: 0 }
  if (inputArchivo.value) inputArchivo.value.value = ''
}

async function alSeleccionar(event: Event) {
  const input = event.target as HTMLInputElement
  const archivo = input.files?.[0]
  if (!archivo) return

  previsualizacion.value = null
  error.value = ''
  archivoNombre.value = archivo.name

  const nombre = archivo.name.toLowerCase()
  if (!nombre.endsWith('.xlsx') && !nombre.endsWith('.xls')) {
    error.value = 'El archivo debe tener formato .xlsx o .xls. Descarga la plantilla para comenzar.'
    return
  }

  if (archivo.size > 10 * 1024 * 1024) {
    error.value = 'El archivo no puede superar los 10 MB.'
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
  error.value = ''
  progreso.value = { completados: 0, total: estudiantesValidos.value.length }
  try {
    const resultado = await importarEstudiantes(validos, (completados, total) => {
      progreso.value = { completados, total }
    })
    const { validas, omitidas, rechazadas } = resultado.resumen

    if (validas > 0 && omitidas === 0 && rechazadas === 0) {
      toast.success('Se importó el excel exitosamente.')
      open.value = false
      emit('importado', resultado)
    } else if (validas > 0) {
      toast.success('Se importó el archivo, pero algunas filas no se pudieron procesar.')
      open.value = false
      emit('importado', resultado)
    } else {
      error.value = resultado.primerError || 'No se import� ning�n estudiante. Verifica los datos e int�ntalo de nuevo.'
    }
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
      description: 'Completa la hoja y vuelve a importarla.',
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
  variante: 'outline' | 'destructive'
  motivo: string
} {
  if (fila.errores.length > 0) {
    return {
      etiqueta: 'Rechazada',
      variante: 'destructive',
      motivo: fila.errores.join(' '),
    }
  }
  return { etiqueta: 'Omitida', variante: 'outline', motivo: fila.omision ?? '' }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>Importar estudiantes</DialogTitle>
        <DialogDescription>
          Carga un archivo Excel (.xlsx) con el formato institucional de prematrícula/nuevo ingreso.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-5">
        <Alert>
          <FileSpreadsheetIcon />
          <AlertTitle>Formato de importación</AlertTitle>
          <AlertDescription>
            Columnas requeridas: CI/Carnet, Nombre (Apellidos y Nombre(S)), Carrera, Sexo, Provincia/Prov, Municipio/Mun. La fecha de nacimiento se infiere del CI (YYMMDD); sin año académico se asume 1 (nuevo ingreso). Carnets duplicados/existentes se omiten y filas inválidas se rechazan.
          </AlertDescription>
        </Alert>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div class="grid flex-1 gap-2">
            <label for="archivo-estudiantes" class="text-sm font-medium">Archivo Excel</label>
            <Input
              id="archivo-estudiantes"
              ref="inputArchivo"
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
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

        <div v-if="importando && progreso.total > 0" class="space-y-2">
          <div class="flex justify-between text-xs text-muted-foreground">
            <span>Importando estudiantes</span>
            <span>{{ progreso.completados }} / {{ progreso.total }}</span>
          </div>
          <div class="w-full bg-muted rounded-full h-2">
            <div
              class="bg-primary h-2 rounded-full transition-all duration-300"
              :style="{ width: `${(progreso.completados / progreso.total) * 100}%` }"
            ></div>
          </div>
        </div>

        <div v-if="leyendo" class="text-muted-foreground flex items-center gap-2 text-sm">
          <LoaderCircleIcon class="size-4 animate-spin" />
          Leyendo y validando el archivo...
        </div>

        <Alert v-if="error" variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>No se pudo procesar el archivo</AlertTitle>
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>

        <template v-if="previsualizacion && filasVisibles.length > 0">
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
                    <p class="text-muted-foreground text-xs">{{ fila.datos?.carnet || '-' }}</p>
                  </TableCell>
                  <TableCell>
                    <Badge :variant="estadoFila(fila).variante">
                      <XCircleIcon v-if="fila.errores.length > 0" class="size-3" />
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
            Se muestran las primeras {{ filasVisibles.length }} incidencias; hay {{ filasOcultas }} más.
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
          Importar estudiantes
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
