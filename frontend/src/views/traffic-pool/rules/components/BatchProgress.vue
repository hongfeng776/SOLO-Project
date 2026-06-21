<template>
  <div class="batch-progress-wrapper">
    <div class="progress-header">
      <span class="op-label">正在执行：<strong>{{ operation }}</strong></span>
      <span class="pct">{{ Math.floor(progress) }}%</span>
    </div>
    <el-progress
      :percentage="Math.floor(progress)"
      :stroke-width="10"
      color="#409eff"
      :show-text="false"
      class="progress-bar striped-flow"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  progress: number
  operation: string
}>()
</script>

<style lang="scss" scoped>
.batch-progress-wrapper {
  margin-bottom: 14px;
  padding: 10px 14px;
  background: rgba(64, 158, 255, 0.04);
  border-radius: 4px;
  border: 1px solid rgba(64, 158, 255, 0.2);

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
    font-size: 13px;
    color: $text-secondary;
    .op-label strong { color: $primary-color; }
    .pct { font-family: 'DIN', monospace; font-weight: 700; color: $primary-color; }
  }
}
.striped-flow :deep(.el-progress-bar__inner) {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.25) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.25) 50%,
    rgba(255, 255, 255, 0.25) 75%,
    transparent 75%,
    transparent
  );
  background-size: 20px 20px;
  animation: flow-stripes 1s linear infinite;
}

@keyframes flow-stripes {
  from { background-position: 0 0; }
  to { background-position: 40px 0; }
}
</style>
