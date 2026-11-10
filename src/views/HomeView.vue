<script setup lang="ts">
import type { Component } from 'vue'
import { computed, onMounted, ref } from 'vue'
import { esSoloEstudiante } from '@/lib/auth'
import { Building2Icon } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import BannerAvisos from '@/components/app/BannerAvisos.vue'
import AtajosGrid from '@/components/app/AtajosGrid.vue'
import { obtenerAvisos } from '@/services/estudiante-view'
import type { Aviso } from '@/types/estudiante-view'

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
const esEstudiante = computed(() => esSoloEstudiante(auth.user?.roles ?? []))

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
    icono: Building2Icon,
    disponible: false,
    etiqueta: 'En preparación',
  },
  {
    nombre: 'Estudiantes',
    descripcion: 'Consulta la información y el estado de los estudiantes residentes.',
    ruta: '/estudiantes',
    icono: Building2Icon,
    disponible: false,
    etiqueta: 'En preparación',
  },
  {
    nombre: 'Evaluaciones',
    descripcion: 'Revisa y registra las evaluaciones realizadas a los estudiantes.',
    ruta: '/evaluaciones',
    icono: Building2Icon,
    disponible: false,
    etiqueta: 'En preparación',
  },
  {
    nombre: 'Solicitudes de medios',
    descripcion: 'Aprueba o rechaza las solicitudes de medios propios de los estudiantes.',
    ruta: '/solicitudes-medios',
    icono: Building2Icon,
    disponible: true,
    etiqueta: 'Disponible',
  },
]

const moduloMiPerfil: Modulo = {
  nombre: 'Mi Perfil',
  descripcion: 'Consulta tus datos personales, académicos y tu asignación de alojamiento.',
  ruta: '/estudiante',
  icono: Building2Icon,
  disponible: true,
  etiqueta: 'Disponible',
}

const moduloSolicitarMedio: Modulo = {
  nombre: 'Solicitar medio',
  descripcion: 'Pide un medio propio para tu cuarto, como un ventilador, una lámpara o una silla.',
  ruta: '/solicitar-medio',
  icono: Building2Icon,
  disponible: true,
  etiqueta: 'Disponible',
}

const modulosVisibles = computed(() =>
  esEstudiante.value ? [moduloMiPerfil, moduloSolicitarMedio] : modulos
)

const avisos = ref<Aviso[]>([])
const avisosCargando = ref(false)

async function cargarAvisos() {
  avisosCargando.value = true
  try {
    avisos.value = await obtenerAvisos()
  } catch {
    avisos.value = []
  } finally {
    avisosCargando.value = false
  }
}

onMounted(cargarAvisos)
</script>

<template>
  <div class="space-y-6">
    <BannerAvisos :avisos="avisos" />

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

    <AtajosGrid :modulos="modulosVisibles" />
  </div>
</template>
