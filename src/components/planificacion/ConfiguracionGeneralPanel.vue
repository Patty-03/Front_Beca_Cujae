<script setup lang="ts">
import { ClockIcon, ListChecksIcon, ShieldOffIcon } from '@lucide/vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TurnosPanel from './TurnosPanel.vue'
import CatalogosPanel from './CatalogosPanel.vue'
import ExcepcionesPanel from './ExcepcionesPanel.vue'
</script>

<template>
  <div class="space-y-4">
    <div>
      <h2 class="text-lg font-semibold tracking-tight">Configuración general</h2>
      <p class="text-muted-foreground mt-0.5 text-sm">
        Es global al sistema: los turnos, catálogos y excepciones se aplican a todos los
        períodos.
      </p>
    </div>

    <Tabs default-value="turnos" class="space-y-4">
      <TabsList>
        <TabsTrigger value="turnos">
          <ClockIcon />
          Turnos
        </TabsTrigger>
        <TabsTrigger value="catalogos">
          <ListChecksIcon />
          Catálogos
        </TabsTrigger>
        <TabsTrigger value="excepciones">
          <ShieldOffIcon />
          Excepciones
        </TabsTrigger>
      </TabsList>

      <TabsContent value="turnos">
        <TurnosPanel />
      </TabsContent>
      <TabsContent value="catalogos">
        <CatalogosPanel />
      </TabsContent>
      <TabsContent value="excepciones">
        <ExcepcionesPanel />
      </TabsContent>
    </Tabs>
  </div>
</template>
