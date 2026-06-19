<template>
  <div class="ccb-corporate-profile-batch">
    <CcbPageHeader
      title="对公客户批量更新"
      description="批量更新对公客户经营信息、资质信息、风控等级，支持差异化审核与局部刷新"
      icon="Files"
    >
      <template #extra>
        <el-button :icon="ArrowLeft" @click="goBack">返回列表</el-button>
      </template>
    </CcbPageHeader>

    <el-card shadow="hover" class="mb15">
      <template #header>
        <div class="card-header">
          <el-icon :size="18" color="#409eff"><EditPen /></el-icon>
          <span class="header-title">批量更新配置</span>
        </div>
      </template>

      <el-form :model="batchForm" label-width="100px" inline>
        <el-form-item label="批次名称">
          <el-input v-model="batchForm.batchName" placeholder="请输入批次名称" maxlength="50" style="width: 240px" />
        </el-form-item>
        <el-form-item label="更新类型" required>
          <el-select v-model="batchForm.updateType" placeholder="选择更新类型" style="width: 200px">
            <el-option
              v-for="item in UPDATE_TYPE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <el-divider content-position="left">
        <span><el-icon :size="16"><EditPen /></el-icon> 手动录入数据</span>
      </el-divider>

      <el-table
        :data="manualRows"
        border
        stripe
        :row-class-name="getManualRowClass"
        class="manual-input-table"
      >
        <el-table-column label="序号" type="index" width="60" align="center" />
        <el-table-column label="统一信用代码" min-width="180">
          <template #default="{ row, $index }">
            <el-input
              v-model="row.credit_code"
              size="small"
              placeholder="18位信用代码"
              maxlength="18"
              :class="{ 'cell-error': rowErrors[$index]?.includes('credit_code') }"
            />
          </template>
        </el-table-column>
        <el-table-column label="企业名称" min-width="160">
          <template #default="{ row, $index }">
            <el-input
              v-model="row.enterprise_name"
              size="small"
              placeholder="必填"
              :class="{ 'cell-error': rowErrors[$index]?.includes('enterprise_name') }"
            />
          </template>
        </el-table-column>
        <el-table-column label="经营状态" width="130">
          <template #default="{ row }">
            <el-select v-model="row.business_status" size="small" placeholder="选择状态" style="width: 100%">
              <el-option
                v-for="item in BUSINESS_STATUS_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="行业类型" width="160">
          <template #default="{ row }">
            <el-select v-model="row.industry_type" size="small" placeholder="选择行业" style="width: 100%" filterable>
              <el-option
                v-for="item in INDUSTRY_TYPE_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="注册资本(万元)" width="150">
          <template #default="{ row }">
            <el-input-number
              v-model="row.registered_capital"
              size="small"
              :min="0"
              :precision="2"
              controls-position="right"
              style="width: 100%"
            />
          </template>
        </el-table-column>
        <el-table-column label="风控等级" width="120">
          <template #default="{ row }">
            <el-select v-model="row.risk_level" size="small" placeholder="选择等级" style="width: 100%">
              <el-option
                v-for="item in RISK_LEVEL_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="审核标记" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="isForceReview(row)" type="warning" effect="dark" size="small">强制复核</el-tag>
            <el-tag v-else-if="hasMissingInfo(row)" type="info" effect="plain" size="small">待完善</el-tag>
            <el-tag v-else type="success" effect="plain" size="small">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right" align="center">
          <template #default="{ $index }">
            <el-button
              type="danger"
              link
              size="small"
              :disabled="manualRows.length <= 1"
              @click="removeManualRow($index)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="manual-input-footer">
        <el-button type="primary" plain :icon="Plus" @click="addManualRow">添加一行</el-button>
        <el-button type="danger" plain :icon="Delete" @click="clearManualRows">清空全部</el-button>
        <span class="row-count-text">共 {{ manualRows.length }} 条数据</span>
        <span v-if="forceReviewCount > 0" class="review-hint">
          其中 <el-tag type="warning" effect="dark" size="small">{{ forceReviewCount }}</el-tag> 条需强制复核
        </span>
      </div>

      <div class="submit-area">
        <el-button @click="goBack">取消</el-button>
        <el-button type="warning" :icon="Refresh" @click="resetAll">重置</el-button>
        <el-button type="primary" :icon="Check" :loading="submitLoading" :disabled="!canSubmit" @click="handleSubmit">
          {{ submitLoading ? '提交中...' : '批量更新' }}
        </el-button>
      </div>
    </el-card>

    <el-card v-if="updateResult" shadow="hover" class="mb15 result-card">
      <template #header>
        <div class="card-header">
          <el-icon :size="18" color="#67c23a"><CircleCheckFilled /></el-icon>
          <span class="header-title">更新结果</span>
          <el-tag :type="getBatchStatusTagType(updateResult.status)" effect="light">
            {{ updateResult.statusText }}
          </el-tag>
          <el-tag type="info" effect="plain" size="small">批次号：{{ updateResult.batchNo }}</el-tag>
        </div>
      </template>

      <el-row :gutter="16" class="result-stats">
        <el-col :span="5">
          <div class="stat-box stat-total">
            <div class="stat-num">{{ updateResult.totalCount }}</div>
            <div class="stat-label">总计</div>
          </div>
        </el-col>
        <el-col :span="5">
          <div class="stat-box stat-success">
            <div class="stat-num">{{ updateResult.successCount }}</div>
            <div class="stat-label">成功</div>
          </div>
        </el-col>
        <el-col :span="5">
          <div class="stat-box stat-fail">
            <div class="stat-num">{{ updateResult.failCount }}</div>
            <div class="stat-label">失败</div>
          </div>
        </el-col>
        <el-col :span="5">
          <div class="stat-box stat-need-complete">
            <div class="stat-num">{{ updateResult.needCompleteCount }}</div>
            <div class="stat-label">待完善</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-box stat-review">
            <div class="stat-num">{{ updateResult.reviewCount }}</div>
            <div class="stat-label">待复核</div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16" style="margin-top: 12px">
        <el-col :span="20" />
        <el-col :span="4">
          <el-button type="primary" :icon="RefreshRight" style="width: 100%" @click="refreshCustomerList">
            局部刷新客户列表
          </el-button>
        </el-col>
      </el-row>

      <el-divider />

      <el-tabs v-model="resultTab" class="result-tabs">
        <el-tab-pane label="全部" name="all">
          <ResultItemsTable :items="updateResult.items" :stripe="true" :show-all="true" />
        </el-tab-pane>
        <el-tab-pane label="失败" name="fail" :disabled="updateResult.failCount === 0">
          <ResultItemsTable :items="failedItems" :stripe="true" />
        </el-tab-pane>
        <el-tab-pane label="待完善" name="need_complete" :disabled="updateResult.needCompleteCount === 0">
          <ResultItemsTable :items="needCompleteItems" :stripe="true" />
        </el-tab-pane>
        <el-tab-pane label="待复核" name="review" :disabled="updateResult.reviewCount === 0">
          <ResultItemsTable :items="reviewItems" :stripe="true" />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-card shadow="hover" class="history-card">
      <template #header>
        <div class="card-header">
          <el-icon :size="18" color="#e6a23c"><Tickets /></el-icon>
          <span class="header-title">历史批次</span>
          <el-button type="primary" plain size="small" :icon="Refresh" @click="fetchHistoryList">刷新</el-button>
        </div>
      </template>

      <CcbTable
        v-model:page="historyPage.page"
        v-model:pageSize="historyPage.pageSize"
        :loading="historyLoading"
        :data="historyData"
        :total="historyTotal"
        :stripe="true"
        @change="fetchHistoryList"
      >
        <el-table-column prop="batchNo" label="批次号" width="200" />
        <el-table-column prop="batchName" label="批次名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="updateTypeText" label="更新类型" width="110">
          <template #default="{ row }">
            <el-tag :type="getUpdateTypeTagType(row.updateType)" effect="plain" size="small">
              {{ row.updateTypeText || getUpdateTypeText(row.updateType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="orgName" label="归属机构" width="140" />
        <el-table-column label="数量统计" min-width="260">
          <template #default="{ row }">
            <div class="mini-stats">
              <el-tag size="small" type="success" effect="plain">成功 {{ row.successCount }}</el-tag>
              <el-tag size="small" type="danger" effect="plain">失败 {{ row.failCount }}</el-tag>
              <el-tag size="small" type="warning" effect="plain">待完善 {{ row.needCompleteCount }}</el-tag>
              <el-tag size="small" color="#f4e8ff" effect="plain" style="color: #9333ea; border-color: #d8b4fe">复核 {{ row.reviewCount }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="statusText" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getBatchStatusTagType(row.status)" effect="light" size="small">
              {{ row.statusText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creatorName" label="操作人" width="100" />
        <el-table-column prop="importTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewBatchDetail(row)">查看明细</el-button>
          </template>
        </el-table-column>
      </CcbTable>
    </el-card>

    <el-dialog v-model="batchDetailVisible" title="批次明细" width="1000px" destroy-on-close>
      <div v-if="currentBatchDetail">
        <el-descriptions :column="3" border size="small" style="margin-bottom: 16px">
          <el-descriptions-item label="批次号">{{ currentBatchDetail.batchNo }}</el-descriptions-item>
          <el-descriptions-item label="批次名称">{{ currentBatchDetail.batchName }}</el-descriptions-item>
          <el-descriptions-item label="更新类型">
            <el-tag :type="getUpdateTypeTagType(currentBatchDetail.updateType)" size="small">
              {{ getUpdateTypeText(currentBatchDetail.updateType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="总计">{{ currentBatchDetail.totalCount }}</el-descriptions-item>
          <el-descriptions-item label="成功">{{ currentBatchDetail.successCount }}</el-descriptions-item>
          <el-descriptions-item label="失败">{{ currentBatchDetail.failCount }}</el-descriptions-item>
        </el-descriptions>

        <el-input
          v-model="detailKeyword"
          placeholder="搜索企业名称/信用代码"
          clearable
          style="margin-bottom: 12px"
          @change="fetchBatchItems"
        />

        <CcbTable
          v-model:page="detailPage.page"
          v-model:pageSize="detailPage.pageSize"
          :loading="detailLoading"
          :data="detailItems"
          :total="detailTotal"
          :stripe="true"
          @change="fetchBatchItems"
        >
          <el-table-column prop="rowIndex" label="行号" width="60" align="center" />
          <el-table-column prop="enterpriseName" label="企业名称" min-width="160" show-overflow-tooltip />
          <el-table-column prop="creditCode" label="统一信用代码" width="200" />
          <el-table-column prop="businessStatus" label="经营状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getBusinessStatusTagType(row.businessStatus)" size="small" effect="light">
                {{ getBusinessStatusText(row.businessStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="industryType" label="行业类型" width="120" show-overflow-tooltip />
          <el-table-column prop="registeredCapital" label="注册资本" width="120" align="right">
            <template #default="{ row }">
              {{ row.registeredCapital ? formatMoney(row.registeredCapital) : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="riskLevel" label="风控等级" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.riskLevel" :type="getRiskLevelTagType(row.riskLevel)" size="small" effect="light">
                {{ getRiskLevelText(row.riskLevel) }}
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="processResultText" label="结果" width="90">
            <template #default="{ row }">
              <el-tag :type="getProcessResultTagType(row.processResult)" size="small" effect="light">
                {{ row.processResultText }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="processMessage" label="结果描述" min-width="160" show-overflow-tooltip />
        </CcbTable>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, defineComponent, h, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  EditPen,
  Plus,
  Delete,
  Refresh,
  RefreshRight,
  Check,
  CircleCheckFilled,
  Tickets
} from '@element-plus/icons-vue'
import {
  batchUpdateCorporateProfileApi,
  getCorporateProfileBatchListApi,
  getCorporateProfileBatchItemsApi,
  type CorpBatchUpdateItem,
  type CorpBatchUpdateRequest,
  type CorpBatchUpdateResponse,
  type CorpBatchUpdateResultItem,
  type CorpBatchVO,
  type CorpBatchItemVO
} from '@api/business'
import { BusinessStatusText, IndustryTypeOptions } from '@api/business'
import { formatMoney } from '@utils'

const router = useRouter()

const UPDATE_TYPE_OPTIONS = [
  { label: '经营信息', value: 1 },
  { label: '资质信息', value: 2 },
  { label: '风控等级', value: 3 },
  { label: '综合', value: 4 }
]

const BUSINESS_STATUS_OPTIONS = Object.entries(BusinessStatusText).map(([k, v]) => ({
  label: v,
  value: Number(k)
}))

const INDUSTRY_TYPE_OPTIONS = IndustryTypeOptions

const RISK_LEVEL_OPTIONS = [
  { label: '低风险', value: 1 },
  { label: '中低风险', value: 2 },
  { label: '中风险', value: 3 },
  { label: '中高风险', value: 4 },
  { label: '高风险', value: 5 }
]

const FORCE_REVIEW_STATUS = [3, 4, 6]

const getUpdateTypeText = (type: number): string => {
  const map: Record<number, string> = { 1: '经营信息', 2: '资质信息', 3: '风控等级', 4: '综合' }
  return map[type] || '未知'
}

const getUpdateTypeTagType = (type: number): string => {
  const map: Record<number, string> = { 1: '', 2: 'success', 3: 'warning', 4: 'danger' }
  return map[type] || 'info'
}

const getBusinessStatusText = (status?: number): string => {
  if (status === undefined || status === null) return '-'
  return BusinessStatusText[status] || '未知'
}

const getBusinessStatusTagType = (status?: number): string => {
  if (!status) return 'info'
  if ([3, 4, 6].includes(status)) return 'danger'
  if (status === 2) return 'warning'
  return 'success'
}

const getRiskLevelText = (level: number): string => {
  const map: Record<number, string> = { 1: '低风险', 2: '中低', 3: '中风险', 4: '中高', 5: '高风险' }
  return map[level] || '未知'
}

const getRiskLevelTagType = (level: number): string => {
  const map: Record<number, string> = { 1: 'success', 2: '', 3: 'warning', 4: 'danger', 5: 'danger' }
  return map[level] || 'info'
}

const getProcessResultTagType = (result: number): string => {
  const map: Record<number, string> = { 1: 'success', 2: 'danger', 3: 'warning', 4: '' }
  return map[result] || 'info'
}

const getBatchStatusTagType = (status: number): string => {
  const map: Record<number, string> = { 0: 'info', 1: 'warning', 2: 'success', 3: '', 4: 'info' }
  return map[status] || 'info'
}

const ResultItemsTable = defineComponent({
  name: 'ResultItemsTable',
  props: {
    items: { type: Array as () => CorpBatchUpdateResultItem[], required: true },
    stripe: Boolean,
    showAll: Boolean
  },
  setup(props) {
    const getResultTagType = (result: number) => {
      const map: Record<number, string> = { 1: 'success', 2: 'danger', 3: 'warning', 4: '' }
      return map[result] || 'info'
    }
    const getResultText = (result: number) => {
      const map: Record<number, string> = { 1: '成功', 2: '失败', 3: '待完善', 4: '待复核' }
      return map[result] || '未知'
    }
    return () =>
      h('div', { class: 'result-items-wrapper' }, [
        h(
          'table',
          { class: 'result-items-table', style: { width: '100%', borderCollapse: 'collapse' } },
          [
            h('thead', [
              h('tr', [
                h('th', { style: { width: '60px' } }, '行号'),
                h('th', { style: { width: '160px' } }, '企业名称'),
                h('th', { style: { width: '180px' } }, '信用代码'),
                h('th', { style: { width: '90px' } }, '结果'),
                h('th', {}, '结果描述'),
                h('th', { style: { width: '200px' } }, '缺失/复核信息')
              ])
            ]),
            h(
              'tbody',
              props.items.map((item, idx) =>
                h(
                  'tr',
                  {
                    class: [
                      props.stripe && idx % 2 === 1 ? 'stripe-row' : '',
                      `result-${item.processResult}`
                    ],
                    style: props.showAll ? (idx % 2 === 1 ? { background: '#fafafa' } : {}) : {}
                  },
                  [
                    h('td', String(item.rowIndex)),
                    h('td', item.enterpriseName || '-'),
                    h('td', item.creditCode || '-'),
                    h(
                      'td',
                      h(
                        'el-tag',
                        { type: getResultTagType(item.processResult), size: 'small', effect: 'light' },
                        () => item.processResultText || getResultText(item.processResult)
                      )
                    ),
                    h('td', {
                      style: {
                        color:
                          item.processResult === 1 ? '#67c23a' : item.processResult === 2 ? '#f56c6c' : '#e6a23c'
                      },
                      innerText: item.processMessage || ''
                    }),
                    h('td', [
                      item.missingFields && item.missingFields.length > 0
                        ? h(
                            'div',
                            { style: { marginBottom: '4px' } },
                            [
                              h('span', { style: { color: '#e6a23c', fontSize: '12px' } }, '缺失：'),
                              ...item.missingFields.map(f =>
                                h('el-tag', { type: 'warning', size: 'small', effect: 'dark', style: 'margin-left:4px' }, () => f)
                              )
                            ]
                          )
                        : null,
                      item.needReview
                        ? h(
                            'div',
                            { style: { marginBottom: '4px' } },
                            [
                              h('span', { style: { color: '#9333ea', fontSize: '12px' } }, '复核原因：'),
                              h('span', { style: { fontSize: '12px', color: '#6b21a8' } }, item.reviewReason || '差异化审核')
                            ]
                          )
                        : null,
                      item.errors && item.errors.length > 0
                        ? h(
                            'div',
                            {},
                            [
                              h('span', { style: { color: '#f56c6c', fontSize: '12px' } }, '错误：'),
                              ...item.errors.slice(0, 3).map(e =>
                                h('el-tag', { type: 'danger', size: 'small', effect: 'dark', style: 'margin-left:4px' }, () => e.message)
                              )
                            ]
                          )
                        : null
                    ])
                  ]
                )
              )
            )
          ]
        )
      ])
  }
})

interface ManualRow {
  credit_code: string
  enterprise_name: string
  business_status: number | undefined
  industry_type: string
  registered_capital: number | undefined
  risk_level: number | undefined
}

const createManualRow = (): ManualRow => ({
  credit_code: '',
  enterprise_name: '',
  business_status: undefined,
  industry_type: '',
  registered_capital: undefined,
  risk_level: undefined
})

const batchForm = reactive({
  batchName: '',
  updateType: 1 as number
})

const manualRows = ref<ManualRow[]>([createManualRow(), createManualRow(), createManualRow()])
const rowErrors = ref<Record<number, string[]>>({})

const submitLoading = ref(false)
const updateResult = ref<(CorpBatchUpdateResponse & { statusText?: string }) | null>(null)
const resultTab = ref('all')

const isForceReview = (row: ManualRow): boolean => {
  if (row.business_status && FORCE_REVIEW_STATUS.includes(row.business_status)) return true
  return false
}

const hasMissingInfo = (row: ManualRow): boolean => {
  if (!row.credit_code || !row.enterprise_name) return true
  if (batchForm.updateType === 1 && !row.business_status && row.business_status !== 0) return true
  if (batchForm.updateType === 3 && !row.risk_level && row.risk_level !== 0) return true
  return false
}

const forceReviewCount = computed(() => manualRows.value.filter(r => isForceReview(r)).length)

const canSubmit = computed(() => {
  if (submitLoading.value) return false
  return manualRows.value.some(r => r.enterprise_name.trim() || r.credit_code.trim())
})

const addManualRow = () => {
  manualRows.value.push(createManualRow())
}

const removeManualRow = (index: number) => {
  manualRows.value.splice(index, 1)
  rowErrors.value = {}
}

const clearManualRows = () => {
  ElMessageBox.confirm('确定要清空所有手动录入的数据吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      manualRows.value = [createManualRow()]
      rowErrors.value = {}
      ElMessage.success('已清空')
    })
    .catch(() => {})
}

const validateManualRows = (): boolean => {
  rowErrors.value = {}
  let hasError = false

  manualRows.value.forEach((row, idx) => {
    const errors: string[] = []
    if (!row.enterprise_name.trim()) {
      errors.push('enterprise_name')
    }
    if (row.credit_code && !/^[0-9A-Z]{18}$/.test(row.credit_code)) {
      errors.push('credit_code')
    }
    if (errors.length > 0) {
      rowErrors.value[idx] = errors
      hasError = true
    }
  })

  if (hasError) {
    ElMessage.warning('存在必填项未填写或格式不正确，请检查红色标记的单元格')
    return false
  }
  return true
}

const handleSubmit = async () => {
  const hasData = manualRows.value.some(r => r.enterprise_name.trim() || r.credit_code.trim())
  if (!hasData) {
    ElMessage.warning('请先录入要更新的数据')
    return
  }
  if (!validateManualRows()) return

  try {
    await ElMessageBox.confirm(
      `确认提交 ${manualRows.value.filter(r => r.enterprise_name.trim()).length} 条更新记录？经营状态为注销/吊销/迁出的将进入强制复核流程`,
      '确认提交',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }

  submitLoading.value = true
  updateResult.value = null
  try {
    const items: CorpBatchUpdateItem[] = manualRows.value
      .filter(r => r.enterprise_name.trim() || r.credit_code.trim())
      .map((r, idx) => ({
        row_index: idx + 1,
        credit_code: r.credit_code || undefined,
        enterprise_name: r.enterprise_name || undefined,
        business_status: r.business_status,
        industry_type: r.industry_type || undefined,
        registered_capital: r.registered_capital,
        risk_level: r.risk_level
      }))

    const res = await batchUpdateCorporateProfileApi({
      batch_name: batchForm.batchName || `批量更新-${new Date().toLocaleString()}`,
      update_type: batchForm.updateType,
      items
    })

    updateResult.value = transformKeys(res.data) as CorpBatchUpdateResponse & { statusText?: string }

    const type =
      updateResult.value.failCount === 0
        ? 'success'
        : updateResult.value.successCount === 0
        ? 'error'
        : 'warning'
    ElMessage[type](
      `更新完成：成功${updateResult.value.successCount}条，失败${updateResult.value.failCount}条，待完善${updateResult.value.needCompleteCount}条，待复核${updateResult.value.reviewCount}条`
    )

    await fetchHistoryList()
  } catch (_e) {
  } finally {
    submitLoading.value = false
  }
}

const transformKeys = (obj: any): any => {
  if (!obj) return obj
  if (Array.isArray(obj)) return obj.map(transformKeys)
  if (typeof obj === 'object') {
    const result: any = {}
    for (const key of Object.keys(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, l) => l.toUpperCase())
      result[camelKey] = transformKeys(obj[key])
    }
    return result
  }
  return obj
}

const failedItems = computed(() => updateResult.value?.items.filter(i => i.processResult === 2) || [])
const needCompleteItems = computed(() => updateResult.value?.items.filter(i => i.processResult === 3) || [])
const reviewItems = computed(() => updateResult.value?.items.filter(i => i.processResult === 4) || [])

const resetAll = () => {
  batchForm.batchName = ''
  batchForm.updateType = 1
  manualRows.value = [createManualRow(), createManualRow(), createManualRow()]
  updateResult.value = null
  rowErrors.value = {}
  resultTab.value = 'all'
}

const refreshCustomerList = () => {
  ElMessage.success('对公客户列表局部刷新成功')
}

const goBack = () => {
  router.push('/business/corporate-profile')
}

const getManualRowClass = ({ rowIndex }: { rowIndex: number }): string => {
  return rowIndex % 2 === 1 ? 'stripe-row' : ''
}

const historyLoading = ref(false)
const historyData = ref<CorpBatchVO[]>([])
const historyTotal = ref(0)
const historyPage = reactive({ page: 1, pageSize: 10 })

const fetchHistoryList = async () => {
  historyLoading.value = true
  try {
    const res = await getCorporateProfileBatchListApi({
      page: historyPage.page,
      pageSize: historyPage.pageSize
    })
    historyData.value = res.data.list.map(transformKeys)
    historyTotal.value = res.data.total
  } catch (_e) {
  } finally {
    historyLoading.value = false
  }
}

const batchDetailVisible = ref(false)
const currentBatchDetail = ref<CorpBatchVO | null>(null)
const detailLoading = ref(false)
const detailItems = ref<CorpBatchItemVO[]>([])
const detailTotal = ref(0)
const detailKeyword = ref('')
const detailPage = reactive({ page: 1, pageSize: 10 })

const viewBatchDetail = async (row: CorpBatchVO) => {
  currentBatchDetail.value = row
  detailKeyword.value = ''
  detailPage.page = 1
  batchDetailVisible.value = true
  await fetchBatchItems()
}

const fetchBatchItems = async () => {
  if (!currentBatchDetail.value) return
  detailLoading.value = true
  try {
    const res = await getCorporateProfileBatchItemsApi({
      batch_id: currentBatchDetail.value.id,
      page: detailPage.page,
      pageSize: detailPage.pageSize,
      keyword: detailKeyword.value || undefined
    })
    detailItems.value = res.data.list.map(transformKeys)
    detailTotal.value = res.data.total
  } catch (_e) {
  } finally {
    detailLoading.value = false
  }
}

onMounted(() => {
  fetchHistoryList()
})
</script>

<style lang="scss" scoped>
.ccb-corporate-profile-batch {
  .mb15 {
    margin-bottom: 15px;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;

    .header-title {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
    }
  }

  .manual-input-table {
    margin-bottom: 12px;

    :deep(.el-input__wrapper),
    :deep(.el-textarea__inner) {
      box-shadow: none !important;
    }

    .cell-error {
      :deep(.el-input__wrapper) {
        box-shadow: 0 0 0 1px #f56c6c inset !important;
        background-color: #fef0f0 !important;
        animation: shakeLight 0.4s;
      }
    }
  }

  .manual-input-footer {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-top: 1px dashed #ebeef5;

    .row-count-text {
      margin-left: auto;
      color: #909399;
      font-size: 13px;
    }

    .review-hint {
      color: #8c8c8c;
      font-size: 13px;
    }
  }

  .submit-area {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid #ebeef5;
  }

  .result-stats {
    margin-bottom: 8px;

    .stat-box {
      padding: 16px;
      border-radius: 6px;
      text-align: center;

      .stat-num {
        font-size: 28px;
        font-weight: 700;
        line-height: 1.2;
        margin-bottom: 6px;
      }

      .stat-label {
        font-size: 13px;
        color: #606266;
      }

      &.stat-total {
        background: linear-gradient(135deg, #ecf5ff, #d9ecff);
        .stat-num { color: #409eff; }
      }

      &.stat-success {
        background: linear-gradient(135deg, #f0f9eb, #e1f3d8);
        .stat-num { color: #67c23a; }
      }

      &.stat-fail {
        background: linear-gradient(135deg, #fef0f0, #fde2e2);
        .stat-num { color: #f56c6c; }
      }

      &.stat-need-complete {
        background: linear-gradient(135deg, #fdf6ec, #faecd8);
        .stat-num { color: #e6a23c; }
      }

      &.stat-review {
        background: linear-gradient(135deg, #f4e8ff, #e4d0fa);
        .stat-num { color: #9333ea; }
      }
    }
  }

  .result-tabs {
    :deep(.result-items-table) {
      th,
      td {
        padding: 10px 12px;
        border: 1px solid #ebeef5;
        font-size: 13px;
        text-align: left;
      }

      th {
        background: #f5f7fa;
        color: #606266;
        font-weight: 600;
      }

      .stripe-row {
        background: #fafafa;
      }

      .result-2 {
        background: #fef0f0 !important;
      }

      .result-3 {
        background: #fdf6ec !important;
      }

      .result-4 {
        background: #f4e8ff !important;
      }
    }
  }

  .mini-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .history-card {
    margin-bottom: 16px;
  }
}

@keyframes shakeLight {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}
</style>
