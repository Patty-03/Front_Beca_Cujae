<script setup lang="ts">
import type { PeriodoRegistro, ProcesoCrearInput, ProcesoLeer } from '@/types/alojamiento'
import type { ConjuntoCrearInput, ConjuntoResumen, ConjuntoVersionInput } from '@/types/reglas'
import { computed, ref, watch } from 'vue'
import { LoaderCircleIcon, PlusIcon } from '@lucide/vue'
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
import EditorConjuntoRegla from '@/components/reglas/EditorConjuntoRegla.vue'
import { crearProceso, listarPeriodosRegistro } from '@/services/alojamiento'
import { crearConjunto, listarConjuntos } from '@/services/reglas'
import { toast } from 'vue-sonner'

const emit = defineEmits<{ creado: [proceso: ProcesoLeer] }>()
const open = defineModel<boolean>('open', { default: false })

const guardando = ref(false)
const cargando = ref(false)
const periodos = ref<PeriodoRegistro[]>([])
const conjuntos = ref<ConjuntoResumen[]>([])
const conjuntoEditorAbierto = ref(false)

const form = ref({
  nombre: '',
  tipo: 'MASIVO' as 'MASIVO' | 'INDIVIDUAL',
  periodoRegistroId: 0,
  conjuntoReglaId: 0,
})

const nombreConjuntoSugerido = computed(() =>
  form.value.nombre.trim() ? `Reglas ${form.value.nombre.trim()}` : 'Reglas de alojamiento',
)

async function cargarDatos() {
  cargando.value = true
  try {
    const [p, c] = await Promise.all([
      listarPeriodosRegistro(),
      listarConjuntos({ ambito: 'ALOJAMIENTO', vigente: true }),
    ])
    periodos.value = p
    conjuntos.value = c
    if (!form.value.periodoRegistroId && p[0]) form.value.periodoRegistroId = p[0].id
  } catch (caught) {
    toast.error('No se pudieron cargar los datos iniciales', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    cargando.value = false
  }
}

watch(open, (valor) => {
  if (!valor) return
  form.value = { nombre: '', tipo: 'MASIVO', periodoRegistroId: 0, conjuntoReglaId: 0 }
  void cargarDatos()
})

async function crearConjuntoInline(input: ConjuntoCrearInput | ConjuntoVersionInput) {
  if (!('nombre' in input)) return
  try {
    const creado = await crearConjunto(input)
    conjuntos.value = await listarConjuntos({ ambito: 'ALOJAMIENTO', vigente: true })
    form.value.conjuntoReglaId = creado.id
    conjuntoEditorAbierto.value = false
    toast.success('Conjunto de reglas creado', { description: creado.nombre })
  } catch (caught) {
    toast.error('No se pudo crear el conjunto de reglas', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  }
}

async function guardar() {
  if (!form.value.nombre.trim()) {
    toast.warning('Ingresa el nombre del proceso.')
    return
  }
  if (!form.value.periodoRegistroId) {
    toast.warning('Selecciona un período de registro.')
    return
  }
  if (!form.value.conjuntoReglaId) {
    toast.warning('Selecciona o crea un conjunto de reglas.')
    return
  }
  guardando.value = true
  try {
    const input: ProcesoCrearInput = {
      nombre: form.value.nombre.trim(),
      tipo: form.value.tipo,
      periodoRegistroId: form.value.periodoRegistroId,
      conjuntoReglaId: form.value.conjuntoReglaId,
    }
    const proceso = await crearProceso(input)
    toast.success('Proceso creado')
    open.value = false
    emit('creado', proceso)
  } catch (caught) {
    toast.error('No se pudo crear el proceso', {
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
        <DialogTitle>Nuevo proceso de asignación</DialogTitle>
        <DialogDescription>
          Define el período y el conjunto de reglas base. Luego podrás configurar restricciones y ejecutar la asignación.
        </DialogDescription>
      </DialogHeader>

      <div v-if="cargando" class="text-muted-foreground flex items-center gap-2 py-4 text-sm">
        <LoaderCircleIcon class="animate-spin" />
        Cargando datos...
      </div>

      <div v-else class="grid gap-4">
        <div class="space-y-1.5">
          <Label for="proceso-nombre">Nombre</Label>
          <Input id="proceso-nombre" v-model="form.nombre" placeholder="Ej. Alojamiento curso 2026" />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-1.5">
            <Label>Tipo</Label>
            <Select v-model="form.tipo">
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MASIVO">Masivo</SelectItem>
                <SelectItem value="INDIVIDUAL">Individual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label>Período de registro</Label>
            <Select v-model="form.periodoRegistroId">
              <SelectTrigger class="w-full">
                <SelectValue :placeholder="periodos.length ? 'Seleccionar período' : 'Sin períodos'" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="p in periodos" :key="p.id" :value="p.id">
                  {{ p.inicio }} – {{ p.fin }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="!periodos.length" class="text-muted-foreground text-xs">No hay períodos de registro disponibles.</p>
          </div>
        </div>

        <div class="space-y-1.5">
          <Label>Conjunto de reglas (alojamiento)</Label>
          <div class="flex gap-2">
            <Select v-model="form.conjuntoReglaId" class="flex-1">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Seleccionar conjunto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="c in conjuntos" :key="c.id" :value="c.id">
                  {{ c.nombre }} (v{{ c.version }})
                </SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="icon" title="Crear conjunto de reglas" @click="conjuntoEditorAbierto = true">
              <PlusIcon />
            </Button>
          </div>
          <p class="text-muted-foreground text-xs">Puedes seleccionar un conjunto vigente o crear uno nuevo.</p>
        </div>
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button type="button" variant="outline">Cancelar</Button>
        </DialogClose>
        <Button type="button" :disabled="guardando || cargando" @click="guardar">
          <LoaderCircleIcon v-if="guardando" class="animate-spin" />
          Crear proceso
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <Dialog v-model:open="conjuntoEditorAbierto">
    <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle>Nuevo conjunto de reglas de alojamiento</DialogTitle>
        <DialogDescription>Define condiciones y prioridades para la asignación de cuartos.</DialogDescription>
      </DialogHeader>
      <EditorConjuntoRegla
        ambito="ALOJAMIENTO"
        :modelo="null"
        :nombre-sugerido="nombreConjuntoSugerido"
        @guardar="crearConjuntoInline"
        @cancelar="conjuntoEditorAbierto = false"
      />
    </DialogContent>
  </Dialog>
</template>
