<template>
  <div class="user-batch-toolbar" v-show="selectedCount > 0">
    <div class="batch-info">
      <span class="selected-count">{{ selectedCount }}</span>
      <span class="text">已选中用户</span>
      <span v-if="hasVIP" class="warning-info">
        <el-icon><Warning /></el-icon>
        包含VIP用户，需管理员权限
      </span>
    </div>
    <div class="batch-actions">
      <el-button
        type="primary"
        :icon="Edit"
        :loading="loadingAction === 'updateLevel'"
        @click="handleUpdateLevel"
      >
        <span v-if="loadingAction === 'updateLevel'" class="btn-loading"></span>
        调整等级
      </el-button>
      <el-button
        type="success"
        :icon="CollectionTag"
        :loading="loadingAction === 'updateTags'"
        @click="handleUpdateTags"
      >
        <span v-if="loadingAction === 'updateTags'" class="btn-loading"></span>
        调整标签
      </el-button>
      <el-button
        type="warning"
        :icon="Lock"
        :loading="loadingAction === 'freeze'"
        @click="handleFreeze"
      >
        <span v-if="loadingAction === 'freeze'" class="btn-loading"></span>
        批量冻结
      </el-button>
      <el-button
        type="info"
        :icon="Unlock"
        :loading="loadingAction === 'unfreeze'"
        @click="handleUnfreeze"
      >
        <span v-if="loadingAction === 'unfreeze'" class="btn-loading"></span>
        批量解冻
      </el-button>
      <el-button
        type="danger"
        :icon="Delete"
        :loading="loadingAction === 'delete'"
        @click="handleDelete"
      >
        <span v-if="loadingAction === 'delete'" class="btn-loading"></span>
        批量删除
      </el-button>
      <el-button :icon="Close" @click="$emit('clear')">
        取消选择
      </el-button>
    </div>

    <el-dialog
      v-model="freezeDialogVisible"
      title="批量冻结用户"
      width="420px"
    >
      <el-alert
        v-if="hasVIP"
        type="warning"
        show-icon
        :closable="false"
        style="margin-bottom: 16px;"
      >
        选中用户中包含VIP用户，需要管理员权限才能操作
      </el-alert>
      <el-form label-width="80px">
        <el-form-item label="冻结原因">
          <el-input
            v-model="freezeReason"
            type="textarea"
            :rows="3"
            placeholder="请输入冻结原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="freezeDialogVisible = false">取消</el-button>
        <el-button type="warning" @click="confirmFreeze">确认冻结</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="levelDialogVisible"
      title="批量调整用户等级"
      width="420px"
    >
      <el-alert
        v-if="hasVIP"
        type="warning"
        show-icon
        :closable="false"
        style="margin-bottom: 16px;"
      >
        选中用户中包含VIP用户，需要管理员权限才能操作
      </el-alert>
      <el-form label-width="80px">
        <el-form-item label="目标等级">
          <el-select v-model="targetLevel" style="width: 100%;">
            <el-option
              v-for="item in userLevelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="levelDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmUpdateLevel">确认调整</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="tagDialogVisible"
      title="批量调整用户标签"
      width="420px"
    >
      <el-form label-width="80px">
        <el-form-item label="用户标签">
          <el-select
            v-model="targetTags"
            multiple
            filterable
            style="width: 100%;"
            placeholder="请选择标签"
          >
            <el-option
              v-for="tag in userTagOptions"
              :key="tag.value"
              :label="tag.label"
              :value="tag.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作方式">
          <el-radio-group v-model="tagAction">
            <el-radio value="replace">替换</el-radio>
            <el-radio value="append">追加</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tagDialogVisible = false">取消</el-button>
        <el-button type="success" @click="confirmUpdateTags">确认调整</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Edit,
  CollectionTag,
  Lock,
  Unlock,
  Delete,
  Close,
  Warning
} from '@element-plus/icons-vue'
import { UserLevelEnum, UserTagOptions, getEnumOptions } from '@/utils/enums'
import {
  batchFreezeUser,
  batchUnfreezeUser,
  batchUpdateUserInfo,
  batchDeleteUser
} from '@/api/user'

