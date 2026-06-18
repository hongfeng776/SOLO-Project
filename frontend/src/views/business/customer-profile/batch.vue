<template>
  <div class="ccb-customer-profile-batch">
    <CcbPageHeader
      title="批量建档导入"
      description="批量导入个人客户基础信息，支持差异化信息完善校验与局部刷新"
      icon="Files"
    >
      <template #extra>
        <el-button :icon="ArrowLeft" @click="goBack">
          返回建档列表
        </el-button>
      </template>
    </CcbPageHeader>

    <el-card class="batch-upload-card">
      <template #header>
        <div class="card-header">
          <el-icon :size="18" color="#409eff"><UploadFilled /></el-icon>
          <span class="header-title">数据导入</span>
          <el-tag v-if="currentBatch" type="primary" effect="plain" size="small">
            当前批次：{{ currentBatch.batchNo }}
          </el-tag>
        </div>
      </template>

      <el-row :gutter="24">
        <el-col :span="12">
          <el-form label-width="100px">
            <el-form-item label="批次名称">
              <el-input v-model="batchForm.batchName" placeholder="请输入批次名称" maxlength="50" />
            </el-form-item>
            <el-form-item label="归属机构">
              <el-input v-model="batchForm.orgName" placeholder="当前机构" disabled />
            </el-form-item>
          </el-form>
        </el-col>
        <el-col :span="12">
          <el-form label-width="100px">
            <el-form-item label="上传文件">
              <el-upload
                class="upload-dragger"
                drag
                :auto-upload="false"
                :show-file-list="true"
                :limit="1"
                accept=".xlsx,.xls,.csv"
                :on-change="handleFileChange"
                :on-remove="handleFileRemove"
              >
                <el-icon class="el-icon--upload" :size="40"><UploadFilled /></el-icon>
                <div class="el-upload__text">
                  将Excel/CSV文件拖到此处，或<em>点击上传</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    仅支持xlsx/xls/csv格式，单次导入不超过500条，
                    <el-link type="primary" :underline="false" @click="downloadTemplate">
                      下载导入模板
                    </el-link>
                  </div>
                </template>
              </el-upload>
            </el-form-item>
          </el-form>
        </el-col>
      </el-row>

      <el-divider content-position="left">
        <span>
          <el-icon :size="16"><EditPen /></el-icon>
          或手动录入数据
        </span>
      </el-divider>

      <div class="manual-input-area">
        <el-table
          :data="manualRows"
          border
          stripe
          :row-class-name="getManualRowClass"
          class="manual-input-table"
        >
          <el-table-column label="序号" type="index" width="60" align="center" />
          <el-table-column label="客户姓名" width="120">
            <template #default="{ row, $index }">
              <el-input
                v-model="row.customerName"
                size="small"
                placeholder="必填"
                :class="{ 'cell-error': checkRowError($index, 'customerName') }"
              />
            </template>
          </el-table-column>
          <el-table-column label="证件号码" width="180">
            <template #default="{ row, $index }">
              <el-input
                v-model="row.idCardNo"
                size="small"
                placeholder="必填，18位身份证号"
                maxlength="18"
                :class="{ 'cell-error': checkRowError($index, 'idCardNo') }"
              />
            </template>
          </el-table-column>
          <el-table-column label="性别" width="80">
            <template #default="{ row }">
              <el-select v-model="row.gender" size="small" placeholder="性别">
                <el-option label="男" value="M" />
                <el-option label="女" value="F" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="手机号" width="140">
            <template #default="{ row, $index }">
              <el-input
                v-model="row.mobile"
                size="small"
                placeholder="必填"
                maxlength="11"
                :class="{ 'cell-error': checkRowError($index, 'mobile') }"
              />
            </template>
          </el-table-column>
          <el-table-column label="户籍地址" min-width="160">
            <template #default="{ row, $index }">
              <el-input
                v-model="row.registeredAddress"
                size="small"
                placeholder="高资产客户必填"
                :class="{ 'cell-warning': checkRowWarning($index, 'registeredAddress') }"
              />
            </template>
          </el-table-column>
          <el-table-column label="居住地址" min-width="160">
            <template #default="{ row, $index }">
              <el-input
                v-model="row.residentialAddress"
                size="small"
                placeholder="高资产客户必填"
                :class="{ 'cell-warning': checkRowWarning($index, 'residentialAddress') }"
              />
            </template>
          </el-table-column>
          <el-table-column label="职业" width="120">
            <template #default="{ row, $index }">
              <el-input
                v-model="row.occupation"
                size="small"
                placeholder="高资产客户必填"
                :class="{ 'cell-warning': checkRowWarning($index, 'occupation') }"
              />
            </template>
          </el-table-column>
          <el-table-column label="工作单位" width="150">
            <template #default="{ row }">
              <el-input v-model="row.employer" size="small" placeholder="选填" />
            </template>
          </el-table-column>
          <el-table-column label="资产规模(元)" width="150">
            <template #default="{ row }">
              <el-input-number
                v-model="row.totalAssets"
                size="small"
                :min="0"
                :precision="2"
                controls-position="right"
                style="width: 100%"
                @change="onAssetChange(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="月交易数" width="110">
            <template #default="{ row }">
              <el-input-number
                v-model="row.monthlyTransactionCount"
                size="small"
                :min="0"
                :max="9999"
                controls-position="right"
                style="width: 100%"
              />
            </template>
          </el-table-column>
          <el-table-column label="留存天数" width="110">
            <template #default="{ row }">
              <el-input-number
                v-model="row.retentionDays"
                size="small"
                :min="0"
                :max="99999"
                controls-position="right"
                style="width: 100%"
              />
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
          <el-button type="primary" plain :icon="Plus" @click="addManualRow">
            添加一行
          </el-button>
          <el-button type="danger" plain :icon="Delete" @click="clearManualRows">
            清空全部
          </el-button>
          <span class="row-count-text">共 {{ manualRows.length }} 条数据</span>
        </div>
      </div>

      <div class="submit-area">
        <el-button @click="goBack">取消</el-button>
        <el-button type="warning" :icon="Refresh" @click="resetAll">
          重置
        </el-button>
        <el-button type="primary" :icon="Check" :loading="submitLoading" @click="handleBatchImport">
          开始批量导入
        </el-button>
      </div>
    </el-card>

    <el-card v-if="importResult" class="result-card">
      <template #header>
        <div class="result-header">
          <el-icon :size="18" color="#67c23a"><CircleCheckFilled /></el-icon>
          <span class="header-title">导入结果</span>
          <el-tag :type="getBatchStatusTagType(importResult.status)" effect="light">
            {{ importResult.statusText }}
          </el-tag>
          <el-tag type="info" effect="plain" size="small">
            批次号：{{ importResult.batchNo }}
          </el-tag>
        </div>
      </template>

      <el-row :gutter="20" class="result-stats">
        <el-col :span="4">
          <div class="stat-box stat-total">
            <div class="stat-num">{{ importResult.totalCount }}</div>
            <div class="stat-label">总计</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-box stat-success">
            <div class="stat-num">{{ importResult.successCount }}</div>
            <div class="stat-label">成功</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-box stat-fail">
            <div class="stat-num">{{ importResult.failCount }}</div>
            <div class="stat-label">失败</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-box stat-warning">
            <div class="stat-num">{{ importResult.needCompleteCount }}</div>
            <div class="stat-label">待完善</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-box stat-danger">
            <div class="stat-num">{{ importResult.abnormalCount }}</div>
            <div class="stat-label">待复核</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-box stat-refresh">
            <el-button type="primary" :icon="RefreshRight" @click="refreshCustomerList">
              局部刷新客户列表
            </el-button>
            <div class="stat-label">同步刷新</div>
          </div>
        </el-col>
      </el-row>

      <el-divider />

      <el-tabs v-model="resultTab" class="result-tabs">
        <el-tab-pane label="全部" name="all">
          <ResultItemsTable
            :items="importResult.items"
            :show-all="true"
            :stripe="true"
          />
        </el-tab-pane>
        <el-tab-pane
          label="失败记录"
          name="fail"
          :disabled="importResult.failCount === 0"
        >
          <ResultItemsTable
            :items="importResult.items.filter(i => i.processResult === 2)"
            :stripe="true"
          />
        </el-tab-pane>
        <el-tab-pane
          label="待完善记录"
          name="need"
          :disabled="importResult.needCompleteCount === 0"
        >
          <ResultItemsTable
            :items="importResult.items.filter(i => i.processResult === 3)"
            :stripe="true"
          />
        </el-tab-pane>
        <el-tab-pane
          label="异常待复核"
          name="abnormal"
          :disabled="importResult.abnormalCount === 0"
        >
          <ResultItemsTable
            :items="importResult.items.filter(i => i.processResult === 4)"
            :stripe="true"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-card class="history-card">
      <template #header>
        <div class="card-header">
          <el-icon :size="18" color="#e6a23c"><Tickets /></el-icon>
          <span class="header-title">历史批次</span>
        </div>
      </template>

      <div v-if="historyLoading" class="skeleton-wrapper">
        <el-skeleton :rows="5" animated>
          <template #template>
            <el-skeleton-table :rows="5" :columns="6" animated />
          </template>
        </el-skeleton>
      </div>

      <CcbTable
        v-else
        v-model:page="historyPage.page"
        v-model:pageSize="historyPage.pageSize"
        :loading="historyLoading"
        :data="historyData"
        :total="historyTotal"
        :stripe="true"
        @change="fetchHistoryList"
      >
        <el-table-column prop="batchNo" label="批次号" width="220" />
        <el-table-column prop="batchName" label="批次名称" width="180" show-overflow-tooltip />
        <el-table-column prop="orgName" label="归属机构" width="150" />
        <el-table-column label="数量统计" width="260">
          <template #default="{ row }">
            <div class="mini-stats">
              <el-tag size="small" type="success" effect="plain">成功 {{ row.successCount }}</el-tag>
              <el-tag size="small" type="danger" effect="plain">失败 {{ row.failCount }}</el-tag>
              <el-tag size="small" type="warning" effect="plain">待完善 {{ row.needCompleteCount }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="statusText" label="批次状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getBatchStatusTagType(row.status)" effect="light" size="small">
              {{ row.statusText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creatorName" label="导入人" width="90" />
        <el-table-column prop="importTime" label="导入时间" width="160" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewBatchDetail(row)">
              查看明细
            </el-button>
            <el-button type="success" link size="small" @click="goToComplete(row)">
              处理待完善
            </el-button>
          </template>
        </el-table-column>
      </CcbTable>
    </el-card>

    <el-dialog v-model="batchDetailVisible" title="批次明细" width="1000px">
      <div v-if="currentBatchDetail">
        <el-descriptions :column="3" border size="small" style="margin-bottom: 16px">
          <el-descriptions-item label="批次号">{{ currentBatchDetail.batchNo }}</el-descriptions-item>
          <el-descriptions-item label="批次名称">{{ currentBatchDetail.batchName }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getBatchStatusTagType(currentBatchDetail.status)" size="small">
              {{ currentBatchDetail.statusText }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="总数">{{ currentBatchDetail.totalCount }}</el-descriptions-item>
          <el-descriptions-item label="成功">{{ currentBatchDetail.successCount }}</el-descriptions-item>
          <el-descriptions-item label="失败">{{ currentBatchDetail.failCount }}</el-descriptions-item>
        </el-descriptions>
        <el-input
          v-model="detailKeyword"
          placeholder="搜索客户姓名/证件号/手机号"
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
          <el-table-column prop="customerName" label="客户姓名" width="100" />
          <el-table-column prop="idCardNo" label="证件号码" width="180">
            <template #default="{ row }">
              {{ maskIdCard(row.idCardNo) }}
            </template>
          </el-table-column>
          <el-table-column prop="mobile" label="手机号" width="120">
            <template #default="{ row }">
              {{ maskPhone(row.mobile) }}
            </template>
          </el-table-column>
          <el-table-column prop="totalAssets" label="资产规模" width="120" align="right">
            <template #default="{ row }">
              {{ formatMoney(row.totalAssets) }}
            </template>
          </el-table-column>
          <el-table-column prop="processResultText" label="结果" width="90">
            <template #default="{ row }">
              <el-tag :type="getProcessResultTagType(row.processResult)" size="small" effect="light">
                {{ row.processResultText }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="processMessage" label="结果描述" min-width="180" show-overflow-tooltip />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.profileId"
                type="primary"
                link
                size="small"
                @click="goToProfile(row.profileId)"
              >
                查看档案
              </el-button>
            </template>
          </el-table-column>
        </CcbTable>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, defineComponent, h } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  UploadFilled,
  EditPen,
  Plus,
  Delete,
  Refresh,
  Check,
  CircleCheckFilled,
  Tickets,
  RefreshRight
} from '@element-plus/icons-vue'
import {
  batchImportCustomerProfileApi,
  getCustomerProfileBatchListApi,
  getCustomerProfileBatchItemsApi,
  type BatchImportResponse,
  type BatchImportResultItem,
  type BatchVO,
  type BatchItemVO
} from '@api/business'
import { maskIdCard, maskPhone, formatMoney } from '@utils'

const router = useRouter()

const ResultItemsTable = defineComponent({
  name: 'ResultItemsTable',
  props: {
    items: { type: Array as () => BatchImportResultItem[], required: true },
    stripe: Boolean,
    showAll: Boolean
  },
  setup(props) {
    const getProcessResultTagType = (result: number) => {
      const map: Record<number, string> = { 1: 'success', 2: 'danger', 3: 'warning', 4: 'info' }
      return map[result] || 'info'
    }
    return () =>
      h('div', { class: 'result-items-wrapper' }, [
        h(
          'table',
          {
            class: 'result-items-table',
            style: { width: '100%', borderCollapse: 'collapse' }
          },
          [
            h('thead', [
              h('tr', [
                h('th', { style: { width: '60px' } }, '行号'),
                h('th', { style: { width: '100px' } }, '客户姓名'),
                h('th', { style: { width: '180px' } }, '证件号码'),
                h('th', { style: { width: '90px' } }, '处理结果'),
                h('th', {}, '结果描述'),
                h('th', { style: { width: '240px' } }, '缺失/错误信息')
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
                    h('td', item.rowIndex),
                    h('td', item.customerName || '-'),
                    h('td', maskIdCard(item.idCardNo || '')),
                    h(
                      'td',
                      h(
                        'el-tag',
                        {
                          type: getProcessResultTagType(item.processResult),
                          size: 'small',
                          effect: 'light'
                        },
                        () => item.processResultText || '未知'
                      )
                    ),
                    h('td', {
                      style: {
                        color:
                          item.processResult === 1
                            ? '#67c23a'
                            : item.processResult === 2
                            ? '#f56c6c'
                            : '#e6a23c'
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
                                h(
                                  'el-tag',
                                  {
                                    type: 'warning',
                                    size: 'small',
                                    effect: 'dark',
                                    style: 'margin-left:4px'
                                  },
                                  () => f
                                )
                              )
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
                                h(
                                  'el-tag',
                                  {
                                    type: 'danger',
                                    size: 'small',
                                    effect: 'dark',
                                    style: 'margin-left:4px'
                                  },
                                  () => e.message
                                )
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
  customerName: string
  idCardNo: string
  gender: string
  mobile: string
  registeredAddress: string
  residentialAddress: string
  occupation: string
  employer: string
  totalAssets: number
  monthlyTransactionCount: number
  retentionDays: number
}

const createManualRow = (): ManualRow => ({
  customerName: '',
  idCardNo: '',
  gender: 'M',
  mobile: '',
  registeredAddress: '',
  residentialAddress: '',
  occupation: '',
  employer: '',
  totalAssets: 0,
  monthlyTransactionCount: 0,
  retentionDays: 0
})

const submitLoading = ref<boolean>(false)
const importResult = ref<BatchImportResponse | null>(null)
const resultTab = ref<string>('all')
const currentBatch = ref<BatchVO | null>(null)
const rowErrors = ref<Record<string, string[]>>({})
const rowWarnings = ref<Record<string, string[]>>({})

const batchForm = reactive({
  batchName: '',
  orgName: '上海分行浦东支行'
})

const manualRows = ref<ManualRow[]>([createManualRow(), createManualRow(), createManualRow()])

const addManualRow = (): void => {
  manualRows.value.push(createManualRow())
}
const removeManualRow = (index: number): void => {
  manualRows.value.splice(index, 1)
  rowErrors.value = {}
  rowWarnings.value = {}
}
const clearManualRows = (): void => {
  ElMessageBox.confirm('确定要清空所有手动录入的数据吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      manualRows.value = [createManualRow()]
      rowErrors.value = {}
      rowWarnings.value = {}
      ElMessage.success('已清空')
    })
    .catch(() => {})
}

const onAssetChange = (row: ManualRow): void => {
  const idx = manualRows.value.indexOf(row)
  if (Number(row.totalAssets) >= 100000) {
    const warnings: string[] = []
    if (!row.registeredAddress) warnings.push('registeredAddress')
    if (!row.residentialAddress) warnings.push('residentialAddress')
    if (!row.occupation) warnings.push('occupation')
    if (warnings.length > 0) {
      rowWarnings.value[String(idx)] = warnings
    } else {
      delete rowWarnings.value[String(idx)]
    }
  } else {
    delete rowWarnings.value[String(idx)]
  }
}

const checkRowError = (idx: number, field: string): boolean => {
  const key = `${idx}-${field}`
  return !!rowErrors.value[key]
}
const checkRowWarning = (idx: number, field: string): boolean => {
  const warns = rowWarnings.value[String(idx)]
  return !!warns && warns.includes(field)
}

const validateManualRows = (): boolean => {
  rowErrors.value = {}
  let hasError = false

  manualRows.value.forEach((row, idx) => {
    const errors: string[] = []
    if (!row.customerName.trim()) {
      errors.push('customerName')
    }
    if (!row.idCardNo.trim()) {
      errors.push('idCardNo')
    } else if (!/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(row.idCardNo)) {
      errors.push('idCardNo')
    }
    if (!row.mobile.trim()) {
      errors.push('mobile')
    } else if (!/^1[3-9]\d{9}$/.test(row.mobile)) {
      errors.push('mobile')
    }
    errors.forEach(f => {
      rowErrors.value[`${idx}-${f}`] = ['校验失败']
    })
    if (errors.length > 0) hasError = true
  })

  if (hasError) {
    ElMessage.warning('存在必填项未填写或格式不正确，请检查红色标记的单元格')
    return false
  }
  return true
}

const handleFileChange = (_file: any): void => {}
const handleFileRemove = (): void => {}
const downloadTemplate = (): void => {
  ElMessage.success('模板下载任务已提交')
}

const handleBatchImport = async (): Promise<void> => {
  const hasData = manualRows.value.some(r => r.customerName.trim() || r.idCardNo.trim() || r.mobile.trim())
  if (!hasData) {
    ElMessage.warning('请先录入或上传要导入的数据')
    return
  }
  if (!validateManualRows()) {
    return
  }

  submitLoading.value = true
  importResult.value = null
  try {
    const items = manualRows.value
      .filter(r => r.customerName.trim() && r.idCardNo.trim() && r.mobile.trim())
      .map((r, idx) => ({
        row_index: idx + 1,
        customer_name: r.customerName,
        id_card_no: r.idCardNo,
        gender: r.gender,
        mobile: r.mobile,
        registered_address: r.registeredAddress,
        residential_address: r.residentialAddress,
        occupation: r.occupation,
        employer: r.employer,
        total_assets: r.totalAssets,
        monthly_transaction_count: r.monthlyTransactionCount,
        retention_days: r.retentionDays
      }))

    const res = await batchImportCustomerProfileApi({
      batch_name: batchForm.batchName || `批量建档-${new Date().toLocaleString()}`,
      items
    })

    importResult.value = transformBatchResult(res.data)
    currentBatch.value = {
      id: importResult.value.batchId,
      batchNo: importResult.value.batchNo,
      batchName: importResult.value.batchName || '',
      totalCount: importResult.value.totalCount,
      successCount: importResult.value.successCount,
      failCount: importResult.value.failCount,
      needCompleteCount: importResult.value.needCompleteCount,
      abnormalCount: importResult.value.abnormalCount,
      status: importResult.value.status,
      statusText: importResult.value.statusText,
      creatorName: '当前用户',
      importTime: new Date().toLocaleString()
    } as BatchVO

    const type =
      importResult.value.failCount === 0
        ? 'success'
        : importResult.value.successCount === 0
        ? 'error'
        : 'warning'
    ElMessage[type](`导入完成：成功${importResult.value.successCount}条，失败${importResult.value.failCount}条`)

    await fetchHistoryList()
  } catch (_e) {
  } finally {
    submitLoading.value = false
  }
}

const transformBatchResult = (data: any): BatchImportResponse => {
  const transformKeys = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(transformKeys)
    if (obj && typeof obj === 'object') {
      const result: any = {}
      for (const key of Object.keys(obj)) {
        const camelKey = key.replace(/_([a-z])/g, (_, l) => l.toUpperCase())
        result[camelKey] = transformKeys(obj[key])
      }
      return result
    }
    return obj
  }
  return transformKeys(data)
}

const transformKeys = (obj: any): any => {
  if (!obj) return obj
  const result: any = {}
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, l) => l.toUpperCase())
    result[camelKey] = obj[key]
  }
  return result
}

const resetAll = (): void => {
  batchForm.batchName = ''
  manualRows.value = [createManualRow(), createManualRow(), createManualRow()]
  importResult.value = null
  rowErrors.value = {}
  rowWarnings.value = {}
}

const refreshCustomerList = (): void => {
  ElMessage.success('客户列表局部刷新成功')
}

const goBack = (): void => {
  router.push('/business/customer-profile')
}

const historyLoading = ref<boolean>(false)
const historyData = ref<BatchVO[]>([])
const historyTotal = ref<number>(0)
const historyPage = reactive({ page: 1, pageSize: 10 })

const fetchHistoryList = async (): Promise<void> => {
  historyLoading.value = true
  try {
    const res = await getCustomerProfileBatchListApi({
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

const batchDetailVisible = ref<boolean>(false)
const currentBatchDetail = ref<BatchVO | null>(null)
const detailLoading = ref<boolean>(false)
const detailItems = ref<BatchItemVO[]>([])
const detailTotal = ref<number>(0)
const detailKeyword = ref<string>('')
const detailPage = reactive({ page: 1, pageSize: 10 })

const viewBatchDetail = async (row: BatchVO): Promise<void> => {
  currentBatchDetail.value = row
  detailKeyword.value = ''
  detailPage.page = 1
  batchDetailVisible.value = true
  await fetchBatchItems()
}

const fetchBatchItems = async (): Promise<void> => {
  if (!currentBatchDetail.value) return
  detailLoading.value = true
  try {
    const res = await getCustomerProfileBatchItemsApi({
      page: detailPage.page,
      pageSize: detailPage.pageSize,
      batch_id: currentBatchDetail.value.id,
      keyword: detailKeyword.value || undefined
    })
    detailItems.value = res.data.list.map(transformKeys)
    detailTotal.value = res.data.total
  } catch (_e) {
  } finally {
    detailLoading.value = false
  }
}

const goToProfile = (profileId: string): void => {
  router.push(`/business/customer-profile?id=${profileId}`)
}

const goToComplete = (_row: BatchVO): void => {
  ElMessage.info('跳转到待完善处理页面')
}

const getBatchStatusTagType = (status: number): string => {
  const map: Record<number, string> = { 0: 'info', 1: 'warning', 2: 'success', 3: '', 4: 'info' }
  return map[status] || 'info'
}

const getProcessResultTagType = (result: number): string => {
  const map: Record<number, string> = { 0: 'info', 1: 'success', 2: 'danger', 3: 'warning', 4: 'info' }
  return map[result] || 'info'
}

const getManualRowClass = ({ rowIndex }: { rowIndex: number }): string => {
  return rowIndex % 2 === 1 ? 'stripe-row' : ''
}

onMounted(() => {
  fetchHistoryList()
})
</script>

<style lang="scss" scoped>
.ccb-customer-profile-batch {
  .batch-upload-card,
  .result-card,
  .history-card {
    margin-bottom: 16px;

    .card-header,
    .result-header {
      display: flex;
      align-items: center;
      gap: 8px;

      .header-title {
        font-size: 15px;
        font-weight: 600;
        color: #303133;
      }
    }
  }

  .manual-input-area {
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

      .cell-warning {
        :deep(.el-input__wrapper) {
          box-shadow: 0 0 0 1px #e6a23c inset !important;
          background-color: #fdf6ec !important;
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
    margin-bottom: 16px;

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
        .stat-num {
          color: #409eff;
        }
      }
      &.stat-success {
        background: linear-gradient(135deg, #f0f9eb, #e1f3d8);
        .stat-num {
          color: #67c23a;
        }
      }
      &.stat-fail {
        background: linear-gradient(135deg, #fef0f0, #fde2e2);
        .stat-num {
          color: #f56c6c;
        }
      }
      &.stat-warning {
        background: linear-gradient(135deg, #fdf6ec, #faecd8);
        .stat-num {
          color: #e6a23c;
        }
      }
      &.stat-danger {
        background: linear-gradient(135deg, #fef0f0, #fab6b6);
        .stat-num {
          color: #c0392b;
        }
      }
      &.stat-refresh {
        background: #fff;
        border: 1px dashed #409eff;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
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
        background: #fff8e6 !important;
      }
    }
  }

  .mini-stats {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .skeleton-wrapper {
    padding: 10px;
  }
}

@keyframes shakeLight {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}
</style>
