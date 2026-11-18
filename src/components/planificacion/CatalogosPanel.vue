<script setup lang="ts">
import type { HorarioLeer, TipoDeberLeer, UbicacionLeer } from '@/types/planificacion'
import { onMounted, ref } from 'vue'
import {
  AlertCircleIcon,
  CheckIcon,
  LoaderCircleIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  XIcon,
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
import { Input } from '@/components/ui/input'
import {
  actualizarHorario,
  actualizarTipoDeber,
  actualizarUbicacion,
  crearHorario,
  crearTipoDeber,
  crearUbicacion,
  listarHorarios,
  listarTiposDeber,
  listarUbicaciones,
} from '@/services/planificacion'
import { toast } from 'vue-sonner'

const tipos = ref<TipoDeberLeer[]>([])
const horarios = ref<HorarioLeer[]>([])
const ubicaciones = ref<UbicacionLeer[]>([])
const cargando = ref(true)
const error = ref('')
const guardando = ref(false)

const nuevoTipo = ref('')
const nuevoHorarioInicio = ref('07:00')
const nuevoHorarioFin = ref('09:00')
const nuevaUbicacion = ref('')

const editandoTipoId = ref<number | null>(null)
const tipoEditado = ref('')
const editandoHorarioId = ref<number | null>(null)
const horarioInicioEditado = ref('')
const horarioFinEditado = ref('')
const editandoUbicacionId = ref<number | null>(null)
const ubicacionEditada = ref('')

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const [
      tiposActivos,
      tiposInactivos,
      horariosActivos,
      horariosInactivos,
      ubicacionesActivas,
      ubicacionesInactivas,
    ] = await Promise.all([
      listarTiposDeber(true),
      listarTiposDeber(false),
      listarHorarios(true),
      listarHorarios(false),
      listarUbicaciones(true),
      listarUbicaciones(false),
    ])
    tipos.value = [...tiposActivos, ...tiposInactivos].sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    )
    horarios.value = [...horariosActivos, ...horariosInactivos].sort((a, b) =>
      a.inicio.localeCompare(b.inicio),
    )
    ubicaciones.value = [...ubicacionesActivas, ...ubicacionesInactivas].sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    )
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : 'No se pudieron cargar los catálogos.'
  } finally {
    cargando.value = false
  }
}

