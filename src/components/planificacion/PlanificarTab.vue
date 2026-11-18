<script setup lang="ts">
import type { PeriodoLeer, PlanLeer, TipoDeberLeer } from '@/types/planificacion'
import type {
  ConjuntoCrearInput,
  ConjuntoResumen,
  ConjuntoVersionInput,
} from '@/types/reglas'
import { computed, onMounted, ref, watch } from 'vue'
import {
  AlertCircleIcon,
  ArrowRightIcon,
  BookOpenIcon,
  LoaderCircleIcon,
  LockIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
} from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import ConfirmDialog from '@/components/infraestructura/ConfirmDialog.vue'
import EditorConjuntoRegla from '@/components/reglas/EditorConjuntoRegla.vue'
import {
  actualizarPlan,
  agregarPlan,
  listarPlanes,
  listarTiposDeber,
  quitarPlan,
} from '@/services/planificacion'
import { crearConjunto, listarConjuntos } from '@/services/reglas'
import { toast } from 'vue-sonner'

const props = defineProps<{ periodo: PeriodoLeer }>()
const emit = defineEmits<{ actualizado: []; 'ir-generar': [] }>()

const planes = ref<PlanLeer[]>([])
const tipos = ref<TipoDeberLeer[]>([])
const conjuntos = ref<ConjuntoResumen[]>([])
const cargando = ref(true)
const error = ref('')

const dialogAbierto = ref(false)
const planEditando = ref<PlanLeer | null>(null)
const guardando = ref(false)
const planEliminar = ref<PlanLeer | null>(null)
const eliminando = ref(false)
const conjuntoEditorAbierto = ref(false)

const planForm = ref({ tipoDeberId: 0, conjuntoReglaId: 0 })

const cerrado = computed(() => props.periodo.estado === 'CERRADO')
const tiposDisponibles = computed(() => {
  const usados = new Set(
    planes.value
      .filter((plan) => plan.id !== planEditando.value?.id)
      .map((plan) => plan.tipoDeberId),
  )
  return tipos.value.filter((tipo) => tipo.activo && !usados.has(tipo.id))
})

const nombreConjuntoSugerido = computed(() => {
  const tipo = tipos.value.find((item) => item.id === planForm.value.tipoDeberId)
  return `Rotación ${tipo?.nombre ?? 'de deber'}`
})

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const [planesPeriodo, tiposDeber, conjuntosDeber] = await Promise.all([
      listarPlanes(props.periodo.id),
      listarTiposDeber(),
      listarConjuntos({ ambito: 'DEBER', vigente: true }),
    ])
    planes.value = planesPeriodo
    tipos.value = tiposDeber
    conjuntos.value = conjuntosDeber
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : 'No se pudieron cargar los planes.'
  } finally {
    cargando.value = false
  }
}

function abrirAgregar() {
  planEditando.value = null
  planForm.value = { tipoDeberId: 0, conjuntoReglaId: 0 }
  dialogAbierto.value = true
}

function abrirEditar(plan: PlanLeer) {
  planEditando.value = plan
  planForm.value = {
    tipoDeberId: plan.tipoDeberId,
    conjuntoReglaId: plan.conjuntoReglaId,
  }
  dialogAbierto.value = true
}

