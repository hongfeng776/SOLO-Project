<template>
  <div class="period-config">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <el-icon><Setting /></el-icon>
          运力时段配置管控
        </h2>
        <span class="header-subtitle">
          <el-icon><Timer /></el-icon>
          配置不同时段运力阈值，适配多种业务场景
        </span>
      </div>
      <div class="header-right">
        <el-button :icon="Copy" @click="handleBatchConfig">
          批量时段配置
        </el-button>
        <el-button type="primary" :icon="Document" @click="handleViewTrace">
          配置溯源记录
        </el-button>
      </div>
    </div>

    <el-card class="city-selector-card" shadow="never">
      <div class="city-selector-content">
        <span class="selector-label">
          <el-icon><Search /></el-icon>
          选择城市
        </span>
        <el-select
          v-model="selectedCity"
          placeholder="请选择城市"
          style="width: 200px"
          @change="handleCityChange"
        >
          <el-option
            v-for="city in CITY_OPTIONS"
            :key="city"
            :label="city"
            :value="city"
          />
        </el-select>
        <el-tag v-if="precheckResult" type="success" size="small" class="baseline-tag">
          历史基准：{{ precheckResult.historicalBaseline.avgOrdersPerHour }}单/小时
        </el-tag>
      </div>
    </el-card>

    <el-row :gutter="20" class="main-layout">
      <el-col :span="14">
        <el-card class="threshold-config-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><DataAnalysis /></el-icon>
                时段阈值配置
              </span>
              <div class="header-actions">
                <el-button size="small" :icon="Refresh" @click="handleResetDefaults">
                  恢复默认
                </el-button>
                <el-button
                  type="primary"
                  size="small"
                  :icon="MagicStick"
                  :loading="precheckLoading"
                  @click="handlePrecheck"
                >
                  前置校验
                </el-button>
              </div>
            </div>
          </template>

          <el-table :data="periodConfigs" border stripe class="threshold-table">
            <el-table-column
              prop="period"
              label="时段"
              width="170"
              fixed="left"
              align="center"
            >
              <template #default="{ row }">
                <span class="period-name">{{ row.period }}</span>
              </template>
            </el-table-column>

            <el-table-column label="高峰订单阈值" min-width="140" align="center">
              <template #default="{ row }">
                <div
                  class="input-cell"
                  :class="{
                    'field-focused': isFocused(row.period, 'peakThreshold'),
                    'field-invalid': isFieldInvalid(row.period, 'peakThreshold')
                  }"
                >
                  <el-input-number
                    v-model="row.peakThreshold"
                    :min="PERIOD_THRESHOLD_RANGES.peakThreshold.min"
                    :max="PERIOD_THRESHOLD_RANGES.peakThreshold.max"
                    :step="1"
                    size="small"
                    class="threshold-input"
                    :controls="false"
                    @focus="onInputFocus(row.period, 'peakThreshold')"
                    @blur="onInputBlur"
                  />
                  <span class="input-unit">{{ PERIOD_THRESHOLD_RANGES.peakThreshold.unit }}</span>
                  <div v-if="validateField(row, 'peakThreshold', row.peakThreshold)" class="field-error">
                    {{ validateField(row, 'peakThreshold', row.peakThreshold) }}
                  </div>
                  <span v-if="getValidationStatus(row.period, 'peakThreshold') === 'valid'" class="field-status valid">
                    <el-icon><CircleCheck /></el-icon>
                  </span>
                  <span v-else-if="getValidationStatus(row.period, 'peakThreshold') === 'invalid'" class="field-status invalid">
                    <el-icon><CircleClose /></el-icon>
                  </span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="平峰订单阈值" min-width="140" align="center">
              <template #default="{ row }">
                <div
                  class="input-cell"
                  :class="{
                    'field-focused': isFocused(row.period, 'flatThreshold'),
                    'field-invalid': isFieldInvalid(row.period, 'flatThreshold')
                  }"
                >
                  <el-input-number
                    v-model="row.flatThreshold"
                    :min="PERIOD_THRESHOLD_RANGES.flatThreshold.min"
                    :max="PERIOD_THRESHOLD_RANGES.flatThreshold.max"
                    :step="1"
                    size="small"
                    class="threshold-input"
                    :controls="false"
                    @focus="onInputFocus(row.period, 'flatThreshold')"
                    @blur="onInputBlur"
                  />
                  <span class="input-unit">{{ PERIOD_THRESHOLD_RANGES.flatThreshold.unit }}</span>
                  <div v-if="validateField(row, 'flatThreshold', row.flatThreshold)" class="field-error">
                    {{ validateField(row, 'flatThreshold', row.flatThreshold) }}
                  </div>
                  <span v-if="getValidationStatus(row.period, 'flatThreshold') === 'valid'" class="field-status valid">
                    <el-icon><CircleCheck /></el-icon>
                  </span>
                  <span v-else-if="getValidationStatus(row.period, 'flatThreshold') === 'invalid'" class="field-status invalid">
                    <el-icon><CircleClose /></el-icon>
                  </span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="低谷订单阈值" min-width="140" align="center">
              <template #default="{ row }">
                <div
                  class="input-cell"
                  :class="{
                    'field-focused': isFocused(row.period, 'valleyThreshold'),
                    'field-invalid': isFieldInvalid(row.period, 'valleyThreshold')
                  }"
                >
                  <el-input-number
                    v-model="row.valleyThreshold"
                    :min="PERIOD_THRESHOLD_RANGES.valleyThreshold.min"
                    :max="PERIOD_THRESHOLD_RANGES.valleyThreshold.max"
                    :step="1"
                    size="small"
                    class="threshold-input"
                    :controls="false"
                    @focus="onInputFocus(row.period, 'valleyThreshold')"
                    @blur="onInputBlur"
                  />
                  <span class="input-unit">{{ PERIOD_THRESHOLD_RANGES.valleyThreshold.unit }}</span>
                  <div v-if="validateField(row, 'valleyThreshold', row.valleyThreshold)" class="field-error">
                    {{ validateField(row, 'valleyThreshold', row.valleyThreshold) }}
                  </div>
                  <span v-if="getValidationStatus(row.period, 'valleyThreshold') === 'valid'" class="field-status valid">
                    <el-icon><CircleCheck /></el-icon>
                  </span>
                  <span v-else-if="getValidationStatus(row.period, 'valleyThreshold') === 'invalid'" class="field-status invalid">
                    <el-icon><CircleClose /></el-icon>
                  </span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="空闲率阈值" min-width="140" align="center">
              <template #default="{ row }">
                <div
                  class="input-cell"
                  :class="{
                    'field-focused': isFocused(row.period, 'idleRateThreshold'),
                    'field-invalid': isFieldInvalid(row.period, 'idleRateThreshold')
                  }"
                >
                  <el-input-number
                    v-model="row.idleRateThreshold"
                    :min="PERIOD_THRESHOLD_RANGES.idleRateThreshold.min"
                    :max="PERIOD_THRESHOLD_RANGES.idleRateThreshold.max"
                    :step="0.01"
                    :precision="2"
                    size="small"
                    class="threshold-input"
                    :controls="false"
                    @focus="onInputFocus(row.period, 'idleRateThreshold')"
                    @blur="onInputBlur"
                  />
                  <span class="input-unit">{{ PERIOD_THRESHOLD_RANGES.idleRateThreshold.unit }}</span>
                  <div v-if="validateField(row, 'idleRateThreshold', row.idleRateThreshold)" class="field-error">
                    {{ validateField(row, 'idleRateThreshold', row.idleRateThreshold) }}
                  </div>
                  <span v-if="getValidationStatus(row.period, 'idleRateThreshold') === 'valid'" class="field-status valid">
                    <el-icon><CircleCheck /></el-icon>
                  </span>
                  <span v-else-if="getValidationStatus(row.period, 'idleRateThreshold') === 'invalid'" class="field-status invalid">
                    <el-icon><CircleClose /></el-icon>
                  </span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="紧缺判定阈值" min-width="140" align="center">
              <template #default="{ row }">
                <div
                  class="input-cell"
                  :class="{
                    'field-focused': isFocused(row.period, 'shortageThreshold'),
                    'field-invalid': isFieldInvalid(row.period, 'shortageThreshold')
                  }"
                >
                  <el-input-number
                    v-model="row.shortageThreshold"
                    :min="PERIOD_THRESHOLD_RANGES.shortageThreshold.min"
                    :max="PERIOD_THRESHOLD_RANGES.shortageThreshold.max"
                    :step="0.1"
                    :precision="1"
                    size="small"
                    class="threshold-input"
                    :controls="false"
                    @focus="onInputFocus(row.period, 'shortageThreshold')"
                    @blur="onInputBlur"
                  />
                  <span class="input-unit">{{ PERIOD_THRESHOLD_RANGES.shortageThreshold.unit }}</span>
                  <div v-if="validateField(row, 'shortageThreshold', row.shortageThreshold)" class="field-error">
                    {{ validateField(row, 'shortageThreshold', row.shortageThreshold) }}
                  </div>
                  <span v-if="getValidationStatus(row.period, 'shortageThreshold') === 'valid'" class="field-status valid">
                    <el-icon><CircleCheck /></el-icon>
                  </span>
                  <span v-else-if="getValidationStatus(row.period, 'shortageThreshold') === 'invalid'" class="field-status invalid">
                    <el-icon><CircleClose /></el-icon>
                  </span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="过剩判定阈值" min-width="140" align="center" fixed="right">
              <template #default="{ row }">
                <div
                  class="input-cell"
                  :class="{
                    'field-focused': isFocused(row.period, 'surplusThreshold'),
                    'field-invalid': isFieldInvalid(row.period, 'surplusThreshold')
                  }"
                >
                  <el-input-number
                    v-model="row.surplusThreshold"
                    :min="PERIOD_THRESHOLD_RANGES.surplusThreshold.min"
                    :max="PERIOD_THRESHOLD_RANGES.surplusThreshold.max"
                    :step="0.1"
                    :precision="1"
                    size="small"
                    class="threshold-input"
                    :controls="false"
                    @focus="onInputFocus(row.period, 'surplusThreshold')"
                    @blur="onInputBlur"
                  />
                  <span class="input-unit">{{ PERIOD_THRESHOLD_RANGES.surplusThreshold.unit }}</span>
                  <div v-if="validateField(row, 'surplusThreshold', row.surplusThreshold)" class="field-error">
                    {{ validateField(row, 'surplusThreshold', row.surplusThreshold) }}
                  </div>
                  <span v-if="getValidationStatus(row.period, 'surplusThreshold') === 'valid'" class="field-status valid">
                    <el-icon><CircleCheck /></el-icon>
                  </span>
                  <span v-else-if="getValidationStatus(row.period, 'surplusThreshold') === 'invalid'" class="field-status invalid">
                    <el-icon><CircleClose /></el-icon>
                  </span>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <div class="range-reference">
            <span class="reference-title">行业参考范围：</span>
            <el-tag
              v-for="(range, key) in PERIOD_THRESHOLD_RANGES"
              :key="key"
              size="small"
              type="info"
              effect="plain"
              class="range-tag"
            >
              {{ range.label }}: {{ range.min }}~{{ range.max }}{{ range.unit }} (均值{{ range.industryAvg }})
            </el-tag>
          </div>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card class="scene-adapt-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><MagicStick /></el-icon>
                场景自动适配
              </span>
            </div>
          </template>

          <el-form :model="sceneForm" label-position="top" class="scene-form">
            <el-form-item label="选择场景类型">
              <el-radio-group v-model="sceneForm.sceneType" class="scene-radio-group">
                <el-radio
                  v-for="(label, key) in SceneTypeMap"
                  :key="key"
                  :value="key"
                  class="scene-radio"
                >
                  <span
                    class="scene-tag"
                    :style="{ background: getSceneGradient(key as string) }"
                  >
                    {{ label }}
                  </span>
                </el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item
              v-if="sceneForm.sceneType === 'holiday'"
              label="节假日类型"
            >
              <el-select
                v-model="sceneForm.holidayType"
                placeholder="请选择节假日类型"
                style="width: 100%"
              >
                <el-option label="法定节假日(春节/国庆)" value="statutory" />
                <el-option label="普通周末" value="weekend" />
                <el-option label="调休工作日" value="adjusted_workday" />
                <el-option label="特殊节日(情人节/圣诞)" value="special" />
              </el-select>
            </el-form-item>

            <el-form-item
              v-if="sceneForm.sceneType === 'weather'"
              label="天气影响等级"
            >
              <el-slider
                v-model="sceneForm.weatherLevel"
                :min="1"
                :max="5"
                :marks="weatherMarks"
                :step="1"
                show-stops
              />
            </el-form-item>

            <el-form-item
              v-if="sceneForm.sceneType === 'large_event'"
              label="活动规模"
            >
              <el-radio-group v-model="sceneForm.eventScale">
                <el-radio value="small">小型(万人以下)</el-radio>
                <el-radio value="medium">中型(1-10万人)</el-radio>
                <el-radio value="large">大型(10万人以上)</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                :icon="MagicStick"
                :loading="sceneLoading"
                @click="handleSceneAdapt"
                style="width: 100%"
              >
                应用场景适配
              </el-button>
            </el-form-item>
          </el-form>

          <div v-if="sceneResult" class="scene-result">
            <div class="result-header">
              <span
                class="result-scene-tag"
                :style="{ background: getSceneGradient(sceneResult.sceneType) }"
              >
                {{ SceneTypeMap[sceneResult.sceneType as keyof typeof SceneTypeMap] }}适配结果
              </span>
              <span class="effective-time">
                <el-icon><Timer /></el-icon>
                生效时间：{{ sceneResult.effectiveTime }}
              </span>
            </div>

            <div class="adapt-rules">
              <el-tag size="small" type="warning" class="rule-tag">
                峰值系数 x{{ sceneResult.adaptRules.peakMultiplier }}
              </el-tag>
              <el-tag size="small" type="danger" class="rule-tag">
                预警系数 x{{ sceneResult.adaptRules.warningMultiplier }}
              </el-tag>
              <el-tag size="small" type="primary" class="rule-tag">
                调度系数 x{{ sceneResult.adaptRules.dispatchMultiplier }}
              </el-tag>
            </div>

            <div class="adapted-periods">
              <div
                v-for="(config, idx) in sceneResult.adaptedConfigs"
                :key="idx"
                class="adapted-period-item"
                :class="{ 'period-updated': isPeriodUpdated(config) }"
              >
                <div class="period-header">
                  <span class="period-label">{{ config.period }}</span>
                  <el-tag
                    v-if="isPeriodUpdated(config)"
                    size="small"
                    type="success"
                    effect="dark"
                    class="adjustment-ratio"
                  >
                    x{{ config.adjustmentRatio }}
                  </el-tag>
                </div>
                <div class="period-comparison">
                  <div class="comparison-item">
                    <span class="comparison-label">高峰阈值</span>
                    <span class="comparison-old">{{ config.originalPeakThreshold }}</span>
                    <el-icon class="comparison-arrow"><Right /></el-icon>
                    <span class="comparison-new">{{ config.peakThreshold }}</span>
                  </div>
                  <div class="comparison-item">
                    <span class="comparison-label">紧缺阈值</span>
                    <span class="comparison-old">{{ config.originalShortageThreshold }}</span>
                    <el-icon class="comparison-arrow"><Right /></el-icon>
                    <span class="comparison-new">{{ config.shortageThreshold }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="sceneResult.allPeriodsUpdated" class="all-updated-notice">
              <el-icon><CircleCheck /></el-icon>
              所有时段已完成适配更新
            </div>
          </div>
        </el-card>

        <el-card class="precheck-result-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><CircleCheck /></el-icon>
                前置校验结果
              </span>
              <el-tag
                v-if="precheckResult"
                :type="precheckResult.canSave ? 'success' : 'danger'"
                size="small"
              >
                {{ precheckResult.canSave ? '校验通过' : '存在异常' }}
              </el-tag>
            </div>
          </template>

          <div v-if="!precheckResult" class="empty-result">
            <el-empty description="点击「前置校验」查看配置校验结果" :image-size="80" />
          </div>

          <div v-else class="precheck-content">
            <div class="validation-summary">
              <div class="summary-item pass">
                <span class="summary-icon"><el-icon><CircleCheck /></el-icon></span>
                <span class="summary-count">{{ validFieldCount }}</span>
                <span class="summary-label">通过项</span>
              </div>
              <div class="summary-item fail">
                <span class="summary-icon"><el-icon><CircleClose /></el-icon></span>
                <span class="summary-count">{{ invalidFieldCount }}</span>
                <span class="summary-label">异常项</span>
              </div>
              <div class="summary-item warn">
                <span class="summary-icon"><el-icon><Warning /></el-icon></span>
                <span class="summary-count">{{ precheckResult.warnings.length }}</span>
                <span class="summary-label">警告项</span>
              </div>
            </div>

            <div v-if="precheckResult.warnings.length > 0" class="warnings-section">
              <div class="section-title">
                <el-icon><Warning /></el-icon>
                警告提示
              </div>
              <div class="warning-list">
                <div
                  v-for="(warning, idx) in precheckResult.warnings"
                  :key="idx"
                  class="warning-item"
                >
                  <el-icon class="warning-icon"><Warning /></el-icon>
                  <span class="warning-text">{{ warning }}</span>
                </div>
              </div>
            </div>

            <div v-if="precheckResult.abnormalParams.length > 0" class="abnormal-section">
              <div class="section-title">
                <el-icon><CircleClose /></el-icon>
                异常参数明细
              </div>
              <div class="abnormal-list">
                <div
                  v-for="(abnormal, idx) in precheckResult.abnormalParams"
                  :key="idx"
                  class="abnormal-item"
                >
                  <span class="abnormal-period">{{ abnormal.period }}</span>
                  <span class="abnormal-field">{{ getFieldLabel(abnormal.field) }}</span>
                  <span class="abnormal-value">当前值: {{ abnormal.value }}</span>
                  <span class="abnormal-message">{{ abnormal.message }}</span>
                </div>
              </div>
            </div>

            <div class="validation-detail-section">
              <div class="section-title">
                <el-icon><DataAnalysis /></el-icon>
                字段校验明细
              </div>
              <div class="validation-detail-list">
                <div
                  v-for="(validation, idx) in precheckResult.validations"
                  :key="idx"
                  class="validation-detail-item"
                  :class="validation.valid ? 'valid' : 'invalid'"
                >
                  <span class="detail-status">
                    <el-icon v-if="validation.valid"><CircleCheck /></el-icon>
                    <el-icon v-else><CircleClose /></el-icon>
                  </span>
                  <span class="detail-field">{{ getFieldLabel(validation.field) }}</span>
                  <span class="detail-value">{{ validation.value }}{{ validation.range.unit }}</span>
                  <span class="detail-range">
                    范围: {{ validation.range.min }}~{{ validation.range.max }}
                  </span>
                  <span class="detail-avg">行业均值: {{ validation.range.industryAvg }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="warning-preview-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Warning /></el-icon>
                实时预警预览
              </span>
              <el-tag type="info" size="small" effect="plain">基于当前配置预估</el-tag>
            </div>
          </template>

          <div v-if="!precheckResult || precheckResult.previews.length === 0" class="empty-result">
            <el-empty description="暂无预警预估数据，请先执行前置校验" :image-size="80" />
          </div>

          <div v-else class="preview-content">
            <div class="preview-summary">
              <div class="preview-stat shortage">
                <div class="preview-stat-icon">
                  <el-icon><Warning /></el-icon>
                </div>
                <div class="preview-stat-info">
                  <span class="preview-stat-value">{{ shortagePreviewCount }}</span>
                  <span class="preview-stat-label">紧缺预警</span>
                </div>
              </div>
              <div class="preview-stat surplus">
                <div class="preview-stat-icon">
                  <el-icon><InfoFilled /></el-icon>
                </div>
                <div class="preview-stat-info">
                  <span class="preview-stat-value">{{ surplusPreviewCount }}</span>
                  <span class="preview-stat-label">过剩预警</span>
                </div>
              </div>
              <div class="preview-stat saturated">
                <div class="preview-stat-icon">
                  <el-icon><Timer /></el-icon>
                </div>
                <div class="preview-stat-info">
                  <span class="preview-stat-value">{{ saturatedPreviewCount }}</span>
                  <span class="preview-stat-label">饱和预警</span>
                </div>
              </div>
            </div>

            <div class="preview-period-list">
              <div
                v-for="(preview, idx) in precheckResult.previews"
                :key="idx"
                class="preview-period-item"
                :class="`preview-${preview.warningType}`"
              >
                <div class="preview-period-header">
                  <span class="preview-period-name">{{ preview.period }}</span>
                  <el-tag
                    size="small"
                    :type="preview.warningType === 'shortage' ? 'danger' : preview.warningType === 'surplus' ? 'info' : 'warning'"
                    effect="dark"
                  >
                    {{ preview.warningType === 'shortage' ? '紧缺' : preview.warningType === 'surplus' ? '过剩' : '饱和' }}
                  </el-tag>
                </div>
                <div class="preview-period-body">
                  <div class="preview-count-bar">
                    <div
                      class="count-bar-fill"
                      :style="{
                        width: `${Math.min(100, (preview.estimatedCount / 200) * 100)}%`,
                        background: getPreviewBarColor(preview.warningType)
                      }"
                    ></div>
                  </div>
                  <div class="preview-count-info">
                    <span class="count-value">预估 {{ preview.estimatedCount }} 次/天</span>
                    <el-tag
                      size="small"
                      :type="preview.severity === 'high' ? 'danger' : preview.severity === 'medium' ? 'warning' : 'info'"
                      effect="plain"
                    >
                      {{ preview.severity === 'high' ? '高风险' : preview.severity === 'medium' ? '中风险' : '低风险' }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Right, InfoFilled } from '@element-plus/icons-vue'
import { Setting, Timer, Warning, CircleCheck, CircleClose, DataAnalysis, Document, Refresh, Search, Copy, MagicStick } from '@element-plus/icons-vue'
import { periodConfigPrecheckApi, sceneAdaptiveConfigApi } from '@/api/capacity'
import type { PeriodConfigPrecheckResult, SceneAdaptiveResult, PeriodThreshold, ThresholdValidation } from '@/types/capacity'
import { CITY_OPTIONS, TIME_PERIODS, SceneType, SceneTypeMap, SceneTypeColorMap, PERIOD_THRESHOLD_RANGES, DEFAULT_PERIOD_CONFIGS } from '@/enums/capacity'

const selectedCity = ref(CITY_OPTIONS[0])

const periodConfigs = reactive<PeriodThreshold[]>(
  JSON.parse(JSON.stringify(DEFAULT_PERIOD_CONFIGS))
)

const precheckResult = ref<PeriodConfigPrecheckResult | null>(null)
const sceneResult = ref<SceneAdaptiveResult | null>(null)
const focusedInput = ref('')

const precheckLoading = ref(false)
const sceneLoading = ref(false)
const saveLoading = ref(false)

const sceneForm = reactive({
  sceneType: 'normal' as 'holiday' | 'weather' | 'large_event' | 'normal',
  holidayType: '',
  weatherLevel: 1,
  eventScale: 'small' as 'small' | 'medium' | 'large'
})

const weatherMarks = {
  1: '轻微',
  2: '一般',
  3: '中等',
  4: '严重',
  5: '极端'
}

const validateField = (period: PeriodThreshold, field: string, value: number): string => {
  const range = PERIOD_THRESHOLD_RANGES[field as keyof typeof PERIOD_THRESHOLD_RANGES]
  if (!range) return ''
  if (value < range.min || value > range.max) {
    return `超出范围 ${range.min}~${range.max}`
  }
  return ''
}

const isFocused = (period: string, field: string) => {
  return focusedInput.value === `${period}-${field}`
}

const onInputFocus = (period: string, field: string) => {
  focusedInput.value = `${period}-${field}`
}

const onInputBlur = () => {
  focusedInput.value = ''
}

const isFieldInvalid = (period: string, field: string) => {
  if (!precheckResult.value) return false
  return precheckResult.value.abnormalParams.some(
    a => a.period === period && a.field === field
  )
}

const getValidationStatus = (period: string, field: string): 'valid' | 'invalid' | '' => {
  if (!precheckResult.value) return ''
  const validation = precheckResult.value.validations.find(
    v => v.field === field
  )
  if (!validation) return ''
  const hasAbnormal = precheckResult.value.abnormalParams.some(
    a => a.period === period && a.field === field
  )
  if (hasAbnormal) return 'invalid'
  return validation.valid ? 'valid' : 'invalid'
}

const getFieldLabel = (field: string) => {
  const range = PERIOD_THRESHOLD_RANGES[field as keyof typeof PERIOD_THRESHOLD_RANGES]
  return range?.label || field
}

const getSceneGradient = (sceneType: string) => {
  const color = SceneTypeColorMap[sceneType as keyof typeof SceneTypeColorMap] || '#909399'
  const gradients: Record<string, string> = {
    '#e6a23c': 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    '#409eff': 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    '#f56c6c': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    '#67c23a': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  }
  return gradients[color] || `linear-gradient(135deg, ${color} 0%, #909399 100%)`
}

const isPeriodUpdated = (config: any) => {
  return config.peakThreshold !== config.originalPeakThreshold ||
    config.shortageThreshold !== config.originalShortageThreshold
}

const getPreviewBarColor = (warningType: string) => {
  if (warningType === 'shortage') return 'linear-gradient(90deg, #f56c6c 0%, #f78989 100%)'
  if (warningType === 'surplus') return 'linear-gradient(90deg, #909399 0%, #b1b3b8 100%)'
  return 'linear-gradient(90deg, #e6a23c 0%, #f0c78a 100%)'
}

const validFieldCount = computed(() => {
  if (!precheckResult.value) return 0
  const totalFields = precheckResult.value.validations.length
  const abnormalCount = precheckResult.value.abnormalParams.length
  return Math.max(0, totalFields - abnormalCount)
})

const invalidFieldCount = computed(() => {
  return precheckResult.value?.abnormalParams.length || 0
})

const shortagePreviewCount = computed(() => {
  if (!precheckResult.value) return 0
  return precheckResult.value.previews
    .filter(p => p.warningType === 'shortage')
    .reduce((sum, p) => sum + p.estimatedCount, 0)
})

const surplusPreviewCount = computed(() => {
  if (!precheckResult.value) return 0
  return precheckResult.value.previews
    .filter(p => p.warningType === 'surplus')
    .reduce((sum, p) => sum + p.estimatedCount, 0)
})

const saturatedPreviewCount = computed(() => {
  if (!precheckResult.value) return 0
  return precheckResult.value.previews
    .filter(p => p.warningType === 'saturated')
    .reduce((sum, p) => sum + p.estimatedCount, 0)
})

const handlePrecheck = async () => {
  precheckLoading.value = true
  try {
    const res = await periodConfigPrecheckApi({
      city: selectedCity.value,
      thresholds: JSON.parse(JSON.stringify(periodConfigs))
    })
    precheckResult.value = res.data
    if (res.data.canSave) {
      ElMessage.success('前置校验通过，当前配置可保存')
    } else {
      ElMessage.warning(`校验发现 ${res.data.abnormalParams.length} 项异常，请检查`)
    }
  } catch (e: any) {
    ElMessage.error(e.message || '前置校验失败')
  } finally {
    precheckLoading.value = false
  }
}

const handleSceneAdapt = async () => {
  if (sceneForm.sceneType !== 'normal') {
    if (sceneForm.sceneType === 'holiday' && !sceneForm.holidayType) {
      ElMessage.warning('请选择节假日类型')
      return
    }
    if (sceneForm.sceneType === 'large_event' && !sceneForm.eventScale) {
      ElMessage.warning('请选择活动规模')
      return
    }
  }

  sceneLoading.value = true
  try {
    const res = await sceneAdaptiveConfigApi({
      city: selectedCity.value,
      sceneType: sceneForm.sceneType,
      sceneParams: {
        holidayType: sceneForm.holidayType || undefined,
        weatherLevel: sceneForm.weatherLevel.toString(),
        eventScale: sceneForm.eventScale || undefined
      },
      baseConfigs: JSON.parse(JSON.stringify(periodConfigs))
    })
    sceneResult.value = res.data

    res.data.adaptedConfigs.forEach((adapted, index) => {
      if (periodConfigs[index]) {
        Object.assign(periodConfigs[index], {
          peakThreshold: adapted.peakThreshold,
          flatThreshold: adapted.flatThreshold,
          valleyThreshold: adapted.valleyThreshold,
          idleRateThreshold: adapted.idleRateThreshold,
          shortageThreshold: adapted.shortageThreshold,
          surplusThreshold: adapted.surplusThreshold
        })
      }
    })

    ElMessage.success(`${SceneTypeMap[res.data.sceneType as keyof typeof SceneTypeMap]}场景适配已应用`)
    precheckResult.value = null
  } catch (e: any) {
    ElMessage.error(e.message || '场景适配失败')
  } finally {
    sceneLoading.value = false
  }
}

const handleResetDefaults = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要恢复为默认配置吗？当前所有修改将丢失。',
      '恢复默认',
      { type: 'warning', confirmButtonText: '确认恢复', cancelButtonText: '取消' }
    )
    Object.assign(periodConfigs, JSON.parse(JSON.stringify(DEFAULT_PERIOD_CONFIGS)))
    precheckResult.value = null
    sceneResult.value = null
    ElMessage.success('已恢复默认配置')
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('恢复默认失败')
    }
  }
}

