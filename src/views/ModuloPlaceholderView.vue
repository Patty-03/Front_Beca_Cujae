<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeftIcon, ConstructionIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const route = useRoute()

const titulo = computed(() => route.meta.title ?? 'Módulo')
const descripcion = computed(
  () =>
    route.meta.description ??
    'Este módulo se encuentra en preparación y estará disponible próximamente.',
)
</script>

<template>
  <div class="flex min-h-[60vh] items-center justify-center">
    <Card class="w-full max-w-lg">
      <CardContent class="flex flex-col items-center px-6 py-10 text-center">
        <div
          class="bg-primary/10 text-primary mb-4 flex size-14 items-center justify-center rounded-2xl"
        >
          <ConstructionIcon class="size-7" />
        </div>
        <h1 class="text-brand-navy text-xl font-semibold tracking-tight">{{ titulo }}</h1>
        <p class="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed">
          {{ descripcion }}
        </p>
        <Button as-child class="mt-6">
          <RouterLink to="/">
            <ArrowLeftIcon />
            Volver al inicio
          </RouterLink>
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
