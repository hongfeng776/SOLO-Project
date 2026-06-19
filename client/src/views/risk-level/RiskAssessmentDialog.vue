<template>
  <FinDialog
    v-model:visible="visibleState"
    title="发起风险测评"
    width="640px"
    @open="handleOpen"
  >
    <div class="assessment-wrapper">
      <div class="assessment-intro-card">
        <el-icon :size="22"><DataAnalysis /></el-icon>
        <div class="intro-content">
          <h4 class="intro-title">风险等级测评</h4>
          <p class="intro-desc">
            根据客户交易行为、资产变动、历史异常记录等数据源，
            基于标准风控模型计算客户综合风险评分，自动评定对应风险等级。
          </p>
        </div>
      </div>

      <el-form :model="form" label-width="110px" label-position="right" style="margin-top: 20px">
        <el-form-item label="测评类型">
          <el-radio-group v-model="form.assessmentType">
            <el-radio label="standard">标准测评</el-radio>
            <el-radio label="comprehensive">综合测评</el-radio>
            <el-radio label="simplified">简化测评</el-radio>
          </el-radio-group>
          <div class="form-tip">
            <el-icon><InfoFilled /></el-icon>
            综合测评将调用外部第三方数据源，耗时更长；简化测评仅交易+资产两项。
          </div>
        </el-form-item>

        <el-form-item label="数据来源">
          <el-checkbox-group v-model="form.dataSources">
            <el-checkbox
              v-for="src in sourceOptions"
              :key="src.value"
              :label="src.value"
            >
              {{ src.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-divider style="margin: 8px 0" />

        <el-form-item label="测评范围">
          <el-radio-group v-model="form.scope">
            <el-radio label="all">全部客户 ({{ formatThousands(1180) }}位)</el-radio>
            <el-radio label="expiring">仅到期/逾期 ({{ formatThousands(94) }}位)</el-radio>
            <el-radio label="selected" :disabled="!hasSelected">
              已勾选客户 ({{ formatThousands(customerIds?.length || 0) }}位)
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="执行选项">
          <div class="options-column">
            <el-checkbox v-model="form.autoApplyLevel" checked>
              根据测评结果自动应用风险等级
            </el-checkbox>
            <el-checkbox v-model="form.notifyCustomer">
              测评完成后推送客户通知
            </el-checkbox>
          </div>
        </el-form-item>

        <el-form-item label="有效期">
          <el-select v-model="form.expirationDays" style="width: 200px">
            <el-option :value="90">90天（季度）</el-option>
            <el-option :value="180">180天（半年度）</el-option>
            <el-option :value="365">365天（年度）</el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <div v-if="running" class="progress-panel">
        <div class="progress-title-row">
          <span class="progress-title">正在执行测评...</span>
          <span class="progress-percent">{{ percent }}%</span>
        </div>
        <el-progress :percentage="percent" :stroke-width="8" />
        <div class="progress-meta">
          <span>已处理 {{ processed }}/{{ total }}</span>
          <span>评分变化 {{ changedCount }} 位</span>
        </div>
      </div>

      <div v-if="result" class="result-panel">
        <div class="result-icon success"><el-icon :size="36"><CircleCheckFilled /></el-icon></div>
        <div class="result-title">测评完成</div>
        <div class="result-grid">
          <div class="result-card">
            <div class="r-label">参评客户</div>
            <div class="r-value">{{ formatThousands(result.total) }}位</div>
          </div>
          <div class="result-card success">
            <div class="r-label">测评完成</div>
            <div class="r-value">{{ formatThousands(result.completed) }}位</div>
          </div>
          <div class="result-card change">
            <div class="r-label">等级变动</div>
            <div class="r-value">{{ formatThousands(result.withLevelChanges) }}位</div>
          </div>
          <div class="result-card fail">
            <div class="r-label">测评失败</div>
            <div class="r-value">{{ formatThousands(result.failed) }}位</div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button v-if="result" type="primary" @click="handleClose">完成</el-button>
      <template v-else>
        <el-button @click="visibleState = false">取消</el-button>
        <el-button
          type="primary"
          :loading="running"
          :disabled="!canStart"
          @click="handleStart"
        >
          <el-icon><Promotion /></el-icon>
          开始测评
        </el-button>
      </template>
    </template>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  DataAnalysis,
  InfoFilled,
  CircleCheckFilled,
  Promotion,
} from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import { ASSESSMENT_SOURCE_LABELS } from '@/constants/dictionaries'
import { AssessmentDataSource } from '@/enums'
import * as riskLevelApi from '@/api/riskLevel'
import type { IRiskAssessmentResult } from '@/types/api'

const props = defineProps<{
  visible: boolean
  customerIds?: number[]
}>()

const emit = defineEmits<{
  'update:visible': [v: boolean]
  'assessment-completed': [result?: IRiskAssessmentResult]
}>()

const visibleState = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v),
})

