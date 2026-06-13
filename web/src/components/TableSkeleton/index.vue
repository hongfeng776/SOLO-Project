<script setup lang="ts">
interface Props {
  rowCount?: number
  colCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  rowCount: 5,
  colCount: 6
})

const rows = Array.from({ length: props.rowCount }, (_, i) => ({ key: i }))
const cols = Array.from({ length: props.colCount }, (_, i) => i)
</script>

<template>
  <el-table :data="rows" style="width: 100%">
    <el-table-column
      v-for="col in cols"
      :key="col"
      min-width="120"
    >
      <template #header>
        <el-skeleton-item variant="h3" style="width: 60%; height: 16px" />
      </template>
      <template #default>
        <el-skeleton animated>
          <template #template>
            <el-skeleton-item variant="text" style="width: 80%" />
          </template>
        </el-skeleton>
      </template>
    </el-table-column>
  </el-table>
</template>
