<script setup lang="ts">
import type { MedioDeCuarto } from '@/types/inventario'
import { computed, ref, watch } from 'vue'
import { LoaderCircleIcon, PencilIcon, PlusIcon, Trash2Icon } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import ConfirmDialog from '@/components/infraestructura/ConfirmDialog.vue'
import { ETIQUETAS_ESTADO_MEDIO, ETIQUETAS_TIPO_MEDIO } from '@/lib/inventario'
import { eliminarMedio, obtenerMediosCuarto } from '@/services/inventario'
import { useAuthStore } from '@/stores/auth'
import MedioFormDialog from './MedioFormDialog.vue'

interface Props {
  cuartoId: number
  cuartoNombre: string
}

const props = defineProps<Props>()

const auth = useAuthStore()
const puedeEscribir = computed(() => auth.can('infraestructura:write'))

const medios = ref<MedioDeCuarto[]>([])
const cargando = ref(false)
const error = ref('')

const formAbierto = ref(false)
const medioEditando = ref<MedioDeCuarto | null>(null)
const confirmacionAbierta = ref(false)
const medioEliminando = ref<MedioDeCuarto | null>(null)
const eliminando = ref(false)

const totalUnidades = computed(() =>
  medios.value.reduce((total, medio) => total + medio.cantidad, 0),
)

async function cargar() {
  if (!props.cuartoId) {
    medios.value = []
    return
  }

  cargando.value = true
  error.value = ''
  try {
    medios.value = await obtenerMediosCuarto(props.cuartoId)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo cargar los medios del cuarto.'
  } finally {
    cargando.value = false
  }
}

watch(
  () => props.cuartoId,
  () => cargar(),
  { immediate: true },
)

function abrirNuevo() {
  if (!puedeEscribir.value) return
  medioEditando.value = null
  formAbierto.value = true
}

function abrirEditar(medio: MedioDeCuarto) {
  if (!puedeEscribir.value) return
  medioEditando.value = medio
  formAbierto.value = true
}

function solicitarEliminar(medio: MedioDeCuarto) {
  if (!puedeEscribir.value) return
  medioEliminando.value = medio
  confirmacionAbierta.value = true
}

async function confirmarEliminacion() {
  const medio = medioEliminando.value
  if (!medio) return

  eliminando.value = true
  try {
    await eliminarMedio(medio.id)
    toast.success('Medio eliminado', { description: props.cuartoNombre })
    confirmacionAbierta.value = false
    medioEliminando.value = null
    await cargar()
  } catch (e) {
    toast.error('No se pudo eliminar el medio', {
      description: e instanceof Error ? e.message : undefined,
    })
  } finally {
    eliminando.value = false
  }
}

