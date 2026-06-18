<template>
  <div class="vehicle-batch-operation">
    <div class="operation-header">
      <div class="selection-info">
        <el-icon class="info-icon"><InfoFilled /></el-icon>
        <span class="info-text">
          已选择 <strong class="text-primary">{{ selectedRows.length }}</strong> 辆车辆，
          其中 <strong class="text-danger">{{ lockedCount }}</strong> 辆已锁定将被自动过滤，
          实际可操作 <strong class="text-success">{{ validCount }}</strong> 辆
        </span>
      </div>
      <el-alert
        v-if="lockedCount > 0"
        :title="`${lockedCount} 辆锁定车辆已被自动过滤，批量操作仅对正常状态车辆生效`"
        type="warning"
        show-icon
        :closable="false"
        class="filter-alert"
      />
    </div>

    <el-tabs v-model="activeTab" class="operation-tabs">
      <el-tab-pane label="批量操作" name="operation">
        <div class="filter-section">
          <span class="section-label">按条件筛选：</span>
          <div class="filter-row">
            <el-select v-model="filterForm.city" placeholder="备案城市" clearable style="width: 150px">
              <el-option
                v-for="city in cityOptions"
                :key="city"
                :label="city"
                :value="city"
              />
            </el-select>
            <el-select v-model="filterForm.capacityType" placeholder="运力类型" clearable style="width: 150px">
              <el-option label="快车" :value="1" />
              <el-option label="专车" :value="2" />
              <el-option label="豪华车" :value="3" />
              <el-option label="拼车" :value="4" />
              <el-option label="出租车" :value="5" />
            </el-select>
            <el-select v-model="filterForm.status" placeholder="运营状态" clearable style="width: 150px">
              <el-option label="空闲" :value="0" />
              <el-option label="运营中" :value="1" />
              <el-option label="维修中" :value="2" />
            </el-select>
            <el-select v-model="filterForm.operationLevel" placeholder="运营等级" clearable style="width: 150px">
              <el-option label="S级" :value="1" />
              <el-option label="A级" :value="2" />
              <el-option label="B级" :value="3" />
              <el-option label="C级" :value="4" />
            </el-select>
            <el-button type="primary" :icon="Search" @click="handleFilter">筛选</el-button>
            <el-button :icon="Refresh" @click="handleResetFilter">重置</el-button>
          </div>
        </div>

        <div class="operation-buttons">
          <div class="button-group">
            <span class="group-label">批量导入：</span>
            <el-button type="primary" :icon="Upload" @click="openImportDialog">
              导入备案资料
            </el-button>
            <el-button :icon="Download" @click="downloadTemplate">
              下载导入模板
            </el-button>
          </div>
          <div class="button-group">
            <span class="group-label">批量处理：</span>
            <el-button
              type="success"
              :icon="Check"
              :loading="operating"
              :disabled="validCount === 0 || operating"
              @click="handleBatchReview(1)"
            >
              批量通过
            </el-button>
            <el-button
              type="warning"
              :icon="Close"
              :loading="operating"
              :disabled="validCount === 0 || operating"
              @click="openRejectDialog"
            >
              批量驳回
            </el-button>
            <el-button
              type="info"
              :icon="Clock"
              :loading="operating"
              :disabled="operating"
              @click="handleMarkExpired"
            >
              标记过期车辆
            </el-button>
            <el-button
              type="danger"
              :icon="Lock"
              :loading="operating"
              :disabled="validCount === 0 || operating"
              @click="openLockDialog"
            >
              批量锁定
            </el-button>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="导入结果" name="result" v-if="importResult">
        <div class="import-result">
          <div class="result-stats">
            <div class="stat-item success">
              <div class="stat-icon"><el-icon><Check /></el-icon></div>
              <div class="stat-info">
                <div class="stat-value">{{ importResult.success.length }}</div>
                <div class="stat-label">成功</div>
              </div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item warning">
              <div class="stat-icon"><el-icon><Warning /></el-icon></div>
              <div class="stat-info">
                <div class="stat-value">{{ importResult.warnings.length }}</div>
                <div class="stat-label">警告</div>
              </div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item fail">
              <div class="stat-icon"><el-icon><Close /></el-icon></div>
              <div class="stat-info">
                <div class="stat-value">{{ importResult.failed.length }}</div>
                <div class="stat-label">失败</div>
              </div>
            </div>
          </div>

          <el-tabs v-model="resultTab" class="result-tabs">
            <el-tab-pane label="成功记录" name="success">
              <el-table :data="importResult.success" size="small">
                <el-table-column prop="row" label="行号" width="80" />
                <el-table-column prop="plateNumber" label="车牌号" width="120" />
                <el-table-column prop="level" label="运营等级" width="100">
                  <template #default="{ row }">
                    <span :class="['level-tag', `level-${row.level?.charAt(0)}`]">{{ row.level }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="score" label="评分" width="100" />
              </el-table>
            </el-tab-pane>
            <el-tab-pane label="失败记录" name="failed">
              <el-table :data="importResult.failed" size="small">
                <el-table-column prop="row" label="行号" width="80" />
                <el-table-column prop="type" label="错误类型" width="120">
                  <template #default="{ row }">
                    <el-tag :type="row.type === 'high_risk' ? 'danger' : row.type === 'template_error' ? 'warning' : 'info'" size="small">
                      {{ row.type === 'template_error' ? '模板错误' : row.type === 'validation_error' ? '校验错误' : row.type === 'high_risk' ? '高风险' : '系统错误' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="错误详情">
                  <template #default="{ row }">
                    <div v-for="(err, idx) in row.errors" :key="idx" class="error-item">
                      {{ err }}
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
            <el-tab-pane label="警告记录" name="warnings">
              <el-table :data="importResult.warnings" size="small">
                <el-table-column prop="row" label="行号" width="80" />
                <el-table-column prop="plateNumber" label="车牌号" width="120" />
                <el-table-column label="警告信息">
                  <template #default="{ row }">
                    <div v-for="(w, idx) in row.warnings" :key="idx" class="warning-item">
                      <el-icon><Warning /></el-icon>
                      {{ w }}
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      v-model="importDialogVisible"
      title="批量导入车辆备案"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="import-dialog">
        <div class="import-info">
          <el-alert
            title="导入说明"
            type="info"
            :closable="false"
            show-icon
          >
            <template #default>
              <p>1. 请先下载模板，按照模板格式填写车辆信息</p>
              <p>2. 系统将自动校验车牌号、车架号唯一性及证件有效期</p>
              <p>3. 高风险车辆将被自动拦截，格式错误数据将单独提示</p>
              <p>4. 支持Excel、CSV格式，单次最多导入100条</p>
            </template>
          </el-alert>
        </div>

        <el-upload
          class="upload-area"
          drag
          :action="uploadUrl"
          :before-upload="beforeUpload"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
          :show-file-list="false"
          accept=".xlsx,.xls,.csv"
          :disabled="uploading"
        >
          <el-icon class="upload-icon"><Upload /></el-icon>
          <div class="upload-text">
            {{ uploading ? '上传中...' : '将文件拖到此处，或点击上传' }}
          </div>
          <template #tip>
            <div class="upload-tip">仅支持 xlsx、xls、csv 格式，文件大小不超过 10MB</div>
          </template>
        </el-upload>

        <div v-if="previewData.length > 0" class="preview-section">
          <div class="preview-header">
            <span class="preview-title">数据预览</span>
            <span class="preview-count">共 {{ previewData.length }} 条数据</span>
          </div>
          <el-table :data="previewData.slice(0, 5)" size="small" max-height="200px">
            <el-table-column prop="plateNumber" label="车牌号" width="120" />
            <el-table-column prop="vin" label="车架号" width="200" />
            <el-table-column prop="brand" label="品牌" width="100" />
            <el-table-column prop="model" label="型号" width="100" />
          </el-table>
          <div v-if="previewData.length > 5" class="preview-more">
            还有 {{ previewData.length - 5 }} 条数据未显示...
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false" :disabled="uploading">取消</el-button>
        <el-button type="primary" :loading="uploading || importing" :disabled="previewData.length === 0" @click="handleImport">
          确认导入
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="rejectDialogVisible"
      title="批量驳回"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="驳回原因">
          <el-input
            v-model="rejectForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入驳回原因"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="操作说明">
          <div class="form-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>将对 <strong class="text-primary">{{ validCount }}</strong> 辆车辆进行批量驳回</span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false" :disabled="operating">取消</el-button>
        <el-button type="warning" :loading="operating" @click="handleBatchReview(2)">
          确认驳回
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="lockDialogVisible"
      title="批量锁定"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="lockForm" label-width="80px">
        <el-form-item label="锁定原因">
          <el-input
            v-model="lockForm.lockReason"
            type="textarea"
            :rows="3"
            placeholder="请输入锁定原因"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="操作说明">
          <div class="form-tip">
            <el-icon><Warning /></el-icon>
            <span>锁定后车辆将禁止运营，绑定司机接单权限也将同步暂停</span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="lockDialogVisible = false" :disabled="operating">取消</el-button>
        <el-button type="danger" :loading="operating" @click="handleBatchLock">
          确认锁定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="resultDialogVisible"
      title="操作结果"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="operation-result">
        <div class="result-stats">
          <div class="stat-item success">
            <div class="stat-icon"><el-icon><Check /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ operationResult.success.length }}</div>
              <div class="stat-label">成功</div>
            </div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item fail">
            <div class="stat-icon"><el-icon><Close /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ operationResult.failed.length }}</div>
              <div class="stat-label">失败</div>
            </div>
          </div>
        </div>
        <div v-if="operationResult.failed.length > 0" class="failed-detail">
          <div class="detail-title">
            <el-icon><Warning /></el-icon>
            失败详情
          </div>
          <el-scrollbar height="150px">
            <div v-for="item in operationResult.failed" :key="item.id" class="failed-item">
              <span class="failed-plate">{{ item.plateNumber || `#${item.id}` }}</span>
              <span class="failed-msg">{{ item.error }}</span>
            </div>
          </el-scrollbar>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="resultDialogVisible = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Upload,
  Download,
  Check,
  Close,
  Clock,
  Lock,
  Search,
  Refresh,
  InfoFilled,
  Warning
} from '@element-plus/icons-vue'
import {
  batchImportApi,
  batchReviewApi,
  batchMarkExpiredApi,
  batchLockApi,
  getImportTemplateApi
} from '@/api/vehicle'
import type { Vehicle, BatchImportResult, BatchOperationResult } from '@/types/vehicle'

