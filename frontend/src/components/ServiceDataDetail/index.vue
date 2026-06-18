<template>
  <div class="service-detail-expand" v-loading="loading">
    <div v-if="!detail" class="empty-detail">
      <el-empty description="暂无详细数据" />
    </div>
    <template v-else>
      <div class="detail-section">
        <div class="section-title">
          <el-icon class="section-icon"><DataAnalysis /></el-icon>
          <span>服务数据概览</span>
        </div>
        <div class="data-cards">
          <div class="data-card">
            <div class="card-value score">{{ detail.serviceScore }}</div>
            <div class="card-label">服务评分</div>
            <div class="card-rating">
              <el-rate :model-value="parseFloat(detail.serviceScore)" disabled show-score text-color="#ff9900" />
            </div>
          </div>
          <div class="data-card">
            <div class="card-value">{{ detail.totalOrders }}</div>
            <div class="card-label">接单量</div>
            <div class="card-sub">完单 {{ detail.completedOrders }} 单</div>
          </div>
          <div class="data-card">
            <div class="card-value completion">{{ detail.completionRate }}%</div>
            <div class="card-label">完单率</div>
            <div class="card-sub">取消 {{ detail.cancelledOrders }} 单</div>
          </div>
          <div class="data-card">
            <div class="card-value complaint">{{ detail.complaintRate }}%</div>
            <div class="card-label">投诉率</div>
            <div class="card-sub">投诉 {{ detail.complaintCount }} 次</div>
          </div>
          <div class="data-card">
            <div class="card-value income">¥{{ detail.totalIncome }}</div>
            <div class="card-label">总收入</div>
            <div class="card-sub">客单价 ¥{{ detail.avgOrderAmount }}</div>
          </div>
          <div class="data-card">
            <div class="card-value online">{{ detail.onlineHours }}h</div>
            <div class="card-label">在线时长</div>
            <div class="card-sub">里程 {{ detail.mileage }}km</div>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <div class="section-title">
          <el-icon class="section-icon level-icon"><Medal /></el-icon>
          <span>司机等级与权益</span>
          <el-tag
            :type="getLevelType(detail.driverLevel)"
            effect="dark"
            size="small"
            class="level-tag"
          >
            {{ getLevelName(detail.driverLevel) }}
          </el-tag>
        </div>
        <div class="level-config">
          <div class="config-item">
            <div class="config-label">等级描述</div>
            <div class="config-value">{{ detail.levelInfo?.description || '-' }}</div>
          </div>
          <div class="config-item">
            <div class="config-label">流量权重</div>
            <div class="config-value highlight">
              {{ detail.trafficWeight }}x
              <span v-if="detail.trafficWeight > 1" class="trend-up">↑ 倾斜</span>
              <span v-else-if="detail.trafficWeight < 1" class="trend-down">↓ 限制</span>
            </div>
          </div>
          <div class="config-item">
            <div class="config-label">补贴等级</div>
            <div class="config-value">{{ getSubsidyLevelName(detail.subsidyLevel) }}</div>
          </div>
          <div class="config-item">
            <div class="config-label">接单优先级</div>
            <div class="config-value">{{ getOrderPriorityName(detail.orderPriority) }}</div>
          </div>
          <div class="config-item full">
            <div class="config-label">晋级标准</div>
            <div class="config-value standards">
              <span class="standard-item">服务评分 ≥ {{ detail.levelInfo?.minServiceScore || 0 }}</span>
              <span class="standard-item">完单率 ≥ {{ detail.levelInfo?.minCompletionRate || 0 }}%</span>
              <span class="standard-item">投诉率 ≤ {{ detail.levelInfo?.maxComplaintRate || 0 }}%</span>
              <span class="standard-item">接单量 ≥ {{ detail.levelInfo?.minOrders || 0 }}单</span>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <div class="section-title">
          <el-icon class="section-icon source-icon"><Coin /></el-icon>
          <span>数据来源与准确性</span>
          <el-tag
            v-if="detail.accuracy?.accurate"
            type="success"
            size="small"
            effect="light"
          >
            数据一致
          </el-tag>
          <el-tag
            v-else
            type="warning"
            size="small"
            effect="light"
          >
            存在缺失
          </el-tag>
        </div>
        <div class="data-sources">
          <div
            v-for="source in detail.accuracy?.dataSources || []"
            :key="source.name"
            class="source-item"
            :class="source.status"
          >
            <div class="source-status">
              <el-icon v-if="source.status === 'ok'" class="status-icon ok"><CircleCheck /></el-icon>
              <el-icon v-else-if="source.status === 'warning'" class="status-icon warning"><Warning /></el-icon>
              <el-icon v-else class="status-icon error"><CircleClose /></el-icon>
            </div>
            <div class="source-info">
              <div class="source-name">{{ source.name }}</div>
              <div class="source-field">字段：{{ source.field }}</div>
            </div>
          </div>
        </div>
        <div v-if="detail.accuracy?.missingSources?.length > 0" class="missing-sources">
          <el-alert
            title="数据缺失提示"
            type="warning"
            show-icon
            :closable="false"
          >
            <template #default>
              <div class="missing-list">
                <div v-for="(m, i) in detail.accuracy.missingSources" :key="i" class="missing-item">
                  <el-icon><Warning /></el-icon>
                  {{ m }}
                </div>
              </div>
            </template>
          </el-alert>
        </div>
      </div>

      <div v-if="detail.isAbnormal === 1" class="detail-section abnormal-section">
        <div class="section-title">
          <el-icon class="section-icon abnormal-icon"><WarningFilled /></el-icon>
          <span>异常检测结果</span>
          <el-tag type="danger" effect="dark" size="small" class="abnormal-badge">
            异常
          </el-tag>
        </div>
        <div class="abnormal-content">
          <div class="abnormal-type">异常类型：{{ detail.abnormalType || '未知' }}</div>
          <div class="abnormal-reason">异常原因：{{ detail.abnormalReason || '待核查' }}</div>
        </div>
      </div>

      <div class="detail-section">
        <div class="section-title">
          <el-icon class="section-icon log-icon"><Document /></el-icon>
          <span>数据更新履历</span>
        </div>
        <div class="update-logs">
          <el-scrollbar height="240px">
            <div v-if="!detail.updateLogs || detail.updateLogs.length === 0" class="no-logs">
              暂无更新记录
            </div>
            <div v-else class="timeline">
              <div
                v-for="log in detail.updateLogs"
                :key="log.id"
                class="timeline-item"
                :class="{ abnormal: log.isAbnormal === 1 }"
              >
                <div class="timeline-dot">
                  <el-icon :style="{ color: getLogColor(log.operationType) }">
                    <CircleCheck v-if="log.operationType !== 4" />
                    <WarningFilled v-else />
                  </el-icon>
                </div>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <span class="log-type" :style="{ color: getLogColor(log.operationType) }">
                      {{ log.operationTypeName }}
                    </span>
                    <span class="log-time">{{ formatTime(log.createTime) }}</span>
                  </div>
                  <div v-if="log.dataField" class="log-detail">
                    字段：{{ log.dataField }}
                    <span v-if="log.oldValue !== undefined" class="value-change">
                      {{ log.oldValue }} → {{ log.newValue }}
                    </span>
                  </div>
                  <div v-if="log.statisticBasis" class="log-basis">
                    统计依据：{{ log.statisticBasis }}
                  </div>
                  <div v-if="log.dataSource" class="log-source">
                    数据来源：{{ log.dataSource }}
                  </div>
                  <div v-if="log.operatorName" class="log-operator">
                    操作人：{{ log.operatorName }}
                  </div>
                  <div v-if="log.remark" class="log-remark">
                    备注：{{ log.remark }}
                  </div>
                  <div v-if="log.isAbnormal === 1" class="log-abnormal">
                    <el-tag type="danger" size="small" effect="light">
                      异常操作：{{ log.abnormalReason || '' }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </el-scrollbar>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import {
  DataAnalysis,
  Medal,
  Coin,
  Document,
  Warning,
  WarningFilled,
  CircleCheck,
  CircleClose
} from '@element-plus/icons-vue'
import { getDriverServiceDetailApi } from '@/api/driver'
import {
  DriverServiceLevelMap,
  DriverServiceLevelTypeMap,
  SubsidyLevelMap,
  OrderPriorityMap,
  ServiceOperationTypeColorMap
} from '@/enums/driver'
import type { DriverServiceDetail } from '@/types/driver'

const props = defineProps<{
  driverId: number
  period?: string
}>()

const loading = ref(false)
const detail = ref<DriverServiceDetail | null>(null)

const loadDetail = async () => {
  if (!props.driverId) return

  loading.value = true
  try {
    const res = await getDriverServiceDetailApi(props.driverId, props.period || 'day')
    detail.value = res.data
  } catch (error) {
    detail.value = null
  } finally {
    loading.value = false
  }
}

const getLevelName = (level: number) => {
  return DriverServiceLevelMap[level] || '未知'
}

const getLevelType = (level: number) => {
  return DriverServiceLevelTypeMap[level] || 'info'
}

const getSubsidyLevelName = (level: number) => {
  return SubsidyLevelMap[level] || '未知'
}

const getOrderPriorityName = (priority: number) => {
  return OrderPriorityMap[priority] || '未知'
}

const getLogColor = (type: number) => {
  return ServiceOperationTypeColorMap[type] || '#909399'
}

const formatTime = (time: string) => {
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

watch(() => props.driverId, () => {
  loadDetail()
}, { immediate: true })

watch(() => props.period, () => {
  loadDetail()
})

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.service-detail-expand {
  padding: 20px;
  background: #f8f9fb;
  border-radius: 8px;
  margin: 10px 0;
}

.detail-section {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.section-icon {
  font-size: 18px;
}

.level-icon {
  color: #e6a23c;
}

.source-icon {
  color: #67c23a;
}

.abnormal-icon {
  color: #f56c6c;
}

.log-icon {
  color: #909399;
}

.level-tag {
  margin-left: 10px;
}

.data-cards {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.data-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  border-radius: 8px;
  padding: 14px;
  text-align: center;
  transition: transform 0.2s;
}

.data-card:hover {
  transform: translateY(-2px);
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.card-value.score {
  color: #67c23a;
}

.card-value.completion {
  color: #409eff;
}

.card-value.complaint {
  color: #e6a23c;
}

.card-value.income {
  color: #f56c6c;
}

.card-value.online {
  color: #909399;
}

.card-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
}

.card-sub {
  font-size: 11px;
  color: #909399;
}

.card-rating {
  margin-top: 4px;
}

.level-config {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.config-item {
  padding: 10px;
  background: #f5f7fa;
  border-radius: 6px;
}

.config-item.full {
  grid-column: span 4;
}

.config-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.config-value {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.config-value.highlight {
  color: #409eff;
  font-size: 18px;
  font-weight: bold;
}

.trend-up {
  font-size: 12px;
  color: #67c23a;
  margin-left: 4px;
}

.trend-down {
  font-size: 12px;
  color: #f56c6c;
  margin-left: 4px;
}

.standards {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.standard-item {
  font-size: 13px;
  color: #606266;
  padding: 4px 10px;
  background: #ecf5ff;
  border-radius: 12px;
}

.data-sources {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.source-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  border-left: 3px solid #67c23a;
}

.source-item.warning {
  border-left-color: #e6a23c;
}

.source-item.error {
  border-left-color: #f56c6c;
}

.status-icon {
  font-size: 20px;
}

.status-icon.ok {
  color: #67c23a;
}

.status-icon.warning {
  color: #e6a23c;
}

.status-icon.error {
  color: #f56c6c;
}

.source-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.source-field {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.missing-sources {
  margin-top: 12px;
}

.missing-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.missing-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #e6a23c;
}

.abnormal-section {
  border: 1px solid #fde2e2;
  background: #fef0f0 !important;
}

.abnormal-badge {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.abnormal-content {
  padding: 10px;
  background: #fff;
  border-radius: 6px;
}

.abnormal-type {
  font-size: 14px;
  color: #f56c6c;
  margin-bottom: 6px;
  font-weight: 500;
}

.abnormal-reason {
  font-size: 13px;
  color: #606266;
}

.update-logs {
  max-height: 280px;
}

.no-logs {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

.timeline {
  position: relative;
  padding-left: 20px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: #ebeef5;
}

.timeline-item {
  position: relative;
  margin-bottom: 16px;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -20px;
  top: 2px;
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  z-index: 1;
}

.timeline-item.abnormal .timeline-dot {
  animation: abnormalPulse 2s infinite;
}

@keyframes abnormalPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(245, 108, 108, 0); }
}

.timeline-content {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 6px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.log-type {
  font-weight: 600;
  font-size: 13px;
}

.log-time {
  font-size: 11px;
  color: #909399;
}

.log-detail,
.log-basis,
.log-source,
.log-operator,
.log-remark {
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
}

.value-change {
  color: #409eff;
  margin-left: 6px;
}

.log-abnormal {
  margin-top: 6px;
}

.empty-detail {
  padding: 40px 0;
}
</style>