const handleCityChange = () => {
  precheckResult.value = null
  sceneResult.value = null
  ElMessage.info(`已切换至 ${selectedCity.value}，请重新执行校验`)
}

const handleBatchConfig = () => {
  ElMessage.info('批量时段配置功能开发中')
}

const handleViewTrace = () => {
  ElMessage.info('配置溯源记录功能开发中')
}

watch(sceneForm.sceneType, () => {
  sceneForm.holidayType = ''
  sceneForm.weatherLevel = 1
  sceneForm.eventScale = 'small'
  sceneResult.value = null
})

onMounted(() => {
})
</script>

<style lang="scss" scoped>
.period-config {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 0 4px;

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .page-title {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0;
        font-size: 22px;
        font-weight: 600;
        color: #303133;

        .el-icon {
          color: #409eff;
          font-size: 24px;
        }
      }

      .header-subtitle {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #909399;

        .el-icon {
          font-size: 14px;
        }
      }
    }

    .header-right {
      display: flex;
      gap: 12px;
    }
  }

  .city-selector-card {
    margin-bottom: 20px;
    border-radius: 10px;

    .city-selector-content {
      display: flex;
      align-items: center;
      gap: 16px;

      .selector-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 500;
        color: #303133;

        .el-icon {
          color: #409eff;
        }
      }

      .baseline-tag {
        margin-left: auto;
      }
    }
  }

  .main-layout {
    .threshold-config-card {
      border-radius: 10px;
      margin-bottom: 0;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          font-weight: 600;
          color: #303133;

          .el-icon {
            color: #409eff;
          }
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }
      }

      .threshold-table {
        :deep(.el-table__body-wrapper) {
          overflow-x: auto;
        }

        :deep(.el-table__cell) {
          padding: 10px 8px;
        }

        :deep(.el-table th.el-table__cell) {
          background: #fafafa;
          font-weight: 600;
          color: #303133;
        }

        .period-name {
          font-weight: 500;
          color: #303133;
          font-size: 13px;
        }

        .input-cell {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s ease;

          &.field-focused {
            background: rgba(64, 158, 255, 0.05);
          }

          &.field-invalid {
            border: 1px solid #f56c6c;
            background: #fef0f0;
          }

          .threshold-input {
            width: 80px;

            :deep(.el-input__wrapper) {
              padding: 2px 8px;
              box-shadow: 0 0 0 1px #dcdfe6 inset;
              transition: all 0.2s ease;

              &:hover {
                box-shadow: 0 0 0 1px #c0c4cc inset;
              }

              &.is-focus {
                transform: scale(1.02);
                box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.2);
              }
            }

            :deep(.el-input__inner) {
              text-align: center;
              font-size: 13px;
            }
          }

          .input-unit {
            font-size: 12px;
            color: #909399;
            min-width: 32px;
          }

          .field-error {
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-top: 4px;
            font-size: 11px;
            color: #f56c6c;
            white-space: nowrap;
            z-index: 10;
          }

          .field-status {
            position: absolute;
            right: -4px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 14px;

            &.valid {
              color: #67c23a;
            }

            &.invalid {
              color: #f56c6c;
            }
          }
        }
      }

      .range-reference {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #ebeef5;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;

        .reference-title {
          font-size: 13px;
          font-weight: 500;
          color: #606266;
        }

        .range-tag {
          font-size: 12px;
        }
      }
    }

    .scene-adapt-card {
      border-radius: 10px;
      margin-bottom: 20px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          font-weight: 600;
          color: #303133;

          .el-icon {
            color: #e6a23c;
          }
        }
      }

      .scene-form {
        :deep(.el-form-item__label) {
          font-weight: 500;
          color: #606266;
        }

        .scene-radio-group {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;

          .scene-radio {
            :deep(.el-radio__input) {
              display: none;
            }

            :deep(.el-radio__label) {
              padding: 0;
            }

            .scene-tag {
              display: inline-block;
              padding: 6px 16px;
              border-radius: 16px;
              font-size: 13px;
              font-weight: 500;
              color: #fff;
              cursor: pointer;
              transition: all 0.25s ease;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

              &:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              }
            }

            &.is-checked {
              .scene-tag {
                transform: scale(1.05);
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
                outline: 2px solid rgba(64, 158, 255, 0.5);
                outline-offset: 2px;
              }
            }
          }
        }
      }

      .scene-result {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px dashed #ebeef5;

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .result-scene-tag {
            padding: 4px 14px;
            border-radius: 14px;
            font-size: 13px;
            font-weight: 600;
            color: #fff;
          }

          .effective-time {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #909399;

            .el-icon {
              font-size: 13px;
            }
          }
        }

        .adapt-rules {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;

          .rule-tag {
            font-size: 12px;
          }
        }

        .adapted-periods {
          display: flex;
          flex-direction: column;
          gap: 10px;

          .adapted-period-item {
            padding: 12px;
            border-radius: 8px;
            background: #fafafa;
            transition: all 0.25s ease;

            &.period-updated {
              background: linear-gradient(135deg, #f0f9eb 0%, #fff 100%);
              border: 1px solid #e1f3d8;
            }

            .period-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;

              .period-label {
                font-size: 13px;
                font-weight: 500;
                color: #303133;
              }

              .adjustment-ratio {
                font-size: 11px;
                font-weight: 600;
              }
            }

            .period-comparison {
              display: flex;
              gap: 16px;

              .comparison-item {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;

                .comparison-label {
                  color: #909399;
                }

                .comparison-old {
                  color: #909399;
                  text-decoration: line-through;
                }

                .comparison-arrow {
                  color: #67c23a;
                  font-size: 12px;
                }

                .comparison-new {
                  color: #67c23a;
                  font-weight: 600;
                }
              }
            }
          }
        }

        .all-updated-notice {
          margin-top: 12px;
          padding: 10px;
          border-radius: 6px;
          background: #f0f9eb;
          color: #67c23a;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;

          .el-icon {
            font-size: 15px;
          }
        }
      }
    }

    .precheck-result-card {
      border-radius: 10px;
      margin-bottom: 20px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          font-weight: 600;
          color: #303133;

          .el-icon {
            color: #67c23a;
          }
        }
      }

      .empty-result {
        padding: 20px 0;
      }

      .precheck-content {
        .validation-summary {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;

          .summary-item {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px;
            border-radius: 8px;
            transition: all 0.25s ease;

            &:hover {
              transform: translateY(-2px);
            }

            &.pass {
              background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);

              .summary-icon {
                color: #67c23a;
              }

              .summary-count {
                color: #67c23a;
              }
            }

            &.fail {
              background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);

              .summary-icon {
                color: #f56c6c;
              }

              .summary-count {
                color: #f56c6c;
              }
            }

            &.warn {
              background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);

              .summary-icon {
                color: #e6a23c;
              }

              .summary-count {
                color: #e6a23c;
              }
            }

            .summary-icon {
              font-size: 22px;
            }

            .summary-count {
              font-size: 22px;
              font-weight: bold;
            }

            .summary-label {
              font-size: 12px;
              color: #606266;
            }
          }
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 10px;

          .el-icon {
            font-size: 14px;
          }
        }

        .warnings-section {
          margin-bottom: 16px;
          padding: 12px;
          background: #fdf6ec;
          border-radius: 8px;
          border-left: 3px solid #e6a23c;

          .section-title {
            color: #e6a23c;
            margin-bottom: 10px;

            .el-icon {
              color: #e6a23c;
            }
          }

          .warning-list {
            display: flex;
            flex-direction: column;
            gap: 6px;

            .warning-item {
              display: flex;
              align-items: flex-start;
              gap: 8px;
              font-size: 12px;
              color: #606266;

              .warning-icon {
                color: #e6a23c;
                flex-shrink: 0;
                margin-top: 1px;
              }
            }
          }
        }

        .abnormal-section {
          margin-bottom: 16px;
          padding: 12px;
          background: #fef0f0;
          border-radius: 8px;
          border-left: 3px solid #f56c6c;

          .section-title {
            color: #f56c6c;
            margin-bottom: 10px;

            .el-icon {
              color: #f56c6c;
            }
          }

          .abnormal-list {
            display: flex;
            flex-direction: column;
            gap: 8px;

            .abnormal-item {
              display: flex;
              flex-wrap: wrap;
              align-items: center;
              gap: 8px;
              font-size: 12px;
              padding: 8px;
              background: #fff;
              border-radius: 6px;

              .abnormal-period {
                color: #303133;
                font-weight: 500;
              }

              .abnormal-field {
                color: #409eff;
              }

              .abnormal-value {
                color: #f56c6c;
              }

              .abnormal-message {
                color: #909399;
              }
            }
          }
        }

        .validation-detail-section {
          .section-title {
            color: #409eff;

            .el-icon {
              color: #409eff;
            }
          }

          .validation-detail-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
            max-height: 220px;
            overflow-y: auto;

            .validation-detail-item {
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 10px 12px;
              border-radius: 6px;
              font-size: 12px;
              transition: all 0.2s ease;

              &:hover {
                background: #fafafa;
              }

              &.valid {
                background: rgba(103, 194, 58, 0.05);
              }

              &.invalid {
                background: rgba(245, 108, 108, 0.05);
              }

              .detail-status {
                font-size: 14px;
                flex-shrink: 0;

                .valid & {
                  color: #67c23a;
                }

                .invalid & {
                  color: #f56c6c;
                }
              }

              .detail-field {
                font-weight: 500;
                color: #303133;
                min-width: 80px;
              }

              .detail-value {
                color: #606266;
                min-width: 60px;
              }

              .detail-range {
                color: #909399;
              }

              .detail-avg {
                color: #409eff;
                margin-left: auto;
              }
            }
          }
        }
      }
    }

    .warning-preview-card {
      border-radius: 10px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          font-weight: 600;
          color: #303133;

          .el-icon {
            color: #f56c6c;
          }
        }
      }

      .empty-result {
        padding: 20px 0;
      }

      .preview-content {
        .preview-summary {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;

          .preview-stat {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 14px 12px;
            border-radius: 10px;
            transition: all 0.25s ease;

            &:hover {
              transform: translateY(-2px);
            }

            .preview-stat-icon {
              width: 40px;
              height: 40px;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #fff;
              font-size: 20px;
            }

            .preview-stat-info {
              display: flex;
              flex-direction: column;
              gap: 2px;

              .preview-stat-value {
                font-size: 20px;
                font-weight: bold;
                color: #303133;
                line-height: 1.2;
              }

              .preview-stat-label {
                font-size: 12px;
                color: #909399;
              }
            }

            &.shortage {
              background: linear-gradient(135deg, #fef0f0 0%, #fff 100%);

              .preview-stat-icon {
                background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
              }
            }

            &.surplus {
              background: linear-gradient(135deg, #f4f4f5 0%, #fff 100%);

              .preview-stat-icon {
                background: linear-gradient(135deg, #909399 0%, #b1b3b8 100%);
              }
            }

            &.saturated {
              background: linear-gradient(135deg, #fdf6ec 0%, #fff 100%);

              .preview-stat-icon {
                background: linear-gradient(135deg, #e6a23c 0%, #f0c78a 100%);
              }
            }
          }
        }

        .preview-period-list {
          display: flex;
          flex-direction: column;
          gap: 10px;

          .preview-period-item {
            padding: 12px;
            border-radius: 8px;
            transition: all 0.25s ease;

            &:hover {
              transform: translateX(4px);
            }

            &.preview-shortage {
              background: linear-gradient(135deg, #fef0f0 0%, #fff 100%);
              border-left: 3px solid #f56c6c;
            }

            &.preview-surplus {
              background: linear-gradient(135deg, #f4f4f5 0%, #fff 100%);
              border-left: 3px solid #909399;
            }

            &.preview-saturated {
              background: linear-gradient(135deg, #fdf6ec 0%, #fff 100%);
              border-left: 3px solid #e6a23c;
            }

            .preview-period-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 10px;

              .preview-period-name {
                font-size: 13px;
                font-weight: 500;
                color: #303133;
              }
            }

            .preview-period-body {
              .preview-count-bar {
                height: 6px;
                background: #ebeef5;
                border-radius: 3px;
                overflow: hidden;
                margin-bottom: 8px;

                .count-bar-fill {
                  height: 100%;
                  border-radius: 3px;
                  transition: width 0.5s ease;
                }
              }

              .preview-count-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;

                .count-value {
                  color: #606266;
                }
              }
            }
          }
        }
      }
    }
  }
}
</style>
