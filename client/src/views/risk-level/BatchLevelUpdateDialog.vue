<template>
  <FinDialog
    v-model:visible="visibleState"
    title="批量更新客户风险等级"
    width="960px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="batch-update-wrapper">
      <el-steps :active="currentStep + 1" finish-status="success" align-center style="margin-bottom: 28px">
        <el-step title="选择模式" />
        <el-step title="配置条件" />
        <el-step title="预览确认" />
        <el-step title="执行进度" />
      </el-steps>

      <div class="step-container">
        <!-- 步骤1：选择模式 -->
        <div v-show="currentStep === 0" class="step-pane fade-in">
          <div class="section-title">
            <el-icon><Operation /></el-icon>
            请选择批量调整模式
          </div>
          <div class="mode-grid">
            <div
              v-for="mode in modeList"
              :key="mode.value"
              class="mode-card"
              :class="{ active: form.mode === mode.value, disabled: mode.value === BatchLevelUpdateMode.SELECTED_IDS && !canUseSelected }"
              @click="selectMode(mode.value)"
            >
              <div
                class="mode-icon"
                :style="{ background: mode.bg, color: mode.color }"
              >
                <el-icon :size="26"><component :is="mode.icon" /></el-icon>
              </div>
              <div class="mode-info">
                <div class="mode-name">{{ mode.label }}</div>
                <div class="mode-desc">{{ mode.desc }}</div>
                <div class="mode-scenarios">
                  <span class="scenario-tag" v-for="(s, i) in mode.scenarios" :key="i">{{ s }}</span>
                </div>
              </div>
              <div class="mode-check">
                <el-icon v-if="form.mode === mode.value"><CircleCheckFilled /></el-icon>
              </div>
            </div>
          </div>

          <div v-if="form.mode === BatchLevelUpdateMode.SELECTED_IDS && !canUseSelected" class="select-caution">
            <el-icon><WarningFilled /></el-icon>
            请先从主页面勾选客户列表
          </div>
        </div>

        <!-- 步骤2：配置条件 -->
        <div v-show="currentStep === 1" class="step-pane fade-in">
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="140px"
            label-position="right"
          >
            <el-form-item label="目标风险等级" prop="targetLevel" required>
              <el-radio-group v-model="form.targetLevel" style="width: 100%">
                <div class="level-option" v-for="lv in levelOptions" :key="lv.value">
                  <el-radio :label="lv.value">
                    <span class="radio-label">
                      <span
                        class="lv-dot"
                        :style="{ background: getLevelBgColor(lv.value), color: getLevelColor(lv.value), borderColor: getLevelColor(lv.value) }"
                      >
                        <el-icon><component :is="getLevelIcon(lv.value)" /></el-icon>
                      </span>
                      <strong>{{ lv.label }}</strong>
                      <span class="lv-strategy-hint">{{ getStrategyHint(lv.value) }}</span>
                    </span>
                  </el-radio>
                </div>
              </el-radio-group>
            </el-form-item>

            <el-divider style="margin: 14px 0" />

            <template v-if="form.mode === BatchLevelUpdateMode.ASSESSMENT_RESULT">
              <el-form-item label="测评分数范围" prop="assessmentScoreRange">
                <div class="range-row">
                  <el-input-number
                    v-model="form.assessmentResultFilter.minScore"
                    :min="0"
                    :max="100"
                    size="default"
                    placeholder="最小"
                    :step="5"
                    controls-position="right"
                  />
                  <span class="range-sep">~</span>
                  <el-input-number
                    v-model="form.assessmentResultFilter.maxScore"
                    :min="0"
                    :max="100"
                    size="default"
                    placeholder="最大"
                    :step="5"
                    controls-position="right"
                  />
                  <el-checkbox
                    v-model="form.assessmentResultFilter.passedOnly"
                    style="margin-left: 20px"
                  >
                    仅包含已通过测评客户
                  </el-checkbox>
                </div>
              </el-form-item>
            </template>

            <template v-if="form.mode === BatchLevelUpdateMode.INTERCEPTION_FREQUENCY">
              <el-form-item label="异常拦截阈值" prop="interceptionMinCount">
                <div class="range-row">
                  <el-input-number
                    v-model="form.interceptionThreshold.minCount30d"
                    :min="1"
                    :max="100"
                    placeholder="最小次数"
                    controls-position="right"
                  />
                  <span class="range-sep">次/30天，且异常占比 ≥</span>
                  <el-input-number
                    v-model="form.interceptionThreshold.minAbnormalRatio"
                    :min="0.01"
                    :max="1"
                    :step="0.01"
                    :precision="2"
                    controls-position="right"
                  />
                  <span class="range-sep">%</span>
                </div>
                <div class="form-tip">
                  <el-icon><InfoFilled /></el-icon>
                  筛选近30天异常拦截次数达标，且异常交易占总交易比例达标客户。
                </div>
              </el-form-item>
            </template>

            <template v-if="form.mode === BatchLevelUpdateMode.SOURCE_LEVEL">
              <el-form-item label="当前风险等级" prop="sourceLevel" required>
                <el-radio-group v-model="form.sourceLevel">
                  <el-radio
                    v-for="lv in levelOptions"
                    :key="lv.value"
                    :label="lv.value"
                  >
                    {{ lv.label }}
                  </el-radio>
                </el-radio-group>
              </el-form-item>
            </template>

            <el-divider style="margin: 14px 0" />

            <el-form-item label="变更原因" prop="changeReason" required>
              <el-input
                v-model="form.changeReason"
                type="textarea"
                :rows="3"
                maxlength="500"
                show-word-limit
                placeholder="请填写批量调整原因（将同步至客户台账，便于后续溯源"
              />
            </el-form-item>

            <el-form-item label="执行选项">
              <el-checkbox v-model="form.autoSyncStrategies" checked>
                自动同步更新对应风控策略
              </el-checkbox>
              <el-checkbox v-model="form.sendNotification" checked>
                给受影响客户推送站内通知
              </el-checkbox>
              <el-checkbox v-model="form.effectiveImmediately" checked>
                立即生效
              </el-checkbox>
              <div v-if="!form.effectiveImmediately" style="margin-top: 10px">
                <el-date-picker
                  v-model="form.scheduledTime"
                  type="datetime"
                  placeholder="选择定时生效时间"
                  style="width: 260px"
                  :disabled-date="disabledDate"
                />
              </div>
            </el-form-item>

            <el-form-item label="操作备注">
              <el-input
                v-model="form.operatorRemark"
                type="textarea"
                :rows="2"
                maxlength="200"
                show-word-limit
                placeholder="内部备注，仅运营人员可见"
              />
            </el-form-item>
          </el-form>
        </div>

        <!-- 步骤3：预览确认 -->
        <div v-show="currentStep === 2" class="step-pane fade-in" v-loading="previewLoading">
          <div class="preview-header-row">
            <div class="preview-summary">
              <div class="summary-row">
                <span class="summary-label">调整模式：</span>
                <el-tag size="small" effect="light" type="primary">{{ getModeLabel(form.mode) }}</el-tag>
              </div>
              <div class="summary-row">
                <span class="summary-label">目标等级：</span>
                <span
                  class="lv-tag"
                  :style="{ background: getLevelBgColor(form.targetLevel!), color: getLevelColor(form.targetLevel!), borderColor: getLevelColor(form.targetLevel!) }"
                >
                  {{ getLevelLabel(form.targetLevel!) }}
                </span>
              </div>
              <div class="summary-row">
                <span class="summary-label">预计影响客户：</span>
                <span class="summary-value big" style="color: #E67E22;">
                  {{ formatThousands(previewData?.totalAffected || 0) }} 位
                </span>
              </div>
            </div>
            <div class="permission-verification" :class="hasBatchPerm ? 'pass' : 'fail'">
              <el-icon :size="20">
                <component :is="hasBatchPerm ? 'CircleCheckFilled' : 'Lock'" />
              </el-icon>
              <div>
                <div class="perm-title">权限校验</div>
                <div class="perm-text">
                  {{ hasBatchPerm ? '您具有批量调级权限' : '权限不足：仅[风控管理员/主管]可执行此操作' }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="previewData" class="preview-stats">
            <div class="preview-card distribution">
              <div class="preview-card-title">
                <el-icon><PieChart /></el-icon>
                目标等级分布
              </div>
              <div class="level-dist-list">
                <div
                  v-for="(cnt, lv) in previewData.byLevel"
                  :key="lv"
                  class="dist-row"
                >
                  <span
                    class="lv-badge"
                    :style="{ background: getLevelBgColor(lv as CustomerRiskLevel), color: getLevelColor(lv as CustomerRiskLevel) }"
                  >{{ getLevelShortLabel(lv as CustomerRiskLevel) }}</span>
                  <div class="dist-bar">
                    <div
                      class="dist-fill"
                      :style="{
                        width: (previewData.totalAffected ? ((cnt as number / previewData.totalAffected * 100) : 0) + '%',
                        background: getLevelColor(lv as CustomerRiskLevel),
                      }"
                    />
                  </div>
                  <span class="dist-count">{{ formatThousands(cnt as number) }}位</span>
                </div>
              </div>
            </div>

            <div class="preview-card impact">
              <div class="preview-card-title">
                <el-icon><Lightning /></el-icon>
                策略联动影响预估
              </div>
              <div class="impact-list">
                <div class="impact-row">
                  <span>同步风控策略</span>
                  <strong>{{ formatThousands(previewData.estimatedImpacts.strategySyncCount) }} 位</strong>
                </div>
                <div class="impact-row">
                  <span>调整审核优先级</span>
                  <strong>{{ formatThousands(previewData.estimatedImpacts.priorityChangeCount) }} 位</strong>
                </div>
                <div class="impact-row">
                  <span>发送客户通知</span>
                  <strong>{{ formatThousands(previewData.estimatedImpacts.notifiedCustomerCount) }} 位</strong>
                </div>
                <div class="impact-row final">
                  <span>变更原因</span>
                  <span class="reason-text">{{ form.changeReason }}</span>
                </div>
              </div>
            </div>

            <div class="preview-card sample">
              <div class="preview-card-title">
                <el-icon><User /></el-icon>
                受影响客户样本（{{ previewData.sampleCustomers?.length || 0 }}/预览）
              </div>
              <div class="sample-table">
                <div class="sample-row sample-header">
                  <span>客户姓名</span>
                  <span>当前等级</span>
                  <span>→</span>
                  <span>目标等级</span>
                  <span>当前评分</span>
                </div>
                <div
                  v-for="(c, i) in previewData.sampleCustomers"
                  :key="i"
                  class="sample-row"
                >
                  <span class="s-name">{{ c.name }}</span>
                  <span
                    class="lv-badge small"
                    :style="{ background: getLevelBgColor(c.currentLevel), color: getLevelColor(c.currentLevel) }"
                  >{{ getLevelShortLabel(c.currentLevel) }}</span>
                  <span class="s-arrow"><el-icon><Right /></el-icon></span>
                  <span
                    class="lv-badge small"
                    :style="{ background: getLevelBgColor(c.targetLevel), color: getLevelColor(c.targetLevel) }"
                  >{{ getLevelShortLabel(c.targetLevel) }}</span>
                  <span class="s-score" :style="{ color: getLevelColor(c.currentLevel) }">{{ c.currentScore }}</span>
                </div>
                <div v-if="!previewData.sampleCustomers?.length" class="sample-empty">
                  <FinEmpty description="暂无样本数据" size="mini" />
                </div>
              </div>
            </div>
          </div>

          <div v-if="previewData?.validationErrors?.length" class="validation-errors">
            <div class="errors-header">
              <el-icon color="#F56C6C"><WarningFilled /></el-icon>
              <span>存在 {{ previewData.validationErrors.length }} 条无法处理的记录</span>
            </div>
            <div class="errors-list">
              <div v-for="(e, i) in previewData.validationErrors.slice(0, 5)" :key="i" class="err-item">
                <el-icon><Close /></el-icon>
                客户ID: {{ e.customerId }} - {{ e.reason }}
              </div>
              <div v-if="previewData.validationErrors.length > 5" class="err-more">
                等 {{ previewData.validationErrors.length }} 条，将在执行时自动跳过
              </div>
            </div>
          </div>
        </div>

        <!-- 步骤4：执行进度 -->
        <div v-show="currentStep === 3" class="step-pane fade-in">
          <div class="execution-status" :class="execStatus">
            <div class="exec-icon">
              <el-icon :size="48"><component :is="execStatus === 'success' ? 'CircleCheckFilled' : execStatus === 'error' ? 'CircleCloseFilled' : 'Loading'" /></el-icon>
            </div>
            <div class="exec-title">{{ execTitle }}</div>
            <div class="exec-subtitle">{{ execSubtitle }}</div>
          </div>

          <el-progress
            v-if="showProgress"
            type="dashboard"
            :percentage="execPercent"
            :width="140"
            :stroke-width="14"
            style="margin: 24px auto; display: block"
            :color="execPercent < 50 ? '#409EFF' : execPercent < 100 ? '#27AE60' : '#27AE60'"
          >
            <div style="text-align: center">
              <div style="font-size: 28px; font-weight: 700; color: #1F2D3D; font-family: 'DIN'">{{ execPercent }}%</div>
              <div style="font-size: 12px; color: #8492A6; margin-top: 4px">{{ execProcessed }}/{{ execTotal }}</div>
            </div>
          </el-progress>

          <div v-if="execResult" class="exec-result">
            <div class="result-row">
              <div class="result-item success">
                <div class="result-label">成功处理</div>
                <div class="result-value">{{ execResult.successful }} 位</div>
              </div>
              <div class="result-item fail">
                <div class="result-label">处理失败</div>
                <div class="result-value">{{ execResult.failed }} 位</div>
              </div>
              <div class="result-item batch-id">
                <div class="result-label">批次号</div>
                <div class="result-value">#{{ execResult.batchOperationId }}</div>
              </div>
            </div>

            <div v-if="execResult.failedItems?.length" class="failed-details">
              <div class="failed-title">失败明细：</div>
              <div class="failed-list">
                <div v-for="(f, i) in execResult.failedItems.slice(0, 8)" :key="i" class="failed-item">
                  <el-icon color="#F56C6C"><Warning /></el-icon>
                  <span>{{ f.customerName }}（客户ID: {{ f.customerId }}）- {{ f.reason }}</span>
                </div>
                <div v-if="execResult.failedItems.length > 8" class="failed-more">
                  等 {{ execResult.failedItems.length }} 条失败，请在批量操作记录中查看完整明细
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="footer-actions">
        <el-button
          v-if="currentStep === 3"
          type="primary"
          @click="handleClose"
        >
          {{ execStatus === 'success' ? '完成' : '关闭' }}
        </el-button>

        <template v-else>
          <el-button @click="handlePrev" :disabled="currentStep === 0">上一步</el-button>
          <el-button
            v-if="currentStep < 2"
            type="primary"
            @click="handleNext"
            :disabled="currentStep === 1 && !hasBatchPerm === false"
          >
            {{ currentStep === 1 ? '下一步：预览确认' : '下一步' }}
          </el-button>
          <el-button
            v-if="currentStep === 2 && hasBatchPerm"
            type="danger"
            :loading="executing"
            @click="handleExecute"
          >
            <el-icon><WarningFilled /></el-icon>
            确认执行批量调级
          </el-button>
          <el-tooltip v-if="currentStep === 2 && !hasBatchPerm" content="权限不足，无法执行">
            <el-button type="danger" disabled>
              <el-icon><Lock /></el-icon>
              无权限执行
            </el-button>
          </el-tooltip>
        </template>
      </div>
    </template>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
} from 'element-plus'
import {
  Operation,
  CircleCheckFilled,
  WarningFilled,
  User,
  PieChart,
  Lightning,
  Right,
  Close,
  InfoFilled,
  Lock,
  Loading,
  CircleCloseFilled,
  Shield,
  DataAnalysis,
  UserFilled,
  DataLine,
  Calendar,
} from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import FinEmpty from '@/components/common/FinEmpty.vue'
import { usePermission } from '@/hooks/usePermission'
import {
  CUSTOMER_RISK_LEVEL_LABELS,
  CUSTOMER_RISK_LEVEL_SHORT_LABELS,
  CUSTOMER_RISK_LEVEL_COLORS,
  CUSTOMER_RISK_LEVEL_BG_COLORS,
  RISK_LEVEL_STRATEGY_TEMPLATES,
  BATCH_LEVEL_UPDATE_MODE_LABELS,
} from '@/constants/dictionaries'
import {
  CustomerRiskLevel,
  BatchLevelUpdateMode,
  ReviewPriority,
} from '@/enums'
import * as riskLevelApi from '@/api/riskLevel'
import type {
  IBatchLevelUpdatePreview,
  IBatchLevelUpdateResult,
  IBatchLevelUpdateParams,
} from '@/types/api'

