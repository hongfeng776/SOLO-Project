<template>
  <div class="pro-table">
    <div v-if="$slots.toolbar || searchFields || toolbarButtons" class="pro-table-toolbar">
      <div class="toolbar-left">
        <slot name="toolbar"></slot>
        <div v-if="toolbarButtons" class="toolbar-buttons">
          <el-button
            v-for="btn in toolbarButtons"
            :key="btn.key"
            :type="btn.type || 'primary'"
            :icon="btn.icon"
            @click="handleToolbarClick(btn)"
          >
            {{ btn.label }}
          </el-button>
        </div>
      </div>
      <div class="toolbar-right">
        <SearchFilter
          v-if="searchFields"
          v-model="searchParams"
          :fields="searchFields"
          @search="handleSearch"
          @reset="handleReset"
        />
      </div>
    </div>

    <div class="pro-table-content">
      <el-table
        v-loading="loading"
        :data="tableData"
        :default-sort="sort"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column v-if="showSelection" type="selection" width="50" />
        <el-table-column v-if="showIndex" type="index" label="序号" width="60" />
        <el-table-column
          v-for="col in columns"
          :key="col.prop"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          :sortable="col.sortable"
          :align="col.align || 'center'"
          :formatter="col.formatter"
        >
          <template v-if="col.slot" #default="scope">
            <slot :name="col.slot" :row="scope.row" :index="scope.$index" />
          </template>
        </el-table-column>
        <el-table-column
          v-if="$slots.actions"
          label="操作"
          width="200"
          align="center"
          fixed="right"
        >
          <template #default="scope">
            <slot name="actions" :row="scope.row" :index="scope.$index" />
          </template>
        </el-table-column>
        <template #empty>
          <EmptyState description="暂无数据" />
        </template>
      </el-table>
    </div>

    <div v-if="showSelection" class="pro-table-batch">
      <BatchActionBar
        :selected-count="selectedRows.length"
        :actions="batchActions"
        @delete="handleBatchDelete"
      />
    </div>

    <div class="pro-table-pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import SearchFilter from '@/components/SearchFilter/index.vue'
import EmptyState from '@/components/EmptyState/index.vue'
import BatchActionBar from '@/components/BatchActionBar/index.vue'

const props = defineProps({
  columns: {
    type: Array,
    required: true
  },
  request: {
    type: Function,
    required: true
  },
  searchFields: {
    type: Array,
    default: () => []
  },
  toolbarButtons: {
    type: Array,
    default: () => []
  },
  showSelection: {
    type: Boolean,
    default: false
  },
  showIndex: {
    type: Boolean,
    default: true
  },
  batchActions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['toolbar-click', 'selection-change', 'batch-delete'])

const loading = ref(false)
const tableData = ref([])
const selectedRows = ref([])
const searchParams = reactive({})
const sort = reactive({ prop: '', order: '' })

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchParams
    }
    if (sort.prop && sort.order) {
      params.sortProp = sort.prop
      params.sortOrder = sort.order === 'ascending' ? 'asc' : 'desc'
    }
    const res = await props.request(params)
    tableData.value = res.list || res.records || []
    pagination.total = res.total || 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  pagination.page = 1
  fetchData()
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
  emit('selection-change', selection)
}

const handleSortChange = ({ prop, order }) => {
  sort.prop = prop || ''
  sort.order = order || ''
  fetchData()
}

const handleToolbarClick = (btn) => {
  emit('toolbar-click', btn)
}

const handleBatchDelete = () => {
  emit('batch-delete', selectedRows.value)
}

const refresh = () => {
  fetchData()
}

defineExpose({ refresh, selectedRows })

onMounted(() => {
  fetchData()
})

watch(
  () => props.searchFields,
  () => {
    Object.keys(searchParams).forEach((key) => delete searchParams[key])
  }
)
</script>

<style scoped lang="scss">
.pro-table {
  display: flex;
  flex-direction: column;
  height: 100%;

  &-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .toolbar-buttons {
      display: flex;
      gap: 8px;
    }
  }

  &-content {
    flex: 1;
    min-height: 0;
  }

  &-batch {
    margin-top: 12px;
  }

  &-pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
