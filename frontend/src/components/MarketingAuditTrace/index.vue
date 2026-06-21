<template>
  <div class="marketing-audit-trace">
    <div class="trace-header">
      <div class="header-info">
        <div class="campaign-badge" :style="{ background: sceneGradient }">
          <el-icon><Promotion /></el-icon>
        </div>
        <div class="info-text">
          <h3>{{ campaignName }}</h3>
          <p>活动ID：{{ campaignId }}</p>
        </div>
      </div>
      <div class="header-filters">
        <el-select
          v-model="filterAction"
          placeholder="操作类型"
          clearable
          size="default"
          style="width: 140px"
        >
          <el-option
            v-for="(label, key) in AuditActionMap"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
        <el-select
          v-model="filterRisk"
          placeholder="风险等级"
          clearable
          size="default"
          style="width: 120px"
        >
          <el-option
            v-for="(label, key) in RiskLevelMap"
            :key="key"
            :label="label"
            :value="Number(key)"
          />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="default"
          value-format="YYYY-MM-DD"
          style="width: 260px"
        />
        <el-button type="primary" @click="loadLogs">
          <el-icon><Search /></el-icon>
          筛选
        </el-button>
        <el-button @click="resetFilters">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </div>
    </div>

    <div class="trace-stats">
      <div v-for="stat in statsList" :key="stat.key" class="stat-card" :class="stat.key">
        <div class="stat-icon" :style="{ background: stat.gradient }">
          <el-icon><component :is="stat.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <h4>{{ stat.count }}</h4>
          <span>{{ stat.label }}</span>
        </div>
      </div>
    </div>

    <div class="trace-main" v-loading="loading">
      <el-empty v-if="logs.length === 0 && !loading" description="暂无操作记录" />

      <el-timeline v-else class="audit-timeline">
        <el-timeline-item
          v-for="(log, idx) in logs"
          :key="log.id"
          :timestamp="log.createTime"
          :type="getTimelineType(log.riskLevel)"
          :hollow="log.riskLevel === 0"
          size="large"
        >
          <div class="timeline-card" :class="`risk-${log.riskLevel}`">
            <div class="card-header">
              <div class="action-area">
                <div class="action-icon" :style="{ background: getActionColor(log.action) }">
                  <el-icon><component :is="getActionIcon(log.action)" /></el-icon>
                </div>
                <div class="action-info">
                  <h4 class="action-title">
                    {{ log.actionLabel }}
                    <el-tag
                      v-if="log.riskLevel > 0"
                      size="small"
                      :color="RiskLevelColorMap[log.riskLevel]"
                      effect="dark"
                      style="margin-left: 8px"
                    >
                      {{ log.riskLabel }}
                    </el-tag>
                  </h4>
                  <p v-if="log.actionDetail" class="action-detail">{{ log.actionDetail }}</p>
                </div>
              </div>
              <div class="meta-area">
                <el-tooltip :content="`操作人ID: ${log.operatorId}`">
                  <div class="operator">
                    <el-avatar :size="28" style="background: #409eff">
                      {{ log.operatorName?.charAt(0) || 'U' }}
                    </el-avatar>
                    <span>{{ log.operatorName }}</span>
                  </div>
                </el-tooltip>
                <span class="ip" v-if="log.ip">IP: {{ log.ip }}</span>
              </div>
            </div>

            <div v-if="log.diffFields && log.diffFields.length > 0" class="diff-section">
              <div class="section-label">
                <el-icon><Edit /></el-icon>
                <span>字段变更（{{ log.diffFields.length }}项）</span>
              </div>
              <div class="diff-table">
                <div
                  v-for="(d, di) in log.diffFields"
                  :key="di"
                  class="diff-row"
                >
                  <span class="diff-field">{{ d.fieldLabel }}</span>
                  <div class="diff-values">
                    <span class="diff-before" v-if="d.before">
                      <el-icon><ArrowLeft /></el-icon>
                      {{ formatDiffValue(d.before) }}
                    </span>
                    <el-icon class="diff-arrow"><Right /></el-icon>
                    <span class="diff-after">
                      {{ formatDiffValue(d.after) }}
                      <el-icon><ArrowRight /></el-icon>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="log.validateResult && (log.validateResult.errors.length > 0 || log.validateResult.warnings.length > 0)" class="validate-section">
              <div class="section-label">
                <el-icon><ClipboardCheck /></el-icon>
                <span>校验结果</span>
                <el-tag
                  size="small"
                  :type="log.validateResult.valid ? 'success' : 'danger'"
                >
                  {{ log.validateResult.valid ? '通过' : '未通过' }}
                </el-tag>
              </div>
              <div v-if="log.validateResult.errors.length" class="validate-errors">
                <div
                  v-for="(e, ei) in log.validateResult.errors.slice(0, 3)"
                  :key="ei"
                  class="validate-item error"
                >
                  <el-icon><CircleClose /></el-icon>
                  <span>{{ e.message }}</span>
                </div>
                <div
                  v-if="log.validateResult.errors.length > 3"
                  class="validate-more"
                >
                  ...还有 {{ log.validateResult.errors.length - 3 }} 项错误
                </div>
              </div>
              <div v-if="log.validateResult.warnings.length" class="validate-warnings">
                <div
                  v-for="(w, wi) in log.validateResult.warnings.slice(0, 2)"
                  :key="wi"
                  class="validate-item warning"
                >
                  <el-icon><Warning /></el-icon>
                  <span>{{ w.message }}</span>
                </div>
              </div>
            </div>

            <div v-if="log.remark" class="remark-section">
              <div class="section-label">
                <el-icon><ChatDotRound /></el-icon>
                <span>备注</span>
              </div>
              <div class="remark-text">{{ log.remark }}</div>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>

      <div v-if="total > pageSize" class="pagination-area">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="loadLogs"
          @current-change="loadLogs"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  Promotion, Search, Refresh, Edit, ArrowLeft, Right, ArrowRight,
  ClipboardCheck, CircleClose, Warning, ChatDotRound,
  Plus, EditPen, VideoPlay, VideoPause, Documents,
  Delete, Top, Bottom
} from '@element-plus/icons-vue'
import { getMarketingAuditApi } from '@/api/marketing'
import {
  CampaignScene,
  CampaignSceneGradientMap,
  AuditActionMap,
  RiskLevelMap,
  RiskLevelColorMap
} from '@/enums/marketing'
import type { MarketingAuditLog } from '@/types/marketing'
import { formatDate } from '@/utils/format'