async function alGuardar() {
  medioEditando.value = null
  await cargar()
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 class="text-sm font-semibold">Medios del cuarto {{ props.cuartoNombre }}</h3>
        <p class="text-muted-foreground text-xs">
          {{
            cargando
              ? 'Cargando medios…'
              : `${medios.length} ${medios.length === 1 ? 'registro' : 'registros'} · ${totalUnidades} unidades`
          }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" :disabled="cargando" @click="cargar">
          <LoaderCircleIcon :class="{ 'animate-spin': cargando }" />
          Actualizar
        </Button>
        <Button v-if="puedeEscribir" size="sm" @click="abrirNuevo">
          <PlusIcon />
          Agregar medio
        </Button>
      </div>
    </div>

    <Alert v-if="error" variant="destructive">
      <AlertTitle>No se pudo cargar los medios</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
      <Button variant="outline" size="sm" class="mt-3" @click="cargar">Reintentar</Button>
    </Alert>

    <div v-if="cargando" class="space-y-2">
      <Skeleton class="h-9 w-full" />
      <Skeleton class="h-9 w-full" />
      <Skeleton class="h-9 w-full" />
    </div>

    <template v-else-if="!error">
      <div
        v-if="!medios.length"
        class="bg-card flex flex-col items-center justify-center gap-2 rounded-xl border px-4 py-12 text-center"
      >
        <p class="font-medium">Sin medios registrados</p>
        <p class="text-muted-foreground text-sm">
          Este cuarto todavía no tiene medios en el inventario.
        </p>
        <Button v-if="puedeEscribir" variant="outline" size="sm" @click="abrirNuevo">
          <PlusIcon />
          Agregar medio
        </Button>
      </div>

      <div v-else class="bg-card overflow-hidden rounded-xl border">
        <div class="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead class="text-right">Cantidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead class="min-w-48">Observaciones</TableHead>
                <TableHead v-if="puedeEscribir" class="w-24 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="medio in medios" :key="medio.id">
                <TableCell class="font-medium">
                  {{ ETIQUETAS_TIPO_MEDIO[medio.tipo] }}
                </TableCell>
                <TableCell class="text-right tabular-nums">{{ medio.cantidad }}</TableCell>
                <TableCell>
                  <Badge :variant="medio.estado === 'bueno' ? 'secondary' : medio.estado === 'daniado' ? 'destructive' : 'outline'">
                    {{ ETIQUETAS_ESTADO_MEDIO[medio.estado] }}
                  </Badge>
                </TableCell>
                <TableCell class="text-muted-foreground text-xs">
                  {{ medio.observaciones || '—' }}
                </TableCell>
                <TableCell v-if="puedeEscribir">
                  <div class="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      class="size-11 lg:size-8"
                      :aria-label="`Editar ${ETIQUETAS_TIPO_MEDIO[medio.tipo].toLowerCase()} del cuarto ${props.cuartoNombre}`"
                      @click="abrirEditar(medio)"
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      class="text-destructive hover:text-destructive size-11 lg:size-8"
                      :aria-label="`Eliminar ${ETIQUETAS_TIPO_MEDIO[medio.tipo].toLowerCase()} del cuarto ${props.cuartoNombre}`"
                      @click="solicitarEliminar(medio)"
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div class="grid gap-3 md:hidden">
          <Card v-for="medio in medios" :key="medio.id">
            <CardContent class="space-y-3 p-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-medium">{{ ETIQUETAS_TIPO_MEDIO[medio.tipo] }}</p>
                  <p class="text-muted-foreground text-xs">{{ medio.cantidad }} unidades</p>
                </div>
                <Badge :variant="medio.estado === 'bueno' ? 'secondary' : medio.estado === 'daniado' ? 'destructive' : 'outline'">
                  {{ ETIQUETAS_ESTADO_MEDIO[medio.estado] }}
                </Badge>
              </div>
              <p class="text-muted-foreground text-xs">{{ medio.observaciones || 'Sin observaciones' }}</p>
              <div v-if="puedeEscribir" class="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" @click="abrirEditar(medio)">
                  <PencilIcon />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  class="text-destructive hover:text-destructive size-11"
                  :aria-label="`Eliminar ${ETIQUETAS_TIPO_MEDIO[medio.tipo].toLowerCase()} del cuarto ${props.cuartoNombre}`"
                  @click="solicitarEliminar(medio)"
                >
                  <Trash2Icon />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </template>

    <MedioFormDialog
      v-model:open="formAbierto"
      :cuarto-id="props.cuartoId"
      :cuarto-nombre="props.cuartoNombre"
      :medio="medioEditando"
      @guardado="alGuardar"
    />

    <ConfirmDialog
      v-model:open="confirmacionAbierta"
      :titulo="`Eliminar medio del cuarto ${props.cuartoNombre}`"
      :descripcion="
        medioEliminando
          ? `Se eliminará el registro de ${ETIQUETAS_TIPO_MEDIO[medioEliminando.tipo].toLowerCase()} (${medioEliminando.cantidad} unidades, estado ${ETIQUETAS_ESTADO_MEDIO[medioEliminando.estado].toLowerCase()}). Esta acción no se puede deshacer.`
          : ''
      "
      :cargando="eliminando"
      @confirmar="confirmarEliminacion"
    />
  </div>
</template>
