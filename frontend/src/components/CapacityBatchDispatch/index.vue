<template>
  <el-dialog
    v-model="visible"
    title="批量运力调度"
    width="720px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="batch-dispatch">
      <el-alert
        title="调度说明"
        type="info"
        :closable="false"
        show-icon
        class="info-alert"
      >
        <template #default>
          <ul class="info-list">
            <li>批量调度指令仅对<strong class="text-success">空闲状态</strong>的司机生效</li>
            <li><strong class="text-danger">已接单司机</strong>将被自动规避，不会收到调度指令</li>
            <li>请根据实际运力缺口情况，谨慎选择调度范围和调度类型</li>
          </ul>
        </template>
      </el-alert>

      <el-tabs v-model="activeTab" class="dispatch-tabs">
        <el-tab-pane label="选择调度目标" name="target">
          <div class="tab-content">
            <div class="section">
              <div class="section-header">
                <span class="section-title">
                  <el-icon><Location /></el-icon>
                  目标区域
                </span>
                <div class="section-actions">
                  <el-button size="small" type="primary" link @click="selectAllAreas">
                    全选紧缺区域
                  </el-button>
                  <el-button size="small" link @click="clearAreas">清空</el-button>
                </div>
              </div>
              <div class="area-list">
                <div
                  v-for="area in abnormalAreas"
                  :key="area.id"
                  class="area-item"
                  :class="{
                    selected: selectedAreaIds.includes(area.id),
                    shortage: area.status === 'shortage',
                    surplus: area.status === 'surplus'
                  }"
                  @click="toggleArea(area.id)"
                >
                  <el-checkbox :model-value="selectedAreaIds.includes(area.id)" />
                  <div class="area-info">
                    <div class="area-name">
                      {{ area.district }}
                      <el-tag size="small" :type="area.status === 'shortage' ? 'danger' : 'info'">
                        {{ area.status === 'shortage' ? '紧缺' : '过剩' }}
                      </el-tag>
                    </div>
                    <div class="area-detail">
                      {{ area.city }} · 缺口{{ area.gap > 0 ? '+' : '' }}{{ area.gap }}人 ·
                      订单{{ area.orderCount }} · 在线{{ area.onlineCount }}
                    </div>
                  </div>
                  <div class="area-gap" :class="area.status">
                    {{ area.gap > 0 ? '+' : '' }}{{ area.gap }}
                  </div>
                </div>
                <el-empty v-if="abnormalAreas.length === 0" description="暂无异常区域" :image-size="60" />
              </div>
            </div>

            <div class="section">
              <div class="section-header">
                <span class="section-title">
                  <el-icon><Timer /></el-icon>
                  目标时段
                </span>
                <div class="section-actions">
                  <el-button size="small" type="primary" link @click="selectAllPeriods">
                    全选缺口时段
                  </el-button>
                  <el-button size="small" link @click="clearPeriods">清空</el-button>
                </div>
              </div>
              <div class="period-list">
                <div
                  v-for="period in abnormalPeriods"
                  :key="period.period"
                  class="period-item"
                  :class="{
                    selected: selectedPeriodIds.includes(period.period),
                    shortage: period.status === 'shortage',
                    saturated: period.status === 'saturated'
                  }"
                  @click="togglePeriod(period.period)"
                >
                  <el-checkbox :model-value="selectedPeriodIds.includes(period.period)" />
                  <div class="period-info">
                    <div class="period-name">{{ period.period }}</div>
                    <div class="period-detail">
                      订单{{ period.orderCount }} · 在线{{ period.onlineCount }} · 空闲{{ period.idleCount }}
                    </div>
                  </div>
                  <div class="period-gap" :class="period.status">
                    缺口 {{ period.gap }} 人
                  </div>
                </div>
                <el-empty v-if="abnormalPeriods.length === 0" description="暂无缺口时段" :image-size="60" />
              </div>
            </div>

            <div class="section">
              <div class="section-header">
                <span class="section-title">
                  <el-icon><City /></el-icon>
                  目标城市（可选）
                </span>
              </div>
              <el-select
                v-model="selectedCities"
                multiple
                filterable
                placeholder="选择目标城市，不选则按区域匹配"
                style="width: 100%"
              >
                <el-option
                  v-for="city in cityOptions"
                  :key="city"
                  :label="city"
                  :value="city"
                />
              </el-select>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="设置调度内容" name="config">
          <div class="tab-content">
            <el-form :model="dispatchForm" label-width="100px">
              <el-form-item label="调度类型" required>
                <el-radio-group v-model="dispatchForm.operationType">
                  <el-radio value="dispatch_task">
                    <el-icon><Promotion /></el-icon>
                    发布调度任务
                  </el-radio>
                  <el-radio value="online_reminder">
                    <el-icon><Bell /></el-icon>
                    推送上线提醒
                  </el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="调度消息">
                <el-input
                  v-model="dispatchForm.message"
                  type="textarea"
                  :rows="3"
                  :placeholder="dispatchForm.operationType === 'dispatch_task'
                    ? '请输入调度任务内容，如：请立即前往朝阳区望京区域接单'
                    : '请输入提醒内容，如：当前区域运力紧张，请尽快上线接单'"
                  maxlength="200"
                  show-word-limit
                />
              </el-form-item>

              <el-form-item label="快捷消息">
                <div class="quick-messages">
                  <el-tag
                    v-for="(msg, index) in quickMessages"
                    :key="index"
                    class="quick-tag"
                    effect="plain"
                    @click="applyQuickMessage(msg)"
                  >
                    {{ msg }}
                  </el-tag>
                </div>
              </el-form-item>
            </el-form>

            <div class="preview-section">
              <div class="preview-header">
                <el-icon><View /></el-icon>
                调度预览
              </div>
              <div class="preview-content">
                <div class="preview-row">
                  <span class="preview-label">调度类型：</span>
                  <span class="preview-value">
                    {{ dispatchForm.operationType === 'dispatch_task' ? '发布调度任务' : '推送上线提醒' }}
                  </span>
                </div>
                <div class="preview-row">
                  <span class="preview-label">目标区域：</span>
                  <span class="preview-value">
                    {{ selectedAreaIds.length > 0 ? `${selectedAreaIds.length}个区域` : '未选择' }}
                  </span>
                </div>
                <div class="preview-row">
                  <span class="preview-label">目标时段：</span>
                  <span class="preview-value">
                    {{ selectedPeriodIds.length > 0 ? `${selectedPeriodIds.length}个时段` : '未选择' }}
                  </span>
                </div>
                <div class="preview-row">
                  <span class="preview-label">目标城市：</span>
                  <span class="preview-value">
                    {{ selectedCities.length > 0 ? selectedCities.join('、') : '按区域匹配' }}
                  </span>
                </div>
                <div class="preview-row">
                  <span class="preview-label">预计覆盖：</span>
                  <span class="preview-value text-primary">
                    约 {{ estimatedCount }} 名空闲司机
                  </span>
                </div>
                <div class="preview-row">
                  <span class="preview-label">自动过滤：</span>
                  <span class="preview-value text-warning">
                    已接单司机将被自动规避
                  </span>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <div class="selection-summary" v-if="selectedAreaIds.length > 0 || selectedPeriodIds.length > 0">
        <el-icon class="info-icon"><InfoFilled /></el-icon>
        <span>
          已选择 <strong class="text-primary">{{ selectedAreaIds.length }}</strong> 个区域，
          <strong class="text-primary">{{ selectedPeriodIds.length }}</strong> 个时段
        </span>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        :loading="dispatching"
        :disabled="!canSubmit"
        @click="handleDispatch"
      >
        <el-icon><Promotion /></el-icon>
        确认调度
      </el-button>
    </template>

    <el-dialog
      v-model="resultVisible"
      title="调度结果"
      width="560px"
      :close-on-click-modal="false"
    >
      <div class="dispatch-result">
        <div class="result-stats">
          <div class="stat-item success">
            <div class="stat-icon"><el-icon><CircleCheck /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ dispatchResult?.successCount || 0 }}</div>
              <div class="stat-label">调度成功</div>
            </div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item skipped">
            <div class="stat-icon"><el-icon><Warning /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ dispatchResult?.skippedInOrder || 0 }}</div>
              <div class="stat-label">已接单（已规避）</div>
            </div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item failed">
            <div class="stat-icon"><el-icon><CircleClose /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ dispatchResult?.failedCount || 0 }}</div>
              <div class="stat-label">调度失败</div>
            </div>
          </div>
        </div>

        <div class="result-details" v-if="dispatchResult?.details?.length > 0">
          <div class="details-header">调度详情（前20条）</div>
          <el-table :data="dispatchResult.details.slice(0, 20)" size="small">
            <el-table-column prop="driverName" label="司机姓名" width="100" />
            <el-table-column prop="phone" label="手机号" width="130" />
            <el-table-column prop="city" label="城市" width="100" />
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="row.status === 'success' ? 'success' : 'danger'">
                  {{ row.status === 'success' ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="备注" />
          </el-table>
        </div>
      </div>

      <template #footer>
        <el-button @click="handleCloseAll">关闭</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Location,
  Timer,
  City,
  Promotion,
  Bell,
  View,
  InfoFilled,
  CircleCheck,
  Warning,
  CircleClose
} from '@element-plus/icons-vue'
import { batchDispatchApi, getCapacityStatusDetailApi } from '@/api/capacity'
import { CITY_OPTIONS } from '@/enums/capacity'
import type {
  AbnormalArea,
  AbnormalPeriod,
  BatchDispatchParams,
  DispatchResults
} from '@/types/capacity'

interface Props {
  modelValue: boolean
  selectedAreas?: string[]
  selectedPeriods?: string[]
  permission?: { canDispatch: boolean }
}

const props = withDefaults(defineProps<Props>(), {
  selectedAreas: () => [],
  selectedPeriods: () => [],
  permission: () => ({ canDispatch: false })
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const activeTab = ref('target')
const dispatching = ref(false)
const resultVisible = ref(false)
const dispatchResult = ref<DispatchResults | null>(null)

const abnormalAreas = ref<AbnormalArea[]>([])
const abnormalPeriods = ref<AbnormalPeriod[]>([])
const selectedAreaIds = ref<string[]>([])
const selectedPeriodIds = ref<string[]>([])
const selectedCities = ref<string[]>([])

const cityOptions = CITY_OPTIONS

const dispatchForm = reactive<BatchDispatchParams>({
  operationType: 'online_reminder',
  message: ''
})

const quickMessages = [
  '当前区域运力紧张，请尽快上线接单',
  '早高峰时段已到，建议您上线接单',
  '晚高峰来临，请及时上线准备接单',
  '检测到您所在区域订单量激增，请上线支援',
  '调度任务：请立即前往指定区域接单'
]

const canSubmit = computed(() => {
  return (selectedAreaIds.value.length > 0 || selectedPeriodIds.value.length > 0 || selectedCities.value.length > 0)
    && dispatchForm.operationType
    && props.permission.canDispatch
})

const estimatedCount = computed(() => {
  let count = 0
  selectedAreaIds.value.forEach(id => {
    const area = abnormalAreas.value.find(a => a.id === id)
    if (area) count += Math.max(0, area.gap)
  })
  selectedPeriodIds.value.forEach(period => {
    const p = abnormalPeriods.value.find(p => p.period === period)
    if (p) count += p.gap
  })
  return Math.min(count, 100)
})

const loadAbnormalData = async () => {
  try {
    const res = await getCapacityStatusDetailApi()
    abnormalAreas.value = res.data.abnormalAreas
    abnormalPeriods.value = res.data.abnormalPeriods
  } catch (e: any) {
    ElMessage.error(e.message || '获取异常数据失败')
  }
}

const toggleArea = (id: string) => {
  const index = selectedAreaIds.value.indexOf(id)
  if (index > -1) {
    selectedAreaIds.value.splice(index, 1)
  } else {
    selectedAreaIds.value.push(id)
  }
}

const togglePeriod = (period: string) => {
  const index = selectedPeriodIds.value.indexOf(period)
  if (index > -1) {
    selectedPeriodIds.value.splice(index, 1)
  } else {
    selectedPeriodIds.value.push(period)
  }
}

const selectAllAreas = () => {
  selectedAreaIds.value = abnormalAreas.value
    .filter(a => a.status === 'shortage')
    .map(a => a.id)
}

const clearAreas = () => {
  selectedAreaIds.value = []
}

const selectAllPeriods = () => {
  selectedPeriodIds.value = abnormalPeriods.value
    .filter(p => p.status === 'shortage')
    .map(p => p.period)
}

const clearPeriods = () => {
  selectedPeriodIds.value = []
}

const applyQuickMessage = (msg: string) => {
  dispatchForm.message = msg
}

const handleDispatch = async () => {
  if (!canSubmit.value) return

  dispatching.value = true
  try {
    const params: BatchDispatchParams = {
      operationType: dispatchForm.operationType,
      message: dispatchForm.message,
      areaIds: selectedAreaIds.value.length > 0 ? selectedAreaIds.value : undefined,
      periodIds: selectedPeriodIds.value.length > 0 ? selectedPeriodIds.value : undefined,
      targetCities: selectedCities.value.length > 0 ? selectedCities.value : undefined
    }

    const res = await batchDispatchApi(params)
    dispatchResult.value = res.data.results
    resultVisible.value = true

    ElMessage.success(`调度完成：成功${res.data.results.successCount}人，失败${res.data.results.failedCount}人`)
    emit('success')
  } catch (e: any) {
    ElMessage.error(e.message || '调度失败')
  } finally {
    dispatching.value = false
  }
}

const handleClose = () => {
  if (!dispatching.value) {
    visible.value = false
  }
}

const handleCloseAll = () => {
  resultVisible.value = false
  visible.value = false
  resetForm()
}

const resetForm = () => {
  activeTab.value = 'target'
  selectedAreaIds.value = []
  selectedPeriodIds.value = []
  selectedCities.value = []
  dispatchForm.operationType = 'online_reminder'
  dispatchForm.message = ''
  dispatchResult.value = null
}

watch(() => props.selectedAreas, (val) => {
  if (val?.length > 0) {
    selectedAreaIds.value = [...val]
  }
}, { immediate: true })

watch(() => props.selectedPeriods, (val) => {
  if (val?.length > 0) {
    selectedPeriodIds.value = [...val]
  }
}, { immediate: true })

watch(visible, (val) => {
  if (val) {
    loadAbnormalData()
  } else {
    resetForm()
  }
})
</script>

<style lang="scss" scoped>
.batch-dispatch {
  .info-alert {
    margin-bottom: 20px;

    .info-list {
      margin: 8px 0 0 0;
      padding-left: 20px;

      li {
        margin-bottom: 4px;
        font-size: 13px;
        color: #606266;
      }
    }
  }

  .dispatch-tabs {
    .tab-content {
      padding: 10px 0;
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
        margin-bottom: 12px;

        .section-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 15px;
          font-weight: 500;
          color: #303133;
        }

        .section-actions {
          display: flex;
          gap: 8px;
        }
      }
    }

    .area-list,
    .period-list {
      max-height: 240px;
      overflow-y: auto;
      border: 1px solid #ebeef5;
      border-radius: 8px;
      padding: 8px;
    }

    .area-item,
    .period-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid transparent;

      &:last-child {
        margin-bottom: 0;
      }

      &:hover {
        background: #f5f7fa;
      }

      &.selected {
        background: #ecf5ff;
        border-color: #409eff;

        &.shortage {
          background: #fef0f0;
          border-color: #f56c6c;
        }

        &.surplus {
          background: #f4f4f5;
          border-color: #909399;
        }

        &.saturated {
          background: #fdf6ec;
          border-color: #e6a23c;
        }
      }

      .area-info,
      .period-info {
        flex: 1;

        .area-name,
        .period-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #303133;
          margin-bottom: 4px;
        }

        .area-detail,
        .period-detail {
          font-size: 12px;
          color: #909399;
        }
      }

      .area-gap,
      .period-gap {
        font-size: 16px;
        font-weight: bold;

        &.shortage {
          color: #f56c6c;
        }

        &.surplus {
          color: #909399;
        }

        &.saturated {
          color: #e6a23c;
        }
      }
    }
  }

  .quick-messages {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .quick-tag {
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        transform: translateY(-1px);
      }
    }
  }

  .preview-section {
    margin-top: 24px;
    padding: 16px;
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
    border-radius: 8px;

    .preview-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 500;
      color: #303133;
      margin-bottom: 12px;
    }

    .preview-content {
      .preview-row {
        display: flex;
        margin-bottom: 8px;
        font-size: 13px;

        &:last-child {
          margin-bottom: 0;
        }

        .preview-label {
          color: #909399;
          min-width: 80px;
        }

        .preview-value {
          color: #303133;
          flex: 1;
        }
      }
    }
  }

  .selection-summary {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: #ecf5ff;
    border-radius: 8px;
    margin-top: 16px;

    .info-icon {
      color: #409eff;
      font-size: 18px;
    }

    span {
      font-size: 13px;
      color: #606266;
    }
  }
}

.dispatch-result {
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

        .stat-icon {
          background: #67c23a;
          color: #fff;
        }

        .stat-value {
          color: #67c23a;
        }
      }

      &.skipped {
        background: #fdf6ec;

        .stat-icon {
          background: #e6a23c;
          color: #fff;
        }

        .stat-value {
          color: #e6a23c;
        }
      }

      &.failed {
        background: #fef0f0;

        .stat-icon {
          background: #f56c6c;
          color: #fff;
        }

        .stat-value {
          color: #f56c6c;
        }
      }
    }

    .stat-divider {
      width: 1px;
      height: 60px;
      background: #ebeef5;
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

.text-success {
  color: #67c23a;
}

.text-danger {
  color: #f56c6c;
}

.text-warning {
  color: #e6a23c;
}

.text-primary {
  color: #409eff;
}
</style>
