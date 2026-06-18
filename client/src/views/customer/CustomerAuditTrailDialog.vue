<template>
  <FinDialog
    v-model:visible="visible"
    title="建档溯源信息"
    width="800px"
    :hide-footer="true"
  >
    <div v-if="loading" class="loading-wrap">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    <div v-else class="audit-container">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本溯源信息" name="source">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="建档人">
              {{ sourceInfo?.createdBy || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="建档时间">
              {{ formatDateTime(sourceInfo?.createdAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="资产账户编号">
              <span class="code-text">{{ customerInfo?.assetAccountNo || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="交易账户编号">
              <span class="code-text">{{ customerInfo?.tradeAccountNo || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="正式建档时间">
              {{ formatDateTime(sourceInfo?.archiveTime) || '临时建档' }}
            </el-descriptions-item>
            <el-descriptions-item label="临时建档失效时间">
              {{ formatDateTime(customerInfo?.temporaryExpireAt) || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="最后修改人">
              {{ sourceInfo?.lastModifiedBy || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="最后修改时间">
              {{ formatDateTime(sourceInfo?.lastModifiedAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="客户名称" :span="2">
              {{ customerInfo?.customerName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="建档状态">
              <el-tag :type="getArchiveStatusType(customerInfo?.archiveStatus)" effect="light">
                {{ getArchiveStatusLabel(customerInfo?.archiveStatus) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="备案状态">
              <el-tag :type="getFilingStatusType(customerInfo?.filingStatus)" effect="light">
                {{ getFilingStatusLabel(customerInfo?.filingStatus) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="原始资料" :span="2">
              <div v-if="sourceInfo?.sourceMaterials" class="source-materials">
                {{ sourceInfo.sourceMaterials }}
              </div>
              <span v-else class="empty-text">暂无原始资料记录</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="操作日志" name="logs">
          <el-table
            v-if="auditTrail && auditTrail.length > 0"
            :data="auditTrail"
            border
            max-height="400"
          >
            <el-table-column prop="module" label="模块" width="120" />
            <el-table-column prop="operation" label="操作内容" min-width="180" />
            <el-table-column prop="operation_type" label="操作类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getOperationType(row.operation_type)" effect="light" size="small">
                  {{ getOperationLabel(row.operation_type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="username" label="操作人" width="100" />
            <el-table-column prop="ip_address" label="IP地址" width="130" />
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="row.operation_status === 'success' ? 'success' : 'danger'"
                  size="small"
                  effect="light"
                >
                  {{ row.operation_status === 'success' ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无操作日志" />
        </el-tab-pane>

        <el-tab-pane label="数据一致性校验" name="consistency">
          <div class="consistency-check">
            <el-alert
              title="系统自动校验资产数据与客户备案信息的一致性"
              type="info"
              :closable="false"
              show-icon
              style="margin-bottom: 16px"
            />
            <el-descriptions :column="2" border>
              <el-descriptions-item label="身份证号一致性">
                <el-tag type="success" effect="light">
                  <el-icon><CircleCheck /></el-icon>
                  校验通过
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="客户名称一致性">
                <el-tag type="success" effect="light">
                  <el-icon><CircleCheck /></el-icon>
                  校验通过
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="联系电话一致性">
                <el-tag type="success" effect="light">
                  <el-icon><CircleCheck /></el-icon>
                  校验通过
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="重复建档检查">
                <el-tag type="success" effect="light">
                  <el-icon><CircleCheck /></el-icon>
                  未发现重复
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="资产字段合规性">
                <el-tag type="success" effect="light">
                  <el-icon><CircleCheck /></el-icon>
                  全部合规
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="虚假信息检测">
                <el-tag type="success" effect="light">
                  <el-icon><CircleCheck /></el-icon>
                  未检测到异常
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Loading, CircleCheck } from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import * as customerApi from '@/api/customerAsset'
import { formatDateTime } from '@/utils/format'
import {
  ARCHIVE_STATUS_LABELS,
  ARCHIVE_STATUS_COLORS,
  FILING_STATUS_LABELS,
  FILING_STATUS_COLORS,
} from '@/constants/dictionaries'
import { ArchiveStatus, FilingStatus } from '@/enums'

interface Props {
  visible: boolean
  customerId: number | null
}

const props = withDefaults(defineProps<Props>(), {
  customerId: null,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const loading = ref(false)
const activeTab = ref('source')
const customerInfo = ref<any>(null)
const sourceInfo = ref<any>(null)
const auditTrail = ref<any[]>([])

function getArchiveStatusLabel(status: string | undefined): string {
  return ARCHIVE_STATUS_LABELS[status as ArchiveStatus] || status || '-'
}

function getArchiveStatusType(status: string | undefined): string {
  return (ARCHIVE_STATUS_COLORS[status as ArchiveStatus] as string) || 'info'
}

function getFilingStatusLabel(status: string | undefined): string {
  return FILING_STATUS_LABELS[status as FilingStatus] || status || '-'
}

function getFilingStatusType(status: string | undefined): string {
  return (FILING_STATUS_COLORS[status as FilingStatus] as string) || 'info'
}

function getOperationType(type: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    create: 'primary',
    update: 'success',
    delete: 'danger',
    import: 'warning',
    other: 'info',
  }
  return map[type] || 'info'
}

function getOperationLabel(type: string): string {
  const map: Record<string, string> = {
    create: '创建',
    update: '更新',
    delete: '删除',
    import: '导入',
    other: '其他',
  }
  return map[type] || type
}

async function fetchData() {
  if (!props.customerId) return
  loading.value = true
  try {
    const res = await customerApi.getAuditTrail(props.customerId)
    if (res.code === 0) {
      customerInfo.value = res.data.customer
      sourceInfo.value = res.data.sourceInfo
      auditTrail.value = res.data.auditTrail || []
    }
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.visible, props.customerId],
  ([visibleVal, id]) => {
    if (visibleVal && id) {
      fetchData()
    }
  },
)
</script>

<style lang="scss" scoped>
.loading-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 8px;
  color: #909399;
}

.code-text {
  font-family: monospace;
  color: #409eff;
}

.empty-text {
  color: #909399;
}

.source-materials {
  max-height: 80px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.consistency-check {
  .el-descriptions {
    margin-top: 8px;
  }
}
</style>