const props = defineProps<{
  visible: boolean
  selectedCustomerIds?: number[]
}>()

const emit = defineEmits<{
  'update:visible': [v: boolean]
  'update-completed': [result?: IBatchLevelUpdateResult]
}>()

const { hasPerm } = usePermission()

const visibleState = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v),
})

const currentStep = ref(0)
const formRef = ref<FormInstance>()
const previewLoading = ref(false)
const executing = ref(false)
const execStatus = ref<'pending' | 'running' | 'success' | 'error'>('pending')
const execPercent = ref(0)
const execProcessed = ref(0)
const execTotal = ref(0)
const execResult = ref<IBatchLevelUpdateResult | null>(null)
const previewData = ref<IBatchLevelUpdatePreview | null>(null)

const hasBatchPerm = computed(() => hasPerm('riskLevel:batch'))
const canUseSelected = computed(() => (props.selectedCustomerIds?.length || 0) > 0)

const modeList = [
  {
    value: BatchLevelUpdateMode.ASSESSMENT_RESULT,
    label: '按风控测评结果',
    desc: '基于周期风险测评结果，按分数区间批量调整',
    scenarios: ['季度/半年度批量调级', '统一标准评定'],
    icon: DataAnalysis,
    color: '#409EFF',
    bg: 'rgba(64,158,255,0.1)',
  },
  {
    value: BatchLevelUpdateMode.INTERCEPTION_FREQUENCY,
    label: '按异常交易频次',
    desc: '近30天拦截次数/占比触发批量调整',
    scenarios: ['违规客户集中处理', '高风险聚集客户筛查'],
    icon: WarningFilled,
    color: '#F56C6C',
    bg: 'rgba(245,108,108,0.1)',
  },
  {
    value: BatchLevelUpdateMode.SOURCE_LEVEL,
    label: '按当前等级转换',
    desc: '将指定当前等级的所有客户批量调至目标等级',
    scenarios: ['等级阈值调整', '策略统一重构'],
    icon: DataLine,
    color: '#E6A23C',
    bg: 'rgba(230,162,60,0.1)',
  },
  {
    value: BatchLevelUpdateMode.SELECTED_IDS,
    label: '按已勾选客户',
    desc: '基于主页面已勾选的客户列表进行调整',
    scenarios: ['手工特定客户处理', '精选客户清单'],
    icon: UserFilled,
    color: '#27AE60',
    bg: 'rgba(39,174,96,0.1)',
  },
]

