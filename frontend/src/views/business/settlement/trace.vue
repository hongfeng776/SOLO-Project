<template>
  <div class="ccb-business-settlement-trace">
    <CcbPageHeader
      title="结算溯源"
      description="通过流水号溯源全流程、自动检测异常交易、风控预警分析"
      icon="Search"
    />

    <el-card shadow="hover" class="mb15">
      <template #header>
        <span class="card-title">溯源条件</span>
      </template>
      <el-form :model="traceForm" inline>
        <el-form-item label="结算流水号">
          <el-input
            v-model="traceForm.settlement_no"
            placeholder="请输入结算流水号"
            clearable
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="转出账号">
          <el-input
            v-model="traceForm.payer_account_no"
            placeholder="请输入转出账号"
            clearable
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="收款账号">
          <el-input
            v-model="traceForm.payee_account_no"
            placeholder="请输入收款账号"
            clearable
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="handleTrace">
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <template v-if="traceResult">
      <el-row :gutter="20" class="mb15">
        <el-col :span="8">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-label">总笔数</div>
            <div class="stat-value text-primary">{{ traceResult.total_count }}</div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-label">总金额</div>
            <div class="stat-value text-success">{{ formatThousands(traceResult.total_amount) }}</div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-label">总手续费</div>
            <div class="stat-value text-warning">{{ formatThousands(traceResult.total_fee) }}</div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="mb15">
        <el-col :span="12">
          <el-card shadow="hover" class="stat-card">
            <template #header>
              <div class="card-header-flex">
                <span class="card-title">校验结果</span>
                <el-tag :type="traceResult.validation_passed ? 'success' : 'danger'" effect="light">
                  {{ traceResult.validation_passed ? '校验通过' : '校验不通过' }}
                </el-tag>
              </div>
            </template>
            <div class="validation-content">
              <div class="validation-item">
                <span class="validation-label">校验是否通过：</span>
                <el-tag :type="traceResult.validation_passed ? 'success' : 'danger'" effect="dark">
                  {{ traceResult.validation_passed ? '通过' : '不通过' }}
                </el-tag>
              </div>
              <div class="validation-item">
                <span class="validation-label">风险预警数量：</span>
                <el-badge :value="traceResult.risk_warnings.length" :hidden="traceResult.risk_warnings.length === 0" class="item">
                  <el-tag :type="traceResult.risk_warnings.length > 0 ? 'danger' : 'success'" effect="light">
                    {{ traceResult.risk_warnings.length > 0 ? `${traceResult.risk_warnings.length} 项风险` : '无风险' }}
                  </el-tag>
                </el-badge>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="hover" :class="{ 'card-error': !traceResult.validation_passed }">
            <template #header>
              <span class="card-title">校验说明</span>
            </template>
            <el-alert
              v-if="traceResult.validation_passed"
              title="所有风控校验通过，交易合规"
              type="success"
              show-icon
              :closable="false"
            />
            <template v-else>
              <el-alert
                title="检测到风险项，请查看下方风控预警详情"
                type="error"
                show-icon
                :closable="false"
                class="mb10"
              />
              <div class="risk-summary">
                <div v-for="(warning, idx) in traceResult.risk_warnings" :key="idx" class="risk-summary-item">
                  <el-tag :type="getRiskTagType(warning.risk_level)" effect="light" size="small">
                    {{ getRiskLevelLabel(warning.risk_level) }}
                  </el-tag>
                  <span class="risk-summary-text">{{ warning.description }}</span>
                </div>
              </div>
            </template>
          </el-card>
        </el-col>
      </el-row>

      <el-card shadow="hover" class="mb15" v-if="traceResult.risk_warnings.length > 0">
        <template #header>
          <div class="card-header-flex">
            <span class="card-title">风控检测结果</span>
            <el-badge :value="traceResult.risk_warnings.length" class="item">
              <el-tag type="danger" effect="light">风险预警</el-tag>
            </el-badge>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col
            v-for="(warning, idx) in traceResult.risk_warnings"
            :key="idx"
            :span="12"
            class="mb15"
          >
            <el-card shadow="hover" :class="getRiskCardClass(warning.risk_level)">
              <template #header>
                <div class="card-header-flex">
                  <div>
                    <span class="card-title">{{ warning.risk_type }}</span>
                  </div>
                  <el-tag :type="getRiskTagType(warning.risk_level)" effect="dark">
                    {{ getRiskLevelLabel(warning.risk_level) }}
                  </el-tag>
                </div>
              </template>
              <div class="risk-warning-content">
                <p class="risk-desc">{{ warning.description }}</p>
                <div class="related-settlements">
                  <span class="related-label">关联流水号：</span>
                  <div class="settlement-tags">
                    <el-tag
                      v-for="(no, nIdx) in warning.related_settlement_nos"
                      :key="nIdx"
                      type="info"
                      effect="plain"
                      size="small"
                      class="settlement-tag"
                    >
                      {{ no }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-card>

      <el-row :gutter="20" class="mb15">
        <el-col :span="12" v-if="traceResult.same_name_check.has_risk">
          <el-card shadow="hover" class="card-error">
            <template #header>
              <div class="card-header-flex">
                <span class="card-title">同名频繁转账检测详情</span>
                <el-tag type="danger" effect="light">
                  {{ traceResult.same_name_check.same_name_count }} 次 / {{ traceResult.same_name_check.time_window_hours }}小时
                </el-tag>
              </div>
            </template>
            <el-table :data="traceResult.same_name_check.transfers" border size="small">
              <el-table-column prop="settlement_no" label="结算流水号" width="200" />
              <el-table-column prop="payee_account_name" label="收款户名" width="140" />
              <el-table-column prop="amount" label="转账金额" width="140" align="right">
                <template #default="{ row }">
                  <span class="amount-positive">{{ formatThousands(row.amount) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="create_time" label="办理时间" width="160" />
            </el-table>
          </el-card>
        </el-col>
        <el-col :span="12" v-if="traceResult.large_amount_check.has_risk">
          <el-card shadow="hover" class="card-error">
            <template #header>
              <div class="card-header-flex">
                <span class="card-title">大额无用途转账检测详情</span>
                <el-tag type="danger" effect="light">
                  阈值：{{ formatThousands(traceResult.large_amount_check.threshold) }}
                </el-tag>
              </div>
            </template>
            <el-table :data="traceResult.large_amount_check.transfers" border size="small">
              <el-table-column prop="settlement_no" label="结算流水号" width="200" />
              <el-table-column prop="payee_account_no" label="收款账号" width="180" />
              <el-table-column prop="amount" label="转账金额" width="140" align="right">
                <template #default="{ row }">
                  <span class="amount-positive">{{ formatThousands(row.amount) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="create_time" label="办理时间" width="160" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="mb15" v-if="traceResult.abnormal_location_check.has_risk">
        <el-col :span="24">
          <el-card shadow="hover" class="card-error">
            <template #header>
              <span class="card-title">异地异常转账检测详情</span>
            </template>
            <el-table :data="traceResult.abnormal_location_check.transfers" border size="small">
              <el-table-column prop="settlement_no" label="结算流水号" width="200" />
              <el-table-column prop="payee_location" label="收款地区" width="140" />
              <el-table-column prop="amount" label="转账金额" width="140" align="right">
                <template #default="{ row }">
                  <span class="amount-positive">{{ formatThousands(row.amount) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="is_abnormal" label="是否异常" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.is_abnormal ? 'danger' : 'success'" effect="light" size="small">
                    {{ row.is_abnormal ? '异常' : '正常' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="create_time" label="办理时间" width="160" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="mb15">
        <el-col :span="12">
          <el-card shadow="hover" class="stat-card">
            <template #header>
              <div class="card-header-flex">
                <span class="card-title">账户合规性检查</span>
              </div>
            </template>
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="转出账户合规状态">
                <el-tag :type="traceResult.account_compliance_check.payer_compliant ? 'success' : 'danger'" effect="light">
                  {{ traceResult.account_compliance_check.payer_compliant ? '合规' : '不合规' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="转出账户问题列表">
                <template v-if="traceResult.account_compliance_check.payer_issues.length > 0">
                  <div v-for="(issue, idx) in traceResult.account_compliance_check.payer_issues" :key="idx" class="issue-item">
                    <el-icon class="text-danger"><WarningFilled /></el-icon>
                    <span>{{ issue }}</span>
                  </div>
                </template>
                <el-tag v-else type="success" effect="plain" size="small">无问题</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="收款账户合规状态">
                <el-tag :type="traceResult.account_compliance_check.payee_compliant ? 'success' : 'danger'" effect="light">
                  {{ traceResult.account_compliance_check.payee_compliant ? '合规' : '不合规' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="收款账户问题列表">
                <template v-if="traceResult.account_compliance_check.payee_issues.length > 0">
                  <div v-for="(issue, idx) in traceResult.account_compliance_check.payee_issues" :key="idx" class="issue-item">
                    <el-icon class="text-danger"><WarningFilled /></el-icon>
                    <span>{{ issue }}</span>
                  </div>
                </template>
                <el-tag v-else type="success" effect="plain" size="small">无问题</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="hover" class="stat-card">
            <template #header>
              <div class="card-header-flex">
                <span class="card-title">交易真实性检查</span>
                <el-tag :type="traceResult.transaction_authenticity_check.is_authentic ? 'success' : 'danger'" effect="light">
                  {{ traceResult.transaction_authenticity_check.is_authentic ? '真实可信' : '存疑' }}
                </el-tag>
              </div>
            </template>
            <div class="authenticity-content">
              <div class="progress-wrapper">
                <el-progress
                  type="dashboard"
                  :percentage="traceResult.transaction_authenticity_check.authenticity_score"
                  :color="getAuthenticityColor(traceResult.transaction_authenticity_check.authenticity_score)"
                  :width="160"
                />
                <div class="progress-label">交易真实性评分</div>
              </div>
              <div class="authenticity-issues">
                <div v-if="traceResult.transaction_authenticity_check.issues.length > 0">
                  <div class="issues-title">存在以下问题：</div>
                  <div v-for="(issue, idx) in traceResult.transaction_authenticity_check.issues" :key="idx" class="issue-item">
                    <el-icon class="text-warning"><WarningFilled /></el-icon>
                    <span>{{ issue }}</span>
                  </div>
                </div>
                <el-tag v-else type="success" effect="plain">交易背景真实，无异常</el-tag>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card shadow="hover">
        <template #header>
          <div class="card-header-flex">
            <span class="card-title">溯源记录列表</span>
            <el-text type="info" size="small">共 {{ traceResult.records.length }} 条记录</el-text>
          </div>
        </template>
        <CcbEmpty v-if="traceResult.records.length === 0" description="暂无溯源记录" />
        <el-table
          v-else
          :data="traceResult.records"
          border
          stripe
          row-key="id"
          @row-click="handleRowClick"
        >
          <el-table-column type="expand">
            <template #default="{ row }">
              <el-descriptions :column="2" border size="small" class="detail-descriptions">
                <el-descriptions-item label="结算流水号">{{ row.settlement_no }}</el-descriptions-item>
                <el-descriptions-item label="批次ID">{{ row.batch_id || '-' }}</el-descriptions-item>
                <el-descriptions-item label="转出账号">{{ row.payer_account_no }}</el-descriptions-item>
                <el-descriptions-item label="转出户名">{{ row.payer_account_name || '-' }}</el-descriptions-item>
                <el-descriptions-item label="收款账号">{{ row.payee_account_no }}</el-descriptions-item>
                <el-descriptions-item label="收款户名">{{ row.payee_account_name }}</el-descriptions-item>
                <el-descriptions-item label="收款银行">{{ row.payee_bank_name || '-' }}</el-descriptions-item>
                <el-descriptions-item label="收款地区">{{ row.payee_location || '-' }}</el-descriptions-item>
                <el-descriptions-item label="转账类型">{{ row.transfer_type_text }}</el-descriptions-item>
                <el-descriptions-item label="转账模式">{{ row.transfer_mode_text }}</el-descriptions-item>
                <el-descriptions-item label="转账金额">
                  <span class="amount-positive">{{ formatThousands(row.amount) }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="手续费">{{ formatThousands(row.fee) }}</el-descriptions-item>
                <el-descriptions-item label="用途">{{ row.purpose || '-' }}</el-descriptions-item>
                <el-descriptions-item label="预计到账时间">{{ row.arrival_time || '-' }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                  <el-tag :type="getStatusType(row.status)" effect="light" size="small">
                    {{ row.status_text }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="审核状态">
                  <el-tag :type="getAuditStatusType(row.audit_status)" effect="light" size="small">
                    {{ row.audit_status_text }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="风险等级" :span="2">
                  <el-tag :type="getRiskTagType(row.risk_level || 0)" effect="light" size="small">
                    {{ row.risk_level_text || '无风险' }}
                  </el-tag>
                  <template v-if="row.risk_tags">
                    <el-tag
                      v-for="(tag, idx) in parseRiskTags(row.risk_tags)"
                      :key="idx"
                      type="warning"
                      effect="plain"
                      size="small"
                      style="margin-left: 6px"
                    >
                      {{ tag }}
                    </el-tag>
                  </template>
                </el-descriptions-item>
                <el-descriptions-item label="办理机构">{{ row.org_name || '-' }}</el-descriptions-item>
                <el-descriptions-item label="经办人">{{ row.operator_name || '-' }}</el-descriptions-item>
                <el-descriptions-item label="提交时间">{{ row.submit_time || '-' }}</el-descriptions-item>
                <el-descriptions-item label="结算时间">{{ row.settle_time || '-' }}</el-descriptions-item>
                <el-descriptions-item label="备注" :span="2">{{ row.remark || '-' }}</el-descriptions-item>
              </el-descriptions>
            </template>
          </el-table-column>
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="settlement_no" label="结算流水号" width="200" show-overflow-tooltip />
          <el-table-column prop="payer_account_no" label="转出账号" width="160" show-overflow-tooltip />
          <el-table-column prop="payee_account_name" label="收款户名" width="120" show-overflow-tooltip />
          <el-table-column prop="transfer_type_text" label="转账类型" width="100" />
          <el-table-column prop="amount" label="金额" width="130" align="right">
            <template #default="{ row }">
              <span class="amount-positive">{{ formatThousands(row.amount) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="fee" label="手续费" width="110" align="right">
            <template #default="{ row }">
              {{ formatThousands(row.fee) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" effect="light" size="small">
                {{ row.status_text }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="risk_level" label="风险等级" width="100">
            <template #default="{ row }">
              <el-tag :type="getRiskTagType(row.risk_level || 0)" effect="light" size="small">
                {{ row.risk_level_text || '无风险' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="标签" width="140">
            <template #default="{ row }">
              <template v-if="row.risk_tags">
                <el-tag
                  v-for="(tag, idx) in parseRiskTags(row.risk_tags).slice(0, 2)"
                  :key="idx"
                  type="warning"
                  effect="plain"
                  size="small"
                  class="risk-tag-item"
                >
                  {{ tag }}
                </el-tag>
                <el-tag
                  v-if="parseRiskTags(row.risk_tags).length > 2"
                  type="info"
                  effect="plain"
                  size="small"
                >
                  +{{ parseRiskTags(row.risk_tags).length - 2 }}
                </el-tag>
              </template>
              <el-tag v-else type="info" effect="plain" size="small">无</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="办理时间" width="160" />
        </el-table>
      </el-card>
    </template>

    <CcbEmpty v-else description="请输入查询条件进行溯源查询" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, WarningFilled } from '@element-plus/icons-vue'
import {
  TRANSFER_TYPE_OPTIONS,
  TRANSFER_MODE_OPTIONS,
  SETTLEMENT_STATUS_OPTIONS,
  AUDIT_STATUS_OPTIONS,
  RISK_LEVEL_OPTIONS,
  BATCH_TYPE_OPTIONS,
  PURPOSE_OPTIONS,
  SINGLE_AUTO_REVIEW_THRESHOLD,
  BATCH_SMALL_AMOUNT_THRESHOLD,
  BATCH_LARGE_AMOUNT_THRESHOLD,
  SINGLE_LEVEL_REVIEW_THRESHOLD,
  MULTI_LEVEL_REVIEW_THRESHOLD,
  TRANSFER_LIMITS,
  RISK_DETECTION_RULES,
  PUBLIC_PRIVATE_RULES,
  type TransferType,
  type TransferMode,
  type SettlementStatus,
  type AuditStatus,
  type RiskLevel,
  type BatchType,
  type FeeConfig,
  type ReviewRules,
  type TransferLimitConfig,
  type PublicPrivateRules,
  type RiskDetectionRules,
  type SettlementConfig,
  type TransferAccountInfo,
  type SettlementPreCheckRequest,
  type LimitCheckResult,
  type PublicPrivateCheckResult,
  type FeeCalcResult,
  type SettlementPreCheckResult,
  type Settlement,
  type SettlementVO,
  type SettlementQueryParams,
  type CreateSettlementRequest,
  type CancelSettlementRequest,
  type ReviewSettlementRequest,
  type SettlementTraceRequest,
  type SameNameTransferCheck,
  type LargeAmountNoPurposeCheck,
  type AbnormalLocationCheck,
  type AccountComplianceCheck,
  type TransactionAuthenticityCheck,
  type SettlementTraceResult,
  type BatchSettlementItem,
  type CreateBatchSettlementRequest,
  type BatchSettlementResultItem,
  type BatchSettlementResult,
  type BatchQueryParams,
  type BatchSettlementVO,
  type BatchReviewRequest,
  type BatchProgressVO,
  getSettlementConfigApi,
  preCheckSettlementApi,
  getSettlementListApi,
  getSettlementDetailApi,
  createSettlementApi,
  cancelSettlementApi,
  reviewSettlementApi,
  createBatchSettlementApi,
  getBatchListApi,
  getBatchDetailApi,
  reviewBatchApi,
  getBatchProgressApi,
  traceSettlementApi,
  formatCurrency,
  formatThousands
} from '@api/settlement'

const loading = ref(false)
const traceResult = ref<SettlementTraceResult | null>(null)
const dateRange = ref<string[]>([])

const traceForm = reactive<SettlementTraceRequest>({
  settlement_no: '',
  payer_account_no: '',
  payee_account_no: '',
  payer_customer_id: '',
  start_time: '',
  end_time: ''
})

const handleTrace = async () => {
  if (!traceForm.settlement_no && !traceForm.payer_account_no && !traceForm.payee_account_no && dateRange.value.length === 0) {
    ElMessage.warning('请至少输入一项查询条件')
    return
  }
  if (dateRange.value.length === 2) {
    traceForm.start_time = dateRange.value[0]
    traceForm.end_time = dateRange.value[1]
  } else {
    traceForm.start_time = ''
    traceForm.end_time = ''
  }
  loading.value = true
  try {
    const res = await traceSettlementApi(traceForm)
    traceResult.value = res.data
    ElMessage.success(
      `溯源查询完成，共 ${res.data.total_count} 条记录`
    )
  } catch (e) {
    console.error('Failed to trace settlement:', e)
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  traceForm.settlement_no = ''
  traceForm.payer_account_no = ''
  traceForm.payee_account_no = ''
  traceForm.payer_customer_id = ''
  traceForm.start_time = ''
  traceForm.end_time = ''
  dateRange.value = []
  traceResult.value = null
}

const handleRowClick = (row: SettlementVO, expandedRows: any[]) => {
}

const getStatusType = (status: SettlementStatus) => {
  const opt = SETTLEMENT_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.type || ''
}

const getAuditStatusType = (status: AuditStatus) => {
  const opt = AUDIT_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.type || ''
}

const getRiskLevelLabel = (level: number) => {
  const opt = RISK_LEVEL_OPTIONS.find(o => o.value === level)
  return opt?.label || '未知'
}

const getRiskTagType = (level: number) => {
  if (level <= 1) return 'success'
  if (level <= 3) return 'warning'
  return 'danger'
}

const getRiskCardClass = (level: number) => {
  if (level <= 1) return ''
  if (level <= 3) return 'card-warning'
  return 'card-error'
}

const getAuthenticityColor = (score: number) => {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

const parseRiskTags = (tags: string) => {
  if (!tags) return []
  try {
    const parsed = JSON.parse(tags)
    if (Array.isArray(parsed)) return parsed
    return tags.split(',').map(t => t.trim()).filter(Boolean)
  } catch {
    return tags.split(',').map(t => t.trim()).filter(Boolean)
  }
}
</script>

<style scoped>
.amount-positive {
  color: #67c23a;
  font-weight: 600;
}

.stat-card {
  height: 100%;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
}

.text-primary {
  color: #409eff;
}

.text-success {
  color: #67c23a;
}

.text-warning {
  color: #e6a23c;
}

.text-danger {
  color: #f56c6c;
}

.card-error {
  border-color: #f56c6c !important;
}

.card-error :deep(.el-card__header) {
  border-bottom-color: #f56c6c !important;
  background-color: #fef0f0;
}

.card-warning {
  border-color: #e6a23c !important;
}

.card-warning :deep(.el-card__header) {
  border-bottom-color: #e6a23c !important;
  background-color: #fdf6ec;
}

.card-title {
  font-weight: 600;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mb15 {
  margin-bottom: 15px;
}

.mb10 {
  margin-bottom: 10px;
}

.validation-content {
  padding: 10px 0;
}

.validation-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.validation-label {
  width: 110px;
  color: #606266;
  font-size: 14px;
}

.risk-summary {
  margin-top: 10px;
}

.risk-summary-item {
  display: flex;
  align-items: center;
  padding: 6px 0;
}

.risk-summary-text {
  margin-left: 10px;
  color: #303133;
  font-size: 13px;
}

.risk-warning-content {
  padding: 5px 0;
}

.risk-desc {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 14px;
  line-height: 1.6;
}

.related-settlements {
  margin-top: 8px;
}

.related-label {
  display: block;
  color: #909399;
  font-size: 12px;
  margin-bottom: 6px;
}

.settlement-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.settlement-tag {
  cursor: pointer;
}

.issue-item {
  display: flex;
  align-items: flex-start;
  padding: 4px 0;
  font-size: 13px;
  color: #606266;
}

.issue-item .el-icon {
  margin-right: 6px;
  margin-top: 2px;
  flex-shrink: 0;
}

.authenticity-content {
  display: flex;
  align-items: flex-start;
  padding: 10px 0;
}

.progress-wrapper {
  flex-shrink: 0;
  text-align: center;
  margin-right: 30px;
}

.progress-label {
  margin-top: 8px;
  color: #606266;
  font-size: 13px;
  font-weight: 500;
}

.authenticity-issues {
  flex: 1;
  padding-top: 10px;
}

.issues-title {
  color: #606266;
  font-size: 13px;
  margin-bottom: 8px;
  font-weight: 500;
}

.detail-descriptions {
  margin: 5px 0;
}

.risk-tag-item {
  margin-right: 4px;
  margin-bottom: 2px;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover > td) {
  background-color: #f5f7fa !important;
}
</style>
