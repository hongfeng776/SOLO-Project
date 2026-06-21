<template>
  <div class="ccb-business-device-archive-batch">
    <CcbPageHeader
      title="批量建档"
      description="多类型终端设备批量录入与差异化资质校验"
      icon="Files"
    />

    <el-row :gutter="20" class="mb15">
      <el-col :span="12">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <span class="card-title">批量统计</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="8" class="stat-item">
              <div class="stat-label">待处理</div>
              <div class="stat-value text-warning">{{ pendingCount }}</div>
            </el-col>
            <el-col :span="8" class="stat-item">
              <div class="stat-label">待复核</div>
              <div class="stat-value text-danger">{{ reviewCount }}</div>
            </el-col>
            <el-col :span="8" class="stat-item">
              <div class="stat-label">已完成</div>
              <div class="stat-value text-success">{{ successCount }}</div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <span class="card-title">设备统计</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="12" class="stat-item">
              <div class="stat-label">批次总数</div>
              <div class="stat-value text-primary">{{ batchItems.length }}</div>
            </el-col>
            <el-col :span="12" class="stat-item">
              <div class="stat-label">老旧设备数</div>
              <div class="stat-value text-danger">{{ totalOldDevices }}</div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover" class="mb15">
      <template #header>
        <span class="card-title">批量录入</span>
        <el-button
          type="primary"
          :icon="Plus"
          size="small"
          @click="addRow"
          :disabled="submitting"
        >
          添加一行
        </el-button>
      </template>

      <el-table
        :data="batchItems"
        border
        stripe
        row-key="index"
        class="batch-table"
        :row-class-name="getRowClassName"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="SN码" min-width="160">
          <template #default="{ row }">
            <el-input
              v-model="row.sn_code"
              placeholder="请输入SN码"
              size="small"
              @blur="validateRow(row)"
              :class="{ 'shake-error': row.hasError }"
            />
          </template>
        </el-table-column>
        <el-table-column label="设备类型" width="140">
          <template #default="{ row }">
            <el-select
              v-model="row.device_type"
              placeholder="选择类型"
              size="small"
              style="width: 100%"
              @change="validateRow(row)"
            >
              <el-option v-for="item in DEVICE_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="设备型号" min-width="140">
          <template #default="{ row }">
            <el-input
              v-model="row.device_model"
              placeholder="请输入型号"
              size="small"
              @blur="validateRow(row)"
              :class="{ 'shake-error': row.hasError }"
            />
          </template>
        </el-table-column>
        <el-table-column label="生产厂家" min-width="130">
          <template #default="{ row }">
            <el-input
              v-model="row.supplier"
              placeholder="请输入厂家"
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column label="采购批次" min-width="120">
          <template #default="{ row }">
            <el-input
              v-model="row.purchase_batch"
              placeholder="请输入批次"
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column label="归属网点" min-width="120">
          <template #default="{ row }">
            <el-input
              v-model="row.org_id"
              placeholder="请输入网点"
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column label="安装位置" min-width="120">
          <template #default="{ row }">
            <el-input
              v-model="row.install_location"
              placeholder="请输入位置"
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column label="使用场景" width="120">
          <template #default="{ row }">
            <el-select
              v-model="row.usage_scene"
              placeholder="选择场景"
              size="small"
              style="width: 100%"
              @change="validateRow(row)"
            >
              <el-option v-for="item in USAGE_SCENE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="管控等级" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="calculateRowControlLevel(row)"
              :type="calculateRowControlLevel(row).type"
              effect="light"
              size="small"
            >
              {{ calculateRowControlLevel(row).label }}
            </el-tag>
            <el-text v-else type="info" size="small">-</el-text>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.success === true" type="success" effect="light" size="small">成功</el-tag>
            <el-tag v-else-if="row.success === false" type="danger" effect="light" size="small">失败</el-tag>
            <el-tag v-else type="info" effect="light" size="small">待处理</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="错误信息" min-width="200">
          <template #default="{ row }">
            <el-text v-if="row.errors && row.errors.length > 0" type="danger" size="small">
              {{ row.errors.join('; ') }}
            </el-text>
            <el-text v-else-if="row.warnings && row.warnings.length > 0" type="warning" size="small">
              {{ row.warnings.join('; ') }}
            </el-text>
            <el-text v-else type="info" size="small">-</el-text>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ row, $index }">
            <el-button
              type="danger"
              link
              size="small"
              @click="removeRow($index)"
              :disabled="submitting"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="batch-actions">
        <div class="actions-left">
          <el-text type="info" size="small">
            注：预校验将逐行检查SN码唯一性、设备型号合规性及资质完整性，校验通过后方可提交
          </el-text>
        </div>
        <div class="actions-right">
          <el-button @click="clearAll" :disabled="submitting">清空</el-button>
          <el-button @click="validateAll" :disabled="submitting">预校验</el-button>
          <el-button
            type="primary"
            :loading="submitting"
            @click="handleSubmit"
            :disabled="!canSubmit"
          >
            <i v-if="submitting" class="el-icon-loading"></i>
            {{ submitting ? '提交中...' : '批量提交' }}
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  DEVICE_TYPE_OPTIONS,
  USAGE_SCENE_OPTIONS,
  CONTROL_LEVEL_OPTIONS,
  type BatchDeviceArchiveItem,
  type BatchDeviceArchiveResultItem,
  type DevicePreCheckResult,
  preCheckDeviceApi,
  batchDeviceArchiveApi
} from '@api/deviceArchive'

const submitting = ref(false)

const batchItems = ref<(BatchDeviceArchiveItem & {
  hasError?: boolean
  success?: boolean
  errors?: string[]
  warnings?: string[]
  pre_check?: DevicePreCheckResult
  is_old_device?: boolean
  index: number
})[]>([])

