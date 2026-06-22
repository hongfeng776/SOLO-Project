<template>
  <FinDialog
    v-model:visible="visible"
    title="股票状态运维面板"
    width="920px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div class="ops-panel-wrapper">
      <div class="switch-tabs">
        <div class="tabs-inner">
          <div
            class="tab-item"
          :class="{ active: currentPanel === 'manual' }"
          @click="switchPanel('manual')"
        >
          <el-icon><Refresh /></el-icon>
          <span>手动状态更新</span>
        </div>
        <div
          class="tab-item"
          :class="{ active: currentPanel === 'auto' }"
          @click="switchPanel('auto')"
        >
          <el-icon><MagicStick /></el-icon>
          <span>公告自动同步</span>
        </div>
        <div
          class="tab-underline"
          :style="underlineStyle"
        ></div>
      </div>
      </div>

      <div :class="['panel-container', currentPanel === 'manual' ? 'slide-manual' : 'slide-auto']">
        <div class="panel-slide">
          <div class="panel-content">
            <el-form
              ref="manualFormRef"
              :model="manualFormData"
              :rules="manualFormRules"
              label-width="120px"
              class="manual-form"
            >
              <el-divider content-position="left">股票状态变更</el-divider>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="股票代码" prop="stockCode">
                    <div class="focus-change-color">
                      <el-input
                        v-model="manualFormData.stockCode"
                        placeholder="请输入股票代码"
                        @blur="handleStockCodeBlur"
                      />
                    </div>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="股票名称">
                    <el-input
                      v-model="manualFormData.stockName"
                      placeholder="自动填充"
                      disabled
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="当前状态">
                    <el-tag
                      v-if="currentStockStatus"
                      :type="STOCK_PRODUCT_STATUS_TAG_TYPES[currentStockStatus as StockProductStatus]"
                    >
                      {{ STOCK_PRODUCT_STATUS_LABELS[currentStockStatus as StockProductStatus] }}
                    </el-tag>
                    <span v-else class="text-muted">未查询</span>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="目标状态" prop="targetStatus">
                    <div class="focus-change-color">
                      <el-select
                        v-model="manualFormData.targetStatus"
                        placeholder="请选择目标状态"
                        style="width: 100%"
                      >
                        <el-option
                          v-for="(label, value) in STOCK_PRODUCT_STATUS_LABELS"
                          :key="value"
                          :label="label"
                          :value="value"
                          :disabled="isTransitionDisabled(value)"
                        />
                      </el-select>
                    </div>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="数据来源">
                    <el-input
                      v-model="manualFormData.syncSource"
                      disabled
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="公告编号">
                    <div class="focus-change-color">
                      <el-input
                        v-model="manualFormData.announcementCode"
                        placeholder="可选，填写后自动校验公告"
                        @blur="handleAnnouncementBlur"
                      />
                    </div>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="生效时间" prop="effectiveTime">
                    <div class="focus-change-color">
                      <el-date-picker
                        v-model="manualFormData.effectiveTime"
                        type="datetime"
                        placeholder="请选择生效时间"
                        style="width: 100%"
                        value-format="YYYY-MM-DD HH:mm:ss"
                      />
                    </div>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="备注">
                    <div class="focus-change-color">
                      <el-input
                        v-model="manualFormData.remark"
                        type="textarea"
                        :rows="1"
                        placeholder="请输入备注"
                      />
                    </div>
                  </el-form-item>
                </el-col>
              </el-row>

              <div class="validate-section">
                <el-button
                  type="primary"
                  plain
                  :loading="validating"
                  :icon="Loading"
                  @click="handleValidate"
                >
                  前置校验
                </el-button>

                <div v-if="validationTriggered" class="validate-result">
                  <div class="validate-item">
                    <el-icon :class="validationResult.permissionValid ? 'icon-success' : 'icon-error'">
                      <CircleCheckFilled v-if="validationResult.permissionValid" />
                      <CircleCloseFilled v-else />
                    </el-icon>
                    <span>运维权限校验</span>
                    <span class="msg">{{ validationResult.permissionMessage || (validationResult.permissionValid ? '权限校验通过' : '无运维权限') }}</span>
                  </div>
                  <div class="validate-item">
                    <el-icon :class="validationResult.currentStatusValid ? 'icon-success' : 'icon-error'">
                      <CircleCheckFilled v-if="validationResult.currentStatusValid" />
                      <CircleCloseFilled v-else />
                    </el-icon>
                    <span>当前状态校验</span>
                    <span class="msg">{{ validationResult.currentStatusMessage || (validationResult.currentStatusValid ? '状态可变更' : '当前状态不允许变更') }}</span>
                  </div>
                  <div class="validate-item">
                    <el-icon :class="announcementCheckPassed ? 'icon-success' : 'icon-warning'">
                      <CircleCheckFilled v-if="announcementCheckPassed" />
                      <CircleCloseFilled v-else />
                    </el-icon>
                    <span>公告信息校验</span>
                    <span class="msg">{{ validationResult.announcementMessage || (announcementCheckPassed ? '公告已匹配' : '未提供公告依据') }}</span>
                  </div>
                </div>
              </div>
            </el-form>
          </div>
        </div>

        <div class="panel-slide">
          <div class="panel-content">
            <div class="sync-header">
              <div class="sync-title">
                <el-icon class="icon-info"><MagicStick /></el-icon>
                <span>待同步公告列表</span>
                <el-tag type="info" size="small">{{ unsyncedAnnouncements.length }} 条</el-tag>
              </div>
              <div class="sync-actions">
                <el-button
                  type="primary"
                  :icon="Refresh"
                  :loading="syncingAll"
                  @click="handleSyncAll"
                >
                  一键同步全部
                </el-button>
                <el-button
                  :icon="Refresh"
                  @click="loadUnsyncedAnnouncements"
                >
                  刷新列表
                </el-button>
              </div>
            </div>

            <el-table
              v-loading="loadingAnnouncements"
              :data="unsyncedAnnouncements"
              border
              stripe
              class="announcement-table"
              max-height="480px"
            >
              <el-table-column prop="announcementCode" label="公告编号" width="180" />
              <el-table-column prop="announcementTitle" label="公告标题" min-width="220" show-overflow-tooltip />
              <el-table-column label="交易所" width="100">
                <template #default="{ row }">
                  {{ STOCK_STATUS_SYNC_SOURCE_LABELS[row.exchange as StockStatusSyncSource] || row.exchange }}
                </template>
              </el-table-column>
              <el-table-column prop="stockCode" label="股票代码" width="100" />
              <el-table-column prop="stockName" label="股票名称" width="120" />
              <el-table-column prop="publishTime" label="发布时间" width="160" />
              <el-table-column label="目标状态" width="100">
                <template #default="{ row }">
                  <el-tag
                    :type="STOCK_PRODUCT_STATUS_TAG_TYPES[row.targetStatus as StockProductStatus]">
                    {{ STOCK_PRODUCT_STATUS_LABELS[row.targetStatus as StockProductStatus] }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" fixed="right">
                <template #default="{ row }">
                  <el-button
                    type="primary"
                    link
                    :loading="rowSyncing[row.id]"
                    @click="handleSyncRow(row)"
                  >
                    同步
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <el-empty v-if="!loadingAnnouncements && unsyncedAnnouncements.length === 0" description="暂无待同步公告" />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="footer-actions">
        <template v-if="currentPanel === 'manual'">
          <el-button @click="visible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="executing"
            :disabled="!validationTriggered && !validationResult.canChange"
            @click="handleExecuteChange"
          >
            {{ executing ? '执行中...' : '确认执行' }}
          </el-button>
        </template>
        <template v-else>
          <el-button @click="visible = false">关闭</el-button>
        </template>
      </div>
    </template>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, nextTick } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Loading, CircleCheckFilled, CircleCloseFilled, MagicStick, Refresh, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import {
  STOCK_PRODUCT_STATUS_LABELS,
  STOCK_PRODUCT_STATUS_TAG_TYPES,
  STOCK_STATUS_SYNC_SOURCE_LABELS,
  STOCK_STATUS_TRANSITION_RULES,
} from '@/constants/dictionaries'
import { StockProductStatus, StockStatusSyncSource, StockStatusChangeType } from '@/enums'
import * as statusSyncApi from '@/api/stockStatusSync'
import { IStockStatusAnnouncement, IStockStatusValidateResult } from '@/types/api'

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