const props = defineProps<{
  campaignId: number
  campaignName?: string
  scene?: number
}>()

const loading = ref(false)
const logs = ref<MarketingAuditLog[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const filterAction = ref('')
const filterRisk = ref<number | ''>('')
const dateRange = ref<string[]>([])

const sceneGradient = computed(() =>
  CampaignSceneGradientMap[props.scene as CampaignScene] || CampaignSceneGradientMap[CampaignScene.NEW_USER_GIFT]
)

const statsList = computed(() => {
  const createCount = logs.value.filter(l => l.action === 'create' || l.action === 'copy' || l.action === 'batch_copy').length
  const updateCount = logs.value.filter(l => l.action === 'update' || l.action === 'batch_update').length
  const onlineCount = logs.value.filter(l => l.action === 'online' || l.action === 'batch_online').length
  const riskCount = logs.value.filter(l => l.riskLevel >= 2).length
  return [
    { key: 'create', label: '创建/复制', count: createCount, icon: 'Plus', gradient: 'linear-gradient(135deg, #67c23a, #85ce61)' },
    { key: 'update', label: '修改记录', count: updateCount, icon: 'EditPen', gradient: 'linear-gradient(135deg, #409eff, #66b1ff)' },
    { key: 'online', label: '上下线操作', count: onlineCount, icon: 'VideoPlay', gradient: 'linear-gradient(135deg, #e6a23c, #f0c78a)' },
    { key: 'risk', label: '高风险拦截', count: riskCount, icon: 'Warning', gradient: 'linear-gradient(135deg, #f56c6c, #f78989)' }
  ]
})

const getTimelineType = (riskLevel: number) => {
  const map: Record<number, string> = { 0: '', 1: 'info', 2: 'warning', 3: 'danger' }
  return map[riskLevel] || 'primary'
}

const getActionColor = (action: string) => {
  const map: Record<string, string> = {
    create: 'linear-gradient(135deg, #67c23a, #85ce61)',
    update: 'linear-gradient(135deg, #409eff, #66b1ff)',
    online: 'linear-gradient(135deg, #67c23a, #85ce61)',
    batch_online: 'linear-gradient(135deg, #67c23a, #85ce61)',
    offline: 'linear-gradient(135deg, #909399, #a6a9ad)',
    batch_offline: 'linear-gradient(135deg, #909399, #a6a9ad)',
    copy: 'linear-gradient(135deg, #e6a23c, #f0c78a)',
    batch_copy: 'linear-gradient(135deg, #e6a23c, #f0c78a)',
    delete: 'linear-gradient(135deg, #f56c6c, #f78989)',
    validate: 'linear-gradient(135deg, #f56c6c, #f78989)',
    batch_update: 'linear-gradient(135deg, #409eff, #66b1ff)'
  }
  return map[action] || 'linear-gradient(135deg, #909399, #a6a9ad)'
}

const getActionIcon = (action: string) => {
  const map: Record<string, any> = {
    create: Plus,
    update: EditPen,
    online: VideoPlay,
    batch_online: Top,
    offline: VideoPause,
    batch_offline: Bottom,
    copy: Documents,
    batch_copy: Documents,
    delete: Delete,
    validate: Warning,
    batch_update: EditPen
  }
  return map[action] || EditPen
}

const formatDiffValue = (val: any) => {
  if (val === null || val === undefined) return '未设置'
  if (Array.isArray(val)) return val.length > 0 ? `${val.length}项配置` : '空'
  if (typeof val === 'object') return '已配置'
  if (typeof val === 'boolean') return val ? '是' : '否'
  return String(val)
}

const loadLogs = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: page.value,
      pageSize: pageSize.value
    }
    if (filterAction.value) params.action = filterAction.value
    if (filterRisk.value !== '') params.riskLevel = filterRisk.value
    if (dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await getMarketingAuditApi(props.campaignId, params)
    logs.value = res.data.list
    total.value = res.data.total
  } catch (e: any) {
    console.error('加载审计日志失败', e)
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filterAction.value = ''
  filterRisk.value = ''
  dateRange.value = []
  page.value = 1
  loadLogs()
}

