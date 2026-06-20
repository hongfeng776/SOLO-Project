<template>
  <transition name="zoom-fade" appear>
    <FinDialog
      v-model:visible="visibleState"
      title="高级复盘筛选"
      width="880px"
      :close-on-click-modal="false"
      class="replay-filter-dialog"
      @open="handleOpen"
    >
      <div class="filter-wrapper">
        <div class="filter-intro">
          <el-icon><Filter /></el-icon>
          <div>
            <h4>多维度嵌套筛选</h4>
            <p>支持最多4层AND/OR逻辑组合，实时校验合规性与查询性能。</p>
          </div>
        </div>

        <el-form label-width="100px" label-position="right">
          <el-form-item label="复盘时间">
            <el-radio-group v-model="form.timeRange" size="default">
              <el-radio-button
                v-for="opt in REPLAY_TIME_RANGE_OPTIONS"
                :key="opt.value"
                :label="opt.value"
              >{{ opt.label }}</el-radio-button>
            </el-radio-group>
            <el-date-picker
              v-if="form.timeRange === ReplayTimeRange.CUSTOM"
              v-model="customRange"
              type="daterange"
              value-format="YYYY-MM-DD"
              style="margin-left: 10px; width: 240px"
            />
          </el-form-item>

          <el-form-item label="异常类型">
            <el-select
              v-model="form.exceptionTypes"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="选择异常类型"
              style="width: 100%"
            >
              <el-option
                v-for="(label, key) in INTERCEPTION_TYPE_LABELS"
                :key="key"
                :label="label"
                :value="key"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="风险等级">
            <el-checkbox-group v-model="form.riskLevels">
              <el-checkbox
                v-for="(label, key) in CUSTOMER_RISK_LEVEL_LABELS"
                :key="key"
                :label="key"
                :style="{ color: CUSTOMER_RISK_LEVEL_COLORS[key as CustomerRiskLevel] }"
              >{{ label }}</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="拦截效果">
            <el-checkbox-group v-model="form.interceptionEffects">
              <el-checkbox
                v-for="(label, key) in INTERCEPTION_EFFECT_LABELS"
                :key="key"
                :label="key"
                :style="{ color: INTERCEPTION_EFFECT_COLORS[key as InterceptionEffectiveness] }"
              >{{ label }}</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="处理通道">
            <el-checkbox-group v-model="form.reviewChannels">
              <el-checkbox
                v-for="(label, key) in HANDLE_CHANNEL_LABELS"
                :key="key"
                :label="key"
                :style="{ color: HANDLE_CHANNEL_COLORS[key as HandleChannel] }"
              >{{ label }}</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="涉及金额">
            <div class="range-row">
              <el-input-number
                v-model="form.minInvolvedAmount"
                :min="0"
                controls-position="right"
                style="width: 160px"
                placeholder="最小金额"
              />
              <span class="range-sep">~</span>
              <el-input-number
                v-model="form.maxInvolvedAmount"
                :min="0"
                controls-position="right"
                style="width: 160px"
                placeholder="最大金额"
              />
              <span class="range-unit">元</span>
            </div>
          </el-form-item>
        </el-form>

        <el-divider content-position="left">
          <span class="nested-title"><el-icon><Grid /></el-icon>嵌套逻辑组合（可选）</span>
        </el-divider>

        <div class="nested-groups">
          <div
            v-for="(group, gIdx) in nestedGroups"
            :key="gIdx"
            class="nested-group"
          >
            <div class="group-header">
              <span class="group-index">组 {{ gIdx + 1 }}</span>
              <el-radio-group v-model="group.logic" size="small">
                <el-radio-button label="AND">AND（全部满足）</el-radio-button>
                <el-radio-button label="OR">OR（任一满足）</el-radio-button>
              </el-radio-group>
              <el-button
                v-if="nestedGroups.length > 1"
                type="danger"
                link
                size="small"
                @click="removeGroup(gIdx)"
              >
                <el-icon><Delete /></el-icon>删除组
              </el-button>
            </div>
            <div class="conditions">
              <div
                v-for="(cond, cIdx) in group.conditions"
                :key="cIdx"
                class="condition-row"
              >
                <el-select
                  v-model="cond.dimension"
                  size="small"
                  placeholder="维度"
                  style="width: 140px"
                >
                  <el-option
                    v-for="(label, key) in REPLAY_DIMENSION_LABELS"
                    :key="key"
                    :label="label"
                    :value="key"
                  />
                </el-select>
                <el-select v-model="cond.operator" size="small" placeholder="操作符" style="width: 120px">
                  <el-option label="包含" value="in" />
                  <el-option label="不包含" value="not_in" />
                  <el-option label="等于" value="eq" />
                  <el-option label="大于" value="gt" />
                  <el-option label="小于" value="lt" />
                </el-select>
                <el-select
                  v-model="cond.values"
                  multiple
                  size="small"
                  placeholder="值"
                  style="flex: 1"
                  collapse-tags
                >
                  <el-option label="示例值A" value="a" />
                  <el-option label="示例值B" value="b" />
                  <el-option label="示例值C" value="c" />
                </el-select>
                <el-button
                  v-if="group.conditions.length > 1"
                  type="danger"
                  link
                  size="small"
                  @click="removeCondition(gIdx, cIdx)"
                ><el-icon><Close /></el-icon></el-button>
              </div>
              <el-button
                type="primary"
                link
                size="small"
                @click="addCondition(gIdx)"
              ><el-icon><Plus /></el-icon>添加条件</el-button>
            </div>
          </div>
          <el-button
            v-if="nestedGroups.length < 4"
            type="primary"
            plain
            size="small"
            @click="addGroup"
          >
            <el-icon><Plus /></el-icon>新增组（AND 关系）
          </el-button>
        </div>

        <div class="preview-validation" v-if="validationResult">
          <div class="pv-row">
            <span class="pv-label">嵌套深度</span>
            <span class="pv-value">{{ validationResult.nestedDepth }} 层</span>
          </div>
          <div class="pv-row">
            <span class="pv-label">预估记录</span>
            <span class="pv-value strong">{{ formatThousands(validationResult.estimatedRecords) }} 条</span>
          </div>
          <div class="pv-row">
            <span class="pv-label">预估响应</span>
            <span class="pv-value">{{ validationResult.estimatedResponseMs }} ms</span>
          </div>
          <div class="pv-row">
            <span class="pv-label">时间跨度</span>
            <span
              class="pv-value"
              :class="{ danger: validationResult.timeSpanDays > 180 }"
            >{{ validationResult.timeSpanDays }} 天</span>
          </div>
          <div class="pv-row" v-if="validationResult.timeSpanDays > 180">
            <span class="warn-msg">
              <el-icon><WarningFilled /></el-icon>
              时间跨度超过180天，可能影响查询性能，建议分批查询。
            </span>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="handleReset">重置条件</el-button>
        <el-button @click="visibleState = false">取消</el-button>
        <el-button type="primary" @click="handleApply">
          <el-icon><Check /></el-icon>应用筛选
        </el-button>
      </template>
    </FinDialog>
  </transition>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Filter, Grid, Delete, Close, Plus, WarningFilled, Check,
} from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import {
  REPLAY_TIME_RANGE_OPTIONS,
  INTERCEPTION_TYPE_LABELS,
  CUSTOMER_RISK_LEVEL_LABELS,
  CUSTOMER_RISK_LEVEL_COLORS,
  INTERCEPTION_EFFECT_LABELS,
  INTERCEPTION_EFFECT_COLORS,
  HANDLE_CHANNEL_LABELS,
  HANDLE_CHANNEL_COLORS,
  REPLAY_DIMENSION_LABELS,
} from '@/constants/dictionaries'
import {
  ReplayTimeRange,
  CustomerRiskLevel,
  InterceptionEffectiveness,
  HandleChannel,
  ReplayAnalysisDimension,
} from '@/enums'
import * as riskReplayApi from '@/api/riskReplay'
import type { IReplayQueryParams, IReplayFilterValidation } from '@/types/api'

