<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { BellIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'
import ModeToggle from '@/components/ModeToggle.vue'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

const route = useRoute()
const pageTitle = computed(() => route.meta.title ?? 'Dashboard')

function showNotifications() {
  toast.info('No tienes notificaciones nuevas')
}
</script>

<template>
  <header
    class="bg-background/80 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur md:px-6"
  >
    <SidebarTrigger class="-ml-1" />
    <Separator orientation="vertical" class="mr-1 h-4!" />

    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem class="hidden md:block">
          <BreadcrumbLink as-child>
            <RouterLink to="/dashboard">Inicio</RouterLink>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator class="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>{{ pageTitle }}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>

    <div class="ml-auto flex items-center gap-2">
      <Button variant="ghost" size="icon-sm" aria-label="Notificaciones" @click="showNotifications">
        <BellIcon class="size-4" />
      </Button>
      <ModeToggle />
    </div>
  </header>
</template>
