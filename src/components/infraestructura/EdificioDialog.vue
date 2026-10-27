<script setup lang="ts">
import type { EdificioResumen, EstadoConstructivo } from '@/types/infraestructura'
import { computed, ref, watch } from 'vue'
import { LoaderCircleIcon } from '@lucide/vue'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { actualizarEdificio, crearEdificio } from '@/services/infraestructura'

const props = defineProps<{
  estados: EstadoConstructivo[]
  edificio?: EdificioResumen | null
}>()

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ guardado: [edificio: EdificioResumen] }>()

const nombre = ref('')
const estadoId = ref('')
const error = ref('')
const guardando = ref(false)

const esEdicion = computed(() => Boolean(props.edificio))

watch(open, (abierto) => {
  if (!abierto) return
  nombre.value = props.edificio?.nombre ?? ''
  estadoId.value = String(props.edificio?.estado.id ?? props.estados[0]?.id ?? '')
  error.value = ''
})

async function guardar() {
  error.value = ''
  const nombreLimpio = nombre.value.trim()
  const idEstado = Number(estadoId.value)

  if (nombreLimpio.length < 3) {
    error.value = 'El nombre del edificio debe tener al menos 3 caracteres.'
    return
  }

  if (!idEstado) {
    error.value = 'Seleccione un estado constructivo.'
    return
  }

  guardando.value = true
  try {
    const resultado = props.edificio
      ? await actualizarEdificio(props.edificio.id, {
          nombre: nombreLimpio,
          estadoConstructivoId: idEstado,
        })
      : await crearEdificio({
          nombre: nombreLimpio,
          estadoConstructivoId: idEstado,
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
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ esEdicion ? 'Editar edificio' : 'Nuevo edificio' }}</DialogTitle>
        <DialogDescription>
          {{
            esEdicion
              ? 'Actualiza el nombre y el estado constructivo del edificio.'
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
          />
        </div>

        <div class="grid gap-2">
          <Label for="edificio-estado">Estado constructivo</Label>
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

        <p v-if="error" class="text-destructive text-sm">{{ error }}</p>

        <DialogFooter>
          <DialogClose as-child>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button type="submit" :disabled="guardando">
            <LoaderCircleIcon v-if="guardando" class="animate-spin" />
            {{ esEdicion ? 'Guardar cambios' : 'Registrar edificio' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