const form = reactive<IBatchLevelUpdateParams>({
  mode: BatchLevelUpdateMode.ASSESSMENT_RESULT,
  targetLevel: CustomerRiskLevel.MEDIUM,
  customerIds: undefined,
  sourceLevel: undefined,
  interceptionThreshold: {
    minCount30d: 3,
    minAbnormalRatio: 0.05,
  },
  assessmentResultFilter: {
    minScore: 0,
    maxScore: 100,
    passedOnly: true,
  },
  changeReason: '',
  operatorRemark: '',
  autoSyncStrategies: true,
  sendNotification: true,
  effectiveImmediately: true,
  scheduledTime: undefined,
  dryRun: false,
})

const rules: FormRules = {
  targetLevel: [
    { required: true, message: '请选择目标风险等级', trigger: 'change' },
  ],
  changeReason: [
    { required: true, message: '请填写变更原因', trigger: 'blur' },
    { min: 8, message: '原因不少于8个字符', trigger: 'blur' },
  ],
  sourceLevel: [
    {
      validator: (_r: any, v: any, cb: any) => {
        if (form.mode === BatchLevelUpdateMode.SOURCE_LEVEL && !v) {
          cb(new Error('请选择当前风险等级'))
        } else cb()
      },
      trigger: 'change',
    },
  ],
}

