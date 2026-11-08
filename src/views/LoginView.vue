<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowRightIcon,
  Building2Icon,
  EyeIcon,
  EyeOffIcon,
  LoaderCircleIcon,
  LockIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import DemoModeBanner from '@/components/app/DemoModeBanner.vue'
import InsecureContextBanner from '@/components/app/InsecureContextBanner.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const usuario = ref('')
const password = ref('')
const remember = ref(false)
const showPassword = ref(false)

const passwordType = computed(() => (showPassword.value ? 'text' : 'password'))

async function handleSubmit() {
  try {
    await auth.login(usuario.value, password.value, remember.value)
    toast.success('Bienvenido a CUJAE Residencia', {
      description: auth.isDemo
        ? 'Sesión demo iniciada. No se conservará al recargar.'
        : 'Sesión iniciada correctamente.',
    })

    const redirect =
      typeof route.query.redirect === 'string' &&
      route.query.redirect.startsWith('/') &&
      !route.query.redirect.startsWith('//')
        ? route.query.redirect
        : '/'

    await router.replace(redirect)
  } catch (caught) {
    toast.error('No se pudo iniciar sesión', {
      description: caught instanceof Error ? caught.message : 'Inténtalo de nuevo.',
    })
  }
}
</script>

<template>
  <div
    class="bg-brand-surface text-brand-text selection:bg-brand-primary flex min-h-svh flex-col p-4 font-sans antialiased selection:text-white sm:p-6"
  >
    <header class="mb-4 flex w-full items-center justify-between py-2">
      <div class="flex items-center gap-2">
        <div
          class="bg-brand-primary flex size-8 items-center justify-center rounded-lg text-white shadow-sm"
        >
          <Building2Icon class="size-5" />
        </div>
        <div>
          <span
            class="text-brand-primary block text-[10px] leading-none font-bold tracking-wider uppercase"
          >
            CUJAE
          </span>
          <span class="text-brand-navy text-xs leading-tight font-semibold">Residencia</span>
        </div>
      </div>
    </header>

    <main
      class="border-brand-border m-auto flex w-full max-w-sm flex-col rounded-2xl border bg-white p-6 shadow-xl"
    >
      <InsecureContextBanner class="mb-4" />
      <DemoModeBanner class="mb-4" />

      <p
        v-if="auth.sessionError"
        role="alert"
        class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800"
      >
        {{ auth.sessionError }}
      </p>

      <div class="mb-6 text-center">
        <div
          class="from-brand-navy to-brand-primary mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr text-white shadow-md"
        >
          <ShieldCheckIcon class="size-8" />
        </div>
        <h1 class="text-brand-navy text-xl font-bold tracking-tight">Inicio de Sesión</h1>
        <p class="text-brand-text-secondary mt-1 text-xs">
          Sistema de Gestión de Residencia Estudiantil
        </p>
      </div>

      <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
        <div>
          <Label
            for="username"
            class="mb-1 block text-xs font-semibold tracking-wider text-slate-700 uppercase"
          >
            Usuario
          </Label>
          <div class="relative">
            <div
              class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"
            >
              <UserIcon class="size-[18px]" />
            </div>
            <Input
              id="username"
              v-model="usuario"
              type="text"
              placeholder="Usuario"
              autocomplete="username"
              required
              class="focus-visible:border-brand-primary focus-visible:ring-brand-primary/20 h-12 rounded-xl border-slate-200 bg-slate-50 pr-3 pl-10 text-sm text-slate-900 transition-all placeholder:text-slate-500 focus:bg-white focus-visible:ring-2"
            />
          </div>
        </div>

        <div>
          <div class="mb-1 flex items-center justify-between">
            <Label
              for="password"
              class="block text-xs font-semibold tracking-wider text-slate-700 uppercase"
            >
              Contraseña
            </Label>
          </div>
          <div class="relative">
            <div
              class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"
            >
              <LockIcon class="size-[18px]" />
            </div>
            <Input
              id="password"
              v-model="password"
              :type="passwordType"
              placeholder="••••••••••••"
              autocomplete="current-password"
              required
              class="focus-visible:border-brand-primary focus-visible:ring-brand-primary/20 h-12 rounded-xl border-slate-200 bg-slate-50 pr-10 pl-10 text-sm text-slate-900 transition-all placeholder:text-slate-500 focus:bg-white focus-visible:ring-2"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 transition-colors hover:text-slate-600"
              :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              @click="showPassword = !showPassword"
            >
              <EyeOffIcon v-if="showPassword" class="size-[18px]" />
              <EyeIcon v-else class="size-[18px]" />
            </button>
          </div>
        </div>

        <div class="space-y-1 pt-1">
          <label class="flex cursor-pointer items-center gap-2">
            <input
              v-model="remember"
              type="checkbox"
              :disabled="auth.isDemo"
              :title="auth.isDemo ? 'No disponible en modo demo' : undefined"
              class="accent-brand-primary focus:ring-brand-primary size-4 rounded border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <span class="text-xs text-slate-600">Mantener sesión iniciada</span>
          </label>
          <p v-if="auth.isDemo" class="text-muted-foreground pl-6 text-[11px]">
            El modo demo no conserva la sesión al recargar.
          </p>
        </div>

        <Button
          type="submit"
          :disabled="auth.isLoading"
          class="bg-brand-primary hover:bg-brand-primary-hover h-12 w-full cursor-pointer gap-2 rounded-xl text-sm font-semibold text-white shadow-md transition-all active:scale-95 disabled:opacity-70"
        >
          <LoaderCircleIcon v-if="auth.isLoading" class="size-[18px] animate-spin" />
          <span>{{ auth.isLoading ? 'INICIANDO…' : 'INICIAR SESIÓN' }}</span>
          <ArrowRightIcon v-if="!auth.isLoading" class="size-[18px]" />
        </Button>
      </form>
    </main>
  </div>
</template>
