<script setup lang="ts">
import type { EscaleraResumen } from '@/types/infraestructura'
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
import { actualizarEscalera, crearEscalera } from '@/services/infraestructura'

const props = defineProps<{
  edificioId: number
  escalera?: EscaleraResumen | null
}>()

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ guardado: [escalera: EscaleraResumen] }>()

const nombre = ref('')
const error = ref('')
const guardando = ref(false)

const esEdicion = computed(() => Boolean(props.escalera))

watch(open, (abierto) => {
  if (!abierto) return
  nombre.value = props.escalera?.nombre ?? ''
  error.value = ''
})

async function guardar() {
  error.value = ''
  const nombreLimpio = nombre.value.trim()

  if (nombreLimpio.length < 3) {
    error.value = 'El nombre de la escalera debe tener al menos 3 caracteres.'
    return
  }

  guardando.value = true
  try {
    const resultado = props.escalera
      ? await actualizarEscalera(props.escalera.id, { nombre: nombreLimpio })
      : await crearEscalera(props.edificioId, { nombre: nombreLimpio })

    toast.success(esEdicion.value ? 'Escalera actualizada' : 'Escalera registrada', {
      description: resultado.nombre,
    })
    open.value = false
    emit('guardado', resultado)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo guardar la escalera.'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ esEdicion ? 'Editar escalera' : 'Nueva escalera' }}</DialogTitle>
        <DialogDescription>
          {{
            esEdicion
              ? 'Actualiza el nombre de la escalera seleccionada.'
              : 'Agrega una escalera al edificio para organizar sus cuartos.'
          }}
        </DialogDescription>
      </DialogHeader>

      <form class="grid gap-4" @submit.prevent="guardar">
        <div class="grid gap-2">
          <Label for="escalera-nombre">Nombre</Label>
          <Input
            id="escalera-nombre"
            v-model="nombre"
            placeholder="Ej. Escalera 5 - Ala Norte"
            maxlength="80"
            autocomplete="off"
          />
        </div>

        <p v-if="error" class="text-destructive text-sm">{{ error }}</p>

        <DialogFooter>
          <DialogClose as-child>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button type="submit" :disabled="guardando">
            <LoaderCircleIcon v-if="guardando" class="animate-spin" />
            {{ esEdicion ? 'Guardar cambios' : 'Registrar escalera' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