type PanelType = 'manual' | 'auto'

const currentPanel = ref<PanelType>('manual')
const manualFormRef = ref<FormInstance>()
const validating = ref(false)
const executing = ref(false)
const loadingAnnouncements = ref(false)
const syncingAll = ref(false)
const rowSyncing = reactive<Record<number, boolean>>({})

const currentStockStatus = ref<string>('')
const validationTriggered = ref(false)

const validationResult = reactive<IStockStatusValidateResult>({
  valid: true,
  permissionValid: true,
  permissionMessage: '',
  currentStatusValid: true,
  currentStatusMessage: '',
  announcementExist: false,
  announcementMessage: '',
  announcementMatched: false,
  canChange: false,
  blockReason: '',
  allowedTransitions: [],
})

const defaultManualFormData = {
  stockCode: '',
  stockName: '',
  targetStatus: '',
  syncSource: STOCK_STATUS_SYNC_SOURCE_LABELS[StockStatusSyncSource.MANUAL],
  announcementCode: '',
  effectiveTime: '',
  remark: '',
}

const manualFormData = ref({ ...defaultManualFormData })

const manualFormRules = computed<FormRules>(() => ({
  stockCode: [{ required: true, message: '请输入股票代码', trigger: 'blur' }],
  targetStatus: [{ required: true, message: '请选择目标状态', trigger: 'change' }],
  effectiveTime: [{ required: true, message: '请选择生效时间', trigger: 'change' }],
}))

