<template>
  <div v-if="selectedIds.length > 0" class="scenic-spot-ops batch-toolbar">
    <div class="batch-info">
      <el-icon style="color: #1890ff; font-size: 18px;"><Files /></el-icon>
      <span>
        已选中 <span class="batch-count">{{ selectedIds.length }}</span> 个景点
        <template v-if="selectedSpots.length > 0">
          （{{ getTypeSummary() }}）
        </template>
      </span>
    </div>
    <div class="batch-actions">
      <el-button
        v-for="op in availableOperations"
        :key="op.value"
        :type="op.color ? '' : 'primary'"
        :style="op.color ? { borderColor: op.color, color: op.color, background: 'transparent' } : {}"
        @click="handleBatchOp(op.value)"
        v-ripple
      >
        <el-icon><component :is="op.icon" /></el-icon>
        {{ op.label }}
      </el-button>
      <el-button link type="danger" @click="$emit('clear')">
        取消选择
      </el-button>
    </div>

    <el-dialog
      v-model="opDialogVisible"
      :title="currentOperation?.label"
      width="520px"
      class="scenic-spot-ops focus-glow"
      @close="resetOpForm"
    >
      <template v-if="currentOperation?.value === 'update_opening'">
        <el-form :model="opForm" label-width="110px">
          <el-form-item label="营业时间" required>
            <el-input
              v-model="opForm.openingHours"
              placeholder="例如：08:00-18:00（周一至周日）"
              style="width: 100%;"
            />
          </el-form-item>
          <el-form-item label="限流规则">
            <el-input
              v-model="opForm.limitRule"
              type="textarea"
              :rows="2"
              placeholder="选填，批量更新限流规则"
              style="width: 100%;"
            />
          </el-form-item>
          <el-form-item label="生效区域">
            <el-select
              v-model="opForm.regionScope"
              multiple
              collapse-tags
              placeholder="选择生效省份/城市（不选则对所有选中景点生效）"
              style="width: 100%;"
            >
              <el-option
                v-for="r in availableRegions"
                :key="r"
                :label="r"
                :value="r"
              />
            </el-select>
            <div style="font-size: 12px; color: #909399; margin-top: 4px;">
              仅对选中景点中位于该区域的生效
            </div>
          </el-form-item>
        </el-form>
      </template>

      <template v-else-if="currentOperation?.value === 'adjust_weight'">
        <el-form :model="opForm" label-width="110px">
          <el-form-item label="展示权重" required>
            <el-slider
              v-model="opForm.displayWeight"
              :min="0"
              :max="100"
              show-input
              style="width: 100%;"
            />
          </el-form-item>
          <el-form-item label="调整方式">
            <el-radio-group v-model="opForm.weightMode">
              <el-radio value="set">统一设置为</el-radio>
              <el-radio value="increase">统一增加</el-radio>
              <el-radio value="decrease">统一减少</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </template>

      <template v-else-if="currentOperation?.value === 'off_shelf' || currentOperation?.value === 'on_shelf'">
        <el-form :model="opForm" label-width="110px">
          <el-alert
            v-if="currentOperation?.value === 'off_shelf'"
            type="warning"
            show-icon
            :closable="false"
            title="下架提醒"
            description="批量下架后，对应景点票务将自动暂停售卖，并推送用户通知。"
            style="margin-bottom: 16px;"
          />
          <el-alert
            v-else
            type="success"
            show-icon
            :closable="false"
            title="上架提醒"
            description="只有资质合规且处于营业状态的景点才能上架成功。"
            style="margin-bottom: 16px;"
          />
          <el-form-item label="操作原因">
            <el-input
              v-model="opForm.reason"
              type="textarea"
              :rows="2"
              placeholder="请输入操作原因（将记录到日志）"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </template>

      <template v-else-if="currentOperation?.value === 'update_performance'">
        <el-form :model="opForm" label-width="110px">
          <el-alert
            v-if="performanceInvalidCount > 0"
            type="warning"
            show-icon
            :closable="false"
            title="权限提示"
            :description="`选中景点中有 ${performanceInvalidCount} 个非展演类景点，将被自动跳过。`"
            style="margin-bottom: 16px;"
          />
          <el-form-item label="场次安排" required>
            <el-input
              v-model="opForm.performanceSchedule"
              type="textarea"
              :rows="3"
              placeholder="请描述统一的演出场次安排"
              style="width: 100%;"
            />
          </el-form-item>
          <el-form-item label="演出许可校验">
            <el-switch v-model="opForm.checkLicense" />
            <span style="margin-left: 8px; color: #909399; font-size: 12px;">
              开启后仅对演出许可有效的景点生效
            </span>
          </el-form-item>
        </el-form>
      </template>

      <template #footer>
        <el-button @click="opDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="confirmBatchOp"
          v-ripple
        >
          确认执行
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Files, Clock, TrendCharts, Download, Upload, Tickets
} from '@element-plus/icons-vue'
import { batchScenicSpotOperation } from '@/api/scenicSpot'
import { ScenicSpotBatchOperationEnum } from '@/utils/enums'

