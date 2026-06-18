<template>
  <div class="passenger-batch-operation">
    <div class="operation-header">
      <div class="selection-info">
        <el-icon class="info-icon"><InfoFilled /></el-icon>
        <span class="info-text">
          已选择 <strong class="text-primary">{{ selectedRows.length }}</strong> 名乘客，
          其中 <strong class="text-danger">{{ blockedCount }}</strong> 名已封禁将被自动过滤，
          实际可操作 <strong class="text-success">{{ validCount }}</strong> 名
        </span>
      </div>
      <el-alert
        v-if="blockedCount > 0"
        :title="`${blockedCount} 个封禁账号已被自动过滤，批量操作仅对正常状态账号生效`"
        type="warning"
        show-icon
        :closable="false"
        class="filter-alert"
      />
    </div>

    <div class="filter-tags">
      <span class="tags-label">快速筛选：</span>
      <el-tag
        v-for="tag in filterTags"
        :key="tag.value"
        :type="activeFilter === tag.value ? '' : 'info'"
        :effect="activeFilter === tag.value ? 'dark' : 'plain'"
        :style="{ borderColor: tag.color, color: activeFilter === tag.value ? '#fff' : tag.color, backgroundColor: activeFilter === tag.value ? tag.color : 'transparent' }"
        class="filter-tag"
        @click="handleFilterChange(tag.value)"
      >
        <el-icon><Filter /></el-icon>
        {{ tag.label }}
      </el-tag>
      <el-tag
        v-if="activeFilter"
        type="info"
        effect="plain"
        class="clear-tag"
        @click="handleFilterChange(null)"
      >
        <el-icon><Close /></el-icon>
        清除筛选
      </el-tag>
    </div>

    <div class="operation-buttons">
      <el-button-group>
        <el-button
          type="warning"
          :loading="operating"
          :disabled="validCount === 0 || operating"
          @click="handleWakeup"
        >
          <el-icon><Bell /></el-icon>
          发送唤醒福利
        </el-button>
        <el-button
          type="primary"
          :loading="operating"
          :disabled="validCount === 0 || operating"
          @click="handleVerify"
        >
          <el-icon><CircleCheck /></el-icon>
          账号核验
        </el-button>
        <el-button
          type="danger"
          :loading="operating"
          :disabled="validCount === 0 || operating"
          @click="openRiskDialog"
        >
          <el-icon><Warning /></el-icon>
          风险标记
        </el-button>
      </el-button-group>
    </div>

    <el-dialog
      v-model="riskDialogVisible"
      title="批量风险标记"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="riskFormRef"
        :model="riskForm"
        :rules="riskRules"
        label-width="100px"
      >
        <el-form-item label="风险原因" prop="reason">
          <el-input
            v-model="riskForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入风险原因"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="风险等级" prop="severity">
          <el-radio-group v-model="riskForm.severity">
            <el-radio
              v-for="level in riskLevels"
              :key="level.value"
              :value="level.value"
              :style="{ color: level.color }"
            >
              <el-icon>
                <Warning v-if="level.value === 3" />
                <InfoFilled v-else-if="level.value === 2" />
                <CircleCheck v-else />
              </el-icon>
              {{ level.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="操作说明">
          <div class="form-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>将对 <strong class="text-primary">{{ validCount }}</strong> 名正常状态乘客进行风险标记</span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="riskDialogVisible = false" :disabled="operating">取消</el-button>
        <el-button type="danger" :loading="operating" @click="handleRiskMark">
          <el-icon><Warning /></el-icon>
          确认标记
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="resultDialogVisible"
      title="操作结果"
      width="450px"
      :close-on-click-modal="false"
    >
      <div class="result-stats">
        <div class="stat-item success">
          <div class="stat-icon">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ operationResult.successCount }}</div>
            <div class="stat-label">成功</div>
          </div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item fail">
          <div class="stat-icon">
            <el-icon><CircleClose /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ operationResult.failCount }}</div>
            <div class="stat-label">失败</div>
          </div>
        </div>
      </div>
      <div v-if="failedList.length > 0" class="failed-detail">
        <div class="detail-title">
          <el-icon><Warning /></el-icon>
          失败详情
        </div>
        <el-scrollbar height="150px">
          <div
            v-for="item in failedList"
            :key="item.id"
            class="failed-item"
          >
            <span class="failed-id">#{{ item.id }}</span>
            <span class="failed-msg">{{ item.message }}</span>
          </div>
        </el-scrollbar>
      </div>
      <template #footer>
        <el-button type="primary" @click="handleResultClose">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Bell,
  CircleCheck,
  CircleClose,
  Warning,
  Filter,
  Close,
  InfoFilled
} from '@element-plus/icons-vue'
import { batchOperationApi } from '@/api/passenger'
import {
  BatchOperationType,
  BatchOperationTypeMap,
  PassengerTagType,
  PassengerTagTypeMap,
  PassengerTagTypeColorMap
} from '@/enums/passenger'
import { RiskSeverity, RiskSeverityMap, RiskSeverityColorMap } from '@/enums/risk'
import type { Passenger, BatchOperationResult } from '@/types/passenger'

