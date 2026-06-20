<template>
  <Transition name="slide-fade">
    <div class="batch-toolbar" v-if="selectedIds.length > 0">
      <div class="batch-info">
        <el-icon :size="20" color="#1890ff"><Tickets /></el-icon>
        <span>
          已选择 <span class="batch-count">{{ selectedIds.length }}</span> 家门店
          <el-tag size="small" type="info" effect="plain" style="margin-left: 8px;">
            {{ hasOverseas ? '含海外酒店' : '同类型操作' }}
          </el-tag>
          <el-tag v-if="needCrossBorder" size="small" type="warning" effect="dark" style="margin-left: 8px;">
            需跨境权限
          </el-tag>
        </span>
      </div>
      <div class="batch-actions">
        <el-tooltip content="批量更新公示信息">
          <el-button
            type="primary"
            size="small"
            :icon="EditPen"
            :loading="actionLoading === 'update_info'"
            :disabled="needCrossBorder && !canCrossBorder"
            v-ripple
            @click="handleBatchOperation('update_info')"
          >
            更新公示信息
          </el-button>
        </el-tooltip>

        <el-tooltip content="批量调整展示权重">
          <el-button
            size="small"
            :icon="TrendCharts"
            :loading="actionLoading === 'adjust_weight'"
            :disabled="needCrossBorder && !canCrossBorder"
            v-ripple
            @click="openAdjustWeight"
          >
            调整权重
          </el-button>
        </el-tooltip>

        <el-tooltip content="批量恢复上架">
          <el-button
            type="success"
            size="small"
            :icon="Upload"
            :loading="actionLoading === 'on_shelf'"
            :disabled="needCrossBorder && !canCrossBorder"
            v-ripple
            @click="handleBatchOperation('on_shelf')"
          >
            上架
          </el-button>
        </el-tooltip>

        <el-tooltip content="批量标记整改">
          <el-button
            type="warning"
            size="small"
            :icon="Warning"
            :loading="actionLoading === 'rectification'"
            :disabled="needCrossBorder && !canCrossBorder"
            v-ripple
            @click="handleBatchOperation('rectification')"
          >
            整改
          </el-button>
        </el-tooltip>

        <el-tooltip content="批量下架违规门店">
          <el-button
            type="danger"
            size="small"
            :icon="Download"
            :loading="actionLoading === 'off_shelf'"
            :disabled="needCrossBorder && !canCrossBorder"
            v-ripple
            @click="handleBatchOperation('off_shelf')"
          >
            下架
          </el-button>
        </el-tooltip>

        <el-divider direction="vertical" />

        <el-button size="small" :icon="Close" @click="handleClear">
          取消
        </el-button>
      </div>

      <el-dialog
        v-model="weightDialog.visible"
        title="批量调整展示权重"
        width="480px"
        append-to-body
      >
        <el-form label-width="100px">
          <el-form-item label="目标权重">
            <el-slider
              v-model="weightDialog.weight"
              :min="0"
              :max="100"
              show-input
              :marks="{ 0: '0', 25: '25', 50: '50', 75: '75', 100: '100' }"
            />
            <div style="font-size: 12px; color: #909399; margin-top: 4px;">
              提示：权重越高前台展示越靠前，0-100
            </div>
          </el-form-item>
          <el-form-item label="调整原因" required>
            <el-input
              v-model="weightDialog.reason"
              type="textarea"
              :rows="2"
              placeholder="请输入调整原因"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="weightDialog.visible = false">取消</el-button>
          <el-button type="primary" v-ripple @click="confirmAdjustWeight">
            确认调整
          </el-button>
        </template>
      </el-dialog>

      <el-dialog
        v-model="infoDialog.visible"
        title="批量更新公示信息"
        width="520px"
        append-to-body
      >
        <el-form label-width="100px">
          <el-form-item label="公示通知">
            <el-input
              v-model="infoDialog.notice"
              type="textarea"
              :rows="3"
              placeholder="请输入要更新的公示信息（同步至前台展示）"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="变更原因" required>
            <el-input
              v-model="infoDialog.reason"
              type="textarea"
              :rows="2"
              placeholder="请输入变更原因"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="infoDialog.visible = false">取消</el-button>
          <el-button type="primary" v-ripple @click="confirmUpdateInfo">
            确认更新
          </el-button>
        </template>
      </el-dialog>
    </div>
  </Transition>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  EditPen,
  TrendCharts,
  Upload,
  Warning,
  Download,
  Close,
  Tickets
} from '@element-plus/icons-vue'
import vRipple from '@/utils/ripple'
import { batchHotelOperation, checkHotelPermission } from '@/api/hotel'

