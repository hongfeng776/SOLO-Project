<template>
  <el-dialog v-model="dialogVisible" title="车辆合规校验" width="800px" :close-on-click-modal="false" class="vehicle-compliance-check-dialog">
    <div class="vehicle-info-bar">
      <div class="vehicle-plate">{{ vehicle?.plateNumber }}</div>
      <div class="vehicle-meta">
        <span class="meta-item"><el-icon><Van /></el-icon> {{ vehicle?.vin }}</span>
        <span class="meta-item ml-16"><el-icon><Location /></el-icon> {{ vehicle?.city }}</span>
        <span class="meta-item ml-16">城市等级：{{ CityTierMap[vehicle?.cityTier as keyof typeof CityTierMap] }}</span>
      </div>
      <div class="compliance-badge">
        <el-tag :type="getComplianceTagType(vehicle?.complianceLevel)" effect="dark">
          {{ ComplianceLevelMap[vehicle?.complianceLevel as keyof typeof ComplianceLevelMap] }}
        </el-tag>
      </div>
    </div>

    <div class="check-type-selector" v-if="!currentCheck">
      <div class="section-title">选择校验类型</div>
      <el-radio-group v-model="checkType" class="type-radios">
        <el-radio-button :value="4">综合校验</el-radio-button>
        <el-radio-button :value="1">保险校验</el-radio-button>
        <el-radio-button :value="2">年检校验</el-radio-button>
        <el-radio-button :value="3">违章校验</el-radio-button>
      </el-radio-group>

      <div class="standards-info">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="校验等级">{{ CheckLevelMap[checkLevel as keyof typeof CheckLevelMap] }}</el-descriptions-item>
          <el-descriptions-item label="校验周期">{{ checkCycleDays }} 天</el-descriptions-item>
          <el-descriptions-item label="文档校验">{{ strictDocumentCheck ? '严格' : '常规' }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="start-check">
        <el-button type="primary" :loading="checking" @click="handleStartCheck">
          <el-icon v-if="checking"><Loading /></el-icon>
          {{ checking ? '校验中...' : '开始校验' }}
        </el-button>
        <span class="check-tip">校验将同步交管平台数据，预计耗时 2-5 秒</span>
      </div>
    </div>

    <div v-if="currentCheck" class="check-results">
      <div class="result-header">
        <div class="result-status">
          <el-tag :type="getCheckStatusType(currentCheck.checkStatus)" effect="dark" size="large">
            {{ ComplianceCheckStatusMap[currentCheck.checkStatus as keyof typeof ComplianceCheckStatusMap] }}
          </el-tag>
          <el-tag v-if="currentCheck.trafficDataVerified === 1" type="success" size="small">
            交管数据核验一致
          </el-tag>
          <el-tag v-else-if="currentCheck.trafficDataVerified === 2" type="danger" size="small">
            交管数据不一致
          </el-tag>
        </div>
        <div class="result-score">
          <span class="score-label">校验得分</span>
          <span class="score-value" :style="{ color: getScoreColor(currentCheck.checkScore) }">
            {{ Number(currentCheck.checkScore).toFixed(1) }}
          </span>
          <span class="score-label">/ 100</span>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="check-tabs">
        <el-tab-pane label="保险校验" name="insurance">
          <CheckResultCard :data="currentCheck.insuranceCheck" :highlighted-fields="currentCheck.highlightedFields" />
        </el-tab-pane>
        <el-tab-pane label="年检校验" name="inspection">
          <CheckResultCard :data="currentCheck.inspectionCheck" :highlighted-fields="currentCheck.highlightedFields" />
        </el-tab-pane>
        <el-tab-pane label="违章校验" name="violation">
          <CheckResultCard :data="currentCheck.violationCheck" :highlighted-fields="currentCheck.highlightedFields" />
        </el-tab-pane>
        <el-tab-pane label="参数校验" name="parameter">
          <CheckResultCard :data="currentCheck.parameterCheck" :highlighted-fields="currentCheck.highlightedFields" />
        </el-tab-pane>
        <el-tab-pane label="数据比对" name="comparison">
          <CheckResultCard :data="currentCheck.dataComparison" :highlighted-fields="currentCheck.highlightedFields" />
        </el-tab-pane>
      </el-tabs>

      <div v-if="currentCheck.abnormalItems && currentCheck.abnormalItems.length > 0" class="abnormal-summary">
        <el-alert
          :title="`检测到 ${currentCheck.abnormalItems.length} 项异常`"
          type="error"
          show-icon
          :closable="false"
        >
          <template #default>
            <div class="abnormal-list">
              <div v-for="(item, idx) in currentCheck.abnormalItems" :key="idx" class="abnormal-item">
                <el-icon><WarningFilled /></el-icon>
                <span>{{ item }}</span>
              </div>
            </div>
          </template>
        </el-alert>
      </div>

      <div class="result-actions">
        <el-button @click="handleReset">重新校验</el-button>
        <el-button v-if="currentCheck.checkStatus === 3" type="warning" @click="handleCreateRectification">
          创建整改
        </el-button>
        <el-button v-if="currentCheck.checkStatus === 4" type="danger" @click="handleMarkAbnormal">
          标记异常
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, defineComponent, h } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Van, Location, Loading, WarningFilled,
  CircleCheck, CircleClose, InfoFilled
} from '@element-plus/icons-vue'
import { performComplianceCheckApi, getComplianceStandardsApi, createRectificationApi } from '@/api/vehicle'
import {
  ComplianceLevelMap,
  ComplianceCheckStatusMap,
  CityTierMap,
  CheckLevelMap
} from '@/enums/vehicle'
import type { Vehicle, VehicleComplianceCheck, ComplianceStandards } from '@/types/vehicle'

