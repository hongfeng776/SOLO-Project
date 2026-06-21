<template>
  <el-dialog
    v-model="visible"
    title="批量时段配置操作"
    width="820px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="batch-period-config">
      <el-tabs v-model="activeTab" class="config-tabs">
        <el-tab-pane name="modify">
          <template #label>
            <span class="tab-label tab-label-modify">
              <el-icon><Setting /></el-icon>
              批量修改参数
            </span>
          </template>
          <div class="tab-content">
            <div class="operation-indicator modify-indicator">
              <el-icon><Setting /></el-icon>
              <span>批量修改多个时段的阈值参数</span>
            </div>

            <div class="section">
              <div class="section-header">
                <span class="section-title">选择要修改的字段</span>
                <div class="section-actions">
                  <el-button size="small" type="primary" link @click="selectAllPeakThresholds">
                    全选高峰阈值
                  </el-button>
                  <el-button size="small" type="warning" link @click="selectAllShortageThresholds">
                    全选紧缺阈值
                  </el-button>
                  <el-button size="small" link @click="clearModifySelections">清空</el-button>
                </div>
              </div>

              <div class="period-field-list">
                <div v-for="period in TIME_PERIODS" :key="period" class="period-field-group">
                  <div class="period-title">
                    <el-icon><Document /></el-icon>
                    {{ period }}
                  </div>
                  <div class="field-grid">
                    <div
                      v-for="(range, field) in PERIOD_THRESHOLD_RANGES"
                      :key="field"
                      class="field-item"
                      :class="{ selected: isModifyFieldSelected(period, field as string) }"
                      @click="toggleModifyField(period, field as string)"
                    >
                      <el-checkbox :model-value="isModifyFieldSelected(period, field as string)" @stop />
                      <div class="field-info">
                        <span class="field-name">{{ range.label }}</span>
                        <span class="field-range">{{ range.min }}~{{ range.max }}{{ range.unit }}</span>
                      </div>
                      <el-input-number
                        v-if="isModifyFieldSelected(period, field as string)"
                        v-model="modifyValues[period][field as string]"
                        :min="range.min"
                        :max="range.max"
                        :step="field === 'idleRateThreshold' || field === 'surplusThreshold' ? 0.05 : 1"
                        :precision="field === 'idleRateThreshold' || field === 'surplusThreshold' ? 2 : 0"
                        size="small"
                        controls-position="right"
                        style="width: 130px"
                        @click.stop
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="action-bar">
              <el-button
                type="primary"
                :loading="operating"
                :disabled="!hasModifySelections || !canEdit"
                @click="handleModify"
              >
                <el-icon><Setting /></el-icon>
                校验并保存
              </el-button>
              <span v-if="hasModifySelections" class="action-hint">
                已选择 {{ modifySelectionCount }} 个字段进行修改
              </span>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane name="copy">
          <template #label>
            <span class="tab-label tab-label-copy">
              <el-icon><Copy /></el-icon>
              批量复制配置
            </span>
          </template>
          <div class="tab-content">
            <div class="operation-indicator copy-indicator">
              <el-icon><Copy /></el-icon>
              <span>将源时段配置复制到多个目标时段</span>
            </div>

            <div class="section">
              <div class="section-header">
                <span class="section-title">复制配置</span>
              </div>
              <el-form label-width="120px">
                <el-form-item label="源时段">
                  <el-select v-model="copySourcePeriod" placeholder="请选择源时段" style="width: 280px">
                    <el-option
                      v-for="period in TIME_PERIODS"
                      :key="period"
                      :label="period"
                      :value="period"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="目标时段">
                  <el-checkbox-group v-model="copyTargetPeriods">
                    <el-checkbox
                      v-for="period in availableCopyTargets"
                      :key="period"
                      :label="period"
                    >
                      {{ period }}
                    </el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
              </el-form>
            </div>

            <div v-if="copySourcePeriod" class="section">
              <div class="section-header">
                <span class="section-title">源时段配置预览</span>
              </div>
              <el-table :data="[sourceConfigPreview]" size="small" border class="preview-table">
                <el-table-column prop="period" label="时段" min-width="150" />
                <el-table-column
                  v-for="(range, field) in PERIOD_THRESHOLD_RANGES"
                  :key="field"
                  :prop="field as string"
                  :label="range.label"
                  min-width="110"
                  align="center"
                >
                  <template #default="{ row }">
                    {{ row[field as string] }}
                    <span class="range-unit">{{ range.unit }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <div v-if="copyTargetPeriods.length > 0" class="section">
              <div class="section-header">
                <span class="section-title">目标时段预览（复制后）</span>
              </div>
              <el-table :data="copyTargetPreview" size="small" border class="preview-table">
                <el-table-column prop="period" label="目标时段" min-width="150" />
                <el-table-column
                  v-for="(range, field) in PERIOD_THRESHOLD_RANGES"
                  :key="field"
                  :prop="field as string"
                  :label="range.label"
                  min-width="110"
                  align="center"
                >
                  <template #default="{ row }">
                    <span v-if="row._changed[field as string]" class="value-changed">
                      {{ row[field as string] }}
                    </span>
                    <span v-else>
                      {{ row[field as string] }}
                    </span>
                    <span class="range-unit">{{ range.unit }}</span>
                  </template>
                </el-table-column>
              </el-table>
              <div class="preview-hint">
                <span class="changed-indicator"></span>
                <span>橙色表示将被覆盖的字段</span>
              </div>
            </div>

            <div class="action-bar">
              <el-button
                type="warning"
                :loading="operating"
                :disabled="!copySourcePeriod || copyTargetPeriods.length === 0 || !canEdit"
                @click="handleCopy"
              >
                <el-icon><Copy /></el-icon>
                校验并复制
              </el-button>
              <span v-if="copyTargetPeriods.length > 0" class="action-hint">
                将复制到 {{ copyTargetPeriods.length }} 个时段
              </span>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane name="restore_defaults">
          <template #label>
            <span class="tab-label tab-label-restore">
              <el-icon><RefreshLeft /></el-icon>
              批量恢复默认
            </span>
          </template>
          <div class="tab-content">
            <div class="operation-indicator restore-indicator">
              <el-icon><RefreshLeft /></el-icon>
              <span>将选中时段配置恢复为系统默认值</span>
            </div>

            <div class="section">
              <div class="section-header">
                <span class="section-title">选择要恢复的时段</span>
              </div>
              <div class="restore-options">
                <el-checkbox v-model="restoreAll" class="restore-all-checkbox">
                  <strong>恢复全部默认</strong>
                  <span class="checkbox-hint">（勾选后将恢复所有时段配置）</span>
                </el-checkbox>
                <el-checkbox-group
                  v-model="restoreTargetPeriods"
                  :disabled="restoreAll"
                  class="restore-period-group"
                >
                  <el-checkbox
                    v-for="period in TIME_PERIODS"
                    :key="period"
                    :label="period"
                  >
                    {{ period }}
                  </el-checkbox>
                </el-checkbox-group>
              </div>
            </div>

            <div class="section">
              <div class="section-header">
                <span class="section-title">默认值对比表</span>
              </div>
              <el-table :data="restoreComparisonTable" size="small" border class="comparison-table">
                <el-table-column prop="period" label="时段" min-width="150" fixed />
                <el-table-column
                  v-for="(range, field) in PERIOD_THRESHOLD_RANGES"
                  :key="field"
                  :label="range.label"
                  min-width="160"
                  align="center"
                >
                  <template #default="{ row }">
                    <div class="comparison-cell">
                      <div class="current-value">
                        <span class="value-label">当前</span>
                        <span
                          :class="{ 'value-different': row[field as string + '_current'] !== row[field as string + '_default'] }"
                        >
                          {{ row[field as string + '_current'] }}
                        </span>
                      </div>
                      <div class="arrow">→</div>
                      <div class="default-value">
                        <span class="value-label">默认</span>
                        <span class="default-highlight">
                          {{ row[field as string + '_default'] }}
                        </span>
                      </div>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
              <div class="comparison-hint">
                <span class="different-indicator"></span>
                <span>红色标记表示当前值与默认值不同</span>
              </div>
            </div>

            <div class="action-bar">
              <el-button
                type="success"
                :loading="operating"
                :disabled="!canRestore || !canEdit"
                @click="handleRestore"
              >
                <el-icon><RefreshLeft /></el-icon>
                校验并恢复
              </el-button>
              <span v-if="canRestore" class="action-hint">
                将恢复 {{ effectiveRestorePeriods.length }} 个时段配置
              </span>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane name="city_adapt">
          <template #label>
            <span class="tab-label tab-label-adapt">
              <el-icon><MapLocation /></el-icon>
              城市差异化适配
            </span>
          </template>
          <div class="tab-content">
            <div class="operation-indicator adapt-indicator">
              <el-icon><MapLocation /></el-icon>
              <span>根据源城市配置按城市等级差异化适配到目标城市</span>
            </div>

            <div class="section">
              <div class="section-header">
                <span class="section-title">城市适配配置</span>
              </div>
              <el-form label-width="120px">
                <el-form-item label="源城市">
                  <el-select v-model="adaptSourceCity" placeholder="请选择源城市" style="width: 280px">
                    <el-option
                      v-for="city in CITY_OPTIONS"
                      :key="city"
                      :label="city"
                      :value="city"
                    />
                  </el-select>
                  <span class="city-tier-hint">
                    城市等级：{{ getCityTierLabel(adaptSourceCity) }}
                    （系数 x{{ getCityTierFactor(adaptSourceCity) }}）
                  </span>
                </el-form-item>
                <el-form-item label="目标城市">
                  <el-select
                    v-model="adaptTargetCities"
                    multiple
                    filterable
                    placeholder="请选择目标城市（可多选）"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="city in availableAdaptTargets"
                      :key="city"
                      :label="city"
                      :value="city"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="适配时段">
                  <el-checkbox-group v-model="adaptTargetPeriods">
                    <el-checkbox
                      v-for="period in TIME_PERIODS"
                      :key="period"
                      :label="period"
                    >
                      {{ period }}
                    </el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
              </el-form>
            </div>

            <div class="section">
              <div class="section-header">
                <span class="section-title">城市等级系数说明</span>
              </div>
              <div class="city-tier-grid">
                <div v-for="tier in CITY_TIERS" :key="tier.name" class="tier-card">
                  <div class="tier-name">{{ tier.name }}</div>
                  <div class="tier-factor">x{{ tier.factor }}</div>
                  <div class="tier-cities">{{ tier.cities.join('、') }}</div>
                </div>
              </div>
            </div>

            <div v-if="adaptTargetCities.length > 0 && adaptTargetPeriods.length > 0" class="section">
              <div class="section-header">
                <span class="section-title">适配预览</span>
              </div>
              <div v-for="city in adaptTargetCities" :key="city" class="city-preview-block">
                <div class="city-preview-header">
                  <el-icon><MapLocation /></el-icon>
                  {{ city }}
                  <el-tag size="small" type="info" class="tier-tag">
                    {{ getCityTierLabel(city) }} x{{ getCityTierFactor(city) }}
                  </el-tag>
                </div>
                <el-table :data="getCityAdaptPreview(city)" size="small" border class="preview-table">
                  <el-table-column prop="period" label="时段" min-width="140" />
                  <el-table-column
                    v-for="(range, field) in PERIOD_THRESHOLD_RANGES"
                    :key="field"
                    :label="range.label"
                    min-width="120"
                    align="center"
                  >
                    <template #default="{ row }">
                      <div class="adapt-value">
                        <span class="original-value">{{ row[field as string + '_original'] }}</span>
                        <span class="multiply">×{{ getCityTierFactor(city) / getCityTierFactor(adaptSourceCity) }} =</span>
                        <span class="adapted-value">{{ row[field as string] }}</span>
                        <span class="range-unit">{{ range.unit }}</span>
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>

            <div class="action-bar">
              <el-button
                type="primary"
                :loading="operating"
                :disabled="!canAdapt || !canEdit"
                @click="handleAdapt"
              >
                <el-icon><MapLocation /></el-icon>
                校验并适配
              </el-button>
              <span v-if="canAdapt" class="action-hint">
                将适配到 {{ adaptTargetCities.length }} 个城市的 {{ adaptTargetPeriods.length }} 个时段
              </span>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <el-button @click="handleClose" :disabled="operating">关闭</el-button>
    </template>

    <el-dialog
      v-model="resultVisible"
      title="操作结果"
      width="600px"
      :close-on-click-modal="false"
      append-to-body
    >
      <div class="operation-result">
        <div class="result-stats">
          <div class="stat-item success">
            <div class="stat-icon"><el-icon><CircleCheck /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ operationResult?.successCount || 0 }}</div>
              <div class="stat-label">成功</div>
            </div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item skipped">
            <div class="stat-icon"><el-icon><Warning /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ operationResult?.skippedCount || 0 }}</div>
              <div class="stat-label">跳过</div>
            </div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item failed">
            <div class="stat-icon"><el-icon><CircleClose /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ operationResult?.failedCount || 0 }}</div>
              <div class="stat-label">失败</div>
            </div>
          </div>
        </div>

        <div v-if="abnormalParamList.length > 0" class="abnormal-params">
          <div class="abnormal-header">
            <el-icon><Warning /></el-icon>
            <span>异常参数列表（{{ abnormalParamList.length }} 项）</span>
          </div>
          <div class="abnormal-list">
            <div
              v-for="(item, idx) in abnormalParamList"
              :key="idx"
              class="abnormal-card"
            >
              <div class="abnormal-card-header">
                <el-tag size="small" type="danger" effect="dark">异常</el-tag>
                <span class="abnormal-period">{{ item.period }}</span>
                <span v-if="item.city" class="abnormal-city">{{ item.city }}</span>
              </div>
              <div class="abnormal-fields">
                <div v-for="(err, fidx) in (item.fieldErrors || [])" :key="fidx" class="abnormal-field">
                  <span class="field-name">{{ getFieldLabel(err.field) }}:</span>
                  <span class="field-value">{{ err.value }}</span>
                  <span class="field-message">{{ err.message }}</span>
                </div>
                <div v-if="!item.fieldErrors && item.reason" class="abnormal-field">
                  <span class="field-message">{{ item.reason }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="operationResult?.results?.length" class="result-details">
          <div class="details-header">操作详情</div>
          <el-scrollbar height="200px">
            <el-table :data="operationResult.results" size="small">
              <el-table-column prop="period" label="时段" min-width="140" />
              <el-table-column v-if="hasCityColumn" prop="city" label="城市" width="100" />
              <el-table-column label="状态" width="80" align="center">
                <template #default="{ row }">
                  <el-tag
                    size="small"
                    :type="row.status === 'success' ? 'success' : row.status === 'failed' ? 'danger' : 'warning'"
                  >
                    {{ row.status === 'success' ? '成功' : row.status === 'failed' ? '失败' : '跳过' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="reason" label="原因" min-width="140" />
            </el-table>
          </el-scrollbar>
        </div>
      </div>

      <template #footer>
        <el-button type="primary" @click="handleResultClose">确认</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Copy, RefreshLeft, Setting, Warning, CircleCheck, CircleClose, MapLocation, Document } from '@element-plus/icons-vue'
import { batchPeriodConfigApi } from '@/api/capacity'
import type { BatchPeriodConfigResult, PeriodThreshold, BatchPeriodResultItem } from '@/types/capacity'
import { BatchPeriodOperation, BatchPeriodOperationMap, TIME_PERIODS, CITY_OPTIONS, PERIOD_THRESHOLD_RANGES, DEFAULT_PERIOD_CONFIGS } from '@/enums/capacity'

interface Props {
  modelValue: boolean
  currentConfigs: PeriodThreshold[]
  canEdit: boolean
}

const props = withDefaults(defineProps<Props>(), {
  currentConfigs: () => [],
  canEdit: false
})

const emit = defineEmits(['update:modelValue', 'config-saved'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const activeTab = ref(BatchPeriodOperation.MODIFY)
const operating = ref(false)
const resultVisible = ref(false)
const operationResult = ref<BatchPeriodConfigResult | null>(null)

type ThresholdField = 'peakThreshold' | 'flatThreshold' | 'valleyThreshold' | 'idleRateThreshold' | 'shortageThreshold' | 'surplusThreshold'
const THRESHOLD_FIELDS: ThresholdField[] = ['peakThreshold', 'flatThreshold', 'valleyThreshold', 'idleRateThreshold', 'shortageThreshold', 'surplusThreshold']

const PEAK_FIELDS: ThresholdField[] = ['peakThreshold', 'flatThreshold', 'valleyThreshold']
const SHORTAGE_FIELDS: ThresholdField[] = ['shortageThreshold', 'surplusThreshold']

const CITY_TIERS = [
  { name: '一线城市', factor: 1.2, cities: ['北京市', '上海市', '广州市', '深圳市'] },
  { name: '新一线城市', factor: 1.0, cities: ['杭州市', '成都市', '武汉市', '西安市'] }
]

const getCityTier = (city: string) => {
  return CITY_TIERS.find(t => t.cities.includes(city)) || CITY_TIERS[1]
}

const getCityTierFactor = (city: string) => getCityTier(city).factor
const getCityTierLabel = (city: string) => getCityTier(city).name

const getFieldLabel = (field: string) => {
  return (PERIOD_THRESHOLD_RANGES as any)[field]?.label || field
}

const getConfigByPeriod = (period: string): PeriodThreshold | undefined => {
  return props.currentConfigs.find(c => c.period === period)
}

const getDefaultConfigByPeriod = (period: string): PeriodThreshold | undefined => {
  return DEFAULT_PERIOD_CONFIGS.find(c => c.period === period)
}

const buildEmptyValues = () => {
  const result: Record<string, Record<string, number | null>> = {}
  TIME_PERIODS.forEach(period => {
    result[period] = {}
    THRESHOLD_FIELDS.forEach(field => {
      result[period][field] = null
    })
  })
  return result
}

const modifySelectedFields = reactive<Record<string, Set<string>>>({})
TIME_PERIODS.forEach(p => { modifySelectedFields[p] = new Set() })

const modifyValues = reactive(buildEmptyValues())

const isModifyFieldSelected = (period: string, field: string) => {
  return modifySelectedFields[period]?.has(field) || false
}

const toggleModifyField = (period: string, field: string) => {
  if (!props.canEdit) return
  const set = modifySelectedFields[period]
  if (set.has(field)) {
    set.delete(field)
    ;(modifyValues as any)[period][field] = null
  } else {
    set.add(field)
    const current = getConfigByPeriod(period)
    if (current) {
      ;(modifyValues as any)[period][field] = (current as any)[field]
    } else {
      const def = getDefaultConfigByPeriod(period)
      ;(modifyValues as any)[period][field] = def ? (def as any)[field] : (PERIOD_THRESHOLD_RANGES as any)[field]?.industryAvg || 0
    }
  }
}

const selectAllPeakThresholds = () => {
  if (!props.canEdit) return
  TIME_PERIODS.forEach(period => {
    PEAK_FIELDS.forEach(field => {
      if (!modifySelectedFields[period].has(field)) {
        toggleModifyField(period, field)
      }
    })
  })
}

const selectAllShortageThresholds = () => {
  if (!props.canEdit) return
  TIME_PERIODS.forEach(period => {
    SHORTAGE_FIELDS.forEach(field => {
      if (!modifySelectedFields[period].has(field)) {
        toggleModifyField(period, field)
      }
    })
  })
}

const clearModifySelections = () => {
  TIME_PERIODS.forEach(period => {
    modifySelectedFields[period].clear()
    THRESHOLD_FIELDS.forEach(field => {
      ;(modifyValues as any)[period][field] = null
    })
  })
}

const hasModifySelections = computed(() => {
  return TIME_PERIODS.some(period => modifySelectedFields[period].size > 0)
})

const modifySelectionCount = computed(() => {
  let count = 0
  TIME_PERIODS.forEach(period => {
    count += modifySelectedFields[period].size
  })
  return count
})

const validateModifyValues = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  TIME_PERIODS.forEach(period => {
    modifySelectedFields[period].forEach(field => {
      const val = (modifyValues as any)[period][field]
      const range = (PERIOD_THRESHOLD_RANGES as any)[field]
      if (val === null || val === undefined) {
        errors.push(`${period} - ${range.label}: 未设置值`)
      } else if (val < range.min || val > range.max) {
        errors.push(`${period} - ${range.label}: 值 ${val} 超出范围 [${range.min}, ${range.max}]`)
      }
    })
  })
  return { valid: errors.length === 0, errors }
}

const copySourcePeriod = ref('')
const copyTargetPeriods = ref<string[]>([])

const availableCopyTargets = computed(() => {
  return TIME_PERIODS.filter(p => p !== copySourcePeriod.value)
})

const sourceConfigPreview = computed(() => {
  if (!copySourcePeriod.value) return null
  const cfg = getConfigByPeriod(copySourcePeriod.value) || getDefaultConfigByPeriod(copySourcePeriod.value)
  return cfg || { period: copySourcePeriod.value }
})

const copyTargetPreview = computed(() => {
  const source = sourceConfigPreview.value as any
  if (!source) return []
  return copyTargetPeriods.value.map(period => {
    const current = getConfigByPeriod(period) || getDefaultConfigByPeriod(period) || { period }
    const changed: Record<string, boolean> = {}
    const result: any = { period, _changed: changed }
    THRESHOLD_FIELDS.forEach(field => {
      const srcVal = source[field]
      const curVal = (current as any)[field]
      result[field] = srcVal
      changed[field] = srcVal !== curVal
    })
    return result
  })
})

const validateCopy = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  if (!copySourcePeriod.value) {
    errors.push('请选择源时段')
  }
  if (copyTargetPeriods.value.length === 0) {
    errors.push('请选择至少一个目标时段')
  }
  return { valid: errors.length === 0, errors }
}

const restoreAll = ref(false)
const restoreTargetPeriods = ref<string[]>([])

const effectiveRestorePeriods = computed(() => {
  if (restoreAll.value) return TIME_PERIODS
  return restoreTargetPeriods.value
})

const canRestore = computed(() => {
  return effectiveRestorePeriods.value.length > 0
})

const restoreComparisonTable = computed(() => {
  return TIME_PERIODS.map(period => {
    const current = getConfigByPeriod(period) || {}
    const def = getDefaultConfigByPeriod(period) || {}
    const row: any = { period }
    THRESHOLD_FIELDS.forEach(field => {
      row[field + '_current'] = (current as any)[field] ?? '-'
      row[field + '_default'] = (def as any)[field] ?? '-'
    })
    return row
  })
})

const validateRestore = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  if (effectiveRestorePeriods.value.length === 0) {
    errors.push('请选择至少一个时段进行恢复')
  }
  return { valid: errors.length === 0, errors }
}

const adaptSourceCity = ref(CITY_OPTIONS[0])
const adaptTargetCities = ref<string[]>([])
const adaptTargetPeriods = ref<string[]>(TIME_PERIODS)

const availableAdaptTargets = computed(() => {
  return CITY_OPTIONS.filter(c => c !== adaptSourceCity.value)
})

const canAdapt = computed(() => {
  return adaptSourceCity.value && adaptTargetCities.value.length > 0 && adaptTargetPeriods.value.length > 0
})

watch(adaptSourceCity, (val) => {
  adaptTargetCities.value = adaptTargetCities.value.filter(c => c !== val)
})

const getCityAdaptPreview = (city: string) => {
  const sourceFactor = getCityTierFactor(adaptSourceCity.value)
  const targetFactor = getCityTierFactor(city)
  const ratio = targetFactor / sourceFactor

  return adaptTargetPeriods.value.map(period => {
    const current = getConfigByPeriod(period) || getDefaultConfigByPeriod(period) || {}
    const row: any = { period }
    THRESHOLD_FIELDS.forEach(field => {
      const original = (current as any)[field] ?? 0
      let adapted: number
      if (field === 'idleRateThreshold' || field === 'surplusThreshold' || field === 'shortageThreshold') {
        adapted = parseFloat((original * ratio).toFixed(2))
      } else {
        adapted = Math.round(original * ratio)
      }
      const range = (PERIOD_THRESHOLD_RANGES as any)[field]
      adapted = Math.max(range.min, Math.min(range.max, adapted))
      row[field + '_original'] = original
      row[field] = adapted
    })
    return row
  })
}

const buildAdaptConfigs = (): PeriodThreshold[] => {
  const configs: PeriodThreshold[] = []
  adaptTargetCities.value.forEach(city => {
    const sourceFactor = getCityTierFactor(adaptSourceCity.value)
    const targetFactor = getCityTierFactor(city)
    const ratio = targetFactor / sourceFactor

    adaptTargetPeriods.value.forEach(period => {
      const current = getConfigByPeriod(period) || getDefaultConfigByPeriod(period)
      if (!current) return
      const cfg: any = { period }
      THRESHOLD_FIELDS.forEach(field => {
        const original = (current as any)[field] ?? 0
        let adapted: number
        if (field === 'idleRateThreshold' || field === 'surplusThreshold' || field === 'shortageThreshold') {
          adapted = parseFloat((original * ratio).toFixed(2))
        } else {
          adapted = Math.round(original * ratio)
        }
        const range = (PERIOD_THRESHOLD_RANGES as any)[field]
        adapted = Math.max(range.min, Math.min(range.max, adapted))
        cfg[field] = adapted
      })
      configs.push(cfg)
    })
  })
  return configs
}

const validateAdapt = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  if (!adaptSourceCity.value) {
    errors.push('请选择源城市')
  }
  if (adaptTargetCities.value.length === 0) {
    errors.push('请选择至少一个目标城市')
  }
  if (adaptTargetPeriods.value.length === 0) {
    errors.push('请选择至少一个适配时段')
  }
  return { valid: errors.length === 0, errors }
}

