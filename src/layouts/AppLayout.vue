<script setup lang="ts">
import AppHeader from '@/components/app/AppHeader.vue'
import AppSidebar from '@/components/app/AppSidebar.vue'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <AppHeader />
      <div class="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <RouterView />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
