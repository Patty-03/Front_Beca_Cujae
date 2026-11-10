<script setup lang="ts">
import type { Aviso } from '@/types/estudiante-view'
import { onMounted, ref } from 'vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import BannerAvisos from '@/components/app/BannerAvisos.vue'
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

    <Card v-if="!cargando && !error && avisos.length === 0">
      <CardHeader>
        <CardTitle>Sin avisos</CardTitle>
        <CardDescription>No hay avisos publicados en este momento.</CardDescription>
      </CardHeader>
      <CardContent class="pt-4">
        <div class="text-center text-muted-foreground text-sm py-8">
          Vuelve más tarde para ver los nuevos comunicados de la residencia.
        </div>
      </CardContent>
    </Card>

    <BannerAvisos :avisos="avisos" v-if="!cargando && !error" />
  </div>
</template>
