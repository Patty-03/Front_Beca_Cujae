<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from 'cn'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    as?: string
  }>(),
  {
    as: 'h2',
  },
)
</script>

<template>
  <component
    :is="props.as"
    data-slot="card-title"
    :class="
      cn(
        'text-base leading-normal font-medium group-data-[size=sm]/card:text-sm cn-font-heading',
        props.class,
      )
    "
  >
    <slot />
  </component>
</template>
