<template>
  <el-dialog
    v-model="dialogVisible"
    title="商品准入溯源"
    width="800px"
    :close-on-click-modal="false"
  >
    <el-tabs v-model="activeTab" v-loading="loading">
      <el-tab-pane label="基本信息" name="basic">
        <div v-if="traceData && traceData.basicInfo" class="info-section">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="商品名称">
              {{ traceData.basicInfo.goodsName }}
            </el-descriptions-item>
            <el-descriptions-item label="准入状态">
              <el-tag :type="admissionStatusMap[traceData.basicInfo.admissionStatus ?? 0]?.type">
                {{ admissionStatusMap[traceData.basicInfo.admissionStatus ?? 0]?.label }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="商品类目ID">
              {{ traceData.basicInfo.categoryId ?? '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="所属商家ID">
              {{ traceData.basicInfo.merchantId ?? '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="原价">
              ¥{{ traceData.basicInfo.originalPrice?.toFixed(2) || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="活动价">
              ¥{{ traceData.basicInfo.activityPrice?.toFixed(2) || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="活动库存">
              {{ traceData.basicInfo.stock ?? '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="已售数量">
              {{ traceData.basicInfo.soldCount ?? 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="商品评级">
              <el-tag :type="getRatingType(traceData.basicInfo.complianceRating)">
                {{ getRatingLabel(traceData.basicInfo.complianceRating) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="商家信用分">
              <span :class="{ 'text-red': (traceData.basicInfo.merchantCreditScore ?? 100) < 60 }">
                {{ traceData.basicInfo.merchantCreditScore ?? '-' }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="报名时间">
              {{ traceData.basicInfo.applyTime ? formatDateTime(traceData.basicInfo.applyTime) : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="审核时间">
              {{ traceData.basicInfo.auditTime ? formatDateTime(traceData.basicInfo.auditTime) : '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-tab-pane>

      <el-tab-pane label="准入规则匹配" name="rules">
        <div v-if="traceData && traceData.ruleMatchDetails" class="rules-section">
          <el-table :data="traceData.ruleMatchDetails" border stripe>
            <el-table-column prop="ruleName" label="规则名称" min-width="150" />
            <el-table-column prop="ruleType" label="规则类型" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="getRuleType(row.ruleType)">
                  {{ getRuleTypeLabel(row.ruleType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="匹配结果" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.passed ? 'success' : 'danger'" size="small">
                  {{ row.passed ? '通过' : '未通过' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="ruleValue" label="规则阈值" width="120" align="center" />
            <el-table-column prop="actualValue" label="实际值" width="120" align="center" />
            <el-table-column prop="description" label="规则说明" min-width="200" show-overflow-tooltip />
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="操作日志" name="logs">
        <div class="logs-section">
          <el-table :data="logs.list" border stripe v-loading="logsLoading">
            <el-table-column prop="operatorName" label="操作人" width="100" align="center" />
            <el-table-column prop="actionType" label="操作类型" width="120" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="getActionType(row.actionType)">
                  {{ getActionTypeLabel(row.actionType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="fromStatus" label="变更前状态" width="110" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.fromStatus !== null" size="small" type="info">
                  {{ getStatusLabel(row.fromStatus) }}
                </el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="toStatus" label="变更后状态" width="110" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="getTagType(row.toStatus)">
                  {{ getStatusLabel(row.toStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="操作备注" min-width="200" show-overflow-tooltip />
            <el-table-column prop="createdAt" label="操作时间" width="160" align="center">
              <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
          <el-pagination
            v-model:current-page="logsPage"
            v-model:page-size="logsPageSize"
            :total="logs.total"
            layout="total, prev, pager, next, jumper"
            class="mt-12"
            background
            @current-change="loadLogs"
            @size-change="loadLogs"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="重复报名检测" name="duplicate">
        <div v-if="traceData && traceData.duplicateCheck" class="check-section">
          <el-alert
            :title="traceData.duplicateCheck.isDuplicate ? '存在重复报名' : '无重复报名'"
            :type="traceData.duplicateCheck.isDuplicate ? 'warning' : 'success'"
            :closable="false"
            show-icon
          />
          <div v-if="traceData.duplicateCheck.duplicateGoods && traceData.duplicateCheck.duplicateGoods.length > 0" class="mt-12">
            <h4>重复报名的活动：</h4>
            <el-table :data="traceData.duplicateCheck.duplicateGoods" border stripe class="mt-8">
              <el-table-column prop="marketingId" label="活动ID" width="80" align="center" />
              <el-table-column prop="marketingName" label="活动名称" min-width="200" />
              <el-table-column prop="applyTime" label="报名时间" width="160" align="center">
                <template #default="{ row }">{{ formatDateTime(row.applyTime) }}</template>
              </el-table-column>
              <el-table-column prop="admissionStatus" label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="getTagType(row.admissionStatus)">
                    {{ getStatusLabel(row.admissionStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="跨类目检测" name="crossCategory">
        <div v-if="traceData && traceData.crossCategoryCheck" class="check-section">
          <el-alert
            :title="traceData.crossCategoryCheck.isViolation ? '存在跨类目违规' : '类目匹配'"
            :type="traceData.crossCategoryCheck.isViolation ? 'error' : 'success'"
            :closable="false"
            show-icon
          />
          <div class="mt-12">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="活动类目ID" :span="2">
                {{ traceData.crossCategoryCheck.marketingCategoryIds || '全类目' }}
              </el-descriptions-item>
              <el-descriptions-item label="检测结果" :span="2">
                <el-tag :type="traceData.crossCategoryCheck.isViolation ? 'danger' : 'success'">
                  {{ traceData.crossCategoryCheck.isViolation ? '违规' : '正常' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="说明" :span="2">
                {{ traceData.crossCategoryCheck.message || '-' }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
          <div v-if="traceData.crossCategoryCheck.violationGoods && traceData.crossCategoryCheck.violationGoods.length > 0" class="mt-12">
            <h4>违规商品列表</h4>
            <el-table :data="traceData.crossCategoryCheck.violationGoods" border stripe>
              <el-table-column prop="goodsId" label="商品ID" width="80" align="center" />
              <el-table-column prop="goodsName" label="商品名称" min-width="200" />
              <el-table-column prop="categoryId" label="所属类目ID" width="100" align="center" />
            </el-table>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  getProductTraceData,
  getProductAdmissionLogs
} from '@/api/marketing'
import { MarketingProductAdmissionStatusMap } from '@/types/business'
import type { AdmissionTraceData, MarketingProductAdmissionLog } from '@/types/business'
import { formatDateTime } from '@/utils/date'
import type { PageResult } from '@/types/api'

const props = defineProps<{
  modelValue: boolean
  productId: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const activeTab = ref('basic')
const loading = ref(false)
const logsLoading = ref(false)
const traceData = ref<AdmissionTraceData | null>(null)
const logs = ref<PageResult<MarketingProductAdmissionLog>>({
  list: [],
  total: 0,
  pageNum: 1,
  pageSize: 10
})
const logsPage = ref(1)
const logsPageSize = ref(10)

const admissionStatusMap = MarketingProductAdmissionStatusMap

const loadTraceData = async () => {
  if (!props.productId) return

  loading.value = true
  try {
    const res = await getProductTraceData(props.productId)
    traceData.value = res.data
  } catch (err) {
    console.error('加载溯源数据失败', err)
  } finally {
    loading.value = false
  }
}

const loadLogs = async () => {
  if (!props.productId) return

  logsLoading.value = true
  try {
    const res = await getProductAdmissionLogs(props.productId, {
      pageNum: logsPage.value,
      pageSize: logsPageSize.value
    })
    logs.value = res.data
  } catch (err) {
    console.error('加载日志失败', err)
  } finally {
    logsLoading.value = false
  }
}

const getRatingLabel = (rating?: number) => {
  const labels: Record<number, string> = { 1: 'A级', 2: 'B级', 3: 'C级', 4: 'D级' }
  return labels[rating ?? 4] || '未知'
}

const getRatingType = (rating?: number): 'success' | 'primary' | 'warning' | 'danger' => {
  const types: Record<number, 'success' | 'primary' | 'warning' | 'danger'> = {
    1: 'success',
    2: 'primary',
    3: 'warning',
    4: 'danger'
  }
  return types[rating ?? 4] || 'info' as any
}

const getRuleType = (type?: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  const types: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    compliance_rating: 'danger',
    stock: 'warning',
    violation: 'danger',
    merchant_credit: 'warning',
    category: 'primary',
    price_range: 'success'
  }
  return types[type || ''] || 'info'
}

const getRuleTypeLabel = (type?: string) => {
  const labels: Record<string, string> = {
    compliance_rating: '商品评级',
    stock: '库存余量',
    violation: '违规记录',
    merchant_credit: '商家信用',
    category: '类目匹配',
    price_range: '价格区间'
  }
  return labels[type || ''] || '其他'
}

const getActionType = (type?: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  const types: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    apply: 'primary',
    audit_pass: 'success',
    audit_reject: 'danger',
    offline: 'warning',
    online: 'success',
    remove: 'danger',
    update: 'info'
  }
  return types[type || ''] || 'info'
}

const getActionTypeLabel = (type?: string) => {
  const labels: Record<string, string> = {
    apply: '商品报名',
    audit_pass: '审核通过',
    audit_reject: '审核驳回',
    offline: '活动下架',
    online: '重新上架',
    remove: '移除商品',
    update: '信息更新'
  }
  return labels[type || ''] || '其他'
}

const getStatusLabel = (status?: number | null) => {
  if (status === null || status === undefined) return '-'
  return MarketingProductAdmissionStatusMap[status as keyof typeof MarketingProductAdmissionStatusMap]?.label || '未知'
}

const getTagType = (status?: number | null): 'primary' | 'success' | 'danger' | 'warning' | 'info' => {
  if (status === null || status === undefined) return 'info'
  return MarketingProductAdmissionStatusMap[status as keyof typeof MarketingProductAdmissionStatusMap]?.type || 'info' as any
}

watch(() => props.modelValue, (val) => {
  if (val && props.productId) {
    loadTraceData()
    loadLogs()
  }
})

watch(() => props.productId, () => {
  if (dialogVisible.value && props.productId) {
    loadTraceData()
    loadLogs()
  }
})
</script>

<style lang="scss" scoped>
.info-section {
  .text-red {
    color: var(--el-color-danger);
  }
}

.rules-section,
.logs-section,
.check-section {
  min-height: 300px;
}

.mt-8 {
  margin-top: 8px;
}

.mt-12 {
  margin-top: 12px;
}

h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>
