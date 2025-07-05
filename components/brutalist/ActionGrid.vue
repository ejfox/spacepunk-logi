<template>
  <div ref="actionGridRef" class="border-2 border-white bg-gray-900 font-mono text-white shadow-lg">
    <div class="border-b-2 border-white px-4 py-3 bg-black flex justify-between items-center">
      <span class="font-bold text-base tracking-wider uppercase">{{ title }}</span>
      <span v-if="subtitle" class="text-sm opacity-70 font-mono tracking-wide">{{ subtitle }}</span>
    </div>
    <div class="p-4 grid gap-3" :class="getGridClasses(columns)">
      <button
        v-for="action in actions"
        :key="action.id"
        class="border-2 border-white bg-black text-white px-3 py-4 cursor-pointer font-mono text-sm text-center relative transition-all duration-200 min-h-20 flex flex-col justify-center items-center gap-2 hover:bg-gray-800 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-800"
        :class="getButtonClasses(action.variant, action.disabled)"
        :disabled="action.disabled"
        @click="$emit('action', action.id)"
        @mouseenter="$emit('hover-action', action)"
        @mouseleave="$emit('clear-hover')"
      >
        <span v-if="action.key" class="text-xs opacity-70 tracking-wider">[{{ action.key }}]</span>
        <span class="font-bold text-sm tracking-wider">{{ action.label }}</span>
        <span v-if="action.cost" class="text-xs opacity-70 italic tracking-wide">{{ action.cost }}</span>
      </button>
    </div>
    <div v-if="$slots.default" class="border-t border-dotted border-gray-600 px-4 py-3 text-xs opacity-70 text-center bg-gray-950 leading-relaxed">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useElementVisibility } from '@vueuse/core'

defineEmits(['action', 'hover-action', 'clear-hover'])

const actionGridRef = ref(null)
const isVisible = useElementVisibility(actionGridRef)

defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: null
  },
  actions: {
    type: Array,
    required: true,
    validator: (actions) => {
      return actions.every(action => 
        typeof action === 'object' && 
        'id' in action && 
        'label' in action
      )
    }
  },
  columns: {
    type: Number,
    default: 3,
    validator: (value) => [1, 2, 3, 4, 6].includes(value)
  }
})

function getGridClasses(columns) {
  const gridMap = {
    1: 'grid-cols-1',
    2: 'grid-cols-2', 
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6'
  }
  return gridMap[columns] || 'grid-cols-3'
}

function getButtonClasses(variant, disabled) {
  if (disabled) return []
  
  const classes = []
  if (variant === 'primary') {
    classes.push('!bg-green-950', '!border-green-400', '!text-green-400', 'hover:!bg-green-900', 'hover:!shadow-green-400/20')
  } else if (variant === 'warning') {
    classes.push('!bg-yellow-950', '!border-yellow-400', '!text-yellow-400', 'hover:!bg-yellow-900', 'hover:!shadow-yellow-400/20')
  } else if (variant === 'danger') {
    classes.push('!bg-red-950', '!border-red-400', '!text-red-400', 'hover:!bg-red-900', 'hover:!shadow-red-400/20')
  }
  return classes
}
</script>