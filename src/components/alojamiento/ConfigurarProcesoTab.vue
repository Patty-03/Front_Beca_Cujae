<script setup lang="ts">
import type { ProcesoLeer, RestriccionCrearInput, RestriccionLeer } from '@/types/alojamiento'
import type { ConjuntoLeer, ConjuntoResumen, ConjuntoVersionInput } from '@/types/reglas'
import { computed, onMounted, ref, watch } from 'vue'
import {
  AlertCircleIcon,
  CopyIcon,
  LoaderCircleIcon,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import ConfirmDialog from '@/components/infraestructura/ConfirmDialog.vue'
import EditorConjuntoRegla from '@/components/reglas/EditorConjuntoRegla.vue'
import SelectorCuartos from '@/components/alojamiento/SelectorCuartos.vue'
import {
  agregarRestricciones,
  crearProceso,
  descartarProceso,
  quitarRestriccion,
} from '@/services/alojamiento'
import { crearVersionConjunto, listarConjuntos, obtenerConjunto } from '@/services/reglas'
import { esSoloLecturaProceso } from '@/lib/alojamiento'
import { toast } from 'vue-sonner'

const props = defineProps<{
  proceso: ProcesoLeer
  restricciones: RestriccionLeer[]
}>()
const emit = defineEmits<{
  actualizado: []
  'proceso-cambiado': [id: number]
}>()

const cargando = ref(false)
const error = ref('')
const conjunto = ref<ConjuntoLeer | null>(null)
const conjuntos = ref<ConjuntoResumen[]>([])

const versionDialogAbierto = ref(false)
const confirmarVersionAbierto = ref(false)
const versionando = ref(false)
const versionInput = ref<ConjuntoVersionInput | null>(null)

const restriccionForm = ref({
  conjuntoReglaId: 0,
  relajable: false,
  exclusiva: false,
  cuartoIds: [] as number[],
})
const agregandoRestriccion = ref(false)
const restriccionAQuitar = ref<RestriccionLeer | null>(null)
const quitando = ref(false)

const soloLectura = computed(() => esSoloLecturaProceso(props.proceso.estado))

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const [c, lista] = await Promise.all([
      obtenerConjunto(props.proceso.conjuntoReglaId),
      listarConjuntos({ ambito: 'ALOJAMIENTO', vigente: true }),
    ])
    conjunto.value = c
    conjuntos.value = lista
    if (!restriccionForm.value.conjuntoReglaId) {
      restriccionForm.value.conjuntoReglaId = props.proceso.conjuntoReglaId
    }
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'No se pudo cargar la configuración.'
  } finally {
    cargando.value = false
  }
}

function solicitarNuevaVersion(input: ConjuntoVersionInput) {
  versionInput.value = input
  versionDialogAbierto.value = false
  confirmarVersionAbierto.value = true
}

async function copiarRestricciones(origen: RestriccionLeer[], nuevoProcesoId: number) {
  const grupos = new Map<string, { conjuntoReglaId: number; relajable: boolean; exclusiva: boolean; cuartoIds: number[] }>()
  for (const r of origen) {
    const key = `${r.conjuntoReglaId}|${r.relajable}|${r.exclusiva}`
    const g = grupos.get(key) ?? { conjuntoReglaId: r.conjuntoReglaId, relajable: r.relajable, exclusiva: r.exclusiva, cuartoIds: [] }
    if (!g.cuartoIds.includes(r.cuartoId)) g.cuartoIds.push(r.cuartoId)
    grupos.set(key, g)
  }
  for (const g of grupos.values()) {
    await agregarRestricciones(nuevoProcesoId, {
      conjuntoReglaId: g.conjuntoReglaId,
      cuartoIds: g.cuartoIds,
      relajable: g.relajable,
      exclusiva: g.exclusiva,
    })
  }
}

