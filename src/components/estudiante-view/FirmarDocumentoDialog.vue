<script setup lang="ts">
import type { Documento } from '@/types/estudiante-view'
import { ETIQUETAS_TIPO_DOCUMENTO } from '@/types/estudiante-view'
import { ref, watch } from 'vue'
import { CheckCircle2Icon, FileTextIcon, LoaderCircleIcon } from '@lucide/vue'
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
import { firmarDocumento } from '@/services/estudiante-view'

const props = defineProps<{ documento: Documento | null }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ firmado: [documento: Documento] }>()

const firmando = ref(false)

watch(open, (abierto) => {
  if (!abierto) {
    firmando.value = false
  }
})

async function firmar() {
  if (!props.documento) return
  firmando.value = true
  try {
    await firmarDocumento(props.documento.id)
    toast.success('Documento firmado', {
      description: `Ha firmado digitalmente ${props.documento.nombre}.`,
    })
    open.value = false
    emit('firmado', { ...props.documento, firmado: true })
  } catch (caught) {
    toast.error('No se pudo firmar el documento', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    firmando.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Firmar documento digitalmente</DialogTitle>
        <DialogDescription>
          {{ props.documento?.nombre }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <FileTextIcon class="size-6 text-muted-foreground" />
          <div>
            <p class="font-medium">{{ props.documento?.nombre }}</p>
            <p class="text-muted-foreground text-sm">
              {{ ETIQUETAS_TIPO_DOCUMENTO[props.documento!.tipo] }}
            </p>
          </div>
        </div>

        <p class="text-sm text-muted-foreground">
          Al firmar, usted acepta los términos y condiciones establecidos en este documento. La firma
          tiene validez legal y quedará registrada con fecha y hora.
        </p>

        <div class="pt-4 border-t">
          <p class="text-muted-foreground text-sm">
            Documento: {{ props.documento?.nombre }}
          </p>
          <p class="text-muted-foreground text-sm">
            Tipo: {{ ETIQUETAS_TIPO_DOCUMENTO[props.documento!.tipo] }}
          </p>
        </div>
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button type="button" variant="outline">Cancelar</Button>
        </DialogClose>
        <Button
          type="button"
          :disabled="firmando"
          @click="firmar"
        >
          <LoaderCircleIcon v-if="firmando" class="animate-spin" />
          <CheckCircle2Icon v-else />
          Firmar digitalmente
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
