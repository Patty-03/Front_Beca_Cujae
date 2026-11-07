<script setup lang="ts">
import type { Documento } from '@/types/estudiante-view'
import { computed, ref } from 'vue'
import {
  FileTextIcon,
  UsersIcon,
} from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import { ETIQUETAS_TIPO_DOCUMENTO } from '@/types/estudiante-view'
import { obtenerDocumentos } from '@/services/estudiante-view'
import { useAuthStore } from '@/stores/auth'
import SubirDocumentoDialog from '@/components/estudiante-view/SubirDocumentoDialog.vue'

const auth = useAuthStore()
const puedeEscribir = computed(() => auth.can('usuarios:manage'))

const documentos = ref<Documento[]>([])
const cargando = ref(true)
const error = ref('')
const subirAbierto = ref(false)

const documentosSinFirmar = computed(() =>
  documentos.value.filter((d) => !d.firmado).length,
)
const documentosFirmados = computed(() =>
  documentos.value.filter((d) => d.firmado).length,
)

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    documentos.value = await obtenerDocumentos()
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : 'No se pudo cargar los documentos.'
  } finally {
    cargando.value = false
  }
}

async function alSubir(documento: Documento) {
  subirAbierto.value = false
  await cargar()
  toast.success('Documento subido', {
    description: `${documento.nombre} está disponible para firma.`,
  })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Documentos para firma</h1>
        <p class="text-muted-foreground mt-1 text-sm">
          Gestione los documentos que los estudiantes deben firmar digitalmente.
        </p>
      </div>
      <Button v-if="puedeEscribir" @click="subirAbierto = true">
        <UsersIcon />
        Subir documento
      </Button>
    </div>

    <Alert v-if="error" variant="destructive">
      <AlertTitle>Error al cargar documentos</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Total documentos</CardTitle>
          <CardDescription>Documentos disponibles para firma.</CardDescription>
        </CardHeader>
        <CardContent class="pt-0">
          <div class="text-2xl font-bold">{{ documentos.length }}</div>
        </CardContent>
      </Card>
      <Card tono="emerald">
        <CardHeader>
          <CardTitle>Firmados</CardTitle>
          <CardDescription>Documentos con firma digital registrada.</CardDescription>
        </CardHeader>
        <CardContent class="pt-0 tono-emerald">
          <div class="text-2xl font-bold">{{ documentosFirmados }}</div>
        </CardContent>
      </Card>
      <Card tono="amber">
        <CardHeader>
          <CardTitle>Pendientes de firma</CardTitle>
          <CardDescription>Documentos aún no firmados.</CardDescription>
        </CardHeader>
        <CardContent class="pt-0 tono-amber">
          <div class="text-2xl font-bold">{{ documentosSinFirmar }}</div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Listado de documentos</CardTitle>
        <CardDescription>
          Los estudiantes pueden firmar estos documentos desde su perfil.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="cargando" class="grid gap-3">
          <Skeleton v-for="indice in 5" :key="indice" class="h-16 w-full" />
        </div>

        <div v-else-if="documentos.length === 0" class="py-12 text-center">
          <FileTextIcon class="text-muted-foreground size-10 mx-auto" />
          <p class="mt-2 text-muted-foreground">No hay documentos registrados.</p>
          <Button v-if="puedeEscribir" @click="subirAbierto = true">
            Subir primer documento
          </Button>
        </div>

        <div v-else class="grid gap-3">
          <div
            v-for="documento in documentos"
            :key="documento.id"
            class="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
              <div class="flex items-center gap-3">
                <FileTextIcon class="size-4 text-muted-foreground" />
                <div>
                  <p class="font-medium">{{ documento.nombre }}</p>
                  <p class="text-muted-foreground text-xs">
                    {{ ETIQUETAS_TIPO_DOCUMENTO[documento.tipo] }}
                  </p>
                </div>
              </div>
              <Badge
                :variant="documento.firmado ? 'secondary' : 'outline'"
              >
                {{ documento.firmado ? 'Firmado' : 'Pendiente de firma' }}
              </Badge>
            </div>

            <p class="text-muted-foreground text-sm line-clamp-1">
              {{ documento.descripcion }}
            </p>

            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Subido: {{ formatDate(documento.fechaSubida) }}</span>
              <span v-if="documento.firmado && documento.fechaFirma">
                · Firma: {{ formatDate(documento.fechaFirma) }}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <SubirDocumentoDialog
      v-model:open="subirAbierto"
      @subido="alSubir"
    />
  </div>
</template>