async function guardarPlan() {
  const form = planForm.value
  if (!form.tipoDeberId || !form.conjuntoReglaId) {
    toast.warning('Selecciona el tipo de deber y el conjunto de reglas.')
    return
  }
  guardando.value = true
  try {
    if (planEditando.value) {
      await actualizarPlan(props.periodo.id, planEditando.value.id, {
        conjuntoReglaId: form.conjuntoReglaId,
      })
      toast.success('Plan actualizado')
    } else {
      await agregarPlan(props.periodo.id, {
        tipoDeberId: form.tipoDeberId,
        conjuntoReglaId: form.conjuntoReglaId,
      })
      toast.success('Plan agregado')
    }
    dialogAbierto.value = false
    await cargar()
    emit('actualizado')
  } catch (caught) {
    toast.error('No se pudo guardar el plan', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    guardando.value = false
  }
}

async function confirmarQuitar() {
  const plan = planEliminar.value
  if (!plan) return
  eliminando.value = true
  try {
    await quitarPlan(props.periodo.id, plan.id)
    toast.success('Plan quitado')
    planEliminar.value = null
    await cargar()
    emit('actualizado')
  } catch (caught) {
    toast.error('No se pudo quitar el plan', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    eliminando.value = false
  }
}

async function crearConjuntoDeber(input: ConjuntoCrearInput | ConjuntoVersionInput) {
  if (!('nombre' in input)) return
  try {
    const creado = await crearConjunto(input)
    toast.success('Conjunto de reglas creado', { description: creado.nombre })
    conjuntoEditorAbierto.value = false
    conjuntos.value = await listarConjuntos({ ambito: 'DEBER', vigente: true })
    planForm.value.conjuntoReglaId = creado.id
  } catch (caught) {
    toast.error('No se pudo crear el conjunto de reglas', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  }
}

watch(() => props.periodo.id, cargar)
onMounted(cargar)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h3 class="text-base font-semibold">Planes del período</h3>
        <p class="text-muted-foreground mt-0.5 text-sm">
          Cada plan asocia un tipo de deber con un conjunto de reglas. La generación usa
          estos planes para crear las ocurrencias.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" :disabled="cargando" @click="cargar">
          <RefreshCwIcon :class="{ 'animate-spin': cargando }" />
          Refrescar
        </Button>
        <Button :disabled="cerrado" @click="abrirAgregar">
          <PlusIcon />
          Agregar plan
        </Button>
      </div>
    </div>

    <Alert v-if="error" variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>No se pudieron cargar los planes</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <Alert v-if="cerrado">
      <LockIcon />
      <AlertTitle>Período cerrado</AlertTitle>
      <AlertDescription>
        La planificación quedó inmutable. Puedes consultar los planes y asignaciones, pero no
        modificarlos.
      </AlertDescription>
    </Alert>

    <div v-if="cargando" class="text-muted-foreground flex items-center gap-2 py-6 text-sm">
      <LoaderCircleIcon class="animate-spin" />
      Cargando planes…
    </div>

    <template v-else>
      <Alert v-if="planes.length === 0">
        <BookOpenIcon />
        <AlertTitle>El período aún no tiene planes</AlertTitle>
        <AlertDescription>
          Agrega al menos un plan para poder generar ocurrencias y publicar el período.
        </AlertDescription>
      </Alert>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card v-for="plan in planes" :key="plan.id">
          <CardHeader>
            <div class="flex items-start justify-between gap-2">
              <div>
                <CardTitle>{{ plan.tipoDeber }}</CardTitle>
                <CardDescription>Plan #{{ plan.id }}</CardDescription>
              </div>
              <Badge variant="secondary">v{{ plan.conjuntoVersion }}</Badge>
            </div>
          </CardHeader>
          <CardContent class="space-y-3">
            <div>
              <div class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Conjunto de reglas
              </div>
              <div class="text-sm font-medium">{{ plan.conjunto }}</div>
              <div class="text-muted-foreground text-xs">#{{ plan.conjuntoReglaId }}</div>
            </div>
            <div class="flex justify-end gap-1">
              <Button
                variant="outline"
                size="sm"
                :disabled="cerrado"
                @click="abrirEditar(plan)"
              >
                <PencilIcon />
                Cambiar conjunto
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                :disabled="cerrado"
                title="Quitar plan"
                @click="planEliminar = plan"
              >
                <Trash2Icon />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Siguiente paso</CardTitle>
          <CardDescription>
            Con los planes listos, genera las ocurrencias del período en la pestaña Generar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button :disabled="planes.length === 0" @click="emit('ir-generar')">
            Ir a generar
            <ArrowRightIcon />
          </Button>
        </CardContent>
      </Card>
    </template>

    <Dialog v-model:open="dialogAbierto">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ planEditando ? 'Cambiar conjunto de reglas' : 'Agregar plan' }}</DialogTitle>
          <DialogDescription>
            Un tipo de deber solo puede tener un plan por período.
          </DialogDescription>
        </DialogHeader>

        <div class="grid gap-4">
          <div class="space-y-1.5">
            <Label>Tipo de deber</Label>
            <Select v-model="planForm.tipoDeberId" :disabled="!!planEditando">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="tipo in planEditando ? tipos : tiposDisponibles"
                  :key="tipo.id"
                  :value="tipo.id"
                >
                  {{ tipo.nombre }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label>Conjunto de reglas</Label>
            <div class="flex gap-2">
              <Select v-model="planForm.conjuntoReglaId" class="flex-1">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Selecciona un conjunto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="conjunto in conjuntos"
                    :key="conjunto.id"
                    :value="conjunto.id"
                  >
                    {{ conjunto.nombre }} (v{{ conjunto.version }})
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Crear conjunto de reglas"
                @click="conjuntoEditorAbierto = true"
              >
                <PlusIcon />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose as-child>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button type="button" :disabled="guardando" @click="guardarPlan">
            <LoaderCircleIcon v-if="guardando" class="animate-spin" />
            {{ planEditando ? 'Guardar' : 'Agregar' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="conjuntoEditorAbierto">
      <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Nuevo conjunto de reglas de deber</DialogTitle>
          <DialogDescription>
            Define las condiciones y prioridades del conjunto.
          </DialogDescription>
        </DialogHeader>
        <EditorConjuntoRegla
          ambito="DEBER"
          :modelo="null"
          :nombre-sugerido="nombreConjuntoSugerido"
          @guardar="crearConjuntoDeber"
          @cancelar="conjuntoEditorAbierto = false"
        />
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      :open="planEliminar !== null"
      titulo="Quitar plan"
      :descripcion="`Se quitará el plan de ${planEliminar?.tipoDeber ?? ''}. Las ocurrencias ya generadas se conservan.`"
      confirm-label="Quitar"
      :cargando="eliminando"
      @update:open="(valor) => { if (!valor) planEliminar = null }"
      @confirmar="confirmarQuitar"
    />
  </div>
</template>