const unsyncedAnnouncements = ref<IStockStatusAnnouncement[]>([])

const isHighRiskStatus = computed(() => {
  const status = manualFormData.value.targetStatus
  return status === StockProductStatus.DELISTED || status === StockProductStatus.SUSPENDED
})

const announcementCheckPassed = computed(() => {
  if (manualFormData.value.announcementCode) {
    return validationResult.announcementExist && validationResult.announcementMatched
  }
  return !isHighRiskStatus.value
})

const underlineStyle = computed(() => {
  const width = '50%'
  const left = currentPanel.value === 'manual' ? '0%' : '50%'
  return {
    width,
    left,
  }
})

function isTransitionDisabled(targetValue: string) {
  if (!currentStockStatus.value) return false
  const allowed = STOCK_STATUS_TRANSITION_RULES[currentStockStatus.value] || []
  return !allowed.includes(targetValue)
}

function switchPanel(panel: PanelType) {
  currentPanel.value = panel
  if (panel === 'auto') {
    loadUnsyncedAnnouncements()
  }
}

async function handleStockCodeBlur() {
  const code = manualFormData.value.stockCode?.trim()
  if (!code) return
  try {
    const res = await statusSyncApi.syncLatestFromExchange(code)
    if (res.code === 0 && res.data) {
      manualFormData.value.stockName = res.data.stockName || ''
      currentStockStatus.value = res.data.targetStatus || ''
      if (res.data.announcementCode && !manualFormData.value.announcementCode) {
        manualFormData.value.announcementCode = res.data.announcementCode
      }
    }
  } catch {
  }
}

async function handleAnnouncementBlur() {
}

