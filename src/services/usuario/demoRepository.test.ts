import { describe, expect, it } from 'vitest'
import type { Permission } from '@/types/auth'
import { demoUsuarioRepository } from './demoRepository'

describe('demoUsuarioRepository', () => {
  it('devuelve los usuarios demo', async () => {
    const usuarios = await demoUsuarioRepository.obtenerUsuarios()

    expect(usuarios.length).toBeGreaterThan(0)
    expect(usuarios[0]?.id).toBeDefined()
    expect(usuarios[0]?.roles).toBeDefined()
  })

  it('crea un usuario con rol', async () => {
    const creado = await demoUsuarioRepository.crearUsuario({
      nombre: 'Nuevo Usuario Demo',
      email: 'nuevo@beca.cujae.edu',
      roles: ['estudiante'],
      activo: true,
    })

    expect(creado.id).toBeTruthy()
    expect(creado.nombre).toBe('Nuevo Usuario Demo')
    expect(creado.email).toBe('nuevo@beca.cujae.edu')
    expect(creado.roles).toEqual(['estudiante'])
    expect(creado.activo).toBe(true)
  })

  it('actualiza un usuario existente', async () => {
    const usuarios = await demoUsuarioRepository.obtenerUsuarios()
    const objetivo = usuarios[0]
    if (!objetivo) throw new Error('No hay usuarios demo para actualizar.')

    const actualizado = await demoUsuarioRepository.actualizarUsuario({
      id: objetivo.id,
      nombre: objetivo.nombre,
      email: objetivo.email,
      roles: objetivo.roles,
      activo: true,
    })

    expect(actualizado.id).toBe(objetivo.id)
    expect(actualizado.nombre).toBe(objetivo.nombre)
  })

  it('elimina un usuario existente', async () => {
    const usuarios = await demoUsuarioRepository.obtenerUsuarios()
    const objetivo = usuarios[0]
    if (!objetivo) throw new Error('No hay usuarios demo para eliminar.')

    await demoUsuarioRepository.eliminarUsuario(objetivo.id)

    const restantes = await demoUsuarioRepository.obtenerUsuarios()
    expect(restantes.some((usuario) => usuario.id === objetivo.id)).toBe(false)
  })

  it('asigna un rol a un usuario', async () => {
    const usuarios = await demoUsuarioRepository.obtenerUsuarios()
    const objetivo = usuarios[0]
    if (!objetivo) throw new Error('No hay usuarios demo para asignar rol.')

    const actualizado = await demoUsuarioRepository.asignarRol(objetivo.id, 'operador')

    expect(actualizado.roles).toEqual(['operador'])
  })

  it('actualiza los permisos de un rol', async () => {
    const permisos: Permission[] = ['infraestructura:read']
    const resultado = await demoUsuarioRepository.actualizarPermisosRol('estudiante', permisos)

    expect(resultado.rol).toBe('estudiante')
    expect(resultado.permisos).toEqual(permisos)
  })
})