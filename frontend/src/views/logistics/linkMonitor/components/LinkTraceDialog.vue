<template>
  <el-dialog
    v-model="dialogVisible"
    title="配送链路全溯源"
    width="1100px"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    class="link-trace-dialog"
    @open="handleOpen"
  >
    <el-tabs v-model="activeTab" class="trace-tabs">
      <el-tab-pane label="基本信息" name="basic">
        <el-row :gutter="20" v-if="traceData">
          <el-col :span="8">
            <el-card class="info-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-icon><Box /></el-icon>
                  <span>订单信息</span>
                </div>
              </template>
              <div class="info-item">
                <span class="label">订单号：</span>
                <span class="value">{{ traceData.order_info?.order_no || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">用户名：</span>
                <span class="value">{{ traceData.order_info?.user_name || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">收货人：</span>
                <span class="value">{{ traceData.order_info?.receiver_name || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">联系电话：</span>
                <span class="value">{{ traceData.order_info?.receiver_phone || '-' }}</span>
              </div>
              <div class="info-item full-width">
                <span class="label">收货地址：</span>
                <span class="value">{{ traceData.order_info?.receiver_province || '' }}{{ traceData.order_info?.receiver_city || '' }}{{ traceData.order_info?.receiver_district || '' }}{{ traceData.order_info?.receiver_address || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">订单金额：</span>
                <span class="value price">¥{{ traceData.order_info?.order_amount?.toFixed(2) || '0.00' }}</span>
              </div>
              <div class="info-item">
                <span class="label">下单时间：</span>
                <span class="value">{{ formatDate(traceData.order_info?.created_at) }}</span>
              </div>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card class="info-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-icon><Truck /></el-icon>
                  <span>物流信息</span>
                </div>
              </template>
              <div class="info-item">
                <span class="label">物流单号：</span>
                <span class="value">{{ traceData.shipment_info?.logistics_no || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">发货单号：</span>
                <span class="value">{{ traceData.shipment_info?.shipment_no || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">服务商：</span>
                <span class="value">{{ traceData.provider_info?.company_name || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">客服电话：</span>
                <span class="value">{{ traceData.provider_info?.service_phone || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">发货时间：</span>
                <span class="value">{{ formatDate(traceData.shipment_info?.ship_time) }}</span>
              </div>
              <div class="info-item">
                <span class="label">签收时间：</span>
                <span class="value">{{ formatDate(traceData.shipment_info?.sign_time) || '未签收' }}</span>
              </div>
              <div class="info-item" v-if="traceData.shipment_info?.is_abnormal === 1">
                <el-tag type="danger" effect="light">存在异常</el-tag>
              </div>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card class="info-card integrity-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-icon><DataAnalysis /></el-icon>
                  <span>链路完整性报告</span>
                </div>
              </template>
              <div class="integrity-score" v-if="traceData.integrity_report">
                <div class="score-circle" :class="getScoreClass(traceData.integrity_report.integrity_score)">
                  <span class="score-value">{{ traceData.integrity_report.integrity_score }}</span>
                  <span class="score-label">分</span>
                </div>
                <div class="score-level">
                  {{ getScoreLevel(traceData.integrity_report.integrity_score) }}
                </div>
              </div>
              <div class="integrity-stats" v-if="traceData.integrity_report">
                <div class="stat-item">
                  <span class="stat-value">{{ traceData.integrity_report.total_nodes }}</span>
                  <span class="stat-label">总节点数</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value text-warning">{{ traceData.integrity_report.missing_nodes.length }}</span>
                  <span class="stat-label">缺失节点</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value text-info">{{ traceData.integrity_report.duplicate_nodes }}</span>
                  <span class="stat-label">重复节点</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value text-danger">{{ traceData.integrity_report.fake_nodes }}</span>
                  <span class="stat-label">虚假节点</span>
                </div>
              </div>
              <div class="integrity-issues" v-if="traceData.integrity_report?.issues?.length > 0">
                <el-alert
                  v-for="(issue, index) in traceData.integrity_report.issues"
                  :key="index"
                  :title="issue"
                  type="warning"
                  :closable="false"
                  show-icon
                />
              </div>
              <div class="integrity-recommendations" v-if="traceData.integrity_report?.recommendations?.length > 0">
                <el-divider content-position="left" style="margin: 12px 0;">
                  <span class="recommend-title">改进建议</span>
                </el-divider>
                <ul class="recommend-list">
                  <li v-for="(rec, index) in traceData.integrity_report.recommendations" :key="index">
                    <el-icon><LightBulb /></el-icon>
                    {{ rec }}
                  </li>
                </ul>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="物流轨迹" name="track">
        <div v-if="traceData?.track_nodes?.length > 0" class="track-timeline">
          <el-steps
            :active="traceData.track_nodes.length"
            direction="vertical"
            class="trace-steps"
          >
            <el-step
              v-for="(node, index) in traceData.track_nodes"
              :key="node.id"
              :title="node.track_content"
              :description="getNodeDescription(node)"
              :icon="getNodeIcon(node)"
              :status="getNodeStatus(node)"
              class="step-item"
            >
              <template #extra>
                <div class="step-extra">
                  <el-tag
                    :type="TrackStatusMap[node.track_status]?.type || 'info'"
                    size="small"
                    effect="light"
                  >
                    {{ TrackStatusMap[node.track_status]?.label || '未知' }}
                  </el-tag>
                  <span class="step-time">{{ formatDate(node.track_time) }}</span>
                </div>
              </template>
              <div class="step-detail" v-if="node.operator_name || node.city || node.is_suspicious || node.is_abnormal">
                <el-row :gutter="16">
                  <el-col :span="8" v-if="node.operator_name">
                    <div class="detail-item">
                      <span class="label">快递员：</span>
                      <span class="value">{{ node.operator_name }}</span>
                      <span v-if="node.operator_phone" class="phone">{{ node.operator_phone }}</span>
                    </div>
                  </el-col>
                  <el-col :span="8" v-if="node.city">
                    <div class="detail-item">
                      <span class="label">位置：</span>
                      <span class="value">{{ node.province || '' }}{{ node.city || '' }}{{ node.district || '' }}</span>
                    </div>
                  </el-col>
                  <el-col :span="8" v-if="node.branch_name">
                    <div class="detail-item">
                      <span class="label">网点：</span>
                      <span class="value">{{ node.branch_name }}</span>
                    </div>
                  </el-col>
                </el-row>
                <div class="node-badges" v-if="node.is_abnormal || node.is_suspicious || node.is_backfilled">
                  <el-tag v-if="node.is_abnormal" type="danger" size="small" effect="light">
                    异常节点
                  </el-tag>
                  <el-tag v-if="node.is_suspicious" type="warning" size="small" effect="light">
                    存疑：{{ node.suspicious_reason }}
                  </el-tag>
                  <el-tag v-if="node.is_backfilled" type="info" size="small" effect="light">
                    补录节点
                  </el-tag>
                  <el-tag
                    v-if="node.verification_status !== undefined"
                    :type="VerificationStatusMap[node.verification_status]?.type || 'info'"
                    size="small"
                    effect="light"
                  >
                    {{ VerificationStatusMap[node.verification_status]?.label || '待核验' }}
                  </el-tag>
                </div>
                <div class="node-meta" v-if="node.time_gap_hours !== undefined && node.time_gap_hours > 0">
                  <span class="meta-item">
                    <el-icon><Timer /></el-icon>
                    距上一节点：{{ node.time_gap_hours.toFixed(1) }}小时
                  </span>
                  <span v-if="node.created_by_name" class="meta-item">
                    <el-icon><User /></el-icon>
                    操作人：{{ node.created_by_name }}
                  </span>
                </div>
              </div>
            </el-step>
          </el-steps>
        </div>
        <el-empty v-else description="暂无轨迹数据" />
      </el-tab-pane>

      <el-tab-pane label="异常记录" name="abnormal">
        <div v-if="traceData?.abnormal_records?.length > 0" class="abnormal-records">
          <el-table :data="traceData.abnormal_records" border stripe>
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="abnormal_type" label="异常类型" width="120">
              <template #default="{ row }">
                <el-tag :type="AbnormalDetectionTypeMap[row.abnormal_type]?.type || 'info'" size="small">
                  {{ AbnormalDetectionTypeMap[row.abnormal_type]?.label || row.abnormal_type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="alert_level" label="告警等级" width="100">
              <template #default="{ row }">
                <el-tag :type="AlertLevelMap[row.alert_level]?.type || 'info'" size="small">
                  {{ AlertLevelMap[row.alert_level]?.label || '未知' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="abnormal_desc" label="异常描述" min-width="200" show-overflow-tooltip />
            <el-table-column prop="suggestion" label="处理建议" min-width="200" show-overflow-tooltip />
            <el-table-column prop="is_processed" label="处理状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.is_processed === 1 ? 'success' : 'warning'" size="small">
                  {{ row.is_processed === 1 ? '已处理' : '待处理' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="detected_by" label="检测方式" width="100">
              <template #default="{ row }">
                {{ row.detected_by === 'system_auto' ? '系统自动' : '人工标记' }}
              </template>
            </el-table-column>
            <el-table-column prop="detected_at" label="检测时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.detected_at) }}
              </template>
            </el-table-column>
            <el-table-column label="处理信息" min-width="200" v-if="traceData.work_orders?.length > 0">
              <template #default="{ row }">
                <div v-if="row.process_result">
                  <p>处理方式：{{ getProcessTypeText(row.process_result) }}</p>
                  <p>处理人：{{ row.processed_by_name }}</p>
                  <p>处理时间：{{ formatDate(row.processed_at) }}</p>
                </div>
                <span v-else class="text-gray">未处理</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <el-empty v-else description="暂无异常记录" />
      </el-tab-pane>

      <el-tab-pane label="运维工单" name="workorder">
        <div v-if="traceData?.work_orders?.length > 0" class="work-order-records">
          <el-table :data="traceData.work_orders" border stripe>
            <el-table-column prop="work_order_no" label="工单号" width="160" />
            <el-table-column prop="type" label="类型" width="120">
              <template #default="{ row }">
                <el-tag :type="WorkOrderTypeMap[row.type]?.type || 'info'" size="small">
                  {{ WorkOrderTypeMap[row.type]?.label || '未知' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="priority" label="优先级" width="100">
              <template #default="{ row }">
                <el-tag :type="WorkOrderPriorityMap[row.priority]?.type || 'info'" size="small">
                  {{ WorkOrderPriorityMap[row.priority]?.label || '未知' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="WorkOrderStatusMap[row.status]?.type || 'info'" size="small">
                  {{ WorkOrderStatusMap[row.status]?.label || '未知' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sla_expire_at" label="SLA到期" width="180">
              <template #default="{ row }">
                <span v-if="row.sla_expire_at" :class="{ 'sla-warning': isSlaExpiring(row.sla_expire_at) }">
                  {{ formatDate(row.sla_expire_at) }}
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="resolution" label="处理结果" min-width="150" show-overflow-tooltip />
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
        <el-empty v-else description="暂无工单记录" />
      </el-tab-pane>

      <el-tab-pane label="操作日志" name="logs">
        <div v-if="traceData?.operation_logs?.length > 0" class="operation-logs">
          <el-timeline>
            <el-timeline-item
              v-for="(log, index) in traceData.operation_logs"
              :key="index"
              :timestamp="formatDate(log.created_at)"
              placement="top"
            >
              <el-card shadow="hover">
                <h4>{{ log.log_type || '操作记录' }}</h4>
                <p v-if="log.content">{{ log.content }}</p>
                <p v-if="log.operator_name">操作人：{{ log.operator_name }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>
        <el-empty v-else description="暂无操作日志" />
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button type="primary" @click="handleRefresh" :loading="loading">
        <el-icon><Refresh /></el-icon> 刷新
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Box,
  Truck,
  DataAnalysis,
  LightBulb,
  Timer,
  User,
  Refresh,
  CircleCheck,
  CircleClose,
  WarningFilled,
} from '@element-plus/icons-vue'
import {
  getFullLinkTrace,
  LinkNodeVerificationStatusMap,
  type FullLinkTrace,
} from '@/api/logisticsLinkTrace'
import {
  TrackStatusMap,
  AbnormalDetectionTypeMap,
  AlertLevelMap,
} from '@/api/logisticsAbnormalMonitor'
import {
  WorkOrderTypeMap,
  WorkOrderPriorityMap,
  WorkOrderStatusMap,
} from '@/types/business'
import { formatDate } from '@/utils/date'

const props = defineProps<{
  visible: boolean
  shipmentId: number
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const activeTab = ref('basic')
const loading = ref(false)
const traceData = ref<FullLinkTrace | null>(null)

const VerificationStatusMap = LinkNodeVerificationStatusMap

const handleOpen = () => {
  if (props.shipmentId) {
    loadTraceData()
  }
}

const loadTraceData = async () => {
  loading.value = true
  try {
    const res = await getFullLinkTrace(props.shipmentId)
    if (res.code === 200) {
      traceData.value = res.data
    }
  } catch (error: any) {
    ElMessage.error(error.message || '加载溯源数据失败')
  } finally {
    loading.value = false
  }
}

const handleRefresh = () => {
  loadTraceData()
  ElMessage.success('刷新成功')
}

const handleClose = () => {
  dialogVisible.value = false
}

const getScoreClass = (score: number): string => {
  if (score >= 90) return 'score-excellent'
  if (score >= 70) return 'score-good'
  if (score >= 60) return 'score-warning'
  return 'score-danger'
}

const getScoreLevel = (score: number): string => {
  if (score >= 90) return '优秀'
  if (score >= 70) return '良好'
  if (score >= 60) return '及格'
  return '危险'
}

const getNodeDescription = (node: any): string => {
  const parts = []
  if (node.operator_name) parts.push(`快递员：${node.operator_name}`)
  if (node.city) parts.push(`位置：${node.city}`)
  if (node.branch_name) parts.push(`网点：${node.branch_name}`)
  return parts.join(' | ')
}

const getNodeIcon = (node: any): any => {
  if (node.is_abnormal) return WarningFilled
  if (node.is_suspicious) return WarningFilled
  return CircleCheck
}

const getNodeStatus = (node: any): string => {
  if (node.is_abnormal) return 'error'
  if (node.is_suspicious) return 'warning'
  return 'success'
}

const getProcessTypeText = (type: string): string => {
  const map: Record<string, string> = {
    resolved: '已解决',
    pending_confirm: '待用户确认',
    escalated: '已升级',
    false_alarm: '误报解除',
  }
  return map[type] || type
}

const isSlaExpiring = (time: string): boolean => {
  const expireTime = new Date(time).getTime()
  const now = Date.now()
  const remainingHours = (expireTime - now) / (1000 * 60 * 60)
  return remainingHours < 4
}

watch(() => props.visible, (val) => {
  if (!val) {
    activeTab.value = 'basic'
    traceData.value = null
  }
})
</script>

<style scoped lang="scss">
.link-trace-dialog {
  :deep(.el-dialog__body) {
    max-height: 700px;
    overflow-y: auto;
  }

  .trace-tabs {
    :deep(.el-tabs__content) {
      padding-top: 16px;
    }
  }

  .info-card {
    height: 100%;

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
    }

    .info-item {
      display: flex;
      padding: 6px 0;
      font-size: 13px;

      &.full-width {
        flex-direction: column;

        .label {
          margin-bottom: 4px;
        }

        .value {
          width: 100%;
        }
      }

      .label {
        width: 80px;
        color: #909399;
        flex-shrink: 0;
      }

      .value {
        color: #303133;
        flex: 1;

        &.price {
          color: #f56c6c;
          font-weight: 600;
        }

        &.phone {
          margin-left: 8px;
          color: #606266;
        }
      }
    }
  }

  .integrity-card {
    .integrity-score {
      text-align: center;
      margin-bottom: 20px;

      .score-circle {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        margin: 0 auto 10px;
        display: flex;
        align-items: baseline;
        justify-content: center;
        color: #fff;
        font-weight: bold;

        &.score-excellent {
          background: linear-gradient(135deg, #67c23a, #85ce61);
        }

        &.score-good {
          background: linear-gradient(135deg, #409eff, #66b1ff);
        }

        &.score-warning {
          background: linear-gradient(135deg, #e6a23c, #f0c78a);
        }

        &.score-danger {
          background: linear-gradient(135deg, #f56c6c, #f78989);
        }

        .score-value {
          font-size: 36px;
          line-height: 100px;
        }

        .score-label {
          font-size: 14px;
          margin-left: 4px;
        }
      }

      .score-level {
        font-size: 16px;
        font-weight: 600;
      }
    }

    .integrity-stats {
      display: flex;
      justify-content: space-around;
      margin-bottom: 16px;

      .stat-item {
        text-align: center;

        .stat-value {
          display: block;
          font-size: 24px;
          font-weight: bold;
          color: #303133;

          &.text-warning { color: #e6a23c; }
          &.text-danger { color: #f56c6c; }
          &.text-info { color: #909399; }
        }

        .stat-label {
          font-size: 12px;
          color: #909399;
        }
      }
    }

    .recommend-title {
      font-size: 13px;
      font-weight: 600;
    }

    .recommend-list {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        padding: 4px 0;
        font-size: 13px;
        color: #606266;

        .el-icon {
          color: #e6a23c;
          flex-shrink: 0;
          margin-top: 2px;
        }
      }
    }
  }

  .track-timeline {
    .trace-steps {
      :deep(.el-step) {
        padding-bottom: 24px;

        &:last-child {
          padding-bottom: 0;
        }

        .el-step__title {
          font-size: 14px;
          font-weight: 500;
          color: #303133;
        }

        .el-step__description {
          font-size: 12px;
          color: #909399;
          margin-top: 4px;
        }
      }

      .step-extra {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;

        .step-time {
          font-size: 12px;
          color: #909399;
        }
      }

      .step-detail {
        background-color: #f5f7fa;
        border-radius: 8px;
        padding: 12px 16px;
        margin-top: 8px;

        .detail-item {
          font-size: 13px;

          .label {
            color: #909399;
          }

          .value {
            color: #303133;
          }

          .phone {
            margin-left: 8px;
            color: #606266;
          }
        }

        .node-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .node-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px dashed #e4e7ed;

          .meta-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #606266;

            .el-icon {
              color: #409eff;
            }
          }
        }
      }
    }
  }

  .work-order-records {
    .sla-warning {
      color: #f56c6c;
      font-weight: 600;
    }
  }

  .operation-logs {
    :deep(.el-timeline-item__timestamp) {
      color: #909399;
    }

    h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 600;
    }

    p {
      margin: 4px 0;
      font-size: 13px;
      color: #606266;
    }
  }

  .text-gray {
    color: #909399;
  }
}
</style>
