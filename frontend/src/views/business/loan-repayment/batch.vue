<template>
  <div class="ccb-batch-withhold">
    <CcbPageHeader
      title="批量代扣管理"
      description="差异化代扣策略，逾期优先处理，结果局部刷新"
      icon="Files"
    />

    <div class="withhold-stats">
      <el-row :gutter="16">
        <el-col :span="4">
          <div class="stat-card total">
            <div class="stat-icon"><el-icon><List /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">{{ totalCount }}</div>
              <div class="stat-label">待代扣总数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card normal">
            <div class="stat-icon"><el-icon><User /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">{{ normalCount }}</div>
              <div class="stat-label">正常客户</div>
            </div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card overdue">
            <div class="stat-icon"><el-icon><Warning /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">{{ overdueCount }}</div>
              <div class="stat-label">逾期客户</div>
            </div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card amount">
            <div class="stat-icon"><el-icon><Money /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">{{ formatCurrency(totalAmount, 0) }}</div>
              <div class="stat-label">代扣总金额</div>
            </div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card selected">
            <div class="stat-icon"><el-icon><Checked /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">{{ selectedCount }}</div>
              <div class="stat-label">已选择</div>
            </div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card selected-amount">
            <div class="stat-icon"><el-icon><Wallet /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">{{ formatCurrency(selectedAmount, 0) }}</div>
              <div class="stat-label">选择金额</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-card class="list-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>代扣列表</span>
          <div class="header-actions">
            <el-button size="small" :icon="Refresh" @click="loadList">刷新</el-button>
            <el-button
              type="warning"
              size="small"
              :icon="Promotion"
              @click="selectOverdueFirst"
            >
              逾期优先
            </el-button>
            <el-button
              type="primary"
              size="small"
              :icon="Checked"
              @click="selectAll"
              :disabled="withholding"
            >
              全选可代扣
            </el-button>
            <el-button
              type="success"
              size="small"
              :icon="VideoPlay"
              @click="executeBatchWithhold"
              :disabled="selectedCount === 0 || withholding"
              :loading="withholding"
            >
              执行批量代扣
            </el-button>
          </div>
        </div>
      </template>

      <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
        <el-form-item label="贷款编号" prop="loan_no">
          <el-input v-model="searchForm.loan_no" placeholder="请输入贷款编号" clearable />
        </el-form-item>
        <el-form-item label="客户姓名" prop="customer_name">
          <el-input v-model="searchForm.customer_name" placeholder="请输入客户姓名" clearable />
        </el-form-item>
        <el-form-item label="贷款类型" prop="loan_type">
          <el-select v-model="searchForm.loan_type" placeholder="请选择" clearable>
            <el-option v-for="item in LOAN_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="代扣状态" prop="status">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option v-for="item in WITHHOLD_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否逾期" prop="is_overdue">
          <el-select v-model="searchForm.is_overdue" placeholder="请选择" clearable>
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="repayment_priority">
          <el-select v-model="searchForm.repayment_priority" placeholder="请选择" clearable>
            <el-option label="正常(1级)" :value="1" />
            <el-option label="较高(3级)" :value="3" />
            <el-option label="逾期(5级)" :value="5" />
          </el-select>
        </el-form-item>
      </CcbSearchForm>

      <CcbTable
        v-model:page="pageParams.page"
        v-model:pageSize="pageParams.pageSize"
        :loading="loading"
        :data="tableData"
        :total="total"
        :show-selection="true"
        :show-index="true"
        row-class-name="withhold-row"
        @selection-change="handleSelectionChange"
        @change="handlePageChange"
      >
        <el-table-column type="selection" width="50" :selectable="checkSelectable" />
        <el-table-column prop="loan_no" label="贷款编号" width="160" fixed="left" />
        <el-table-column prop="customer_name" label="客户姓名" width="100" />
        <el-table-column prop="loan_type_text" label="贷款类型" width="100" />
        <el-table-column prop="period_no" label="期数" width="80" align="center">
          <template #default="{ row }">第{{ row.period_no }}期</template>
        </el-table-column>
        <el-table-column prop="due_date" label="应还日期" width="110" />
        <el-table-column prop="due_amount" label="应还金额" width="120" align="right">
          <template #default="{ row }">
            <span class="amount-number">{{ formatThousands(row.due_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="overdue_days" label="逾期天数" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.overdue_days > 0" type="danger" size="small" effect="dark">
              {{ row.overdue_days }}天
            </el-tag>
            <span v-else class="normal-text">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="repayment_priority" label="优先级" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.repayment_priority >= 5" type="danger" size="small">最高</el-tag>
            <el-tag v-else-if="row.repayment_priority >= 3" type="warning" size="small">较高</el-tag>
            <el-tag v-else type="info" size="small">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="account_no" label="扣款账户" width="160" />
        <el-table-column prop="account_balance" label="账户余额" width="120" align="right">
          <template #default="{ row }">
            <span :class="{ 'insufficient': !row.balance_sufficient }">
              {{ formatThousands(row.account_balance) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="balance_sufficient" label="余额充足" width="90" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.balance_sufficient" class="icon-success"><CircleCheck /></el-icon>
            <el-icon v-else class="icon-error"><CircleClose /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="status_text" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getWithholdStatusType(row.status)" size="small">
              {{ row.status_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.can_withhold"
              type="primary"
              link
              size="small"
              :disabled="withholding"
              @click="singleWithhold(row)"
            >
              立即代扣
            </el-button>
            <el-tooltip v-else :content="row.cannot_reason">
              <el-button type="info" link size="small" disabled>无法代扣</el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </CcbTable>
    </el-card>

    <el-dialog v-model="resultDialogVisible" title="批量代扣结果" width="700px" class="result-dialog">
      <div class="result-summary">
        <el-row :gutter="16">
          <el-col :span="8">
            <div class="summary-item total">
              <div class="label">处理总数</div>
              <div class="value">{{ batchResult?.total_count || 0 }}</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="summary-item success">
              <div class="label">成功</div>
              <div class="value">{{ batchResult?.success_count || 0 }}</div>
              <div class="sub-value">{{ formatCurrency(batchResult?.total_success_amount || 0) }}元</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="summary-item fail">
              <div class="label">失败</div>
              <div class="value">{{ batchResult?.fail_count || 0 }}</div>
              <div class="sub-value">{{ formatCurrency(batchResult?.total_fail_amount || 0) }}元</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="全部结果" name="all">
          <el-table :data="batchResult?.details || []" size="small" border max-height="300">
            <el-table-column prop="loan_no" label="贷款编号" width="160" />
            <el-table-column prop="customer_name" label="客户姓名" width="100" />
            <el-table-column prop="due_amount" label="应还金额" width="110" align="right">
              <template #default="{ row }">{{ formatThousands(row.due_amount) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.success ? 'success' : 'danger'" size="small">
                  {{ row.success ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="message" label="结果说明" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane :label="`异常清单 (${batchResult?.abnormal_list?.length || 0})`" name="abnormal">
          <el-table :data="batchResult?.abnormal_list || []" size="small" border max-height="300">
            <el-table-column prop="loan_no" label="贷款编号" width="160" />
            <el-table-column prop="customer_name" label="客户姓名" width="100" />
            <el-table-column prop="due_amount" label="应还金额" width="110" align="right">
              <template #default="{ row }">{{ formatThousands(row.due_amount) }}</template>
            </el-table-column>
            <el-table-column prop="abnormal_type" label="异常类型" width="140">
              <template #default="{ row }">
                <el-tag type="warning" size="small">{{ getAbnormalTypeText(row.abnormal_type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="abnormal_reason" label="异常原因" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="resultDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="refreshAfterBatch">确定并刷新</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  List,
  User,
  Warning,
  Money,
  Checked,
  Wallet,
  Refresh,
  Promotion,
  VideoPlay,
  CircleCheck,
  CircleClose
} from '@element-plus/icons-vue'
import { LOAN_TYPE_OPTIONS } from '@/api/loan'
import {
  getWithholdListApi,
  batchWithholdApi,
  formatThousands,
  formatCurrency,
  getWithholdStatusType,
  WITHHOLD_STATUS_OPTIONS,
  type BatchWithholdItem,
  type BatchWithholdResult,
  type BatchWithholdQueryParams
} from '@/api/loanRepayment'

const loading = ref(false)
const withholding = ref(false)
const tableData = ref<BatchWithholdItem[]>([])
const total = ref(0)
const resultDialogVisible = ref(false)
const activeTab = ref('all')
const batchResult = ref<BatchWithholdResult | null>(null)

const searchForm = reactive<BatchWithholdQueryParams>({
  page: 1,
  pageSize: 10,
  loan_no: '',
  customer_name: '',
  loan_type: undefined,
  status: undefined,
  is_overdue: undefined,
  repayment_priority: undefined
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const totalCount = computed(() => total.value)
const normalCount = computed(() => tableData.value.filter(i => !i.is_overdue).length)
const overdueCount = computed(() => tableData.value.filter(i => i.is_overdue).length)
const totalAmount = computed(() => tableData.value.reduce((sum, i) => sum + i.due_amount, 0))
const selectedList = ref<BatchWithholdItem[]>([])
const selectedCount = computed(() => selectedList.value.length)
const selectedAmount = computed(() => selectedList.value.reduce((sum, i) => sum + i.due_amount, 0))

function checkSelectable(row: BatchWithholdItem) {
  return row.can_withhold
}

function handleSelectionChange(selection: BatchWithholdItem[]) {
  selectedList.value = selection
}

function handleSearch() {
  pageParams.page = 1
  loadList()
}

function handleReset() {
  searchForm.loan_no = ''
  searchForm.customer_name = ''
  searchForm.loan_type = undefined
  searchForm.status = undefined
  searchForm.is_overdue = undefined
  searchForm.repayment_priority = undefined
  pageParams.page = 1
  loadList()
}

function handlePageChange() {
  loadList()
}

async function loadList() {
  loading.value = true
  try {
    const params: BatchWithholdQueryParams = {
      page: pageParams.page,
      pageSize: pageParams.pageSize,
      ...searchForm
    }
    const result: any = await getWithholdListApi(params)
    tableData.value = result.list || result.data?.list || []
    total.value = result.total || result.data?.total || 0
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function selectOverdueFirst() {
  const overdueItems = tableData.value.filter(i => i.is_overdue && i.can_withhold)
  const normalItems = tableData.value.filter(i => !i.is_overdue && i.can_withhold)
  const all = [...overdueItems, ...normalItems]
  selectedList.value = all

  ElMessage.success(`已选中 ${all.length} 条，优先选择逾期客户`)
}

function selectAll() {
  const canWithholdList = tableData.value.filter(i => i.can_withhold)
  selectedList.value = canWithholdList
  ElMessage.success(`已选择 ${canWithholdList.length} 条可代扣记录`)
}

async function singleWithhold(row: BatchWithholdItem) {
  try {
    await ElMessageBox.confirm(
      `确认对 ${row.customer_name} 的贷款 ${row.loan_no} 执行代扣 ${formatThousands(row.due_amount)} 元？`,
      '代扣确认',
      {
        confirmButtonText: '确认代扣',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  withholding.value = true
  try {
    const result = await batchWithholdApi({
      items: [{ loan_id: row.loan_id, due_amount: row.due_amount }]
    })

    if (result.success_count > 0) {
      ElMessage.success('代扣成功')
    } else {
      ElMessage.error(result.details[0]?.message || '代扣失败')
    }

    loadList()
  } catch (e: any) {
    ElMessage.error(e.message || '代扣失败')
  } finally {
    withholding.value = false
  }
}

async function executeBatchWithhold() {
  if (selectedList.value.length === 0) {
    ElMessage.warning('请先选择要代扣的记录')
    return
  }

  const count = selectedList.value.length
  const amount = selectedList.value.reduce((sum, i) => sum + i.due_amount, 0)

  try {
    await ElMessageBox.confirm(
      `确认对 ${count} 笔贷款执行批量代扣，合计金额 ${formatThousands(amount)} 元？`,
      '批量代扣确认',
      {
        confirmButtonText: '确认执行',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true,
        message: `
          <div style="text-align: left; padding: 10px 0;">
            <p><strong>代扣说明：</strong></p>
            <p>1. 系统将按照优先级从高到低依次执行扣款</p>
            <p>2. 逾期客户优先处理，正常客户后处理</p>
            <p>3. 余额不足的账户将跳过并标记为异常</p>
            <p>4. 代扣失败的记录将单独生成异常清单</p>
            <p style="margin-top: 10px; color: #e6a23c;">
              共 ${count} 笔，合计 <strong>${formatThousands(amount)}</strong> 元
            </p>
          </div>
        `
      }
    )
  } catch {
    return
  }

  withholding.value = true
  try {
    const items = selectedList.value.map(i => ({
      loan_id: i.loan_id,
      due_amount: i.due_amount
    }))

    const result = await batchWithholdApi({ items })
    batchResult.value = result
    resultDialogVisible.value = true
    activeTab.value = 'all'
  } catch (e: any) {
    ElMessage.error(e.message || '批量代扣失败')
  } finally {
    withholding.value = false
  }
}

function refreshAfterBatch() {
  resultDialogVisible.value = false
  selectedList.value = []
  loadList()
}

function getAbnormalTypeText(type: string): string {
  const map: Record<string, string> = {
    not_found: '记录不存在',
    account_error: '账户异常',
    insufficient_balance: '余额不足',
    system_error: '系统异常'
  }
  return map[type] || type
}

onMounted(() => {
  loadList()
})
</script>

<style scoped lang="scss">
.ccb-batch-withhold {
  padding: 16px;

  .withhold-stats {
    margin-bottom: 16px;

    .stat-card {
      display: flex;
      align-items: center;
      padding: 16px;
      background: #fff;
      border-radius: 8px;
      border: 1px solid #e4e7ed;
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      .stat-icon {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        color: #fff;
        font-size: 20px;
      }

      &.total .stat-icon {
        background: linear-gradient(135deg, #409eff, #66b1ff);
      }

      &.normal .stat-icon {
        background: linear-gradient(135deg, #67c23a, #85ce61);
      }

      &.overdue .stat-icon {
        background: linear-gradient(135deg, #f56c6c, #f78989);
      }

      &.amount .stat-icon {
        background: linear-gradient(135deg, #e6a23c, #ebb563);
      }

      &.selected .stat-icon {
        background: linear-gradient(135deg, #909399, #a6a9ad);
      }

      &.selected-amount .stat-icon {
        background: linear-gradient(135deg, #13ce66, #36d399);
      }

      .stat-content {
        .stat-value {
          font-size: 20px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 2px;
        }

        .stat-label {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .list-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-actions {
        display: flex;
        gap: 8px;
      }
    }

    .amount-number {
      font-weight: 600;
      color: #303133;
    }

    .normal-text {
      color: #c0c4cc;
    }

    .insufficient {
      color: #f56c6c;
      font-weight: 600;
    }

    .icon-success {
      color: #67c23a;
      font-size: 18px;
    }

    .icon-error {
      color: #f56c6c;
      font-size: 18px;
    }
  }

  :deep(.withhold-row) {
    transition: all 0.2s ease;

    &:hover {
      transform: scale(1.005);
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
      background-color: #ecf5ff;
    }

    &.is-overdue {
      background-color: #fef0f0;
    }
  }

  .result-dialog {
    .result-summary {
      margin-bottom: 16px;

      .summary-item {
        text-align: center;
        padding: 16px;
        border-radius: 8px;
        background: #f5f7fa;

        .label {
          font-size: 13px;
          color: #909399;
          margin-bottom: 8px;
        }

        .value {
          font-size: 28px;
          font-weight: 700;
          color: #303133;
        }

        .sub-value {
          font-size: 12px;
          color: #909399;
          margin-top: 4px;
        }

        &.success .value {
          color: #67c23a;
        }

        &.fail .value {
          color: #f56c6c;
        }
      }
    }
  }
}
</style>