async function handleValidate() {
  if (!manualFormData.value.stockCode || !manualFormData.value.targetStatus) {
    ElMessage.warning('请先填写股票代码和目标状态')
    return
  }
  validating.value = true
  try {
    const res = await statusSyncApi.validateStatusChange({
      stockCode: manualFormData.value.stockCode,
      toStatus: manualFormData.value.targetStatus,
      syncSource: StockStatusSyncSource.MANUAL,
    })
    if (res.code === 0 && res.data) {
      Object.assign(validationResult, res.data)
      validationTriggered.value = true
      if (!validationResult.currentStatusValid && res.data.allowedTransitions?.length) {
        currentStockStatus.value = ''
      }
      if (!validationResult.canChange && validationResult.blockReason) {
        ElMessage.error(validationResult.blockReason)
      }
      if (isHighRiskStatus.value && !announcementCheckPassed.value) {
        ElMessage.error('状态变更无公告依据，自动拦截操作')
      }
    }
  } catch {
    ElMessage.error('前置校验失败，请稍后重试')
  } finally {
    validating.value = false
  }
}

async function handleExecuteChange() {
  if (executing.value) return
  if (!validationTriggered.value) {
    ElMessage.warning('请先执行前置校验')
    return
  }
  if (isHighRiskStatus.value && !announcementCheckPassed.value) {
    ElMessage.error('状态变更无公告依据，自动拦截操作')
    return
  }
  if (!validationResult.canChange) {
    ElMessage.error(validationResult.blockReason || '前置校验未通过')
    return
  }
  try {
    await manualFormRef.value?.validate()
  } catch {
    ElMessage.warning('请检查表单填写是否正确')
    return
  }
  executing.value = true
  try {
    const res = await statusSyncApi.executeStatusChange({
      stockCode: manualFormData.value.stockCode,
      fromStatus: currentStockStatus.value,
      toStatus: manualFormData.value.targetStatus,
      changeType: StockStatusChangeType.MANUAL_UPDATE,
      syncSource: StockStatusSyncSource.MANUAL,
      announcementId: manualFormData.value.announcementCode || undefined,
      effectiveTime: manualFormData.value.effectiveTime,
      remark: manualFormData.value.remark,
    })
    if (res.code === 0) {
      ElMessage.success('状态变更执行成功')
      emit('success')
      visible.value = false
    } else {
      ElMessage.error(res.message || '执行失败')
    }
  } catch (err: any) {
    ElMessage.error(err.message || '执行失败')
  } finally {
    executing.value = false
  }
}

async function loadUnsyncedAnnouncements() {
  loadingAnnouncements.value = true
  try {
    const res = await statusSyncApi.getUnsyncedAnnouncements()
    if (res.code === 0 && res.data) {
      unsyncedAnnouncements.value = res.data
    }
  } catch {
    ElMessage.error('加载公告列表失败')
  } finally {
    loadingAnnouncements.value = false
  }
}

async function handleSyncRow(row: IStockStatusAnnouncement) {
  rowSyncing[row.id] = true
  try {
    const res = await statusSyncApi.batchSyncAnnouncements({
      announcementIds: [String(row.id)]
    })
    if (res.code === 0) {
      ElMessage.success(`同步成功: ${row.stockCode} ${row.stockName}`)
      unsyncedAnnouncements.value = unsyncedAnnouncements.value.filter(item => item.id !== row.id)
      emit('success')
    } else {
      ElMessage.error(res.message || '同步失败')
    }
  } catch (err: any) {
    ElMessage.error(err.message || '同步失败')
  } finally {
    rowSyncing[row.id] = false
  }
}

async function handleSyncAll() {
  if (unsyncedAnnouncements.value.length === 0) {
    ElMessage.warning('暂无可同步的公告')
    return
  }
  syncingAll.value = true
  try {
    const ids = unsyncedAnnouncements.value.map(item => String(item.id))
    const res = await statusSyncApi.batchSyncAnnouncements({ announcementIds: ids })
    if (res.code === 0) {
      const data = res.data
      ElMessage.success(`批量同步完成：成功${data.success}条，失败${data.failed}条，跳过${data.skipped}条`)
      if (data.failed > 0 && data.errorList?.length) {
        data.errorList.forEach(err => {
          ElMessage.warning(`${err.stockCode} ${err.stockName}: ${err.errorMessage}`)
        })
      }
      unsyncedAnnouncements.value = []
      emit('success')
    } else {
      ElMessage.error(res.message || '批量同步失败')
    }
  } catch (err: any) {
    ElMessage.error(err.message || '批量同步失败')
  } finally {
    syncingAll.value = false
  }
}

