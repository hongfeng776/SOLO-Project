<template>
  <div class="ccb-customer-tag-batch">
    <CcbPageHeader
      title="客户等级标签批量操作"
      description="批量筛选不同等级、不同标签的客户群体，支持批量新增、替换、移除、调整等级差异化操作"
      icon="PriceTag"
    >
      <template #extra>
        <el-button :icon="ArrowLeft" @click="goBack">返回列表</el-button>
      </template>
    </CcbPageHeader>

    <el-card shadow="hover" class="mb15">
      <template #header>
        <div class="card-header">
          <el-icon :size="18" color="#409eff"><EditPen /></el-icon>
          <span class="header-title">批量操作配置</span>
        </div>
      </template>

      <el-form :model="batchForm" label-width="100px" inline>
        <el-form-item label="批次名称">
          <el-input v-model="batchForm.batchName" placeholder="请输入批次名称" maxlength="50" style="width: 240px" />
        </el-form-item>
        <el-form-item label="操作类型" required>
          <el-select v-model="batchForm.operationType" placeholder="选择操作类型" style="width: 200px">
            <el-option
              v-for="item in OPERATION_TYPE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="batchForm.operationType === 1 || batchForm.operationType === 2" label="目标标签">
          <el-input v-model="batchForm.targetTagCode" placeholder="标签编码" style="width: 140px" />
          <el-input v-model="batchForm.targetTagName" placeholder="标签名称" style="width: 140px; margin-left: 8px" />
        </el-form-item>
        <el-form-item v-if="batchForm.operationType === 4" label="目标等级">
          <el-select v-model="batchForm.targetLevel" placeholder="选择目标等级" style="width: 200px">
            <el-option
              v-for="item in CUSTOMER_LEVEL_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="筛选等级">
          <el-select v-model="batchForm.filterLevel" placeholder="按等级筛选" clearable style="width: 160px">
            <el-option
              v-for="item in CUSTOMER_LEVEL_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="筛选标签">
          <el-input v-model="batchForm.filterTagCode" placeholder="按标签编码筛选" clearable style="width: 200px" />
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
        <el-table-column label="客户编号" min-width="160">
          <template #default="{ row, $index }">
            <el-input
              v-model="row.customer_no"
              size="small"
              placeholder="客户编号"
              :class="{ 'cell-error': rowErrors[$index]?.includes('customer_no') }"
            />
          </template>
        </el-table-column>
        <el-table-column label="客户名称" min-width="140">
          <template #default="{ row, $index }">
            <el-input
              v-model="row.customer_name"
              size="small"
              placeholder="必填"
              :class="{ 'cell-error': rowErrors[$index]?.includes('customer_name') }"
            />
          </template>
        </el-table-column>
        <el-table-column label="当前等级" width="130">
          <template #default="{ row }">
            <el-select v-model="row.current_level" size="small" placeholder="选择等级" style="width: 100%" clearable>
              <el-option
                v-for="item in CUSTOMER_LEVEL_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="当前标签" min-width="200">
          <template #default="{ row }">
            <el-input v-model="row.current_tags" size="small" placeholder="标签编码，多个逗号分隔" />
          </template>
        </el-table-column>
        <el-table-column label="审核标记" width="110" align="center">
          <template #default="{ row }">
            <el-tag v-if="isBlockRow(row)" type="danger" effect="dark" size="small">拦截</el-tag>
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
        <span v-if="blockCount > 0" class="review-hint">
          其中 <el-tag type="danger" effect="dark" size="small">{{ blockCount }}</el-tag> 条将触发拦截审核
        </span>
      </div>

      <div class="submit-area">
        <el-button @click="goBack">取消</el-button>
        <el-button type="warning" :icon="Refresh" @click="resetAll">重置</el-button>
        <el-button type="primary" :icon="Check" :loading="submitLoading" :disabled="!canSubmit" @click="handleSubmit">
          {{ submitLoading ? '提交中...' : '批量操作' }}
        </el-button>
      </div>
    </el-card>

    <el-card v-if="updateResult" shadow="hover" class="mb15 result-card">
      <template #header>
        <div class="card-header">
          <el-icon :size="18" color="#67c23a"><CircleCheckFilled /></el-icon>
          <span class="header-title">操作结果</span>
          <el-tag :type="getBatchStatusTagType(updateResult.status)" effect="light">
            {{ getBatchStatusText(updateResult.status) }}
          </el-tag>
          <el-tag type="info" effect="plain" size="small">批次号：{{ updateResult.batchNo }}</el-tag>
        </div>
      </template>

      <el-row :gutter="16" class="result-stats">
        <el-col :span="6">
          <div class="stat-box stat-success">
            <div class="stat-num">{{ updateResult.successCount }}</div>
            <div class="stat-label">成功</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-box stat-fail">
            <div class="stat-num">{{ updateResult.failCount }}</div>
            <div class="stat-label">失败</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-box stat-unauthorized">
            <div class="stat-num">{{ updateResult.unauthorizedCount }}</div>
            <div class="stat-label">越权拦截</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-box stat-violation">
            <div class="stat-num">{{ updateResult.violationCount }}</div>
            <div class="stat-label">违规拦截</div>
          </div>
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
        <el-tab-pane label="越权拦截" name="unauthorized" :disabled="updateResult.unauthorizedCount === 0">
          <ResultItemsTable :items="unauthorizedItems" :stripe="true" />
        </el-tab-pane>
        <el-tab-pane label="违规拦截" name="violation" :disabled="updateResult.violationCount === 0">
          <ResultItemsTable :items="violationItems" :stripe="true" />
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
        <el-table-column prop="operationType" label="操作类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getOperationTypeTagType(row.operationType)" effect="plain" size="small">
              {{ row.operationTypeText || getOperationTypeText(row.operationType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="targetTagName" label="目标标签" width="120" show-overflow-tooltip />
        <el-table-column prop="orgName" label="归属机构" width="140" />
        <el-table-column label="数量统计" min-width="260">
          <template #default="{ row }">
            <div class="mini-stats">
              <el-tag size="small" type="success" effect="plain">成功 {{ row.successCount }}</el-tag>
              <el-tag size="small" type="danger" effect="plain">失败 {{ row.failCount }}</el-tag>
              <el-tag size="small" color="#fff7e6" effect="plain" style="color: #e6a23c; border-color: #f5c678">越权 {{ row.unauthorizedCount }}</el-tag>
              <el-tag size="small" color="#f4e8ff" effect="plain" style="color: #9333ea; border-color: #d8b4fe">违规 {{ row.violationCount }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getBatchStatusTagType(row.status)" effect="light" size="small">
              {{ row.statusText || getBatchStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creatorName" label="操作人" width="100" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
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
          <el-descriptions-item label="操作类型">
            <el-tag :type="getOperationTypeTagType(currentBatchDetail.operationType)" size="small">
              {{ getOperationTypeText(currentBatchDetail.operationType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="成功">{{ currentBatchDetail.successCount }}</el-descriptions-item>
          <el-descriptions-item label="失败">{{ currentBatchDetail.failCount }}</el-descriptions-item>
          <el-descriptions-item label="越权拦截">{{ currentBatchDetail.unauthorizedCount }}</el-descriptions-item>
        </el-descriptions>

        <el-input
          v-model="detailKeyword"
          placeholder="搜索客户编号/客户名称"
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
          <el-table-column prop="customerNo" label="客户编号" width="160" />
          <el-table-column prop="customerName" label="客户名称" min-width="140" show-overflow-tooltip />
          <el-table-column prop="currentLevel" label="当前等级" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.currentLevel" :type="getCustomerLevelTagType(row.currentLevel)" size="small" effect="light">
                {{ getCustomerLevelText(row.currentLevel) }}
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="currentTags" label="当前标签" min-width="160" show-overflow-tooltip />
          <el-table-column prop="processResult" label="处理结果" width="110">
            <template #default="{ row }">
              <el-tag
                :type="getProcessResultTagType(row.processResult)"
                size="small"
                effect="light"
                :class="{ 'result-block-tag': row.processResult === 3 || row.processResult === 4 }"
              >
                {{ row.processResultText || getProcessResultText(row.processResult) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="processMessage" label="结果描述" min-width="160" show-overflow-tooltip />
          <el-table-column prop="blockReason" label="拦截原因" min-width="140" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.processResult === 3 || row.processResult === 4" class="block-reason-text">
                {{ row.blockReason || '-' }}
              </span>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </CcbTable>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, defineComponent, h, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  EditPen,
  Plus,
  Delete,
  Refresh,
  Check,
  CircleCheckFilled,
  Tickets
} from '@element-plus/icons-vue'
import {
  batchUpdateCustomerTagApi,
  getCustomerTagBatchListApi,
  getCustomerTagBatchItemsApi
} from '@/api/business'

const router = useRouter()

const OPERATION_TYPE_OPTIONS = [
  { label: '批量新增', value: 1 },
  { label: '批量替换', value: 2 },
  { label: '批量移除', value: 3 },
  { label: '批量调整等级', value: 4 }
]

const CUSTOMER_LEVEL_OPTIONS = [
  { label: '普通', value: 1 },
  { label: '银卡', value: 2 },
  { label: '金卡', value: 3 },
  { label: '白金', value: 4 },
  { label: '钻石', value: 5 }
]

const getOperationTypeText = (type) => {
  const map = { 1: '批量新增', 2: '批量替换', 3: '批量移除', 4: '批量调整等级' }
  return map[type] || '未知'
}

const getOperationTypeTagType = (type) => {
  const map = { 1: 'success', 2: '', 3: 'warning', 4: 'danger' }
  return map[type] || 'info'
}

const getCustomerLevelText = (level) => {
  const map = { 1: '普通', 2: '银卡', 3: '金卡', 4: '白金', 5: '钻石' }
  return map[level] || '未知'
}

const getCustomerLevelTagType = (level) => {
  const map = { 1: '', 2: 'success', 3: 'warning', 4: '', 5: 'danger' }
  return map[level] || 'info'
}

const getProcessResultText = (result) => {
  const map = { 0: '未处理', 1: '成功', 2: '失败', 3: '越权拦截', 4: '违规拦截' }
  return map[result] || '未知'
}

const getProcessResultTagType = (result) => {
  const map = { 0: 'info', 1: 'success', 2: 'danger', 3: 'warning', 4: '' }
  return map[result] || 'info'
}

const getBatchStatusText = (status) => {
  const map = { 0: '待处理', 1: '处理中', 2: '已完成', 3: '部分完成', 4: '已取消' }
  return map[status] || '未知'
}

const getBatchStatusTagType = (status) => {
  const map = { 0: 'info', 1: 'warning', 2: 'success', 3: '', 4: 'info' }
  return map[status] || 'info'
}

const ResultItemsTable = defineComponent({
  name: 'ResultItemsTable',
  props: {
    items: { type: Array, required: true },
    stripe: Boolean,
    showAll: Boolean
  },
  setup(props) {
    const getResultTagType = (result) => {
      const map = { 1: 'success', 2: 'danger', 3: 'warning', 4: '' }
      return map[result] || 'info'
    }
    const getResultText = (result) => {
      const map = { 0: '未处理', 1: '成功', 2: '失败', 3: '越权拦截', 4: '违规拦截' }
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
                h('th', { style: { width: '140px' } }, '客户编号'),
                h('th', { style: { width: '140px' } }, '客户名称'),
                h('th', { style: { width: '90px' } }, '结果'),
                h('th', {}, '结果描述'),
                h('th', { style: { width: '180px' } }, '拦截信息')
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
                    h('td', item.customerNo || '-'),
                    h('td', item.customerName || '-'),
                    h(
                      'td',
                      h(
                        'el-tag',
                        {
                          type: getResultTagType(item.processResult),
                          size: 'small',
                          effect: item.processResult === 3 || item.processResult === 4 ? 'dark' : 'light',
                          class: item.processResult === 3 || item.processResult === 4 ? 'block-tag' : ''
                        },
                        () => item.processResultText || getResultText(item.processResult)
                      )
                    ),
                    h('td', {
                      style: {
                        color:
                          item.processResult === 1 ? '#67c23a'
                          : item.processResult === 2 ? '#f56c6c'
                          : item.processResult === 3 ? '#e6a23c'
                          : item.processResult === 4 ? '#9333ea'
                          : '#909399'
                      },
                      innerText: item.processMessage || ''
                    }),
                    h('td', [
                      item.processResult === 3 || item.processResult === 4
                        ? h(
                            'div',
                            { style: { color: item.processResult === 3 ? '#e6a23c' : '#9333ea' } },
                            [
                              h('span', { style: { fontSize: '12px' } }, item.processResult === 3 ? '越权拦截：' : '违规拦截：'),
                              h('span', { style: { fontSize: '12px' } }, item.blockReason || '差异化审核')
                            ]
                          )
                        : h('span', { style: { color: '#c0c4cc', fontSize: '12px' } }, '-')
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

const createManualRow = () => ({
  customer_no: '',
  customer_name: '',
  current_level: undefined,
  current_tags: ''
})

const batchForm = reactive({
  batchName: '',
  operationType: 1,
  targetTagCode: '',
  targetTagName: '',
  targetLevel: undefined,
  filterLevel: undefined,
  filterTagCode: ''
})

const manualRows = ref([createManualRow(), createManualRow(), createManualRow()])
const rowErrors = ref({})

const submitLoading = ref(false)
const updateResult = ref(null)
const resultTab = ref('all')

const isBlockRow = (row) => {
  if (batchForm.operationType === 4 && row.current_level && row.current_level >= 4 && batchForm.targetLevel && batchForm.targetLevel < row.current_level) return true
  return false
}

const hasMissingInfo = (row) => {
  if (!row.customer_name) return true
  return false
}

const blockCount = computed(() => manualRows.value.filter(r => isBlockRow(r)).length)

const canSubmit = computed(() => {
  if (submitLoading.value) return false
  return manualRows.value.some(r => r.customer_name.trim() || r.customer_no.trim())
})

const addManualRow = () => {
  manualRows.value.push(createManualRow())
}

const removeManualRow = (index) => {
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

const validateManualRows = () => {
  rowErrors.value = {}
  let hasError = false

  manualRows.value.forEach((row, idx) => {
    const errors = []
    if (!row.customer_name.trim()) {
      errors.push('customer_name')
    }
    if (errors.length > 0) {
      rowErrors.value[idx] = errors
      hasError = true
    }
  })

  if (hasError) {
    ElMessage.warning('存在必填项未填写，请检查红色标记的单元格')
    return false
  }
  return true
}

const handleSubmit = async () => {
  const hasData = manualRows.value.some(r => r.customer_name.trim() || r.customer_no.trim())
  if (!hasData) {
    ElMessage.warning('请先录入要操作的数据')
    return
  }
  if (!validateManualRows()) return

  try {
    await ElMessageBox.confirm(
      `确认提交 ${manualRows.value.filter(r => r.customer_name.trim()).length} 条${getOperationTypeText(batchForm.operationType)}记录？等级降级等操作将进入差异化审核流程`,
      '确认提交',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }

  submitLoading.value = true
  updateResult.value = null
  try {
    const items = manualRows.value
      .filter(r => r.customer_name.trim() || r.customer_no.trim())
      .map((r, idx) => ({
        row_index: idx + 1,
        customer_no: r.customer_no || undefined,
        customer_name: r.customer_name || undefined,
        current_level: r.current_level,
        current_tags: r.current_tags || undefined
      }))

    const reqData = {
      batch_name: batchForm.batchName || `标签批量操作-${new Date().toLocaleString()}`,
      operation_type: batchForm.operationType,
      target_tag_code: batchForm.operationType === 1 || batchForm.operationType === 2 ? batchForm.targetTagCode || undefined : undefined,
      target_tag_name: batchForm.operationType === 1 || batchForm.operationType === 2 ? batchForm.targetTagName || undefined : undefined,
      target_level: batchForm.operationType === 4 ? batchForm.targetLevel : undefined,
      filter_level: batchForm.filterLevel || undefined,
      filter_tag_code: batchForm.filterTagCode || undefined,
      items
    }

    const res = await batchUpdateCustomerTagApi(reqData)
    updateResult.value = transformKeys(res.data)

    const type =
      updateResult.value.failCount === 0 && updateResult.value.unauthorizedCount === 0 && updateResult.value.violationCount === 0
        ? 'success'
        : updateResult.value.successCount === 0
        ? 'error'
        : 'warning'
    ElMessage[type](
      `操作完成：成功${updateResult.value.successCount}条，失败${updateResult.value.failCount}条，越权拦截${updateResult.value.unauthorizedCount}条，违规拦截${updateResult.value.violationCount}条`
    )

    await fetchHistoryList()
  } catch (_e) {
  } finally {
    submitLoading.value = false
  }
}

const transformKeys = (obj) => {
  if (!obj) return obj
  if (Array.isArray(obj)) return obj.map(transformKeys)
  if (typeof obj === 'object') {
    const result = {}
    for (const key of Object.keys(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, l) => l.toUpperCase())
      result[camelKey] = transformKeys(obj[key])
    }
    return result
  }
  return obj
}

const failedItems = computed(() => updateResult.value?.items.filter(i => i.processResult === 2) || [])
const unauthorizedItems = computed(() => updateResult.value?.items.filter(i => i.processResult === 3) || [])
const violationItems = computed(() => updateResult.value?.items.filter(i => i.processResult === 4) || [])

const resetAll = () => {
  batchForm.batchName = ''
  batchForm.operationType = 1
  batchForm.targetTagCode = ''
  batchForm.targetTagName = ''
  batchForm.targetLevel = undefined
  batchForm.filterLevel = undefined
  batchForm.filterTagCode = ''
  manualRows.value = [createManualRow(), createManualRow(), createManualRow()]
  updateResult.value = null
  rowErrors.value = {}
  resultTab.value = 'all'
}

const goBack = () => {
  router.push('/business/customer-tag')
}

const getManualRowClass = ({ rowIndex }) => {
  return rowIndex % 2 === 1 ? 'stripe-row' : ''
}

const historyLoading = ref(false)
const historyData = ref([])
const historyTotal = ref(0)
const historyPage = reactive({ page: 1, pageSize: 10 })

const fetchHistoryList = async () => {
  historyLoading.value = true
  try {
    const res = await getCustomerTagBatchListApi({
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
const currentBatchDetail = ref(null)
const detailLoading = ref(false)
const detailItems = ref([])
const detailTotal = ref(0)
const detailKeyword = ref('')
const detailPage = reactive({ page: 1, pageSize: 10 })

const viewBatchDetail = async (row) => {
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
    const res = await getCustomerTagBatchItemsApi({
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
.ccb-customer-tag-batch {
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

      &.stat-success {
        background: linear-gradient(135deg, #f0f9eb, #e1f3d8);
        .stat-num { color: #67c23a; }
      }

      &.stat-fail {
        background: linear-gradient(135deg, #fef0f0, #fde2e2);
        .stat-num { color: #f56c6c; }
      }

      &.stat-unauthorized {
        background: linear-gradient(135deg, #fdf6ec, #faecd8);
        .stat-num { color: #e6a23c; }
      }

      &.stat-violation {
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
        background: #fff7e6 !important;
      }

      .result-4 {
        background: #f4e8ff !important;
      }
    }

    :deep(.block-tag) {
      animation: pulseRed 1.5s infinite;
    }
  }

  .mini-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .block-reason-text {
    color: #f56c6c;
    font-weight: 500;
  }

  :deep(.result-block-tag) {
    border: 2px solid #f56c6c !important;
    animation: pulseRed 1.5s infinite;
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

@keyframes pulseRed {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.4); }
  50% { box-shadow: 0 0 0 4px rgba(245, 108, 108, 0.1); }
}
</style>
