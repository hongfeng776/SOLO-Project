<template>
  <div class="ccb-audit-history">
    <CcbPageHeader
      title="审计历史"
      description="查询已完成的业务审核记录"
      icon="Finished"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="业务单号" prop="businessNo">
        <el-input v-model="searchForm.businessNo" placeholder="请输入业务单号" clearable />
      </el-form-item>
      <el-form-item label="业务类型" prop="businessType">
        <el-select v-model="searchForm.businessType" placeholder="请选择业务类型" clearable>
          <el-option label="转账汇款" :value="1" />
          <el-option label="活期存款" :value="2" />
          <el-option label="定期存款" :value="3" />
          <el-option label="理财产品" :value="4" />
          <el-option label="贷款业务" :value="5" />
        </el-select>
      </el-form-item>
      <el-form-item label="审核结果" prop="auditResult">
        <el-select v-model="searchForm.auditResult" placeholder="请选择审核结果" clearable>
          <el-option label="审核通过" :value="2" />
          <el-option label="审核驳回" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="审核人" prop="auditorName">
        <el-input v-model="searchForm.auditorName" placeholder="请输入审核人姓名" clearable />
      </el-form-item>
      <el-form-item label="审核时间" prop="auditTimeRange">
        <el-date-picker
          v-model="searchForm.auditTimeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
    </CcbSearchForm>

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <el-button type="primary" :icon="Download" @click="handleExport">导出数据</el-button>
      </div>
      <div class="ccb-table-toolbar-right">
        <el-tag type="success" effect="dark">通过：{{ passCount }} 笔</el-tag>
        <el-tag type="danger" effect="dark">驳回：{{ rejectCount }} 笔</el-tag>
      </div>
    </div>

    <CcbTable
      v-model:page="pageParams.page"
      v-model:pageSize="pageParams.pageSize"
      :loading="loading"
      :data="tableData"
      :total="total"
      :show-selection="true"
      :show-index="true"
      @selection-change="handleSelectionChange"
      @change="handlePageChange"
    >
      <el-table-column prop="businessNo" label="业务单号" width="200" />
      <el-table-column prop="businessTypeName" label="业务类型" width="100" />
      <el-table-column prop="amount" label="金额" width="140" align="right">
        <template #default="{ row }">
          <span class="ccb-amount">¥{{ formatMoneyWithComma(row.amount) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核结果" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 2 ? 'success' : 'danger'" effect="light" size="small">
            {{ row.statusName }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="submitterName" label="提交人" width="100" />
      <el-table-column prop="auditorName" label="审核人" width="100" />
      <el-table-column prop="auditLevel" label="审核级别" width="100">
        <template #default="{ row }">
          {{ row.currentLevel }}/{{ row.totalLevel }}级
        </template>
      </el-table-column>
      <el-table-column prop="auditTime" label="审核时间" width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.auditTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
          <el-button type="primary" link size="small" @click="handleAuditTrail(row)">轨迹</el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <el-dialog
      v-model="detailDialogVisible"
      title="审核详情"
      width="640px"
      destroy-on-close
    >
      <CcbDetailPanel
        v-if="currentAudit"
        :data="currentAudit"
        :items="detailItems"
        title="业务信息"
      />
      <el-divider content-position="left">审核记录</el-divider>
      <el-timeline v-if="currentAudit">
        <el-timeline-item
          v-for="(item, index) in currentAudit.auditTrail || []"
          :key="index"
          :timestamp="item.time"
          :type="item.result === '通过' ? 'success' : 'danger'"
          :hollow="true"
        >
          <div>
            <strong>{{ item.auditor }}</strong>
            <el-tag size="small" :type="item.result === '通过' ? 'success' : 'danger'" style="margin-left: 8px">
              {{ item.result }}
            </el-tag>
          </div>
          <div style="margin-top: 4px; color: #595959;">
            意见：{{ item.remark || '无' }}
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { formatDateTime, formatMoneyWithComma } from '@utils'
import type { AuditRecord } from '@types/business'

const loading = ref<boolean>(false)
const tableData = ref<AuditRecord[]>([])
const total = ref<number>(0)
const selectedRows = ref<AuditRecord[]>([])

const detailDialogVisible = ref<boolean>(false)
const currentAudit = ref<AuditRecord | null>(null)

const searchForm = reactive({
  businessNo: '',
  businessType: null as number | null,
  auditResult: null as number | null,
  auditorName: '',
  auditTimeRange: [] as string[]
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const passCount = computed<number>(() => {
  return tableData.value.filter((item) => item.status === 2).length
})

const rejectCount = computed<number>(() => {
  return tableData.value.filter((item) => item.status === 3).length
})

const detailItems = [
  { prop: 'businessNo', label: '业务单号' },
  { prop: 'businessTypeName', label: '业务类型' },
  { prop: 'amount', label: '金额', type: 'moneyComma' },
  { prop: 'submitterName', label: '提交人' },
  { prop: 'submitterOrg', label: '所属机构' },
  { prop: 'submitTime', label: '提交时间', type: 'datetime' },
  { prop: 'auditorName', label: '最终审核人' },
  { prop: 'auditTime', label: '审核时间', type: 'datetime' }
]

const mockAuditRecords: AuditRecord[] = Array.from({ length: 22 }, (_, i) => ({
  id: i + 1,
  businessId: 10000 + i,
  businessType: i % 5 + 1,
  businessTypeName: ['转账汇款', '活期存款', '定期存款', '理财产品', '贷款业务'][i % 5],
  businessNo: `BUS${Date.now()}${String(i).padStart(4, '0')}`,
  amount: (i + 1) * 36800.00,
  currentLevel: 3,
  totalLevel: 3,
  status: i % 2 === 0 ? 2 : 3,
  statusName: i % 2 === 0 ? '审核通过' : '审核驳回',
  submitterId: i % 10 + 1,
  submitterName: ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'][i % 8],
  submitterOrg: ['总行营业部', '北京分行', '上海分行', '深圳分行', '广州分行'][i % 5],
  submitTime: `2024-06-1${i % 6} ${String(9 + (i % 8)).padStart(2, '0')}:00:00`,
  auditorId: i % 5 + 1,
  auditorName: ['审核员A', '审核员B', '审核员C', '审核员D', '审核员E'][i % 5],
  auditTime: `2024-06-1${i % 6} ${String(14 + (i % 6)).padStart(2, '0')}:30:00`,
  auditRemark: i % 2 === 0 ? '资料齐全，审核通过' : '资料不完整，请补充后重新提交',
  auditTrail: [
    {
      level: 1,
      auditor: ['审核员A', '审核员B', '审核员C'][i % 3],
      result: i % 2 === 0 ? '通过' : '通过',
      time: `2024-06-1${i % 6} 10:00:00`,
      remark: '初审通过'
    },
    {
      level: 2,
      auditor: ['审核员B', '审核员C', '审核员D'][i % 3],
      result: i % 2 === 0 ? '通过' : '通过',
      time: `2024-06-1${i % 6} 12:00:00`,
      remark: '复核通过'
    },
    {
      level: 3,
      auditor: ['审核员C', '审核员D', '审核员E'][i % 3],
      result: i % 2 === 0 ? '通过' : '驳回',
      time: `2024-06-1${i % 6} 14:30:00`,
      remark: i % 2 === 0 ? '终审通过' : '资料不完整'
    }
  ],
  createdAt: `2024-06-1${i % 6} ${String(9 + (i % 8)).padStart(2, '0')}:00:00`,
  updatedAt: `2024-06-1${i % 6} ${String(14 + (i % 6)).padStart(2, '0')}:30:00`
}))

const fetchData = (): void => {
  loading.value = true
  setTimeout(() => {
    const start = (pageParams.page - 1) * pageParams.pageSize
    const end = start + pageParams.pageSize
    tableData.value = mockAuditRecords.slice(start, end)
    total.value = mockAuditRecords.length
    loading.value = false
  }, 500)
}

const handleSearch = (): void => {
  pageParams.page = 1
  fetchData()
}

const handleReset = (): void => {
  pageParams.page = 1
  fetchData()
}

const handlePageChange = (): void => {
  fetchData()
}

const handleSelectionChange = (val: unknown[]): void => {
  selectedRows.value = val as AuditRecord[]
}

const handleView = (row: AuditRecord): void => {
  currentAudit.value = row
  detailDialogVisible.value = true
}

const handleAuditTrail = (row: AuditRecord): void => {
  currentAudit.value = row
  detailDialogVisible.value = true
}

const handleExport = (): void => {
  ElMessage.success('导出任务已提交，请在任务中心查看')
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.ccb-audit-history {
  .ccb-amount {
    font-weight: 600;
    color: #004098;
  }

  .ccb-table-toolbar-right {
    display: flex;
    gap: 12px;
  }
}
</style>