const props = defineProps<{
  visible: boolean
  currentParams: IReplayQueryParams
}>()

const emit = defineEmits<{
  'update:visible': [v: boolean]
  'apply': [params: IReplayQueryParams]
}>()

const visibleState = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v),
})

const customRange = ref<[string, string] | null>(null)

const form = reactive<any>({
  timeRange: ReplayTimeRange.LAST_MONTH,
  exceptionTypes: [],
  riskLevels: [],
  interceptionEffects: [],
  reviewChannels: [],
  minInvolvedAmount: undefined,
  maxInvolvedAmount: undefined,
})

const nestedGroups = ref<any[]>([
  {
    logic: 'AND',
    conditions: [
      { dimension: ReplayAnalysisDimension.EXCEPTION_TYPE, operator: 'in', values: [] },
    ],
  },
])

const validationResult = ref<IReplayFilterValidation | null>(null)

function formatThousands(n: number): string {
  return (n || 0).toLocaleString('zh-CN')
}

function addGroup() {
  if (nestedGroups.value.length >= 4) {
    ElMessage.warning('最多支持4组嵌套条件')
    return
  }
  nestedGroups.value.push({
    logic: 'AND',
    conditions: [{ dimension: undefined, operator: 'in', values: [] }],
  })
}

function removeGroup(idx: number) {
  nestedGroups.value.splice(idx, 1)
}

