<script setup lang="ts">
import type { Documento, TipoDocumento } from '@/types/estudiante-view'
import { ref } from 'vue'
import { UploadIcon, LoaderCircleIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ETIQUETAS_TIPO_DOCUMENTO } from '@/types/estudiante-view'
import { subirDocumento } from '@/services/estudiante-view'

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ subido: [documento: Documento] }>()

const tipo = ref<TipoDocumento>('convenio')
const nombre = ref('')
const descripcion = ref('')
const archivo = ref<File | null>(null)
const archivoNombre = ref('')
const subiendo = ref(false)

const tiposDisponibles: TipoDocumento[] = ['convenio', 'acta_responsabilidad_material']

function alSeleccionarArchivo(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  archivo.value = file
  archivoNombre.value = file.name
}

async function guardar() {
  if (!nombre.value.trim()) {
    toast.error('El nombre del documento es obligatorio.')
    return
  }
  if (!archivo.value) {
    toast.error('Debe seleccionar un archivo.')
    return
  }

  subiendo.value = true
  try {
    const documento = await subirDocumento(
      {
        nombre: nombre.value.trim(),
        tipo: tipo.value,
        descripcion: descripcion.value.trim(),
        url: '',
        fechaSubida: new Date().toISOString().slice(0, 10),
      },
      archivo.value,
    )
    toast.success('Documento subido', {
      description: `${documento.nombre} está disponible para los estudiantes.`,
    })
    open.value = false
    emit('subido', documento)
    limpiar()
  } catch (caught) {
    toast.error('No se pudo subir el documento', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    subiendo.value = false
  }
}

function limpiar() {
  tipo.value = 'convenio'
  nombre.value = ''
  descripcion.value = ''
  archivo.value = null
  archivoNombre.value = ''
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Subir documento para firma</DialogTitle>
        <DialogDescription>
          Cargue un documento que los estudiantes deberán firmar digitalmente.
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="guardar">
        <div class="grid gap-2">
          <Label for="documento-tipo">Tipo de documento</Label>
          <Select id="documento-tipo" v-model="tipo">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Seleccione un tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="t in tiposDisponibles"
                :key="t"
                :value="t"
              >
                {{ ETIQUETAS_TIPO_DOCUMENTO[t] }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="grid gap-2">
          <Label for="documento-nombre">Nombre *</Label>
          <Input
            id="documento-nombre"
            v-model="nombre"
            placeholder="Ej. Acta de Responsabilidad Material 2026"
          />
        </div>

        <div class="grid gap-2">
          <Label for="documento-descripcion">Descripción</Label>
          <Input
            id="documento-descripcion"
            v-model="descripcion"
            placeholder="Descripción breve del documento"
          />
        </div>

        <div class="grid gap-2">
          <Label for="documento-archivo">Archivo *</Label>
          <input
            id="documento-archivo"
            type="file"
            accept=".pdf,.doc,.docx"
            class="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            @change="alSeleccionarArchivo"
          />
          <p v-if="archivoNombre" class="text-muted-foreground text-xs">
            {{ archivoNombre }}
          </p>
        </div>
      </form>

      <DialogFooter>
        <DialogClose as-child>
          <Button type="button" variant="outline">Cancelar</Button>
        </DialogClose>
        <Button type="button" :disabled="subiendo" @click="guardar">
          <LoaderCircleIcon v-if="subiendo" class="animate-spin" />
          <UploadIcon v-else />
          Subir documento
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
