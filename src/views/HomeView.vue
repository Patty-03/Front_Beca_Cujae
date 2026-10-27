<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowRightIcon,
  Building2Icon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  GraduationCapIcon,
} from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth'

interface Modulo {
  nombre: string
  descripcion: string
  ruta: string
  icono: Component
  disponible: boolean
  etiqueta: string
}

const auth = useAuthStore()

const nombreUsuario = computed(() => auth.user?.name ?? 'estudiante')

const modulos: Modulo[] = [
  {
    nombre: 'Infraestructura',
    descripcion: 'Consulta y administra edificios, escaleras, cuartos y su estado constructivo.',
    ruta: '/infraestructura',
    icono: Building2Icon,
    disponible: true,
    etiqueta: 'Disponible',
  },
  {
    nombre: 'Deberes',
    descripcion: 'Gestiona las tareas y responsabilidades de los estudiantes de la residencia.',
    ruta: '/deberes',
    icono: ClipboardListIcon,
    disponible: false,
    etiqueta: 'En preparación',
  },
  {
    nombre: 'Estudiantes',
    descripcion: 'Consulta la información y el estado de los estudiantes residentes.',
    ruta: '/estudiantes',
    icono: GraduationCapIcon,
    disponible: false,
    etiqueta: 'En preparación',
  },
  {
    nombre: 'Evaluaciones',
    descripcion: 'Revisa y registra las evaluaciones realizadas a los estudiantes.',
    ruta: '/evaluaciones',
    icono: ClipboardCheckIcon,
    disponible: false,
    etiqueta: 'En preparación',
  },
]
</script>

<template>
  <div class="space-y-6">
    <section
      class="from-brand-navy to-brand-primary relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-sm sm:p-8"
    >
      <div class="pointer-events-none absolute -top-12 -right-8 opacity-10" aria-hidden="true">
        <Building2Icon class="size-64" />
      </div>

      <div class="relative max-w-2xl">
        <span
          class="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wider uppercase backdrop-blur-sm"
        >
          CUJAE · Residencia
        </span>
        <h1 class="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
          Hola, {{ nombreUsuario }}
        </h1>
        <p class="mt-2 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
          Bienvenido al panel general de la residencia estudiantil. Selecciona un módulo para
          comenzar a trabajar.
        </p>
      </div>
    </section>

    <section class="space-y-4">
      <div>
        <h2 class="text-brand-navy text-lg font-semibold tracking-tight">Accesos rápidos</h2>
        <p class="text-muted-foreground mt-1 text-sm">
          Módulos disponibles en el sistema de gestión de la residencia.
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RouterLink
          v-for="modulo in modulos"
          :key="modulo.ruta"
          :to="modulo.ruta"
          class="group block h-full rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          :aria-label="`Abrir módulo ${modulo.nombre}`"
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
  </div>
</template>
