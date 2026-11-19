<script setup lang="ts">
import type { NoAlojado, PreasignacionLeer, ProcesoLeer } from '@/types/alojamiento'
import type { EdificioDetalle } from '@/types/infraestructura'
import { computed, onMounted, ref, watch } from 'vue'
import {
  AlertCircleIcon,
  ArrowRightLeftIcon,
  LockIcon,
  RefreshCwIcon,
  Trash2Icon,
  UnlockIcon,
  UserPlusIcon,
} from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  actualizarPreasignacion,
  agregarPreasignacion,
  bloquearPreasignaciones,
  quitarPreasignacion,
} from '@/services/alojamiento'
import { obtenerEdificio, obtenerEdificios } from '@/services/infraestructura'
import { esSoloLecturaProceso } from '@/lib/alojamiento'
import { toast } from 'vue-sonner'

const props = defineProps<{
  proceso: ProcesoLeer
  preasignaciones: PreasignacionLeer[]
  noAlojados: NoAlojado[]
}>()
const emit = defineEmits<{ actualizado: [] }>()

const cargandoCuartos = ref(false)
const cuartosHabitables = ref<{ id: number; label: string }[]>([])
const moverDestino = ref<Record<number, number | ''>>({})
const asignarCuarto = ref<Record<number, number | ''>>({})
const ocupando = ref<number | null>(null)
const bloqueando = ref(false)

const PAGE_GRUPOS = 30
const PAGE_NO = 50
const visiblesGrupos = ref(PAGE_GRUPOS)
const visiblesNo = ref(PAGE_NO)

const soloLectura = computed(() => esSoloLecturaProceso(props.proceso.estado))

const gruposPorCuarto = computed(() => {
  const map = new Map<number, { cuartoId: number; cuarto: string; items: PreasignacionLeer[] }>()
  for (const p of props.preasignaciones) {
    if (!map.has(p.cuartoId)) map.set(p.cuartoId, { cuartoId: p.cuartoId, cuarto: p.cuarto, items: [] })
    map.get(p.cuartoId)!.items.push(p)
  }
  return Array.from(map.values()).sort((a, b) => a.cuarto.localeCompare(b.cuarto))
})
const gruposVisibles = computed(() => gruposPorCuarto.value.slice(0, visiblesGrupos.value))
const noAlojadosVisibles = computed(() => props.noAlojados.slice(0, visiblesNo.value))

async function cargarCuartos() {
  cargandoCuartos.value = true
  try {
    const eds = await obtenerEdificios()
    const detalles = await Promise.all(eds.map((e) => obtenerEdificio(e.id).catch(() => null as EdificioDetalle | null)))
    const lista: { id: number; label: string }[] = []
    for (const d of detalles) {
      if (!d) continue
      const escMap = new Map(d.escalerasDetalle.map((e) => [e.id, e.nombre]))
      for (const c of d.cuartosDetalle) {
        if (!c.estado?.habitable) continue
        const esc = escMap.get(c.escaleraId) || `Escalera ${c.escaleraId}`
        lista.push({ id: c.id, label: `${d.nombre} · ${esc} · ${c.nombre}` })
      }
    }
    lista.sort((a, b) => a.label.localeCompare(b.label))
    cuartosHabitables.value = lista
  } catch {
    cuartosHabitables.value = []
  } finally {
    cargandoCuartos.value = false
  }
}

async function mover(p: PreasignacionLeer) {
  const dest = moverDestino.value[p.estudianteId]
  if (!dest) { toast.warning('Selecciona un cuarto destino.'); return }
  ocupando.value = p.estudianteId
  try {
    await actualizarPreasignacion(props.proceso.id, p.estudianteId, { cuartoId: Number(dest) })
    toast.success(`${p.estudiante} movido`)
    moverDestino.value[p.estudianteId] = ''
    emit('actualizado')
  } catch (caught) {
    toast.error('No se pudo mover', { description: caught instanceof Error ? caught.message : undefined })
  } finally {
    ocupando.value = null
  }
}

