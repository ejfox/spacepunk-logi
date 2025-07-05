<template>
  <div class="border-2 border-white bg-gray-900 font-mono text-white shadow-lg">
    <div class="border-b-2 border-white px-4 py-3 bg-black flex justify-between items-center">
      <span class="font-bold text-base tracking-wider uppercase">{{ title }}</span>
      <span v-if="subtitle" class="text-sm opacity-70 font-mono tracking-wide">{{ subtitle }}</span>
    </div>
    <div class="p-4 space-y-3">
      <div v-for="item in items" :key="item.key" 
           class="flex justify-between py-2 border-b border-dotted border-gray-600 last:border-b-0" 
           :class="getItemClasses(item.class)">
        <span class="opacity-80 text-sm tracking-wide">{{ item.key }}:</span>
        <span class="font-bold font-mono text-base tracking-wide">{{ item.value }}</span>
      </div>
    </div>
    <div v-if="$slots.default" class="border-t border-dotted border-gray-600 px-4 py-3 text-xs opacity-70 bg-gray-950 leading-relaxed">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>

defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: null
  },
  items: {
    type: Array,
    required: true,
    validator: (items) => {
      return items.every(item => 
        typeof item === 'object' && 
        'key' in item && 
        'value' in item
      )
    }
  }
})

function getItemClasses(itemClass) {
  const classes = []
  if (itemClass === 'warning') classes.push('text-yellow-400')
  if (itemClass === 'danger') classes.push('text-red-400')
  if (itemClass === 'success') classes.push('text-green-400')
  return classes
}
</script>