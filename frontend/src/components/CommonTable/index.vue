<template>
  <div class="common-table">
    <div v-if="showSearch" class="search-form">
      <el-form :model="searchForm" :inline="true" @submit.prevent>
        <slot name="search">
          <el-form-item v-for="item in searchFields" :key="item.prop" :label="item.label">
            <el-input
              v-if="item.type === 'input'"
              v-model="searchForm[item.prop]"
              :placeholder="`请输入${item.label}`"
              clearable
              @keyup.enter="handleSearch"
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
          </el-form-item>
        </slot>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div v-if="$slots.toolbar || showToolbar" class="toolbar">
      <div class="toolbar-left">
        <slot name="toolbar" />
      </div>
      <div class="toolbar-right">
        <slot name="toolbar-right" />
      </div>
    </div>

    <el-table
      ref="elTableRef"
      v-loading="loading"
      :data="tableData"
      :border="border"
      :stripe="stripe"
      style="width: 100%"
      @selection-change="handleSelectionChange"
      @row-dblclick="(row: any, column: any, event: MouseEvent) => emit('row-dblclick', row, column, event)"
    >
      <el-table-column v-if="showSelection" type="selection" width="55" align="center" />
      <el-table-column v-if="showIndex" type="index" label="序号" width="60" align="center" />
      <slot />
    </el-table>

    <div v-if="showPagination" class="pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <el-empty v-if="!loading && tableData.length === 0" description="暂无数据" />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'

interface Props {
  loading?: boolean
  data?: any[]
  showSearch?: boolean
  searchFields?: any[]
  showToolbar?: boolean
  showSelection?: boolean
  showIndex?: boolean
  border?: boolean
  stripe?: boolean
  showPagination?: boolean
  total?: number
  page?: number
  pageSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  data: () => [],
  showSearch: false,
  searchFields: () => [],
  showToolbar: false,
  showSelection: false,
  showIndex: true,
  border: true,
  stripe: true,
  showPagination: true,
  total: 0,
  page: 1,
  pageSize: 10
})

const emit = defineEmits(['search', 'reset', 'selection-change', 'page-change', 'size-change', 'row-dblclick'])

const elTableRef = ref()
const searchForm = reactive<Record<string, any>>({})
const tableData = ref<any[]>([])
const selectedRows = ref<any[]>([])

const pagination = reactive({
  page: props.page,
  pageSize: props.pageSize,
  total: props.total
})

watch(() => props.data, (val) => {
  tableData.value = val
}, { immediate: true })

watch(() => props.total, (val) => {
  pagination.total = val
})

watch(() => props.page, (val) => {
  pagination.page = val
})

watch(() => props.pageSize, (val) => {
  pagination.pageSize = val
})

watch(() => props.searchFields, (fields) => {
  fields.forEach((field: any) => {
    if (searchForm[field.prop] === undefined) {
      searchForm[field.prop] = ''
    }
  })
}, { immediate: true, deep: true })

const handleSearch = () => {
  pagination.page = 1
  emit('search', { ...searchForm, page: 1, pageSize: pagination.pageSize })
}

const handleReset = () => {
  Object.keys(searchForm).forEach((key) => {
    searchForm[key] = ''
  })
  pagination.page = 1
  emit('reset')
}

const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection
  emit('selection-change', selection)
}

const handlePageChange = (page: number) => {
  pagination.page = page
  emit('page-change', page)
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  emit('size-change', size)
}

defineExpose({
  searchForm,
  selectedRows,
  pagination,
  elTableRef
})
</script>

<style lang="scss" scoped>
.common-table {
  .search-form {
    background: #fff;
    padding: 20px;
    border-radius: 4px;
    margin-bottom: 16px;
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    background: #fff;
    padding: 16px 20px;
    border-radius: 4px;

    &-left, &-right {
      display: flex;
      gap: 10px;
    }
  }

  .pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    padding: 10px 0;
  }
}
</style>
