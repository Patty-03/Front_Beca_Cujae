<script setup lang="ts">
import type { Solicitud } from '@/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate, getInitials } from '@/lib/format'
import StatusBadge from './StatusBadge.vue'

defineProps<{ solicitudes: Solicitud[] }>()
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Estudiante</TableHead>
        <TableHead>Beca</TableHead>
        <TableHead class="hidden md:table-cell">Fecha</TableHead>
        <TableHead class="hidden text-right sm:table-cell">Monto</TableHead>
        <TableHead class="text-right">Estado</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody v-if="solicitudes.length">
      <TableRow v-for="solicitud in solicitudes" :key="solicitud.id">
        <TableCell>
          <div class="flex items-center gap-3">
            <Avatar class="size-8">
              <AvatarFallback class="text-xs">{{
                getInitials(solicitud.estudiante)
              }}</AvatarFallback>
            </Avatar>
            <div class="min-w-0">
              <p class="truncate text-sm font-medium">{{ solicitud.estudiante }}</p>
              <p class="text-muted-foreground truncate text-xs">{{ solicitud.carrera }}</p>
            </div>
          </div>
        </TableCell>
        <TableCell class="text-sm">{{ solicitud.beca }}</TableCell>
        <TableCell class="text-muted-foreground hidden text-sm md:table-cell">
          {{ formatDate(solicitud.fecha) }}
        </TableCell>
        <TableCell class="hidden text-right text-sm tabular-nums sm:table-cell">
          {{ formatCurrency(solicitud.monto) }}
        </TableCell>
        <TableCell class="text-right">
          <StatusBadge :estado="solicitud.estado" />
        </TableCell>
      </TableRow>
    </TableBody>
    <TableBody v-else>
      <TableRow>
        <TableCell colspan="5" class="text-muted-foreground h-24 text-center">
          No se encontraron solicitudes.
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
