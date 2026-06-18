<template>
  <div class="ccb-loan-approval">
    <CcbPageHeader
      title="贷款审批工作台"
      description="多级审批流程管理，小额单级、大额逐级审批"
      icon="Stamp"
    />

    <div class="approval-stats">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-card pending">
            <div class="stat-icon"><el-icon><Clock /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">{{ pendingCount }}</div>
              <div class="stat-label">待我审批</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card approved">
            <div class="stat-icon"><el-icon><CircleCheck /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">{{ approvedCount }}</div>
              <div class="stat-label">我已通过</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card rejected">
            <div class="stat-icon"><el-icon><CircleClose /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">{{ rejectedCount }}</div>
              <div class="stat-label">我已驳回</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card high-risk">
            <div class="stat-icon"><el-icon><Warning /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">{{ highRiskCount }}</div>
              <div class="stat-label">高风险待审</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-card class="list-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>待审批贷款列表</span>
          <div class="header-actions">
            <el-button type="primary" size="small" :icon="Refresh" @click="loadList">刷新</el-button>
            <el-button type="success" size="small" :icon="Files" @click="goBatch" v-permission="'loan:approval:batch'">批量审批</el-button>
            <el-button type="info" size="small" :icon="Search" @click="goTrace" v-permission="'loan:approval:trace'">审批溯源</el-button>
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
          <el-select v-model="searchForm.loan_type" placeholder="请选择贷款类型" clearable>
            <el-option v-for="item in LOAN_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级" prop="risk_level">
          <el-select v-model="searchForm.risk_level" placeholder="请选择风险等级" clearable>
            <el-option label="低风险(0-1)" :value="1" />
            <el-option label="中风险(2-3)" :value="3" />
            <el-option label="高风险(4-5)" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="当前审批级" prop="current_level">
          <el-select v-model="searchForm.current_level" placeholder="请选择审批级" clearable>
            <el-option v-for="item in APPROVAL_LEVEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="仅高风险" prop="is_high_risk">
          <el-switch v-model="searchForm.is_high_risk" />
        </el-form-item>
      </CcbSearchForm>

      <CcbTable
        v-model:page="pageParams.page"
        v-model:pageSize="pageParams.pageSize"
        :loading="loading"
        :data="tableData"
        :total="total"
        :show-selection="false"
        :show-index="true"
        row-class-name="approval-row"
        @change="handlePageChange"
      >
        <el-table-column prop="loan_no" label="贷款编号" width="180" fixed="left" />
        <el-table-column prop="customer_name" label="客户姓名" width="100" />
        <el-table-column prop="loan_type_text" label="贷款类型" width="110" />
        <el-table-column prop="purpose_text" label="用途" width="90" />
        <el-table-column prop="amount" label="贷款金额" width="130" align="right">
          <template #default="{ row }">
            <span class="amount-number">{{ formatThousands(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="term_text" label="期限" width="80" />
        <el-table-column prop="interest_rate" label="利率(%)" width="90" align="right" />
        <el-table-column prop="current_level_text" label="当前审批级" width="110" />
        <el-table-column prop="total_levels" label="总级数" width="80" align="center">
          <template #default="{ row }">
            <el-progress
              :percentage="row.approval_progress"
              :status="row.approval_progress >= 100 ? 'success' : ''"
              :stroke-width="10"
            />
          </template>
        </el-table-column>
        <el-table-column prop="risk_level" label="风险等级" width="100">
          <template #default="{ row }">
            <el-tag
              v-if="row.is_high_risk"
              type="danger"
              effect="dark"
              size="small"
            >
              高风险 {{ row.risk_level }}级
            </el-tag>
            <el-tag
              v-else-if="row.risk_level >= 2"
              type="warning"
              size="small"
            >
              中风险 {{ row.risk_level }}级
            </el-tag>
            <el-tag v-else type="success" size="small">
              低风险 {{ row.risk_level }}级
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="apply_time" label="申请时间" width="160" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              @click="openApprovalDetail(row)"
              :disabled="!row.can_batch_approve && row.is_high_risk"
            >
              {{ row.is_high_risk ? '精细复核' : '审批' }}
            </el-button>
          </template>
        </el-table-column>
      </CcbTable>
    </el-card>

    <el-dialog
      v-model="showApproval"
      :title="`贷款审批 - ${currentDetail?.loan_no}`"
      width="1200px"
      class="approval-detail-dialog"
      :close-on-click-modal="false"
      destroy-on-close
      @close="handleDialogClose"
    >
      <div v-if="currentDetail" class="approval-detail-content">
        <el-alert
          v-if="currentDetail.approval_locked"
          :title="currentDetail.lock_reason || '审批已锁定'"
          type="error"
          show-icon
          :closable="false"
          class="mb15"
        />

        <el-row :gutter="16" class="info-section">
          <el-col :span="8">
            <div class="info-card">
              <div class="info-title">
                <el-icon><User /></el-icon>
                <span>客户基本信息</span>
              </div>
              <div class="info-item">
                <span class="label">客户姓名：</span>
                <span class="value">{{ currentDetail.customer_name }}</span>
              </div>
              <div class="info-item">
                <span class="label">证件号码：</span>
                <span class="value">{{ currentDetail.id_card_no }}</span>
              </div>
              <div class="info-item">
                <span class="label">申请时间：</span>
                <span class="value">{{ currentDetail.apply_time }}</span>
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-card">
              <div class="info-title">
                <el-icon><CreditCard /></el-icon>
                <span>贷款基本信息</span>
              </div>
              <div class="info-item">
                <span class="label">贷款类型：</span>
                <span class="value">{{ currentDetail.loan_type_text }}</span>
              </div>
              <div class="info-item">
                <span class="label">贷款用途：</span>
                <span class="value">{{ currentDetail.purpose_text }}</span>
              </div>
              <div class="info-item">
                <span class="label">贷款金额：</span>
                <span class="value amount">{{ formatThousands(currentDetail.amount) }}元</span>
              </div>
              <div class="info-item">
                <span class="label">贷款期限：</span>
                <span class="value">{{ currentDetail.term_text }}</span>
              </div>
              <div class="info-item">
                <span class="label">年利率：</span>
                <span class="value">{{ currentDetail.interest_rate }}%</span>
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-card risk-card" :class="{ 'high-risk': currentDetail.is_high_risk }">
              <div class="info-title">
                <el-icon><Warning /></el-icon>
                <span>风险评估</span>
              </div>
              <div class="risk-level">
                <div class="risk-label">风险等级</div>
                <div class="risk-value" :class="currentDetail.is_high_risk ? 'danger' : currentDetail.risk_level >= 2 ? 'warning' : 'success'">
                  {{ currentDetail.risk_level }}级
                </div>
              </div>
              <div class="risk-tags">
                <el-tag
                  v-for="(tag, i) in (currentDetail.risk_tags || '').split(',').filter(Boolean)"
                  :key="i"
                  size="small"
                  effect="light"
                >
                  {{ tag }}
                </el-tag>
              </div>
              <div class="approval-progress">
                <div class="progress-label">
                  <span>审批进度</span>
                  <span>{{ currentDetail.approval_progress }}%</span>
                </div>
                <el-progress
                  :percentage="currentDetail.approval_progress"
                  :status="currentDetail.approval_progress >= 100 ? 'success' : ''"
                />
                <div class="progress-info">
                  当前：{{ currentDetail.current_level_text }} / 共{{ currentDetail.total_levels }}级
                </div>
              </div>
            </div>
          </el-col>
        </el-row>

        <el-tabs v-model="activeTab" class="approval-tabs">
          <el-tab-pane label="征信报告" name="credit">
            <div v-if="currentDetail.credit_report" class="tab-content">
              <el-row :gutter="16">
                <el-col :span="6">
                  <div class="credit-score-card">
                    <div class="score-value" :class="getCreditScoreClass(currentDetail.credit_report.credit_score)">
                      {{ currentDetail.credit_report.credit_score }}
                    </div>
                    <div class="score-label">信用评分</div>
                    <div class="score-level">{{ currentDetail.credit_report.credit_level }}</div>
                  </div>
                </el-col>
                <el-col :span="18">
                  <el-descriptions :column="3" border size="small">
                    <el-descriptions-item label="逾期次数">
                      <span :class="currentDetail.credit_report.overdue_count > 0 ? 'text-danger' : ''">
                        {{ currentDetail.credit_report.overdue_count }}次
                      </span>
                    </el-descriptions-item>
                    <el-descriptions-item label="逾期金额">
                      <span :class="currentDetail.credit_report.overdue_amount > 0 ? 'text-danger' : ''">
                        {{ formatThousands(currentDetail.credit_report.overdue_amount) }}元
                      </span>
                    </el-descriptions-item>
                    <el-descriptions-item label="当前贷款笔数">
                      {{ currentDetail.credit_report.current_loan_count }}笔
                    </el-descriptions-item>
                    <el-descriptions-item label="当前贷款余额">
                      {{ formatThousands(currentDetail.credit_report.current_loan_amount) }}元
                    </el-descriptions-item>
                    <el-descriptions-item label="近30天查询次数">
                      <span :class="currentDetail.credit_report.query_count_30days > 5 ? 'text-warning' : ''">
                        {{ currentDetail.credit_report.query_count_30days }}次
                      </span>
                    </el-descriptions-item>
                    <el-descriptions-item label="报告日期">
                      {{ currentDetail.credit_report.report_date }}
                    </el-descriptions-item>
                  </el-descriptions>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>

          <el-tab-pane label="负债数据" name="debt">
            <div v-if="currentDetail.debt_data" class="tab-content">
              <el-row :gutter="16">
                <el-col :span="8">
                  <div class="debt-ratio-card">
                    <div class="ratio-circle" :class="getDebtRatioClass(currentDetail.debt_data.debt_to_income_ratio)">
                      <span class="ratio-value">{{ currentDetail.debt_data.debt_to_income_ratio }}%</span>
                      <span class="ratio-label">负债率</span>
                    </div>
                  </div>
                </el-col>
                <el-col :span="16">
                  <el-descriptions :column="2" border size="small">
                    <el-descriptions-item label="月收入">
                      <span class="text-success">{{ formatThousands(currentDetail.debt_data.monthly_income) }}元</span>
                    </el-descriptions-item>
                    <el-descriptions-item label="月债务支出">
                      <span class="text-danger">{{ formatThousands(currentDetail.debt_data.monthly_debt_payment) }}元</span>
                    </el-descriptions-item>
                    <el-descriptions-item label="总负债">
                      {{ formatThousands(currentDetail.debt_data.total_debt_amount) }}元
                    </el-descriptions-item>
                    <el-descriptions-item label="信用卡余额">
                      {{ formatThousands(currentDetail.debt_data.credit_card_balance) }}元
                    </el-descriptions-item>
                    <el-descriptions-item label="其他贷款余额">
                      {{ formatThousands(currentDetail.debt_data.other_loan_balance) }}元
                    </el-descriptions-item>
                    <el-descriptions-item label="房贷余额">
                      {{ formatThousands(currentDetail.debt_data.mortgage_balance) }}元
                    </el-descriptions-item>
                  </el-descriptions>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>

          <el-tab-pane label="贷款资料" name="material">
            <div class="tab-content">
              <el-table :data="currentDetail.material_checks" border stripe size="small">
                <el-table-column prop="name" label="资料名称" width="150" />
                <el-table-column prop="required" label="是否必需" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag v-if="row.required" type="danger" size="small">必需</el-tag>
                    <el-tag v-else type="info" size="small">可选</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="has_value" label="是否齐全" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag :type="row.has_value ? 'success' : 'danger'" size="small">
                      {{ row.has_value ? '齐全' : '缺失' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="is_abnormal" label="是否异常" width="100" align="center"
                  :class-name="({ row }) => row.is_abnormal ? 'abnormal-field' : ''">
                  <template #default="{ row }">
                    <el-tag v-if="row.is_abnormal" type="danger" effect="dark" size="small">异常</el-tag>
                    <el-tag v-else type="success" size="small">正常</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="value" label="值" width="200" show-overflow-tooltip />
                <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
              </el-table>
            </div>
          </el-tab-pane>

          <el-tab-pane label="预审结论" name="pre-approval">
            <div v-if="currentDetail.pre_approval_conclusion" class="tab-content">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="预审结果">
                  <el-tag :type="currentDetail.pre_approval_conclusion.pre_check_passed ? 'success' : 'danger'">
                    {{ currentDetail.pre_approval_conclusion.pre_check_passed ? '通过' : '未通过' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="预审人">
                  {{ currentDetail.pre_approval_conclusion.pre_reviewer }}
                </el-descriptions-item>
                <el-descriptions-item label="预审时间">
                  {{ currentDetail.pre_approval_conclusion.pre_review_time }}
                </el-descriptions-item>
                <el-descriptions-item label="风险等级">
                  {{ currentDetail.pre_approval_conclusion.risk_level }}级
                </el-descriptions-item>
                <el-descriptions-item label="建议额度" :span="2">
                  <span class="text-success">{{ formatThousands(currentDetail.pre_approval_conclusion.suggested_amount) }}元</span>
                </el-descriptions-item>
                <el-descriptions-item label="建议期限">
                  {{ currentDetail.pre_approval_conclusion.suggested_term }}个月
                </el-descriptions-item>
                <el-descriptions-item label="风险标签">
                  <el-tag
                    v-for="(tag, i) in currentDetail.pre_approval_conclusion.risk_tags"
                    :key="i"
                    size="small"
                    style="margin-right: 5px;"
                  >
                    {{ tag }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="特别说明" :span="2">
                  {{ currentDetail.pre_approval_conclusion.special_notes }}
                </el-descriptions-item>
                <el-descriptions-item label="预审意见" :span="2">
                  {{ currentDetail.pre_approval_conclusion.pre_review_opinion }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </el-tab-pane>

          <el-tab-pane label="审批流程" name="flow">
            <div class="tab-content">
              <el-steps
                :active="currentDetail.current_level - 1"
                finish-status="success"
                class="approval-steps"
              >
                <el-step
                  v-for="(flow, index) in currentDetail.approval_flow"
                  :key="flow.id"
                  :title="flow.current_level_text"
                  :description="flow.approver_name ? `${flow.approver_name} - ${flow.approve_time}` : '待审批'"
                  :status="getStepStatus(flow)"
                />
              </el-steps>

              <div v-if="currentDetail.approval_logs && currentDetail.approval_logs.length > 0" class="approval-logs">
                <h4>操作日志</h4>
                <el-timeline>
                  <el-timeline-item
                    v-for="log in currentDetail.approval_logs"
                    :key="log.id"
                    :timestamp="log.operation_time"
                    :type="log.approval_result === 1 ? 'success' : log.approval_result === 2 ? 'danger' : 'primary'"
                  >
                    <div class="log-item">
                      <span class="log-operator">{{ log.operator_name }}</span>
                      <el-tag size="small">{{ log.approval_level_text }}</el-tag>
                      <span class="log-action">
                        {{ log.approval_result === 1 ? '通过' : log.approval_result === 2 ? '驳回' : '操作' }}
                      </span>
                      <span v-if="log.approval_opinion" class="log-opinion">
                        意见：{{ log.approval_opinion }}
                      </span>
                      <el-tag
                        v-if="log.conflict_flag"
                        type="danger"
                        size="small"
                        effect="dark"
                      >
                        存在冲突
                      </el-tag>
                    </div>
                  </el-timeline-item>
                </el-timeline>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>

        <div v-if="!currentDetail.approval_locked && canApproveCurrentLevel" class="approval-action-section">
          <el-divider />
          <el-form :model="approvalForm" :rules="approvalRules" ref="approvalFormRef" label-width="100px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="审批结果" prop="approval_result">
                  <el-radio-group v-model="approvalForm.approval_result">
                    <el-radio :value="1" class="ripple-btn">通过</el-radio>
                    <el-radio :value="2" class="ripple-btn">驳回</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="12" v-if="approvalForm.approval_result === 2">
                <el-form-item label="驳回原因" prop="reject_reason">
                  <el-select v-model="approvalForm.reject_reason" placeholder="请选择驳回原因" style="width: 100%">
                    <el-option
                      v-for="item in REJECT_REASON_OPTIONS"
                      :key="item.code"
                      :label="item.label"
                      :value="item.code"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="审批意见" prop="approval_opinion">
              <el-input
                v-model="approvalForm.approval_opinion"
                type="textarea"
                :rows="3"
                :placeholder="approvalForm.approval_result === 2 ? '请详细填写驳回原因说明' : '请填写审批意见（选填）'"
              />
            </el-form-item>
            <el-form-item v-if="approvalForm.approval_result === 2" label="详细说明" prop="reject_details">
              <el-input
                v-model="approvalForm.reject_details"
                type="textarea"
                :rows="3"
                placeholder="请详细填写驳回说明，将同步通知客户端"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showApproval = false">关闭</el-button>
          <template v-if="!currentDetail?.approval_locked && canApproveCurrentLevel">
            <el-button
              type="primary"
              :loading="submitting"
              @click="submitApproval"
              :class="{ 'ripple-effect': true }"
            >
              {{ submitting ? '提交中...' : '提交审批' }}
            </el-button>
          </template>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Clock, CircleCheck, CircleClose, Warning, Refresh, Files, Search, User, CreditCard } from '@element-plus/icons-vue'
import { LOAN_TYPE_OPTIONS } from '@api/loan'
import {
  APPROVAL_LEVEL_OPTIONS,
  REJECT_REASON_OPTIONS,
  formatThousands,
  type BatchApprovalItem,
  type ApprovalDetailVO,
  type DoApprovalRequest,
  getPendingApprovalListApi,
  getApprovalDetailApi,
  doApprovalApi
} from '@api/loanApproval'

const router = useRouter()

const loading = ref(false)
const tableData = ref<BatchApprovalItem[]>([])
const total = ref(0)
const pendingCount = ref(0)
const approvedCount = ref(0)
const rejectedCount = ref(0)
const highRiskCount = ref(0)

const searchForm = reactive({
  loan_no: '',
  customer_name: '',
  loan_type: undefined as number | undefined,
  risk_level: undefined as number | undefined,
  current_level: undefined as number | undefined,
  is_high_risk: false
})

const pageParams = reactive({ page: 1, pageSize: 10 })

const showApproval = ref(false)
const currentDetail = ref<ApprovalDetailVO | null>(null)
const activeTab = ref('credit')
const submitting = ref(false)

const approvalFormRef = ref<FormInstance>()
const approvalForm = reactive<DoApprovalRequest>({
  loan_id: '',
  approval_level: 1,
  approval_result: 1,
  approval_opinion: '',
  reject_reason: '',
  reject_details: ''
})

const approvalRules: FormRules = {
  approval_result: [{ required: true, message: '请选择审批结果', trigger: 'change' }],
  approval_opinion: [
    {
      validator: (_rule, value, callback) => {
        if (approvalForm.approval_result === 2 && !value) {
          callback(new Error('驳回时请填写审批意见'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  reject_reason: [
    {
      validator: (_rule, value, callback) => {
        if (approvalForm.approval_result === 2 && !value) {
          callback(new Error('请选择驳回原因'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  reject_details: [
    {
      validator: (_rule, value, callback) => {
        if (approvalForm.approval_result === 2 && !value) {
          callback(new Error('请填写详细驳回说明'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const canApproveCurrentLevel = computed(() => {
  if (!currentDetail.value) return false
  const currentFlow = currentDetail.value.approval_flow?.find(f => f.is_current_level)
  return currentFlow?.can_approve || false
})

async function loadList() {
  loading.value = true
  try {
    const params: any = {
      page: pageParams.page,
      pageSize: pageParams.pageSize,
      loan_no: searchForm.loan_no || undefined,
      customer_name: searchForm.customer_name || undefined,
      loan_type: searchForm.loan_type,
      risk_level: searchForm.risk_level,
      current_level: searchForm.current_level,
      is_high_risk: searchForm.is_high_risk || undefined
    }
    const result = await getPendingApprovalListApi(params)
    tableData.value = result.list
    total.value = result.total

    pendingCount.value = result.list.filter(r => r.can_batch_approve || r.is_high_risk).length
    highRiskCount.value = result.list.filter(r => r.is_high_risk).length
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pageParams.page = 1
  loadList()
}

function handleReset() {
  searchForm.loan_no = ''
  searchForm.customer_name = ''
  searchForm.loan_type = undefined
  searchForm.risk_level = undefined
  searchForm.current_level = undefined
  searchForm.is_high_risk = false
  pageParams.page = 1
  loadList()
}

function handlePageChange() {
  loadList()
}

async function openApprovalDetail(row: BatchApprovalItem) {
  try {
    currentDetail.value = await getApprovalDetailApi(row.loan_id)
    approvalForm.loan_id = row.loan_id
    approvalForm.approval_level = currentDetail.value.current_level
    approvalForm.approval_result = 1
    approvalForm.approval_opinion = ''
    approvalForm.reject_reason = ''
    approvalForm.reject_details = ''
    activeTab.value = 'credit'
    showApproval.value = true
  } catch (e: any) {
    ElMessage.error(e.message || '获取审批详情失败')
  }
}

async function submitApproval() {
  if (!approvalFormRef.value || !currentDetail.value) return

  try {
    await approvalFormRef.value.validate()
  } catch (e) {
    return
  }

  ElMessageBox.confirm(
    `确定要${approvalForm.approval_result === 1 ? '通过' : '驳回'}该笔贷款${currentDetail.value.current_level_text}吗？`,
    '审批确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: approvalForm.approval_result === 1 ? 'success' : 'warning'
    }
  ).then(async () => {
    submitting.value = true
    try {
      const request: DoApprovalRequest = {
        loan_id: approvalForm.loan_id,
        approval_level: approvalForm.approval_level,
        approval_result: approvalForm.approval_result,
        approval_opinion: approvalForm.approval_opinion || undefined,
        reject_reason: approvalForm.approval_result === 2 ? approvalForm.reject_reason : undefined,
        reject_details: approvalForm.approval_result === 2 ? approvalForm.reject_details : undefined
      }
      const result = await doApprovalApi(request)
      ElMessage.success(result.message || '审批提交成功')

      if (result.contract_generated) {
        ElMessage.success(`贷款合同已生成：${result.contract_no}`)
      }

      showApproval.value = false
      loadList()
    } catch (e: any) {
      ElMessage.error(e.message || '审批提交失败')
    } finally {
      submitting.value = false
    }
  }).catch(() => {})
}

function handleDialogClose() {
  currentDetail.value = null
}

function getCreditScoreClass(score: number): string {
  if (score >= 800) return 'excellent'
  if (score >= 700) return 'good'
  if (score >= 600) return 'fair'
  return 'poor'
}

function getDebtRatioClass(ratio: number): string {
  if (ratio >= 50) return 'danger'
  if (ratio >= 30) return 'warning'
  return 'safe'
}

function getStepStatus(flow: any): string {
  if (flow.approval_result === 1) return 'success'
  if (flow.approval_result === 2) return 'error'
  if (flow.is_current_level) return 'process'
  return ''
}

function goBatch() {
  router.push('/business/loan/approval/batch')
}

function goTrace() {
  router.push('/business/loan/approval/trace')
}

onMounted(() => {
  loadList()
})
</script>

<style lang="scss" scoped>
.ccb-loan-approval {
  .approval-stats {
    margin-bottom: 20px;

    .stat-card {
      display: flex;
      align-items: center;
      padding: 20px;
      background: #fff;
      border-radius: 8px;
      border: 1px solid var(--el-border-color-lighter);
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: #fff;
        margin-right: 16px;
      }

      &.pending .stat-icon {
        background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
      }

      &.approved .stat-icon {
        background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
      }

      &.rejected .stat-icon {
        background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      }

      &.high-risk .stat-icon {
        background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
      }

      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        line-height: 1.2;
      }

      .stat-label {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin-top: 4px;
      }
    }
  }

  .list-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-actions {
        display: flex;
        gap: 10px;
      }
    }
  }

  .amount-number {
    color: var(--el-color-primary);
    font-weight: 600;
  }

  .amount {
    color: var(--el-color-primary);
    font-weight: 600;
  }

  .text-danger {
    color: var(--el-color-danger);
    font-weight: 600;
  }

  .text-success {
    color: var(--el-color-success);
    font-weight: 600;
  }

  .text-warning {
    color: var(--el-color-warning);
    font-weight: 600;
  }

  .approval-detail-dialog {
    :deep(.el-dialog__body) {
      padding-top: 10px;
      max-height: 70vh;
      overflow-y: auto;
    }
  }

  .info-section {
    margin-bottom: 20px;

    .info-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;

      .info-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--el-border-color-lighter);
      }

      .info-item {
        display: flex;
        margin-bottom: 8px;
        font-size: 13px;

        .label {
          color: var(--el-text-color-secondary);
          width: 80px;
        }

        .value {
          color: var(--el-text-color-primary);
          flex: 1;

          &.amount {
            color: var(--el-color-primary);
            font-weight: 600;
          }
        }
      }

      &.risk-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;

        .info-title {
          border-bottom-color: rgba(255, 255, 255, 0.2);
        }

        .info-item .label {
          color: rgba(255, 255, 255, 0.8);
        }

        .info-item .value {
          color: #fff;
        }

        .risk-level {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 12px;

          .risk-label {
            color: rgba(255, 255, 255, 0.8);
          }

          .risk-value {
            font-size: 32px;
            font-weight: 700;

            &.success { color: #67c23a; }
            &.warning { color: #e6a23c; }
            &.danger { color: #f56c6c; }
          }
        }

        .risk-tags {
          margin-bottom: 16px;

          :deep(.el-tag) {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.3);
            color: #fff;
          }
        }

        .approval-progress {
          .progress-label {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            color: rgba(255, 255, 255, 0.9);
          }

          .progress-info {
            margin-top: 8px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
          }
        }

        &.high-risk {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
        }
      }
    }
  }

  .approval-tabs {
    .tab-content {
      padding: 10px 0;
    }
  }

  .credit-score-card {
    text-align: center;
    padding: 30px 20px;
    background: #f8f9fa;
    border-radius: 8px;

    .score-value {
      font-size: 48px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 8px;

      &.excellent { color: #67c23a; }
      &.good { color: #409eff; }
      &.fair { color: #e6a23c; }
      &.poor { color: #f56c6c; }
    }

    .score-label {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin-bottom: 4px;
    }

    .score-level {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .debt-ratio-card {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;

    .ratio-circle {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 4px solid;

      &.safe {
        border-color: #67c23a;
        background: rgba(103, 194, 58, 0.1);
      }

      &.warning {
        border-color: #e6a23c;
        background: rgba(230, 162, 60, 0.1);
      }

      &.danger {
        border-color: #f56c6c;
        background: rgba(245, 108, 108, 0.1);
      }

      .ratio-value {
        font-size: 36px;
        font-weight: 700;
        line-height: 1;
      }

      .ratio-label {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin-top: 4px;
      }
    }
  }

  :deep(.abnormal-field) {
    animation: highlight-pulse 1.5s ease-in-out infinite;
    background-color: rgba(245, 108, 108, 0.1) !important;
  }

  @keyframes highlight-pulse {
    0%, 100% { background-color: rgba(245, 108, 108, 0.1); }
    50% { background-color: rgba(245, 108, 108, 0.25); }
  }

  .approval-steps {
    margin-bottom: 30px;
  }

  .approval-logs {
    margin-top: 30px;

    h4 {
      margin-bottom: 16px;
      color: var(--el-text-color-primary);
    }

    .log-item {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;

      .log-operator {
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .log-action {
        font-weight: 600;
      }

      .log-opinion {
        color: var(--el-text-color-secondary);
        font-size: 13px;
      }
    }
  }

  .approval-action-section {
    margin-top: 20px;
  }

  .ripple-btn {
    position: relative;
    overflow: hidden;
  }

  .ripple-effect {
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }

    &:active::after {
      width: 300px;
      height: 300px;
      transition: 0s;
    }
  }

  :deep(.approval-row:hover) {
    transform: scale(1.003);
    transition: transform 0.2s ease;
  }

  .mb15 {
    margin-bottom: 15px;
  }
}
</style>
