<template>
  <div class="skeleton-loader">
    <div
      v-for="i in rows"
      :key="i"
      class="skeleton-item"
      :style="{ height: rowHeight + 'px', width: getWidth(i) }"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  rows: {
    type: Number,
    default: 5
  },
  rowHeight: {
    type: Number,
    default: 20
  },
  widths: {
    type: Array,
    default: () => ['100%']
  }
})

const getWidth = (index) => {
  return props.widths[(index - 1) % props.widths.length]
}
</script>

<style lang="scss" scoped>
.skeleton-loader {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.skeleton-item {
  background: #f0f0f0;
  border-radius: 4px;
}
</style>
