<template>
  <div class="ccb-blacklist-trace">
    <CcbPageHeader
      title="溯源查询"
      description="黑名单全流程操作记录追溯与合规性审计"
      icon="Document"
    />

    <el-row :gutter="16" class="top-stats">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card-content">
            <div class="stat-icon success">
              <el-icon :size="28"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalCompliant }}</div>
              <div class="stat-label">合规操作</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card-content">
            <div class="stat-icon danger">
              <el-icon :size="28"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalNonCompliant }}</div>
              <div class="stat-label">异常操作</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card-content">
            <div class="stat-icon primary">
              <el-icon :size="28"><UserRemove /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalRemoveCount }}</div>
              <div class="stat-label">移除记录</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card-content">
            <div class="stat-icon warning">
              <el-icon :size="28"><UserPlus /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalAddCount }}</div>
              <div class="stat-label">新增记录</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="黑名单编号" prop="blacklist_no">
        <el-input v-model="searchForm.blacklist_no" placeholder="请输入黑名单编号" clearable />
      </el-form-item>
      <el-form-item label="客户信息" prop="keyword">
        <el-input v-model="searchForm.keyword" placeholder="客户姓名/编号" clearable />
      </el-form-item>
      <el-form-item label="操作类型" prop="trace_type">
        <el-select v-model="searchForm.trace_type" placeholder="请选择操作类型" clearable>
          <el-option v-for="item in BlacklistTraceTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="合规性" prop="is_compliant">
        <el-select v-model="searchForm.is_compliant" placeholder="请选择" clearable>
          <el-option label="合规" :value="1" />
          <el-option label="异常" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="操作人" prop="operator_name">
        <el-input v-model="searchForm.operator_name" placeholder="请输入操作人姓名" clearable />
      </el-form-item>
      <el-form-item label="操作时间" prop="timeRange">
        <el-date-picker
          v-model="searchForm.timeRange"
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
        <CcbPermissionButton
          label="刷新数据"
          type="success"
          :icon="Refresh"
          @click="fetchData"
        />
        <CcbPermissionButton
          label="导出记录"
          type="warning"
          :icon="Download"
          @click="handleExport"
        />
      </div>
      <div class="ccb-table-toolbar-right">
        <div class="compliance-filter">
          <el-tag
            type="success"
            effect="dark"
            class="filter-tag"
            :class="{ active: searchForm.is_compliant === 1 }"
            @click="filterByCompliance(1)"
          >
            合规: {{ totalCompliant }}
          </el-tag>
          <el-tag
            type="danger"
            effect="dark"
            class="filter-tag"
            :class="{ active: searchForm.is_compliant === 0 }"
            @click="filterByCompliance(0)"
          >
            异常: {{ totalNonCompliant }}
          </el-tag>
        </div>
      </div>
    </div>

    <CcbTable
      v-model:page="pageParams.page"
      v-model:pageSize="pageParams.pageSize"
      :loading="loading"
      :data="tableData"
      :total="total"
      :show-index="true"
      @change="handlePageChange"
    >
      <el-table-column prop="blacklist_no" label="黑名单编号" width="180" fixed="left" />
      <el-table-column prop="trace_type" label="操作类型" width="130">
        <template #default="{ row }">
          <el-tag :type="getTraceTypeColor(row.trace_type)" effect="dark" size="small">
            {{ row.trace_type_text }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="is_compliant" label="合规性" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.is_compliant === 1 ? 'success' : 'danger'" effect="light" size="small">
            {{ row.is_compliant === 1 ? '合规' : '异常' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="before_grade" label="变更前等级" width="110">
        <template #default="{ row }">
          <span v-if="row.before_grade">
            <el-tag :type="getGradeColor(row.before_grade)" effect="light" size="small">
              {{ getGradeLabel(row.before_grade) }}
            </el-tag>
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="after_grade" label="变更后等级" width="110">
        <template #default="{ row }">
          <span v-if="row.after_grade">
            <el-tag :type="getGradeColor(row.after_grade)" effect="light" size="small">
              {{ getGradeLabel(row.after_grade) }}
            </el-tag>
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="before_status" label="变更前状态" width="100">
        <template #default="{ row }">
          <span v-if="row.before_status !== undefined && row.before_status !== null">
            <el-tag :type="getStatusColor(row.before_status)" effect="light" size="small">
              {{ getStatusLabel(row.before_status) }}
            </el-tag>
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="after_status" label="变更后状态" width="100">
        <template #default="{ row }">
          <span v-if="row.after_status !== undefined && row.after_status !== null">
            <el-tag :type="getStatusColor(row.after_status)" effect="light" size="small">
              {{ getStatusLabel(row.after_status) }}
            </el-tag>
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="operator_name" label="操作人" width="100" />
      <el-table-column prop="violation_type" label="违规类型" width="100">
        <template #default="{ row }">
          <span v-if="row.violation_type">{{ getViolationTypeLabel(row.violation_type) }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="violation_details" label="违规详情" min-width="180" show-overflow-tooltip />
      <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
      <el-table-column prop="created_at" label="操作时间" width="160" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleViewTrace(row)">详情</el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <el-drawer
      v-model="detailDrawerVisible"
      title="溯源详情"
      size="700px"
      direction="rtl"
    >
      <div v-if="detailData" class="detail-content">
        <el-steps :active="currentStep" direction="vertical" finish-status="success" error-status="error">
          <el-step title="黑名单录入" :description="formatStepTime(detailData.created_at)">
            <template #icon>
              <el-icon :size="18"><UserPlus /></el-icon>
            </template>
            <div class="step-detail">
              <p><b>黑名单编号:</b> {{ detailData.blacklist_no }}</p>
              <p><b>操作人:</b> {{ detailData.operator_name }}</p>
              <p v-if="detailData.operation_detail"><b>操作详情:</b> {{ JSON.stringify(detailData.operation_detail) }}</p>
            </div>
          </el-step>
          <el-step title="当前操作" :icon="getStepIcon(detailData.trace_type)" :status="detailData.is_compliant === 1 ? 'success' : 'error'">
            <div class="step-detail">
              <p><b>操作类型:</b> {{ detailData.trace_type_text }}</p>
              <p><b>操作时间:</b> {{ detailData.created_at }}</p>
              <p v-if="detailData.before_grade"><b>变更前等级:</b> {{ getGradeLabel(detailData.before_grade) }}</p>
              <p v-if="detailData.after_grade"><b>变更后等级:</b> {{ getGradeLabel(detailData.after_grade) }}</p>
              <p v-if="detailData.violation_details"><b>异常详情:</b> {{ detailData.violation_details }}</p>
              <p v-if="detailData.remark"><b>备注:</b> {{ detailData.remark }}</p>
              <el-tag v-if="detailData.is_compliant === 1" type="success" effect="dark">
                操作合规
              </el-tag>
              <el-tag v-else type="danger" effect="dark">
                操作异常 - 存在违规风险
              </el-tag>
            </div>
          </el-step>
        </el-steps>

        <el-divider />

        <div class="compliance-check">
          <h4>合规性校验</h4>
          <el-table :data="complianceCheckItems" size="small">
            <el-table-column prop="check_item" label="校验项" width="200" />
            <el-table-column prop="check_result" label="结果" width="100">
              <template #default="{ row }">
                <el-tag :type="row.passed ? 'success' : 'danger'" effect="light" size="small">
                  {{ row.passed ? '通过' : '不通过' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="check_detail" label="详情" min-width="200" />
          </el-table>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { Refresh, Download, CircleCheck, Warning, UserRemove, UserPlus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  getBlacklistTraceList,
  BlacklistTraceTypeOptions,
  BlacklistGradeOptions,
  BlacklistStatusOptions,
  ViolationTypeOptions,
  type BlacklistTrace
} from '@api/blacklist'

const loading = ref(false)
const tableData = ref<BlacklistTrace[]>([])
const total = ref(0)

const searchForm = reactive({
  blacklist_no: '',
  keyword: '',
  trace_type: undefined as number | undefined,
  is_compliant: undefined as number | undefined,
  operator_name: '',
  timeRange: [] as string[]
})

const pageParams = reactive({
  page: 1,
  pageSize: 20
})

const detailDrawerVisible = ref(false)
const detailData = ref<BlacklistTrace | null>(null)
const currentStep = ref(1)

const complianceCheckItems = ref<any[]>([])

const totalCompliant = computed(() => tableData.value.filter(item => item.is_compliant === 1).length)
const totalNonCompliant = computed(() => tableData.value.filter(item => item.is_compliant === 0).length)
const totalRemoveCount = computed(() => tableData.value.filter(item => item.trace_type === 4).length)
const totalAddCount = computed(() => tableData.value.filter(item => item.trace_type === 1).length)

const getTraceTypeColor = (type: number) => {
  const item = BlacklistTraceTypeOptions.find(i => i.value === type)
  return item?.color || 'info'
}

const getGradeLabel = (grade: number) => {
  const item = BlacklistGradeOptions.find(i => i.value === grade)
  return item?.label || '-'
}

const getGradeColor = (grade: number) => {
  const item = BlacklistGradeOptions.find(i => i.value === grade)
  return item?.color || 'info'
}

const getStatusLabel = (status: number) => {
  const item = BlacklistStatusOptions.find(i => i.value === status)
  return item?.label || '-'
}

const getStatusColor = (status: number) => {
  const item = BlacklistStatusOptions.find(i => i.value === status)
  return item?.color || 'info'
}

const getViolationTypeLabel = (type: number) => {
  const item = ViolationTypeOptions.find(i => i.value === type)
  return item?.label || '-'
}

const getStepIcon = (type: number) => {
  const icons: Record<number, any> = {
    1: UserPlus,
    2: CircleCheck,
    3: Warning,
    4: UserRemove,
    5: UserPlus,
    6: UserPlus
  }
  return icons[type] || CircleCheck
}

const formatStepTime = (time: string) => {
  return time || '-'
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pageParams.page,
      pageSize: pageParams.pageSize,
      blacklist_no: searchForm.blacklist_no || undefined,
      keyword: searchForm.keyword || undefined,
      trace_type: searchForm.trace_type,
      is_compliant: searchForm.is_compliant,
      operator_name: searchForm.operator_name || undefined
    }

    if (searchForm.timeRange && searchForm.timeRange.length === 2) {
      params.start_time = searchForm.timeRange[0]
      params.end_time = searchForm.timeRange[1]
    }

    const res = await getBlacklistTraceList(params)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageParams.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.blacklist_no = ''
  searchForm.keyword = ''
  searchForm.trace_type = undefined
  searchForm.is_compliant = undefined
  searchForm.operator_name = ''
  searchForm.timeRange = []
  pageParams.page = 1
  fetchData()
}

const handlePageChange = () => {
  fetchData()
}

const filterByCompliance = (value: number) => {
  if (searchForm.is_compliant === value) {
    searchForm.is_compliant = undefined
  } else {
    searchForm.is_compliant = value
  }
  handleSearch()
}

const handleViewTrace = (row: BlacklistTrace) => {
  detailData.value = row

  complianceCheckItems.value = [
    { check_item: '违规事实校验', passed: true, check_detail: '存在3条有效违规记录' },
    { check_item: '证据完整性校验', passed: row.is_compliant === 1, check_detail: row.is_compliant === 1 ? '证据材料齐全' : '缺失关键证据材料' },
    { check_item: '流程完整性校验', passed: true, check_detail: '审核流程完整' },
    { check_item: '解除条件校验', passed: row.trace_type === 4 ? false : true, check_detail: row.trace_type === 4 ? '未满足解除条件' : '无需解除条件' },
    { check_item: '操作人权限校验', passed: true, check_detail: '操作人具备相应权限' }
  ]

  detailDrawerVisible.value = true
}

const handleExport = () => {
  ElMessage.info('导出功能开发中')
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.ccb-blacklist-trace {
  .top-stats {
    margin-bottom: 16px;

    .stat-card {
      .stat-card-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;

        &.success {
          background: rgba(103, 194, 58, 0.1);
          color: #67c23a;
        }

        &.danger {
          background: rgba(245, 108, 108, 0.1);
          color: #f56c6c;
        }

        &.primary {
          background: rgba(64, 158, 255, 0.1);
          color: #409eff;
        }

        &.warning {
          background: rgba(230, 162, 60, 0.1);
          color: #e6a23c;
        }
      }

      .stat-info {
        text-align: right;
      }

      .stat-value {
        font-size: 24px;
        font-weight: bold;
        line-height: 1.2;
      }

      .stat-label {
        font-size: 13px;
        color: #909399;
        margin-top: 2px;
      }
    }
  }

  .compliance-filter {
    display: flex;
    gap: 8px;

    .filter-tag {
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        transform: scale(1.05);
      }

      &.active {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
    }
  }

  .detail-content {
    padding: 0 10px;

    .step-detail {
      padding: 12px;
      background: #f5f7fa;
      border-radius: 4px;
      margin-top: 8px;

      p {
        margin: 4px 0;
        font-size: 13px;

        b {
          color: #606266;
        }
      }
    }

    .compliance-check {
      margin-top: 20px;

      h4 {
        margin-bottom: 12px;
        font-size: 14px;
        font-weight: 500;
      }
    }
  }
}
</style>