function handleClosed() {
  manualFormData.value = { ...defaultManualFormData }
  currentStockStatus.value = ''
  validationTriggered.value = false
  Object.assign(validationResult, {
    valid: true,
    permissionValid: true,
    permissionMessage: '',
    currentStatusValid: true,
    currentStatusMessage: '',
    announcementExist: false,
    announcementMessage: '',
    announcementMatched: false,
    canChange: false,
    blockReason: '',
    allowedTransitions: [],
  })
  unsyncedAnnouncements.value = []
  manualFormRef.value?.clearValidate()
  nextTick(() => {
    currentPanel.value = 'manual'
  })
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      validationTriggered.value = false
      manualFormData.value = { ...defaultManualFormData }
      currentStockStatus.value = ''
      Object.assign(validationResult, {
        valid: true,
        permissionValid: true,
        permissionMessage: '',
        currentStatusValid: true,
        currentStatusMessage: '',
        announcementExist: false,
        announcementMessage: '',
        announcementMatched: false,
        canChange: false,
        blockReason: '',
        allowedTransitions: [],
      })
    }
  },
)
</script>

<style lang="scss" scoped>
.ops-panel-wrapper {
  .switch-tabs {
    position: relative;
    display: flex;
    margin-bottom: 24px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--fin-border, #ebeef5);

    .tabs-inner {
      position: relative;
      display: flex;
      width: 100%;
    }

    .tab-item {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 6px;
      width: 50%;
      justify-content: center;
      padding: 10px 0;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      color: var(--fin-text-secondary, #909399);
      transition: color 0.3s ease;

      .el-icon {
        font-size: 16px;
      }

      &.active {
        color: var(--fin-primary, #409EFF);
        font-weight: 600;
      }

      &:hover:not(.active) {
        color: var(--fin-text-primary, #303133);
      }
    }

    .tab-underline {
      position: absolute;
      bottom: -1px;
      height: 2px;
      background: var(--fin-primary, #409EFF);
      border-radius: 2px;
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
  }

  .panel-container {
    display: flex;
    overflow: hidden;
    transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);

    .panel-slide {
      min-width: 100%;
      transition: transform 0.4s ease;
    }

    &.slide-manual .panel-slide {
      transform: translateX(0%);
    }

    &.slide-auto .panel-slide {
      transform: translateX(-100%);
    }
  }

  .panel-content {
    padding: 0 8px;
  }
}

.focus-change-color {
  transition: all 0.2s ease;
  border-radius: 4px;
  overflow: hidden;

  &:focus-within {
    border-color: var(--fin-primary, #409EFF);
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
    background-color: #f0f7ff;
  }
}

.manual-form {
  .el-divider {
    margin-top: 0;
  }

  .text-muted {
    color: var(--fin-text-placeholder, #c0c4cc);
    font-size: 14px;
  }
}

.validate-section {
  margin-top: 16px;
  padding: 16px;
  background: var(--fin-bg-soft, #f5f7fa);
  border-radius: 8px;
  border: 1px solid var(--fin-border-light, #ebeef5);

  .validate-result {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .validate-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    padding: 6px 0;

    .icon-success {
      color: var(--el-color-success, #67C23A);
      font-size: 18px;
    }

    .icon-error {
      color: var(--el-color-danger, #F56C6C);
      font-size: 18px;
    }

    .icon-warning {
      color: var(--el-color-warning, #E6A23C);
      font-size: 18px;
    }

    .msg {
      margin-left: auto;
      color: var(--fin-text-secondary, #909399);
      font-size: 12px;
    }
  }
}

.sync-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .sync-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: var(--fin-text-primary, #303133);

    .icon-info {
      color: var(--fin-primary, #409EFF);
    }
  }

  .sync-actions {
    display: flex;
    gap: 8px;
  }
}

.announcement-table {
  margin-top: 12px;
}

.footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

:deep(.el-dialog__body) {
  padding: 0 24px 24px;
}
</style>
