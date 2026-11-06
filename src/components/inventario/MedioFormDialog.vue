<script setup lang="ts">
import type { EstadoMedio, MedioDeCuarto, TipoMedio } from '@/types/inventario'
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
import { Textarea } from '@/components/ui/textarea'
import {
  ESTADOS_MEDIO,
  ETIQUETAS_ESTADO_MEDIO,
  ETIQUETAS_TIPO_MEDIO,
  TIPOS_MEDIO,
} from '@/lib/inventario'
import { LIMITES, validarCantidadMedio, validarObservacionesMedio } from '@/lib/validation'
import { actualizarMedio, crearMedio } from '@/services/inventario'

const props = defineProps<{
  cuartoId: number
  cuartoNombre: string
  medio?: MedioDeCuarto | null
}>()

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ guardado: [medio: MedioDeCuarto] }>()

const tipo = ref<TipoMedio | ''>('')
const cantidad = ref('1')
const estado = ref<EstadoMedio | ''>('')
const observaciones = ref('')
const error = ref('')
const guardando = ref(false)

const esEdicion = computed(() => Boolean(props.medio))
const tipoInvalido = computed(
  () => Boolean(error.value) && tipo.value === '',
)
const estadoInvalido = computed(
  () => Boolean(error.value) && estado.value === '',
)

watch(open, (abierto) => {
  if (!abierto) return
  tipo.value = props.medio?.tipo ?? ''
  cantidad.value = String(props.medio?.cantidad ?? 1)
  estado.value = props.medio?.estado ?? 'bueno'
  observaciones.value = props.medio?.observaciones ?? ''
  error.value = ''
})

async function guardar() {
  error.value = ''

  if (!props.cuartoId) {
    error.value = 'Seleccione primero un cuarto.'
    return
  }

  if (!tipo.value) {
    error.value = 'Seleccione un tipo de medio.'
    return
  }

  if (!estado.value) {
    error.value = 'Seleccione un estado para el medio.'
    return
  }

  let cantidadNumero = 0
  let observacionesLimpio: string | undefined

  try {
    cantidadNumero = validarCantidadMedio(cantidad.value)
    observacionesLimpio = validarObservacionesMedio(observaciones.value)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Los datos no son válidos.'
    return
  }

  guardando.value = true
  try {
    const resultado = props.medio
      ? await actualizarMedio(props.medio.id, {
          tipo: tipo.value,
          cantidad: cantidadNumero,
          estado: estado.value,
          observaciones: observacionesLimpio,
        })
      : await crearMedio({
          cuartoId: props.cuartoId,
          tipo: tipo.value,
          cantidad: cantidadNumero,
          estado: estado.value,
          observaciones: observacionesLimpio,
        })

    toast.success(esEdicion.value ? 'Medio actualizado' : 'Medio registrado', {
      description: props.cuartoNombre,
    })
    open.value = false
    emit('guardado', resultado)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo guardar el medio.'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ esEdicion ? 'Editar medio' : 'Nuevo medio' }}</DialogTitle>
        <DialogDescription>
          {{
            esEdicion
              ? `Actualiza el medio registrado en el cuarto ${props.cuartoNombre}.`
              : `Registra un medio (taquilla, cama, colchón, etc.) en el cuarto ${props.cuartoNombre}.`
          }}
        </DialogDescription>
      </DialogHeader>

      <form class="grid gap-4" @submit.prevent="guardar">
        <div class="grid gap-2">
          <Label :for="'medio-tipo'">Tipo de medio</Label>
          <Select v-model="tipo">
            <SelectTrigger
              id="medio-tipo"
              class="w-full"
              :aria-invalid="tipoInvalido"
            >
              <SelectValue placeholder="Seleccione un tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="item in TIPOS_MEDIO" :key="item" :value="item">
                {{ ETIQUETAS_TIPO_MEDIO[item] }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="grid gap-2">
            <Label for="medio-cantidad">Cantidad</Label>
            <Input
              id="medio-cantidad"
              v-model="cantidad"
              type="number"
              :min="LIMITES.cantidadMedioMinima"
              :max="LIMITES.cantidadMedioMaxima"
              inputmode="numeric"
            />
          </div>

          <div class="grid gap-2">
            <Label for="medio-estado">Estado</Label>
            <Select v-model="estado">
              <SelectTrigger
                id="medio-estado"
                class="w-full"
                :aria-invalid="estadoInvalido"
              >
                <SelectValue placeholder="Seleccione un estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="item in ESTADOS_MEDIO" :key="item" :value="item">
                  {{ ETIQUETAS_ESTADO_MEDIO[item] }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="grid gap-2">
          <Label for="medio-observaciones">Observaciones (opcional)</Label>
          <Textarea
            id="medio-observaciones"
            v-model="observaciones"
            :maxlength="LIMITES.observacionesMedio"
            placeholder="Ej. Dos del total necesitan herrajes nuevos"
            class="min-h-20"
            autocomplete="off"
          />
        </div>

        <p v-if="error" role="alert" class="text-destructive text-sm">{{ error }}</p>

        <DialogFooter>
          <DialogClose as-child>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button type="submit" :disabled="guardando">
            <LoaderCircleIcon v-if="guardando" class="animate-spin" />
            {{ esEdicion ? 'Guardar cambios' : 'Registrar medio' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
