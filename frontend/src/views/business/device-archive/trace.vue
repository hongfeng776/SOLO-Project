<template>
  <div class="ccb-business-device-archive-trace">
    <CcbPageHeader
      title="设备溯源查询"
      description="溯源设备采购、入网、建档、领用全流程记录"
      icon="Search"
    />

    <el-card shadow="hover" class="mb15">
      <template #header>
        <span class="card-title">溯源条件</span>
      </template>
      <el-form :model="traceForm" inline>
        <el-form-item label="SN码">
          <el-input
            v-model="traceForm.sn_code"
            placeholder="请输入SN码"
            clearable
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="档案编号">
          <el-input
            v-model="traceForm.archive_no"
            placeholder="请输入档案编号"
            clearable
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="归属网点">
          <el-input
            v-model="traceForm.org_id"
            placeholder="请输入归属网点"
            clearable
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select
            v-model="traceForm.device_type"
            placeholder="请选择设备类型"
            clearable
            style="width: 220px"
          >
            <el-option
              v-for="opt in DEVICE_TYPE_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="handleTrace">
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="20" class="mb15" v-if="traceResult">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">设备总数</div>
          <div class="stat-value text-primary">{{ traceResult.total_count }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card" :class="{ 'card-error': traceResult.duplicate_check.has_duplicate }">
          <div class="stat-label">重复建档检测</div>
          <div class="stat-value">
            <el-icon v-if="traceResult.duplicate_check.has_duplicate" class="text-danger"><Warning /></el-icon>
            <span :class="traceResult.duplicate_check.has_duplicate ? 'text-danger' : 'text-success'">
              {{ traceResult.duplicate_check.has_duplicate ? '发现异常' : '正常' }}
            </span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card" :class="{ 'card-error': traceResult.fake_device_check.has_fake }">
          <div class="stat-label">虚假设备检测</div>
          <div class="stat-value">
            <el-icon v-if="traceResult.fake_device_check.has_fake" class="text-danger"><Warning /></el-icon>
            <span :class="traceResult.fake_device_check.has_fake ? 'text-danger' : 'text-success'">
              {{ traceResult.fake_device_check.has_fake ? '发现异常' : '正常' }}
            </span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card" :class="{ 'card-error': traceResult.qualification_check.has_expired }">
          <div class="stat-label">资质过期检测</div>
          <div class="stat-value">
            <el-icon v-if="traceResult.qualification_check.has_expired" class="text-danger"><Warning /></el-icon>
            <span :class="traceResult.qualification_check.has_expired ? 'text-danger' : 'text-success'">
              {{ traceResult.qualification_check.has_expired ? '发现异常' : '正常' }}
            </span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb15" v-if="traceResult">
      <el-col :span="12">
        <el-card shadow="hover" class="stat-card" :class="{ 'card-error': traceResult.fake_device_check.has_fake }">
          <template #header>
            <div class="card-header-flex">
              <span class="card-title">虚假设备检测明细</span>
              <el-tag :type="traceResult.fake_device_check.has_fake ? 'danger' : 'success'" effect="light">
                {{ traceResult.fake_device_check.has_fake ? '发现虚假设备' : '全部正常' }}
              </el-tag>
            </div>
          </template>
          <el-table
            v-if="traceResult.fake_device_check.fakes.length > 0"
            :data="traceResult.fake_device_check.fakes"
            border
            size="small"
          >
            <el-table-column prop="archive_no" label="档案编号" width="180" />
            <el-table-column prop="sn_code" label="SN码" width="180" />
            <el-table-column prop="device_type" label="设备类型" width="120">
              <template #default="{ row }">
                {{ getDeviceTypeLabel(row.device_type) }}
              </template>
            </el-table-column>
            <el-table-column prop="fake_reason" label="虚假原因" show-overflow-tooltip />
          </el-table>
          <el-empty v-else description="未发现虚假设备" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="stat-card" :class="{ 'card-error': traceResult.risk_prompts.length > 0 }">
          <template #header>
            <div class="card-header-flex">
              <span class="card-title">风险提示</span>
              <el-badge :value="traceResult.risk_prompts.length" :hidden="traceResult.risk_prompts.length === 0" class="item">
                <el-tag :type="traceResult.validation_passed ? 'success' : 'danger'" effect="light">
                  {{ traceResult.validation_passed ? '校验通过' : '校验不通过' }}
                </el-tag>
              </el-badge>
            </div>
          </template>
          <div v-if="traceResult.risk_prompts.length > 0" class="risk-list">
            <el-alert
              v-for="(prompt, idx) in traceResult.risk_prompts"
              :key="idx"
              :title="prompt"
              type="warning"
              show-icon
              :closable="false"
              class="mb10"
            />
          </div>
          <el-empty v-else description="暂无风险提示" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb15" v-if="traceResult && traceResult.duplicate_check.duplicates.length > 0">
      <el-col :span="24">
        <el-card shadow="hover" class="card-error">
          <template #header>
            <span class="card-title">重复建档检测明细</span>
          </template>
          <el-table :data="traceResult.duplicate_check.duplicates" border size="small">
            <el-table-column prop="archive_no" label="档案编号" width="180" />
            <el-table-column prop="sn_code" label="SN码" width="180" />
            <el-table-column prop="device_type" label="设备类型" width="140">
              <template #default="{ row }">
                {{ getDeviceTypeLabel(row.device_type) }}
              </template>
            </el-table-column>
            <el-table-column prop="create_time" label="建档时间" width="180" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb15" v-if="traceResult && traceResult.qualification_check.expired_items.length > 0">
      <el-col :span="24">
        <el-card shadow="hover" class="card-error">
          <template #header>
            <span class="card-title">资质过期检测明细</span>
          </template>
          <el-table :data="traceResult.qualification_check.expired_items" border size="small">
            <el-table-column prop="archive_no" label="档案编号" width="180" />
            <el-table-column prop="sn_code" label="SN码" width="180" />
            <el-table-column prop="qualification_type" label="资质类型" width="140" />
            <el-table-column prop="qualification_name" label="资质名称" width="180" />
            <el-table-column prop="expire_date" label="过期日期" width="120" />
            <el-table-column prop="overdue_days" label="逾期天数" width="110" align="right">
              <template #default="{ row }">
                <el-tag type="danger" effect="light" size="small">{{ row.overdue_days }}天</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover" v-if="traceResult">
      <template #header>
        <span class="card-title">设备明细记录</span>
        <el-text type="info" size="small">共 {{ traceResult.records.length }} 条记录</el-text>
      </template>
      <el-table
        :data="traceResult.records"
        border
        stripe
        row-class-name="record-row"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="archive_no" label="档案编号" width="180" />
        <el-table-column prop="sn_code" label="SN码" width="180" />
        <el-table-column prop="device_type" label="设备类型" width="120">
          <template #default="{ row }">
            {{ getDeviceTypeLabel(row.device_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="device_model" label="设备型号" width="140" />
        <el-table-column prop="supplier" label="生产厂家" width="140" show-overflow-tooltip />
        <el-table-column prop="org_name" label="归属网点" width="120" />
        <el-table-column prop="control_level" label="管控等级" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getControlLevelType(row.control_level)"
              effect="light"
              size="small"
            >
              {{ getControlLevelLabel(row.control_level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_old_device" label="老旧设备" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_old_device ? 'warning' : 'success'" effect="light" size="small">
              {{ row.is_old_device ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="建档时间" width="160" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Warning } from '@element-plus/icons-vue'
import {
  DEVICE_TYPE_OPTIONS,
  DEVICE_STATUS_OPTIONS,
  CONTROL_LEVEL_OPTIONS,
  type DeviceTraceRequest,
  type DeviceTraceResult,
  traceDeviceArchiveApi
} from '@api/deviceArchive'

const loading = ref(false)
const traceResult = ref<DeviceTraceResult | null>(null)

const traceForm = reactive<DeviceTraceRequest & { archive_no: string }>({
  sn_code: '',
  archive_no: '',
  org_id: '',
  device_type: undefined as unknown as DeviceTraceRequest['device_type']
})

const handleTrace = async () => {
  if (!traceForm.sn_code && !traceForm.archive_no && !traceForm.org_id && traceForm.device_type === undefined) {
    ElMessage.warning('请至少输入一项查询条件')
    return
  }
  loading.value = true
  try {
    const res = await traceDeviceArchiveApi(traceForm)
    traceResult.value = res.data
    ElMessage.success(
      `溯源查询完成，共 ${res.data.total_count} 条记录`
    )
  } catch (e) {
    console.error('Failed to trace device archive:', e)
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  traceForm.sn_code = ''
  traceForm.archive_no = ''
  traceForm.org_id = ''
  traceForm.device_type = undefined as unknown as DeviceTraceRequest['device_type']
  traceResult.value = null
}

const getDeviceTypeLabel = (type: number) => {
  const opt = DEVICE_TYPE_OPTIONS.find(o => o.value === type)
  return opt?.label || '未知'
}

const getStatusType = (status: number) => {
  const opt = DEVICE_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.type || ''
}

const getStatusLabel = (status: number) => {
  const opt = DEVICE_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.label || '未知'
}

const getControlLevelType = (level: number) => {
  const opt = CONTROL_LEVEL_OPTIONS.find(o => o.value === level)
  return opt?.type || ''
}

const getControlLevelLabel = (level: number) => {
  const opt = CONTROL_LEVEL_OPTIONS.find(o => o.value === level)
  return opt?.label || '未知'
}
</script>

<style scoped>
.record-row:hover {
  transform: scale(1.005);
  transition: transform 0.2s ease;
}

.amount-positive {
  color: #67c23a;
  font-weight: 600;
}

.stat-card {
  height: 100%;
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

.card-error {
  border-color: #f56c6c !important;
}

.card-error :deep(.el-card__header) {
  border-bottom-color: #f56c6c !important;
  background-color: #fef0f0;
}

.card-title {
  font-weight: 600;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mb15 {
  margin-bottom: 15px;
}

.mb10 {
  margin-bottom: 10px;
}

.risk-list {
  max-height: 300px;
  overflow-y: auto;
}
</style>
