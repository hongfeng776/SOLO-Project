<template>
  <div class="pro-table">
    <div v-if="showSearch" class="search-section">
      <el-form
        ref="searchFormRef"
        :model="searchForm"
        :inline="true"
        label-width="auto"
        @submit.prevent="handleSearch"
      >
        <el-form-item
          v-for="item in searchColumns"
          :key="item.prop"
          :label="item.label"
        >
          <el-input
            v-if="item.type === 'input' || !item.type"
            v-model="searchForm[item.prop]"
            :placeholder="`请输入${item.label}`"
            clearable
          />
          <el-select
            v-else-if="item.type === 'select'"
            v-model="searchForm[item.prop]"
            :placeholder="`请选择${item.label}`"
            clearable
          >
            <el-option
              v-for="opt in item.options"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-date-picker
            v-else-if="item.type === 'date'"
            v-model="searchForm[item.prop]"
            type="date"
            :placeholder="`请选择${item.label}`"
            value-format="YYYY-MM-DD"
          />
          <el-date-picker
            v-else-if="item.type === 'daterange'"
            v-model="searchForm[item.prop]"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
          <el-input-number
            v-else-if="item.type === 'number'"
            v-model="searchForm[item.prop]"
            :min="item.min ?? 0"
            :max="item.max"
            :step="item.step ?? 1"
            :precision="item.precision"
            :placeholder="`请输入${item.label}`"
            controls-position="right"
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div v-if="showToolbar" class="toolbar-section">
      <div class="toolbar-left">
        <slot name="toolbar-left">
          <el-button type="primary" @click="handleAdd" v-if="showAdd">
            <el-icon><Plus /></el-icon>新增
          </el-button>
          <el-button
            type="danger"
            :disabled="!selectedRows.length"
            @click="handleBatchDelete"
            v-if="showBatchDelete"
          >
            <el-icon><Delete /></el-icon>批量删除
          </el-button>
        </slot>
      </div>
      <div class="toolbar-right">
        <slot name="toolbar-right" />
      </div>
    </div>

    <div v-if="selectedRows.length" class="batch-actions">
      <span class="batch-info">已选择 {{ selectedRows.length }} 项</span>
      <el-button link type="primary" @click="handleClearSelection">取消选择</el-button>
      <slot name="batch-actions" :rows="selectedRows" />
    </div>

    <el-table
      ref="tableRef"
      :data="tableData"
      :loading="loading"
      v-loading="loading"
      :stripe="stripe"
      :border="border"
      @selection-change="handleSelectionChange"
    >
      <el-table-column v-if="showSelection" type="selection" width="50" align="center" />
      <el-table-column type="index" label="序号" width="60" align="center">
        <template #default="{ $index }">
          {{ (pagination.currentPage - 1) * pagination.pageSize + $index + 1 }}
        </template>
      </el-table-column>
      <el-table-column
        v-for="col in columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth"
        :align="col.align || 'left'"
        :fixed="col.fixed"
        :show-overflow-tooltip="col.showOverflowTooltip !== false"
      >
        <template v-if="col.slot" #default="scope">
          <slot :name="col.slot" :row="scope.row" :column="col" :index="scope.$index" />
        </template>
        <template v-else-if="col.type === 'status'" #default="scope">
          <el-tag v-if="col.statusMap" :type="col.statusMap[scope.row[col.prop]]?.type">
            {{ col.statusMap[scope.row[col.prop]]?.label }}
          </el-tag>
          <span v-else>{{ scope.row[col.prop] }}</span>
        </template>
        <template v-else-if="col.type === 'amount'" #default="scope">
          <span class="amount-text">{{ formatAmount(scope.row[col.prop]) }}</span>
        </template>
        <template v-else-if="col.type === 'datetime'" #default="scope">
          {{ formatDateTime(scope.row[col.prop]) }}
        </template>
        <template v-else-if="col.type === 'date'" #default="scope">
          {{ formatDate(scope.row[col.prop]) }}
        </template>
        <template v-else-if="col.type === 'image'" #default="scope">
          <el-image
            v-if="scope.row[col.prop]"
            :src="scope.row[col.prop]"
            :preview-src-list="[scope.row[col.prop]]"
            fit="cover"
            style="width: 48px; height: 48px; border-radius: 4px;"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column
        v-if="showActions"
        label="操作"
        :width="actionsWidth"
        fixed="right"
        align="center"
      >
        <template #default="scope">
          <slot name="actions" :row="scope.row" :index="scope.$index">
            <el-button link type="primary" @click="handleView(scope.row)" v-if="showView">查看</el-button>
            <el-button link type="primary" @click="handleEdit(scope.row)" v-if="showEdit">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)" v-if="showDelete">删除</el-button>
          </slot>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="tableData.length === 0 && !loading" class="empty-state">
      <el-icon class="empty-icon"><DataLine /></el-icon>
      <div class="empty-text">暂无数据</div>
    </div>

    <div v-if="showPagination && total > 0" class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handlePageChange"
        @current-change="handlePageChange"
      />
    </div>

    <slot name="footer" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { formatAmount } from '@/utils/amount'