const pendingCount = computed(() => batchItems.value.filter(i => i.success === undefined).length)
const reviewCount = computed(() => batchItems.value.filter(i => i.success === undefined && i.pre_check && !i.pre_check.passed && !i.pre_check.blocked).length)
const successCount = computed(() => batchItems.value.filter(i => i.success === true).length)
const totalOldDevices = computed(() => batchItems.value.filter(i => i.is_old_device).length)

const canSubmit = computed(() => {
  const hasValidItems = batchItems.value.some(i => i.sn_code && i.device_model && !i.hasError)
  return hasValidItems && !submitting.value
})

const addRow = () => {
  const newIndex = batchItems.value.length
  batchItems.value.push({
    index: newIndex,
    sn_code: '',
    device_type: 1,
    device_model: '',
    supplier: '',
    purchase_batch: '',
    org_id: '',
    install_location: '',
    usage_scene: ''
  })
}

const removeRow = (index: number) => {
  batchItems.value.splice(index, 1)
  batchItems.value.forEach((item, i) => {
    item.index = i
  })
}

const clearAll = () => {
  batchItems.value = []
}

const triggerShake = (row: any) => {
  row.hasError = true
  setTimeout(() => {
    row.hasError = false
  }, 500)
}

const validateRow = async (row: any) => {
  row.errors = []
  row.warnings = []

  if (!row.sn_code) {
    row.errors.push('请输入SN码')
  }
  if (!row.device_model) {
    row.errors.push('请输入设备型号')
  }

  if (row.sn_code && row.device_model) {
    try {
      const res = await preCheckDeviceApi({
        sn_code: row.sn_code,
        device_type: row.device_type,
        device_model: row.device_model,
        org_id: row.org_id,
        install_location: row.install_location,
        usage_scene: row.usage_scene,
        purchase_batch: row.purchase_batch
      })
      row.pre_check = res.data
      row.is_old_device = res.data.is_old_device
      if (!res.data.passed) {
        row.errors.push(res.data.block_reason || '校验未通过')
        triggerShake(row)
      }
      if (res.data.warnings && res.data.warnings.length > 0) {
        row.warnings = [...res.data.warnings]
      }
    } catch (e: any) {
      row.errors.push(e?.message || '校验失败')
      triggerShake(row)
    }
  }
}

const validateAll = async () => {
  let validCount = 0
  for (const item of batchItems.value) {
    await validateRow(item)
    if (!item.errors || item.errors.length === 0) {
      validCount++
    }
  }
  ElMessage.info(`预校验完成：${validCount}/${batchItems.value.length} 条有效`)
}

const calculateRowControlLevel = (row: any) => {
  if (!row.pre_check?.control_level) return null
  return CONTROL_LEVEL_OPTIONS.find(o => o.value === row.pre_check.control_level) || null
}

const getRowClassName = ({ row }: { row: any }) => {
  if (row.success === true) return 'row-success'
  if (row.success === false) return 'row-error'
  if (row.warnings && row.warnings.length > 0) return 'row-warning'
  return ''
}

const handleSubmit = async () => {
  const validItems = batchItems.value.filter(i => i.sn_code && i.device_model && (!i.errors || i.errors.length === 0))
  if (validItems.length === 0) {
    ElMessage.warning('没有有效的设备建档记录')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认提交 ${validItems.length} 条设备建档记录？`,
      '确认提交',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }

  submitting.value = true
  try {
    const res = await batchDeviceArchiveApi({
      items: validItems.map(i => ({
        index: i.index,
        sn_code: i.sn_code,
        device_type: i.device_type,
        device_model: i.device_model,
        supplier: i.supplier,
        purchase_batch: i.purchase_batch,
        org_id: i.org_id,
        install_location: i.install_location,
        usage_scene: i.usage_scene
      }))
    })

    res.data.details.forEach((d: BatchDeviceArchiveResultItem) => {
      const item = batchItems.value[d.index]
      if (item) {
        item.success = d.success
        item.errors = d.errors || item.errors
        item.warnings = d.warnings || item.warnings
        if (d.pre_check) {
          item.pre_check = d.pre_check
          item.is_old_device = d.pre_check.is_old_device
        }
      }
    })

    ElMessage.success(
      `批量提交完成：成功${res.data.success_count}条，失败${res.data.fail_count}条，待复核${res.data.review_count}条`
    )
  } catch (e) {
    console.error('Failed to submit batch:', e)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  addRow()
})
</script>

<style scoped>
.batch-table :deep(.el-table__row:hover) {
  transform: scale(1.005);
  transition: transform 0.2s ease;
}

.batch-table :deep(.el-table__row.row-success) {
  background-color: #f0f9eb !important;
}

.batch-table :deep(.el-table__row.row-error) {
  background-color: #fef0f0 !important;
}

.batch-table :deep(.el-table__row.row-warning) {
  background-color: #fdf6ec !important;
}

.shake-error :deep(.el-input__wrapper) {
  animation: shake 0.4s ease-in-out;
  border-color: #f56c6c !important;
  box-shadow: 0 0 0 1px #f56c6c inset !important;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-3px); }
  40%, 80% { transform: translateX(3px); }
}

.stat-card {
  height: 100%;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
}

.text-primary {
  color: #409eff;
}

.text-success {
  color: #67c23a;
}

.text-warning {
  color: #e6a23c;
}

.text-danger {
  color: #f56c6c;
}

.card-title {
  font-weight: 600;
}

.mb15 {
  margin-bottom: 15px;
}

.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.actions-left {
  flex: 1;
}

.actions-right {
  display: flex;
  gap: 10px;
}
</style>
