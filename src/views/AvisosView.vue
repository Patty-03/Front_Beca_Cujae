<script setup lang="ts">
import type { Aviso } from '@/types/estudiante-view'
import { onMounted, ref } from 'vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import AvisosHero from '@/components/estudiante-view/AvisosHero.vue'
import { obtenerAvisos } from '@/services/estudiante-view'

const avisos = ref<Aviso[]>([])
const cargando = ref(true)
const error = ref('')

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    avisos.value = await obtenerAvisos()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'No se pudieron cargar los avisos.'
    avisos.value = []
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold tracking-tight">Avisos</h1>

    <Alert v-if="error" variant="destructive">
      <AlertTitle>No se pudieron cargar los avisos</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <AvisosHero :avisos="avisos" v-if="!cargando" />
  </div>
</template>
