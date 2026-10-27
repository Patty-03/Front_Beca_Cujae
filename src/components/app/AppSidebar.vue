<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  AwardIcon,
  ChevronsUpDownIcon,
  ClipboardListIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  LogOutIcon,
} from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { getInitials } from '@/lib/format'
import { useAuthStore } from '@/stores/auth'

interface NavItem {
  label: string
  to: string
  icon: Component
}

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { isMobile, setOpenMobile } = useSidebar()

const navigation: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboardIcon },
  { label: 'Solicitudes', to: '/solicitudes', icon: ClipboardListIcon },
  { label: 'Becas', to: '/becas', icon: AwardIcon },
]

const initials = computed(() => getInitials(auth.user?.name ?? 'Usuario'))

function handleNavigate() {
  if (isMobile.value) setOpenMobile(false)
}

async function handleLogout() {
  auth.logout()
  await router.push({ name: 'login' })
  toast.success('Sesión cerrada correctamente')
}
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child>
            <RouterLink to="/dashboard">
              <div
                class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
              >
                <GraduationCapIcon class="size-4" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">Becas CUJAE</span>
                <span class="text-muted-foreground truncate text-xs">Gestión de becas</span>
              </div>
            </RouterLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Principal</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in navigation" :key="item.to">
              <SidebarMenuButton :is-active="route.path === item.to" :tooltip="item.label" as-child>
                <RouterLink :to="item.to" @click="handleNavigate">
                  <component :is="item.icon" />
                  <span>{{ item.label }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton
                size="lg"
                class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar class="size-8 rounded-lg">
                  <AvatarFallback class="text-xs">{{ initials }}</AvatarFallback>
                </Avatar>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">{{ auth.user?.name }}</span>
                  <span class="text-muted-foreground truncate text-xs">
                    {{ auth.user?.email }}
                  </span>
                </div>
                <ChevronsUpDownIcon class="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" :side-offset="8" class="w-56">
              <DropdownMenuLabel>
                <p class="text-sm font-medium">{{ auth.user?.name }}</p>
                <p class="text-muted-foreground text-xs font-normal">{{ auth.user?.role }}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem @select="handleLogout">
                <LogOutIcon />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
</template>
