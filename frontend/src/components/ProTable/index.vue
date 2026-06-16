<template>
  <div class="pro-table">
    <div v-if="$slots.toolbar" class="table-toolbar">
      <slot name="toolbar" />
    </div>
    <el-table
      v-loading="loading"
      :data="data"
      :stripe="stripe"
      :border="border"
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column v-if="showSelection" type="selection" width="55" />
      <el-table-column v-if="showIndex" type="index" label="序号" width="60" align="center" />
      <slot />
    </el-table>
    <div v-if="showPagination" class="table-pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    <div v-if="!loading && data.length === 0" class="table-empty">
      <el-empty description="暂无数据">
        <template #image>
          <el-icon :size="60" color="#d1d5db"><DataLine /></el-icon>
        </template>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import { DataLine } from '@element-plus/icons-vue';

interface Props {
  data?: any[];
  loading?: boolean;
  stripe?: boolean;
  border?: boolean;
  showSelection?: boolean;
  showIndex?: boolean;
  showPagination?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  loading: false,
  stripe: true,
  border: false,
  showSelection: false,
  showIndex: true,
  showPagination: true,
  total: 0,
  page: 1,
  pageSize: 10,
});

const emit = defineEmits<{
  (e: 'selection-change', selection: any[]): void;
  (e: 'page-change', page: number, pageSize: number): void;
  (e: 'size-change', pageSize: number): void;
}>();

const pagination = reactive({
  page: props.page,
  pageSize: props.pageSize,
  total: props.total,
});

watch(
  () => props.total,
  (val) => {
    pagination.total = val;
  }
);

watch(
  () => props.page,
  (val) => {
    pagination.page = val;
  }
);

const handleSelectionChange = (selection: any[]) => {
  emit('selection-change', selection);
};

const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.page = 1;
  emit('size-change', size);
  emit('page-change', 1, size);
};

const handleCurrentChange = (page: number) => {
  pagination.page = page;
  emit('page-change', page, pagination.pageSize);
};
</script>

<style lang="scss" scoped>
.pro-table {
  background: $bg-white;
  border-radius: $border-radius;
  padding: $spacing-base;

  .table-toolbar {
    margin-bottom: $spacing-base;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .table-pagination {
    margin-top: $spacing-base;
    display: flex;
    justify-content: flex-end;
  }

  .table-empty {
    padding: $spacing-2xl 0;
  }
}
</style>