async function confirmarNuevaVersion() {
  if (!versionInput.value) return
  versionando.value = true
  try {
    const nuevaVersion = await crearVersionConjunto(props.proceso.conjuntoReglaId, versionInput.value)
    const nuevoProceso = await crearProceso({
      nombre: props.proceso.nombre,
      tipo: (props.proceso.tipo as 'MASIVO' | 'INDIVIDUAL') || 'MASIVO',
      periodoRegistroId: props.proceso.periodoRegistroId,
      conjuntoReglaId: nuevaVersion.id,
      procesoOrigenId: props.proceso.id,
    })
    await copiarRestricciones(props.restricciones, nuevoProceso.id)
    if (props.proceso.estado !== 'CONFIRMADO' && props.proceso.estado !== 'DESCARTADO') {
      try { await descartarProceso(props.proceso.id) } catch { /* origen ya no crítico */ }
    }
    toast.success('Nueva versión creada', { description: `Proceso #${nuevoProceso.id}` })
    confirmarVersionAbierto.value = false
    versionInput.value = null
    emit('proceso-cambiado', nuevoProceso.id)
  } catch (caught) {
    toast.error('No se pudo crear la nueva versión', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    versionando.value = false
  }
}

async function agregar() {
  if (!restriccionForm.value.conjuntoReglaId) {
    toast.warning('Selecciona un conjunto de reglas.')
    return
  }
  if (restriccionForm.value.cuartoIds.length === 0) {
    toast.warning('Selecciona al menos un cuarto.')
    return
  }
  agregandoRestriccion.value = true
  try {
    const input: RestriccionCrearInput = {
      conjuntoReglaId: restriccionForm.value.conjuntoReglaId,
      cuartoIds: [...restriccionForm.value.cuartoIds],
      relajable: restriccionForm.value.relajable,
      exclusiva: restriccionForm.value.exclusiva,
    }
    await agregarRestricciones(props.proceso.id, input)
    toast.success('Restricción agregada')
    restriccionForm.value.cuartoIds = []
    restriccionForm.value.relajable = false
    restriccionForm.value.exclusiva = false
    emit('actualizado')
  } catch (caught) {
    toast.error('No se pudo agregar la restricción', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    agregandoRestriccion.value = false
  }
}

async function confirmarQuitar() {
  if (!restriccionAQuitar.value) return
  quitando.value = true
  try {
    await quitarRestriccion(props.proceso.id, restriccionAQuitar.value.id)
    toast.success('Restricción eliminada')
    restriccionAQuitar.value = null
    emit('actualizado')
  } catch (caught) {
    toast.error('No se pudo eliminar la restricción', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    quitando.value = false
  }
}

watch(() => props.proceso.id, () => {
  restriccionForm.value.conjuntoReglaId = props.proceso.conjuntoReglaId
  void cargar()
})
onMounted(cargar)
</script>

<template>
  <div class="space-y-4">
    <Alert v-if="error" variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>No se pudo cargar la configuración</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <Alert v-if="soloLectura">
      <AlertCircleIcon />
      <AlertTitle>Proceso en solo lectura</AlertTitle>
      <AlertDescription>Este proceso está {{ proceso.estado.toLowerCase() }} y no admite modificaciones.</AlertDescription>
    </Alert>

    <div class="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div class="flex items-start justify-between gap-2">
            <div>
              <CardTitle>Reglas base del proceso</CardTitle>
              <CardDescription>Conjunto de reglas que define las condiciones y prioridades de asignación.</CardDescription>
            </div>
            <Button variant="outline" size="sm" :disabled="soloLectura || cargando" @click="versionDialogAbierto = true">
              <CopyIcon />
              Nueva versión
            </Button>
          </div>
        </CardHeader>
        <CardContent class="space-y-3">
          <div v-if="cargando" class="text-muted-foreground flex items-center gap-2 text-sm">
            <LoaderCircleIcon class="animate-spin" /> Cargando reglas...
          </div>
          <template v-else-if="conjunto">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-medium">{{ conjunto.nombre }}</span>
              <Badge variant="secondary">v{{ conjunto.version }}</Badge>
              <Badge :variant="conjunto.vigente ? 'default' : 'outline'">{{ conjunto.vigente ? 'Vigente' : 'Histórico' }}</Badge>
            </div>
            <div>
              <div class="text-muted-foreground mb-1 text-xs font-medium uppercase">Condiciones ({{ conjunto.condiciones.length }})</div>
              <div v-if="conjunto.condiciones.length" class="space-y-1">
                <div v-for="c in conjunto.condiciones" :key="c.id" class="rounded border bg-muted/40 px-2 py-1 text-sm">
                  {{ c.atributo }} {{ c.operador }} {{ c.valorTexto ?? c.valorEntero ?? c.valorFecha ?? c.valorPermitido ?? (c.valorBool != null ? String(c.valorBool) : c.parametro ?? '') }}
                </div>
              </div>
              <div v-else class="text-muted-foreground text-sm">Sin condiciones.</div>
            </div>
            <div>
              <div class="text-muted-foreground mb-1 text-xs font-medium uppercase">Prioridades ({{ conjunto.prioridades.length }})</div>
              <div v-if="conjunto.prioridades.length" class="space-y-1">
                <div v-for="p in conjunto.prioridades" :key="p.id" class="rounded border bg-muted/40 px-2 py-1 text-sm">
                  {{ p.atributo }} · {{ p.tipo }} <span v-if="p.orden">orden {{ p.orden }}</span> <span v-if="p.sentido">{{ p.sentido }}</span>
                </div>
              </div>
              <div v-else class="text-muted-foreground text-sm">Sin prioridades.</div>
            </div>
            <p class="text-muted-foreground text-xs">
              Al crear una nueva versión se genera un proceso derivado con las reglas actualizadas, se copian las restricciones y se descarta el proceso actual.
            </p>
          </template>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div class="flex items-start justify-between gap-2">
            <div>
              <CardTitle>Restricciones de ubicación</CardTitle>
              <CardDescription>Asocian cuartos a reglas (obligatorias o deseables, relajables/exclusivas).</CardDescription>
            </div>
            <Button variant="outline" size="icon-sm" title="Refrescar" @click="emit('actualizado')">
              <RefreshCwIcon />
            </Button>
          </div>
        </CardHeader>
        <CardContent class="px-0">
          <div class="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuarto</TableHead>
                  <TableHead>Conjunto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead class="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="restricciones.length === 0">
                  <TableCell colspan="4">
                    <div class="text-muted-foreground py-6 text-center text-sm">Sin restricciones configuradas.</div>
                  </TableCell>
                </TableRow>
                <TableRow v-for="r in restricciones" :key="r.id">
                  <TableCell class="font-medium">{{ r.cuarto }}</TableCell>
                  <TableCell class="text-sm">{{ r.conjunto }} <span class="text-muted-foreground">(v{{ r.conjuntoVersion }})</span></TableCell>
                  <TableCell>
                    <div class="flex flex-wrap gap-1">
                      <Badge :variant="r.relajable ? 'outline' : 'secondary'">{{ r.relajable ? 'Deseable' : 'Obligatoria' }}</Badge>
                      <Badge v-if="r.exclusiva" variant="destructive">Exclusiva</Badge>
                    </div>
                  </TableCell>
                  <TableCell class="text-right">
                    <Button variant="ghost" size="icon-sm" :disabled="soloLectura" title="Quitar" @click="restriccionAQuitar = r">
                      <Trash2Icon />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card v-if="!soloLectura">
      <CardHeader>
        <CardTitle>Agregar restricción</CardTitle>
        <CardDescription>Selecciona el conjunto de reglas, el alcance de cuartos y el tipo de restricción.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-3">
          <div class="space-y-1.5 sm:col-span-1">
            <Label>Conjunto de reglas</Label>
            <Select v-model="restriccionForm.conjuntoReglaId">
              <SelectTrigger class="w-full"><SelectValue placeholder="Seleccionar conjunto" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="c in conjuntos" :key="c.id" :value="c.id">{{ c.nombre }} (v{{ c.version }})</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex flex-col justify-end gap-2">
            <label class="flex items-center gap-2 text-sm">
              <input v-model="restriccionForm.relajable" type="checkbox" class="border-input size-4 rounded" />
              Deseable (relajable)
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="restriccionForm.exclusiva" type="checkbox" class="border-input size-4 rounded" />
              Exclusiva
            </label>
          </div>
        </div>
        <div class="space-y-1.5">
          <Label>Cuartos</Label>
          <SelectorCuartos v-model:modeloValue="restriccionForm.cuartoIds" />
        </div>
        <div class="flex justify-end">
          <Button :disabled="agregandoRestriccion" @click="agregar">
            <LoaderCircleIcon v-if="agregandoRestriccion" class="animate-spin" />
            <PlusIcon v-else />
            Agregar restricción
          </Button>
        </div>
      </CardContent>
    </Card>

    <Dialog v-model:open="versionDialogAbierto">
      <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Nueva versión de reglas base</DialogTitle>
          <DialogDescription>
            Ajusta condiciones y prioridades. Al confirmar se creará un proceso derivado con la nueva versión, se copiarán las restricciones y se descartará el proceso actual.
          </DialogDescription>
        </DialogHeader>
        <EditorConjuntoRegla
          v-if="conjunto"
          ambito="ALOJAMIENTO"
          :modelo="conjunto"
          @guardar="(v) => solicitarNuevaVersion(v as ConjuntoVersionInput)"
          @cancelar="versionDialogAbierto = false"
        />
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      :open="confirmarVersionAbierto"
      titulo="Crear nueva versión del proceso"
      descripcion="Se creará un nuevo proceso con la versión actualizada de reglas, se copiarán las restricciones actuales y se descartará este proceso. Serás redirigido al nuevo proceso."
      confirm-label="Crear versión"
      :cargando="versionando"
      @update:open="(v) => { if (!v) { confirmarVersionAbierto = false; versionInput = null } }"
      @confirmar="confirmarNuevaVersion"
    />

    <ConfirmDialog
      :open="restriccionAQuitar !== null"
      titulo="Quitar restricción"
      :descripcion="`Se eliminará la restricción sobre el cuarto &quot;${restriccionAQuitar?.cuarto ?? ''}&quot;.`"
      confirm-label="Quitar"
      :cargando="quitando"
      @update:open="(v) => { if (!v) restriccionAQuitar = null }"
      @confirmar="confirmarQuitar"
    />
  </div>
</template>