interface Props {
  selectedRows: Vehicle[]
}

const props = defineProps<Props>()

const emit = defineEmits(['success'])

const activeTab = ref('operation')
const resultTab = ref('success')
const operating = ref(false)
const uploading = ref(false)
const importing = ref(false)

const filterForm = reactive({
  city: '',
  capacityType: undefined as number | undefined,
  status: undefined as number | undefined,
  operationLevel: undefined as number | undefined
})

const cityOptions = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '重庆', '南京']

const importDialogVisible = ref(false)
const rejectDialogVisible = ref(false)
const lockDialogVisible = ref(false)
const resultDialogVisible = ref(false)
const importResult = ref<BatchImportResult | null>(null)
const previewData = ref<any[]>([])
const uploadUrl = '/api/upload'

const rejectForm = reactive({
  remark: ''
})

const lockForm = reactive({
  lockReason: ''
})

const operationResult = ref<BatchOperationResult>({
  success: [],
  failed: [],
  total: 0
})

const filteredRows = computed(() => {
  let rows = props.selectedRows
  
  if (filterForm.city) {
    rows = rows.filter(r => r.city === filterForm.city)
  }
  if (filterForm.capacityType !== undefined) {
    rows = rows.filter(r => r.capacityType === filterForm.capacityType)
  }
  if (filterForm.status !== undefined) {
    rows = rows.filter(r => r.status === filterForm.status)
  }
  if (filterForm.operationLevel !== undefined) {
    rows = rows.filter(r => r.operationLevel === filterForm.operationLevel)
  }
  
  return rows
})

