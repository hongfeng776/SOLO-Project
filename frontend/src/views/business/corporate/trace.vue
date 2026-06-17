<template>
  <div class="ccb-business-corporate-trace">
    <CcbPageHeader
      title="企业开户溯源"
      description="通过统一社会信用代码溯源历史开户/销户/异常，拦截失信/经营异常企业"
      icon="Connection"
    />

    <el-card class="trace-search-card" shadow="never">
      <el-form :model="searchForm" inline class="trace-search">
        <el-form-item label="统一社会信用代码" prop="creditCode">
          <el-input
            v-model="searchForm.creditCode"
            placeholder="请输入18位统一社会信用代码"
            maxlength="18"
            clearable
            style="width: 320px"
          />
        </el-form-item>
        <el-form-item label="企业名称" prop="enterpriseName">
          <el-input v-model="searchForm.enterpriseName" placeholder="请输入企业名称（选填）" style="width: 220px" clearable />
        </el-form-item>
        <el-form-item label="法人身份证号" prop="legalIdCardNo">
          <el-input
            v-model="searchForm.legalIdCardNo"
            placeholder="法人身份证号（选填，校验实名）"
            maxlength="18"
            clearable
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="经办人身份证号" prop="agentIdCardNo">
          <el-input
            v-model="searchForm.agentIdCardNo"
            placeholder="经办人身份证号（选填，校验实名）"
            maxlength="18"
            clearable
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="handleTrace">
            <span class="ripple-btn">开始溯源</span>
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div v-if="loading" class="trace-skeleton">
      <el-row :gutter="16">
        <el-col :span="8"><el-skeleton :rows="3" animated /></el-col>
        <el-col :span="8"><el-skeleton :rows="3" animated /></el-col>
        <el-col :span="8"><el-skeleton :rows="3" animated /></el-col>
      </el-row>
      <el-skeleton :rows="4" animated style="margin-top: 16px" />
      <el-skeleton :rows="6" animated style="margin-top: 16px" />
    </div>

    <div v-else-if="traceResult" class="trace-result">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon matched"><Connection /></div>
            <div class="stat-info">
              <div class="stat-label">历史开户数</div>
              <div class="stat-num">{{ traceResult.totalOpenings }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon closed"><SwitchButton /></div>
            <div class="stat-info">
              <div class="stat-label">已销户数</div>
              <div class="stat-num">{{ traceResult.totalClosed }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" :class="traceResult.totalAbnormal > 0 ? 'danger' : 'success'">
              <Warning v-if="traceResult.totalAbnormal > 0" />
              <CircleCheckFilled v-else />
            </div>
            <div class="stat-info">
              <div class="stat-label">异常记录数</div>
              <div class="stat-num" :class="traceResult.totalAbnormal > 0 ? 'danger' : 'success'">
                {{ traceResult.totalAbnormal }}
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" :class="traceResult.allowed ? 'success' : 'danger'">
              <CircleCheckFilled v-if="traceResult.allowed" />
              <CircleCloseFilled v-else />
            </div>
            <div class="stat-info">
              <div class="stat-label">是否允许开户</div>
              <div class="stat-num" :class="traceResult.allowed ? 'success' : 'danger'">
                {{ traceResult.allowed ? '允许' : '禁止' }}
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card
        v-if="traceResult.isDishonest || traceResult.isAbnormal || !traceResult.allowed || traceResult.riskPrompts.length > 0"
        shadow="never"
        class="alert-card"
      >
        <el-alert
          v-if="traceResult.isDishonest"
          title="该企业已被列入失信被执行人名单，开户申请已被拦截"
          type="error"
          show-icon
          :closable="false"
          style="margin-bottom: 12px"
        />
        <el-alert
          v-if="traceResult.isAbnormal"
          title="该企业存在经营异常，请审慎核实后再处理"
          type="warning"
          show-icon
          :closable="false"
          style="margin-bottom: 12px"
        />
        <el-alert
          v-if="!traceResult.allowed && !traceResult.isDishonest && !traceResult.isAbnormal"
          :title="'开户申请已被拦截：' + (traceResult.blockReason || '')"
          type="error"
          show-icon
          :closable="false"
          style="margin-bottom: 12px"
        >
          <template v-if="traceResult.blockReason && traceResult.blockReason.length > 80" #default>
            <el-tooltip :content="traceResult.blockReason" placement="top" raw-content>
              <span class="long-block">{{ traceResult.blockReason }}</span>
            </el-tooltip>
          </template>
        </el-alert>
        <div v-if="traceResult.riskPrompts.length > 0" class="risk-prompts">
          <span class="prompts-label">风险提示：</span>
          <el-tag
            v-for="(prompt, i) in traceResult.riskPrompts"
            :key="i"
            type="warning"
            effect="light"
            style="margin-right: 6px; margin-top: 4px"
          >
            <el-tooltip v-if="prompt.length > 20" :content="prompt" placement="top" raw-content>
              <span class="short-text">{{ prompt.length > 20 ? prompt.slice(0, 20) + '…' : prompt }}</span>
            </el-tooltip>
            <span v-else>{{ prompt }}</span>
          </el-tag>
        </div>
      </el-card>

      <el-card shadow="never" class="checks-card">
        <template #header>
          <div class="card-header">
            <span>实名关联校验</span>
          </div>
        </template>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="法人实名">
            <el-tag :type="traceResult.legalVerified ? 'success' : 'danger'" effect="light">
              {{ traceResult.legalVerified ? '已认证' : '未认证/不匹配' }}
            </el-tag>
            <el-tooltip
              v-if="!traceResult.legalVerified && searchForm.legalIdCardNo"
              content="法人身份证号与工商登记信息不匹配或未实名"
              placement="top"
            >
              <el-icon class="warn-icon"><Warning /></el-icon>
            </el-tooltip>
          </el-descriptions-item>
          <el-descriptions-item label="经办人实名">
            <el-tag :type="traceResult.agentVerified ? 'success' : (searchForm.agentIdCardNo ? 'danger' : 'info')" effect="light">
              {{ traceResult.agentVerified ? '已认证' : (searchForm.agentIdCardNo ? '未认证/不匹配' : '未核验') }}
            </el-tag>
            <el-tooltip
              v-if="!traceResult.agentVerified && searchForm.agentIdCardNo"
              content="经办人身份证号与授权委托书信息不匹配或未实名"
              placement="top"
            >
              <el-icon class="warn-icon"><Warning /></el-icon>
            </el-tooltip>
          </el-descriptions-item>
          <el-descriptions-item label="拦截状态">
            <el-tag :type="(traceResult.isDishonest || traceResult.isAbnormal) ? 'danger' : 'success'" effect="dark">
              {{ (traceResult.isDishonest || traceResult.isAbnormal) ? '已拦截' : '正常放行' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="信用代码" :span="3">
            <span class="mono-text">{{ traceResult.creditCode }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card shadow="never" class="history-card">
        <template #header>
          <div class="card-header">
            <span>历史开户/销户/异常记录</span>
            <div>
              <el-tag v-if="traceResult.historyRecords.length === 0" type="info">暂无历史记录</el-tag>
              <el-button type="primary" link size="small" style="margin-left: 12px" @click="openDetailDialog">
                查看全部详情
              </el-button>
            </div>
          </div>
        </template>
        <CcbTable
          v-if="traceResult.historyRecords.length > 0"
          v-model:page="page"
          v-model:page-size="pageSize"
          :data="pagedRecords"
          :total="traceResult.historyRecords.length"
          :show-index="true"
          stripe
          row-class-name="history-row"
        >
          <el-table-column prop="openingNo" label="申请流水号" width="220" />
          <el-table-column prop="accountType" label="账户类型" width="140">
            <template #default="{ row }">
              {{ CorporateAccountTypeText[row.accountType] || '未知' }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getHistoryStatusType(row.status)" effect="light" size="small">
                {{ getHistoryStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="targetOrgName" label="开户机构" width="200" />
          <el-table-column prop="createdAt" label="申请时间" width="180" />
          <el-table-column prop="closeDate" label="销户时间" width="180">
            <template #default="{ row }">
              <span v-if="row.closeDate">{{ row.closeDate }}</span>
              <span v-else class="empty">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="abnormalReason" label="异常原因" min-width="200">
            <template #default="{ row }">
              <template v-if="row.abnormalReason">
                <el-tooltip :content="row.abnormalReason" placement="top" :show-after="200" raw-content>
                  <span class="abnormal-text">{{ row.abnormalReason }}</span>
                </el-tooltip>
              </template>
              <span v-else class="empty">-</span>
            </template>
          </el-table-column>
        </CcbTable>
      </el-card>
    </div>

    <el-dialog
      v-model="showDetailDialog"
      title="历史记录详情"
      width="900px"
      destroy-on-close
      class="trace-detail-dialog"
    >
      <el-table :data="traceResult?.historyRecords || []" border stripe size="small" max-height="480">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="openingNo" label="申请流水号" width="220" />
        <el-table-column label="账户类型" width="140">
          <template #default="{ row }">
            {{ CorporateAccountTypeText[row.accountType] || '未知' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getHistoryStatusType(row.status)" effect="light" size="small">
              {{ getHistoryStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="targetOrgName" label="开户机构" width="180" />
        <el-table-column prop="createdAt" label="申请时间" width="170" />
        <el-table-column prop="closeDate" label="销户时间" width="170">
          <template #default="{ row }">
            <span v-if="row.closeDate">{{ row.closeDate }}</span>
            <span v-else class="empty">-</span>
          </template>
        </el-table-column>
        <el-table-column label="异常原因" min-width="200">
          <template #default="{ row }">
            <template v-if="row.abnormalReason">
              <el-tooltip :content="row.abnormalReason" placement="top" raw-content>
                <span class="abnormal-text">{{ row.abnormalReason }}</span>
              </el-tooltip>
            </template>
            <span v-else class="empty">-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Search, Warning, CircleCheckFilled, CircleCloseFilled, Connection, SwitchButton } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  traceCheckCorporateOpeningApi,
  type CorporateTraceCheckResponse,
  CorporateAccountTypeText
} from '@api/business'
import { AccountOpeningStatusText } from '@api/account'

const loading = ref<boolean>(false)
const traceResult = ref<CorporateTraceCheckResponse | null>(null)
const showDetailDialog = ref<boolean>(false)
const page = ref(1)
const pageSize = ref(5)

const searchForm = reactive({
  creditCode: '',
  enterpriseName: '',
  legalIdCardNo: '',
  agentIdCardNo: ''
})

const pagedRecords = computed(() => {
  if (!traceResult.value) return []
  const start = (page.value - 1) * pageSize.value
  return traceResult.value.historyRecords.slice(start, start + pageSize.value)
})

const getHistoryStatusType = (s: number): string => {
  if (s === 5) return 'success'
  if (s === 3 || s === 4) return 'warning'
  if (s === 6 || s === 8) return 'danger'
  if (s === 7) return 'info'
  return 'primary'
}
const getHistoryStatusLabel = (s: number) => AccountOpeningStatusText[s] || '未知'

const validateCreditCode = (code: string): boolean => {
  return /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/.test(code)
}

const validateIdCard = (code: string): boolean => {
  if (!code) return true
  return /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(code)
}

const openDetailDialog = () => {
  showDetailDialog.value = true
}

const handleTrace = async () => {
  if (!validateCreditCode(searchForm.creditCode)) {
    ElMessage.error('请输入正确的18位统一社会信用代码')
    return
  }
  if (searchForm.legalIdCardNo && !validateIdCard(searchForm.legalIdCardNo)) {
    ElMessage.error('法人身份证号格式不正确')
    return
  }
  if (searchForm.agentIdCardNo && !validateIdCard(searchForm.agentIdCardNo)) {
    ElMessage.error('经办人身份证号格式不正确')
    return
  }
  loading.value = true
  traceResult.value = null
  try {
    traceResult.value = await traceCheckCorporateOpeningApi({
      creditCode: searchForm.creditCode,
      enterpriseName: searchForm.enterpriseName || undefined,
      legalIdCardNo: searchForm.legalIdCardNo || undefined,
      agentIdCardNo: searchForm.agentIdCardNo || undefined
    })
  } catch (e: any) {
    ElMessage.error(e.message || '溯源查询失败')
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  searchForm.creditCode = ''
  searchForm.enterpriseName = ''
  searchForm.legalIdCardNo = ''
  searchForm.agentIdCardNo = ''
  traceResult.value = null
}
</script>

<style lang="scss" scoped>
.ccb-business-corporate-trace {
  .trace-search-card { margin-bottom: 16px; }
  .trace-search { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 4px; }
  .trace-skeleton { padding: 8px 0; }
  .trace-result { display: flex; flex-direction: column; gap: 16px; }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 16px;
    border-radius: 10px;
    overflow: hidden;
  }
  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    color: #fff;
    flex-shrink: 0;
    &.matched { background: linear-gradient(135deg, #1755a3, #2f80ff); }
    &.closed { background: linear-gradient(135deg, #909399, #b1b3b8); }
    &.success { background: linear-gradient(135deg, #67c23a, #95d475); }
    &.danger { background: linear-gradient(135deg, #f56c6c, #ff8f8f); }
    & :deep(.el-icon) { font-size: 28px; }
  }
  .stat-info { flex: 1; min-width: 0; }
  .stat-label { color: #909399; font-size: 13px; margin-bottom: 4px; }
  .stat-num {
    font-size: 26px;
    font-weight: 700;
    color: #303133;
    &.success { color: #67c23a; }
    &.danger { color: #f56c6c; }
  }

  .card-header { display: flex; align-items: center; justify-content: space-between; font-weight: 600; }
  .alert-card { background: #fffbe6; border-radius: 10px; }
  .risk-prompts {
    margin-top: 8px;
    padding: 10px 12px;
    background: rgba(230, 162, 60, 0.08);
    border-radius: 6px;
    .prompts-label { color: #e6a23c; font-weight: 600; margin-right: 4px; }
  }

  .checks-card { border-radius: 10px; }
  .warn-icon { color: #e6a23c; margin-left: 4px; vertical-align: middle; }
  .mono-text { font-family: 'Consolas', 'Monaco', 'Courier New', monospace; letter-spacing: 0.5px; }

  .history-card { border-radius: 10px; }
  .long-block {
    display: inline-block;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .short-text { cursor: help; }
  .abnormal-text {
    color: #f56c6c;
    cursor: help;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .empty { color: #c0c4cc; }
  .ripple-btn { position: relative; overflow: hidden; }

  :deep(.history-row) {
    &:hover {
      background-color: rgba(23, 85, 163, 0.04);
    }
  }
}

:deep(.trace-detail-dialog) {
  .el-dialog {
    animation: zoomFadeIn 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    transform-origin: center center;
  }
}

@keyframes zoomFadeIn {
  0% {
    opacity: 0;
    transform: scale(0.85);
  }
  60% {
    opacity: 1;
    transform: scale(1.02);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
