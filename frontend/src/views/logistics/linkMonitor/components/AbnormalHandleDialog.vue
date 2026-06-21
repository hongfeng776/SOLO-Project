<template>
  <el-dialog
    v-model="dialogVisible"
    title="异常处理"
    width="900px"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    class="abnormal-handle-dialog"
    @open="handleOpen"
  >
    <el-tabs v-model="activeTab" class="abnormal-tabs">
      <el-tab-pane label="异常信息" name="abnormal">
        <div v-if="abnormalList.length === 0" class="empty-state">
          <el-empty description="暂无异常记录" />
        </div>
        <div v-else class="abnormal-list">
          <div
            v-for="abnormal in abnormalList"
            :key="abnormal.id"
            class="abnormal-card"
            :class="{ 'card-active': selectedAbnormalId === abnormal.id }"
            @click="selectAbnormal(abnormal)"
          >
            <div class="abnormal-header">
              <div class="abnormal-type">
                <el-tag :type="getAbnormalTypeTagType(abnormal.abnormal_type)" effect="dark" size="small">
                  {{ getAbnormalTypeName(abnormal.abnormal_type) }}
                </el-tag>
                <el-tag
                  :type="AlertLevelMap[abnormal.alert_level]?.type || 'info'"
                  size="small"
                  effect="light"
                >
                  {{ AlertLevelMap[abnormal.alert_level]?.label || '未知' }}
                </el-tag>
              </div>
              <div class="abnormal-status">
                <el-tag
                  :type="abnormal.is_processed === 1 ? 'success' : 'warning'"
                  effect="light"
                >
                  {{ abnormal.is_processed === 1 ? '已处理' : '待处理' }}
                </el-tag>
              </div>
            </div>
            <div class="abnormal-content">
              <p class="abnormal-desc">{{ abnormal.abnormal_desc }}</p>
              <div class="abnormal-meta">
                <span>检测时间：{{ formatDate(abnormal.detected_at) }}</span>
                <span>检测方式：{{ abnormal.detected_by === 'system_auto' ? '系统自动' : '人工标记' }}</span>
              </div>
              <div v-if="abnormal.suggestion" class="abnormal-suggestion">
                <el-icon><Tips /></el-icon>
                <span>处理建议：{{ abnormal.suggestion }}</span>
              </div>
            </div>
            <div v-if="abnormal.is_processed === 1" class="abnormal-processed">
              <el-divider content-position="left" style="margin: 12px 0;">
                <span class="processed-title">处理结果</span>
              </el-divider>
              <div class="processed-info">
                <p>处理方式：{{ getProcessTypeText(abnormal.process_result) }}</p>
                <p>处理说明：{{ abnormal.process_remark }}</p>
                <p>处理人：{{ abnormal.processed_by_name }}</p>
                <p>处理时间：{{ formatDate(abnormal.processed_at) }}</p>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="关联工单" name="workorder">
        <div v-if="workOrderList.length === 0" class="empty-state">
          <el-empty description="暂无工单记录" />
        </div>
        <div v-else class="work-order-list">
          <el-table :data="workOrderList" border stripe>
            <el-table-column prop="work_order_no" label="工单号" width="160" />
            <el-table-column prop="type" label="类型" width="120">
              <template #default="{ row }">
                <el-tag :type="WorkOrderTypeMap[row.type]?.type || 'info'" size="small">
                  {{ WorkOrderTypeMap[row.type]?.label || '未知' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
            <el-table-column prop="priority" label="优先级" width="100">
              <template #default="{ row }">
                <el-tag :type="WorkOrderPriorityMap[row.priority]?.type || 'info'" size="small">
                  {{ WorkOrderPriorityMap[row.priority]?.label || '未知' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="WorkOrderStatusMap[row.status]?.type || 'info'" size="small">
                  {{ WorkOrderStatusMap[row.status]?.label || '未知' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sla_expire_at" label="SLA到期时间" width="180">
              <template #default="{ row }">
                <span v-if="row.sla_expire_at" :class="{ 'sla-warning': isSlaExpiring(row.sla_expire_at) }">
                  {{ formatDate(row.sla_expire_at) }}
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column prop="resolution" label="处理结果" min-width="150" show-overflow-tooltip />
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="处理操作" name="handle" v-if="canHandle">
        <el-form
          ref="formRef"
          :model="handleForm"
          :rules="handleRules"
          label-width="120px"
          class="handle-form"
        >
          <el-form-item label="选择异常记录" prop="abnormal_log_id">
            <el-select v-model="handleForm.abnormal_log_id" placeholder="请选择要处理的异常" style="width: 100%;">
              <el-option
                v-for="abnormal in pendingAbnormalList"
                :key="abnormal.id"
                :label="`${getAbnormalTypeName(abnormal.abnormal_type)} - ${abnormal.abnormal_desc.substring(0, 30)}...`"
                :value="abnormal.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="处理方式" prop="process_type">
            <el-radio-group v-model="handleForm.process_type">
              <el-radio value="resolved">已解决</el-radio>
              <el-radio value="pending_confirm">待用户确认</el-radio>
              <el-radio value="escalated">已升级处理</el-radio>
              <el-radio value="false_alarm">误报解除</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="处理说明" prop="process_remark">
            <el-input
              v-model="handleForm.process_remark"
              type="textarea"
              :rows="4"
              placeholder="请输入处理说明..."
            />
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button
        v-if="canHandle && activeTab === 'handle'"
        type="primary"
        @click="submitHandle"
        :loading="submitting"
      >
        提交处理
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Tips } from '@element-plus/icons-vue'
import {
  processAbnormal,
  AlertLevelMap,
  AbnormalDetectionTypeMap,
  type AbnormalDetectionResult,
  type ProcessAbnormalParams,
} from '@/api/logisticsAbnormalMonitor'
import {
  WorkOrderTypeMap,
  WorkOrderPriorityMap,
  WorkOrderStatusMap,
  type WorkOrderItem,
} from '@/types/business'
import { daos } from '@/api'
import { formatDate } from '@/utils/date'

const props = defineProps<{
  visible: boolean
  shipmentId: number
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}>()

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const activeTab = ref('abnormal')
const formRef = ref<FormInstance>()
const submitting = ref(false)
const abnormalList = ref<any[]>([])
const workOrderList = ref<WorkOrderItem[]>([])
const selectedAbnormalId = ref<number | null>(null)

const handleForm = reactive<ProcessAbnormalParams>({
  abnormal_log_id: 0,
  process_type: '',
  process_remark: '',
})

const handleRules: FormRules = {
  abnormal_log_id: [{ required: true, message: '请选择异常记录', trigger: 'change' }],
  process_type: [{ required: true, message: '请选择处理方式', trigger: 'change' }],
  process_remark: [{ required: true, message: '请输入处理说明', trigger: 'blur' }],
}

const pendingAbnormalList = computed(() => {
  return abnormalList.value.filter(a => a.is_processed === 0)
})

const canHandle = computed(() => {
  return pendingAbnormalList.value.length > 0
})

const handleOpen = () => {
  if (props.shipmentId) {
    loadAbnormalList()
    loadWorkOrderList()
  }
}

const loadAbnormalList = async () => {
  try {
    const { daos } = await import('@/api')
    const res = await fetch(`/api/abnormalLogisticsLog/list?shipment_id=${props.shipmentId}`)
    const data = await res.json()
    if (data.code === 200) {
      abnormalList.value = data.data.list || []
    }
  } catch (error: any) {
    console.error('加载异常列表失败:', error)
  }
}

const loadWorkOrderList = async () => {
  try {
    const res = await fetch(`/api/logisticsLinkWorkOrder/list?shipment_id=${props.shipmentId}`)
    const data = await res.json()
    if (data.code === 200) {
      workOrderList.value = data.data.list || []
    }
  } catch (error: any) {
    console.error('加载工单列表失败:', error)
  }
}

const selectAbnormal = (abnormal: any) => {
  selectedAbnormalId.value = abnormal.id
  if (abnormal.is_processed === 0) {
    handleForm.abnormal_log_id = abnormal.id
  }
}

const getAbnormalTypeName = (type: string): string => {
  return AbnormalDetectionTypeMap[type]?.label || type
}

const getAbnormalTypeTagType = (type: string): string => {
  return AbnormalDetectionTypeMap[type]?.type || 'info'
}

const getProcessTypeText = (type: string): string => {
  const map: Record<string, string> = {
    resolved: '已解决',
    pending_confirm: '待用户确认',
    escalated: '已升级处理',
    false_alarm: '误报解除',
  }
  return map[type] || type
}

const isSlaExpiring = (time: string): boolean => {
  const expireTime = new Date(time).getTime()
  const now = Date.now()
  const remainingHours = (expireTime - now) / (1000 * 60 * 60)
  return remainingHours < 4
}

const submitHandle = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    const res = await processAbnormal(handleForm)
    if (res.code === 200) {
      ElMessage.success('处理提交成功')
      emit('success')
      handleClose()
    }
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error(error.message || '提交失败')
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
    activeTab.value = 'abnormal'
    selectedAbnormalId.value = null
    handleForm.abnormal_log_id = 0
    handleForm.process_type = ''
    handleForm.process_remark = ''
  }
})
</script>

<style scoped lang="scss">
.abnormal-handle-dialog {
  :deep(.el-dialog__body) {
    max-height: 600px;
    overflow-y: auto;
  }

  .abnormal-tabs {
    :deep(.el-tabs__content) {
      padding-top: 16px;
    }
  }

  .empty-state {
    padding: 40px 0;
  }

  .abnormal-list {
    .abnormal-card {
      padding: 16px;
      margin-bottom: 12px;
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        border-color: #409eff;
        box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
      }

      &.card-active {
        border-color: #409eff;
        background-color: #ecf5ff;
      }

      .abnormal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .abnormal-type {
          display: flex;
          gap: 8px;
        }
      }

      .abnormal-content {
        .abnormal-desc {
          font-size: 14px;
          color: #303133;
          margin-bottom: 8px;
          line-height: 1.5;
        }

        .abnormal-meta {
          display: flex;
          gap: 24px;
          font-size: 12px;
          color: #909399;
          margin-bottom: 8px;
        }

        .abnormal-suggestion {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          padding: 8px 12px;
          background-color: #fdf6ec;
          border-radius: 4px;
          font-size: 13px;
          color: #e6a23c;

          .el-icon {
            flex-shrink: 0;
            margin-top: 2px;
          }
        }
      }

      .abnormal-processed {
        .processed-title {
          font-size: 13px;
          font-weight: 600;
        }

        .processed-info {
          p {
            margin: 4px 0;
            font-size: 13px;
            color: #606266;
          }
        }
      }
    }
  }

  .work-order-list {
    .sla-warning {
      color: #f56c6c;
      font-weight: 600;
    }
  }

  .handle-form {
    padding: 0 20px;
  }
}
</style>
