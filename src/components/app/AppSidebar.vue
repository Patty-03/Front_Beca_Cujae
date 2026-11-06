<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  Building2Icon,
  ChevronsUpDownIcon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  GraduationCapIcon,
  HouseIcon,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
import type { Permission } from '@/types/auth'
import { ETIQUETAS_ROL } from '@/lib/auth'
import { getInitials } from '@/lib/format'
import { useAuthStore } from '@/stores/auth'

interface NavItem {
  label: string
  to: string
  icon: Component
  exact?: boolean
  permission?: Permission
  children?: { label: string; to: string }[]
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { isMobile, setOpenMobile } = useSidebar()

const navigation: NavGroup[] = [
  {
    label: 'General',
    items: [{ label: 'Inicio', to: '/', icon: HouseIcon, exact: true }],
  },
  {
    label: 'Módulos',
    items: [
      {
        label: 'Infraestructura',
        to: '/infraestructura',
        icon: Building2Icon,
        exact: true,
        permission: 'infraestructura:read',
        children: [
          { label: 'General / Resumen', to: '/infraestructura' },
          { label: 'Edificios', to: '/infraestructura/edificios' },
        ],
      },
      {
        label: 'Deberes',
        to: '/deberes',
        icon: ClipboardListIcon,
        exact: true,
        permission: 'deberes:read',
      },
      {
        label: 'Estudiantes',
        to: '/estudiantes',
        icon: GraduationCapIcon,
        exact: true,
        permission: 'estudiantes:read',
      },
      {
        label: 'Evaluaciones',
        to: '/evaluaciones',
        icon: ClipboardCheckIcon,
        exact: true,
        permission: 'evaluaciones:read',
      },
    ],
  },
]

const gruposVisibles = computed(() =>
  navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || auth.can(item.permission)),
    }))
    .filter((group) => group.items.length > 0),
)

const initials = computed(() => getInitials(auth.user?.name ?? 'Usuario'))
const rolPrincipal = computed(() => auth.user?.roles[0])
const rolEtiqueta = computed(() =>
  rolPrincipal.value ? ETIQUETAS_ROL[rolPrincipal.value] : 'Sin rol asignado',
)

function esRutaActiva(item: NavItem) {
  if (item.exact) return route.path === item.to
  return route.path === item.to || route.path.startsWith(`${item.to}/`)
}

function handleNavigate() {
  if (isMobile.value) setOpenMobile(false)
}

async function handleLogout() {
  let falloEnServidor = false

  try {
    await auth.logout()
  } catch {
    falloEnServidor = true
  }

  await router.push({ name: 'login' })

  if (falloEnServidor) {
    toast.warning('La sesión local se cerró, pero no se pudo confirmar con el servidor.')
    return
  }

  toast.success('Sesión cerrada correctamente')
}
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child>
            <RouterLink to="/">
              <div
                class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
              >
                <GraduationCapIcon class="size-4" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">Residencia CUJAE</span>
                <span class="text-muted-foreground truncate text-xs">Gestión de residencia</span>
              </div>
            </RouterLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup v-for="group in gruposVisibles" :key="group.label">
        <SidebarGroupLabel>{{ group.label }}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <template v-for="item in group.items" :key="item.to">
              <template v-if="item.children">
                <SidebarMenuItem>
                  <SidebarMenuButton :is-active="esRutaActiva(item)" :tooltip="item.label" as-child>
                    <RouterLink :to="item.to" @click="handleNavigate">
                      <component :is="item.icon" />
                      <span>{{ item.label }}</span>
                    </RouterLink>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem v-for="child in item.children" :key="child.to">
                      <SidebarMenuSubButton :is-active="route.path === child.to" as-child>
                        <RouterLink :to="child.to" @click="handleNavigate">
                          <span>{{ child.label }}</span>
                        </RouterLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
              </template>
              <template v-else>
                <SidebarMenuItem>
                  <SidebarMenuButton :is-active="esRutaActiva(item)" :tooltip="item.label" as-child>
                    <RouterLink :to="item.to" @click="handleNavigate">
                      <component :is="item.icon" />
                      <span>{{ item.label }}</span>
                    </RouterLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </template>
            </template>
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
                <p class="text-muted-foreground text-xs font-normal">{{ rolEtiqueta }}</p>
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