const lockedCount = computed(() => {
  return filteredRows.value.filter(row => row.isLocked === 1).length
})

const validCount = computed(() => {
  return filteredRows.value.filter(row => row.isLocked !== 1).length
})

const validIds = computed(() => {
  return filteredRows.value.filter(row => row.isLocked !== 1).map(row => row.id)
})

const handleFilter = () => {
  // Filter is applied reactively via computed
}

const handleResetFilter = () => {
  filterForm.city = ''
  filterForm.capacityType = undefined
  filterForm.status = undefined
  filterForm.operationLevel = undefined
}

const openImportDialog = () => {
  importDialogVisible.value = true
  previewData.value = []
}

const downloadTemplate = async () => {
  try {
    const res = await getImportTemplateApi()
    const template = res.data
    
    let csvContent = template.fields.map(f => f.label).join(',') + '\n'
    csvContent += template.fields.map(f => `"${f.example}"`).join(',') + '\n'
    
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = '车辆备案导入模板.csv'
    link.click()
    URL.revokeObjectURL(link.href)
    
    ElMessage.success('模板下载成功')
  } catch (error: any) {
    ElMessage.error(error.message || '模板下载失败')
  }
}

const beforeUpload = (file: File) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                 file.type === 'application/vnd.ms-excel' ||
                 file.type === 'text/csv'
  const isLt10M = file.size / 1024 / 1024 < 10
  
  if (!isExcel) {
    ElMessage.error('只能上传 Excel 或 CSV 文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB!')
    return false
  }
  
  uploading.value = true
  return true
}

