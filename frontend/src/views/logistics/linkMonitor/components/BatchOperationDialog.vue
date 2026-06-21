<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="600px"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    class="batch-operation-dialog"
  >
    <el-alert
      :title="`即将对选中的 ${selectedIds.length} 条记录执行 ${operationLabel} 操作`"
      type="warning"
      :closable="false"
      show-icon
      class="alert-tip"
    />

    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      class="operation-form"
    >
      <el-form-item
        v-if="operationType === 'mark_abnormal'"
        label="异常类型"
        prop="abnormal_type"
      >
        <el-select v-model="formData.abnormal_type" placeholder="请选择异常类型" style="width: 100%;">
          <el-option
            v-for="(item, key) in AbnormalDetectionTypeMap"
            :key="key"
            :label="item.label"
            :value="key"
          />
        </el-select>
      </el-form-item>

      <el-form-item
        v-if="operationType === 'mark_abnormal'"
        label="异常描述"
        prop="abnormal_desc"
      >
        <el-input
          v-model="formData.abnormal_desc"
          type="textarea"
          :rows="3"
          placeholder="请输入异常描述..."
        />
      </el-form-item>

      <el-form-item
        v-if="operationType === 'launch_verify'"
        label="核查原因"
        prop="verify_reason"
      >
        <el-input
          v-model="formData.verify_reason"
          type="textarea"
          :rows="3"
          placeholder="请输入核查原因..."
        />
      </el-form-item>

      <el-form-item label="操作备注">
        <el-input
          v-model="formData.remark"
          placeholder="请输入操作备注（选填）"
        />
      </el-form-item>
    </el-form>

    <el-divider content-position="left">
      <span class="selected-title">已选记录（{{ selectedIds.length }} 条）</span>
    </el-divider>

    <div class="selected-list">
      <el-scrollbar height="150px">
        <el-table
          :data="selectedList"
          size="small"
          border
          stripe
        >
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="logistics_no" label="物流单号" width="150" />
          <el-table-column prop="shipment_no" label="发货单号" width="150" />
          <el-table-column label="最新状态" width="100">
            <template #default="{ row }">
              <el-tag
                v-if="row.latest_track"
                :type="TrackStatusMap[row.latest_track.track_status]?.type || 'info'"
                size="small"
              >
                {{ TrackStatusMap[row.latest_track.track_status]?.label || '未知' }}
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
      </el-scrollbar>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        @click="handleSubmit"
        :loading="submitting"
      >
        确认执行
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  batchMarkAbnormal,
  batchLaunchVerify,
  AbnormalDetectionTypeMap,
  TrackStatusMap,
  BatchOperationType,
  BatchOperationTypeMap,
  type ShipmentListItem,
} from '@/api/logisticsLinkBatch'

const props = defineProps<{
  visible: boolean
  operationType: string
  selectedIds: number[]
  selectedList?: ShipmentListItem[]
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}>()

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const formRef = ref<FormInstance>()
const submitting = ref(false)

const formData = reactive({
  abnormal_type: '',
  abnormal_desc: '',
  verify_reason: '',
  remark: '',
})

const formRules: FormRules = {
  abnormal_type: [
    { required: true, message: '请选择异常类型', trigger: 'change' },
  ],
  abnormal_desc: [
    { required: true, message: '请输入异常描述', trigger: 'blur' },
    { min: 5, message: '描述至少5个字符', trigger: 'blur' },
  ],
  verify_reason: [
    { required: true, message: '请输入核查原因', trigger: 'blur' },
    { min: 5, message: '原因至少5个字符', trigger: 'blur' },
  ],
}

const selectedList = computed(() => props.selectedList || [])

const operationLabel = computed(() => {
  return BatchOperationTypeMap[props.operationType as keyof typeof BatchOperationTypeMap]?.label || '批量操作'
})

const dialogTitle = computed(() => {
  return `批量${operationLabel.value}`
})

const handleSubmit = async () => {
  if (!formRef.value) return
  if (props.selectedIds.length === 0) {
    ElMessage.warning('请选择要操作的记录')
    return
  }

  try {
    await formRef.value.validate()
    submitting.value = true

    let res: any

    if (props.operationType === BatchOperationType.MARK_ABNORMAL) {
      res = await batchMarkAbnormal(
        props.selectedIds,
        formData.abnormal_type,
        formData.abnormal_desc
      )
    } else if (props.operationType === BatchOperationType.LAUNCH_VERIFY) {
      res = await batchLaunchVerify(
        props.selectedIds,
        formData.verify_reason
      )
    }

    if (res && res.code === 200) {
      const { success, failed, total } = res.data
      ElMessage.success(`操作完成：共${total}条，成功${success}条，失败${failed}条`)
      emit('success')
      handleClose()
    }
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || '操作失败')
    }
  } finally {
    submitting.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
}

watch(() => props.visible, (val) => {
  if (!val) {
    formData.abnormal_type = ''
    formData.abnormal_desc = ''
    formData.verify_reason = ''
    formData.remark = ''
  }
})
</script>

<style scoped lang="scss">
.batch-operation-dialog {
  .alert-tip {
    margin-bottom: 20px;
  }

  .operation-form {
    padding: 0 10px;
  }

  .selected-title {
    font-size: 14px;
    font-weight: 600;
  }

  .selected-list {
    margin-top: 10px;
  }
}
</style>