const props = defineProps<{
  modelValue: boolean
  vehicle: Vehicle | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const checkType = ref(4)
const checking = ref(false)
const currentCheck = ref<VehicleComplianceCheck | null>(null)
const activeTab = ref('insurance')
const checkLevel = ref(1)
const checkCycleDays = ref(30)
const strictDocumentCheck = ref(false)

const CheckResultCard = defineComponent({
  props: ['data', 'highlightedFields'],
  setup(props) {
    const items = computed(() => {
      if (!props.data || typeof props.data !== 'object') return []
      return Object.entries(props.data).map(([key, value]) => ({
        field: key,
        value: typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value),
        highlighted: props.highlightedFields?.includes?.(key) || false,
        passed: typeof value === 'object' && value !== null ? (value as any).passed !== false : true
      }))
    })
    return () => h('div', { class: 'check-result-card' }, [
      items.value.length === 0
        ? h('div', { class: 'empty-result' }, '暂无数据')
        : items.value.map(item => h('div', {
          class: ['result-item', { 'highlighted': item.highlighted, 'failed': !item.passed }]
        }, [
          h('span', { class: 'item-label' }, item.field + '：'),
          h('span', { class: 'item-value' }, item.value)
        ]))
    ])
  }
})

const getComplianceTagType = (level: number | undefined) => {
  const map: Record<number, string> = { 1: 'success', 2: '', 3: 'warning', 4: 'danger', 0: 'info' }
  return map[level || 0] || 'info'
}

const getCheckStatusType = (status: number | undefined) => {
  const map: Record<number, string> = {
    0: 'info', 1: 'warning', 2: 'success', 3: 'danger', 4: 'danger'
  }
  return map[status || 0] || 'info'
}

const getScoreColor = (score: number | undefined) => {
  if (!score) return '#909399'
  if (score >= 90) return '#67c23a'
  if (score >= 75) return '#409eff'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

const loadStandards = async () => {
  if (!props.vehicle?.city) return
  try {
    const res = await getComplianceStandardsApi(props.vehicle.city)
    checkLevel.value = res.data.checkLevel
    checkCycleDays.value = res.data.checkCycleDays
    strictDocumentCheck.value = res.data.strictDocumentCheck
  } catch (e: any) {
    console.error('Failed to load compliance standards:', e)
  }
}

const handleStartCheck = async () => {
  if (!props.vehicle) return
  checking.value = true
  try {
    const res = await performComplianceCheckApi(props.vehicle.id, checkType.value)
    currentCheck.value = res.data
    ElMessage.success('校验完成')
  } catch (error: any) {
    ElMessage.error(error.message || '校验失败')
  } finally {
    checking.value = false
  }
}

const handleReset = () => {
  currentCheck.value = null
  activeTab.value = 'insurance'
}

const handleCreateRectification = async () => {
  try {
    await ElMessageBox.confirm('确认创建整改记录？', '创建整改', {
      confirmButtonText: '确认创建',
      cancelButtonText: '取消',
      type: 'warning'
    })
    if (props.vehicle && currentCheck.value) {
      await createRectificationApi(props.vehicle.id, {
        checkId: currentCheck.value.id,
        rectificationType: 5,
        rectificationContent: '合规校验不通过，需整改',
        rectificationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      ElMessage.success('整改记录已创建')
      emit('success')
    }
  } catch { }
}

const handleMarkAbnormal = () => {
  ElMessage.info('异常标记功能开发中')
}

watch(() => props.modelValue, (val) => {
  if (val) {
    loadStandards()
    currentCheck.value = null
  }
})
</script>

<style lang="scss" scoped>
.vehicle-compliance-check-dialog {
  .vehicle-info-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(135deg, #ecf5ff, #f0f9eb);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;

    .vehicle-plate {
      font-size: 20px;
      font-weight: 700;
      color: #303133;
    }

    .vehicle-meta {
      display: flex;
      align-items: center;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        color: #606266;
      }

      .ml-16 {
        margin-left: 16px;
      }
    }
  }

  .check-type-selector {
    .section-title {
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #303133;
    }

    .type-radios {
      margin-bottom: 16px;
    }

    .standards-info {
      margin-bottom: 20px;
    }

    .start-check {
      display: flex;
      align-items: center;
      gap: 12px;

      .check-tip {
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .check-results {
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f5f7fa;
      border-radius: 8px;
      margin-bottom: 16px;

      .result-status {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .result-score {
        display: flex;
        align-items: baseline;
        gap: 4px;

        .score-label {
          font-size: 12px;
          color: #909399;
        }

        .score-value {
          font-size: 28px;
          font-weight: 700;
        }
      }
    }

    .check-tabs {
      margin-bottom: 16px;
    }

    .check-result-card {
      background: #fff;
      border: 1px solid #ebeef5;
      border-radius: 8px;
      padding: 16px;

      .result-item {
        display: flex;
        padding: 8px 12px;
        border-radius: 6px;
        margin-bottom: 4px;
        transition: all 0.3s;

        &.highlighted {
          background: #fdf6ec;
          border-left: 3px solid #e6a23c;
          font-weight: 500;
        }

        &.failed {
          background: #fef0f0;
          border-left: 3px solid #f56c6c;

          .item-value {
            color: #f56c6c;
            font-weight: 500;
          }
        }

        .item-label {
          min-width: 120px;
          color: #606266;
        }

        .item-value {
          flex: 1;
          color: #303133;
        }
      }

      .empty-result {
        text-align: center;
        color: #c0c4cc;
        padding: 20px;
      }
    }

    .abnormal-summary {
      margin-bottom: 16px;

      .abnormal-list {
        margin-top: 8px;

        .abnormal-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #f56c6c;
          font-size: 13px;
          margin-bottom: 4px;
        }
      }
    }

    .result-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
  }
}
</style>
