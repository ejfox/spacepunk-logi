<template>
  <div class="brutalist-table-wrapper">
    <div v-if="title" class="table-title">
      > {{ title.toUpperCase() }}
    </div>
    <div class="table-container">
      <table class="brutalist-table">
        <thead v-if="headers && headers.length">
          <tr>
            <th
              v-for="(header, index) in headers"
              :key="index"
              :class="{ 'sortable': header.sortable }"
              @click="header.sortable && $emit('sort', header.key)"
            >
              {{ (header.label || header.key).toUpperCase() }}
              <span v-if="header.sortable" class="sort-indicator">
                {{ sortKey === header.key ? (sortOrder === 'asc' ? '▲' : '▼') : '◆' }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!data || data.length === 0">
            <td :colspan="headers.length || 1" class="empty-message">
              {{ emptyMessage || 'NO DATA AVAILABLE' }}
            </td>
          </tr>
          <tr
            v-for="(row, rowIndex) in data"
            :key="rowIndex"
            :class="{ 'row-selected': isSelected(row) }"
            @click="selectable && $emit('select', row)"
          >
            <td
              v-for="(header, colIndex) in headers"
              :key="colIndex"
              :class="getCellClass(header, row[header.key])"
            >
              <slot :name="`cell-${header.key}`" :value="row[header.key]" :row="row">
                {{ formatCellValue(row[header.key], header.format) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="showCount" class="table-footer">
      TOTAL RECORDS: {{ data.length }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: String,
  headers: {
    type: Array,
    required: true
  },
  data: {
    type: Array,
    default: () => []
  },
  emptyMessage: String,
  selectable: Boolean,
  selectedRows: {
    type: Array,
    default: () => []
  },
  sortKey: String,
  sortOrder: {
    type: String,
    default: 'asc',
    validator: (value) => ['asc', 'desc'].includes(value)
  },
  showCount: {
    type: Boolean,
    default: true
  }
})

defineEmits(['select', 'sort'])

const isSelected = (row) => {
  return props.selectedRows.some(selected => 
    JSON.stringify(selected) === JSON.stringify(row)
  )
}

const getCellClass = (header, value) => {
  const classes = []
  if (header.align) classes.push(`align-${header.align}`)
  if (header.highlight && value) classes.push('cell-highlight')
  return classes.join(' ')
}

const formatCellValue = (value, format) => {
  if (value === null || value === undefined) return '-'
  
  switch (format) {
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : value
    case 'percentage':
      return typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : value
    case 'boolean':
      return value ? '[YES]' : '[NO]'
    case 'date':
      return value ? new Date(value).toLocaleDateString() : '-'
    default:
      return value
  }
}
</script>

<style scoped>
.brutalist-table-wrapper {
  margin: 4px 0;
}

.table-title {
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 4px;
}

.table-container {
  border: 1px solid #00ff00;
  overflow-x: auto;
}

.brutalist-table {
  width: 100%;
  background: #000000;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  border-collapse: collapse;
}

th {
  text-align: left;
  padding: 4px 8px;
  border-bottom: 1px solid #00ff00;
  background: #001100;
  white-space: nowrap;
}

th.sortable {
  cursor: pointer;
  user-select: none;
}

th.sortable:hover {
  background: #002200;
}

.sort-indicator {
  margin-left: 4px;
  font-size: 10px;
  opacity: 0.7;
}

td {
  padding: 4px 8px;
  border-bottom: 1px dotted #003300;
}

tr:last-child td {
  border-bottom: none;
}

tr:hover:not(:has(.empty-message)) {
  background: #001100;
}

.row-selected {
  background: #002200 !important;
}

.selectable {
  cursor: pointer;
}

.empty-message {
  text-align: center;
  padding: 16px;
  opacity: 0.5;
}

.align-right {
  text-align: right;
}

.align-center {
  text-align: center;
}

.cell-highlight {
  color: #00ff00;
  font-weight: bold;
}

.table-footer {
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  padding: 4px 8px;
  border: 1px solid #00ff00;
  border-top: none;
  background: #001100;
  opacity: 0.7;
}
</style>