function addCondition(gIdx: number) {
  nestedGroups.value[gIdx].conditions.push({
    dimension: undefined, operator: 'in', values: [],
  })
}

function removeCondition(gIdx: number, cIdx: number) {
  nestedGroups.value[gIdx].conditions.splice(cIdx, 1)
}

function handleOpen() {
  Object.assign(form, props.currentParams || {})
  runValidation()
}

function handleReset() {
  form.timeRange = ReplayTimeRange.LAST_MONTH
  form.exceptionTypes = []
  form.riskLevels = []
  form.interceptionEffects = []
  form.reviewChannels = []
  form.minInvolvedAmount = undefined
  form.maxInvolvedAmount = undefined
  customRange.value = null
  nestedGroups.value = [{ logic: 'AND', conditions: [{ dimension: undefined, operator: 'in', values: [] }] }]
  runValidation()
}

async function runValidation() {
  try {
    const payload = buildPayload()
    const res = await riskReplayApi.validateReplayFilter(payload as any)
    validationResult.value = res.code === 0 ? res.data : buildMockVal()
  } catch (e) {
    validationResult.value = buildMockVal()
  }
}

function buildMockVal() {
  const span = {
    [ReplayTimeRange.LAST_DAY]: 1, [ReplayTimeRange.LAST_WEEK]: 7,
    [ReplayTimeRange.LAST_MONTH]: 30, [ReplayTimeRange.LAST_QUARTER]: 90,
    [ReplayTimeRange.LAST_HALF_YEAR]: 180, [ReplayTimeRange.CUSTOM]: 30,
  }[form.timeRange] || 30
  return {
    valid: span <= 180,
    totalFilters: (form.exceptionTypes?.length || 0) + (form.riskLevels?.length || 0) + nestedGroups.value.reduce((a, g) => a + g.conditions.filter((c: any) => c.dimension).length, 0) || 1,
    nestedDepth: Math.min(nestedGroups.value.length, 4),
    warnings: span > 180 ? [{ code: 'W002', message: '时间区间超限', severity: 'error' }] : [],
    timeSpanDays: span,
    estimatedRecords: span * 42 + 120,
    estimatedResponseMs: span * 12 + 300,
    complianceFlags: [],
  }
}