const props = defineProps({
  selectedIds: {
    type: Array,
    default: () => []
  },
  selectedStores: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['clear', 'success'])

const actionLoading = ref('')
const canCrossBorder = ref(false)

const hasOverseas = computed(() =>
  props.selectedStores.some(s => s.hotelType === 'overseas')
)

const needCrossBorder = computed(() => hasOverseas.value)

watch(
  () => props.selectedIds,
  async (val) => {
    if (val.length > 0 && hasOverseas.value) {
      try {
        const res = await checkHotelPermission('cross_border')
        canCrossBorder.value = res.data?.allowed || false
      } catch (e) {
        canCrossBorder.value = false
      }
    }
  },
  { immediate: true }
)

const weightDialog = reactive({
  visible: false,
  weight: 50,
  reason: ''
})

const infoDialog = reactive({
  visible: false,
  notice: '',
  reason: ''
})

const openAdjustWeight = () => {
  weightDialog.visible = true
  weightDialog.weight = 50
  weightDialog.reason = ''
}

const confirmAdjustWeight = async () => {
  if (!weightDialog.reason.trim()) {
    ElMessage.warning('请输入调整原因')
    return
  }
  await doBatchOperation('adjust_weight', {
    displayWeight: weightDialog.weight,
    reason: weightDialog.reason
  })
  weightDialog.visible = false
}

const handleBatchOperation = async (operation) => {
  if (operation === 'update_info') {
    infoDialog.visible = true
    infoDialog.notice = ''
    infoDialog.reason = ''
    return
  }

  let confirmMsg = ''
  switch (operation) {
    case 'on_shelf':
      confirmMsg = `确认批量上架选中的 ${props.selectedIds.length} 家门店？`
      break
    case 'off_shelf':
      confirmMsg = `确认批量下架选中的 ${props.selectedIds.length} 家门店？\n\n下架后将冻结对应订单预订功能。`
      break
    case 'rectification':
      confirmMsg = `确认将选中的 ${props.selectedIds.length} 家门店标记为整改中？\n\n整改期间将冻结对应订单预订功能。`
      break
  }

  const { value: reason } = await ElMessageBox.prompt(confirmMsg, '操作确认', {
    confirmButtonText: '确认执行',
    cancelButtonText: '取消',
    inputPlaceholder: '请输入操作原因（可选）',
    inputValidator: (v) => true,
    type: operation === 'off_shelf' || operation === 'rectification' ? 'warning' : 'info'
  }).catch(() => ({ value: null }))

  if (reason === null) return

  await doBatchOperation(operation, { reason: reason || '批量操作' })
}

const confirmUpdateInfo = async () => {
  if (!infoDialog.reason.trim()) {
    ElMessage.warning('请输入变更原因')
    return
  }
  await doBatchOperation('update_info', {
    description: infoDialog.notice,
    reason: infoDialog.reason
  })
  infoDialog.visible = false
}

const doBatchOperation = async (operation, data) => {
  if (needCrossBorder.value && !canCrossBorder.value) {
    ElMessage.error('无跨境酒店运营权限，无法执行包含海外酒店的批量操作')
    return
  }

  actionLoading.value = operation
  try {
    const res = await batchHotelOperation({
      ids: props.selectedIds,
      operation,
      data
    })
    const result = res.data || {}

    let msg = `批量操作完成：成功 ${result.success} 个`
    if (result.failed > 0) {
      msg += `，失败 ${result.failed} 个`
    }
    if (result.failed > 0 && result.failures) {
      const failedNames = result.failures.slice(0, 5).map(f => `${f.name}(ID:${f.id})`).join('、')
      msg += `\n失败项：${failedNames}${result.failures.length > 5 ? '...' : ''}`
    }

    if (result.failed === 0) {
      ElMessage.success(msg)
    } else if (result.success > 0) {
      ElMessage.warning(msg)
    } else {
      ElMessage.error(msg)
    }

    emit('success', result)
    emit('clear')
  } catch (e) {
    // 错误处理
  } finally {
    actionLoading.value = ''
  }
}

const handleClear = () => {
  emit('clear')
}
</script>

<style lang="scss" scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.25s ease-in;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
