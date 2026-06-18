<template>
  <div class="audit-timeline">
    <div class="timeline-summary">
      <div class="stat-item">
        <el-icon><Operation /></el-icon>
        <span>审核操作总数</span>
        <strong>{{ logs.length }}次</strong>
      </div>
      <div class="stat-item pass">
        <el-icon><CircleCheckFilled /></el-icon>
        <span>通过操作</span>
        <strong>{{ passCount }}次</strong>
      </div>
      <div class="stat-item reject">
        <el-icon><CircleCloseFilled /></el-icon>
        <span>驳回操作</span>
        <strong>{{ rejectCount }}次</strong>
      </div>
      <div class="stat-item abnormal">
        <el-icon><WarningFilled /></el-icon>
        <span>异常拦截</span>
        <strong>{{ interceptCount }}次</strong>
      </div>
    </div>

    <el-timeline>
      <el-timeline-item
        v-for="log in sortedLogs"
        :key="log.id"
        :timestamp="log.createTime"
        :type="getTimelineType(log.operationType)"
        :hollow="isHollow(log)"
        placement="top"
        size="large"
      >
        <div class="log-card">
          <div class="log-header">
            <div class="op-info">
              <el-tag
                effect="dark"
                :color="SettlementOperationTypeColorMap[log.operationType]"
                size="small"
              >
                {{ SettlementOperationTypeMap[log.operationType] || '--' }}
              </el-tag>
              <span class="op-name">{{ log.operatorName || '系统' }}</span>
              <span v-if="log.operatorRole" class="op-role">
                ({{ log.operatorRole }})
              </span>
            </div>
            <div class="op-time">
              <el-icon><Clock /></el-icon>
              {{ formatTime(log.createTime) }}
            </div>
          </div>

          <div class="log-body">
            <div v-if="log.oldSettleStatus !== undefined || log.newSettleStatus !== undefined" class="status-change">
              <span class="change-label">结算状态:</span>
              <el-tag v-if="log.oldSettleStatus" :type="SettlementStatusTypeMap[log.oldSettleStatus]" size="small">
                {{ SettlementStatusMap[log.oldSettleStatus] }}
              </el-tag>
              <el-icon class="arrow"><Right /></el-icon>
              <el-tag v-if="log.newSettleStatus" :type="SettlementStatusTypeMap[log.newSettleStatus]" size="small">
                {{ SettlementStatusMap[log.newSettleStatus] }}
              </el-tag>
            </div>

            <div v-if="log.incomeChange" class="change-block">
              <div class="block-title">
                <el-icon><Money /></el-icon>
                金额变更
              </div>
              <pre class="json-block">{{ formatJson(log.incomeChange) }}</pre>
            </div>

            <div v-if="log.ruleChangeDetail" class="change-block">
              <div class="block-title">
                <el-icon><SetUp /></el-icon>
                规则变更
              </div>
              <pre class="json-block">{{ formatJson(log.ruleChangeDetail) }}</pre>
            </div>

            <div v-if="log.abnormalInterceptDetail" class="change-block warn">
              <div class="block-title">
                <el-icon><Warning /></el-icon>
                异常拦截详情
              </div>
              <pre class="json-block">{{ formatJson(log.abnormalInterceptDetail) }}</pre>
            </div>

            <div v-if="log.checkResult" class="change-block">
              <div class="block-title">
                <el-icon><Finished /></el-icon>
                校验结果
              </div>
              <pre class="json-block">{{ formatJson(log.checkResult) }}</pre>
            </div>

            <div v-if="log.rejectReason" class="reject-reason">
              <el-icon><ChatLineRound /></el-icon>
              <span>驳回理由:</span>
              <strong>{{ log.rejectReason }}</strong>
            </div>

            <div v-if="log.remark" class="remark">
              <el-icon><Document /><el-icon>
              备注: {{ log.remark }}
            </div>
          </div>
        </div>
      </el-timeline-item>

      <el-empty v-if="!logs.length" description="暂无审核记录" />
    </el-timeline>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Operation,
  CircleCheckFilled,
  CircleCloseFilled,
  WarningFilled,
  Clock,
  Right,
  Money,
  SetUp,
  Warning,
  Finished,
  ChatLineRound,
  Document
} from '@element-plus/icons-vue'
import {
  SettlementStatusMap,
  SettlementStatusTypeMap,
  SettlementOperationTypeMap,
  SettlementOperationTypeColorMap,
  SettlementOperationType
} from '@/enums/driver'
import type { SettlementAuditLog } from '@/types/driver'

