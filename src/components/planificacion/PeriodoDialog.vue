<script setup lang="ts">
import type { PeriodoLeer } from '@/types/planificacion'
import { computed, ref, watch } from 'vue'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { actualizarPeriodo, crearPeriodo } from '@/services/planificacion'
import { toast } from 'vue-sonner'

const props = defineProps<{ periodo?: PeriodoLeer | null }>()
const emit = defineEmits<{ guardado: [] }>()
const open = defineModel<boolean>('open', { default: false })

const inicio = ref('')
const fin = ref('')
const guardando = ref(false)
const errorGuardar = ref<string | null>(null)

const editando = computed(() => props.periodo != null)

watch(open, (valor) => {
  if (!valor) return
  inicio.value = props.periodo?.inicio ?? ''
  fin.value = props.periodo?.fin ?? ''
  errorGuardar.value = null
})

watch([inicio, fin], () => {
  errorGuardar.value = null
})

async function guardar() {
  if (!inicio.value || !fin.value) {
    toast.warning('Indica la fecha de inicio y de fin.')
    return
  }
  if (fin.value < inicio.value) {
    toast.warning('La fecha fin no puede ser anterior al inicio.')
    return
  }
  guardando.value = true
  errorGuardar.value = null
  try {
    if (props.periodo) {
      await actualizarPeriodo(props.periodo.id, {
        inicio: inicio.value,
        fin: fin.value,
      })
      toast.success('PerÃ­odo actualizado')
    } else {
      await crearPeriodo({ inicio: inicio.value, fin: fin.value })
      toast.success('PerÃ­odo creado')
    }
    open.value = false
    emit('guardado')
  } catch (caught) {
    const mensaje =
      caught instanceof Error ? caught.message : 'No se pudo guardar el perÃ­odo.'
    errorGuardar.value = mensaje
    toast.error(
      editando.value ? 'No se pudo actualizar el perÃ­odo' : 'No se pudo crear el perÃ­odo',
      { description: mensaje },
    )
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ editando ? 'Editar perÃ­odo' : 'Nuevo perÃ­odo' }}</DialogTitle>
        <DialogDescription>
          Un perÃ­odo define el rango de fechas sobre el que se planifican los deberes.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-1.5">
          <Label for="periodo-inicio">Inicio</Label>
          <Input id="periodo-inicio" v-model="inicio" type="date" />
        </div>
        <div class="space-y-1.5">
          <Label for="periodo-fin">Fin</Label>
          <Input id="periodo-fin" v-model="fin" type="date" />
        </div>
      </div>

      <p class="text-muted-foreground text-xs">
        Solo los perÃ­odos en BORRADOR se pueden editar. Al publicarlo se habilita el uso
        operativo; al cerrarlo queda inmutable.
      </p>

      <Alert v-if="errorGuardar" variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>
          {{ editando ? 'No se pudo actualizar el perÃ­odo' : 'No se pudo crear el perÃ­odo' }}
        </AlertTitle>
        <AlertDescription>{{ errorGuardar }}</AlertDescription>
      </Alert>

      <DialogFooter>
        <DialogClose as-child>
          <Button type="button" variant="outline">Cancelar</Button>
        </DialogClose>
        <Button type="button" :disabled="guardando" @click="guardar">
          <LoaderCircleIcon v-if="guardando" class="animate-spin" />
          {{ editando ? 'Guardar cambios' : 'Crear perÃ­odo' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