async function toggleBloqueo(p: PreasignacionLeer) {
  ocupando.value = p.estudianteId
  try {
    await actualizarPreasignacion(props.proceso.id, p.estudianteId, { bloqueada: !p.bloqueada })
    toast.success(p.bloqueada ? 'Desbloqueada' : 'Bloqueada')
    emit('actualizado')
  } catch (caught) {
    toast.error('No se pudo actualizar el bloqueo', { description: caught instanceof Error ? caught.message : undefined })
  } finally {
    ocupando.value = null
  }
}

async function bloquearTodas(bloqueada: boolean) {
  if (!props.preasignaciones.length) return
  bloqueando.value = true
  try {
    const res = await bloquearPreasignaciones(props.proceso.id, { bloqueada })
    toast.success(`${bloqueada ? 'Bloqueadas' : 'Desbloqueadas'}: ${res.cambiadas}`)
    emit('actualizado')
  } catch (caught) {
    toast.error('No se pudo actualizar el bloqueo', { description: caught instanceof Error ? caught.message : undefined })
  } finally {
    bloqueando.value = false
  }
}

async function quitar(p: PreasignacionLeer) {
  ocupando.value = p.estudianteId
  try {
    await quitarPreasignacion(props.proceso.id, p.estudianteId)
    toast.success('Preasignación quitada')
    emit('actualizado')
  } catch (caught) {
    toast.error('No se pudo quitar', { description: caught instanceof Error ? caught.message : undefined })
  } finally {
    ocupando.value = null
  }
}

async function asignar(n: NoAlojado) {
  const dest = asignarCuarto.value[n.estudianteId]
  if (!dest) { toast.warning('Selecciona un cuarto.'); return }
  ocupando.value = n.estudianteId
  try {
    await agregarPreasignacion(props.proceso.id, { estudianteId: n.estudianteId, cuartoId: Number(dest), bloqueada: true })
    toast.success(`${n.estudiante} asignado`)
    asignarCuarto.value[n.estudianteId] = ''
    emit('actualizado')
  } catch (caught) {
    toast.error('No se pudo asignar', { description: caught instanceof Error ? caught.message : undefined })
  } finally {
    ocupando.value = null
  }
}

onMounted(cargarCuartos)
watch(() => props.proceso.id, () => {
  visiblesGrupos.value = PAGE_GRUPOS
  visiblesNo.value = PAGE_NO
  void cargarCuartos()
})
</script>