const handleUploadSuccess = (response: any) => {
  uploading.value = false
  previewData.value = response.data?.preview || []
  ElMessage.success('文件解析成功')
}

const handleUploadError = () => {
  uploading.value = false
  ElMessage.error('文件上传失败，请重试')
}

const handleImport = async () => {
  if (previewData.value.length === 0) return
  
  importing.value = true
  try {
    const res = await batchImportApi(previewData.value)
    importResult.value = res.data
    activeTab.value = 'result'
    importDialogVisible.value = false
    ElMessage.success(`导入完成：成功${res.data.success.length}条，失败${res.data.failed.length}条`)
    emit('success', { operationType: 'import', result: res.data })
  } catch (error: any) {
    ElMessage.error(error.message || '导入失败')
  } finally {
    importing.value = false
  }
}

const openRejectDialog = () => {
  if (validCount.value === 0) {
    ElMessage.warning('没有可操作的车辆')
    return
  }
  rejectForm.remark = ''
  rejectDialogVisible.value = true
}

const openLockDialog = () => {
  if (validCount.value === 0) {
    ElMessage.warning('没有可操作的车辆')
    return
  }
  lockForm.lockReason = ''
  lockDialogVisible.value = true
}

const handleBatchReview = async (auditStatus: number) => {
  if (validIds.value.length === 0) {
    ElMessage.warning('没有可操作的车辆')
    return
  }
  
  try {
    if (auditStatus === 1) {
      await ElMessageBox.confirm(
        `确定通过 ${validCount.value} 辆车辆的备案审核吗？`,
        '批量通过',
        {
          confirmButtonText: '确定通过',
          cancelButtonText: '取消',
          type: 'success'
        }
      )
    } else {
      rejectDialogVisible.value = false
    }
    
    operating.value = true
    const res = await batchReviewApi(validIds.value, auditStatus, rejectForm.remark)
    operationResult.value = res.data
    resultDialogVisible.value = true
    emit('success', { operationType: 'review', auditStatus, result: res.data })
    ElMessage.success('批量审核完成')
  } catch {
    // User cancelled
  } finally {
    operating.value = false
  }
}

