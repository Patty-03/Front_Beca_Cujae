<script setup lang="ts">
import type { ProcesoLeer, RestriccionCrearInput, RestriccionLeer } from '@/types/alojamiento'
import { computed, ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SelectorCuartos from './SelectorCuartos.vue'
import { PlusIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'

const props = withDefaults(
  defineProps<{
    proceso: ProcesoLeer | null
    restricciones: RestriccionLeer[]
    guardando?: boolean
  }>(),
  { guardando: false },
)

const emit = defineEmits<{
  agregar: [RestriccionCrearInput]
  quitar: [RestriccionLeer]
  editarVersion: [ProcesoLeer]
  ejecutar: []
}>()

const tipoSeleccionado = ref<'obligatoria' | 'deseable'>('obligatoria')
const exclusiva = ref(false)
const cuartoIds = ref<number[]>([])

const obligatorias = computed(() =>
  props.restricciones.filter((r) => !r.relajable),
)
const deseables = computed(() =>
  props.restricciones.filter((r) => r.relajable),
)

function agregarRestriccion() {
  if (!props.proceso) return
  if (cuartoIds.value.length === 0) {
    toast.warning('Selecciona al menos un cuarto.')
    return
  }
  const input: RestriccionCrearInput = {
    conjuntoReglaId: props.proceso.conjuntoReglaId,
    cuartoIds: [...cuartoIds.value],
    relajable: tipoSeleccionado.value === 'deseable',
    exclusiva: exclusiva.value,
  }
  emit('agregar', input)
  cuartoIds.value = []
  exclusiva.value = false
}

function quitarRestriccion(r: RestriccionLeer) {
  emit('quitar', r)
}

function editarVersion() {
  if (props.proceso) emit('editarVersion', props.proceso)
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="!props.proceso" class="flex flex-col items-center gap-2 py-8 text-center">
      <p class="text-muted-foreground text-sm">
        Selecciona un proceso para gestionar sus reglas de asignación de cuartos.
      </p>
    </div>

    <div v-if="props.proceso">
      <div class="flex items-center gap-3">
        <span class="font-semibold text-sm">Conjunto de reglas:</span>
        <span class="font-medium">{{ props.proceso.conjunto }}</span>
        <Badge variant="secondary">v{{ props.proceso.conjuntoVersion }}</Badge>
      </div>

      <Tabs v-model="tipoSeleccionado" class="w-full">
        <TabsList>
          <TabsTrigger value="obligatoria"> Reglas obligatorias </TabsTrigger>
          <TabsTrigger value="deseable"> Reglas deseables </TabsTrigger>
        </TabsList>

        <TabsContent value="obligatoria" class="mt-4">
          <div v-if="obligatorias.length === 0" class="text-center py-4 text-xs text-muted-foreground">
            Sin reglas obligatorias.
          </div>
          <div v-else class="space-y-1">
            <div
              v-for="r in obligatorias"
              :key="r.id"
              class="flex items-center gap-2 p-2 rounded-md border bg-muted/50 text-sm"
            >
              <span class="shrink-0 font-medium">{{ r.cuarto }}</span>
              <Badge variant="secondary">Obligatoria</Badge>
              <button
                class="ml-auto p-1 hover:bg-red-50 rounded"
                @click="quitarRestriccion(r)"
                title="Quitar restricción"
              >
                <span class="text-red-500">×</span>
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="deseable" class="mt-4">
          <div v-if="deseables.length === 0" class="text-center py-4 text-xs text-muted-foreground">
            Sin reglas deseables.
          </div>
          <div v-else class="space-y-1">
            <div
              v-for="r in deseables"
              :key="r.id"
              class="flex items-center gap-2 p-2 rounded-md border bg-muted/50 text-sm"
            >
              <span class="shrink-0 font-medium">{{ r.cuarto }}</span>
              <Badge variant="outline">Deseable</Badge>
              <Badge v-if="r.exclusiva" variant="destructive" class="ml-1">Exclusiva</Badge>
              <button
                class="ml-auto p-1 hover:bg-red-50 rounded"
                @click="quitarRestriccion(r)"
                title="Quitar restricción"
              >
                <span class="text-red-500">×</span>
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Agregar restricción</CardTitle>
          <CardDescription>
            Selecciona cuartos, si es obligatoria o deseable y si es exclusiva.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div class="flex flex-col gap-1">
              <Label>Tipo de regla</Label>
              <div class="flex gap-2">
                <label class="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="tipo-regla"
                    value="obligatoria"
                    v-model="tipoSeleccionado"
                    class="rounded border-input text-primary"
                  />
                  <span class="text-sm">Obligatoria</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="tipo-regla"
                    value="deseable"
                    v-model="tipoSeleccionado"
                    class="rounded border-input text-primary"
                  />
                  <span class="text-sm">Deseable</span>
                </label>
              </div>
            </div>
            <div class="flex flex-col gap-1">
              <Label class="flex items-center gap-1">
                <input
                  type="checkbox"
                  v-model="exclusiva"
                  class="rounded border-input text-primary"
                />
                Exclusiva
              </Label>
              <p class="text-xs text-muted-foreground">
                Solo un estudiante podrá ocupar estos cuartos.
              </p>
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <Label>Cuartos</Label>
            <SelectorCuartos
              v-model:modeloValue="cuartoIds"
              :disabled="props.guardando"
            />
          </div>
          <Button
            type="button"
            :disabled="
              props.guardando ||
              cuartoIds.length === 0 ||
              !props.proceso
            "
            @click="agregarRestriccion"
          >
            <PlusIcon class="size-4 mr-1" />
            Agregar restricción
          </Button>
        </CardContent>
      </Card>

      <div class="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          :disabled="props.guardando || !props.proceso"
          @click="editarVersion"
        >
          Editar versión del conjunto
        </Button>
        <Button
          type="button"
          :disabled="props.guardando || !props.proceso"
          @click="emit('ejecutar')"
        >
          Ejecutar asignación
        </Button>
      </div>
    </div>
  </div>
</template>