import { formatDate, formatDateTime } from '@/utils/date'
import type { TagType } from '@/types/business'

interface ColumnOption {
  label: string
  value: string | number
}

interface TableColumn {
  prop: string
  label: string
  width?: number | string
  minWidth?: number | string
  align?: string
  fixed?: string | boolean
  showOverflowTooltip?: boolean
  slot?: string
  type?: 'status' | 'amount' | 'datetime' | 'date' | 'image' | 'input' | 'select' | 'daterange' | 'number'
  statusMap?: Record<string | number, { label: string; type: TagType }>
}

interface SearchColumn extends TableColumn {
  options?: readonly ColumnOption[]
  min?: number
  max?: number
  step?: number
  precision?: number
}

interface Props {
  columns: readonly TableColumn[]
  searchColumns?: readonly SearchColumn[]
  showSearch?: boolean
  showToolbar?: boolean
  showAdd?: boolean
  showBatchDelete?: boolean
  showSelection?: boolean
  showActions?: boolean
  showView?: boolean
  showEdit?: boolean
  showDelete?: boolean
  showPagination?: boolean
  stripe?: boolean
  border?: boolean
  actionsWidth?: number | string
  request: (params: Record<string, unknown>) => Promise<{ list: unknown[]; total: number }>
  immediate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  searchColumns: () => [],
  showSearch: true,
  showToolbar: true,
  showAdd: true,
  showBatchDelete: true,
  showSelection: true,
  showActions: true,
  showView: true,
  showEdit: true,
  showDelete: true,
  showPagination: true,
  stripe: true,
  border: false,
  actionsWidth: 180,
  immediate: true
})

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'edit', row: Record<string, unknown>): void
  (e: 'view', row: Record<string, unknown>): void
  (e: 'delete', row: Record<string, unknown>): void
  (e: 'batchDelete', ids: (string | number)[]): void
  (e: 'search', params: Record<string, unknown>): void
}>()

const tableRef = ref()
const searchFormRef = ref<FormInstance>()
const loading = ref(false)
const tableData = ref<Record<string, unknown>[]>([])
const selectedRows = ref<Record<string, unknown>[]>([])
const searchForm = reactive<Record<string, any>>({})

const pagination = reactive({
  currentPage: 1,
  pageSize: 10
})

const total = ref(0)

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm,
      pageNum: pagination.currentPage,
      pageSize: pagination.pageSize
    }
    const res = await props.request(params)
    tableData.value = res.list as Record<string, unknown>[]
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.currentPage = 1
  emit('search', searchForm)
  fetchData()
}

const handleReset = () => {
  Object.keys(searchForm).forEach((key) => {
    const col = props.searchColumns.find((c) => c.prop === key)
    if (col?.type === 'number') {
      searchForm[key] = undefined
    } else {
      searchForm[key] = ''
    }
  })
  pagination.currentPage = 1
  fetchData()
}

const handlePageChange = () => {
  fetchData()
}

const handleSelectionChange = (rows: Record<string, unknown>[]) => {
  selectedRows.value = rows
}

const handleClearSelection = () => {
  tableRef.value?.clearSelection()
}

const handleAdd = () => {
  emit('add')
}

const handleEdit = (row: Record<string, unknown>) => {
  emit('edit', row)
}

const handleView = (row: Record<string, unknown>) => {
  emit('view', row)
}

const handleDelete = async (row: Record<string, unknown>) => {
  try {
    await ElMessageBox.confirm('确定要删除该条记录吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    emit('delete', row)
    ElMessage.success('删除成功')
    fetchData()
  } catch {
  }
}

const handleBatchDelete = async () => {
  if (!selectedRows.value.length) return
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条记录吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    const ids = selectedRows.value.map((row) => row.id as string | number)
    emit('batchDelete', ids)
    ElMessage.success('批量删除成功')
    handleClearSelection()
    fetchData()
  } catch {
  }
}

watch(
  () => [pagination.currentPage, pagination.pageSize],
  () => fetchData()
)

onMounted(() => {
  if (props.immediate) {
    fetchData()
  }
})

defineExpose({
  fetchData,
  handleClearSelection,
  getSelectedRows: () => selectedRows.value
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.pro-table {
  background: #fff;
  border-radius: $radius-md;
  padding: $spacing-base;
  box-shadow: $shadow-light;

  .search-section {
    margin-bottom: $spacing-base;
    padding-bottom: $spacing-base;
    border-bottom: 1px solid $border-color-lighter;
  }

  .toolbar-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-base;

    .toolbar-left,
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
    }
  }

  .pagination-wrapper {
    margin-top: $spacing-base;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
