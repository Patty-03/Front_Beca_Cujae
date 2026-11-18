<script setup lang="ts">
import type { NoAlojado, PreasignacionLeer, ProcesoLeer } from '@/types/alojamiento'
import { computed, ref, watch } from 'vue'
import { AlertCircleIcon, CheckCircle2Icon, LoaderCircleIcon, Trash2Icon } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import ConfirmDialog from '@/components/infraestructura/ConfirmDialog.vue'
import { confirmarProceso, descartarProceso } from '@/services/alojamiento'
import { formatNumber } from '@/lib/format'
import { puedeConfirmarProceso, puedeDescartarProceso } from '@/lib/alojamiento'
import { toast } from 'vue-sonner'

const props = defineProps<{
  proceso: ProcesoLeer
  preasignaciones: PreasignacionLeer[]
  noAlojados: NoAlojado[]
}>()
const emit = defineEmits<{ actualizado: []; confirmado: []; descartado: [] }>()

const excluidos = ref<number[]>([])
const confirmarAbierto = ref(false)
const descartarAbierto = ref(false)
const confirmando = ref(false)
const descartando = ref(false)
const resultado = ref<{ reservas: number; excluidos: number } | null>(null)

const esConfirmado = computed(() => props.proceso.estado === 'CONFIRMADO')
const puedeConfirmar = computed(() =>
  puedeConfirmarProceso(props.proceso, props.preasignaciones.length - excluidos.value.length > 0),
)

watch(() => props.proceso.id, () => {
  excluidos.value = []
  resultado.value = null
})

function toggleExcluido(id: number) {
  const i = excluidos.value.indexOf(id)
  if (i >= 0) excluidos.value.splice(i, 1)
  else excluidos.value.push(id)
}

async function confirmar() {
  confirmando.value = true
  try {
    const res = await confirmarProceso(props.proceso.id, {
      excluirEstudianteIds: excluidos.value.length ? [...excluidos.value] : undefined,
    })
    resultado.value = res
    toast.success('Proceso confirmado', { description: `${res.reservas} reservas, ${res.excluidos} excluidos` })
    confirmarAbierto.value = false
    emit('confirmado')
    emit('actualizado')
  } catch (caught) {
    toast.error('No se pudo confirmar el proceso', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    confirmando.value = false
  }
}

async function descartar() {
  descartando.value = true
  try {
    await descartarProceso(props.proceso.id)
    toast.success('Proceso descartado')
    descartarAbierto.value = false
    emit('descartado')
  } catch (caught) {
    toast.error('No se pudo descartar el proceso', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    descartando.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <Alert v-if="proceso.estado === 'BORRADOR'">
      <AlertCircleIcon />
      <AlertTitle>Proceso en borrador</AlertTitle>
      <AlertDescription>Ejecuta la asignación y revisa los resultados antes de confirmar. La confirmación requiere estado EN_REVISION y al menos una preasignación.</AlertDescription>
    </Alert>

    <Alert v-if="esConfirmado" variant="default">
      <CheckCircle2Icon />
      <AlertTitle>Proceso confirmado</AlertTitle>
      <AlertDescription>Las preasignaciones se han materializado como reservas. Este proceso es de solo lectura.</AlertDescription>
    </Alert>

    <Alert v-if="resultado" variant="default">
      <CheckCircle2Icon />
      <AlertTitle>Confirmación completada</AlertTitle>
      <AlertDescription>{{ formatNumber(resultado.reservas) }} reservas creadas, {{ formatNumber(resultado.excluidos) }} excluidos.</AlertDescription>
    </Alert>

    <div class="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader class="pb-2"><CardDescription>Preasignaciones</CardDescription><CardTitle class="text-2xl">{{ formatNumber(preasignaciones.length) }}</CardTitle></CardHeader>
      </Card>
      <Card>
        <CardHeader class="pb-2"><CardDescription>No alojados</CardDescription><CardTitle class="text-2xl">{{ formatNumber(noAlojados.length) }}</CardTitle></CardHeader>
      </Card>
      <Card>
        <CardHeader class="pb-2"><CardDescription>A confirmar</CardDescription><CardTitle class="text-2xl">{{ formatNumber(Math.max(0, preasignaciones.length - excluidos.length)) }}</CardTitle></CardHeader>
      </Card>
    </div>

    <Card v-if="!esConfirmado">
      <CardHeader>
        <CardTitle>Confirmar proceso</CardTitle>
        <CardDescription>
          Al confirmar se crean las reservas definitivas. Esta acción es irreversible. Puedes excluir estudiantes de la confirmación.
        </CardDescription>
      </CardHeader>
      <CardContent class="px-0">
        <div v-if="preasignaciones.length === 0" class="text-muted-foreground py-6 text-center text-sm px-6">
          No hay preasignaciones para confirmar. Ejecuta y revisa la asignación primero.
        </div>
        <div v-else class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-12">Excluir</TableHead>
                <TableHead>Estudiante</TableHead>
                <TableHead>Cuarto</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="p in preasignaciones" :key="p.estudianteId">
                <TableCell>
                  <input
                    type="checkbox"
                    class="border-input size-4 rounded"
                    :checked="excluidos.includes(p.estudianteId)"
                    @change="toggleExcluido(p.estudianteId)"
                  />
                </TableCell>
                <TableCell class="font-medium">{{ p.estudiante }}</TableCell>
                <TableCell>{{ p.cuarto }}</TableCell>
                <TableCell>
                  <div class="flex gap-1">
                    <Badge variant="outline">{{ p.estado }}</Badge>
                    <Badge v-if="excluidos.includes(p.estudianteId)" variant="destructive">Excluido</Badge>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div class="flex flex-wrap justify-end gap-2 px-6 pt-4">
          <Button
            v-if="puedeDescartarProceso(proceso.estado)"
            variant="outline"
            @click="descartarAbierto = true"
          >
            <Trash2Icon /> Descartar proceso
          </Button>
          <Button :disabled="!puedeConfirmar" @click="confirmarAbierto = true">
            <CheckCircle2Icon /> Confirmar proceso
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card v-else>
      <CardHeader>
        <CardTitle>Resumen de confirmación</CardTitle>
        <CardDescription>Preasignaciones incluidas en el proceso confirmado.</CardDescription>
      </CardHeader>
      <CardContent class="px-0">
        <div class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Cuarto</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="p in preasignaciones" :key="p.estudianteId">
                <TableCell class="font-medium">{{ p.estudiante }}</TableCell>
                <TableCell>{{ p.cuarto }}</TableCell>
                <TableCell><Badge variant="secondary">{{ p.estado }}</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <ConfirmDialog
      :open="confirmarAbierto"
      titulo="Confirmar proceso de asignación"
      :descripcion="`Se crearán ${formatNumber(preasignaciones.length - excluidos.length)} reservas y se excluirán ${formatNumber(excluidos.length)} estudiantes. Esta acción es irreversible.`"
      confirm-label="Confirmar"
      :cargando="confirmando"
      @update:open="(v) => { if (!v) confirmarAbierto = false }"
      @confirmar="confirmar"
    />

    <ConfirmDialog
      :open="descartarAbierto"
      titulo="Descartar proceso"
      descripcion="El proceso será marcado como descartado. Esta acción no se puede deshacer."
      confirm-label="Descartar"
      :cargando="descartando"
      @update:open="(v) => { if (!v) descartarAbierto = false }"
      @confirmar="descartar"
    />
  </div>
</template>
