<template>
  <div class="progress-bar">
    <div class="progress-header" v-if="label">
      <span class="progress-label">{{ label }}</span>
      <span class="progress-value">{{ value }}</span>
    </div>
    <div class="progress-track">
      <div
        class="progress-fill"
        :style="{
          width: Math.min(percentage, 100) + '%',
          backgroundColor: color || '#1890ff'
        }"
      ></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  percentage: { type: Number, default: 0 },
  color: { type: String, default: '' },
  label: { type: String, default: '' },
  value: { type: [Number, String], default: '' }
})
</script>

<style lang="scss" scoped>
.progress-bar {
  .progress-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;

    .progress-label {
      font-size: 13px;
      color: #666;
    }

    .progress-value {
      font-size: 13px;
      color: #333;
      font-weight: 600;
    }
  }

  .progress-track {
    height: 10px;
    background-color: #f0f0f0;
    border-radius: 5px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 5px;
    transition: width 0.6s ease;
  }
}
</style>