watch(() => props.campaignId, () => {
  page.value = 1
  loadLogs()
})

onMounted(() => {
  loadLogs()
})
</script>

<style lang="scss" scoped>
.marketing-audit-trace {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 12px;

  .trace-header {
    background: #fff;
    border-radius: 12px;
    padding: 18px 20px;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    .header-info {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 14px;

      .campaign-badge {
        width: 52px;
        height: 52px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 26px;
      }

      .info-text {
        h3 {
          margin: 0 0 4px 0;
          font-size: 18px;
          color: #303133;
        }
        p {
          margin: 0;
          font-size: 13px;
          color: #909399;
        }
      }
    }

    .header-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      padding-top: 14px;
      border-top: 1px solid #f2f6fc;
    }
  }

  .trace-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 16px;

    .stat-card {
      background: #fff;
      border-radius: 10px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      transition: all 0.25s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
      }

      .stat-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 20px;
      }

      .stat-info {
        h4 {
          margin: 0 0 2px 0;
          font-size: 24px;
          font-weight: 700;
          color: #303133;
        }
        span {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .trace-main {
    background: #fff;
    border-radius: 12px;
    padding: 20px 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    min-height: 400px;
  }

  .audit-timeline {
    :deep(.el-timeline-item__timestamp) {
      color: #909399;
      font-size: 12px;
    }

    :deep(.el-timeline-item__wrapper) {
      padding-left: 24px;
    }
  }

  .timeline-card {
    background: #f9fafc;
    border-radius: 10px;
    padding: 18px 20px;
    border-left: 4px solid #ebeef5;
    transition: all 0.2s;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    &.risk-3 {
      border-left-color: #f56c6c;
      background: linear-gradient(135deg, #fef0f0 0%, #ffffff 100%);
    }
    &.risk-2 {
      border-left-color: #e6a23c;
      background: linear-gradient(135deg, #fdf6ec 0%, #ffffff 100%);
    }
    &.risk-1 {
      border-left-color: #909399;
      background: linear-gradient(135deg, #f4f4f5 0%, #ffffff 100%);
    }
    &.risk-0 {
      border-left-color: #67c23a;
      background: linear-gradient(135deg, #f0f9eb 0%, #ffffff 100%);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 14px;

      .action-area {
        display: flex;
        gap: 12px;

        .action-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 18px;
          flex-shrink: 0;
        }

        .action-info {
          .action-title {
            margin: 0 0 4px 0;
            font-size: 15px;
            font-weight: 600;
            color: #303133;
            display: flex;
            align-items: center;
          }
          .action-detail {
            margin: 0;
            font-size: 12px;
            color: #606266;
          }
        }
      }

      .meta-area {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 6px;

        .operator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #303133;
        }

        .ip {
          font-size: 11px;
          color: #c0c4cc;
        }
      }
    }

    .diff-section, .validate-section, .remark-section {
      margin-top: 14px;
      padding: 12px 14px;
      background: rgba(255, 255, 255, 0.7);
      border-radius: 8px;

      .section-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 600;
        color: #606266;
        margin-bottom: 10px;

        .el-icon {
          color: #409eff;
        }
      }
    }

    .diff-section {
      .diff-table {
        .diff-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px dashed #ebeef5;

          &:last-child { border-bottom: none; }

          .diff-field {
            width: 100px;
            flex-shrink: 0;
            font-size: 12px;
            color: #909399;
            padding-top: 4px;
          }

          .diff-values {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            font-size: 12px;

            .diff-before {
              padding: 4px 10px;
              background: #fef0f0;
              color: #f56c6c;
              border-radius: 4px;
              display: flex;
              align-items: center;
              gap: 4px;
            }

            .diff-arrow {
              color: #c0c4cc;
              font-size: 12px;
            }

            .diff-after {
              padding: 4px 10px;
              background: #f0f9eb;
              color: #67c23a;
              border-radius: 4px;
              display: flex;
              align-items: center;
              gap: 4px;
            }
          }
        }
      }
    }

    .validate-section {
      .validate-errors, .validate-warnings {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .validate-item {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 12px;
        line-height: 1.6;

        &.error {
          background: #fef0f0;
          color: #f56c6c;
          .el-icon { color: #f56c6c; }
        }

        &.warning {
          background: #fdf6ec;
          color: #e6a23c;
          .el-icon { color: #e6a23c; }
        }
      }

      .validate-more {
        margin-top: 6px;
        padding: 4px 10px;
        font-size: 11px;
        color: #909399;
        font-style: italic;
      }
    }

    .remark-section {
      .remark-text {
        font-size: 13px;
        color: #606266;
        padding: 8px 12px;
        background: #fff;
        border-radius: 6px;
        border-left: 3px solid #409eff;
      }
    }
  }

  .pagination-area {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #ebeef5;
    display: flex;
    justify-content: center;
  }
}
</style>