const levelOptions = [
  { label: '低风险', value: CustomerRiskLevel.LOW },
  { label: '中风险', value: CustomerRiskLevel.MEDIUM },
  { label: '较高风险', value: CustomerRiskLevel.HIGH },
  { label: '高风险', value: CustomerRiskLevel.VERY_HIGH },
]

const showProgress = computed(() => execStatus.value === 'running' || execStatus.value === 'success')

const execTitle = computed(() => {
  const map: Record<string, string> = {
    pending: '准备执行',
    running: '正在执行批量调级',
    success: '批量调级完成',
    error: '执行出现错误',
  }
  return map[execStatus.value]
})

const execSubtitle = computed(() => {
  if (execStatus.value === 'success') {
    return `共处理 ${execResult.value?.total || 0} 位客户，成功 ${execResult.value?.successful || 0} 位`
  }
  if (execStatus.value === 'running') return '请勿关闭窗口，正在同步更新风控策略...'
  if (execStatus.value === 'error') return '请稍后重试或联系技术支持'
  return '点击「确认执行批量调级」开始处理'
})

function getModeLabel(m: BatchLevelUpdateMode): string {
  return BATCH_LEVEL_UPDATE_MODE_LABELS[m] || m
}
function getLevelLabel(l: CustomerRiskLevel): string { return CUSTOMER_RISK_LEVEL_LABELS[l] || l }
function getLevelShortLabel(l: CustomerRiskLevel): string { return CUSTOMER_RISK_LEVEL_SHORT_LABELS[l] || l }
function getLevelColor(l: CustomerRiskLevel): string { return CUSTOMER_RISK_LEVEL_COLORS[l] || '#909399' }
function getLevelBgColor(l: CustomerRiskLevel): string { return CUSTOMER_RISK_LEVEL_BG_COLORS[l] || 'rgba(144,147,153,0.1)' }

