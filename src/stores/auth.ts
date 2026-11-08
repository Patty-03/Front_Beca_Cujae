import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Permission, Role, Session, SessionUser } from '@/types/auth'
import { crearAuthGateway, modoDemo } from '@/services/auth'
import { validarEmail, validarPassword, validarUsuario } from '@/lib/validation'

const LEGACY_STORAGE_KEY = 'beca-cujae-user'

type AuthStatus = 'unknown' | 'anonymous' | 'authenticated'

function limpiarSesionLegacy(): void {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // El almacenamiento puede estar deshabilitado; no hay nada que limpiar.
  }
}

function mensajeError(caught: unknown): string {
  return caught instanceof Error ? caught.message : 'No se pudo completar la operación.'
}

export const useAuthStore = defineStore('auth', () => {
  const gateway = crearAuthGateway()

  const session = ref<Session | null>(null)
  const user = ref<SessionUser | null>(null)
  const status = ref<AuthStatus>('unknown')
  const isLoading = ref(false)
  const sessionError = ref('')
  const isAuthenticated = computed(() => status.value === 'authenticated' && user.value !== null)
  const isDemo = modoDemo

  let initializePromise: Promise<void> | null = null

  function aplicarSesion(nextSession: Session | null): void {
    session.value = nextSession
    user.value = nextSession?.user ?? null
    status.value = nextSession ? 'authenticated' : 'anonymous'
  }

  async function initialize(): Promise<void> {
    if (status.value !== 'unknown') return

    initializePromise ??= (async () => {
      limpiarSesionLegacy()

      try {
        aplicarSesion(await gateway.getSession())
        sessionError.value = ''
      } catch (caught) {
        aplicarSesion(null)
        sessionError.value = mensajeError(caught)
      }
    })()

    await initializePromise
  }

  async function login(usuario: string, password: string, remember = false): Promise<void> {
    isLoading.value = true
    sessionError.value = ''

    try {
      const credentials = {
        email: modoDemo ? validarEmail(usuario) : validarUsuario(usuario),
        password: validarPassword(password),
        remember,
      }

      aplicarSesion(await gateway.login(credentials))
    } catch (caught) {
      sessionError.value = mensajeError(caught)
      throw caught
    } finally {
      isLoading.value = false
    }
  }

  async function logout(): Promise<void> {
    isLoading.value = true

    try {
      await gateway.logout()
    } finally {
      aplicarSesion(null)
      isLoading.value = false
    }
  }

  function can(permission: Permission): boolean {
    return user.value?.permissions.includes(permission) ?? false
  }

  function hasRole(role: Role): boolean {
    return user.value?.roles.includes(role) ?? false
  }

  return {
    session,
    user,
    status,
    isLoading,
    sessionError,
    isAuthenticated,
    isDemo,
    initialize,
    login,
    logout,
    can,
    hasRole,
  }
})
