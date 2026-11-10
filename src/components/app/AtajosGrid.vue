<script setup lang="ts">
import type { Component } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRightIcon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface Modulo {
  nombre: string
  descripcion: string
  ruta: string
  icono: Component
  disponible: boolean
  etiqueta: string
}

const props = defineProps<{
  modulos: Modulo[]
}>()
</script>

<template>
  <section class="space-y-4">
    <div>
      <h2 class="text-brand-navy text-lg font-semibold tracking-tight">Accesos rápidos</h2>
      <p class="text-muted-foreground mt-1 text-sm">
        {{ modulos.length === 1 ? 'Tu espacio personal en el sistema de gestión de la residencia.' : 'Módulos disponibles en el sistema de gestión de la residencia.' }}
      </p>
    </div>

    <div
      class="grid gap-4"
      :class="
        modulos.length === 1 ? 'sm:max-w-sm' : 'sm:grid-cols-2 xl:grid-cols-4'
      "
    >
      <RouterLink
        v-for="modulo in modulos"
        :key="modulo.ruta"
        :to="modulo.ruta"
        class="group block h-full rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <Card
          class="h-full gap-0 py-0 shadow-xs transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:ring-primary/40"
        >
          <CardContent class="flex h-full flex-col p-5">
            <div class="flex items-start justify-between gap-3">
              <div
                class="flex size-11 shrink-0 items-center justify-center rounded-xl"
                :class="
                  modulo.disponible
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                "
              >
                <component :is="modulo.icono" class="size-5" />
              </div>
              <Badge :variant="modulo.disponible ? 'default' : 'outline'">
                {{ modulo.etiqueta }}
              </Badge>
            </div>

            <div class="mt-4 flex-1 space-y-1.5">
              <h3 class="text-brand-navy text-base font-semibold">{{ modulo.nombre }}</h3>
              <p class="text-muted-foreground text-sm leading-relaxed">
                {{ modulo.descripcion }}
              </p>
            </div>

            <div class="text-primary mt-5 flex items-center gap-1.5 text-sm font-medium">
              <span>{{ modulo.disponible ? 'Abrir módulo' : 'Ver módulo' }}</span>
              <ArrowRightIcon
                class="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </div>
          </CardContent>
        </Card>
      </RouterLink>
    </div>
  </section>
</template>
