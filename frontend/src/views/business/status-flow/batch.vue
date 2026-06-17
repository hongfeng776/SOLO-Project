<template>
  <div class="ccb-status-flow-batch">
    <CcbPageHeader
      title="批量状态操作"
      description="批量执行撤销、补充资料、重新提交差异化操作"
      icon="Files"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="开户类型" prop="openingType">
        <el-select v-model="searchForm.openingType" placeholder="全部" clearable>
          <el-option
            v-for="(text, val) in OpeningTypeText"
            :key="val"
            :label="text"
            :value="Number(val)"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="当前状态" prop="currentStatus">
        <el-select v-model="searchForm.currentStatus" placeholder="全部" clearable>
          <el-option label="待审核" :value="3" />
          <el-option label="审核中" :value="2" />
          <el-option label="已通过" :value="4" />
          <el-option label="已驳回" :value="6" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间范围" prop="timeRange">
        <el-date-picker
          v-model="searchForm.timeRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
      <el-form-item label="关键词" prop="keyword">
        <el-input v-model="searchForm.keyword" placeholder="流水号/客户名" clearable />
      </el-form-item>
    </CcbSearchForm>

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <CcbPermissionButton
          type="warning"
          :icon="RefreshLeft"
          :disabled="selectedIds.length === 0"
          permission="status-flow:batch:cancel"
          label="批量撤销"
          @click="handleBatchOperation(OperationType.CANCEL, '批量撤销')"
        />
        <el-button
          type="primary"
          :icon="DocumentAdd"
          :disabled="selectedIds.length === 0"
          @click="handleBatchOperation(OperationType.SUPPLEMENT, '批量补充资料')"
        >
          批量补充资料
        </el-button>
        <el-button
          type="success"
          :icon="RefreshRight"
          :disabled="selectedIds.length === 0"
          @click="handleBatchOperation(OperationType.RESUBMIT, '批量重新提交')"
        >
          批量重新提交
        </el-button>
      </div>
      <div class="ccb-table-toolbar-right">
        <el-tag type="info">已选：{{ selectedIds.length }}</el-tag>
      </div>
    </div>

    <CcbBatchOperation
      :selected-rows="selectedRows"
      @clear="handleClearSelection"
    />

    <el-table
      v-loading="loading"
      :data="tableData"
      stripe
      row-key="id"
      @selection-change="handleSelectionChange"
    >
      <el-table-column
        type="selection"
        width="50"
        align="center"
        :selectable="(row: StatusFlowItem) => ![5, 6, 8].includes(row.currentStatus)"
      />
      <el-table-column prop="openingNo" label="流水号" width="180" show-overflow-tooltip />
      <el-table-column prop="openingType" label="开户类型" width="100">
        <template #default="{ row }">
          <el-tag
            :type="row.openingType === OpeningType.PERSONAL ? 'primary' : 'success'"
            effect="light"
            size="small"
          >
            {{ OpeningTypeText[row.openingType] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="customerName" label="客户名" width="120" show-overflow-tooltip />
      <el-table-column prop="currentStatus" label="当前状态" width="130">
        <template #default="{ row }">
          <el-tag
            :type="OpeningStatusTagType[row.currentStatus]"
            effect="light"
            size="small"
          >
            {{ OpeningStatusText[row.currentStatus] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="accountTypeText" label="账户类型" width="120" />
      <el-table-column prop="riskLevelText" label="风险等级" width="100" />
      <el-table-column prop="materialsComplete" label="资料完整性" width="110" align="center">
        <template #default="{ row }">
          <el-tag
            :type="row.materialsComplete ? 'success' : 'danger'"
            effect="light"
            size="small"
          >
            {{ row.materialsComplete ? '完整' : '不完整' }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="total > 0"
      v-model:current-page="pageParams.page"
      v-model:page-size="pageParams.pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      background
      layout="total, sizes, prev, pager, next, jumper"
      class="ccb-pagination"
      @size-change="fetchData"
      @current-change="fetchData"
    />

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="520px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-alert
        type="info"
        :closable="false"
        style="margin-bottom: 16px"
      >
        将对选中的 {{ selectedIds.length }} 条记录执行「{{ dialogTitle }}」操作
      </el-alert>
      <el-form label-width="80px">
        <el-form-item label="操作备注">
          <el-input
            v-model="batchRemark"
            type="textarea"
            :rows="4"
            placeholder="请输入批量操作备注说明"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitBatchOperation">
          <span class="ripple-btn">确认执行</span>
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { RefreshLeft, DocumentAdd, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  statusFlowApi,
  OpeningType,
  OpeningTypeText,
  OpeningStatus,
  OpeningStatusText,
  OpeningStatusTagType,
  OperationType,
  OperationTypeText,
  type StatusFlowItem
} from '@/api/statusFlow'
import { usePermission } from '@/hooks/usePermission'

const { hasRole } = usePermission()
const isManager = computed(() => hasRole('manager'))
const isAdmin = computed(() => hasRole('admin'))

const loading = ref(false)
const tableData = ref<StatusFlowItem[]>([])
const total = ref(0)
const selectedRows = ref<StatusFlowItem[]>([])
const selectedIds = computed(() => selectedRows.value.map(r => r.id))

const searchForm = reactive({
  openingType: null as number | null,
  currentStatus: null as number | null,
  timeRange: [] as string[],
  keyword: ''
})

const pageParams = reactive({ page: 1, pageSize: 10 })

const dialogVisible = ref(false)
const dialogTitle = ref('')
const batchRemark = ref('')
const submitting = ref(false)
const currentOperationType = ref('')

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pageParams.page,
      pageSize: pageParams.pageSize,
      openingType: searchForm.openingType ?? undefined,
      currentStatus: searchForm.currentStatus ?? undefined,
      keyword: searchForm.keyword || undefined,
      startTime: searchForm.timeRange?.[0] || undefined,
      endTime: searchForm.timeRange?.[1] || undefined
    }
    const res = await statusFlowApi.getFlowList(params)
    tableData.value = res.list || []
    total.value = res.total || 0
  } catch (e: any) {
    ElMessage.error(e.message || '加载数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageParams.page = 1
  fetchData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    openingType: null,
    currentStatus: null,
    timeRange: [],
    keyword: ''
  })
  pageParams.page = 1
  fetchData()
}

const handleSelectionChange = (rows: StatusFlowItem[]) => {
  selectedRows.value = rows
}

const handleClearSelection = () => {
  selectedRows.value = []
}

const handleBatchOperation = (operationType: string, title: string) => {
  if (selectedIds.value.length === 0) return

  if (operationType === OperationType.CANCEL && !isManager.value && !isAdmin.value) {
    ElMessage.warning('批量撤销操作需要经理或管理员角色权限')
    return
  }
  if (operationType === OperationType.VOID && !isAdmin.value) {
    ElMessage.warning('批量作废操作需要管理员角色权限')
    return
  }

  currentOperationType.value = operationType
  dialogTitle.value = title
  batchRemark.value = ''
  dialogVisible.value = true
}

const submitBatchOperation = async () => {
  if (selectedIds.value.length === 0) return
  submitting.value = true
  try {
    const res = await statusFlowApi.batchOperation({
      ids: selectedIds.value,
      openingType: selectedRows.value[0]?.openingType || OpeningType.PERSONAL,
      operationType: currentOperationType.value,
      remark: batchRemark.value || undefined
    })
    ElMessage.success(`${dialogTitle.value}操作完成，成功 ${res.successCount || selectedIds.value.length} 条`)
    dialogVisible.value = false
    selectedRows.value = []
    fetchData()
  } catch (e: any) {
    ElMessage.error(e.message || '批量操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => fetchData())
</script>

<style lang="scss" scoped>
.ccb-status-flow-batch {
  .ccb-table-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    .ccb-table-toolbar-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ccb-table-toolbar-right {
      display: flex;
      align-items: center;
    }
  }

  .ccb-pagination {
    margin-top: 16px;
    padding: 16px 0;
    justify-content: flex-end;
  }

  .ripple-btn {
    position: relative;
    overflow: hidden;
  }

  :deep(.el-table) {
    .el-table__row {
      transition: box-shadow 0.3s ease, transform 0.3s ease, background 0.3s ease;
      &:hover {
        box-shadow: 0 4px 20px rgba(23, 85, 163, 0.15);
        transform: translateY(-1px);
        background: linear-gradient(90deg, rgba(23, 85, 163, 0.04), rgba(23, 85, 163, 0.01));
      }
    }
  }
}
</style>
