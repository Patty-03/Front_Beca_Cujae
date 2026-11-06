<script setup lang="ts">
import type { EdificioResumen, EstadoConstructivo } from '@/types/infraestructura'
import { computed, ref, watch } from 'vue'
import { LoaderCircleIcon, AlertCircleIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LIMITES, validarNombre } from '@/lib/validation'
import { actualizarEdificio, crearEdificio } from '@/services/infraestructura'

const props = defineProps<{
  estados: EstadoConstructivo[]
  edificio?: EdificioResumen | null
}>()

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ guardado: [edificio: EdificioResumen] }>()

const nombre = ref('')
const estadoId = ref('')
const observacion = ref('')
const forzarManual = ref(false)
const error = ref('')
const guardando = ref(false)

const esEdicion = computed(() => Boolean(props.edificio))

watch(open, (abierto) => {
  if (!abierto) return
  nombre.value = props.edificio?.nombre ?? ''
  estadoId.value = String(
    props.edificio?.estado.id ?? props.edificio?.estadoSugerido.id ?? props.estados[0]?.id ?? '',
  )
  observacion.value = props.edificio?.observacionEstado ?? ''
  forzarManual.value = props.edificio?.estadoManual ?? false
  error.value = ''
})

async function guardar() {
  error.value = ''
  let nombreLimpio = ''

  try {
    nombreLimpio = validarNombre(nombre.value, 'edificio', LIMITES.nombreEdificio)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'El nombre no es válido.'
    return
  }

  const idEstado = Number(estadoId.value)
  if (!idEstado) {
    error.value = 'Seleccione un estado constructivo.'
    return
  }

  if (forzarManual.value && !observacion.value.trim()) {
    error.value = 'Debe agregar una observación o justificación para fijar el estado manualmente.'
    return
  }

  guardando.value = true
  try {
    const resultado = props.edificio
      ? await actualizarEdificio(props.edificio.id, {
          nombre: nombreLimpio,
          estadoConstructivoId: idEstado,
          estadoManual: forzarManual.value,
          observacionEstado: observacion.value.trim() || undefined,
        })
      : await crearEdificio({
          nombre: nombreLimpio,
          estadoConstructivoId: idEstado,
          estadoManual: forzarManual.value,
          observacionEstado: observacion.value.trim() || undefined,
        })

    toast.success(esEdicion.value ? 'Edificio actualizado' : 'Edificio registrado', {
      description: `${resultado.nombre} · ${resultado.estado.nombre}`,
    })
    open.value = false
    emit('guardado', resultado)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo guardar el edificio.'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ esEdicion ? 'Editar edificio' : 'Nuevo edificio' }}</DialogTitle>
        <DialogDescription>
          {{
            esEdicion
              ? 'Actualiza el nombre, el estado y las observaciones del edificio.'
              : 'Registra un edificio dentro del inventario de infraestructura.'
          }}
        </DialogDescription>
      </DialogHeader>

      <form class="grid gap-4" @submit.prevent="guardar">
        <div class="grid gap-2">
          <Label for="edificio-nombre">Nombre</Label>
          <Input
            id="edificio-nombre"
            v-model="nombre"
            placeholder="Ej. Edificio I"
            maxlength="80"
            autocomplete="off"
            :aria-invalid="Boolean(error)"
          />
        </div>

        <div v-if="esEdicion && props.edificio" class="rounded-lg border p-3 bg-muted/30 text-sm space-y-1">
          <p class="font-medium text-muted-foreground flex items-center gap-1.5">
            <AlertCircleIcon class="size-4 text-primary" />
            Estado sugerido por el sistema:
            <span class="font-semibold text-foreground">{{ props.edificio.estadoSugerido.nombre }}</span>
          </p>
          <p class="text-xs text-muted-foreground">
            Calculado automáticamente en función del estado de sus cuartos. Puedes sobrescribirlo abajo si existen factores externos (ej. problemas eléctricos/hidráulicos).
          </p>
        </div>

        <div class="grid gap-2">
          <div class="flex items-center justify-between">
            <Label for="edificio-estado">Estado constructivo definitivo</Label>
            <label class="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input v-model="forzarManual" type="checkbox" class="rounded border-input text-primary accent-primary" />
              Fijar manualmente
            </label>
          </div>
          <Select v-model="estadoId">
            <SelectTrigger id="edificio-estado" class="w-full">
              <SelectValue placeholder="Seleccione un estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="estado in props.estados"
                :key="estado.id"
                :value="String(estado.id)"
              >
                {{ estado.nombre }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="grid gap-2">
          <Label for="edificio-observacion">Observación / Justificación</Label>
          <Textarea
            id="edificio-observacion"
            v-model="observacion"
            placeholder="Ej. Falla en la instalación eléctrica central..."
            rows="3"
          />
        </div>

        <p v-if="error" role="alert" class="text-destructive text-sm">
          {{ error }}
        </p>

        <DialogFooter>
          <DialogClose as-child>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button type="submit" :disabled="guardando">
            <LoaderCircleIcon v-if="guardando" class="animate-spin mr-1" />
            {{ esEdicion ? 'Guardar cambios' : 'Registrar edificio' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
