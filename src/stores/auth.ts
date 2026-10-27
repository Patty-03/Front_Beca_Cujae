import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { User } from '@/types'

const STORAGE_KEY = 'beca-cujae-user'

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'id' in parsed &&
      'name' in parsed &&
      'email' in parsed &&
      'role' in parsed
    ) {
      return parsed as User
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }

  return null
}

function displayName(email: string): string {
  const [localPart = ''] = email.split('@')
  const name = localPart
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

  return name || 'Estudiante CUJAE'
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(loadUser())
  const isLoading = ref(false)
  const isAuthenticated = computed(() => user.value !== null)

  async function login(email: string, password: string) {
    isLoading.value = true

    try {
      await new Promise((resolve) => setTimeout(resolve, 700))

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Introduce un correo electrónico válido.')
      }

      if (password.trim().length < 4) {
        throw new Error('La contraseña debe tener al menos 4 caracteres.')
      }

      const nextUser: User = {
        id: crypto.randomUUID(),
        name: displayName(email),
        email,
        role: 'Estudiante de pregrado',
      }

      user.value = nextUser
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    user.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return { user, isLoading, isAuthenticated, login, logout }
})