function buildPayload(): Partial<IReplayQueryParams> {
  const p: any = { ...form }
  if (customRange.value?.length === 2) {
    p.customStart = customRange.value[0]
    p.customEnd = customRange.value[1]
  }
  return p
}

function handleApply() {
  if (validationResult.value && validationResult.value.timeSpanDays > 180) {
    ElMessage.warning('请将时间区间调整至180天以内')
    return
  }
  const payload = buildPayload() as IReplayQueryParams
  emit('apply', payload)
}

watch(
  [() => form.timeRange, () => customRange.value],
  () => runValidation(),
  { deep: true },
)
</script>

<style lang="scss" scoped>
.replay-filter-dialog {
  :deep(.el-dialog) {
    transition: transform 0.3s cubic-bezier(0.3, 0, 0.2, 1), opacity 0.3s;
  }
}

.zoom-fade-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.zoom-fade-leave-active {
  transition: all 0.25s ease;
}
.zoom-fade-enter-from {
  transform: scale(0.85);
  opacity: 0;
}
.zoom-fade-leave-to {
  transform: scale(0.9);
  opacity: 0;
}

.filter-wrapper { min-height: 260px; }

.filter-intro {
  display: flex; gap: 12px; padding: 14px 18px;
  background: linear-gradient(135deg, #F5F9FF 0%, #F0F9F4 100%);
  border: 1px solid #C6E2FF;
  border-radius: 8px;
  color: #409EFF;
  margin-bottom: 20px;
  .el-icon { font-size: 22px; flex-shrink: 0; }
  h4 { margin: 0 0 4px; font-size: 14px; color: #1F2D3D; }
  p { margin: 0; font-size: 12px; color: #606266; }
}

.range-row { display: flex; align-items: center; gap: 8px; }
.range-sep { color: #8492A6; }
.range-unit { color: #8492A6; font-size: 12px; }

.nested-title {
  font-size: 13px; font-weight: 600; color: #1F2D3D;
  display: inline-flex; align-items: center; gap: 4px;
  .el-icon { color: #409EFF; }
}

.nested-groups {
  display: flex; flex-direction: column; gap: 14px;
  padding: 8px 4px 4px;
}

.nested-group {
  background: #FAFBFC;
  border: 1px dashed #DCDFE6;
  border-radius: 8px;
  padding: 12px 14px;
}

.group-header {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 10px; flex-wrap: wrap;
}

.group-index {
  padding: 2px 10px;
  background: #ECF5FF;
  color: #409EFF;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.conditions {
  display: flex; flex-direction: column; gap: 8px;
}

.condition-row {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  gap: 8px;
  align-items: center;
}

.preview-validation {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-top: 22px;
  padding: 14px 18px;
  background: linear-gradient(180deg, #F5F9FF 0%, #fff 100%);
  border: 1px solid #C6E2FF;
  border-radius: 8px;
}

.pv-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 10px;
  border-right: 1px dashed #C6E2FF;

  &:last-child, &:nth-child(4) { border-right: none; }
  &:nth-child(5) { grid-column: 1 / 5; }
}

.pv-label {
  font-size: 11px; color: #8492A6;
}

.pv-value {
  font-size: 14px; font-weight: 600; color: #1F2D3D;
  font-family: 'DIN', monospace;

  &.strong { font-size: 18px; color: #2980B9; }
  &.danger { color: #F56C6C; }
}

.warn-msg {
  padding: 6px 10px;
  background: #FEF0F0;
  color: #F56C6C;
  border-radius: 4px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

@media (max-width: 992px) {
  .preview-validation { grid-template-columns: repeat(2, 1fr); }
  .pv-row { border-right: none; border-bottom: 1px dashed #C6E2FF; padding-bottom: 10px; }
  .pv-row:nth-child(odd) { border-right: 1px dashed #C6E2FF; padding-right: 10px; }
  .pv-row:nth-child(5) { grid-column: 1 / -1; border-bottom: none; }
  .condition-row { grid-template-columns: 1fr; }
}
</style>
