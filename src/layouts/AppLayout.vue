<script setup lang="ts">
import AppHeader from '@/components/app/AppHeader.vue'
import AppSidebar from '@/components/app/AppSidebar.vue'
import DemoModeBanner from '@/components/app/DemoModeBanner.vue'
import InsecureContextBanner from '@/components/app/InsecureContextBanner.vue'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
</script>

<template>
  <SidebarProvider>
    <a
      href="#contenido-principal"
      class="focus:bg-background focus:text-foreground focus:ring-ring sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2"
    >
      Saltar al contenido principal
    </a>
    <AppSidebar />
    <SidebarInset id="contenido-principal" tabindex="-1">
      <AppHeader />
      <div class="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <InsecureContextBanner />
        <DemoModeBanner />
        <RouterView />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