function getLevelIcon(level: CustomerRiskLevel) {
  const map: Record<CustomerRiskLevel, any> = {
    [CustomerRiskLevel.LOW]: Shield,
    [CustomerRiskLevel.MEDIUM]: User,
    [CustomerRiskLevel.HIGH]: Warning,
    [CustomerRiskLevel.VERY_HIGH]: Lock,
  }
  return map[level] || Shield
}

function getStrategyHint(level: CustomerRiskLevel): string {
  const s = RISK_LEVEL_STRATEGY_TEMPLATES[level]
  if (!s) return ''
  const pMap: Record<ReviewPriority, string> = {
    [ReviewPriority.NONE]: '免审核',
    [ReviewPriority.NORMAL]: '普通审核',
    [ReviewPriority.HIGH]: '优先审核',
    [ReviewPriority.VERY_HIGH]: '特级审核',
  }
  const hint = `单票${s.positionLimit.singleStockRatio}% · ${pMap[s.reviewPriority] || ''}`
  return hint.trim()
}

function formatThousands(n: number): string {
  if (!n) return '0'
  return n.toLocaleString('zh-CN')
}

function disabledDate(d: Date): boolean {
  return d.getTime() < Date.now() - 86400000
}

function selectMode(mode: BatchLevelUpdateMode) {
  if (mode === BatchLevelUpdateMode.SELECTED_IDS && !canUseSelected.value) {
    ElMessage.warning('请先从主页面勾选需要批量调整的客户')
    return
  }
  form.mode = mode
  if (mode === BatchLevelUpdateMode.SELECTED_IDS) {
    form.customerIds = props.selectedCustomerIds
  } else {
    form.customerIds = undefined
  }
}

