<template>
  <el-dialog :model-value="modelValue" @update:model-value="handleClose"
    :title="dialogTitle" width="1100px" :close-on-click-modal="false"
    class="provider-trace-dialog" destroy-on-close top="4vh">
    <div v-loading="loading" class="trace-container">
      <!-- 摘要卡片 -->
      <div class="summary-cards" v-if="summaryData">
        <el-row :gutter="12">
          <el-col :span="6">
            <div class="s-card s-qualification">
              <div class="s-title">
                <el-icon><Document /></el-icon> 合作资质
              </div>
              <div class="s-stats">
                <div class="stat-row"><span>总项</span><b>{{ summaryData.qualificationStats?.total || 0 }}</b></div>
                <div class="stat-row ok"><span>有效</span><b>{{ summaryData.qualificationStats?.valid || 0 }}</b></div>
                <div class="stat-row warn"><span>即将过期</span><b>{{ summaryData.qualificationStats?.expiringSoon || 0 }}</b></div>
                <div class="stat-row err"><span>已过期</span><b>{{ summaryData.qualificationStats?.expired || 0 }}</b></div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="s-card s-contract">
              <div class="s-title">
                <el-icon><Stamp /></el-icon> 签约合同
              </div>
              <div class="s-stats">
                <div class="stat-row"><span>签约次数</span><b>{{ summaryData.contractStats?.total || 0 }}</b></div>
                <div class="stat-row ok"><span>生效中</span><b>{{ summaryData.contractStats?.effective || 0 }}</b></div>
                <div class="stat-row warn"><span>待签约</span><b>{{ summaryData.contractStats?.pending || 0 }}</b></div>
                <div class="stat-row err"><span>已终止</span><b>{{ summaryData.contractStats?.terminated || 0 }}</b></div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="s-card s-fee">
              <div class="s-title">
                <el-icon><Money /></el-icon> 资费变动
              </div>
              <div class="s-stats">
                <div class="stat-row"><span>资费方案</span><b>{{ summaryData.feeStats?.total || 0 }}</b></div>
                <div class="stat-row ok"><span>生效方案</span><b>{{ summaryData.feeStats?.active || 0 }}</b></div>
                <div class="stat-row warn"><span>违规次数</span><b>{{ summaryData.feeStats?.violations || 0 }}</b></div>
                <div class="stat-row"><span>调整次数</span><b>{{ summaryData.feeStats?.changeCount || 0 }}</b></div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="s-card s-evaluation">
              <div class="s-title">
                <el-icon><Star /></el-icon> 服务质量
              </div>
              <div class="s-stats">
                <div class="stat-row"><span>评价总数</span><b>{{ summaryData.evaluationStats?.total || 0 }}</b></div>
                <div class="stat-row ok"><span>平均评分</span><b>{{ (summaryData.evaluationStats?.avgRating || 0).toFixed(2) }}</b></div>
                <div class="stat-row warn"><span>破损/丢件</span><b>{{ (summaryData.evaluationStats?.damageCount || 0) + (summaryData.evaluationStats?.lossCount || 0) }}</b></div>
                <div class="stat-row err"><span>赔付总额</span><b>¥{{ (summaryData.evaluationStats?.compensationTotal || 0).toLocaleString() }}</b></div>
              </div>
            </div>
          </el-col>
        </el-row>

        <!-- 合规评分条 -->
        <div class="compliance-bar" v-if="summaryData.complianceReport">
          <div class="compliance-head">
            <span class="c-label">多维度合规性检测报告</span>
            <el-tag :type="getComplianceTagType(summaryData.complianceReport.level)" size="small" effect="dark">
              等级：{{ getComplianceLevelLabel(summaryData.complianceReport.level) }}
            </el-tag>
            <span class="c-score">综合评分 <b>{{ summaryData.complianceReport.totalScore }}</b> / 100</span>
          </div>
          <el-progress :percentage="summaryData.complianceReport.totalScore"
            :color="getComplianceColor(summaryData.complianceReport.level)" :stroke-width="16" />
          <div class="compliance-issues" v-if="summaryData.complianceReport.issues?.length">
            <el-row :gutter="10">
              <el-col :span="6" v-for="(item, idx) in summaryData.complianceReport.issues" :key="idx">
                <div class="issue-card" :class="'level-' + Math.round(item.score / 25)">
                  <div class="issue-dim">{{ item.dimension }} <span class="issue-score">{{ item.score }}分</span></div>
                  <div class="issue-problem" v-if="item.problem">⚠️ {{ item.problem }}</div>
                  <div class="issue-suggestion" v-if="item.suggestion">💡 {{ item.suggestion }}</div>
                </div>
              </el-col>
            </el-row>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <el-tabs v-model="activeTab" class="trace-tabs" type="border-card">
        <!-- 资质 -->
        <el-tab-pane label="📋 合作资质" name="qualification">
          <el-table :data="qualifications" stripe size="default" border>
            <el-table-column label="序号" type="index" width="55" align="center" />
            <el-table-column prop="qualificationName" label="资质名称" width="140" />
            <el-table-column prop="certificateNo" label="证件编号" width="180">
              <template #default="{ row }">
                <span class="mono">{{ row.certificateNo || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="certificateHolder" label="持有人" width="160" show-overflow-tooltip />
            <el-table-column label="有效期" width="200" align="center">
              <template #default="{ row }">
                <span>{{ formatDate(row.validFrom) }} ~ {{ formatDate(row.expireDate) }}</span>
                <el-tag v-if="isExpiring(row)" size="small" :type="isExpired(row) ? 'danger' : 'warning'" style="margin-left: 6px">
                  {{ isExpired(row) ? '已过期' : '即将过期' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="qualStatusType(row.status)" size="small">
                  {{ qualStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="资质说明" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">
                <div v-if="row.description?.length > 40" class="hover-long-text">
                  {{ row.description.slice(0, 40) }}...
                  <el-tooltip placement="top" popper-class="long-text-tooltip" :content="row.description">
                    <span class="hover-hint"> (悬浮查看完整)</span>
                  </el-tooltip>
                </div>
                <span v-else>{{ row.description || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="审核信息" width="130">
              <template #default="{ row }">
                <div class="audit-info">
                  <span>{{ row.auditedByName || '-' }}</span>
                  <span class="audit-time">{{ formatDate(row.auditedAt) || '-' }}</span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 签约 -->
        <el-tab-pane label="📝 签约日志" name="contract">
          <el-table :data="contracts" stripe size="default" border>
            <el-table-column label="序号" type="index" width="55" align="center" />
            <el-table-column prop="contractNo" label="合同编号" width="150">
              <template #default="{ row }"><span class="mono">{{ row.contractNo || '-' }}</span></template>
            </el-table-column>
            <el-table-column prop="contractName" label="合同名称" min-width="180" show-overflow-tooltip />
            <el-table-column label="签约类型" width="110" align="center">
              <template #default="{ row }">
                <el-tag size="small" type="info">{{ contractTypeLabel(row.contractType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="签约双方代表" width="200">
              <template #default="{ row }">
                <div class="sign-info">
                  <div>甲：{{ row.partyASignatory || '-' }}</div>
                  <div>乙：{{ row.partyBSignatory || '-' }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="合同有效期" width="200" align="center">
              <template #default="{ row }">
                {{ formatDate(row.effectiveDate) }} ~ {{ formatDate(row.expiryDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="contractAmount" label="合同金额(元)" width="130" align="right">
              <template #default="{ row }">
                <span class="amount">{{ row.contractAmount ? '¥' + Number(row.contractAmount).toLocaleString() : '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="slaLevel" label="SLA等级" width="100" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.slaLevel" size="small" :type="slaTagType(row.slaLevel)">
                  {{ ['', '基础', '标准', '优质', '尊享'][row.slaLevel] }}
                </el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="contractStatusType(row.status)" size="small">
                  {{ contractStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 资费变更 -->
        <el-tab-pane label="💰 资费修改记录" name="fee-changes">
          <el-table :data="feeChangeLogs" stripe size="default" border>
            <el-table-column label="序号" type="index" width="55" align="center" />
            <el-table-column prop="logNo" label="记录编号" width="150">
              <template #default="{ row }"><span class="mono">{{ row.logNo || '-' }}</span></template>
            </el-table-column>
            <el-table-column prop="changeType" label="变更类型" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="changeTypeColor(row.changeType)">
                  {{ changeTypeLabel(row.changeType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="feeName" label="涉及方案" width="150" show-overflow-tooltip />
            <el-table-column label="变更内容" min-width="220">
              <template #default="{ row }">
                <div class="change-diff">
                  <div class="diff-row" v-for="(diff, idx) in parseDiff(row)" :key="idx">
                    <span class="diff-field">{{ diff.field }}：</span>
                    <span class="diff-before">{{ diff.before }}</span>
                    <el-icon color="#409EFF"><Right /></el-icon>
                    <span class="diff-after">{{ diff.after }}</span>
                    <el-tag v-if="diff.isViolation" size="small" type="danger">违规</el-tag>
                  </div>
                  <div v-if="!parseDiff(row).length" class="diff-empty">-</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="违规标记" width="90" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.isViolation" size="small" type="danger">是</el-tag>
                <el-tag v-else size="small" type="success" effect="plain">否</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作/确认" width="150">
              <template #default="{ row }">
                <div class="op-info">
                  <div class="op"><el-icon><User /></el-icon> {{ row.operatorName || '-' }}</div>
                  <div class="conf" v-if="row.confirmedByName">
                    <el-icon><Key /></el-icon> {{ row.confirmedByName }}
                    <span class="conf-time">{{ formatDate(row.confirmedAt) }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="变更时间" width="160" align="center">
              <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 评价 -->
        <el-tab-pane label="⭐ 服务评价台账" name="evaluation">
          <el-table :data="evaluations" stripe size="default" border>
            <el-table-column label="序号" type="index" width="55" align="center" />
            <el-table-column prop="evaluationNo" label="评价编号" width="150">
              <template #default="{ row }"><span class="mono">{{ row.evaluationNo || '-' }}</span></template>
            </el-table-column>
            <el-table-column prop="orderNo" label="关联订单" width="150">
              <template #default="{ row }">
                <span class="mono" v-if="row.orderNo">{{ row.orderNo }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="rating" label="评分" width="150" align="center">
              <template #default="{ row }">
                <el-rate v-model="row.rating" disabled size="small" />
                <span class="rating-val" style="margin-left:6px">{{ row.rating }}星</span>
              </template>
            </el-table-column>
            <el-table-column label="时效评分" width="120" align="center">
              <template #default="{ row }">
                <span :class="row.timelinessScore != null ? (row.timelinessScore < 0 ? 'text-success' : row.timelinessScore > 12 ? 'text-danger' : 'text-warning') : ''">
                  {{ row.timelinessScore != null ? (row.timelinessScore > 0 ? '+' : '') + row.timelinessScore + 'h' : '-' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="异常情况" width="130" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.hasDamage" size="small" type="danger">破损</el-tag>
                <el-tag v-if="row.hasLoss" size="small" type="danger">丢件</el-tag>
                <span v-if="!row.hasDamage && !row.hasLoss" class="text-success">正常</span>
              </template>
            </el-table-column>
            <el-table-column prop="compensationAmount" label="赔付(元)" width="100" align="right">
              <template #default="{ row }">
                <span v-if="row.compensationAmount" class="text-danger">¥{{ row.compensationAmount }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="评价内容" min-width="180" show-overflow-tooltip />
            <el-table-column label="评价人" width="110" align="center">
              <template #default="{ row }">
                <span>{{ row.evaluatorName || '-' }}</span>
                <el-tag size="small" style="margin-left:4px" :type="row.evaluatorType === 0 ? '' : row.evaluatorType === 1 ? 'primary' : 'warning'">
                  {{ ['用户', '平台', '商家'][row.evaluatorType] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="评价时间" width="160" align="center">
              <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 操作日志 -->
        <el-tab-pane label="🔍 操作日志" name="operation-logs">
          <el-table :data="operationLogs" stripe size="default" border>
            <el-table-column label="序号" type="index" width="55" align="center" />
            <el-table-column prop="changeType" label="变更类型" width="130" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="opChangeTypeColor(row.changeType)">
                  {{ opChangeTypeLabel(row.changeType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="changeTitle" label="变更内容标题" min-width="180" show-overflow-tooltip />
            <el-table-column label="核心参数变更" width="110" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.isCoreChange" type="danger" size="small">
                  <el-icon><Warning /></el-icon> 是
                </el-tag>
                <span v-else>否</span>
              </template>
            </el-table-column>
            <el-table-column prop="changeDetail" label="详细说明" min-width="220" show-overflow-tooltip />
            <el-table-column prop="changeReason" label="变更原因" width="150" show-overflow-tooltip />
            <el-table-column label="二次确认" width="160" align="center">
              <template #default="{ row }">
                <div v-if="row.confirmedByName">
                  <el-icon color="#67c23a"><CircleCheckFilled /></el-icon>
                  <span>{{ row.confirmedByName }}</span>
                  <div class="sub-tip">{{ formatDateTime(row.confirmedAt) }}</div>
                </div>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作人" width="130">
              <template #default="{ row }">
                <div>
                  <span>{{ row.operatorName || '-' }}</span>
                  <div class="sub-tip">{{ row.operatorRole || '' }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="时间" width="160" align="center">
              <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="handleRefresh"><el-icon><Refresh /></el-icon> 刷新数据</el-button>
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Document, Stamp, Money, Star, Right, User, Key, Warning, Refresh, CircleCheckFilled
} from '@element-plus/icons-vue'
import type {
  ProviderTraceSummary, ProviderQualification, SignContract, FeeChangeLog,
  ServiceEvaluation, ProviderOperationLog
} from '@/types/business'
import {
  getTraceSummary, getQualificationList, getContractList,
  getFeeChangeLogs, getEvaluationList, getOperationLogs
} from '@/api/logisticsProviderTrace'

const props = defineProps<{
  modelValue: boolean
  providerId: number
}>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const loading = ref(false)
const activeTab = ref('qualification')
const dialogTitle = ref('物流服务商溯源档案')

const summaryData = ref<ProviderTraceSummary | null>(null)
const qualifications = ref<ProviderQualification[]>([])
const contracts = ref<SignContract[]>([])
const feeChangeLogs = ref<FeeChangeLog[]>([])
const evaluations = ref<ServiceEvaluation[]>([])
const operationLogs = ref<ProviderOperationLog[]>([])

const handleClose = () => emit('update:modelValue', false)

const formatDate = (v?: string) => v ? v.slice(0, 10) : '-'
const formatDateTime = (v?: string) => v ? v.replace('T', ' ').slice(0, 16) : '-'

const isExpired = (row: any) => row.expireDate && new Date(row.expireDate).getTime() < Date.now()
const isExpiring = (row: any) => {
  if (!row.expireDate) return false
  const days = (new Date(row.expireDate).getTime() - Date.now()) / 86400000
  return days < 90
}

const qualStatusType = (s: number) => ['warning', 'success', 'danger', 'danger', 'warning'][s] || 'info'
const qualStatusLabel = (s: number) => ['待审核', '有效', '已过期', '无效', '审核中'][s] || `状态${s}`

const contractTypeLabel = (t: string) =>
  ({ initial: '初次签约', renewal: '续签', supplementary: '补充协议', amendment: '变更协议', termination: '终止协议' } as any)[t] || t

const contractStatusType = (s: number) => ['info', 'warning', 'success', 'info', 'danger'][s] || 'info'
const contractStatusLabel = (s: number) => ['草稿', '待签约', '已生效', '已过期', '已终止'][s] || `状态${s}`

const slaTagType = (s: number) => ['', 'info', '', 'warning', 'danger'][s] || ''

const changeTypeLabel = (t: string) =>
  ({ create: '新增方案', update: '更新资费', delete: '删除方案', enable: '启用方案', disable: '禁用方案' } as any)[t] || t
const changeTypeColor = (t: string) =>
  ({ create: 'success', update: 'warning', delete: 'danger', enable: 'success', disable: 'info' } as any)[t] || ''

const parseDiff = (row: FeeChangeLog) => {
  const res: any[] = []
  const before = row.beforeData || {}
  const after = row.afterData || {}
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])
  keys.forEach(k => {
    const b = before[k], a = after[k]
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      res.push({
        field: ({ firstWeightFee: '首重', additionalWeightFee: '续重', baseServiceFee: '服务费', status: '状态', matchPriority: '优先级' } as any)[k] || k,
        before: JSON.stringify(b),
        after: JSON.stringify(a),
        isViolation: row.isViolation
      })
    }
  })
  return res
}

const opChangeTypeLabel = (t: string) =>
  ({ create: '服务商准入', status_change: '启用状态变更', cooperation_status: '合作状态变更',
    param_update: '参数修改', match_rule: '匹配规则同步', level_update: '等级调整',
    fee_update: '资费更新', archive: '归档操作', delete: '删除' } as any)[t] || t
const opChangeTypeColor = (t: string) =>
  ({ create: 'success', status_change: 'warning', cooperation_status: 'danger', param_update: 'warning',
    match_rule: 'info', level_update: 'primary', fee_update: 'danger', archive: 'info', delete: 'danger' } as any)[t] || ''

const getComplianceLevelLabel = (l: string) =>
  ({ excellent: '优秀', good: '良好', pass: '合格', danger: '危险' } as any)[l] || l
const getComplianceTagType = (l: string): 'success' | 'primary' | 'warning' | 'danger' =>
  ({ excellent: 'success', good: 'primary', pass: 'warning', danger: 'danger' } as any)[l] || 'info'
const getComplianceColor = (l: string) =>
  ({ excellent: '#67c23a', good: '#409EFF', pass: '#e6a23c', danger: '#f56c6c' } as any)[l] || '#909399'

const loadAllData = async () => {
  if (!props.providerId) return
  loading.value = true
  try {
    const [sum, qual, con, fee, eva, op] = await Promise.all([
      getTraceSummary(props.providerId),
      getQualificationList(props.providerId),
      getContractList(props.providerId),
      getFeeChangeLogs(props.providerId),
      getEvaluationList(props.providerId),
      getOperationLogs(props.providerId),
    ])
    summaryData.value = sum.data
    qualifications.value = qual.data || []
    contracts.value = con.data || []
    feeChangeLogs.value = fee.data || []
    evaluations.value = eva.data || []
    operationLogs.value = op.data || []
  } catch (e: any) {
    ElMessage.error(e?.message || '数据加载失败')
  } finally {
    loading.value = false
  }
}

const handleRefresh = () => { loadAllData() }

watch(() => [props.modelValue, props.providerId], ([v, id]) => {
  if (v && id) {
    activeTab.value = 'qualification'
    loadAllData()
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.provider-trace-dialog {
  :deep(.el-dialog) {
    animation: zoomInFade 0.35s cubic-bezier(0.3, 0, 0.7, 1);
    border-radius: 12px;
    overflow: hidden;
  }
  @keyframes zoomInFade {
    0% { opacity: 0; transform: scale(0.9) translateY(30px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }

  .trace-container { padding: 0 4px; }

  .summary-cards {
    margin-bottom: 18px;
  }

  .s-card {
    padding: 14px; border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    position: relative; overflow: hidden;

    .s-title {
      font-size: 13px; font-weight: 600; color: #606266;
      display: flex; align-items: center; gap: 6px;
      padding-bottom: 8px; margin-bottom: 10px;
      border-bottom: 1px dashed rgba(0,0,0,0.06);
    }
    .s-stats { display: flex; flex-direction: column; gap: 5px; }
    .stat-row {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 12px; color: #606266;
      b { font-size: 15px; font-weight: 700; font-family: Consolas, monospace; }
      &.ok b { color: #67c23a; }
      &.warn b { color: #e6a23c; }
      &.err b { color: #f56c6c; }
    }

    &.s-qualification { background: linear-gradient(135deg, #fff8f0, #fffbeb); }
    &.s-contract { background: linear-gradient(135deg, #f0f9ff, #ecf5ff); }
    &.s-fee { background: linear-gradient(135deg, #fef0f0, #fff4f0); }
    &.s-evaluation { background: linear-gradient(135deg, #f0f9eb, #f4fff0); }
  }

  .compliance-bar {
    margin-top: 14px;
    padding: 14px 18px;
    background: linear-gradient(135deg, #fafcff, #f4faff);
    border-radius: 10px; border: 1px solid #e0e8f2;

    .compliance-head {
      display: flex; align-items: center; gap: 12px; margin-bottom: 10px;
      .c-label { font-weight: 600; color: #303133; font-size: 14px; }
      .c-score { margin-left: auto; font-size: 13px; color: #606266;
        b { font-size: 22px; color: #409EFF; margin: 0 4px; } }
    }

    .compliance-issues { margin-top: 12px; }
    .issue-card {
      padding: 10px 12px; border-radius: 6px;
      background: #fff; border: 1px solid #ebeef5;
      .issue-dim { font-size: 12px; font-weight: 600; margin-bottom: 4px;
        display: flex; justify-content: space-between;
        .issue-score { font-family: Consolas, monospace; font-size: 13px; } }
      .issue-problem, .issue-suggestion {
        font-size: 11px; line-height: 1.5; margin-top: 3px; color: #606266;
      }
      &.level-0 { border-left: 4px solid #f56c6c; }
      &.level-1 { border-left: 4px solid #e6a23c; }
      &.level-2 { border-left: 4px solid #409EFF; }
      &.level-3, &.level-4 { border-left: 4px solid #67c23a; }
    }
  }

  .trace-tabs {
    :deep(.el-tabs__item) { font-size: 13px; font-weight: 500; height: 42px; line-height: 42px; }
  }

  .mono { font-family: Consolas, Monaco, monospace; font-size: 12px; color: #409EFF; }
  .amount { font-family: Consolas, monospace; font-weight: 600; color: #f56c6c; }
  .rating-val { font-size: 12px; color: #f59e0b; font-weight: 600; }
  .text-success { color: #67c23a; font-weight: 500; }
  .text-warning { color: #e6a23c; }
  .text-danger { color: #f56c6c; font-weight: 600; }
  .text-muted { color: #909399; }
  .sub-tip { font-size: 11px; color: #909399; margin-top: 2px; }

  .sign-info, .op-info {
    font-size: 12px; line-height: 1.7;
    .op, .conf { display: flex; align-items: center; gap: 4px; }
    .conf { color: #67c23a; }
    .conf-time { margin-left: auto; color: #909399; }
    .audit-info { font-size: 12px; .audit-time { display: block; color: #909399; font-size: 11px; } }
  }

  .audit-info { font-size: 12px; line-height: 1.5; }

  .change-diff {
    font-size: 12px; line-height: 1.8;
    .diff-row { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
    .diff-field { color: #909399; }
    .diff-before { padding: 1px 6px; background: #fef0f0; color: #f56c6c; border-radius: 3px; }
    .diff-after { padding: 1px 6px; background: #f0f9eb; color: #67c23a; border-radius: 3px; }
    .diff-empty { color: #909399; }
  }

  .hover-long-text {
    .hover-hint { color: #409EFF; cursor: help; }
  }

  :deep(.long-text-tooltip) {
    max-width: 500px !important;
    .el-tooltip__popper-inner {
      font-size: 13px; line-height: 1.7; max-height: 300px; overflow-y: auto;
    }
  }

  .dialog-footer {
    display: flex; justify-content: flex-end; gap: 8px; padding: 0 12px 4px;
  }
}
</style>
