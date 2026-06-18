<template>
  <div class="ccb-loan-trace">
    <CcbPageHeader
      title="贷款溯源查询"
      description="依托客户身份信息溯源历史贷款记录、逾期记录、结清状态"
      icon="Search"
    />

    <el-card class="search-card" shadow="never">
      <el-form :model="traceForm" label-width="100px" class="trace-search-form">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="客户编号">
              <el-input v-model="traceForm.customer_no" placeholder="请输入客户编号" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="证件号码">
              <el-input v-model="traceForm.id_card_no" placeholder="请输入证件号码" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="贷款编号">
              <el-input v-model="traceForm.loan_no" placeholder="请输入贷款编号" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="traceForm.timeRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始"
                end-placeholder="结束"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <div class="search-actions">
          <el-button type="primary" :icon="Search" :loading="searching" @click="doTrace">
            溯源查询
          </el-button>
          <el-button :icon="RefreshRight" @click="resetForm">重置</el-button>
        </div>
      </el-form>
    </el-card>

    <div v-if="traceResult" class="trace-result">
      <el-row :gutter="16" class="summary-row">
        <el-col :span="6">
          <div class="summary-card">
            <div class="summary-label">历史贷款笔数</div>
            <div class="summary-value primary">{{ traceResult.total_count }}</div>
            <div class="summary-sub">笔</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="summary-card">
            <div class="summary-label">贷款总金额</div>
            <div class="summary-value success">{{ formatThousands(traceResult.total_amount) }}</div>
            <div class="summary-sub">元</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="summary-card" :class="{ 'card-warning': traceResult.overdue_check.has_overdue }">
            <div class="summary-label">逾期记录</div>
            <div class="summary-value" :class="traceResult.overdue_check.has_overdue ? 'danger' : 'success'">
              {{ traceResult.overdue_check.overdue_records?.length || 0 }}
            </div>
            <div class="summary-sub">
              {{ traceResult.overdue_check.unsettled_overdue ? '有未结清逾期' : '无异常' }}
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="summary-card" :class="{ 'card-warning': traceResult.multi_lending_check.has_multi_lending }">
            <div class="summary-label">在贷笔数</div>
            <div class="summary-value" :class="traceResult.multi_lending_check.has_multi_lending ? 'warning' : 'info'">
              {{ traceResult.multi_lending_check.active_loan_count }}
            </div>
            <div class="summary-sub">
              {{ traceResult.multi_lending_check.has_multi_lending ? '多头借贷风险' : '正常' }}
            </div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="alert-row">
        <el-col :span="12">
          <el-alert
            v-if="traceResult.overdue_check.unsettled_overdue"
            title="检测到未结清逾期贷款，自动拦截新申请"
            type="error"
            show-icon
            :closable="false"
          />
          <el-alert
            v-else-if="traceResult.overdue_check.has_overdue"
            title="存在历史逾期记录，需重点关注"
            type="warning"
            show-icon
            :closable="false"
          />
          <el-alert v-else title="逾期记录校验通过" type="success" show-icon :closable="false" />
        </el-col>
        <el-col :span="12">
          <el-alert
            v-if="traceResult.multi_lending_check.has_multi_lending"
            :title="`多头借贷风险：当前在贷${traceResult.multi_lending_check.active_loan_count}笔`"
            type="warning"
            show-icon
            :closable="false"
          />
          <el-alert v-else title="多头借贷校验通过" type="success" show-icon :closable="false" />
        </el-col>
      </el-row>

      <el-row :gutter="16" class="alert-row">
        <el-col :span="12">
          <el-alert
            v-if="traceResult.fraud_check.has_fraud_risk"
            :title="`资质造假风险：${traceResult.fraud_check.risk_items?.join('；')}`"
            type="error"
            show-icon
            :closable="false"
          />
          <el-alert v-else title="资质真实性校验通过" type="success" show-icon :closable="false" />
        </el-col>
        <el-col :span="12">
          <el-alert
            v-if="!traceResult.info_consistency_check.passed"
            :title="`信息不一致字段：${traceResult.info_consistency_check.inconsistent_fields?.join('、')}`"
            type="warning"
            show-icon
            :closable="false"
          />
          <el-alert v-else title="信息一致性校验通过" type="success" show-icon :closable="false" />
        </el-col>
      </el-row>

      <el-card class="detail-card" shadow="never">
        <template #header>
          <div class="card-title">
            <span>历史贷款记录</span>
            <el-tag v-if="traceResult.validation_passed" type="success" size="small">校验通过</el-tag>
            <el-tag v-else type="danger" size="small">校验不通过</el-tag>
          </div>
        </template>

        <el-table :data="traceResult.records" border stripe size="default" row-class-name="trace-row">
          <el-table-column prop="loan_no" label="贷款编号" width="180" />
          <el-table-column prop="loan_type_text" label="贷款类型" width="110" />
          <el-table-column prop="purpose_text" label="用途" width="90" />
          <el-table-column prop="amount" label="贷款金额" width="130" align="right">
            <template #default="{ row }">
              <span class="amount-number">{{ formatThousands(row.amount) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="term_text" label="期限" width="80" />
          <el-table-column prop="interest_rate" label="年利率(%)" width="100" align="right" />
          <el-table-column prop="monthly_payment" label="月供" width="120" align="right">
            <template #default="{ row }">
              <span v-if="row.monthly_payment">{{ formatThousands(row.monthly_payment) }}</span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" effect="light" size="small">
                {{ row.status_text }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="is_low_quality" label="资质" width="80">
            <template #default="{ row }">
              <el-tag v-if="row.is_low_quality" type="warning" size="small">重点</el-tag>
              <span v-else class="text-muted">正常</span>
            </template>
          </el-table-column>
          <el-table-column prop="operator_name" label="经办人" width="100" />
          <el-table-column prop="apply_time" label="申请时间" width="160" />
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="showDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card v-if="traceResult.risk_prompts && traceResult.risk_prompts.length > 0" class="risk-card" shadow="never">
        <template #header>
          <span class="risk-title">风险提示</span>
        </template>
        <el-timeline>
          <el-timeline-item
            v-for="(prompt, index) in traceResult.risk_prompts"
            :key="index"
            type="warning"
            :icon="Warning"
          >
            {{ prompt }}
          </el-timeline-item>
        </el-timeline>
      </el-card>

      <el-card v-if="traceResult.abnormal_archives && traceResult.abnormal_archives.length > 0" class="archive-card" shadow="never">
        <template #header>
          <span class="archive-title">异常归档记录</span>
          <el-tag type="danger" size="small">{{ traceResult.abnormal_archives.length }}条</el-tag>
        </template>
        <el-table :data="traceResult.abnormal_archives" border stripe size="small">
          <el-table-column prop="loan_no" label="贷款编号" width="180" />
          <el-table-column prop="loan_type_text" label="贷款类型" width="110" />
          <el-table-column prop="amount" label="金额" width="130" align="right">
            <template #default="{ row }">
              <span class="amount-danger">{{ formatThousands(row.amount) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status_text" label="状态" width="100" />
          <el-table-column prop="risk_tags" label="风险标签" min-width="200">
            <template #default="{ row }">
              <el-tag
                v-for="(tag, i) in (row.risk_tags || '').split(',').filter(Boolean)"
                :key="i"
                type="danger"
                effect="light"
                size="small"
                style="margin-right: 4px;"
              >
                {{ tag }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        </el-table>
      </el-card>
    </div>

    <el-empty v-else-if="hasSearched && !traceResult" description="暂无溯源数据" />

    <el-dialog v-model="showDetailDialog" title="贷款详情" width="680px" destroy-on-close>
      <el-descriptions :column="2" border v-if="currentRecord">
        <el-descriptions-item label="贷款编号">{{ currentRecord.loan_no }}</el-descriptions-item>
        <el-descriptions-item label="贷款类型">{{ currentRecord.loan_type_text }}</el-descriptions-item>
        <el-descriptions-item label="贷款用途">{{ currentRecord.purpose_text }}</el-descriptions-item>
        <el-descriptions-item label="贷款金额">
          <span class="amount-number">{{ formatThousands(currentRecord.amount) }}元</span>
        </el-descriptions-item>
        <el-descriptions-item label="贷款期限">{{ currentRecord.term_text }}</el-descriptions-item>
        <el-descriptions-item label="年利率">{{ currentRecord.interest_rate }}%</el-descriptions-item>
        <el-descriptions-item label="还款方式">{{ currentRecord.repayment_method_text }}</el-descriptions-item>
        <el-descriptions-item label="月供">
          <span v-if="currentRecord.monthly_payment">{{ formatThousands(currentRecord.monthly_payment) }}元</span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentRecord.status)" effect="light" size="small">
            {{ currentRecord.status_text }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ currentRecord.apply_time }}</el-descriptions-item>
        <el-descriptions-item label="风险等级" v-if="currentRecord.risk_level !== undefined">
          {{ currentRecord.risk_level }}级
        </el-descriptions-item>
        <el-descriptions-item label="征信评分" v-if="currentRecord.credit_score !== undefined">
          {{ currentRecord.credit_score }}分
        </el-descriptions-item>
        <el-descriptions-item label="用途说明" :span="2">{{ currentRecord.purpose_detail || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentRecord.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, RefreshRight, Warning } from '@element-plus/icons-vue'
import {
  LOAN_STATUS_OPTIONS,
  formatThousands,
  type Loan,
  type LoanTraceRequest,
  type LoanTraceResult,
  traceLoanApi
} from '@api/loan'

const traceForm = reactive({
  customer_no: '',
  id_card_no: '',
  loan_no: '',
  timeRange: [] as string[]
})

const searching = ref(false)
const hasSearched = ref(false)
const traceResult = ref<LoanTraceResult | null>(null)

const showDetailDialog = ref(false)
const currentRecord = ref<Loan | null>(null)

async function doTrace() {
  if (!traceForm.customer_no && !traceForm.id_card_no && !traceForm.loan_no) {
    ElMessage.warning('请至少输入客户编号、证件号码或贷款编号中的一项')
    return
  }

  searching.value = true
  try {
    const request: LoanTraceRequest = {
      customer_no: traceForm.customer_no || undefined,
      id_card_no: traceForm.id_card_no || undefined,
      loan_no: traceForm.loan_no || undefined,
      start_time: traceForm.timeRange?.[0],
      end_time: traceForm.timeRange?.[1]
    }
    const result = await traceLoanApi(request)
    traceResult.value = result
    hasSearched.value = true

    if (!result.validation_passed) {
      ElMessage.warning('检测到风险，建议人工复核')
    } else {
      ElMessage.success('溯源查询完成，校验通过')
    }
  } catch (e: any) {
    ElMessage.error(e.message || '查询失败')
  } finally {
    searching.value = false
  }
}

function resetForm() {
  traceForm.customer_no = ''
  traceForm.id_card_no = ''
  traceForm.loan_no = ''
  traceForm.timeRange = []
  traceResult.value = null
  hasSearched.value = false
}

function getStatusType(status: number): string {
  const statusMap: Record<number, string> = {
    0: 'info', 1: 'warning', 2: 'success', 3: 'danger',
    4: 'warning', 5: 'success', 6: 'danger', 7: 'success', 8: 'info'
  }
  return statusMap[status] || ''
}

function showDetail(row: Loan) {
  currentRecord.value = row
  showDetailDialog.value = true
}
</script>

<style lang="scss" scoped>
.ccb-loan-trace {
  .search-card {
    margin-bottom: 20px;
  }

  .trace-search-form {
    .search-actions {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-top: 10px;
    }
  }

  .trace-result {
    .summary-row {
      margin-bottom: 16px;
    }

    .summary-card {
      background: #fff;
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      }

      &.card-warning {
        border-color: var(--el-color-warning-light-7);
        background: var(--el-color-warning-light-9);
      }

      .summary-label {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin-bottom: 10px;
      }

      .summary-value {
        font-size: 28px;
        font-weight: 700;
        line-height: 1.2;

        &.primary { color: var(--el-color-primary); }
        &.success { color: var(--el-color-success); }
        &.danger { color: var(--el-color-danger); }
        &.warning { color: var(--el-color-warning); }
        &.info { color: var(--el-color-info); }
      }

      .summary-sub {
        font-size: 12px;
        color: var(--el-text-color-placeholder);
        margin-top: 6px;
      }
    }

    .alert-row {
      margin-bottom: 16px;
    }

    .detail-card, .risk-card, .archive-card {
      margin-bottom: 20px;
    }

    .card-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
    }

    .risk-title, .archive-title {
      font-weight: 600;
    }

    .amount-number {
      color: var(--el-color-primary);
      font-weight: 600;
    }

    .amount-danger {
      color: var(--el-color-danger);
      font-weight: 600;
    }

    .text-muted {
      color: var(--el-text-color-secondary);
    }

    :deep(.trace-row:hover) {
      transform: scale(1.003);
      transition: transform 0.2s ease;
    }
  }
}
</style>