const handleMarkExpired = async () => {
  try {
    await ElMessageBox.confirm(
      '确定扫描并标记证件已过期的车辆吗？将按当前筛选条件处理。',
      '标记过期车辆',
      {
        confirmButtonText: '确定标记',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    operating.value = true
    const filter = {
      city: filterForm.city || undefined,
      capacityType: filterForm.capacityType,
      status: filterForm.status
    }
    const res = await batchMarkExpiredApi(filter, '证件已过期，系统自动标记')
    operationResult.value = res.data
    resultDialogVisible.value = true
    emit('success', { operationType: 'markExpired', result: res.data })
    ElMessage.success('标记完成')
  } catch {
    // User cancelled
  } finally {
    operating.value = false
  }
}

const handleBatchLock = async () => {
  if (validIds.value.length === 0) {
    ElMessage.warning('没有可操作的车辆')
    return
  }
  
  lockDialogVisible.value = false
  operating.value = true
  try {
    const res = await batchLockApi(validIds.value, lockForm.lockReason)
    operationResult.value = res.data
    resultDialogVisible.value = true
    emit('success', { operationType: 'lock', result: res.data })
    ElMessage.success('批量锁定完成')
  } catch (error: any) {
    ElMessage.error(error.message || '锁定失败')
  } finally {
    operating.value = false
  }
}

watch(() => props.selectedRows, () => {
  // Reset filters if needed
}, { deep: true })
</script>

<style lang="scss" scoped>
.vehicle-batch-operation {
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
  }

  .operation-tabs {
    :deep(.el-tabs__header) {
      margin: 0 0 16px 0;
    }
  }

  .filter-section {
    margin-bottom: 16px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;

    .section-label {
      display: block;
      font-size: 13px;
      color: #909399;
      margin-bottom: 12px;
    }

    .filter-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
    }
  }

  .operation-buttons {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .button-group {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;

      .group-label {
        font-size: 13px;
        color: #909399;
        font-weight: 500;
      }
    }
  }

  .import-dialog {
    .import-info {
      margin-bottom: 20px;
    }

    .upload-area {
      :deep(.el-upload-dragger) {
        padding: 40px;
      }

      .upload-icon {
        font-size: 48px;
        color: #c0c4cc;
        margin-bottom: 16px;
      }

      .upload-text {
        font-size: 14px;
        color: #606266;
      }

      .upload-tip {
        font-size: 12px;
        color: #909399;
        margin-top: 8px;
      }
    }

    .preview-section {
      margin-top: 20px;

      .preview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .preview-title {
          font-weight: 600;
          color: #303133;
        }

        .preview-count {
          font-size: 12px;
          color: #909399;
        }
      }

      .preview-more {
        text-align: center;
        padding: 8px;
        font-size: 12px;
        color: #909399;
        background: #f5f7fa;
        border-radius: 0 0 4px 4px;
      }
    }
  }

  .import-result {
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

        &.warning {
          .stat-icon {
            background: linear-gradient(135deg, #e6a23c 0%, #eea348 100%);
          }
          .stat-value {
            color: #e6a23c;
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
        margin: 0 30px;
      }
    }

    .result-tabs {
      margin-top: 16px;
    }

    .error-item {
      font-size: 12px;
      color: #f56c6c;
      padding: 2px 0;
    }

    .warning-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #e6a23c;
      padding: 2px 0;
    }
  }

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

  .operation-result {
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

        .failed-plate {
          flex-shrink: 0;
          color: #f56c6c;
          font-weight: 500;
          min-width: 100px;
        }

        .failed-msg {
          color: #606266;
        }
      }
    }
  }
}

.level-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;

  &.level-S {
    background: linear-gradient(135deg, #ffd700, #ffb300);
    color: #fff;
  }

  &.level-A {
    background: linear-gradient(135deg, #409eff, #2b85e4);
    color: #fff;
  }

  &.level-B {
    background: linear-gradient(135deg, #67c23a, #529b2e);
    color: #fff;
  }

  &.level-C {
    background: linear-gradient(135deg, #909399, #73767a);
    color: #fff;
  }
}
</style>
