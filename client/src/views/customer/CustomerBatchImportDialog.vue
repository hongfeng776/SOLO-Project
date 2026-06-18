<template>
  <FinDialog
    v-model:visible="visible"
    title="批量导入客户建档"
    width="900px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div class="import-container">
      <div v-if="step === 1" class="step-upload">
        <el-alert
          title="请按照模板格式填写数据，支持 .json 格式文件"
          type="info"
          :closable="false"
          show-icon
          class="tip-alert"
        />
        <el-upload
          class="upload-area"
          drag
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileChange"
          accept=".json"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将 JSON 文件拖到此处，或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              仅支持 JSON 格式文件，单次最多 500 条数据
            </div>
          </template>
        </el-upload>
        <div class="template-link">
          <el-button type="primary" link @click="downloadTemplate">
            <el-icon><Download /></el-icon>
            下载导入模板
          </el-button>
        </div>
      </div>

      <div v-if="step === 2" class="step-progress">
        <div class="progress-header">
          <span>正在导入数据...</span>
          <span class="progress-text">{{ currentProgress }} / {{ totalData }}</span>
        </div>
        <el-progress
          :percentage="Math.floor((currentProgress / totalData) * 100)"
          :stroke-width="20"
          status="success"
        />
        <div class="progress-tip">
          <el-icon><Loading /></el-icon>
          请勿关闭此窗口，数据正在处理中
        </div>
      </div>

      <div v-if="step === 3" class="step-result">
        <el-result
          :icon="resultIcon"
          :title="resultTitle"
          :sub-title="resultSubTitle"
        />
        <div class="result-summary">
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="stat-card total">
                <div class="stat-value">{{ importResult?.total || 0 }}</div>
                <div class="stat-label">总条数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card success">
                <div class="stat-value">{{ importResult?.success || 0 }}</div>
                <div class="stat-label">成功</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card failed">
                <div class="stat-value">{{ importResult?.failed || 0 }}</div>
                <div class="stat-label">失败</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card duplicate">
                <div class="stat-value">{{ importResult?.duplicate || 0 }}</div>
                <div class="stat-label">重复</div>
              </div>
            </el-col>
          </el-row>
        </div>

        <div v-if="importResult && (importResult.errorList.length > 0 || importResult.duplicateList.length > 0)" class="error-detail">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="错误数据" name="error">
              <el-table v-if="importResult.errorList.length > 0" :data="importResult.errorList" border max-height="300">
                <el-table-column prop="row" label="行号" width="80" align="center" />
                <el-table-column label="错误信息">
                  <template #default="{ row }">
                    <el-tag
                      v-for="(err, idx) in row.errors"
                      :key="idx"
                      type="danger"
                      effect="light"
                      style="margin-right: 4px; margin-bottom: 4px"
                    >
                      {{ getFieldLabel(err.field) }}: {{ err.message }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="原始数据">
                  <template #default="{ row }">
                    <span class="raw-data">{{ JSON.stringify(row.data) }}</span>
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-else description="暂无错误数据" />
            </el-tab-pane>
            <el-tab-pane label="重复数据" name="duplicate">
              <el-table v-if="importResult.duplicateList.length > 0" :data="importResult.duplicateList" border max-height="300">
                <el-table-column prop="row" label="行号" width="80" align="center" />
                <el-table-column prop="customer_name" label="客户名称" />
                <el-table-column prop="id_card" label="身份证号" />
                <el-table-column prop="reason" label="原因" />
              </el-table>
              <el-empty v-else description="暂无重复数据" />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>

    <template #footer>
      <template v-if="step === 1">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :disabled="!fileData" @click="handleStartImport">
          开始导入
        </el-button>
      </template>
      <template v-else-if="step === 2">
        <el-button disabled>导入中...</el-button>
      </template>
      <template v-else-if="step === 3">
        <el-button @click="handleReset">重新导入</el-button>
        <el-button
          v-if="importResult && (importResult.errorList.length > 0 || importResult.duplicateList.length > 0)"
          @click="exportErrorReport"
        >
          导出错误报表
        </el-button>
        <el-button type="primary" @click="handleDone">完成</el-button>
      </template>
    </template>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Download, Loading } from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import * as customerApi from '@/api/customerAsset'
import type { IBatchImportResult } from '@/types/api'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'success': []
}>()

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const step = ref(1)
const fileData = ref<any[] | null>(null)
const fileName = ref('')
const currentProgress = ref(0)
const totalData = ref(0)
const importResult = ref<IBatchImportResult | null>(null)
const activeTab = ref('error')

const FIELD_LABEL_MAP: Record<string, string> = {
  customer_name: '客户名称',
  customerName: '客户名称',
  id_card: '身份证号',
  idCard: '身份证号',
  phone: '联系电话',
  email: '电子邮箱',
  customer_type: '客户类型',
  customerType: '客户类型',
  institution_name: '机构名称',
  institutionName: '机构名称',
  unified_social_credit: '统一社会信用代码',
  unifiedSocialCredit: '统一社会信用代码',
  legal_representative: '法人代表',
  legalRepresentative: '法人代表',
  legal_rep_id_card: '法人身份证',
  legalRepIdCard: '法人身份证',
  risk_level: '风险等级',
  riskLevel: '风险等级',
  initial_deposit: '初始存款',
  initialDeposit: '初始存款',
  total_asset: '总资产',
  totalAsset: '总资产',
  filing_status: '备案状态',
  filingStatus: '备案状态',
  account_status: '账户状态',
  accountStatus: '账户状态',
  system: '系统',
}

