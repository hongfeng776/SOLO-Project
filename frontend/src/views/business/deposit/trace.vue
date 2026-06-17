<template>
  <div class="ccb-business-deposit-trace">
    <CcbPageHeader
      title="存款溯源查询"
      description="通过客户账号、存款流水号溯源存款办理全记录"
      icon="Search"
    />

    <el-card shadow="hover" class="mb15">
      <template #header>
        <span class="card-title">溯源条件</span>
      </template>
      <el-form :model="traceForm" inline>
        <el-form-item label="客户账号">
          <el-input
            v-model="traceForm.account_no"
            placeholder="请输入客户账号"
            clearable
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="存款流水号">
          <el-input
            v-model="traceForm.deposit_no"
            placeholder="请输入存款流水号"
            clearable
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="客户号">
          <el-input
            v-model="traceForm.customer_no"
            placeholder="请输入客户号"
            clearable
            style="width: 220px"
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

    <el-row :gutter="20" class="mb15" v-if="traceResult">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">存款总笔数</div>
          <div class="stat-value text-primary">{{ traceResult.total_count }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">存款总金额</div>
          <div class="stat-value text-success">{{ formatThousands(traceResult.total_amount) }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card" :class="{ 'card-error': traceResult.duplicate_check.has_duplicate }">
          <div class="stat-label">重复存款检测</div>
          <div class="stat-value">
            <el-icon v-if="traceResult.duplicate_check.has_duplicate" class="text-danger"><Warning /></el-icon>
            <span :class="traceResult.duplicate_check.has_duplicate ? 'text-danger' : 'text-success'">
              {{ traceResult.duplicate_check.has_duplicate ? '发现异常' : '正常' }}
            </span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card" :class="{ 'card-error': traceResult.amount_anomaly_check.has_anomaly }">
          <div class="stat-label">金额异常检测</div>
          <div class="stat-value">
            <el-icon v-if="traceResult.amount_anomaly_check.has_anomaly" class="text-danger"><Warning /></el-icon>
            <span :class="traceResult.amount_anomaly_check.has_anomaly ? 'text-danger' : 'text-success'">
              {{ traceResult.amount_anomaly_check.has_anomaly ? '发现异常' : '正常' }}
            </span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb15" v-if="traceResult">
      <el-col :span="12">
        <el-card shadow="hover" class="stat-card" :class="{ 'card-error': traceResult.rate_match_check.has_mismatch }">
          <template #header>
            <div class="card-header-flex">
              <span class="card-title">利率匹配校验</span>
              <el-tag :type="traceResult.rate_match_check.has_mismatch ? 'danger' : 'success'" effect="light">
                {{ traceResult.rate_match_check.has_mismatch ? '发现不匹配' : '全部匹配' }}
              </el-tag>
            </div>
          </template>
          <el-table
            v-if="traceResult.rate_match_check.mismatches.length > 0"
            :data="traceResult.rate_match_check.mismatches"
            border
            size="small"
          >
            <el-table-column prop="deposit_no" label="存款流水号" width="200" />
            <el-table-column prop="deposit_type" label="存款类型" width="100">
              <template #default="{ row }">
                {{ getDepositTypeLabel(row.deposit_type) }}
              </template>
            </el-table-column>
            <el-table-column prop="term" label="存期" width="100">
              <template #default="{ row }">
                {{ getTermLabel(row.term) }}
              </template>
            </el-table-column>
            <el-table-column prop="applied_rate" label="执行利率(%)" width="110" align="right" />
            <el-table-column prop="expected_rate" label="应执行利率(%)" width="120" align="right" />
            <el-table-column prop="diff" label="差值(%)" width="90" align="right">
              <template #default="{ row }">
                <span class="text-danger">{{ row.diff > 0 ? '+' : '' }}{{ row.diff }}</span>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="所有存款利率匹配正确" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="stat-card" :class="{ 'card-error': traceResult.risk_prompts.length > 0 }">
          <template #header>
            <div class="card-header-flex">
              <span class="card-title">风险提示</span>
              <el-badge :value="traceResult.risk_prompts.length" :hidden="traceResult.risk_prompts.length === 0" class="item">
                <el-tag :type="traceResult.validation_passed ? 'success' : 'danger'" effect="light">
                  {{ traceResult.validation_passed ? '校验通过' : '校验不通过' }}
                </el-tag>
              </el-badge>
            </div>
          </template>
          <div v-if="traceResult.risk_prompts.length > 0" class="risk-list">
            <el-alert
              v-for="(prompt, idx) in traceResult.risk_prompts"
              :key="idx"
              :title="prompt"
              type="warning"
              show-icon
              :closable="false"
              class="mb10"
            />
          </div>
          <el-empty v-else description="暂无风险提示" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb15" v-if="traceResult && traceResult.duplicate_check.duplicates.length > 0">
      <el-col :span="12">
        <el-card shadow="hover" class="card-error">
          <template #header>
            <span class="card-title">重复存款检测明细</span>
          </template>
          <el-table :data="traceResult.duplicate_check.duplicates" border size="small">
            <el-table-column prop="deposit_no" label="存款流水号" width="200" />
            <el-table-column prop="amount" label="存款金额" width="140" align="right">
              <template #default="{ row }">
                <span class="amount-positive">{{ formatThousands(row.amount) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="create_time" label="办理时间" width="160" />
            <el-table-column prop="time_diff_minutes" label="时间差(分钟)" width="120" align="right">
              <template #default="{ row }">
                <el-tag type="danger" effect="light" size="small">{{ row.time_diff_minutes }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12" v-if="traceResult.amount_anomaly_check.anomalies.length > 0">
        <el-card shadow="hover" class="card-error">
          <template #header>
            <span class="card-title">金额异常检测明细</span>
          </template>
          <el-table :data="traceResult.amount_anomaly_check.anomalies" border size="small">
            <el-table-column prop="deposit_no" label="存款流水号" width="200" />
            <el-table-column prop="amount" label="存款金额" width="140" align="right">
              <template #default="{ row }">
                <span class="amount-positive">{{ formatThousands(row.amount) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="average_amount" label="历史平均" width="140" align="right">
              <template #default="{ row }">
                {{ formatThousands(row.average_amount) }}
              </template>
            </el-table-column>
            <el-table-column prop="deviation_percent" label="偏离度(%)" width="110" align="right">
              <template #default="{ row }">
                <el-tag type="danger" effect="light" size="small">{{ row.deviation_percent }}%</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover" v-if="traceResult">
      <template #header>
        <span class="card-title">存款明细记录</span>
        <el-text type="info" size="small">共 {{ traceResult.records.length }} 条记录</el-text>
      </template>
      <el-table
        :data="traceResult.records"
        border
        stripe
        row-class-name="record-row"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="deposit_no" label="存款流水号" width="200" />
        <el-table-column prop="account_no" label="账号" width="160" />
        <el-table-column prop="customer_name" label="客户姓名" width="100" />
        <el-table-column prop="deposit_type_text" label="存款类型" width="110" />
        <el-table-column prop="product_name" label="产品名称" width="180" show-overflow-tooltip />
        <el-table-column prop="amount" label="存款金额" width="140" align="right">
          <template #default="{ row }">
            <span class="amount-positive">{{ formatThousands(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="term_text" label="存期" width="80" />
        <el-table-column prop="interest_rate" label="利率(%)" width="90" align="right" />
        <el-table-column prop="interest_amount" label="预计利息" width="120" align="right">
          <template #default="{ row }">
            <span class="amount-positive">{{ formatThousands(row.interest_amount || 0) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="maturity_date" label="到期日" width="110" />
        <el-table-column prop="operator_name" label="经办人" width="100" />
        <el-table-column prop="org_name" label="办理机构" width="120" />
        <el-table-column prop="createdAt" label="办理时间" width="160" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Warning } from '@element-plus/icons-vue'
import {
  DEPOSIT_TYPE_OPTIONS,
  DEPOSIT_STATUS_OPTIONS,
  DEPOSIT_TERM_OPTIONS,
  type DepositTraceRequest,
  type DepositTraceResult,
  traceDepositApi,
  formatThousands
} from '@api/deposit'

const loading = ref(false)
const traceResult = ref<DepositTraceResult | null>(null)

const traceForm = reactive<DepositTraceRequest>({
  account_no: '',
  deposit_no: '',
  customer_no: ''
})

const handleTrace = async () => {
  if (!traceForm.account_no && !traceForm.deposit_no && !traceForm.customer_no) {
    ElMessage.warning('请至少输入一项查询条件')
    return
  }
  loading.value = true
  try {
    const res = await traceDepositApi(traceForm)
    traceResult.value = res.data
    ElMessage.success(
      `溯源查询完成，共 ${res.data.total_count} 条记录`
    )
  } catch (e) {
    console.error('Failed to trace deposit:', e)
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  traceForm.account_no = ''
  traceForm.deposit_no = ''
  traceForm.customer_no = ''
  traceResult.value = null
}

const getDepositTypeLabel = (type: number) => {
  const opt = DEPOSIT_TYPE_OPTIONS.find(o => o.value === type)
  return opt?.label || '未知'
}

const getTermLabel = (term: number) => {
  const opt = DEPOSIT_TERM_OPTIONS.find(o => o.value === term)
  return opt?.label || '未知'
}

const getStatusType = (status: number) => {
  const opt = DEPOSIT_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.type || ''
}

const getStatusLabel = (status: number) => {
  const opt = DEPOSIT_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.label || '未知'
}
</script>

<style scoped>
.record-row:hover {
  transform: scale(1.005);
  transition: transform 0.2s ease;
}

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

.risk-list {
  max-height: 300px;
  overflow-y: auto;
}
</style>
