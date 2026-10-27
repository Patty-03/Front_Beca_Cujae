<script setup lang="ts">
import { LoaderCircleIcon } from '@lucide/vue'
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

const props = withDefaults(
  defineProps<{
    titulo: string
    descripcion: string
    confirmLabel?: string
    cargando?: boolean
  }>(),
  {
    confirmLabel: 'Eliminar',
    cargando: false,
  },
)

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ confirmar: [] }>()
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ props.titulo }}</DialogTitle>
        <DialogDescription>{{ props.descripcion }}</DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <DialogClose as-child>
          <Button type="button" variant="outline">Cancelar</Button>
        </DialogClose>
        <Button
          type="button"
          variant="destructive"
          :disabled="props.cargando"
          @click="emit('confirmar')"
        >
          <LoaderCircleIcon v-if="props.cargando" class="animate-spin" />
          {{ props.confirmLabel }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
