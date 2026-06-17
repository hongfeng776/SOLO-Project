<template>
  <div class="order-batch-toolbar" v-if="visible">
    <div class="toolbar-content">
      <div class="selected-info">
        <el-icon><Check /></el-icon>
        <span>已选择 <em>{{ selectedCount }}</em> 条订单</span>
      </div>
      <div class="toolbar-actions">
        <el-button
          v-if="canConfirmFulfill"
          type="success"
          class="batch-btn-hover"
          :loading="confirmLoading"
          :disabled="selectedCount === 0"
          @click="handleBatchConfirmFulfill"
        >
          <el-icon><CircleCheck /></el-icon>
          批量确认履约
        </el-button>
        <el-button
          v-if="canMarkAbnormal"
          type="warning"
          class="batch-btn-hover"
          :loading="abnormalLoading"
          :disabled="selectedCount === 0"
          @click="handleBatchMarkAbnormal"
        >
          <el-icon><Warning /></el-icon>
          批量标记异常
        </el-button>
        <el-button
          v-if="canArchive"
          type="info"
          class="batch-btn-hover"
          :loading="archiveLoading"
          :disabled="selectedCount === 0"
          @click="handleBatchArchive"
        >
          <el-icon><FolderOpened /></el-icon>
          批量归档
        </el-button>
        <el-button @click="handleClearSelection">
          <el-icon><Close /></el-icon>
          取消选择
        </el-button>
      </div>
    </div>

    <el-dialog
      v-model="abnormalDialogVisible"
      title="批量标记异常"
      width="500px"
      @close="abnormalReason = ''"
    >
      <el-form :model="abnormalForm" :rules="abnormalRules" ref="abnormalFormRef">
        <el-alert
          :title="`将为 ${selectedCount} 条订单标记异常，请填写异常原因`"
          type="warning"
          show-icon
          class="mb-20"
        />
        <el-form-item label="异常原因" prop="reason">
          <el-input
            v-model="abnormalForm.reason"
            type="textarea"
            :rows="4"
            class="input-glow-focus"
            placeholder="请详细描述异常原因（必填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="abnormalDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="abnormalLoading" @click="submitAbnormal">确认标记</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, CircleCheck, Warning, FolderOpened, Close } from '@element-plus/icons-vue'
import {
  batchConfirmFulfill,
  batchMarkAbnormal,
  batchArchive
} from '@/api/order'
import { useUserStore } from '@/store/modules/user'

const props = defineProps({
  selectedCount: {
    type: Number,
    default: 0
  },
  selectedIds: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['success', 'clear-selection'])

const userStore = useUserStore()

const confirmLoading = ref(false)
const abnormalLoading = ref(false)
const archiveLoading = ref(false)
const abnormalDialogVisible = ref(false)
const abnormalFormRef = ref(null)
const abnormalReason = ref('')

const abnormalForm = reactive({
  reason: ''
})

const abnormalRules = {
  reason: [
    { required: true, message: '请输入异常原因', trigger: 'blur' },
    { min: 5, message: '异常原因至少5个字符', trigger: 'blur' }
  ]
}

const visible = computed(() => props.selectedCount > 0)

const userRoles = computed(() => userStore.roles || [])

const canConfirmFulfill = computed(() => {
  return ['operator', 'risk', 'admin'].some(role => userRoles.value.includes(role))
})

const canMarkAbnormal = computed(() => {
  return ['risk', 'admin'].some(role => userRoles.value.includes(role))
})

const canArchive = computed(() => {
  return userRoles.value.includes('admin')
})

const handleBatchConfirmFulfill = async () => {
  try {
    await ElMessageBox.confirm(
      `确认将选中的 ${props.selectedCount} 条订单标记为已履约吗？`,
      '确认批量履约',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  confirmLoading.value = true
  try {
    await batchConfirmFulfill(props.selectedIds)
    ElMessage.success(`成功确认 ${props.selectedCount} 条订单履约`)
    emit('success', 'confirm')
    emit('clear-selection')
  } catch (err) {
    ElMessage.error(err.message || '批量确认履约失败')
  } finally {
    confirmLoading.value = false
  }
}

const handleBatchMarkAbnormal = () => {
  abnormalForm.reason = ''
  abnormalDialogVisible.value = true
}

const submitAbnormal = async () => {
  if (!abnormalFormRef.value) return
  try {
    await abnormalFormRef.value.validate()
  } catch {
    ElMessage.warning('请检查表单填写')
    return
  }

  abnormalLoading.value = true
  try {
    await batchMarkAbnormal(props.selectedIds, abnormalForm.reason)
    ElMessage.success(`成功标记 ${props.selectedCount} 条订单为异常`)
    abnormalDialogVisible.value = false
    emit('success', 'abnormal')
    emit('clear-selection')
  } catch (err) {
    ElMessage.error(err.message || '批量标记异常失败')
  } finally {
    abnormalLoading.value = false
  }
}

const handleBatchArchive = async () => {
  try {
    await ElMessageBox.confirm(
      `确认将选中的 ${props.selectedCount} 条订单归档吗？归档后订单将不再显示在正常列表中。`,
      '确认批量归档',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  archiveLoading.value = true
  try {
    await batchArchive(props.selectedIds)
    ElMessage.success(`成功归档 ${props.selectedCount} 条订单`)
    emit('success', 'archive')
    emit('clear-selection')
  } catch (err) {
    ElMessage.error(err.message || '批量归档失败')
  } finally {
    archiveLoading.value = false
  }
}

const handleClearSelection = () => {
  emit('clear-selection')
}
</script>

<style lang="scss" scoped>
.order-batch-toolbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  .toolbar-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;

    .selected-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #606266;
      font-size: 14px;

      em {
        color: #409eff;
        font-style: normal;
        font-weight: 600;
        margin: 0 4px;
      }
    }

    .toolbar-actions {
      display: flex;
      gap: 12px;
    }
  }
}
</style>