interface Props {
  selectedRows: Passenger[]
}

const props = defineProps<Props>()

const emit = defineEmits(['success', 'filter-change'])

const operating = ref(false)
const activeFilter = ref<string | null>(null)
const riskDialogVisible = ref(false)
const resultDialogVisible = ref(false)
const riskFormRef = ref<FormInstance>()
const currentOperationType = ref<string>('')

const operationResult = ref<BatchOperationResult>({
  successCount: 0,
  failCount: 0,
  results: []
})

const riskForm = ref({
  reason: '',
  severity: RiskSeverity.MEDIUM
})

const riskRules: FormRules = {
  reason: [
    { required: true, message: '请输入风险原因', trigger: 'blur' },
    { min: 2, max: 200, message: '长度在 2 到 200 个字符', trigger: 'blur' }
  ],
  severity: [
    { required: true, message: '请选择风险等级', trigger: 'change' }
  ]
}

const filterTags = [
  { value: PassengerTagType.NEW_REGISTER, label: PassengerTagTypeMap[PassengerTagType.NEW_REGISTER], color: PassengerTagTypeColorMap[PassengerTagType.NEW_REGISTER] },
  { value: PassengerTagType.HIGH_FREQUENCY, label: PassengerTagTypeMap[PassengerTagType.HIGH_FREQUENCY], color: PassengerTagTypeColorMap[PassengerTagType.HIGH_FREQUENCY] },
  { value: PassengerTagType.LOW_FREQUENCY, label: PassengerTagTypeMap[PassengerTagType.LOW_FREQUENCY], color: PassengerTagTypeColorMap[PassengerTagType.LOW_FREQUENCY] },
  { value: PassengerTagType.HIGH_RISK, label: PassengerTagTypeMap[PassengerTagType.HIGH_RISK], color: PassengerTagTypeColorMap[PassengerTagType.HIGH_RISK] }
]

const riskLevels = [
  { value: RiskSeverity.LOW, label: RiskSeverityMap[RiskSeverity.LOW], color: RiskSeverityColorMap[RiskSeverity.LOW] },
  { value: RiskSeverity.MEDIUM, label: RiskSeverityMap[RiskSeverity.MEDIUM], color: RiskSeverityColorMap[RiskSeverity.MEDIUM] },
  { value: RiskSeverity.HIGH, label: RiskSeverityMap[RiskSeverity.HIGH], color: RiskSeverityColorMap[RiskSeverity.HIGH] }
]

const filteredRows = computed(() => {
  if (!activeFilter.value) return props.selectedRows
  return props.selectedRows.filter(row =>
    row.tags?.includes(activeFilter.value as string)
  )
})

const blockedCount = computed(() => {
  return filteredRows.value.filter(row => row.status !== 1).length
})

const validCount = computed(() => {
  return filteredRows.value.filter(row => row.status === 1).length
})

const validIds = computed(() => {
  return filteredRows.value.filter(row => row.status === 1).map(row => row.id)
})

const failedList = computed(() => {
  return operationResult.value.results.filter(r => !r.success)
})

const handleFilterChange = (tag: string | null) => {
  activeFilter.value = tag
  emit('filter-change', tag)
}

const handleWakeup = async () => {
  try {
    await ElMessageBox.confirm(
      `确定向 ${validCount.value} 名低频沉睡用户发送唤醒福利优惠券吗？`,
      '发送唤醒福利',
      {
        confirmButtonText: '确定发送',
        cancelButtonText: '取消',
        type: 'warning',
        icon: Bell
      }
    )
    currentOperationType.value = BatchOperationType.WAKEUP
    await executeBatchOperation(BatchOperationType.WAKEUP)
  } catch {
  }
}

