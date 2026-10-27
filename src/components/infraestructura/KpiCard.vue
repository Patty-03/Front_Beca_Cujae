<script setup lang="ts">
import type { Component } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from 'cn'

const props = withDefaults(
  defineProps<{
    label: string
    value: string | number
    detail?: string
    icon: Component
    tono?: 'primary' | 'emerald' | 'amber' | 'sky'
  }>(),
  {
    tono: 'primary',
  },
)

const tonos: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  emerald: 'bg-emerald-500/10 text-emerald-600',
  amber: 'bg-amber-500/10 text-amber-600',
  sky: 'bg-sky-500/10 text-sky-600',
}
</script>

<template>
  <Card class="gap-0 py-0 shadow-xs">
    <CardContent class="p-5">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 space-y-1">
          <p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {{ label }}
          </p>
          <p class="text-2xl font-semibold tracking-tight tabular-nums">{{ value }}</p>
          <p v-if="detail" class="text-muted-foreground text-xs">{{ detail }}</p>
        </div>
        <div :class="cn('shrink-0 rounded-lg p-2.5', tonos[props.tono])">
          <component :is="icon" class="size-5" />
        </div>
      </div>
    </CardContent>
  </Card>
</template>