<template>
  <div class="space-y-4">
    <Alert v-if="soloLectura">
      <AlertCircleIcon />
      <AlertTitle>Proceso en solo lectura</AlertTitle>
      <AlertDescription>Este proceso está {{ proceso.estado.toLowerCase() }} y no admite modificaciones.</AlertDescription>
    </Alert>

    <div class="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" :disabled="cargandoCuartos" @click="cargarCuartos">
        <RefreshCwIcon :class="{ 'animate-spin': cargandoCuartos }" />
        Refrescar cuartos
      </Button>
      <Button variant="outline" size="sm" :disabled="soloLectura || bloqueando || !preasignaciones.length" @click="bloquearTodas(true)">
        <LockIcon /> Bloquear todas
      </Button>
      <Button variant="outline" size="sm" :disabled="soloLectura || bloqueando || !preasignaciones.length" @click="bloquearTodas(false)">
        <UnlockIcon /> Desbloquear todas
      </Button>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Preasignaciones por cuarto</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div v-if="gruposPorCuarto.length === 0" class="text-muted-foreground py-6 text-center text-sm">
          Sin preasignaciones. Ejecuta la asignaci�n para generar resultados.
        </div>
        <template v-else>
          <div class="text-muted-foreground text-xs">
            Mostrando {{ gruposVisibles.length }} de {{ gruposPorCuarto.length }} cuartos ({{ preasignaciones.length }} preasignaciones)
          </div>
          <div v-for="g in gruposVisibles" :key="g.cuartoId" class="rounded-lg border">
          <div class="bg-muted/40 flex items-center justify-between gap-2 border-b px-3 py-2">
            <div class="font-medium">{{ g.cuarto }}</div>
            <Badge variant="outline">{{ g.items.length }} asignados</Badge>
          </div>
          <div class="divide-y">
            <div v-for="p in g.items" :key="p.estudianteId" class="flex flex-col gap-2 p-3 lg:flex-row lg:items-center lg:justify-between">
              <div class="min-w-0">
                <div class="font-medium">{{ p.estudiante }}</div>
                <div class="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                  <span>ID {{ p.estudianteId }}</span>
                  <Badge variant="outline">{{ p.estado }}</Badge>
                  <span v-if="p.puntaje != null">Puntaje {{ p.puntaje }}</span>
                  <Badge v-if="p.bloqueada" variant="secondary">Bloqueada</Badge>
                </div>
              </div>
              <div v-if="!soloLectura" class="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Select v-model="moverDestino[p.estudianteId]">
                  <SelectTrigger class="w-full sm:w-64"><SelectValue placeholder="Mover a cuarto..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="c in cuartosHabitables" :key="c.id" :value="c.id">{{ c.label }}</SelectItem>
                  </SelectContent>
                </Select>
                <div class="flex flex-wrap gap-1">
                  <Button size="sm" variant="outline" :disabled="ocupando === p.estudianteId" @click="mover(p)">
                    <ArrowRightLeftIcon /> Mover
                  </Button>
                  <Button size="sm" variant="outline" :disabled="ocupando === p.estudianteId" :title="p.bloqueada ? 'Desbloquear' : 'Bloquear'" @click="toggleBloqueo(p)">
                    <component :is="p.bloqueada ? UnlockIcon : LockIcon" />
                  </Button>
                  <Button size="sm" variant="ghost" :disabled="ocupando === p.estudianteId" title="Quitar" @click="quitar(p)">
                    <Trash2Icon />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          </div>
          <Button v-if="gruposPorCuarto.length > visiblesGrupos" variant="outline" class="w-full" @click="visiblesGrupos += PAGE_GRUPOS">
            Mostrar m�s cuartos ({{ gruposPorCuarto.length - visiblesGrupos }} restantes)
          </Button>
        </template>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Estudiantes sin cuarto</CardTitle>
      </CardHeader>
      <CardContent class="px-0">
        <div v-if="noAlojados.length === 0" class="text-muted-foreground py-6 text-center text-sm px-6">
          No hay estudiantes pendientes sin cuarto.
        </div>
        <div v-else class="overflow-x-auto">
          <div class="text-muted-foreground px-6 pb-2 text-xs">
            Mostrando {{ noAlojadosVisibles.length }} de {{ noAlojados.length }} estudiantes
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Detalle</TableHead>
                <TableHead v-if="!soloLectura" class="text-right">Asignar manualmente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="n in noAlojadosVisibles" :key="n.estudianteId" :class="n.seResolveriaRelajando ? 'bg-amber-50/50' : ''">
                <TableCell>
                  <div class="font-medium">{{ n.estudiante }}</div>
                  <div class="text-muted-foreground text-xs">ID {{ n.estudianteId }}</div>
                </TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                    <span class="text-sm">{{ n.motivo }}</span>
                    <Badge v-if="n.seResolveriaRelajando" variant="outline" class="text-xs">Relajando sí</Badge>
                  </div>
                </TableCell>
                <TableCell class="text-muted-foreground text-sm">{{ n.detalle }}</TableCell>
                <TableCell v-if="!soloLectura">
                  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <Select v-model="asignarCuarto[n.estudianteId]">
                      <SelectTrigger class="w-full sm:w-64"><SelectValue placeholder="Asignar a cuarto..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="c in cuartosHabitables" :key="c.id" :value="c.id">{{ c.label }}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" :disabled="ocupando === n.estudianteId" @click="asignar(n)">
                      <UserPlusIcon /> Asignar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div v-if="noAlojados.length > visiblesNo" class="px-6 pt-3">
            <Button variant="outline" class="w-full" @click="visiblesNo += PAGE_NO">
              Mostrar m�s ({{ noAlojados.length - visiblesNo }} restantes)
            </Button>
          </div>
        </div>
        <p v-if="!soloLectura && noAlojados.length" class="text-muted-foreground px-6 pb-4 text-xs">
          La asignaci�n manual queda sujeta a validaciones de capacidad/habitabilidad del backend.
        </p>
      </CardContent>
    </Card>
  </div>
</template>