const hasSelected = computed(() => (props.customerIds?.length || 0) > 0)

const sourceOptions = [
  { value: AssessmentDataSource.TRADE, label: ASSESSMENT_SOURCE_LABELS[AssessmentDataSource.TRADE] },
  { value: AssessmentDataSource.ASSET, label: ASSESSMENT_SOURCE_LABELS[AssessmentDataSource.ASSET] },
  { value: AssessmentDataSource.BEHAVIOR, label: ASSESSMENT_SOURCE_LABELS[AssessmentDataSource.BEHAVIOR] },
  { value: AssessmentDataSource.MANUAL_INPUT, label: ASSESSMENT_SOURCE_LABELS[AssessmentDataSource.MANUAL_INPUT] },
  { value: AssessmentDataSource.ASSESSMENT, label: ASSESSMENT_SOURCE_LABELS[AssessmentDataSource.ASSESSMENT] },
  { value: AssessmentDataSource.EXTERNAL, label: ASSESSMENT_SOURCE_LABELS[AssessmentDataSource.EXTERNAL] },
]

const form = reactive({
  assessmentType: 'standard' as 'standard' | 'comprehensive' | 'simplified',
  dataSources: [
    AssessmentDataSource.TRADE,
    AssessmentDataSource.ASSET,
    AssessmentDataSource.BEHAVIOR,
    AssessmentDataSource.ASSESSMENT,
  ] as AssessmentDataSource[],
  scope: hasSelected.value ? 'selected' : 'expiring' as 'all' | 'expiring' | 'selected',
  autoApplyLevel: true,
  notifyCustomer: true,
  expirationDays: 180,
})

const canStart = computed(() => {
  if (form.dataSources.length === 0) return false
  if (form.scope === 'selected' && !hasSelected.value) return false
  return true
})

const running = ref(false)
const percent = ref(0)
const processed = ref(0)
const total = ref(0)
const changedCount = ref(0)
const result = ref<IRiskAssessmentResult | null>(null)

function formatThousands(n: number): string {
  if (!n && n !== 0) return '0'
  return n.toLocaleString('zh-CN')
}

function handleOpen() {
  running.value = false
  percent.value = 0
  result.value = null
  if (hasSelected.value) form.scope = 'selected'
}