async function agregarTipo() {
  if (!nuevoTipo.value.trim()) {
    toast.warning('Escribe el nombre del tipo de deber.')
    return
  }
  guardando.value = true
  try {
    await crearTipoDeber({ nombre: nuevoTipo.value.trim() })
    toast.success('Tipo de deber creado')
    nuevoTipo.value = ''
    await cargar()
  } catch (caught) {
    toast.error('No se pudo crear el tipo de deber', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    guardando.value = false
  }
}

function editarTipo(tipo: TipoDeberLeer) {
  editandoTipoId.value = tipo.id
  tipoEditado.value = tipo.nombre
}

async function guardarTipo(id: number) {
  if (!tipoEditado.value.trim()) return
  try {
    await actualizarTipoDeber(id, { nombre: tipoEditado.value.trim() })
    toast.success('Tipo de deber actualizado')
    editandoTipoId.value = null
    await cargar()
  } catch (caught) {
    toast.error('No se pudo actualizar el tipo de deber', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  }
}

async function alternarTipo(tipo: TipoDeberLeer) {
  try {
    await actualizarTipoDeber(tipo.id, { activo: !tipo.activo })
    await cargar()
  } catch (caught) {
    toast.error('No se pudo cambiar el estado', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  }
}

async function agregarHorario() {
  if (!nuevoHorarioInicio.value || !nuevoHorarioFin.value) {
    toast.warning('Indica la hora de inicio y de fin.')
    return
  }
  guardando.value = true
  try {
    await crearHorario({ inicio: nuevoHorarioInicio.value, fin: nuevoHorarioFin.value })
    toast.success('Horario creado')
    await cargar()
  } catch (caught) {
    toast.error('No se pudo crear el horario', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    guardando.value = false
  }
}

function editarHorario(horario: HorarioLeer) {
  editandoHorarioId.value = horario.id
  horarioInicioEditado.value = horario.inicio.slice(0, 5)
  horarioFinEditado.value = horario.fin.slice(0, 5)
}

async function guardarHorario(id: number) {
  try {
    await actualizarHorario(id, {
      inicio: horarioInicioEditado.value,
      fin: horarioFinEditado.value,
    })
    toast.success('Horario actualizado')
    editandoHorarioId.value = null
    await cargar()
  } catch (caught) {
    toast.error('No se pudo actualizar el horario', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  }
}

async function alternarHorario(horario: HorarioLeer) {
  try {
    await actualizarHorario(horario.id, { activo: !horario.activo })
    await cargar()
  } catch (caught) {
    toast.error('No se pudo cambiar el estado', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  }
}

async function agregarUbicacion() {
  if (!nuevaUbicacion.value.trim()) {
    toast.warning('Escribe el nombre de la ubicación.')
    return
  }
  guardando.value = true
  try {
    await crearUbicacion({ nombre: nuevaUbicacion.value.trim() })
    toast.success('Ubicación creada')
    nuevaUbicacion.value = ''
    await cargar()
  } catch (caught) {
    toast.error('No se pudo crear la ubicación', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  } finally {
    guardando.value = false
  }
}

function editarUbicacion(ubicacion: UbicacionLeer) {
  editandoUbicacionId.value = ubicacion.id
  ubicacionEditada.value = ubicacion.nombre
}

async function guardarUbicacion(id: number) {
  if (!ubicacionEditada.value.trim()) return
  try {
    await actualizarUbicacion(id, { nombre: ubicacionEditada.value.trim() })
    toast.success('Ubicación actualizada')
    editandoUbicacionId.value = null
    await cargar()
  } catch (caught) {
    toast.error('No se pudo actualizar la ubicación', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  }
}

async function alternarUbicacion(ubicacion: UbicacionLeer) {
  try {
    await actualizarUbicacion(ubicacion.id, { activo: !ubicacion.activo })
    await cargar()
  } catch (caught) {
    toast.error('No se pudo cambiar el estado', {
      description: caught instanceof Error ? caught.message : undefined,
    })
  }
}

onMounted(cargar)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h3 class="text-base font-semibold">Catálogos</h3>
        <p class="text-muted-foreground mt-0.5 text-sm">
          Los catálogos no se eliminan: se desactivan para dejar de usarlos sin perder el
          histórico.
        </p>
      </div>
      <Button variant="outline" :disabled="cargando" @click="cargar">
        <RefreshCwIcon :class="{ 'animate-spin': cargando }" />
        Refrescar
      </Button>
    </div>

    <Alert v-if="error" variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>No se pudieron cargar los catálogos</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <div v-if="cargando" class="text-muted-foreground flex items-center gap-2 py-6 text-sm">
      <LoaderCircleIcon class="animate-spin" />
      Cargando catálogos…
    </div>

    <div v-else class="grid gap-4 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Tipos de deber</CardTitle>
          <CardDescription>Cocina, limpieza, comedor y otros.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="flex gap-2">
            <Input v-model="nuevoTipo" placeholder="Nuevo tipo" @keyup.enter="agregarTipo" />
            <Button size="icon" :disabled="guardando" title="Agregar" @click="agregarTipo">
              <PlusIcon />
            </Button>
          </div>
          <div class="divide-y rounded-md border">
            <div
              v-for="tipo in tipos"
              :key="tipo.id"
              class="flex items-center gap-2 px-2.5 py-2"
            >
              <template v-if="editandoTipoId === tipo.id">
                <Input v-model="tipoEditado" class="h-8" @keyup.enter="guardarTipo(tipo.id)" />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Guardar"
                  @click="guardarTipo(tipo.id)"
                >
                  <CheckIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Cancelar"
                  @click="editandoTipoId = null"
                >
                  <XIcon />
                </Button>
              </template>
              <template v-else>
                <span class="min-w-0 flex-1 truncate text-sm">{{ tipo.nombre }}</span>
                <Badge :variant="tipo.activo ? 'secondary' : 'outline'">
                  {{ tipo.activo ? 'Activo' : 'Inactivo' }}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Editar"
                  @click="editarTipo(tipo)"
                >
                  <PencilIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  :title="tipo.activo ? 'Desactivar' : 'Activar'"
                  @click="alternarTipo(tipo)"
                >
                  {{ tipo.activo ? 'Desactivar' : 'Activar' }}
                </Button>
              </template>
            </div>
            <div v-if="tipos.length === 0" class="text-muted-foreground px-3 py-4 text-sm">
              Sin tipos registrados.
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horarios</CardTitle>
          <CardDescription>Franjas horarias reutilizables por los turnos.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="flex items-end gap-2">
            <div class="flex-1 space-y-1">
              <span class="text-muted-foreground text-xs">Inicio</span>
              <Input v-model="nuevoHorarioInicio" type="time" />
            </div>
            <div class="flex-1 space-y-1">
              <span class="text-muted-foreground text-xs">Fin</span>
              <Input v-model="nuevoHorarioFin" type="time" />
            </div>
            <Button size="icon" :disabled="guardando" title="Agregar" @click="agregarHorario">
              <PlusIcon />
            </Button>
          </div>
          <div class="divide-y rounded-md border">
            <div
              v-for="horario in horarios"
              :key="horario.id"
              class="flex items-center gap-2 px-2.5 py-2"
            >
              <template v-if="editandoHorarioId === horario.id">
                <Input v-model="horarioInicioEditado" type="time" class="h-8" />
                <Input v-model="horarioFinEditado" type="time" class="h-8" />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Guardar"
                  @click="guardarHorario(horario.id)"
                >
                  <CheckIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Cancelar"
                  @click="editandoHorarioId = null"
                >
                  <XIcon />
                </Button>
              </template>
              <template v-else>
                <span class="min-w-0 flex-1 text-sm">
                  {{ horario.inicio.slice(0, 5) }} - {{ horario.fin.slice(0, 5) }}
                </span>
                <Badge :variant="horario.activo ? 'secondary' : 'outline'">
                  {{ horario.activo ? 'Activo' : 'Inactivo' }}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Editar"
                  @click="editarHorario(horario)"
                >
                  <PencilIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  @click="alternarHorario(horario)"
                >
                  {{ horario.activo ? 'Desactivar' : 'Activar' }}
                </Button>
              </template>
            </div>
            <div v-if="horarios.length === 0" class="text-muted-foreground px-3 py-4 text-sm">
              Sin horarios registrados.
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ubicaciones</CardTitle>
          <CardDescription>Lugares donde se realizan los deberes.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="flex gap-2">
            <Input
              v-model="nuevaUbicacion"
              placeholder="Nueva ubicación"
              @keyup.enter="agregarUbicacion"
            />
            <Button
              size="icon"
              :disabled="guardando"
              title="Agregar"
              @click="agregarUbicacion"
            >
              <PlusIcon />
            </Button>
          </div>
          <div class="divide-y rounded-md border">
            <div
              v-for="ubicacion in ubicaciones"
              :key="ubicacion.id"
              class="flex items-center gap-2 px-2.5 py-2"
            >
              <template v-if="editandoUbicacionId === ubicacion.id">
                <Input
                  v-model="ubicacionEditada"
                  class="h-8"
                  @keyup.enter="guardarUbicacion(ubicacion.id)"
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Guardar"
                  @click="guardarUbicacion(ubicacion.id)"
                >
                  <CheckIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Cancelar"
                  @click="editandoUbicacionId = null"
                >
                  <XIcon />
                </Button>
              </template>
              <template v-else>
                <span class="min-w-0 flex-1 truncate text-sm">{{ ubicacion.nombre }}</span>
                <Badge :variant="ubicacion.activo ? 'secondary' : 'outline'">
                  {{ ubicacion.activo ? 'Activo' : 'Inactivo' }}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Editar"
                  @click="editarUbicacion(ubicacion)"
                >
                  <PencilIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  @click="alternarUbicacion(ubicacion)"
                >
                  {{ ubicacion.activo ? 'Desactivar' : 'Activar' }}
                </Button>
              </template>
            </div>
            <div v-if="ubicaciones.length === 0" class="text-muted-foreground px-3 py-4 text-sm">
              Sin ubicaciones registradas.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
