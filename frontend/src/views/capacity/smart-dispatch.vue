<template>
  <div class="smart-dispatch">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <el-icon><Promotion /></el-icon>
          智能运力调度管控
        </h2>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="Setting">批量调度策略</el-button>
        <el-button type="warning" :icon="DataAnalysis">调度溯源分析</el-button>
      </div>
    </div>

    <el-row :gutter="20" class="main-content">
      <el-col :span="12">
        <el-card class="dispatch-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Connection /></el-icon>
                手动发起运力调度前置校验
              </span>
              <el-tag v-if="precheckResult" :type="precheckResult.canDispatch ? 'success' : 'danger'" size="small">
                {{ precheckResult.canDispatch ? '可调度' : '不可调度' }}
              </el-tag>
            </div>
          </template>

          <el-form :model="dispatchForm" label-width="120px" label-position="right" :rules="dispatchRules" ref="dispatchFormRef">
            <el-form-item label="城市" prop="city">
              <el-select
                v-model="dispatchForm.city"
                placeholder="请选择城市"
                style="width: 100%"
                @change="handleCityChange"
              >
                <el-option
                  v-for="city in CITY_OPTIONS"
                  :key="city"
                  :label="city"
                  :value="city"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="区域" prop="area">
              <el-select
                v-model="dispatchForm.area"
                placeholder="请选择区域"
                style="width: 100%"
                :disabled="!dispatchForm.city"
              >
                <el-option
                  v-for="area in areaOptions"
                  :key="area"
                  :label="area"
                  :value="area"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="调度类型" prop="dispatchType">
              <el-select v-model="dispatchForm.dispatchType" placeholder="请选择调度类型" style="width: 100%">
                <el-option
                  v-for="(label, value) in DispatchTypeMap"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </el-form-item>

            <el-divider content-position="left">调度参数</el-divider>

            <el-form-item label="最大调度半径" prop="maxDispatchRadius">
              <el-input-number
                v-model="dispatchForm.maxDispatchRadius"
                :min="DISPATCH_PARAM_LIMITS.maxDispatchRadius.min"
                :max="DISPATCH_PARAM_LIMITS.maxDispatchRadius.max"
                :step="1"
                controls-position="right"
                style="width: 100%"
                :class="{ 'param-error': paramErrors.maxDispatchRadius }"
              />
              <div v-if="paramErrors.maxDispatchRadius" class="param-error-msg">
                <el-icon><Warning /></el-icon>
                {{ paramErrors.maxDispatchRadius }}
              </div>
              <div class="param-hint">{{ DISPATCH_PARAM_LIMITS.maxDispatchRadius.min }}-{{ DISPATCH_PARAM_LIMITS.maxDispatchRadius.max }}{{ DISPATCH_PARAM_LIMITS.maxDispatchRadius.unit }}</div>
            </el-form-item>

            <el-form-item label="最大调度数量" prop="maxDispatchCount">
              <el-input-number
                v-model="dispatchForm.maxDispatchCount"
                :min="DISPATCH_PARAM_LIMITS.maxDispatchCount.min"
                :max="DISPATCH_PARAM_LIMITS.maxDispatchCount.max"
                :step="1"
                controls-position="right"
                style="width: 100%"
                :class="{ 'param-error': paramErrors.maxDispatchCount }"
              />
              <div v-if="paramErrors.maxDispatchCount" class="param-error-msg">
                <el-icon><Warning /></el-icon>
                {{ paramErrors.maxDispatchCount }}
              </div>
              <div class="param-hint">{{ DISPATCH_PARAM_LIMITS.maxDispatchCount.min }}-{{ DISPATCH_PARAM_LIMITS.maxDispatchCount.max }}{{ DISPATCH_PARAM_LIMITS.maxDispatchCount.unit }}</div>
            </el-form-item>

            <el-form-item label="调度超时时间" prop="dispatchTimeout">
              <el-input-number
                v-model="dispatchForm.dispatchTimeout"
                :min="DISPATCH_PARAM_LIMITS.dispatchTimeout.min"
                :max="DISPATCH_PARAM_LIMITS.dispatchTimeout.max"
                :step="10"
                controls-position="right"
                style="width: 100%"
                :class="{ 'param-error': paramErrors.dispatchTimeout }"
              />
              <div v-if="paramErrors.dispatchTimeout" class="param-error-msg">
                <el-icon><Warning /></el-icon>
                {{ paramErrors.dispatchTimeout }}
              </div>
              <div class="param-hint">{{ DISPATCH_PARAM_LIMITS.dispatchTimeout.min }}-{{ DISPATCH_PARAM_LIMITS.dispatchTimeout.max }}{{ DISPATCH_PARAM_LIMITS.dispatchTimeout.unit }}</div>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                :icon="Search"
                :loading="precheckLoading"
                :disabled="submitDisabled"
                @click="handlePrecheck"
              >
                前置校验
              </el-button>
              <el-button :icon="Refresh" @click="handleResetDispatch">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card v-if="precheckResult" class="precheck-result-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><DataAnalysis /></el-icon>
                区域分析结果
              </span>
              <el-tag
                :type="precheckResult.canDispatch ? 'success' : 'danger'"
                size="small"
                effect="dark"
              >
                {{ precheckResult.canDispatch ? '校验通过' : '校验未通过' }}
              </el-tag>
            </div>
          </template>

          <div class="area-analysis">
            <el-row :gutter="16">
              <el-col :span="8">
                <div class="analysis-item">
                  <div class="analysis-label">订单热度</div>
                  <div class="analysis-value">
                    <span class="heat-badge" :class="`heat-${precheckResult.areaAnalysis.orderHeat}`">
                      {{ OrderHeatMap[precheckResult.areaAnalysis.orderHeat] }}
                    </span>
                    <span class="analysis-score">{{ precheckResult.areaAnalysis.orderHeatScore }}分</span>
                  </div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="analysis-item">
                  <div class="analysis-label">司机密度</div>
                  <div class="analysis-value">
                    <span class="density-value">{{ precheckResult.areaAnalysis.driverDensity }}</span>
                    <span class="density-unit">人/km²</span>
                  </div>
                  <div class="analysis-sub">空闲司机：{{ precheckResult.areaAnalysis.idleDriverCount }}人</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="analysis-item">
                  <div class="analysis-label">交通状况</div>
                  <div class="analysis-value">
                    <span class="traffic-badge" :class="`traffic-${precheckResult.areaAnalysis.trafficLevel}`">
                      {{ TrafficLevelMap[precheckResult.areaAnalysis.trafficLevel] }}
                    </span>
                  </div>
                </div>
              </el-col>
            </el-row>

            <el-row :gutter="16" class="analysis-row">
              <el-col :span="12">
                <div class="analysis-item">
                  <div class="analysis-label">
                    <el-icon><Warning /></el-icon>
                    拥堵区域
                  </div>
                  <div class="area-tags" v-if="precheckResult.areaAnalysis.congestionAreas.length > 0">
                    <el-tag
                      v-for="area in precheckResult.areaAnalysis.congestionAreas"
                      :key="area"
                      type="danger"
                      size="small"
                      effect="plain"
                    >
                      {{ area }}
                    </el-tag>
                  </div>
                  <div v-else class="no-data">暂无拥堵区域</div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="analysis-item">
                  <div class="analysis-label">
                    <el-icon><Location /></el-icon>
                    高密度区域
                  </div>
                  <div class="area-tags" v-if="precheckResult.areaAnalysis.highDensityAreas.length > 0">
                    <el-tag
                      v-for="area in precheckResult.areaAnalysis.highDensityAreas"
                      :key="area"
                      type="warning"
                      size="small"
                      effect="plain"
                    >
                      {{ area }}
                    </el-tag>
                  </div>
                  <div v-else class="no-data">暂无高密度区域</div>
                </div>
              </el-col>
            </el-row>

            <div class="analysis-item recommended-item">
              <div class="analysis-label">推荐优先级</div>
              <span class="priority-badge" :class="`priority-${precheckResult.areaAnalysis.recommendedPriority}`">
                {{ precheckResult.areaAnalysis.recommendedPriority === 'high' ? '高' : precheckResult.areaAnalysis.recommendedPriority === 'medium' ? '中' : '低' }}
              </span>
            </div>

            <div v-if="precheckResult.warnings.length > 0" class="warnings-section">
              <div class="section-label">
                <el-icon><Warning /></el-icon>
                警告信息
              </div>
              <el-alert
                v-for="(warning, index) in precheckResult.warnings"
                :key="index"
                :title="warning"
                type="warning"
                :closable="false"
                show-icon
                class="warning-alert"
              />
            </div>

            <div v-if="precheckResult.suggestions.length > 0" class="suggestions-section">
              <div class="section-label">
                <el-icon><CircleCheck /></el-icon>
                优化建议
              </div>
              <el-alert
                v-for="(suggestion, index) in precheckResult.suggestions"
                :key="index"
                :title="suggestion"
                type="success"
                :closable="false"
                show-icon
                class="suggestion-alert"
              />
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="match-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Promotion /></el-icon>
                智能匹配最优运力
              </span>
            </div>
          </template>

          <el-form :model="matchForm" label-width="120px" label-position="right">
            <el-form-item label="订单编号">
              <el-input
                v-model="matchForm.orderId"
                placeholder="请输入订单编号"
                :prefix-icon="Document"
              />
            </el-form-item>

            <el-form-item label="优先级">
              <el-select v-model="matchForm.priority" placeholder="请选择优先级" style="width: 100%">
                <el-option
                  v-for="(label, value) in OrderPriorityMap"
                  :key="value"
                  :label="label"
                  :value="value"
                >
                  <span class="priority-option">
                    <span class="priority-dot" :style="{ background: OrderPriorityColorMap[value] }"></span>
                    {{ label }}
                  </span>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="目标区域">
              <el-input
                v-model="matchForm.targetArea"
                placeholder="请输入目标区域"
                :prefix-icon="Location"
              />
            </el-form-item>

            <el-divider content-position="left">匹配参数</el-divider>

            <el-form-item label="最大距离">
              <el-input-number
                v-model="matchForm.maxDistance"
                :min="1"
                :max="50"
                :step="1"
                controls-position="right"
                style="width: 100%"
              />
              <div class="param-hint">1-50 km</div>
            </el-form-item>

            <el-form-item label="最低服务分">
              <el-input-number
                v-model="matchForm.minServiceScore"
                :min="1.0"
                :max="5.0"
                :step="0.1"
                :precision="1"
                controls-position="right"
                style="width: 100%"
              />
              <div class="param-hint">1.0-5.0 分</div>
            </el-form-item>

            <el-form-item label="最大负载">
              <el-input-number
                v-model="matchForm.maxLoad"
                :min="1"
                :max="10"
                :step="1"
                controls-position="right"
                style="width: 100%"
              />
              <div class="param-hint">1-10 单</div>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                :icon="Promotion"
                :loading="matchLoading"
                @click="handleSmartMatch"
              >
                智能匹配
              </el-button>
            </el-form-item>
          </el-form>

          <div class="weight-visualization">
            <div class="section-label">
              <el-icon><DataAnalysis /></el-icon>
              优先级权重配置
            </div>
            <div class="weight-bars">
              <div
                v-for="(weights, priority) in PRIORITY_WEIGHTS"
                :key="priority"
                class="weight-group"
                :class="{ 'weight-active': matchForm.priority === priority }"
              >
                <div class="weight-group-header">
                  <span class="priority-badge-sm" :class="`badge-${priority}`">
                    {{ OrderPriorityMap[priority] }}
                  </span>
                  <el-icon v-if="matchForm.priority === priority"><CircleCheck /></el-icon>
                </div>
                <div class="weight-bar-item">
                  <span class="weight-label">紧急度</span>
                  <el-progress :percentage="weights.urgency * 100" :stroke-width="10" :color="'#f56c6c'" :show-text="false" />
                  <span class="weight-value">{{ (weights.urgency * 100).toFixed(0) }}%</span>
                </div>
                <div class="weight-bar-item">
                  <span class="weight-label">距离</span>
                  <el-progress :percentage="weights.distance * 100" :stroke-width="10" :color="'#409eff'" :show-text="false" />
                  <span class="weight-value">{{ (weights.distance * 100).toFixed(0) }}%</span>
                </div>
                <div class="weight-bar-item">
                  <span class="weight-label">服务分</span>
                  <el-progress :percentage="weights.serviceScore * 100" :stroke-width="10" :color="'#67c23a'" :show-text="false" />
                  <span class="weight-value">{{ (weights.serviceScore * 100).toFixed(0) }}%</span>
                </div>
                <div class="weight-bar-item">
                  <span class="weight-label">负载</span>
                  <el-progress :percentage="weights.load * 100" :stroke-width="10" :color="'#e6a23c'" :show-text="false" />
                  <span class="weight-value">{{ (weights.load * 100).toFixed(0) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <el-card v-if="matchResult" class="match-result-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><CircleCheck v-if="matchResult.matchedDriver" />
                <CircleClose v-else />
                </el-icon>
                匹配结果
              </span>
              <div class="match-meta">
                <span class="match-time">
                  <el-icon><Timer /></el-icon>
                  匹配耗时：{{ matchResult.matchTime }}ms
                </span>
              </div>
            </div>
          </template>

          <div v-if="matchResult.matchedDriver" class="match-success">
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="司机ID">{{ matchResult.matchedDriver.driverId }}</el-descriptions-item>
              <el-descriptions-item label="司机姓名">{{ matchResult.matchedDriver.driverName }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ matchResult.matchedDriver.phone }}</el-descriptions-item>
              <el-descriptions-item label="距离">{{ matchResult.matchedDriver.distance }}km</el-descriptions-item>
              <el-descriptions-item label="服务评分">{{ matchResult.matchedDriver.serviceScore }}</el-descriptions-item>
              <el-descriptions-item label="当前负载">{{ matchResult.matchedDriver.loadStatus }}/{{ matchResult.matchedDriver.currentOrders }}单</el-descriptions-item>
            </el-descriptions>

            <div class="score-breakdown">
              <div class="section-label">评分明细（总分：{{ matchResult.matchedDriver.matchScore.toFixed(1) }}）</div>
              <div class="score-bars">
                <div class="score-bar-item">
                  <span class="score-label">紧急度</span>
                  <div class="score-bar">
                    <div class="score-fill urgency" :style="{ width: `${matchResult.matchedDriver.scoreBreakdown.urgencyScore * 10}%` }"></div>
                  </div>
                  <span class="score-value">{{ matchResult.matchedDriver.scoreBreakdown.urgencyScore.toFixed(1) }}</span>
                </div>
                <div class="score-bar-item">
                  <span class="score-label">距离</span>
                  <div class="score-bar">
                    <div class="score-fill distance" :style="{ width: `${matchResult.matchedDriver.scoreBreakdown.distanceScore * 10}%` }"></div>
                  </div>
                  <span class="score-value">{{ matchResult.matchedDriver.scoreBreakdown.distanceScore.toFixed(1) }}</span>
                </div>
                <div class="score-bar-item">
                  <span class="score-label">服务分</span>
                  <div class="score-bar">
                    <div class="score-fill service" :style="{ width: `${matchResult.matchedDriver.scoreBreakdown.serviceScore * 10}%` }"></div>
                  </div>
                  <span class="score-value">{{ matchResult.matchedDriver.scoreBreakdown.serviceScore.toFixed(1) }}</span>
                </div>
                <div class="score-bar-item">
                  <span class="score-label">负载</span>
                  <div class="score-bar">
                    <div class="score-fill load" :style="{ width: `${matchResult.matchedDriver.scoreBreakdown.loadScore * 10}%` }"></div>
                  </div>
                  <span class="score-value">{{ matchResult.matchedDriver.scoreBreakdown.loadScore.toFixed(1) }}</span>
                </div>
              </div>
            </div>

            <div class="match-status">
              <el-row :gutter="16">
                <el-col :span="12">
                  <div class="status-item">
                    <span class="status-label">订单状态更新</span>
                    <el-tag :type="matchResult.orderStatus === 2 ? 'success' : 'info'" size="small">
                      {{ matchResult.orderStatus === 2 ? '已派单' : `状态${matchResult.orderStatus}` }}
                    </el-tag>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="status-item">
                    <span class="status-label">司机负载更新</span>
                    <el-tag :type="matchResult.driverLoadUpdated ? 'success' : 'danger'" size="small">
                      {{ matchResult.driverLoadUpdated ? '已更新' : '未更新' }}
                    </el-tag>
                  </div>
                </el-col>
              </el-row>
            </div>

            <div class="match-logic">
              <span class="logic-label">匹配逻辑：</span>
              <span class="logic-text">{{ matchResult.matchLogic }}</span>
            </div>
          </div>

          <div v-else class="match-empty">
            <el-empty description="未找到匹配司机" :image-size="80">
              <template #description>
                <span class="empty-text">未找到匹配司机</span>
              </template>
            </el-empty>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="table-card" shadow="never" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Document /></el-icon>
            近期调度结果
          </span>
          <el-button type="primary" :icon="Refresh" size="small" @click="loadRecentDispatches">刷新</el-button>
        </div>
      </template>

      <el-table :data="recentDispatches" size="small" stripe>
        <el-table-column prop="taskId" label="任务ID" width="160" fixed />
        <el-table-column prop="triggerTime" label="触发时间" width="180" />
        <el-table-column prop="triggerType" label="触发类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getTriggerTypeTag(row.triggerType)">
              {{ getTriggerTypeLabel(row.triggerType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="targetArea" label="目标区域" width="180" />
        <el-table-column prop="targetCity" label="城市" width="100" />
        <el-table-column prop="matchedDriverName" label="匹配司机" width="120">
          <template #default="{ row }">
            <span v-if="row.matchedDriverName">{{ row.matchedDriverName }}</span>
            <span v-else class="text-muted">未匹配</span>
          </template>
        </el-table-column>
        <el-table-column prop="executionResult" label="执行结果" width="100" align="center">
          <template #default="{ row }">
            <span class="result-tag" :class="`result-${row.executionResult}`">
              {{ getResultLabel(row.executionResult) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="executionDuration" label="耗时(ms)" width="100" align="right" />
        <el-table-column prop="isInvalid" label="是否异常" width="80" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.isInvalid" class="text-danger"><CircleClose /></el-icon>
            <el-icon v-else class="text-success"><CircleCheck /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="validationFlags" label="校验标记" min-width="150">
          <template #default="{ row }">
            <el-tag
              v-for="flag in row.validationFlags"
              :key="flag"
              size="small"
              type="warning"
              effect="plain"
              class="flag-tag"
            >
              {{ flag }}
            </el-tag>
            <span v-if="!row.validationFlags || row.validationFlags.length === 0" class="text-muted">-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Promotion, Connection, DataAnalysis, Warning, CircleCheck, CircleClose, Search, Refresh, Timer, Location, Setting, Document } from '@element-plus/icons-vue'
import { smartDispatchPrecheckApi, smartMatchDispatchApi } from '@/api/capacity'
import type { SmartDispatchPrecheckResult, SmartMatchResult, AreaAnalysis } from '@/types/capacity'
import { CITY_OPTIONS, BUSINESS_DISTRICTS, DispatchType, DispatchTypeMap, OrderPriority, OrderPriorityMap, OrderPriorityColorMap, OrderHeatLevel, OrderHeatMap, TrafficLevel, TrafficLevelMap, DISPATCH_PARAM_LIMITS, PRIORITY_WEIGHTS } from '@/enums/capacity'
import type { DispatchTraceRecord } from '@/types/capacity'

const dispatchFormRef = ref()
const precheckLoading = ref(false)
const matchLoading = ref(false)
const submitDisabled = ref(false)
const precheckResult = ref<SmartDispatchPrecheckResult | null>(null)
const matchResult = ref<SmartMatchResult | null>(null)

const dispatchForm = reactive({
  city: '',
  area: '',
  dispatchType: 'manual' as 'manual' | 'auto' | 'emergency',
  maxDispatchRadius: 10,
  maxDispatchCount: 50,
  dispatchTimeout: 120
})

const matchForm = reactive({
  orderId: '',
  priority: 'normal' as 'urgent' | 'normal' | 'low',
  targetArea: '',
  maxDistance: 5,
  minServiceScore: 3.0,
  maxLoad: 3
})

const paramErrors = reactive<Record<string, string | null>>({
  maxDispatchRadius: null,
  maxDispatchCount: null,
  dispatchTimeout: null
})

const recentDispatches = ref<DispatchTraceRecord[]>([])

const areaOptions = computed(() => {
  if (!dispatchForm.city) return []
  return BUSINESS_DISTRICTS[dispatchForm.city] || []
})

const dispatchRules = {
  city: [{ required: true, message: '请选择城市', trigger: 'change' }],
  area: [{ required: true, message: '请选择区域', trigger: 'change' }],
  dispatchType: [{ required: true, message: '请选择调度类型', trigger: 'change' }]
}

const handleCityChange = () => {
  dispatchForm.area = ''
}

const validateParams = (): boolean => {
  let valid = true
  paramErrors.maxDispatchRadius = null
  paramErrors.maxDispatchCount = null
  paramErrors.dispatchTimeout = null

  const r = dispatchForm.maxDispatchRadius
  if (r < DISPATCH_PARAM_LIMITS.maxDispatchRadius.min || r > DISPATCH_PARAM_LIMITS.maxDispatchRadius.max) {
    paramErrors.maxDispatchRadius = `调度半径须在${DISPATCH_PARAM_LIMITS.maxDispatchRadius.min}-${DISPATCH_PARAM_LIMITS.maxDispatchRadius.max}${DISPATCH_PARAM_LIMITS.maxDispatchRadius.unit}范围内`
    valid = false
  }

  const c = dispatchForm.maxDispatchCount
  if (c < DISPATCH_PARAM_LIMITS.maxDispatchCount.min || c > DISPATCH_PARAM_LIMITS.maxDispatchCount.max) {
    paramErrors.maxDispatchCount = `调度数量须在${DISPATCH_PARAM_LIMITS.maxDispatchCount.min}-${DISPATCH_PARAM_LIMITS.maxDispatchCount.max}${DISPATCH_PARAM_LIMITS.maxDispatchCount.unit}范围内`
    valid = false
  }

  const t = dispatchForm.dispatchTimeout
  if (t < DISPATCH_PARAM_LIMITS.dispatchTimeout.min || t > DISPATCH_PARAM_LIMITS.dispatchTimeout.max) {
    paramErrors.dispatchTimeout = `超时时间须在${DISPATCH_PARAM_LIMITS.dispatchTimeout.min}-${DISPATCH_PARAM_LIMITS.dispatchTimeout.max}${DISPATCH_PARAM_LIMITS.dispatchTimeout.unit}范围内`
    valid = false
  }

  return valid
}

const handlePrecheck = async () => {
  if (!dispatchFormRef.value) return

  try {
    await dispatchFormRef.value.validate()
  } catch {
    return
  }

  if (!validateParams()) {
    ElMessage.warning('参数校验不通过，请检查参数设置')
    return
  }

  submitDisabled.value = true
  setTimeout(() => {
    submitDisabled.value = false
  }, 300)

  precheckLoading.value = true
  try {
    const res = await smartDispatchPrecheckApi({
      city: dispatchForm.city,
      area: dispatchForm.area,
      dispatchType: dispatchForm.dispatchType,
      maxDispatchRadius: dispatchForm.maxDispatchRadius,
      maxDispatchCount: dispatchForm.maxDispatchCount,
      dispatchTimeout: dispatchForm.dispatchTimeout
    })
    precheckResult.value = res.data

    if (res.data.areaAnalysis.parameterValidation) {
      const pv = res.data.areaAnalysis.parameterValidation
      if (!pv.maxDispatchRadius.valid) {
        paramErrors.maxDispatchRadius = pv.maxDispatchRadius.message || '参数超出限制'
      }
      if (!pv.maxDispatchCount.valid) {
        paramErrors.maxDispatchCount = pv.maxDispatchCount.message || '参数超出限制'
      }
      if (!pv.dispatchTimeout.valid) {
        paramErrors.dispatchTimeout = pv.dispatchTimeout.message || '参数超出限制'
      }

      if (!pv.maxDispatchRadius.valid || !pv.maxDispatchCount.valid || !pv.dispatchTimeout.valid) {
        ElMessage.warning('部分参数超出区域限制，已自动拦截并标红')
      }
    }

    ElMessage.success(res.data.canDispatch ? '前置校验通过，可执行调度' : '前置校验未通过')
  } catch (e: any) {
    ElMessage.error(e.message || '前置校验失败')
  } finally {
    precheckLoading.value = false
  }
}

const handleSmartMatch = async () => {
  if (!matchForm.orderId) {
    ElMessage.warning('请输入订单编号')
    return
  }
  if (!matchForm.targetArea) {
    ElMessage.warning('请输入目标区域')
    return
  }

  matchLoading.value = true
  try {
    const res = await smartMatchDispatchApi({
      orderId: Number(matchForm.orderId),
      priority: matchForm.priority,
      targetArea: matchForm.targetArea,
      matchParams: {
        maxDistance: matchForm.maxDistance,
        minServiceScore: matchForm.minServiceScore,
        maxLoad: matchForm.maxLoad
      }
    })
    matchResult.value = res.data
    ElMessage.success(res.data.matchedDriver ? '匹配成功' : '未找到匹配司机')
  } catch (e: any) {
    ElMessage.error(e.message || '智能匹配失败')
  } finally {
    matchLoading.value = false
  }
}

const handleResetDispatch = () => {
  dispatchForm.city = ''
  dispatchForm.area = ''
  dispatchForm.dispatchType = 'manual'
  dispatchForm.maxDispatchRadius = 10
  dispatchForm.maxDispatchCount = 50
  dispatchForm.dispatchTimeout = 120
  paramErrors.maxDispatchRadius = null
  paramErrors.maxDispatchCount = null
  paramErrors.dispatchTimeout = null
  precheckResult.value = null
}

const getTriggerTypeLabel = (type: string) => {
  const map: Record<string, string> = { manual: '手动', auto: '自动', batch: '批量' }
  return map[type] || type
}

const getTriggerTypeTag = (type: string): '' | 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = { manual: '', auto: 'success', batch: 'warning' }
  return map[type] || 'info'
}

const getResultLabel = (result: string) => {
  const map: Record<string, string> = { success: '成功', failed: '失败', cancelled: '已取消', intercepted: '已拦截' }
  return map[result] || result
}

const loadRecentDispatches = async () => {
  try {
    const { getDispatchTraceApi } = await import('@/api/capacity')
    const res = await getDispatchTraceApi()
    recentDispatches.value = res.data.traces || []
  } catch {
    recentDispatches.value = []
  }
}

onMounted(() => {
  loadRecentDispatches()
})
</script>

<style lang="scss" scoped>
.smart-dispatch {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 16px 24px;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(15, 52, 96, 0.3);

    .header-left {
      .page-title {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0;
        font-size: 22px;
        color: #fff;
        font-weight: 600;

        .el-icon {
          font-size: 24px;
          color: #409eff;
        }
      }
    }

    .header-right {
      display: flex;
      gap: 12px;
    }
  }

  .main-content {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 15px;
        font-weight: 500;
        color: #303133;
      }
    }
  }

  .dispatch-card,
  .match-card {
    margin-bottom: 20px;

    .param-hint {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
    }

    .param-error-msg {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #f56c6c;
      margin-top: 4px;
    }
  }

  .param-error {
    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px #f56c6c inset !important;
    }
  }

  .precheck-result-card {
    margin-bottom: 20px;

    .area-analysis {
      .analysis-row {
        margin-top: 16px;
      }

      .analysis-item {
        padding: 12px;
        background: #f5f7fa;
        border-radius: 8px;

        .analysis-label {
          font-size: 13px;
          color: #909399;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .analysis-value {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .analysis-sub {
          font-size: 12px;
          color: #909399;
          margin-top: 4px;
        }

        .heat-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 500;

          &.heat-low {
            background: #f0f9eb;
            color: #67c23a;
          }

          &.heat-medium {
            background: #fdf6ec;
            color: #e6a23c;
          }

          &.heat-high {
            background: #fef0f0;
            color: #f56c6c;
          }

          &.heat-extreme {
            background: #f56c6c;
            color: #fff;
            animation: priorityPulse 1.5s ease-in-out infinite;
          }
        }

        .analysis-score {
          font-size: 14px;
          font-weight: 500;
          color: #303133;
        }

        .density-value {
          font-size: 20px;
          font-weight: bold;
          color: #303133;
        }

        .density-unit {
          font-size: 13px;
          color: #909399;
        }

        .traffic-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 500;

          &.traffic-smooth {
            background: #f0f9eb;
            color: #67c23a;
          }

          &.traffic-slow {
            background: #fdf6ec;
            color: #e6a23c;
          }

          &.traffic-congested {
            background: #fef0f0;
            color: #f56c6c;
          }

          &.traffic-blocked {
            background: #f56c6c;
            color: #fff;
          }
        }
      }

      .area-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .no-data {
        font-size: 12px;
        color: #c0c4cc;
      }

      .recommended-item {
        margin-top: 16px;
        display: flex;
        align-items: center;
        gap: 12px;

        .priority-badge {
          display: inline-block;
          padding: 4px 14px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          color: #fff;

          &.priority-high {
            background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
            animation: priorityPulse 1.5s ease-in-out infinite;
          }

          &.priority-medium {
            background: linear-gradient(135deg, #e6a23c 0%, #f0c78a 100%);
          }

          &.priority-low {
            background: linear-gradient(135deg, #909399 0%, #b1b3b8 100%);
          }
        }
      }

      .warnings-section,
      .suggestions-section {
        margin-top: 16px;

        .section-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #303133;
          margin-bottom: 10px;
        }

        .warning-alert,
        .suggestion-alert {
          margin-bottom: 8px;
        }
      }
    }
  }

  .match-card {
    .priority-option {
      display: flex;
      align-items: center;
      gap: 6px;

      .priority-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
      }
    }

    .weight-visualization {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #ebeef5;

      .section-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 16px;
      }

      .weight-bars {
        display: flex;
        gap: 12px;

        .weight-group {
          flex: 1;
          padding: 12px;
          border-radius: 8px;
          background: #f5f7fa;
          border: 2px solid transparent;
          transition: all 0.3s;

          &.weight-active {
            border-color: #409eff;
            background: #ecf5ff;
          }

          .weight-group-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;

            .priority-badge-sm {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 8px;
              font-size: 12px;
              font-weight: 500;
              color: #fff;

              &.badge-urgent {
                background: #f56c6c;
                animation: priorityPulse 1.5s ease-in-out infinite;
              }

              &.badge-normal {
                background: #409eff;
              }

              &.badge-low {
                background: #909399;
              }
            }

            .el-icon {
              color: #409eff;
              font-size: 16px;
            }
          }

          .weight-bar-item {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 6px;

            &:last-child {
              margin-bottom: 0;
            }

            .weight-label {
              font-size: 12px;
              color: #606266;
              width: 40px;
              flex-shrink: 0;
            }

            .el-progress {
              flex: 1;
            }

            .weight-value {
              font-size: 12px;
              color: #909399;
              width: 36px;
              text-align: right;
              flex-shrink: 0;
            }
          }
        }
      }
    }
  }

  .match-result-card {
    margin-bottom: 20px;

    .match-meta {
      .match-time {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #909399;
      }
    }

    .match-success {
      .score-breakdown {
        margin-top: 16px;

        .section-label {
          font-size: 14px;
          font-weight: 500;
          color: #303133;
          margin-bottom: 12px;
        }

        .score-bars {
          .score-bar-item {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;

            .score-label {
              font-size: 13px;
              color: #606266;
              width: 50px;
              flex-shrink: 0;
            }

            .score-bar {
              flex: 1;
              height: 10px;
              background: #ebeef5;
              border-radius: 5px;
              overflow: hidden;

              .score-fill {
                height: 100%;
                border-radius: 5px;
                transition: width 0.5s;

                &.urgency {
                  background: linear-gradient(90deg, #f56c6c 0%, #f78989 100%);
                }

                &.distance {
                  background: linear-gradient(90deg, #409eff 0%, #79bbff 100%);
                }

                &.service {
                  background: linear-gradient(90deg, #67c23a 0%, #95d475 100%);
                }

                &.load {
                  background: linear-gradient(90deg, #e6a23c 0%, #f0c78a 100%);
                }
              }
            }

            .score-value {
              font-size: 13px;
              color: #303133;
              width: 36px;
              text-align: right;
              flex-shrink: 0;
              font-weight: 500;
            }
          }
        }
      }

      .match-status {
        margin-top: 16px;
        padding: 12px;
        background: #f5f7fa;
        border-radius: 8px;

        .status-item {
          display: flex;
          align-items: center;
          gap: 8px;

          .status-label {
            font-size: 13px;
            color: #606266;
          }
        }
      }

      .match-logic {
        margin-top: 12px;
        padding: 10px 14px;
        background: #fafafa;
        border-radius: 6px;
        border-left: 3px solid #409eff;

        .logic-label {
          font-size: 13px;
          color: #909399;
        }

        .logic-text {
          font-size: 13px;
          color: #303133;
        }
      }
    }

    .match-empty {
      .empty-text {
        color: #909399;
        font-size: 14px;
      }
    }
  }

  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 15px;
        font-weight: 500;
        color: #303133;
      }
    }

    .result-tag {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 500;

      &.result-success {
        background: #f0f9eb;
        color: #67c23a;
      }

      &.result-failed {
        background: #fef0f0;
        color: #f56c6c;
      }

      &.result-cancelled {
        background: #f4f4f5;
        color: #909399;
      }

      &.result-intercepted {
        background: #fdf6ec;
        color: #e6a23c;
      }
    }

    .flag-tag {
      margin-right: 4px;
      margin-bottom: 2px;
    }

    .text-muted {
      color: #c0c4cc;
    }

    .text-danger {
      color: #f56c6c;
    }

    .text-success {
      color: #67c23a;
    }
  }
}

@keyframes priorityPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.4);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.03);
    box-shadow: 0 0 0 8px rgba(245, 108, 108, 0);
  }
}
</style>