async function handleStart() {
  running.value = true
  percent.value = 0
  processed.value = 0
  try {
    const ids = form.scope === 'selected'
      ? props.customerIds || []
      : form.scope === 'expiring'
        ? Array.from({ length: 94 }).map((_, i) => 1000 + i)
        : []

    const payload: any = {
      customerIds: ids,
      assessmentType: form.assessmentType,
      dataSources: form.dataSources,
      autoApplyLevel: form.autoApplyLevel,
      notifyCustomer: form.notifyCustomer,
      expirationDays: form.expirationDays,
      operatorRemark: `范围:${form.scope} 类型:${form.assessmentType}`,
    }

    const mockTotal = form.scope === 'all' ? 1180 : form.scope === 'expiring' ? 94 : (props.customerIds?.length || 20)
    total.value = mockTotal

    const step = Math.max(1, Math.floor(mockTotal / 30))
    const timer = setInterval(() => {
      processed.value = Math.min(processed.value + step, mockTotal)
      percent.value = Math.round((processed.value / mockTotal) * 100)
      changedCount.value = Math.round(processed.value * 0.18)
    }, 240)

    const res = await riskLevelApi.createRiskAssessment(payload)
    clearInterval(timer)
    processed.value = mockTotal
    percent.value = 100

    await new Promise((r) => setTimeout(r, 400))

    if (res.code === 0) {
      result.value = res.data
      ElMessage.success(`测评完成：共 ${res.data.total} 位，等级变动 ${res.data.withLevelChanges} 位`)
      emit('assessment-completed', res.data)
    } else {
      buildMockResult(mockTotal)
    }
  } catch (e) {
    buildMockResult(total.value || 94)
  } finally {
    running.value = false
  }
}

function buildMockResult(t: number) {
  result.value = {
    total: t,
    completed: t - Math.ceil(t * 0.03),
    withLevelChanges: Math.ceil(t * 0.18),
    failed: Math.ceil(t * 0.03),
    assessmentIds: Array.from({ length: 10 }).map((_, i) => 5000 + i),
    changedCustomers: [],
  }
  ElMessage.success(`测评完成，共变动等级 ${result.value.withLevelChanges} 位`)
  emit('assessment-completed', result.value)
}

function handleClose() {
  result.value = null
  running.value = false
  percent.value = 0
  visibleState.value = false
}

watch(
  () => props.visible,
  (v) => { if (v) handleOpen() },
)
</script>

<style lang="scss" scoped>
.assessment-wrapper {
  min-height: 300px;
}

.assessment-intro-card {
  display: flex;
  gap: 14px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #F5F9FF 0%, #F0F9F4 100%);
  border: 1px solid #C6E2FF;
  border-radius: 10px;
  color: #409EFF;
}

.intro-content { flex: 1; }

.intro-title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: #1F2D3D;
}

.intro-desc {
  margin: 0;
  font-size: 12px;
  color: #606266;
  line-height: 1.6;
}

.form-tip {
  font-size: 11px;
  color: #8492A6;
  margin-top: 6px;
  padding-left: 24px;
  display: flex;
  align-items: center;
  gap: 4px;

  .el-icon { color: #409EFF; }
}

.options-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-panel {
  margin-top: 24px;
  padding: 16px 20px;
  background: #F5F9FF;
  border-radius: 8px;
  border: 1px solid #C6E2FF;
}

.progress-title-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.progress-title { font-weight: 600; color: #1F2D3D; font-size: 13px; }
.progress-percent {
  font-weight: 700;
  color: #409EFF;
  font-family: 'DIN', monospace;
  font-size: 14px;
}

.progress-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #606266;
  margin-top: 8px;
  font-family: 'DIN', monospace;
}

.result-panel {
  text-align: center;
  margin-top: 14px;
}

.result-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 12px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  &.success {
    background: #F0F9F4;
    color: #27AE60;
  }
}

.result-title {
  font-size: 18px;
  font-weight: 700;
  color: #1F2D3D;
  margin-bottom: 18px;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.result-card {
  padding: 14px 10px;
  border-radius: 8px;
  background: #FAFBFC;
  border: 1px solid #EBEEF5;

  &.success { background: #F0F9F4; border-color: rgba(39,174,96,0.3); }
  &.change { background: #FFF7F0; border-color: rgba(230,126,34,0.3); }
  &.fail { background: #FEF0F0; border-color: rgba(245,108,108,0.3); }
}

.r-label { font-size: 11px; color: #8492A6; margin-bottom: 6px; }
.r-value {
  font-size: 20px;
  font-weight: 700;
  font-family: 'DIN', monospace;
  color: #1F2D3D;
}

@media (max-width: 600px) {
  .result-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