const resultIcon = computed(() => {
  if (!importResult.value) return 'info'
  if (importResult.value.success === importResult.value.total) return 'success'
  if (importResult.value.success === 0) return 'error'
  return 'warning'
})

const resultTitle = computed(() => {
  if (!importResult.value) return ''
  if (importResult.value.success === importResult.value.total) return '导入成功'
  if (importResult.value.success === 0) return '导入失败'
  return '导入完成（部分失败）'
})

const resultSubTitle = computed(() => {
  if (!importResult.value) return ''
  return `成功 ${importResult.value.success} 条，失败 ${importResult.value.failed} 条，重复 ${importResult.value.duplicate} 条`
})

function getFieldLabel(field: string): string {
  return FIELD_LABEL_MAP[field] || field
}

function handleFileChange(file: any) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      const data = JSON.parse(content)
      if (!Array.isArray(data)) {
        ElMessage.error('文件格式错误，请上传 JSON 数组格式的文件')
        return
      }
      if (data.length > 500) {
        ElMessage.error('单次最多导入 500 条数据')
        return
      }
      fileData.value = data
      fileName.value = file.name
      ElMessage.success(`已加载 ${data.length} 条数据`)
    } catch {
      ElMessage.error('文件解析失败，请检查 JSON 格式')
    }
  }
  reader.readAsText(file.raw)
}

function downloadTemplate() {
  const template = [
    {
      customer_name: '张三',
      customer_type: 'individual',
      id_card: '110101199001011234',
      phone: '13800138000',
      email: 'zhangsan@example.com',
      filing_status: 'filed',
      account_status: 'opened',
      risk_level: 'R2',
      initial_deposit: 100000,
    },
    {
      customer_name: '示例机构有限公司',
      customer_type: 'institution',
      id_card: '91110101MA00123456',
      institution_name: '示例机构有限公司',
      unified_social_credit: '91110101MA00123456',
      legal_representative: '李四',
      legal_rep_id_card: '110101198001014321',
      phone: '13900139000',
      filing_status: 'filed',
      account_status: 'opened',
      risk_level: 'R3',
      initial_deposit: 500000,
    },
  ]
  const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '客户建档导入模板.json'
  link.click()
  URL.revokeObjectURL(url)
}

async function handleStartImport() {
  if (!fileData.value) {
    ElMessage.warning('请先上传文件')
    return
  }
  step.value = 2
  totalData.value = fileData.value.length
  currentProgress.value = 0

  const batchSize = 50
  const result: IBatchImportResult = {
    total: fileData.value.length,
    success: 0,
    failed: 0,
    duplicate: 0,
    successList: [],
    errorList: [],
    duplicateList: [],
  }

  for (let i = 0; i < fileData.value.length; i += batchSize) {
    const batch = fileData.value.slice(i, i + batchSize)
    try {
      const res = await customerApi.batchImport(batch)
      if (res.code === 0) {
        result.success += res.data.success
        result.failed += res.data.failed
        result.duplicate += res.data.duplicate
        result.successList.push(...res.data.successList)
        result.errorList.push(...res.data.errorList)
        result.duplicateList.push(...res.data.duplicateList)
      } else {
        result.failed += batch.length
        batch.forEach((item: any, idx: number) => {
          result.errorList.push({
            row: i + idx + 1,
            data: item,
            errors: [{ field: 'system', message: res.message }],
            type: 'system',
          })
        })
      }
    } catch (err: any) {
      result.failed += batch.length
      batch.forEach((item: any, idx: number) => {
        result.errorList.push({
          row: i + idx + 1,
          data: item,
          errors: [{ field: 'system', message: err.message || '系统错误' }],
          type: 'system',
        })
      })
    }
    currentProgress.value = Math.min(i + batchSize, fileData.value.length)
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  importResult.value = result
  step.value = 3
  if (result.success > 0) {
    emit('success')
  }
}

function exportErrorReport() {
  if (!importResult.value) return
  const report = {
    exportTime: new Date().toISOString(),
    summary: {
      total: importResult.value.total,
      success: importResult.value.success,
      failed: importResult.value.failed,
      duplicate: importResult.value.duplicate,
    },
    errorList: importResult.value.errorList,
    duplicateList: importResult.value.duplicateList,
  }
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `客户建档导入错误报表_${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('错误报表已导出')
}

function handleReset() {
  step.value = 1
  fileData.value = null
  fileName.value = ''
  currentProgress.value = 0
  totalData.value = 0
  importResult.value = null
}

function handleDone() {
  visible.value = false
}

function handleClosed() {
  step.value = 1
  fileData.value = null
  fileName.value = ''
  currentProgress.value = 0
  totalData.value = 0
  importResult.value = null
}
</script>

<style lang="scss" scoped>
.import-container {
  min-height: 400px;

  .tip-alert {
    margin-bottom: 20px;
  }

  .upload-area {
    margin-bottom: 16px;
  }

  .template-link {
    text-align: right;
  }
}

.step-progress {
  padding: 40px 20px;

  .progress-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
    font-size: 14px;
    color: #606266;
  }

  .progress-tip {
    margin-top: 20px;
    text-align: center;
    color: #909399;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
}

.step-result {
  .result-summary {
    margin: 20px 0;

    .stat-card {
      padding: 16px;
      border-radius: 8px;
      text-align: center;

      &.total { background: #ecf5ff; }
      &.success { background: #f0f9eb; }
      &.failed { background: #fef0f0; }
      &.duplicate { background: #fdf6ec; }
    }

    .stat-value {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 14px;
      color: #606266;
    }
  }

  .error-detail {
    margin-top: 20px;
  }

  .raw-data {
    font-family: monospace;
    font-size: 12px;
    color: #606266;
    word-break: break-all;
  }
}
</style>
