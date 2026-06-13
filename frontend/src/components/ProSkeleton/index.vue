<template>
  <div class="pro-skeleton">
    <template v-if="type === 'table'">
      <el-skeleton :rows="rows" animated>
        <template #template>
          <el-skeleton-item variant="h3" style="width: 50%" />
          <div style="margin: 16px 0">
            <el-skeleton-item
              v-for="i in rows"
              :key="i"
              variant="text"
              :style="{ width: '100%', height: '40px', marginBottom: '12px' }"
            />
          </div>
        </template>
      </el-skeleton>
    </template>
    <template v-else-if="type === 'card'">
      <el-skeleton :rows="rows" animated>
        <template #template>
          <div style="display: flex; gap: 16px">
            <el-skeleton-item variant="image" :style="{ width: '200px', height: '200px' }" />
            <div style="flex: 1">
              <el-skeleton-item variant="h3" style="width: 50%" />
              <el-skeleton-item v-for="i in rows" :key="i" variant="text" style="width: 100%" />
            </div>
          </div>
        </template>
      </el-skeleton>
    </template>
    <template v-else-if="type === 'list'">
      <el-skeleton :rows="rows" animated>
        <template #template>
          <div v-for="i in rows" :key="i" style="margin-bottom: 16px">
            <el-skeleton-item variant="h3" style="width: 30%" />
            <el-skeleton-item variant="text" style="width: 80%; margin: 8px 0" />
            <el-skeleton-item variant="text" style="width: 60%" />
          </div>
        </template>
      </el-skeleton>
    </template>
    <template v-else>
      <el-skeleton :rows="rows" animated v-bind="$attrs" />
    </template>
    <slot v-if="!loading" />
  </div>
</template>

<script setup lang="ts">
interface ProSkeletonProps {
  loading: boolean
  type?: 'default' | 'table' | 'card' | 'list'
  rows?: number
}

withDefaults(defineProps<ProSkeletonProps>(), {
  type: 'default',
  rows: 3
})
</script>

<style lang="scss" scoped>
.pro-skeleton {
  width: 100%;
}
</style>