const handleVerify = async () => {
  try {
    await ElMessageBox.confirm(
      `确定提交 ${validCount.value} 名乘客的实名认证审核吗？`,
      '账号核验',
      {
        confirmButtonText: '确定提交',
        cancelButtonText: '取消',
        type: 'primary',
        icon: CircleCheck
      }
    )
    currentOperationType.value = BatchOperationType.VERIFY
    await executeBatchOperation(BatchOperationType.VERIFY)
  } catch {
  }
}

const openRiskDialog = () => {
  riskForm.value = {
    reason: '',
    severity: RiskSeverity.MEDIUM
  }
  riskFormRef.value?.resetFields()
  riskDialogVisible.value = true
}

const handleRiskMark = async () => {
  if (!riskFormRef.value) return
  await riskFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        currentOperationType.value = BatchOperationType.RISK_MARK
        riskDialogVisible.value = false
        await executeBatchOperation(BatchOperationType.RISK_MARK, {
          reason: riskForm.value.reason,
          severity: riskForm.value.severity
        })
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败')
      }
    }
  })
}

const executeBatchOperation = async (operationType: string, params?: any) => {
  if (validIds.value.length === 0) {
    ElMessage.warning('没有可操作的正常状态账号')
    return
  }

  operating.value = true
  try {
    const res = await batchOperationApi({
      ids: validIds.value,
      operationType,
      params
    })
    operationResult.value = res.data
    resultDialogVisible.value = true
    emit('success', {
      operationType,
      result: operationResult.value
    })
    ElMessage.success(`${BatchOperationTypeMap[operationType]}操作完成`)
  } catch (error: any) {
    ElMessage.error(error.message || `${BatchOperationTypeMap[operationType]}失败`)
  } finally {
    operating.value = false
  }
}

const handleResultClose = () => {
  resultDialogVisible.value = false
  operationResult.value = {
    successCount: 0,
    failCount: 0,
    results: []
  }
}

watch(() => props.selectedRows, () => {
  if (activeFilter.value && !props.selectedRows.some(row => row.tags?.includes(activeFilter.value as string))) {
    activeFilter.value = null
  }
}, { deep: true })
</script>

<style lang="scss" scoped>
.passenger-batch-operation {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .operation-header {
    margin-bottom: 16px;

    .selection-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      font-size: 14px;
      color: #606266;

      .info-icon {
        color: #409eff;
        font-size: 18px;
      }

      .info-text {
        strong {
          font-size: 16px;
        }
      }

      .text-primary {
        color: #409eff;
      }

      .text-success {
        color: #67c23a;
      }

      .text-danger {
        color: #f56c6c;
      }
    }

    .filter-alert {
      margin-top: 12px;
    }
  }

  .filter-tags {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 16px;
    padding: 12px 16px;
    background: #f5f7fa;
    border-radius: 8px;

    .tags-label {
      font-size: 13px;
      color: #909399;
      margin-right: 4px;
    }

    .filter-tag {
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      gap: 4px;

      &:hover {
        transform: translateY(-1px);
      }
    }

    .clear-tag {
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .operation-buttons {
    display: flex;
    justify-content: flex-end;
    padding-top: 12px;
    border-top: 1px solid #ebeef5;

    :deep(.el-button-group) {
      .el-button {
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }
  }

  :deep(.el-dialog) {
    .el-form {
      .form-tip {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #909399;

        .text-primary {
          color: #409eff;
          font-weight: 600;
        }
      }
    }
  }

  .result-stats {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 0;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 16px;

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        color: #fff;
      }

      .stat-info {
        text-align: center;

        .stat-value {
          font-size: 32px;
          font-weight: 600;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 13px;
          color: #909399;
          margin-top: 4px;
        }
      }

      &.success {
        .stat-icon {
          background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
        }

        .stat-value {
          color: #67c23a;
        }
      }

      &.fail {
        .stat-icon {
          background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
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
      margin: 0 40px;
    }
  }

  .failed-detail {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #ebeef5;

    .detail-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 500;
      color: #f56c6c;
      margin-bottom: 12px;
    }

    .failed-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 8px 12px;
      background: #fef0f0;
      border-radius: 4px;
      margin-bottom: 8px;
      font-size: 13px;

      &:last-child {
        margin-bottom: 0;
      }

      .failed-id {
        flex-shrink: 0;
        color: #f56c6c;
        font-weight: 500;
      }

      .failed-msg {
        color: #606266;
      }
    }
  }
}
</style>
