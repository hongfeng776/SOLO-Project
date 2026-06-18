<template>
  <div class="benefit-trace-panel">
    <div class="trace-summary" v-if="summary">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <el-avatar :size="48">{{ userInfo?.nickname?.charAt(0) || 'U' }}</el-avatar>
          <div>
            <div style="font-size: 16px; font-weight: 600;">{{ userInfo?.nickname || '未知用户' }}</div>
            <div style="font-size: 12px; color: #606266;">
              ID: {{ userInfo?.id }} &nbsp;·&nbsp; Lv.{{ userInfo?.userLevel }} &nbsp;·&nbsp; {{ userInfo?.phone || '-' }}
            </div>
          </div>
        </div>
        <div>
          <el-tag type="danger" v-if="abnormalItems.length > 0" class="badge-abnormal">
            <el-icon style="margin-right: 4px;"><WarningFilled /></el-icon>
            存在 {{ abnormalItems.length }} 项异常
          </el-tag>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px;">
        <div class="sum-item">
          <div class="sum-label">权益总数</div>
          <div class="sum-value">{{ summary.totalCount }}</div>
        </div>
        <div class="sum-item">
          <div class="sum-label">使用中</div>
          <div class="sum-value" style="color: #52c41a;">{{ summary.validCount }}</div>
        </div>
        <div class="sum-item">
          <div class="sum-label">已用完</div>
          <div class="sum-value" style="color: #722ed1;">{{ summary.usedCount }}</div>
        </div>
        <div class="sum-item">
          <div class="sum-label">已过期</div>
          <div class="sum-value" style="color: #909399;">{{ summary.expiredCount }}</div>
        </div>
        <div class="sum-item">
          <div class="sum-label">已作废</div>
          <div class="sum-value" style="color: #ff4d4f;">{{ summary.voidCount }}</div>
        </div>
        <div class="sum-item">
          <div class="sum-label">累计发放</div>
          <div class="sum-value" style="color: #faad14;">{{ summary.grantCount }}</div>
        </div>
      </div>

      <div v-if="abnormalItems.length > 0" style="margin-top: 14px;">
        <div
          v-for="(item, idx) in abnormalItems"
          :key="idx"
          style="padding: 8px 12px; background: #fff1f0; border-left: 3px solid #ff4d4f; margin-bottom: 6px; border-radius: 0 6px 6px 0;"
        >
          <el-icon color="#ff4d4f" style="margin-right: 6px; vertical-align: middle;"><WarningFilled /></el-icon>
          <span style="color: #cf1322; vertical-align: middle;">[{{ abnormalLabel(item.type) }}] {{ item.desc }}</span>
        </div>
      </div>
    </div>

    <div v-loading="loading" style="min-height: 200px;">
      <el-tabs>
        <el-tab-pane label="权益列表" name="benefits">
          <el-table
            v-if="benefits.length > 0"
            :data="benefits"
            size="small"
            border
            style="margin-bottom: 16px;"
          >
            <el-table-column label="ID" prop="id" width="60" />
            <el-table-column label="权益名称" min-width="160">
              <template #default="{ row }">
                <span style="font-weight: 500;">{{ row.benefitName }}</span>
                <div style="font-size: 11px; color: #909399;">编码: {{ row.benefitKey }}</div>
              </template>
            </el-table-column>
            <el-table-column label="类型" width="100">
              <template #default="{ row }">
                <el-tag size="small" :color="benefitTypeColor(row.benefitType)" effect="dark">
                  {{ benefitTypeLabel(row.benefitType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="额度" width="120">
              <template #default="{ row }">
                <span>
                  <b>{{ row.remainQuantity }}</b>/{{ row.totalQuantity }} {{ unitLabel(row.unitType) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="有效期" width="200">
              <template #default="{ row }">
                <span class="text-ellipsis-narrow" :title="formatRange(row.validFrom, row.validTo)">
                  {{ formatRange(row.validFrom, row.validTo) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="适用场景" min-width="160">
              <template #default="{ row }">
                <span class="text-ellipsis" :title="row.applyScenes">{{ row.applyScenes || '-' }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="流水记录" name="logs">
          <template v-if="logs.length > 0">
            <div
              v-for="(log, idx) in logs"
              :key="log.id || idx"
              :class="['log-row', { 'is-abnormal': log.isAbnormal }]"
            >
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <el-tag size="small" :color="actionColor(log.actionType)" effect="dark" style="margin-right: 8px;">
                    {{ actionLabel(log.actionType) }}
                  </el-tag>
                  <span style="font-weight: 500;">{{ log.actionName || actionLabel(log.actionType) }}</span>
                  <el-tag
                    v-if="log.isAbnormal"
                    size="small"
                    type="danger"
                    effect="light"
                    style="margin-left: 6px;"
                  >
                    <el-icon style="margin-right: 2px;"><WarningFilled /></el-icon>
                    {{ abnormalLabel(log.abnormalType) }}
                  </el-tag>
                </div>
                <span style="font-size: 12px; color: #909399;">{{ formatTime(log.createdAt) }}</span>
              </div>
              <div style="margin-top: 8px; font-size: 13px; color: #606266;">
                <template v-if="log.quantityChange !== 0">
                  数量变更:
                  <b :style="{ color: log.quantityChange > 0 ? '#52c41a' : '#ff4d4f' }">
                    {{ log.quantityChange > 0 ? '+' : '' }}{{ log.quantityChange }}
                  </b>
                  &nbsp;&nbsp;
                </template>
                <template v-if="log.beforeValue || log.afterValue">
                  <span class="text-ellipsis-narrow" :title="`${log.beforeValue} → ${log.afterValue}`">
                    <span style="text-decoration: line-through; color: #909399;">{{ log.beforeValue }}</span>
                    <span style="margin: 0 4px;">→</span>
                    <span style="color: #52c41a; font-weight: 600;">{{ log.afterValue }}</span>
                  </span>
                </template>
              </div>
              <div v-if="log.remark || log.abnormalDetail" style="margin-top: 6px; font-size: 12px; color: #909399;">
                <span v-if="log.remark" class="text-ellipsis" :title="log.remark">{{ log.remark }}</span>
                <span v-if="log.abnormalDetail" style="color: #ff4d4f;">{{ log.abnormalDetail }}</span>
              </div>
              <div v-if="log.operatorName" style="margin-top: 6px; font-size: 11px; color: #c0c4cc;">
                操作人: {{ log.operatorName }} ({{ log.operatorRole || '' }})
                <span v-if="log.batchNo" style="margin-left: 12px;">批次号: {{ log.batchNo }}</span>
              </div>
            </div>
          </template>
          <el-empty v-else description="暂无流水记录" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { WarningFilled } from '@element-plus/icons-vue'
import {
  BenefitTypeEnum,
  BenefitStatusEnum,
  BenefitUnitEnum,
  BenefitActionEnum,
  BenefitAbnormalEnum,
  getEnumLabel,
  getEnumColor
} from '@/utils/enums'
import { getBenefitTrace } from '@/api/benefit'

const props = defineProps({
  userId: [Number, String],
  benefitId: [Number, String]
})

const loading = ref(false)
const traceData = ref(null)

const userInfo = computed(() => traceData.value?.userInfo || null)
const summary = computed(() => traceData.value?.summary || null)
const benefits = computed(() => traceData.value?.benefits || [])
const logs = computed(() => traceData.value?.logs || [])
const abnormalItems = computed(() => traceData.value?.abnormalItems || [])

const benefitTypeLabel = (v) => getEnumLabel(BenefitTypeEnum, v)
const benefitTypeColor = (v) => getEnumColor(BenefitTypeEnum, v)
const statusLabel = (v) => getEnumLabel(BenefitStatusEnum, v)
const statusType = (v) => BenefitStatusEnum[Object.keys(BenefitStatusEnum).find(k => BenefitStatusEnum[k].value === v)]?.type || 'info'
const unitLabel = (v) => getEnumLabel(BenefitUnitEnum, v) || v
const actionLabel = (v) => getEnumLabel(BenefitActionEnum, v) || v
const actionColor = (v) => getEnumColor(BenefitActionEnum, v)
const abnormalLabel = (v) => getEnumLabel(BenefitAbnormalEnum, v) || v

const formatTime = (t) => t ? String(t).replace('T', ' ').substring(0, 19) : '-'
const formatRange = (f, t) => {
  const fmt = d => d ? String(d).substring(0, 10) : '-'
  return `${fmt(f)} 至 ${fmt(t)}`
}

const fetchData = async () => {
  if (!props.userId) return
  loading.value = true
  try {
    const res = await getBenefitTrace(props.userId, { benefitId: props.benefitId })
    traceData.value = res.data
  } catch (e) {
    traceData.value = null
  } finally {
    loading.value = false
  }
}

watch([() => props.userId, () => props.benefitId], () => { if (props.userId) fetchData() }, { immediate: true })
onMounted(() => { if (props.userId) fetchData() })
</script>