const props = defineProps({
  selectedIds: { type: Array, default: () => [] },
  selectedSpots: { type: Array, default: () => [] },
  activeType: { type: String, default: 'natural' }
})

const emit = defineEmits(['clear', 'success'])

const opDialogVisible = ref(false)
const currentOperation = ref(null)
const submitting = ref(false)
const opForm = reactive({
  openingHours: '',
  limitRule: '',
  regionScope: [],
  displayWeight: 50,
  weightMode: 'set',
  reason: '',
  performanceSchedule: '',
  checkLicense: true
})

const availableOperations = computed(() => {
  const ops = Object.values(ScenicSpotBatchOperationEnum)
  return ops.filter(op => {
    if (op.performanceOnly && props.activeType !== 'performance') return false
    return true
  })
})

const availableRegions = computed(() => {
  const set = new Set()
  props.selectedSpots.forEach(s => {
    if (s.province) set.add(s.province)
    if (s.city) set.add(s.province + ' - ' + s.city)
  })
  return Array.from(set)
})

const performanceInvalidCount = computed(() => {
  return props.selectedSpots.filter(s => s.spotType !== 'performance').length
})

const getTypeSummary = () => {
  const groups = {}
  props.selectedSpots.forEach(s => {
    const t = s.spotType || 'unknown'
    groups[t] = (groups[t] || 0) + 1
  })
  const labels = {
    natural: '自然景区',
    cultural: '人文景点',
    theme: '主题乐园',
    performance: '特色展演'
  }
  return Object.entries(groups).map(([k, v]) => `${labels[k] || k} ${v}个`).join('、')
}

const resetOpForm = () => {
  Object.assign(opForm, {
    openingHours: '',
    limitRule: '',
    regionScope: [],
    displayWeight: 50,
    weightMode: 'set',
    reason: '',
    performanceSchedule: '',
    checkLicense: true
  })
  currentOperation.value = null
}

const handleBatchOp = async (opType) => {
  currentOperation.value = ScenicSpotBatchOperationEnum[opType] || Object.values(ScenicSpotBatchOperationEnum).find(o => o.value === opType)

  if (opType === 'off_shelf') {
    try {
      await ElMessageBox.confirm(
        `确定对选中的 ${props.selectedIds.length} 个景点执行批量下架操作吗？下架后票务将自动暂停。`,
        '批量下架确认',
        { type: 'warning' }
      )
    } catch (e) {
      return
    }
  }

  opDialogVisible.value = true
}

const confirmBatchOp = async () => {
  const op = currentOperation.value
  if (!op) return
  const data = {
    ids: props.selectedIds,
    operation: op.value,
    ...opForm
  }
  submitting.value = true
  try {
    await batchScenicSpotOperation(data)
    ElMessage.success('批量操作执行成功')
    opDialogVisible.value = false
    emit('success')
  } catch (err) {
    if (err?.response?.data?.message) {
      ElMessage.error(err.response.data.message)
    } else {
      ElMessage.error('批量操作执行失败')
    }
  } finally {
    submitting.value = false
  }
}
</script>
