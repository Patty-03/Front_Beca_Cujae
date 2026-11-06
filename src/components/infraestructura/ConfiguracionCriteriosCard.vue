<script setup lang="ts">
import { ref } from 'vue'
import { SlidersIcon, CheckIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUmbralesEdificiosStore } from '@/stores/umbralesEdificios'

const umbralesStore = useUmbralesEdificiosStore()

const pctBueno = ref(String(umbralesStore.umbrales.pctBueno))
const pctRegular = ref(String(umbralesStore.umbrales.pctRegular))

function guardar() {
  const buenoNum = Number(pctBueno.value)
  const regularNum = Number(pctRegular.value)

  if (isNaN(buenoNum) || buenoNum < 0 || buenoNum > 100 || isNaN(regularNum) || regularNum < 0 || regularNum > 100) {
    toast.error('Los porcentajes deben estar entre 0 y 100.')
    return
  }

  if (regularNum >= buenoNum) {
    toast.error('El umbral regular debe ser menor que el umbral bueno.')
    return
  }

  umbralesStore.actualizar({
    pctBueno: buenoNum,
    pctRegular: regularNum,
  })

  toast.success('Criterios constructivos actualizados', {
    description: `Bueno: ≥ ${buenoNum}% cuartos buenos | Regular: ≥ ${regularNum}% cuartos buenos`,
  })
}
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between gap-4">
      <div>
        <CardTitle class="text-lg flex items-center gap-2">
          <SlidersIcon class="size-5 text-primary" />
          Criterios de Estado Constructivo de Edificios
        </CardTitle>
        <CardDescription>
          Configura los porcentajes de cuartos buenos necesarios para determinar automáticamente el estado general del edificio.
        </CardDescription>
      </div>
      <Button size="sm" @click="guardar">
        <CheckIcon class="size-4 mr-1" />
        Guardar criterios
      </Button>
    </CardHeader>
    <CardContent>
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <Label>Umbral para Edificio "Bueno" (%)</Label>
          <div class="flex items-center gap-2">
            <Input v-model="pctBueno" type="number" min="0" max="100" />
            <span class="text-muted-foreground text-sm font-medium">%</span>
          </div>
          <p class="text-xs text-muted-foreground">
            Porcentaje de cuartos buenos requerido para que el edificio se considere 100% Bueno (por defecto 100%).
          </p>
        </div>

        <div class="space-y-2">
          <Label>Umbral para Edificio "Regular" (%)</Label>
          <div class="flex items-center gap-2">
            <Input v-model="pctRegular" type="number" min="0" max="100" />
            <span class="text-muted-foreground text-sm font-medium">%</span>
          </div>
          <p class="text-xs text-muted-foreground">
            Porcentaje mínimo de cuartos buenos para considerarse Regular; por debajo se considerará Mal estado.
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
