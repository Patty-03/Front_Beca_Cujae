<script setup lang="ts">
import type { AsignacionCuarto, EstudianteResumen, SugerenciaCuarto } from '@/types/estudiante'
import { computed, ref, watch } from 'vue'
import {
  BedDoubleIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  LoaderCircleIcon,
  SparklesIcon,
} from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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
import { Skeleton } from '@/components/ui/skeleton'
import { asignarCuarto, sugerirCuartos } from '@/services/estudiantes'

const props = defineProps<{ estudiante?: EstudianteResumen | null }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ asignado: [asignacion: AsignacionCuarto] }>()

const sugerencias = ref<SugerenciaCuarto[]>([])
const seleccionada = ref<number | null>(null)
const cargando = ref(false)
const asignando = ref(false)
const error = ref('')
const taquilla = ref('')
const desde = ref(new Date().toISOString().slice(0, 10))
const llaveEntregada = ref(false)
const llaveTaquillaEntregada = ref(false)

const cuartoElegido = computed(
  () => sugerencias.value.find((item) => item.cuartoId === seleccionada.value) ?? null,
)

watch(open, async (abierto) => {
  if (!abierto) return

  sugerencias.value = []
  seleccionada.value = null
  error.value = ''
  taquilla.value = ''
  desde.value = new Date().toISOString().slice(0, 10)
  llaveEntregada.value = false
  llaveTaquillaEntregada.value = false

  if (!props.estudiante) return

  cargando.value = true
  try {
    sugerencias.value = await sugerirCuartos(props.estudiante.id)
    seleccionada.value = sugerencias.value[0]?.cuartoId ?? null
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : 'No se pudieron calcular las sugerencias.'
  } finally {
    cargando.value = false
  }
})

async function guardar() {
  if (!props.estudiante || !seleccionada.value) {
    error.value = 'Seleccione un cuarto para continuar.'
    return
  }

  asignando.value = true
  error.value = ''

  try {
    const asignacion = await asignarCuarto(props.estudiante.id, {
      cuartoId: seleccionada.value,
      desde: desde.value || undefined,
      taquilla: taquilla.value.trim() || undefined,
      llaveEntregada: llaveEntregada.value,
      llaveTaquillaEntregada: llaveTaquillaEntregada.value,
    })

    toast.success('Cuarto asignado', {
      description: `${props.estudiante.nombre} · ${asignacion.cuartoNombre}`,
    })
    open.value = false
    emit('asignado', asignacion)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'No se pudo asignar el cuarto.'
  } finally {
    asignando.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Asignar cuarto</DialogTitle>
        <DialogDescription>
          {{ props.estudiante?.nombre }} · {{ props.estudiante?.carnet }}
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-5">
        <div
          v-if="props.estudiante?.asignacion"
          class="bg-muted/50 flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
        >
          <BedDoubleIcon class="size-4 shrink-0" />
          <span>
            Actualmente en
            <strong>{{ props.estudiante.asignacion.cuartoNombre }}</strong>
            ({{ props.estudiante.asignacion.edificioNombre }})
          </span>
        </div>

        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <SparklesIcon class="text-primary size-4" />
            <p class="text-sm font-medium">Sugerencias automáticas</p>
          </div>

          <div v-if="cargando" class="grid gap-2">
            <Skeleton v-for="indice in 3" :key="indice" class="h-24 w-full" />
          </div>

          <Alert v-else-if="error && sugerencias.length === 0" variant="destructive">
            <CircleAlertIcon />
            <AlertTitle>No se pudieron calcular las sugerencias</AlertTitle>
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>

          <Alert v-else-if="sugerencias.length === 0">
            <CircleAlertIcon />
            <AlertTitle>Sin cuartos compatibles</AlertTitle>
            <AlertDescription>
              No hay cuartos habitables con camas disponibles para este estudiante.
            </AlertDescription>
          </Alert>

          <div v-else class="grid gap-2">
            <label
              v-for="sugerencia in sugerencias"
              :key="sugerencia.cuartoId"
              class="hover:bg-muted/40 has-checked:border-primary has-checked:bg-primary/5 grid cursor-pointer gap-2 rounded-lg border p-3 transition-colors"
            >
              <input
                v-model="seleccionada"
                type="radio"
                name="cuarto-sugerido"
                class="sr-only"
                :value="sugerencia.cuartoId"
              />
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-medium">
                    Cuarto {{ sugerencia.cuartoNombre }}
                    <span class="text-muted-foreground font-normal">
                      · {{ sugerencia.edificioNombre }}
                    </span>
                  </p>
                  <p class="text-muted-foreground text-xs">
                    {{ sugerencia.escaleraNombre }} · {{ sugerencia.ocupados }} de
                    {{ sugerencia.capacidadMaxima }} camas ocupadas
                  </p>
                </div>
                <Badge :variant="sugerencia.disponibles > 0 ? 'secondary' : 'outline'">
                  {{ sugerencia.disponibles }} disponibles
                </Badge>
              </div>
              <div class="flex flex-wrap gap-1">
                <Badge
                  v-for="motivo in sugerencia.motivos"
                  :key="motivo"
                  variant="outline"
                  class="font-normal"
                >
                  {{ motivo }}
                </Badge>
                <Badge variant="ghost" class="font-normal">
                  Afinidad {{ sugerencia.puntuacion }}
                </Badge>
              </div>
            </label>
          </div>
        </div>

        <div v-if="cuartoElegido" class="grid gap-4 sm:grid-cols-2">
          <div class="grid gap-2">
            <Label for="asignacion-desde">Fecha de asignación</Label>
            <Input id="asignacion-desde" v-model="desde" type="date" />
          </div>
          <div class="grid gap-2">
            <Label for="asignacion-taquilla">Taquilla</Label>
            <Input
              id="asignacion-taquilla"
              v-model="taquilla"
              placeholder="Ej. T-012"
              maxlength="20"
              autocomplete="off"
            />
          </div>
          <label class="flex items-center gap-2 text-sm">
            <input v-model="llaveEntregada" type="checkbox" class="accent-primary size-4" />
            Llave del cuarto entregada
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input
              v-model="llaveTaquillaEntregada"
              type="checkbox"
              class="accent-primary size-4"
            />
            Llave de la taquilla entregada
          </label>
        </div>

        <Alert v-if="error && sugerencias.length > 0" variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>No se pudo asignar el cuarto</AlertTitle>
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>

        <p v-if="cuartoElegido" class="text-muted-foreground flex items-center gap-1.5 text-xs">
          <CheckCircle2Icon class="size-3.5" />
          Se asignará el cuarto {{ cuartoElegido.cuartoNombre }} y se actualizará la ocupación.
        </p>
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button type="button" variant="outline">Cancelar</Button>
        </DialogClose>
        <Button
          type="button"
          :disabled="asignando || cargando || !seleccionada"
          @click="guardar"
        >
          <LoaderCircleIcon v-if="asignando" class="animate-spin" />
          Confirmar asignación
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
