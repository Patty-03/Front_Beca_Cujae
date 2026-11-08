<script setup lang="ts">
import type { CuartoResumen } from '@/types/infraestructura'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import MediosDeCuartoPanel from './MediosDeCuartoPanel.vue'

const props = defineProps<{
  cuarto: CuartoResumen | null
}>()

const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Medios del cuarto {{ props.cuarto?.nombre }}</DialogTitle>
        <DialogDescription>
          Administra las taquillas, camas, colchones y demás medios del cuarto.
        </DialogDescription>
      </DialogHeader>

      <MediosDeCuartoPanel
        v-if="props.cuarto"
        :cuarto-id="props.cuarto.id"
        :cuarto-nombre="props.cuarto.nombre"
      />
    </DialogContent>
  </Dialog>
</template>