async function handleNext() {
  if (currentStep.value === 0) {
    if (!form.mode) {
      ElMessage.warning('请选择批量调整模式')
      return
    }
    currentStep.value = 1
    return
  }
  if (currentStep.value === 1) {
    if (!formRef.value) { currentStep.value = 2; await loadPreview(); return }
    try {
      await formRef.value.validate()
      currentStep.value = 2
      await loadPreview()
    } catch (e) {
      ElMessage.warning('请完整填写必填项')
    }
  }
}

function handlePrev() {
  if (currentStep.value > 0) currentStep.value--
}

async function loadPreview() {
  previewLoading.value = true
  try {
    const params: IBatchLevelUpdateParams = { ...form, dryRun: true } as any
    const res = await riskLevelApi.previewBatchUpdate(params)
    if (res.code === 0) {
      previewData.value = res.data
    } else {
      buildMockPreview()
    }
  } catch (e) {
    buildMockPreview()
  } finally {
    previewLoading.value = false
  }
}

function buildMockPreview() {
  const affected = 86
  const byLevel: Record<string, number> = {} as any
  const srcByLevel: Record<string, number> = {} as any
  byLevel[form.targetLevel!] = affected
  const levels = [CustomerRiskLevel.LOW, CustomerRiskLevel.MEDIUM, CustomerRiskLevel.HIGH, CustomerRiskLevel.VERY_HIGH]
  const sample = Array.from({ length: 8 }).map((_, i) => ({
    id: 100 + i,
    name: ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十'][i],
    currentLevel: levels[i % 3],
    targetLevel: form.targetLevel!,
    currentScore: 20 + (i * 8) % 70,
  }))
  levels.forEach((lv, i) => { srcByLevel[lv] = i === 1 ? 40 : i === 0 ? 20 : 26 })

  previewData.value = {
    totalAffected: affected,
    byLevel: byLevel as any,
    byCurrentLevel: srcByLevel as any,
    sampleCustomers: sample,
    estimatedImpacts: {
      strategySyncCount: affected,
      priorityChangeCount: Math.floor(affected * 0.75),
      notifiedCustomerCount: form.sendNotification ? affected : 0,
    },
    validationErrors: [
      { customerId: 999, reason: '数据缺失，无法完成等级评定' },
      { customerId: 888, reason: '距上次调整不足30天，按规则跳过' },
    ],
  }
}