const abnormalParamList = computed(() => {
  if (!operationResult.value) return []
  return operationResult.value.abnormalParams || operationResult.value.results.filter(
    r => r.status === 'failed' || r.fieldErrors?.length
  )
})

const hasCityColumn = computed(() => {
  return operationResult.value?.results?.some(r => r.city) || false
})

const handleModify = async () => {
  const validation = validateModifyValues()
  if (!validation.valid) {
    ElMessage.error('参数校验失败：' + validation.errors[0])
    return
  }

  const targetPeriods: string[] = []
  const configParams: Partial<PeriodThreshold> = {}
  let firstPeriod = ''

  TIME_PERIODS.forEach(period => {
    if (modifySelectedFields[period].size > 0) {
      targetPeriods.push(period)
      if (!firstPeriod) firstPeriod = period
    }
  })

  modifySelectedFields[firstPeriod].forEach(field => {
    ;(configParams as any)[field] = (modifyValues as any)[firstPeriod][field]
  })

  try {
    await ElMessageBox.confirm(
      `确认批量修改 ${targetPeriods.length} 个时段的参数？修改后将立即生效。`,
      '批量修改确认',
      { type: 'warning', confirmButtonText: '确认修改', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  await executeOperation({
    operation: BatchPeriodOperation.MODIFY,
    targetPeriods,
    configParams
  })
}

const handleCopy = async () => {
  const validation = validateCopy()
  if (!validation.valid) {
    ElMessage.error(validation.errors[0])
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认将「${copySourcePeriod.value}」的配置复制到 ${copyTargetPeriods.value.length} 个时段？`,
      '批量复制确认',
      { type: 'warning', confirmButtonText: '确认复制', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  await executeOperation({
    operation: BatchPeriodOperation.COPY,
    sourcePeriod: copySourcePeriod.value,
    targetPeriods: copyTargetPeriods.value
  })
}

const handleRestore = async () => {
  const validation = validateRestore()
  if (!validation.valid) {
    ElMessage.error(validation.errors[0])
    return
  }

  try {
    await ElMessageBox.confirm(
      restoreAll.value
        ? '确认将所有时段配置恢复为系统默认值？此操作不可撤销。'
        : `确认将 ${effectiveRestorePeriods.value.length} 个时段配置恢复为系统默认值？此操作不可撤销。`,
      '恢复默认确认',
      { type: 'error', confirmButtonText: '确认恢复', cancelButtonText: '返回' }
    )
  } catch {
    return
  }

  await executeOperation({
    operation: BatchPeriodOperation.RESTORE_DEFAULTS,
    targetPeriods: effectiveRestorePeriods.value,
    restoreAll: restoreAll.value
  })
}

const handleAdapt = async () => {
  const validation = validateAdapt()
  if (!validation.valid) {
    ElMessage.error(validation.errors[0])
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认将「${adaptSourceCity.value}」的配置适配到 ${adaptTargetCities.value.length} 个城市的 ${adaptTargetPeriods.value.length} 个时段？`,
      '城市适配确认',
      { type: 'warning', confirmButtonText: '确认适配', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  const adaptedConfigs = buildAdaptConfigs()
  await executeOperation({
    operation: BatchPeriodOperation.CITY_ADAPT,
    city: adaptSourceCity.value,
    targetPeriods: adaptTargetPeriods.value,
    targetCities: adaptTargetCities.value,
    configs: adaptedConfigs
  })
}

const executeOperation = async (params: any) => {
  operating.value = true
  try {
    const res = await batchPeriodConfigApi(params)
    operationResult.value = res.data
    resultVisible.value = true

    const result = res.data
    let msg = `${BatchPeriodOperationMap[params.operation]}完成：`
    msg += `成功${result.successCount}`
    if (result.skippedCount > 0) msg += `，跳过${result.skippedCount}`
    if (result.failedCount > 0) msg += `，失败${result.failedCount}`

    if (result.failedCount > 0 || result.abnormalParams?.length > 0) {
      ElMessage.warning(msg)
    } else {
      ElMessage.success(msg)
    }

    if (result.savedConfigs?.length > 0) {
      emit('config-saved', result.savedConfigs)
    }
  } catch (e: any) {
    ElMessage.error(e.message || `${BatchPeriodOperationMap[params.operation]}失败`)
  } finally {
    operating.value = false
  }
}

const handleResultClose = () => {
  resultVisible.value = false
  operationResult.value = null
}

const handleClose = () => {
  if (!operating.value) {
    visible.value = false
  }
}

const resetAllState = () => {
  activeTab.value = BatchPeriodOperation.MODIFY
  clearModifySelections()
  copySourcePeriod.value = ''
  copyTargetPeriods.value = []
  restoreAll.value = false
  restoreTargetPeriods.value = []
  adaptSourceCity.value = CITY_OPTIONS[0]
  adaptTargetCities.value = []
  adaptTargetPeriods.value = [...TIME_PERIODS]
  operationResult.value = null
  resultVisible.value = false
}

watch(visible, (val) => {
  if (!val) {
    resetAllState()
  }
})
</script>

<style lang="scss" scoped>
.batch-period-config {
  .config-tabs {
    :deep(.el-tabs__item) {
      padding: 0 20px;
      height: 44px;
      line-height: 44px;
      font-size: 14px;

      &.is-active {
        font-weight: 600;
      }
    }

    :deep(.el-tabs__nav-wrap::after) {
      height: 1px;
      background-color: #ebeef5;
    }

    :deep(.el-tabs__active-bar) {
      height: 3px;
      border-radius: 2px;
      transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }

  .tab-label {
    display: flex;
    align-items: center;
    gap: 6px;
    transition: color 0.3s;

    &-modify {
      :deep(.el-icon) { color: #409eff; }
    }
    &-copy {
      :deep(.el-icon) { color: #e6a23c; }
    }
    &-restore {
      :deep(.el-icon) { color: #67c23a; }
    }
    &-adapt {
      :deep(.el-icon) { color: #9b59b6; }
    }
  }

  .tab-content {
    padding: 16px 4px 8px;
    min-height: 400px;
    animation: fadeSlideIn 0.35s ease;
  }

  @keyframes fadeSlideIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .operation-indicator {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 18px;
    border-radius: 10px;
    margin-bottom: 20px;
    font-size: 14px;
    color: #fff;
    font-weight: 500;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);

    .el-icon {
      font-size: 20px;
    }

    &.modify-indicator {
      background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
    }
    &.copy-indicator {
      background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
    }
    &.restore-indicator {
      background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
    }
    &.adapt-indicator {
      background: linear-gradient(135deg, #9b59b6 0%, #a970c4 100%);
    }
  }

  .section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;

      .section-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 15px;
        font-weight: 600;
        color: #303133;
      }

      .section-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }
  }

  .period-field-list {
    border: 1px solid #ebeef5;
    border-radius: 10px;
    overflow: hidden;

    .period-field-group {
      border-bottom: 1px solid #ebeef5;

      &:last-child {
        border-bottom: none;
      }

      .period-title {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 10px 16px;
        background: linear-gradient(90deg, #f5f7fa 0%, #ffffff 100%);
        font-size: 13px;
        font-weight: 600;
        color: #303133;
        border-bottom: 1px solid #f0f2f5;

        .el-icon {
          color: #409eff;
        }
      }

      .field-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0;
        padding: 8px;
      }
    }
  }

  .field-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.25s;

    &:hover {
      background: #f5f7fa;
    }

    &.selected {
      background: #ecf5ff;
      border-color: #b3d8ff;
    }

    .field-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;

      .field-name {
        font-size: 13px;
        color: #303133;
        font-weight: 500;
      }
      .field-range {
        font-size: 11px;
        color: #909399;
      }
    }
  }

  .restore-options {
    padding: 16px;
    background: #f5f7fa;
    border-radius: 10px;

    .restore-all-checkbox {
      display: block;
      margin-bottom: 14px;
      padding-bottom: 14px;
      border-bottom: 1px solid #e4e7ed;
      font-size: 14px;

      .checkbox-hint {
        margin-left: 6px;
        font-size: 12px;
        color: #909399;
        font-weight: normal;
      }
    }

    .restore-period-group {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }
  }

  .preview-table {
    margin-bottom: 8px;

    .range-unit {
      margin-left: 2px;
      font-size: 11px;
      color: #909399;
    }

    .value-changed {
      color: #e6a23c;
      font-weight: 600;
    }
  }

  .preview-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #909399;

    .changed-indicator {
      width: 12px;
      height: 12px;
      border-radius: 2px;
      background: #fdf6ec;
      border: 2px solid #e6a23c;
    }
  }

  .comparison-table {
    .comparison-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 6px 0;

      .current-value,
      .default-value {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;

        .value-label {
          font-size: 11px;
          color: #909399;
        }
      }

      .value-different {
        color: #f56c6c;
        font-weight: 600;
      }

      .default-highlight {
        background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
        color: #67c23a;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 4px;
      }

      .arrow {
        color: #c0c4cc;
        font-size: 12px;
      }
    }
  }

  .comparison-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #909399;
    margin-top: 8px;

    .different-indicator {
      width: 12px;
      height: 12px;
      border-radius: 2px;
      background: #fef0f0;
      border: 2px solid #f56c6c;
    }
  }

  .city-tier-hint {
    margin-left: 12px;
    font-size: 12px;
    color: #909399;
  }

  .city-tier-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .tier-card {
    padding: 14px 16px;
    background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
    border: 1px solid #ebeef5;
    border-radius: 10px;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .tier-name {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 4px;
    }

    .tier-factor {
      font-size: 20px;
      font-weight: bold;
      color: #409eff;
      margin-bottom: 6px;
    }

    .tier-cities {
      font-size: 12px;
      color: #909399;
      line-height: 1.5;
    }
  }

  .city-preview-block {
    margin-bottom: 16px;
    padding: 12px;
    background: #fafbfc;
    border: 1px solid #ebeef5;
    border-radius: 10px;

    &:last-child {
      margin-bottom: 0;
    }

    .city-preview-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 10px;

      .el-icon {
        color: #9b59b6;
      }

      .tier-tag {
        margin-left: 8px;
      }
    }

    .adapt-value {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      font-size: 12px;
      flex-wrap: wrap;

      .original-value {
        color: #909399;
        text-decoration: line-through;
      }

      .multiply {
        color: #c0c4cc;
      }

      .adapted-value {
        color: #9b59b6;
        font-weight: 600;
        font-size: 13px;
      }
    }
  }

  .action-bar {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 24px;
    padding-top: 18px;
    border-top: 1px solid #ebeef5;

    .action-hint {
      font-size: 13px;
      color: #909399;
    }
  }
}

.operation-result {
  .result-stats {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 24px;
      border-radius: 12px;

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: #fff;
      }

      .stat-info {
        .stat-value {
          font-size: 28px;
          font-weight: bold;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 13px;
          color: #909399;
        }
      }

      &.success {
        background: #f0f9eb;

        .stat-icon { background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%); }
        .stat-value { color: #67c23a; }
      }

      &.skipped {
        background: #fdf6ec;

        .stat-icon { background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%); }
        .stat-value { color: #e6a23c; }
      }

      &.failed {
        background: #fef0f0;

        .stat-icon { background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%); }
        .stat-value { color: #f56c6c; }
      }
    }

    .stat-divider {
      width: 1px;
      height: 60px;
      background: #ebeef5;
    }
  }

  .abnormal-params {
    margin-bottom: 20px;
    padding: 14px 16px;
    background: #fef0f0;
    border-radius: 10px;
    border: 1px solid #fbc4c4;

    .abnormal-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 600;
      color: #f56c6c;
      margin-bottom: 12px;
    }

    .abnormal-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .abnormal-card {
      padding: 10px 14px;
      background: #fff;
      border-radius: 8px;
      border-left: 4px solid #f56c6c;

      .abnormal-card-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 6px;

        .abnormal-period {
          font-size: 13px;
          font-weight: 600;
          color: #303133;
        }

        .abnormal-city {
          font-size: 12px;
          color: #909399;
        }
      }

      .abnormal-fields {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .abnormal-field {
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;

          .field-name {
            color: #606266;
            font-weight: 500;
          }

          .field-value {
            color: #f56c6c;
            font-weight: 600;
          }

          .field-message {
            color: #909399;
          }
        }
      }
    }
  }

  .result-details {
    .details-header {
      font-size: 14px;
      font-weight: 500;
      color: #303133;
      margin-bottom: 12px;
    }
  }
}
</style>
