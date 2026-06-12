<script setup lang="ts">
import { computed, ref, watch, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue';
import type { TableColumn } from '@/types';
import TableSkeleton from '@/components/TableSkeleton';

interface Props<T = any> {
  columns: TableColumn<T>[];
  data?: T[];
  loading?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  pageSizes?: number[];
  showPagination?: boolean;
  showIndex?: boolean;
  showSelection?: boolean;
  showSummary?: boolean;
  border?: boolean;
  stripe?: boolean;
  height?: string | number;
  maxHeight?: string | number;
  rowKey?: string;
  emptyText?: string;
  highlightCurrentRow?: boolean;
  columnDraggable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  loading: false,
  total: 0,
  page: 1,
  pageSize: 10,
  pageSizes: () => [10, 20, 50, 100],
  showPagination: true,
  showIndex: true,
  showSelection: false,
  showSummary: false,
  border: false,
  stripe: true,
  height: '',
  maxHeight: '',
  rowKey: 'id',
  emptyText: '暂无数据',
  highlightCurrentRow: true,
  columnDraggable: true,
});

const emit = defineEmits<{
  (e: 'update:page', val: number): void;
  (e: 'update:pageSize', val: number): void;
  (e: 'pageChange', page: number, pageSize: number): void;
  (e: 'rowClick', row: any, column: any, event: Event): void;
  (e: 'rowDoubleClick', row: any, column: any, event: Event): void;
  (e: 'selectionChange', rows: any[]): void;
  (e: 'currentChange', row: any | null, oldRow: any | null): void;
  (e: 'sortChange', data: { prop: string; order: string | null }): void;
}>();

const internalCols = reactive<(TableColumn & { _width?: number; _order: number })[]>([]);
const selection = ref<any[]>([]);
const currentPage = ref(props.page);
const currentSize = ref(props.pageSize);
const skeletonRows = computed(() => Math.min(currentSize.value, 8));

watch(
  () => props.columns,
  (cols) => {
    internalCols.length = 0;
    cols.forEach((c, idx) => {
      internalCols.push({ ...c, _width: (c as any)._width ?? (typeof c.width === 'number' ? c.width : undefined), _order: idx });
    });
  },
  { immediate: true, deep: true },
);

watch(
  () => props.page,
  (v) => (currentPage.value = v),
);
watch(
  () => props.pageSize,
  (v) => (currentSize.value = v),
);

const sortedCols = computed(() => {
  return [...internalCols].sort((a, b) => a._order - b._order);
});

const handleCurrentChange = (p: number) => {
  currentPage.value = p;
  emit('update:page', p);
  emit('pageChange', p, currentSize.value);
};

const handleSizeChange = (s: number) => {
  currentSize.value = s;
  emit('update:pageSize', s);
  currentPage.value = 1;
  emit('update:page', 1);
  emit('pageChange', 1, s);
};

const handleRowClick = (row: any, column: any, event: Event) => emit('rowClick', row, column, event);
const handleRowDblClick = (row: any, column: any, event: Event) => emit('rowDoubleClick', row, column, event);
const handleSelectionChange = (rows: any[]) => {
  selection.value = rows;
  emit('selectionChange', rows);
};
const handleCurrent = (row: any, old: any) => emit('currentChange', row, old);
const handleSort = ({ prop, order }: { prop: string; order: string | null }) => emit('sortChange', { prop, order });

const draggingCol = ref<number | null>(null);
const dropTarget = ref<number | null>(null);

const handleDragStart = (e: DragEvent, idx: number) => {
  if (!props.columnDraggable) return;
  draggingCol.value = idx;
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
};
const handleDragOver = (e: DragEvent, idx: number) => {
  if (!props.columnDraggable) return;
  e.preventDefault();
  dropTarget.value = idx;
};
const handleDrop = (e: DragEvent, idx: number) => {
  if (!props.columnDraggable) return;
  e.preventDefault();
  const from = draggingCol.value;
  const to = idx;
  if (from !== null && to !== null && from !== to) {
    const fromOrder = internalCols[from]._order;
    const toOrder = internalCols[to]._order;
    internalCols[from]._order = toOrder;
    internalCols[to]._order = fromOrder;
  }
  draggingCol.value = null;
  dropTarget.value = null;
};
const handleDragEnd = () => {
  draggingCol.value = null;
  dropTarget.value = null;
};

const colWidths = reactive<Record<string, number>>({});
const resizing = ref<{ key: string; startX: number; startWidth: number } | null>(null);

const handleResizeStart = (e: MouseEvent, col: (typeof internalCols)[number]) => {
  if (!props.columnDraggable) return;
  e.preventDefault();
  e.stopPropagation();
  const key = col.prop;
  const startWidth = col._width ?? (typeof col.width === 'number' ? col.width : 150);
  resizing.value = { key, startX: e.clientX, startWidth };
};

