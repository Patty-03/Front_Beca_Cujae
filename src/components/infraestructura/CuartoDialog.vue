<script setup lang="ts">
import type { CuartoResumen, EscaleraResumen, EstadoConstructivo } from '@/types/infraestructura'
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
import { actualizarCuarto, crearCuarto } from '@/services/infraestructura'

const props = defineProps<{
  estados: EstadoConstructivo[]
  escaleras: EscaleraResumen[]
  cuarto?: CuartoResumen | null
  escaleraIdInicial?: number
}>()

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ guardado: [cuarto: CuartoResumen] }>()

const nombre = ref('')
const capacidad = ref('4')
const estadoId = ref('')
const escaleraId = ref('')
const error = ref('')
const guardando = ref(false)

const esEdicion = computed(() => Boolean(props.cuarto))

watch(open, (abierto) => {
  if (!abierto) return
  nombre.value = props.cuarto?.nombre ?? ''
  capacidad.value = String(props.cuarto?.capacidadMaxima ?? 4)
  estadoId.value = String(props.cuarto?.estado.id ?? props.estados[0]?.id ?? '')
  escaleraId.value = String(
    props.cuarto?.escaleraId ?? props.escaleraIdInicial ?? props.escaleras[0]?.id ?? '',
  )
  error.value = ''
})

async function guardar() {
  error.value = ''
  const nombreLimpio = nombre.value.trim()
  const capacidadNumero = Number(capacidad.value)
  const idEstado = Number(estadoId.value)
  const idEscalera = Number(escaleraId.value)

  if (nombreLimpio.length < 3) {
    error.value = 'El nombre del cuarto debe tener al menos 3 caracteres.'
    return
  }

  if (!Number.isInteger(capacidadNumero) || capacidadNumero <= 0) {
    error.value = 'La capacidad debe ser un número entero mayor que cero.'
    return
  }

  if (props.cuarto && capacidadNumero < props.cuarto.ocupados) {
    error.value = `La capacidad no puede ser menor que las ${props.cuarto.ocupados} plazas ocupadas.`
    return
  }

  if (!idEstado) {
    error.value = 'Seleccione un estado constructivo.'
    return
  }

  if (!props.cuarto && !idEscalera) {
    error.value = 'Seleccione una escalera.'
    return
  }

  guardando.value = true
  try {
    const resultado = props.cuarto
      ? await actualizarCuarto(props.cuarto.id, {
          nombre: nombreLimpio,
          capacidadMaxima: capacidadNumero,
          estadoConstructivoId: idEstado,
        })
      : await crearCuarto(idEscalera, {
          nombre: nombreLimpio,
          capacidadMaxima: capacidadNumero,
          estadoConstructivoId: idEstado,
        })

    toast.success(esEdicion.value ? 'Cuarto actualizado' : 'Cuarto registrado', {
      description: `${resultado.nombre} · ${resultado.capacidadMaxima} plazas`,
    })
    open.value = false
    emit('guardado', resultado)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo guardar el cuarto.'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ esEdicion ? 'Editar cuarto' : 'Nuevo cuarto' }}</DialogTitle>
        <DialogDescription>
          {{
            esEdicion
              ? 'Actualiza los datos del cuarto. La escalera asignada no se puede cambiar.'
              : 'Registra un cuarto dentro de una escalera del edificio.'
          }}
        </DialogDescription>
      </DialogHeader>

      <form class="grid gap-4" @submit.prevent="guardar">
        <div class="grid gap-2">
          <Label for="cuarto-nombre">Nombre</Label>
          <Input
            id="cuarto-nombre"
            v-model="nombre"
            placeholder="Ej. 1504"
            maxlength="40"
            autocomplete="off"
          />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="grid gap-2">
            <Label for="cuarto-capacidad">Capacidad máxima</Label>
            <Input
              id="cuarto-capacidad"
              v-model="capacidad"
              type="number"
              min="1"
              max="20"
              inputmode="numeric"
            />
          </div>

          <div class="grid gap-2">
            <Label for="cuarto-estado">Estado constructivo</Label>
            <Select v-model="estadoId">
              <SelectTrigger id="cuarto-estado" class="w-full">
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
        </div>

        <div class="grid gap-2">
          <Label for="cuarto-escalera">Escalera</Label>
          <Select v-model="escaleraId" :disabled="esEdicion">
            <SelectTrigger id="cuarto-escalera" class="w-full">
              <SelectValue placeholder="Seleccione una escalera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="escalera in props.escaleras"
                :key="escalera.id"
                :value="String(escalera.id)"
              >
                {{ escalera.nombre }}
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
            {{ esEdicion ? 'Guardar cambios' : 'Registrar cuarto' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