const props = defineProps<{
  logs: SettlementAuditLog[]
}>()

const sortedLogs = computed(() => {
  return [...props.logs].sort((a, b) =>
    new Date(a.createTime).getTime() - new Date(b.createTime).getTime()
  )
})

const passCount = computed(() =>
  props.logs.filter(l => l.operationType === SettlementOperationType.AUDIT_PASS).length
)

const rejectCount = computed(() =>
  props.logs.filter(l => l.operationType === SettlementOperationType.AUDIT_REJECT).length
)

const interceptCount = computed(() =>
  props.logs.filter(l => l.operationType === SettlementOperationType.ABNORMAL_INTERCEPT).length
)

const getTimelineType = (opType: number) => {
  const map: Record<number, string> = {
    [SettlementOperationType.AUDIT_PASS]: 'success',
    [SettlementOperationType.AUDIT_REJECT]: 'danger',
    [SettlementOperationType.POST]: 'success',
    [SettlementOperationType.ABNORMAL_INTERCEPT]: 'warning',
    [SettlementOperationType.CREATE]: 'primary',
    [SettlementOperationType.INITIATE]: 'warning',
    [SettlementOperationType.RULE_CHANGE]: 'info',
    [SettlementOperationType.UPDATE_RULE]: 'info',
    [SettlementOperationType.DATA_CORRECTION]: 'danger'
  }
  return map[opType] || 'primary'
}

const isHollow = (log: SettlementAuditLog) => {
  return log.operationType === SettlementOperationType.AUDIT_REJECT
}

const formatTime = (t: string) => {
  return new Date(t).toLocaleString('zh-CN', { hour12: false })
}

const formatJson = (data: any) => {
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}
</script>

<style scoped>
.timeline-summary {
  display: flex;
  gap: 20px;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #64748b;
}

.stat-item strong {
  font-size: 16px;
  color: #334155;
  margin-left: 4px;
}

.stat-item.pass .el-icon {
  color: #10b981;
}

.stat-item.pass strong {
  color: #059669;
}

.stat-item.reject .el-icon {
  color: #ef4444;
}

.stat-item.reject strong {
  color: #dc2626;
}

.stat-item.abnormal .el-icon {
  color: #f59e0b;
}

.stat-item.abnormal strong {
  color: #d97706;
}

.log-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px dashed #f1f5f9;
}

.op-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.op-name {
  font-weight: 600;
  color: #334155;
}

.op-role {
  color: #64748b;
  font-size: 12px;
}

.op-time {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #94a3b8;
  font-size: 12px;
}

.log-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-change {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f0f9ff;
  border-radius: 4px;
}

.change-label {
  color: #64748b;
  font-size: 13px;
}

.arrow {
  color: #94a3b8;
  font-size: 12px;
}

.change-block {
  background: #fafafa;
  border-radius: 4px;
  overflow: hidden;
}

.change-block.warn {
  background: #fefce8;
  border: 1px solid #fef08a;
}

.block-title {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f1f5f9;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}

.change-block.warn .block-title {
  background: #fef3c7;
  color: #92400e;
}

.json-block {
  padding: 10px 12px;
  margin: 0;
  font-size: 11px;
  font-family: 'Courier New', monospace;
  color: #475569;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 160px;
  overflow-y: auto;
}

.reject-reason {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 4px;
  color: #991b1b;
}

.reject-reason span {
  color: #b91c1c;
  font-size: 13px;
}

.reject-reason strong {
  color: #7f1d1d;
}

.remark {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #64748b;
}
</style>
