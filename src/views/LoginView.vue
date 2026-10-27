<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AlertCircleIcon,
  EyeIcon,
  EyeOffIcon,
  GraduationCapIcon,
  Loader2Icon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@lucide/vue'
import { toast } from 'vue-sonner'
import ModeToggle from '@/components/ModeToggle.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')

const passwordType = computed(() => (showPassword.value ? 'text' : 'password'))

async function handleSubmit() {
  error.value = ''

  try {
    await auth.login(email.value, password.value)
    toast.success('Bienvenido a Becas CUJAE', {
      description: 'Sesión iniciada correctamente.',
    })

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    await router.replace(redirect)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'No se pudo iniciar sesión.'
  }
}

function fillDemoCredentials() {
  email.value = 'estudiante@cujae.edu.cu'
  password.value = 'beca2026'
  error.value = ''
}
</script>

<template>
  <div class="grid min-h-svh lg:grid-cols-2">
    <div
      class="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-10 text-white lg:flex"
    >
      <div class="absolute -top-24 -right-24 size-72 rounded-full bg-white/10 blur-3xl" />
      <div class="absolute -bottom-32 -left-20 size-80 rounded-full bg-white/10 blur-3xl" />

      <div class="relative flex items-center gap-3">
        <div class="flex size-10 items-center justify-center rounded-xl bg-white/10">
          <GraduationCapIcon class="size-6" />
        </div>
        <div>
          <p class="font-semibold">Becas CUJAE</p>
          <p class="text-white/70 text-xs">Universidad Tecnológica de La Habana</p>
        </div>
      </div>

      <div class="relative space-y-6">
        <h2 class="max-w-md text-4xl font-semibold tracking-tight">
          Impulsa tu futuro con una beca universitaria.
        </h2>
        <p class="text-white/70 max-w-sm">
          Gestiona tus solicitudes, consulta requisitos y da seguimiento a cada etapa desde un solo
          lugar.
        </p>
        <div class="grid max-w-md grid-cols-2 gap-4">
          <div class="border-white/10 bg-white/5 rounded-xl border p-4">
            <p class="text-2xl font-semibold">+1.200</p>
            <p class="text-white/70 text-xs">Estudiantes beneficiados</p>
          </div>
          <div class="border-white/10 bg-white/5 rounded-xl border p-4">
            <p class="text-2xl font-semibold">4</p>
            <p class="text-white/70 text-xs">Programas activos</p>
          </div>
        </div>
      </div>

      <div class="text-white/60 relative flex items-center gap-2 text-xs">
        <ShieldCheckIcon class="size-4" />
        Información protegida y actualizada
      </div>
    </div>

    <div class="relative flex items-center justify-center p-6">
      <div class="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <div class="w-full max-w-sm space-y-8">
        <div class="space-y-2">
          <div class="flex items-center gap-2 lg:hidden">
            <div
              class="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg"
            >
              <GraduationCapIcon class="size-5" />
            </div>
            <span class="font-semibold">Becas CUJAE</span>
          </div>
          <h1 class="text-2xl font-semibold tracking-tight">Inicia sesión</h1>
          <p class="text-muted-foreground text-sm">
            Accede con tu correo institucional para consultar tus becas.
          </p>
        </div>

        <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
          <Alert v-if="error" variant="destructive" class="py-2">
            <AlertCircleIcon />
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>

          <div class="space-y-2">
            <Label for="email">Correo electrónico</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="estudiante@cujae.edu.cu"
              autocomplete="email"
              required
            />
          </div>

          <div class="space-y-2">
            <Label for="password">Contraseña</Label>
            <div class="relative">
              <Input
                id="password"
                v-model="password"
                :type="passwordType"
                placeholder="••••••••"
                autocomplete="current-password"
                class="pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                class="absolute top-1/2 right-1 -translate-y-1/2"
                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                @click="showPassword = !showPassword"
              >
                <EyeOffIcon v-if="showPassword" class="size-4" />
                <EyeIcon v-else class="size-4" />
              </Button>
            </div>
          </div>

          <Button type="submit" class="w-full" :disabled="auth.isLoading">
            <Loader2Icon v-if="auth.isLoading" class="animate-spin" />
            <SparklesIcon v-else />
            {{ auth.isLoading ? 'Entrando…' : 'Entrar' }}
          </Button>
        </form>

        <div class="bg-muted/50 space-y-1 rounded-lg border p-3 text-xs">
          <p class="font-medium">Acceso de demostración</p>
          <p class="text-muted-foreground">
            Usa <span class="font-mono">estudiante@cujae.edu.cu</span> y
            <span class="font-mono">beca2026</span>.
          </p>
          <Button variant="link" size="xs" class="h-auto px-0" @click="fillDemoCredentials">
            Rellenar credenciales
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
