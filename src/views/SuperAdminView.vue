<script setup lang="ts">
import type { Role, UsuarioAdmin } from '@/types/auth'
import { computed, onMounted, ref } from 'vue'
import { PencilIcon, Trash2Icon } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { obtenerUsuarios, asignarRol, crearUsuario, eliminarUsuario, actualizarUsuario, actualizarPermisosRol } from '@/services/usuario'
import { ETIQUETAS_ROL, PERMISOS_POR_ROL } from '@/lib/auth'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const puedeGestionar = computed(() => auth.can('usuarios:manage'))

const usuarios = ref<UsuarioAdmin[]>([])
const cargando = ref(false)
const error = ref('')
const guardando = ref(false)
const usuarioEditando = ref<UsuarioAdmin | null>(null)
const rolAsignar = ref<Role>('estudiante')
const creando = ref(false)
const eliminando = ref(false)
const editDialogOpen = ref(false)
const editando = ref<UsuarioAdmin | null>(null)
const eliminarDialogOpen = ref(false)
const usuarioParaEliminar = ref<UsuarioAdmin | null>(null)
const rolesGestionables = ['estudiante', 'operador', 'administrador'] as Role[]

async function cargar() {
  if (!puedeGestionar.value) return
  cargando.value = true
  error.value = ''
  try {
    usuarios.value = await obtenerUsuarios()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo cargar los usuarios.'
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

function etiquetaRol(rol: Role): string {
  return ETIQUETAS_ROL[rol] ?? rol
}

function rolDe(usuario: UsuarioAdmin): Role {
  return usuario.roles[0] ?? 'estudiante'
}

function abrirCrear() {
  usuarioEditando.value = { id: '', nombre: '', email: '', roles: [rolAsignar.value], activo: true }
  creando.value = true
}

async function crear() {
  if (!usuarioEditando.value) return
  guardando.value = true
  try {
    await crearUsuario({
      nombre: usuarioEditando.value.nombre,
      email: usuarioEditando.value.email,
      roles: [rolAsignar.value],
      activo: true,
    })
    toast.success('Usuario creado', { description: usuarioEditando.value.email })
    usuarioEditando.value = null
    creando.value = false
    await cargar()
  } catch (e) {
    toast.error('No se pudo crear el usuario', { description: e instanceof Error ? e.message : undefined })
  } finally {
    guardando.value = false
  }
}

function confirmarEliminar(usuario: UsuarioAdmin) {
  usuarioParaEliminar.value = usuario
  eliminarDialogOpen.value = true
}

async function confirmarEliminacion() {
  if (!usuarioParaEliminar.value) return
  eliminando.value = true
  try {
    await eliminarUsuario(usuarioParaEliminar.value.id)
    toast.success('Usuario eliminado', { description: usuarioParaEliminar.value.email })
    cancelarEliminacion()
    await cargar()
  } catch (e) {
    toast.error('No se pudo eliminar el usuario', { description: e instanceof Error ? e.message : undefined })
  } finally {
    eliminando.value = false
  }
}

function cancelarEliminacion() {
  usuarioParaEliminar.value = null
  eliminarDialogOpen.value = false
}

async function cambiarRol(usuario: UsuarioAdmin, rol: Role) {
  guardando.value = true
  try {
    const actualizado = await asignarRol(usuario.id, rol)
    toast.success('Rol actualizado', { description: actualizado.nombre + ' - ' + ETIQUETAS_ROL[rol] })
    await cargar()
  } catch (e) {
    toast.error('No se pudo actualizar el rol', { description: e instanceof Error ? e.message : undefined })
  } finally {
    guardando.value = false
  }
}

function abrirEditar(usuario: UsuarioAdmin) {
  editando.value = { ...usuario }
  editDialogOpen.value = true
}

function cerrarEditar() {
  editDialogOpen.value = false
  editando.value = null
}

async function guardarUsuario() {
  if (!editando.value) return
  guardando.value = true
  try {
    const actualizado = await actualizarUsuario(editando.value)
    toast.success('Usuario actualizado', { description: actualizado.email })
    cerrarEditar()
    await cargar()
  } catch (e) {
    toast.error('No se pudo actualizar el usuario', { description: e instanceof Error ? e.message : undefined })
  } finally {
    guardando.value = false
  }
}

async function guardarPermisosRol(rol: Role) {
  guardando.value = true
  try {
    const permisos = PERMISOS_POR_ROL[rol] ?? []
    const actualizado = await actualizarPermisosRol(rol, permisos)
    toast.success('Permisos actualizados', { description: ETIQUETAS_ROL[rol] })
    void actualizado
    await cargar()
  } catch (e) {
    toast.error('No se pudo actualizar los permisos', { description: e instanceof Error ? e.message : undefined })
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <header class="space-y-1">
      <h1 class="text-2xl font-bold tracking-tight">Super Admin</h1>
      <p class="text-muted-foreground text-sm">
        Gestiona los usuarios y los permisos de los roles de la residencia.
      </p>
    </header>

    <Alert v-if="error" variant="destructive">
      <AlertTitle>No se pudo cargar los usuarios</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
      <Button variant="outline" size="sm" class="mt-3" @click="cargar">Reintentar</Button>
    </Alert>

    <Card>
      <CardHeader>
        <div class="flex items-center justify-between gap-2">
          <div class="space-y-1">
            <CardTitle>Usuarios</CardTitle>
            <CardDescription>Lista de usuarios registrados y su rol asignado.</CardDescription>
          </div>
          <div class="flex items-center gap-2">
            <Button v-if="puedeGestionar" size="sm" @click="abrirCrear">Nuevo usuario</Button>
            <Button v-if="puedeGestionar && creando" size="sm" @click="crear">Crear usuario</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div class="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead class="w-24 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="usuario in usuarios" :key="usuario.id">
                <TableCell class="font-medium">{{ usuario.nombre }}</TableCell>
                <TableCell class="text-muted-foreground">{{ usuario.email }}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{{ etiquetaRol(rolDe(usuario)) }}</Badge>
                </TableCell>
                <TableCell>
                  <Badge :variant="usuario.activo ? 'default' : 'destructive'">
                    {{ usuario.activo ? 'Activo' : 'Inactivo' }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div class="flex items-center justify-end gap-1">
                    <Select :model-value="rolDe(usuario)" @update:model-value="(val) => cambiarRol(usuario, val as Role)">
                      <SelectTrigger class="w-32 size-9">
                        <SelectValue :placeholder="etiquetaRol(rolDe(usuario))" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          v-for="rol in rolesGestionables"
                          :key="rol"
                          :value="rol"
                          :disabled="rol === rolDe(usuario)"
                        >
                          {{ etiquetaRol(rol) }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      class="size-11 lg:size-8"
                      :aria-label="`Editar usuario ${usuario.nombre}`"
                      @click="abrirEditar(usuario)"
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      class="text-destructive hover:text-destructive size-11 lg:size-8"
                      :aria-label="`Eliminar usuario ${usuario.nombre}`"
                      @click="confirmarEliminar(usuario)"
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div v-if="!cargando" class="text-muted-foreground p-4 text-center text-sm">
          {{ usuarios.length }} usuario(s) registrado(s).
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Roles y permisos</CardTitle>
        <CardDescription>Permisos disponibles para cada rol.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div v-for="rol in rolesGestionables" :key="rol" class="space-y-2 rounded-lg border p-4">
          <div class="flex items-center justify-between gap-2">
            <div class="space-y-1">
              <p class="font-medium">{{ ETIQUETAS_ROL[rol] ?? rol }}</p>
              <p class="text-muted-foreground text-xs">Rol actual</p>
            </div>
            <Button v-if="puedeGestionar" size="sm" variant="outline" @click="guardarPermisosRol(rol)">
              Actualizar permisos
            </Button>
          </div>
          <div class="flex flex-wrap gap-2">
            <Badge v-for="permiso in PERMISOS_POR_ROL[rol] ?? []" :key="permiso">
              {{ permiso }}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>

    <Dialog v-model:open="editDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogDescription>
            Modifica los datos del usuario y su estado.
          </DialogDescription>
        </DialogHeader>
        <div v-if="editando" class="space-y-4 py-2">
          <div class="space-y-2">
            <Label>Nombre</Label>
            <Input v-model="editando!.nombre" placeholder="Nombre completo" :disabled="!editando" />
          </div>
          <div class="space-y-2">
            <Label>Correo electrónico</Label>
            <Input type="email" v-model="editando!.email" placeholder="usuario@cujae.edu.cu" :disabled="!editando" />
          </div>
          <div class="space-y-2">
            <Label>Estado</Label>
            <Select
              :model-value="editando!.activo ? 'true' : 'false'"
              @update:model-value="(v) => {
                if (editando) editando.activo = v === 'true'
              }"
            >
              <SelectTrigger class="w-full">
                <SelectValue>{{ editando!.activo ? 'Activo' : 'Inactivo' }}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Activo</SelectItem>
                <SelectItem value="false">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="cerrarEditar">
            Cancelar
          </Button>
          <Button :disabled="!editando" @click="guardarUsuario">
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="eliminarDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar usuario</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar a <strong>{{ usuarioParaEliminar?.email }}</strong>? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" @click="cancelarEliminacion">
            Cancelar
          </Button>
          <Button :disabled="eliminando" @click="confirmarEliminacion">
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>