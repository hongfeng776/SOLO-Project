<template>
  <el-dialog
    :model-value="modelValue"
    title="活动溯源详情"
    width="1000px"
    :close-on-click-modal="false"
    draggable
    @update:model-value="handleVisibleChange"
  >
    <el-tabs v-model="activeTab" v-loading="loading">
      <el-tab-pane label="基本信息" name="basic">
        <el-descriptions :column="2" border v-if="traceData">
          <el-descriptions-item label="活动名称">
            {{ traceData.basicInfo?.name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="活动类型">
            {{ MarketingTypeMap[traceData.basicInfo?.type] || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="活动状态">
            <el-tag :type="MarketingStatusMap[traceData.basicInfo?.status]?.type">
              {{ MarketingStatusMap[traceData.basicInfo?.status]?.label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="优惠类型">
            <el-tag v-if="DiscountTypeMap[traceData.basicInfo?.discountType]" :type="DiscountTypeMap[traceData.basicInfo?.discountType]?.type">
              {{ DiscountTypeMap[traceData.basicInfo?.discountType]?.label }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="使用门槛">
            ¥{{ traceData.basicInfo?.minAmount || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="优惠力度">
            <span v-if="traceData.basicInfo?.discountType === 2">
              {{ (traceData.basicInfo.discountValue * 10).toFixed(1) }}折
            </span>
            <span v-else>¥{{ traceData.basicInfo?.discountValue || 0 }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="发放数量">
            {{ traceData.basicInfo?.totalCount || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="已使用">
            {{ traceData.basicInfo?.usedCount || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">
            {{ formatDateTime(traceData.basicInfo?.startTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="结束时间">
            {{ formatDateTime(traceData.basicInfo?.endTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="适用类目">
            {{ traceData.basicInfo?.categoryIds || '全部' }}
          </el-descriptions-item>
          <el-descriptions-item label="参与商家">
            {{ traceData.basicInfo?.merchantIds || '全部' }}
          </el-descriptions-item>
          <el-descriptions-item label="是否违规" :span="2">
            <el-tag v-if="traceData.basicInfo?.isViolation === 1" type="danger">
              违规：{{ traceData.basicInfo?.violationRemark || '-' }}
            </el-tag>
            <span v-else>否</span>
          </el-descriptions-item>
          <el-descriptions-item label="活动规则" :span="2">
            <el-tooltip
              v-if="traceData.basicInfo?.description && traceData.basicInfo.description.length > 100"
              :content="traceData.basicInfo.description"
              placement="top"
            >
              <span class="long-text">
                {{ traceData.basicInfo.description.substring(0, 100) }}...
                <span class="view-more">查看完整</span>
              </span>
            </el-tooltip>
            <span v-else>{{ traceData.basicInfo?.description || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="创建人">
            {{ traceData.createLogs?.[0]?.operatorName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(traceData.createLogs?.[0]?.createdAt) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <el-tab-pane label="操作日志" name="logs">
        <el-timeline v-if="traceData && traceData.allLogs.length > 0">
          <el-timeline-item
            v-for="(log, index) in traceData.allLogs"
            :key="log.id"
            :timestamp="formatDateTime(log.createdAt)"
            :type="getTimelineType(log.action)"
            placement="top"
          >
            <el-card shadow="never" class="log-card">
              <div class="log-header">
                <span class="log-action">{{ log.action }}</span>
                <span class="log-operator">操作人：{{ log.operatorName || '系统' }}</span>
              </div>
              <div v-if="log.fieldName" class="log-content">
                <span class="log-field">字段：{{ log.fieldName }}</span>
                <div v-if="log.oldValue || log.newValue" class="log-change">
                  <div class="change-item">
                    <span class="change-label">原值：</span>
                    <el-tooltip v-if="log.oldValue && log.oldValue.length > 50" :content="log.oldValue" placement="top">
                      <span class="old-value">{{ log.oldValue.substring(0, 50) }}...</span>
                    </el-tooltip>
                    <span v-else class="old-value">{{ log.oldValue || '-' }}</span>
                  </div>
                  <div class="change-item">
                    <span class="change-label">新值：</span>
                    <el-tooltip v-if="log.newValue && log.newValue.length > 50" :content="log.newValue" placement="top">
                      <span class="new-value">{{ log.newValue.substring(0, 50) }}...</span>
                    </el-tooltip>
                    <span v-else class="new-value">{{ log.newValue || '-' }}</span>
                  </div>
                </div>
              </div>
              <div v-if="log.remark" class="log-remark">
                备注：{{ log.remark }}
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无操作日志" />
      </el-tab-pane>

      <el-tab-pane label="审核记录" name="audit">
        <el-table
          v-if="traceData && traceData.auditLogs.length > 0"
          :data="traceData.auditLogs"
          stripe
          border
        >
          <el-table-column prop="createdAt" label="审核时间" width="180" :formatter="formatDateTimeCell" />
          <el-table-column prop="operatorName" label="审核人" width="120" />
          <el-table-column prop="action" label="审核动作" width="120" />
          <el-table-column prop="fieldName" label="审核项" width="150" />
          <el-table-column prop="remark" label="审核备注">
            <template #default="{ row }">
              <el-tooltip v-if="row.remark && row.remark.length > 30" :content="row.remark" placement="top">
                <span>{{ row.remark.substring(0, 30) }}...</span>
              </el-tooltip>
              <span v-else>{{ row.remark || '-' }}</span>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无审核记录" />
      </el-tab-pane>

      <el-tab-pane label="参与商品台账" name="products">
        <el-table
          v-if="traceData && traceData.products.length > 0"
          :data="traceData.products"
          stripe
          border
        >
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="goodsName" label="商品名称" min-width="200">
            <template #default="{ row }">
              <el-tooltip v-if="row.goodsName && row.goodsName.length > 20" :content="row.goodsName" placement="top">
                <span>{{ row.goodsName.substring(0, 20) }}...</span>
              </el-tooltip>
              <span v-else>{{ row.goodsName }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="originalPrice" label="原价" width="120" :formatter="formatPrice" />
          <el-table-column prop="activityPrice" label="活动价" width="120" :formatter="formatPrice" />
          <el-table-column prop="stock" label="库存" width="100" />
          <el-table-column prop="soldCount" label="已售" width="100" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'">
                {{ row.status === 1 ? '已上架' : '已下架' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="加入时间" width="180" :formatter="formatDateTimeCell" />
        </el-table>
        <el-empty v-else description="暂无参与商品" />
      </el-tab-pane>

      <el-tab-pane label="状态变更记录" name="status">
        <el-table
          v-if="traceData && traceData.statusLogs.length > 0"
          :data="traceData.statusLogs"
          stripe
          border
        >
          <el-table-column prop="createdAt" label="变更时间" width="180" :formatter="formatDateTimeCell" />
          <el-table-column prop="operatorName" label="操作人" width="120" />
          <el-table-column prop="action" label="变更动作" width="150" />
          <el-table-column prop="oldValue" label="原状态" width="120">
            <template #default="{ row }">
              <span v-if="row.oldValue">
                {{ MarketingStatusMap[Number(row.oldValue)]?.label || row.oldValue }}
              </span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="newValue" label="新状态" width="120">
            <template #default="{ row }">
              <span v-if="row.newValue">
                {{ MarketingStatusMap[Number(row.newValue)]?.label || row.newValue }}
              </span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="变更原因">
            <template #default="{ row }">
              <el-tooltip v-if="row.remark && row.remark.length > 30" :content="row.remark" placement="top">
                <span>{{ row.remark.substring(0, 30) }}...</span>
              </el-tooltip>
              <span v-else>{{ row.remark || '-' }}</span>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无状态变更记录" />
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getMarketingTrace } from '@/api/marketing'
import type { MarketingTraceData } from '@/types/business'
import {
  MarketingTypeMap,
  MarketingStatusMap,
  DiscountTypeMap
} from '@/types/business'
import { formatDateTime as formatDateUtil } from '@/utils/date'

interface Props {
  modelValue: boolean
  marketingId: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
}>()

const loading = ref(false)
const activeTab = ref('basic')
const traceData = ref<MarketingTraceData | null>(null)

const formatDateTime = (val: string | Date | undefined) => {
  if (!val) return '-'
  return formatDateUtil(val)
}

const formatDateTimeCell = (_row: any, _column: any, cellValue: any) => {
  return formatDateTime(cellValue)
}

const formatPrice = (_row: any, _column: any, val: number) => {
  if (val === undefined || val === null) return '-'
  return `¥${val.toFixed(2)}`
}

const getTimelineType = (action: string) => {
  if (action.includes('创建') || action.includes('新增')) return 'primary'
  if (action.includes('审核') || action.includes('通过')) return 'success'
  if (action.includes('驳回') || action.includes('拒绝')) return 'danger'
  if (action.includes('修改') || action.includes('更新')) return 'warning'
  if (action.includes('状态') || action.includes('上线') || action.includes('下架')) return 'info'
  return 'primary'
}

const loadTraceData = async () => {
  if (!props.marketingId) return
  loading.value = true
  try {
    const res = await getMarketingTrace(props.marketingId)
    traceData.value = res.data
  } catch (err) {
    console.error('Load trace data error:', err)
  } finally {
    loading.value = false
  }
}

const handleVisibleChange = (val: boolean) => {
  emit('update:modelValue', val)
  if (val && props.marketingId) {
    activeTab.value = 'basic'
    loadTraceData()
  } else {
    traceData.value = null
  }
}

watch(
  () => props.modelValue,
  (val) => {
    if (val && props.marketingId) {
      activeTab.value = 'basic'
      loadTraceData()
    }
  }
)

watch(
  () => props.marketingId,
  (val) => {
    if (val && props.modelValue) {
      loadTraceData()
    }
  }
)

const handleClose = () => {
  emit('update:modelValue', false)
}
</script>

<style lang="scss" scoped>
.log-card {
  margin-bottom: 0;

  .log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .log-action {
      font-weight: 600;
      font-size: 14px;
      color: var(--el-text-color-primary);
    }

    .log-operator {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .log-content {
    margin-top: 8px;
    padding: 8px 12px;
    background: var(--el-fill-color-light);
    border-radius: 4px;

    .log-field {
      display: block;
      margin-bottom: 8px;
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }

    .log-change {
      .change-item {
        display: flex;
        align-items: flex-start;
        margin-top: 4px;
        font-size: 13px;

        .change-label {
          color: var(--el-text-color-secondary);
          flex-shrink: 0;
        }

        .old-value {
          color: var(--el-color-danger);
          text-decoration: line-through;
        }

        .new-value {
          color: var(--el-color-success);
        }
      }
    }
  }

  .log-remark {
    margin-top: 8px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    padding-top: 8px;
    border-top: 1px dashed var(--el-border-color-lighter);
  }
}

.long-text {
  .view-more {
    color: var(--el-color-primary);
    cursor: pointer;
    margin-left: 4px;
  }
}
</style>