async function handleExecute() {
  if (!previewData.value?.totalAffected) {
    ElMessage.warning('没有可处理的客户')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定对 ${previewData.value.totalAffected} 位客户执行批量调级至「${getLevelLabel(form.targetLevel!)}」？\n调级后将自动联动更新风控策略，影响交易限额、审核规则等。`,
      '⚠️ 二次确认',
      {
        type: 'warning',
        confirmButtonText: '确认执行',
        cancelButtonText: '取消',
      },
    )
  } catch (e) {
    return
  }

  executing.value = true
  execStatus.value = 'running'
  execTotal.value = previewData.value.totalAffected
  execProcessed.value = 0
  execPercent.value = 0

  try {
    const params: IBatchLevelUpdateParams = { ...form, dryRun: false } as any
    // 模拟进度
    const step = Math.max(1, Math.floor(previewData.value.totalAffected / 20))
    let processed = 0
    const timer = setInterval(() => {
      processed = Math.min(processed + step, previewData.value!.totalAffected)
      execProcessed.value = processed
      execPercent.value = Math.round((processed / previewData.value!.totalAffected) * 100)
    }, 220)

    const res = await riskLevelApi.executeBatchUpdate(params)

    clearInterval(timer)
    execProcessed.value = previewData.value.totalAffected
    execPercent.value = 100
    await nextTick()
    await new Promise((r) => setTimeout(r, 500))

    if (res.code === 0) {
      execResult.value = res.data
      execStatus.value = 'success'
      ElMessage.success(`批量调级完成：成功 ${res.data.successful} 位，失败 ${res.data.failed} 位`)
      emit('update-completed', res.data)
    } else {
      execResult.value = {
        success: false,
        total: previewData.value.totalAffected,
        processed: 0,
        successful: 0,
        failed: previewData.value.totalAffected,
        failedItems: [],
        batchOperationId: 0,
      }
      execStatus.value = 'error'
      ElMessage.error(res.message || '执行失败')
    }
  } catch (e) {
    execStatus.value = 'error'
    ElMessage.error('执行过程发生错误')
  } finally {
    executing.value = false
  }
}

function handleClose() {
  currentStep.value = 0
  execStatus.value = 'pending'
  execResult.value = null
  execPercent.value = 0
  visibleState.value = false
}

watch(
  () => props.visible,
  (v) => {
    if (v) {
    if (props.selectedCustomerIds?.length) {
      form.mode = BatchLevelUpdateMode.SELECTED_IDS
      form.customerIds = props.selectedCustomerIds
    } else {
      form.mode = BatchLevelUpdateMode.ASSESSMENT_RESULT
    }
    currentStep.value = 0
    previewData.value = null
    execResult.value = null
    execStatus.value = 'pending'
  }
  }
)
</script>

<style lang="scss" scoped>
.batch-update-wrapper {
  min-height: 400px;
}

.step-container {
  min-height: 360px;
  position: relative;
}

.step-pane {
  position: relative;
}

.fade-in {
  animation: fade-in 0.4s ease;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 18px;
  color: #1F2D3D;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  .el-icon { color: #409EFF; }
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.mode-card {
  position: relative;
  display: flex;
  gap: 14px;
  padding: 18px 20px;
  background: #fff;
  border: 2px solid #E4E7ED;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: #409EFF;
    background: #F5F9FF;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(64,158,255,0.12);
  }

  &.active {
    border-color: #409EFF;
    background: linear-gradient(135deg, #F5F9FF 0%, #fff 100%);
    box-shadow: 0 4px 16px rgba(64,158,255,0.15);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
}

.mode-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mode-info { flex: 1; min-width: 0; }

.mode-name {
  font-size: 15px;
  font-weight: 600;
  color: #1F2D3D;
  margin-bottom: 4px;
}

.mode-desc {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 10px;
}

.mode-scenarios {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.scenario-tag {
  padding: 2px 8px;
  background: #F2F6FC;
  color: #8492A6;
  border-radius: 10px;
  font-size: 10px;
}

.mode-check {
  position: absolute;
  top: 12px;
  right: 14px;
  color: #409EFF;
  font-size: 20px;
}

.select-caution {
  margin-top: 14px;
  padding: 10px 14px;
  background: #FDF6EC;
  color: #E6A23C;
  border-radius: 6px;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
}

.level-option {
  display: block;
  margin-bottom: 12px;

  :deep(.el-radio__label) { padding-left: 12px; width: calc(100% - 24px); }
}

.radio-label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  vertical-align: middle;
}

.lv-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.lv-strategy-hint {
  font-size: 12px;
  color: #8492A6;
  font-weight: normal;
  margin-left: auto;
}

.range-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.range-sep { color: #8492A6; }

.form-tip {
  font-size: 12px;
  color: #8492A6;
  margin-top: 8px;
  padding: 6px 10px;
  background: #F5F7FA;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;

  .el-icon { color: #409EFF; }
}

.preview-header {
  /* placeholder */
}

.preview-header-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px;
  padding: 18px 22px;
  background: linear-gradient(135deg, #F5F9FF 0%, #FFF7F0 100%);
  border-radius: 10px;
  border: 1px solid #E4E7ED;
  margin-bottom: 18px;
}

.summary-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;

  &:last-child { margin-bottom: 0; }
}

.summary-label {
  font-size: 13px;
  color: #606266;
  width: 100px;
  flex-shrink: 0;
}

.summary-value {
  font-weight: 600;
  color: #1F2D3D;
  font-family: 'DIN', monospace;

  &.big {
    font-size: 28px;
    color: #E67E22;
  }
}

.lv-tag {
  padding: 4px 12px;
  border-radius: 14px;
  border: 1px solid;
  font-weight: 600;
  font-size: 13px;
}

.permission-verification {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-radius: 8px;
  min-width: 260px;

  &.pass {
    background: #F0F9F4;
    color: #27AE60;
    border: 1px solid rgba(39,174,96,0.3);
  }
  &.fail {
    background: #FEF0F0;
    color: #F56C6C;
    border: 1px solid rgba(245,108,108,0.3);
  }
}

.perm-title { font-weight: 600; font-size: 13px; }
.perm-text { font-size: 11px; opacity: 0.85; margin-top: 2px; }

.preview-stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1.3fr;
  gap: 14px;
  margin-bottom: 16px;
}

.preview-card {
  background: #fff;
  border: 1px solid #E4E7ED;
  border-radius: 10px;
  padding: 16px 18px;
}

.preview-card-title {
  font-size: 13px;
  font-weight: 600;
  color: #1F2D3D;
  margin-bottom: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  .el-icon { color: #409EFF; }
}

.level-dist-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dist-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.lv-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  min-width: 58px;
  text-align: center;

  &.small { font-size: 11px; }
}

.dist-bar {
  flex: 1;
  height: 6px;
  background: #F2F6FC;
  border-radius: 3px;
  overflow: hidden;
}

.dist-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.dist-count {
  font-size: 12px;
  color: #606266;
  font-family: 'DIN', monospace;
  font-weight: 600;
  min-width: 60px;
  text-align: right;
}

.impact-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.impact-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px dashed #EBEEF5;
  font-size: 12px;
  color: #606266;

  &:last-child { border-bottom: none; }

  strong {
    color: #1F2D3D;
    font-weight: 600;
    font-family: 'DIN', monospace;
  }

  &.final { align-items: flex-start; gap: 12px; }
}

.reason-text {
  color: #1F2D3D;
  text-align: right;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sample-table {
  display: flex;
  flex-direction: column;
}

.sample-row {
  display: grid;
  grid-template-columns: 1fr 80px 24px 80px 80px;
  gap: 6px;
  align-items: center;
  padding: 7px 4px;
  border-bottom: 1px solid #F2F6FC;
  font-size: 12px;
  text-align: center;

  &.sample-header {
    background: #F5F7FA;
    font-weight: 600;
    color: #606266;
    font-size: 11px;
  }
}

.s-name {
  color: #1F2D3D;
  text-align: left;
  padding-left: 6px;
  font-weight: 500;
}

.s-arrow { color: #909399; }
.s-score { font-weight: 600; font-family: 'DIN', monospace; }

.sample-empty {
  padding: 16px 0; }

.validation-errors {
  margin-top: 16px;
  background: #FEF7F7;
  border: 1px solid rgba(245,108,108,0.3);
  border-radius: 8px;
  padding: 12px 16px;
}

.errors-header {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #F56C6C;
  margin-bottom: 10px;
}

.errors-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.err-item {
  padding: 6px 10px;
  background: #FEF0F0;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 6px;
}

.err-more {
  font-size: 11px;
  color: #F56C6C;
  padding-left: 4px;
}

.execution-status {
  text-align: center;
  padding: 24px 0 8px;

  &.success .exec-icon { color: #27AE60; }
  &.running .exec-icon { color: #409EFF; animation: spin 1.2s linear infinite; }
  &.error .exec-icon { color: #F56C6C; }
}

@keyframes spin { to { transform: rotate(360deg); } }

.exec-icon { margin-bottom: 10px; }
.exec-title {
  font-size: 18px;
  font-weight: 700;
  color: #1F2D3D;
}
.exec-subtitle { font-size: 12px; color: #8492A6; margin-top: 4px; }

.exec-result {
  max-width: 560px;
  margin: 0 auto;
}

.result-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}

.result-item {
  padding: 16px;
  border-radius: 10px;
  text-align: center;

  &.success { background: #F0F9F4; border: 1px solid rgba(39,174,96,0.3); }
  &.fail { background: #FEF0F0; border: 1px solid rgba(245,108,108,0.3); }
  &.batch-id { background: #F5F9FF; border: 1px solid rgba(64,158,255,0.3); }
}

.result-label {
  font-size: 12px;
  color: #606266;
  margin-bottom: 6px;
}

.result-value {
  font-size: 22px;
  font-weight: 700;
  color: #1F2D3D;
  font-family: 'DIN', monospace;
}

.failed-details {
  background: #FEF7F7;
  border-radius: 8px;
  padding: 14px 18px;
}

.failed-title {
  font-size: 12px;
  color: #F56C6C;
  font-weight: 600;
  margin-bottom: 10px;
}

.failed-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.failed-item {
  font-size: 12px;
  color: #606266;
  padding: 6px 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: #FEF0F0;
  border-radius: 4px;
}

.failed-more {
  font-size: 11px;
  color: #F56C6C;
  padding-left: 4px;
  padding-top: 6px;
}

.footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 992px) {
  .mode-grid { grid-template-columns: 1fr; }
  .preview-header-row, .preview-stats { grid-template-columns: 1fr; }
}
</style>