const handleMouseMove = (e: MouseEvent) => {
  if (!resizing.value) return;
  const delta = e.clientX - resizing.value.startX;
  const newWidth = Math.max(60, resizing.value.startWidth + delta);
  const col = internalCols.find((c) => c.prop === resizing.value?.key);
  if (col) col._width = newWidth;
};
const handleMouseUp = () => {
  resizing.value = null;
};

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
});
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
});

defineExpose({
  clearSelection: () => (selection.value = []),
  toggleRowSelection: (row: any, selected?: boolean) => {
    // 通过 ref 暴露可扩展
  },
  selection,
});
</script>

<template>
  <div class="base-table-wrapper">
    <div v-if="loading" class="skeleton-mask">
      <TableSkeleton :columns="columns.length + (showIndex ? 1 : 0) + (showSelection ? 1 : 0)" :rows="skeletonRows" />
    </div>
    <el-table
      :data="data"
      :border="border"
      :stripe="stripe"
      :height="height || undefined"
      :max-height="maxHeight || undefined"
      :row-key="rowKey"
      :empty-text="emptyText"
      :highlight-current-row="highlightCurrentRow"
      :show-summary="showSummary"
      :header-cell-style="{ background: 'transparent' }"
      @row-click="handleRowClick"
      @row-dblclick="handleRowDblClick"
      @selection-change="handleSelectionChange"
      @current-change="handleCurrent"
      @sort-change="handleSort"
      class="base-table"
      style="width: 100%"
    >
      <el-table-column v-if="showSelection" type="selection" width="48" align="center" fixed="left" />
      <el-table-column
        v-if="showIndex"
        type="index"
        label="#"
        width="60"
        align="center"
        fixed="left"
        :index="(i: number) => (currentPage - 1) * currentSize + i + 1"
      />
      <template v-for="(col, idx) in sortedCols" :key="col.prop">
        <el-table-column
          :prop="col.prop"
          :label="col.label"
          :width="col._width ?? col.width"
          :min-width="col.minWidth"
          :align="col.align || 'left'"
          :fixed="col.fixed"
          :sortable="col.sortable || false"
          :formatter="col.formatter as any"
          :show-overflow-tooltip="col.ellipsis !== false"
          resizable
          draggable
          :class-name="dropTarget === idx ? 'drop-target' : ''"
          @dragstart="(e: any) => handleDragStart(e, idx)"
          @dragover="(e: any) => handleDragOver(e, idx)"
          @drop="(e: any) => handleDrop(e, idx)"
          @dragend="handleDragEnd"
        >
          <template #header>
            <div class="col-header" @mousedown="(e) => handleResizeStart(e, col)">
              <span>{{ col.label }}</span>
              <span v-if="columnDraggable" class="col-resizer" @mousedown.stop="(e) => handleResizeStart(e, col)" />
            </div>
          </template>
          <template v-if="col.slot" #default="scope">
            <slot :name="col.slot" :row="scope.row" :column="col" :index="scope.$index" :value="scope.row[col.prop]" />
          </template>
        </el-table-column>
      </template>
      <slot name="append" />
    </el-table>

    <div v-if="showPagination && total > 0" class="table-pagination">
      <div class="pagination-info">
        共 <strong>{{ total }}</strong> 条，第 <strong>{{ currentPage }}</strong> /
        {{ Math.ceil(total / currentSize) || 1 }} 页
      </div>
      <el-pagination
        background
        layout="prev, pager, next, jumper"
        :current-page="currentPage"
        :page-sizes="pageSizes"
        :page-size="currentSize"
        :total="total"
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.base-table-wrapper {
  position: relative;
  background: #fff;
  border-radius: $radius-lg;
  overflow: hidden;
  padding: $spacing-sm;
}

.base-table {
  width: 100%;
}

.skeleton-mask {
  position: relative;
  z-index: 2;
  padding: 0 $spacing-sm $spacing-sm;
  background: #fff;
}

.col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  user-select: none;
  cursor: grab;
  &:active {
    cursor: grabbing;
  }
  span {
    flex: 1;
    min-width: 0;
  }
}

.col-resizer {
  position: absolute;
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 20px;
  cursor: col-resize;
  opacity: 0;
  transition: opacity $duration-fast;
  &::before {
    content: '';
    position: absolute;
    right: 3px;
    top: 50%;
    transform: translateY(-50%);
    width: 2px;
    height: 14px;
    background: $color-primary;
    border-radius: 1px;
  }
  &:hover {
    opacity: 1;
  }
}

:deep(.drop-target) {
  outline: 2px dashed $color-primary;
  outline-offset: -2px;
}

.table-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-md;
  padding: $spacing-sm $spacing-sm 0;
  flex-wrap: wrap;
}

.pagination-info {
  font-size: $font-size-sm;
  color: $color-text-secondary;
  strong {
    color: $color-primary;
    margin: 0 2px;
  }
}
</style>
