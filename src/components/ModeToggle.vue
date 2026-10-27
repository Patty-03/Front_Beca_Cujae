<script setup lang="ts">
import { MoonIcon, SunIcon } from '@lucide/vue'
import { useColorMode } from '@vueuse/core'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const mode = useColorMode({ storageKey: 'beca-cujae-theme' })
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" size="icon-sm" aria-label="Cambiar tema">
        <SunIcon class="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <MoonIcon
          class="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @select="mode = 'light'">Claro</DropdownMenuItem>
      <DropdownMenuItem @select="mode = 'dark'">Oscuro</DropdownMenuItem>
      <DropdownMenuItem @select="mode = 'auto'">Sistema</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