const props = defineProps({
  selectedIds: {
    type: Array,
    default: () => []
  },
  selectedRows: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['success', 'clear'])

const selectedCount = computed(() => props.selectedIds.length)
const hasVIP = computed(() => props.selectedRows.some(r => r.userLevel === 3))

const loadingAction = ref('')
const freezeDialogVisible = ref(false)
const freezeReason = ref('')
const levelDialogVisible = ref(false)
const targetLevel = ref(1)
const tagDialogVisible = ref(false)
const targetTags = ref([])
const tagAction = ref('replace')

const userLevelOptions = getEnumOptions(UserLevelEnum)
const userTagOptions = UserTagOptions

const checkVIPPermission = () => {
  if (hasVIP.value) {
    ElMessage.warning('VIP用户操作需要管理员权限，请联系管理员')
    return false
  }
  return true
}

const handleFreeze = () => {
  if (!checkVIPPermission()) return
  freezeReason.value = ''
  freezeDialogVisible.value = true
}

const confirmFreeze = async () => {
  if (!freezeReason.value.trim()) {
    ElMessage.warning('请输入冻结原因')
    return
  }
  loadingAction.value = 'freeze'
  try {
    await batchFreezeUser(props.selectedIds, freezeReason.value)
    ElMessage.success('批量冻结成功')
    emit('success')
    emit('clear')
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    loadingAction.value = ''
    freezeDialogVisible.value = false
  }
}

const handleUnfreeze = async () => {
  if (!checkVIPPermission()) return
  try {
    await ElMessageBox.confirm(
      `确定要批量解冻选中的 ${selectedCount.value} 个用户吗？`,
      '提示',
      { type: 'warning' }
    )
  } catch {
    return
  }
  loadingAction.value = 'unfreeze'
  try {
    await batchUnfreezeUser(props.selectedIds)
    ElMessage.success('批量解冻成功')
    emit('success')
    emit('clear')
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    loadingAction.value = ''
  }
}

const handleDelete = async () => {
  if (!checkVIPPermission()) return
  try {
    await ElMessageBox.confirm(
      `确定要批量删除选中的 ${selectedCount.value} 个用户吗？此操作不可恢复！`,
      '警告',
      { type: 'error' }
    )
  } catch {
    return
  }
  loadingAction.value = 'delete'
  try {
    await batchDeleteUser(props.selectedIds)
    ElMessage.success('批量删除成功')
    emit('success')
    emit('clear')
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    loadingAction.value = ''
  }
}

const handleUpdateLevel = () => {
  if (!checkVIPPermission()) return
  targetLevel.value = 1
  levelDialogVisible.value = true
}

const confirmUpdateLevel = async () => {
  loadingAction.value = 'updateLevel'
  try {
    await batchUpdateUserInfo(props.selectedIds, { userLevel: targetLevel.value })
    ElMessage.success('批量调整等级成功')
    emit('success')
    emit('clear')
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    loadingAction.value = ''
    levelDialogVisible.value = false
  }
}

const handleUpdateTags = () => {
  targetTags.value = []
  tagAction.value = 'replace'
  tagDialogVisible.value = true
}

const confirmUpdateTags = async () => {
  loadingAction.value = 'updateTags'
  try {
    let updateTags = targetTags.value
    if (tagAction.value === 'append') {
      const allTags = new Set()
      props.selectedRows.forEach(row => {
        let rowTags = []
        try {
          rowTags = typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || [])
        } catch (e) {}
        rowTags.forEach(t => allTags.add(t))
      })
      targetTags.value.forEach(t => allTags.add(t))
      updateTags = Array.from(allTags)
    }
    await batchUpdateUserInfo(props.selectedIds, { tags: updateTags })
    ElMessage.success('批量调整标签成功')
    emit('success')
    emit('clear')
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    loadingAction.value = ''
    tagDialogVisible.value = false
  }
}
</script>
