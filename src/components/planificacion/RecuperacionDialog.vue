<script setup lang="ts">
import type { AsignacionLeer, OcurrenciaLeer } from '@/types/planificacion'
import { ref, watch } from 'vue'
import { AlertCircleIcon, LoaderCircleIcon } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { listarOcurrencias, recuperar } from '@/services/planificacion'
import { formatDate } from '@/lib/format'
import { hoyIso } from '@/lib/planificacion'
import { toast } from 'vue-sonner'

const props = defineProps<{
  asignacion: AsignacionLeer | null
  periodoPlanificacionId: number
}>()
const emit = defineEmits<{ recuperado: [] }>()
const open = defineModel<boolean>('open', { default: false })

const ocurrencias = ref<OcurrenciaLeer[]>([])
const seleccionada = ref<number | ''>('')
const cargando = ref(false)
const guardando = ref(false)
const error = ref('')

watch(open, async (valor) => {
  if (!valor || !props.asignacion) return
  seleccionada.value = ''
  error.value = ''
  cargando.value = true
  try {
    const hoy = hoyIso()
    const lista = await listarOcurrencias({
      periodoPlanificacionId: props.periodoPlanificacionId,
      desde: hoy,
      tipoDeberId: props.asignacion.tipoDeberId,
      limit: 500,
    })
    ocurrencias.value = lista.filter(
      (ocurrencia) => !ocurrencia.cancelada && ocurrencia.fecha >= hoy,
    )
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : 'No se pudieron buscar las ocurrencias.'
  } finally {
    cargando.value = false
  }
})

async function guardar() {
  if (!props.asignacion || seleccionada.value === '') {
    toast.warning('Selecciona una ocurrencia de destino.')
    return
  }
  guardando.value = true
  try {
    await recuperar(props.asignacion.id, {
      ocurrenciaDeberId: Number(seleccionada.value),
    })
    toast.success('Recuperación registrada')
    open.value = false
    emit('recuperado')
  } catch (caught) {
    toast.error('No se pudo registrar la recuperación', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Recuperar deber</DialogTitle>
        <DialogDescription>
          La recuperación crea una asignación nueva en una ocurrencia futura del mismo tipo
          de deber. La deuda original queda cubierta.
        </DialogDescription>
      </DialogHeader>

      <div v-if="asignacion" class="rounded-md border p-3 text-sm">
        <div class="font-medium">{{ asignacion.estudiante }}</div>
        <div class="text-muted-foreground">
          {{ asignacion.tipoDeber }} · {{ formatDate(asignacion.fecha) }} ·
          {{ asignacion.configuracion }}
        </div>
      </div>

      <Alert v-if="error" variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>No se pudieron cargar las ocurrencias</AlertTitle>
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div v-if="cargando" class="text-muted-foreground flex items-center gap-2 text-sm">
        <LoaderCircleIcon class="animate-spin" />
        Buscando ocurrencias disponibles…
      </div>

      <div v-else class="space-y-1.5">
        <Label>Ocurrencia de destino</Label>
        <Select v-model="seleccionada" :disabled="ocurrencias.length === 0">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Selecciona una fecha futura" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="ocurrencia in ocurrencias"
              :key="ocurrencia.id"
              :value="ocurrencia.id"
            >
              {{ formatDate(ocurrencia.fecha) }} · {{ ocurrencia.configuracion }}
              ({{ ocurrencia.asignados }}/{{ ocurrencia.cantPersonas ?? '∞' }})
            </SelectItem>
          </SelectContent>
        </Select>
        <p v-if="ocurrencias.length === 0" class="text-muted-foreground text-xs">
          No hay ocurrencias futuras del mismo tipo en este período.
        </p>
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline">Cancelar</Button>
        </DialogClose>
        <Button
          :disabled="guardando || ocurrencias.length === 0 || seleccionada === ''"
          @click="guardar"
        >
          <LoaderCircleIcon v-if="guardando" class="animate-spin" />
          Registrar recuperación
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
