<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowLeftIcon, CompassIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const destination = computed(() => (auth.isAuthenticated ? '/' : '/login'))
const label = computed(() => (auth.isAuthenticated ? 'Ir al inicio' : 'Iniciar sesión'))
</script>

<template>
  <div
    class="bg-background flex min-h-svh flex-col items-center justify-center gap-5 p-6 text-center"
  >
    <div class="bg-muted flex size-14 items-center justify-center rounded-full">
      <CompassIcon class="text-muted-foreground size-7" />
    </div>
    <div class="space-y-2">
      <p class="text-muted-foreground font-mono text-sm">404</p>
      <h1 class="text-3xl font-semibold tracking-tight">Página no encontrada</h1>
      <p class="text-muted-foreground max-w-sm text-sm">
        La ruta que buscas no existe o fue movida. Revisa la dirección o vuelve al inicio.
      </p>
    </div>
    <Button as-child>
      <RouterLink :to="destination">
        <ArrowLeftIcon />
        {{ label }}
      </RouterLink>
    </Button>
  </div>
</template>
