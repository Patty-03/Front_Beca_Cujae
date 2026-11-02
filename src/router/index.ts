import { createRouter, createWebHistory } from 'vue-router'
import type { Permission, Role } from '@/types/auth'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    permissions?: Permission[]
    roles?: Role[]
    title?: string
    description?: string
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: 'Iniciar sesión' },
    },
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'inicio',
          component: () => import('@/views/HomeView.vue'),
          meta: { requiresAuth: true, title: 'Inicio' },
        },
        {
          path: 'dashboard',
          redirect: { name: 'inicio' },
        },
        {
          path: 'infraestructura',
          name: 'infraestructura',
          component: () => import('@/views/InfraestructuraDashboardView.vue'),
          meta: {
            requiresAuth: true,
            permissions: ['infraestructura:read'],
            title: 'Infraestructura',
          },
        },
        {
          path: 'deberes',
          name: 'deberes',
          component: () => import('@/views/ModuloPlaceholderView.vue'),
          meta: {
            requiresAuth: true,
            permissions: ['deberes:read'],
            title: 'Deberes',
            description:
              'Aquí podrás gestionar las tareas y responsabilidades de los estudiantes de la residencia.',
          },
        },
        {
          path: 'estudiantes',
          name: 'estudiantes',
          component: () => import('@/views/EstudiantesView.vue'),
          meta: {
            requiresAuth: true,
            permissions: ['estudiantes:read'],
            title: 'Estudiantes',
            description:
              'Aquí podrás consultar la información y el estado de los estudiantes residentes.',
          },
        },
        {
          path: 'evaluaciones',
          name: 'evaluaciones',
          component: () => import('@/views/ModuloPlaceholderView.vue'),
          meta: {
            requiresAuth: true,
            permissions: ['evaluaciones:read'],
            title: 'Evaluaciones',
            description:
              'Aquí podrás revisar y registrar las evaluaciones realizadas a los estudiantes.',
          },
        },
        {
          path: 'infraestructura/edificios',
          name: 'edificios',
          component: () => import('@/views/EdificiosView.vue'),
          meta: {
            requiresAuth: true,
            permissions: ['infraestructura:read'],
            title: 'Edificios',
          },
        },
        {
          path: 'infraestructura/edificios/:id',
          name: 'edificio-detalle',
          component: () => import('@/views/EdificioDetalleView.vue'),
          meta: {
            requiresAuth: true,
            permissions: ['infraestructura:read'],
            title: 'Detalle del edificio',
          },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: 'Página no encontrada' },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.initialize()

  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'inicio' }
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.permissions?.some((permission) => !auth.can(permission))) {
    return { name: 'inicio' }
  }

  if (to.meta.roles?.length && !to.meta.roles.some((role) => auth.hasRole(role))) {
    return { name: 'inicio' }
  }

  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Residencia CUJAE` : 'Residencia CUJAE'
})

export default router
