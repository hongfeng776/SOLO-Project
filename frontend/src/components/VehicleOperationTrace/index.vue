<template>
  <div class="vehicle-operation-trace" v-loading="loading">
    <div class="trace-header">
      <div class="vehicle-info-card" v-if="vehicle">
        <div class="info-main">
          <div class="plate-number">{{ vehicle.plateNumber }}</div>
          <div class="info-row">
            <el-tag
              :type="vehicle.auditStatus === 1 ? 'success' : vehicle.auditStatus === 2 ? 'danger' : vehicle.auditStatus === 3 ? 'info' : 'warning'"
              size="small"
            >
              {{ AuditStatusMap[vehicle.auditStatus as keyof typeof AuditStatusMap] }}
            </el-tag>
            <span :class="['level-tag', `level-${OperationLevelMap[vehicle.operationLevel as keyof typeof OperationLevelMap]?.charAt(0)}`]">
              {{ OperationLevelMap[vehicle.operationLevel as keyof typeof OperationLevelMap] }}
            </span>
            <el-tag v-if="vehicle.isLocked === 1" type="danger" size="small" effect="dark">
              <el-icon><Lock /></el-icon>
              已锁定
            </el-tag>
          </div>
        </div>
        <div class="info-details">
          <div class="detail-item">
            <span class="label">车架号：</span>
            <span class="value">{{ vehicle.vin }}</span>
          </div>
          <div class="detail-item">
            <span class="label">品牌型号：</span>
            <span class="value">{{ vehicle.brand }} {{ vehicle.model }}</span>
          </div>
          <div class="detail-item">
            <span class="label">备案城市：</span>
            <span class="value">{{ vehicle.city }}</span>
          </div>
        </div>
        <div class="risk-badge" v-if="vehicle.riskLevel === 3">
          <el-icon><Warning /></el-icon>
          高风险
        </div>
      </div>

      <div class="filter-section">
        <el-select v-model="filterForm.operationType" placeholder="操作类型" clearable style="width: 160px">
          <el-option
            v-for="(label, value) in OperationTypeMap"
            :key="value"
            :label="label"
            :value="Number(value)"
          />
        </el-select>
        <el-select v-model="filterForm.riskLevel" placeholder="风险等级" clearable style="width: 140px">
          <el-option label="高风险" :value="3" />
          <el-option label="中风险" :value="2" />
          <el-option label="低风险" :value="1" />
          <el-option label="无风险" :value="0" />
        </el-select>
        <el-date-picker
          v-model="filterForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 280px"
        />
        <el-button type="primary" :icon="Search" @click="loadLogs">查询</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>
    </div>

    <div class="stats-cards">
      <div class="stat-card primary">
        <div class="stat-icon"><el-icon><Document /></el-icon></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">总操作记录</div>
        </div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon"><el-icon><Edit /></el-icon></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.modifications }}</div>
          <div class="stat-label">修改次数</div>
        </div>
      </div>
      <div class="stat-card success">
        <div class="stat-icon"><el-icon><Check /></el-icon></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.approvals }}</div>
          <div class="stat-label">审核通过</div>
        </div>
      </div>
      <div class="stat-card danger">
        <div class="stat-icon"><el-icon><Warning /></el-icon></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.intercepts }}</div>
          <div class="stat-label">风险拦截</div>
        </div>
      </div>
    </div>

    <div class="trace-content">
      <div class="timeline-section">
        <div class="section-header">
          <el-icon><TimeLine /></el-icon>
          <span class="section-title">操作时间线</span>
        </div>
        <el-timeline>
          <el-timeline-item
            v-for="(log, index) in logs"
            :key="log.id"
            :timestamp="formatDate(log.createdAt)"
            :type="getTimelineType(log)"
            :icon="getTimelineIcon(log)"
            :hollow="log.riskLevel === 0"
          >
            <el-card class="log-card" :class="{ 'high-risk': log.riskLevel === 3, 'medium-risk': log.riskLevel === 2 }">
              <div class="log-header">
                <div class="log-title">
                  <el-icon class="title-icon" :color="getOperationColor(log.operationType)">
                    <component :is="getOperationIcon(log.operationType)" />
                  </el-icon>
                  <span class="title-text">{{ OperationTypeMap[log.operationType as keyof typeof OperationTypeMap] }}</span>
                  <el-tag
                    v-if="log.riskLevel && log.riskLevel > 0"
                    :type="log.riskLevel === 3 ? 'danger' : log.riskLevel === 2 ? 'warning' : 'info'"
                    size="small"
                    effect="dark"
                    class="risk-tag"
                  >
                    {{ RiskLevelMap[log.riskLevel as keyof typeof RiskLevelMap] }}
                  </el-tag>
                </div>
                <div class="log-operator">
                  操作人：{{ log.operatorName || '系统' }}
                  <span v-if="log.operatorRole" class="operator-role">({{ log.operatorRole }})</span>
                </div>
              </div>

              <div class="log-body">
                <div class="log-remark" v-if="log.remark">
                  <el-icon><ChatDotRound /></el-icon>
                  <span>{{ log.remark }}</span>
                </div>

                <div v-if="log.validationResult && log.validationResult.risks?.length > 0" class="log-risks">
                  <div class="risks-title">
                    <el-icon><Warning /></el-icon>
                    风险检测结果
                  </div>
                  <div
                    v-for="(risk, idx) in log.validationResult.risks"
                    :key="idx"
                    class="risk-item"
                    :class="`risk-${risk.level}`"
                  >
                    <el-tag size="small" :type="risk.level === 'high' ? 'danger' : risk.level === 'medium' ? 'warning' : 'info'">
                      {{ risk.level === 'high' ? '高' : risk.level === 'medium' ? '中' : '低' }}
                    </el-tag>
                    <span class="risk-message">{{ risk.message }}</span>
                    <span v-if="risk.field" class="risk-field">[{{ risk.field }}]</span>
                  </div>
                </div>

                <div v-if="log.validationResult && log.validationResult.validationSummary" class="log-validation">
                  <div class="validation-item">
                    <span class="label">证件校验：</span>
                    <el-tag :type="log.validationResult.validationSummary.documents ? 'success' : 'danger'" size="small">
                      {{ log.validationResult.validationSummary.documents ? '通过' : '未通过' }}
                    </el-tag>
                  </div>
                  <div class="validation-item">
                    <span class="label">参数校验：</span>
                    <el-tag :type="log.validationResult.validationSummary.parameters ? 'success' : 'danger'" size="small">
                      {{ log.validationResult.validationSummary.parameters ? '通过' : '未通过' }}
                    </el-tag>
                  </div>
                  <div class="validation-item">
                    <span class="label">唯一性校验：</span>
                    <el-tag :type="log.validationResult.validationSummary.uniqueness ? 'success' : 'danger'" size="small">
                      {{ log.validationResult.validationSummary.uniqueness ? '通过' : '未通过' }}
                    </el-tag>
                  </div>
                  <div class="validation-item">
                    <span class="label">交管数据匹配：</span>
                    <el-tag :type="log.validationResult.validationSummary.trafficData ? 'success' : 'warning'" size="small">
                      {{ log.validationResult.validationSummary.trafficData ? '一致' : '待核验' }}
                    </el-tag>
                  </div>
                </div>

                <div v-if="log.changedFields && Object.keys(log.changedFields).length > 0" class="log-changes">
                  <div class="changes-title">
                    <el-icon><EditPen /></el-icon>
                    字段变更记录
                  </div>
                  <el-table :data="formatChangedFields(log.changedFields)" size="small">
                    <el-table-column prop="field" label="字段" width="140">
                      <template #default="{ row }">
                        <span class="field-name">{{ row.fieldLabel }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="变更内容">
                      <template #default="{ row }">
                        <div class="change-content">
                          <span class="old-value">{{ row.oldValue || '-' }}</span>
                          <el-icon class="arrow-icon"><ArrowRight /></el-icon>
                          <span class="new-value">{{ row.newValue || '-' }}</span>
                        </div>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>

                <div v-if="log.operationType === 1 || log.operationType === 2" class="log-level" v-if="log.levelResult">
                  <div class="level-title">
                    <el-icon><TrendCharts /></el-icon>
                    运营等级评定
                  </div>
                  <div class="level-preview">
                    <div class="level-badge" :class="`level-${log.levelResult.levelName?.charAt(0)}`">
                      {{ log.levelResult.levelName }}
                    </div>
                    <div class="level-score">
                      <span class="score-value">{{ log.levelResult.totalScore }}</span>
                      <span class="score-label">分</span>
                    </div>
                  </div>
                  <div class="level-privileges">
                    <div class="privilege-item">
                      <span class="privilege-label">接单范围：</span>
                      <span class="privilege-value">{{ log.levelResult.orderScope?.maxRadius || '-' }}km</span>
                    </div>
                    <div class="privilege-item">
                      <span class="privilege-label">溢价权限：</span>
                      <span class="privilege-value">+{{ log.levelResult.premiumPermission || 0 }}%</span>
                    </div>
                    <div class="privilege-item">
                      <span class="privilege-label">运营时效：</span>
                      <span class="privilege-value">{{ log.levelResult.operationTimeLimit || '-' }}小时/天</span>
                    </div>
                  </div>
                  <div v-if="log.levelResult.breakdown" class="level-breakdown">
                    <div v-for="(item, idx) in log.levelResult.breakdown" :key="idx" class="breakdown-item">
                      <span class="breakdown-label">{{ item.factor }}</span>
                      <div class="breakdown-bar">
                        <div class="bar-fill" :style="{ width: `${(item.score / item.maxScore) * 100}%` }"></div>
                      </div>
                      <span class="breakdown-score">{{ item.score }}/{{ item.maxScore }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="log-footer">
                <div class="log-ip" v-if="log.ipAddress">
                  <el-icon><Monitor /></el-icon>
                  IP：{{ log.ipAddress }}
                </div>
                <div class="log-time">
                  <el-icon><Clock /></el-icon>
                  {{ formatFullDate(log.createdAt) }}
                </div>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>

        <div v-if="logs.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无操作记录" />
        </div>

        <div class="pagination" v-if="total > pageSize">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadLogs"
            @current-change="loadLogs"
          />
        </div>
      </div>

      <div class="risk-section">
        <div class="section-header">
          <el-icon :color="#f56c6c"><Warning /></el-icon>
          <span class="section-title">风险记录</span>
        </div>
        <div v-if="riskLogs.length > 0" class="risk-list">
          <div v-for="log in riskLogs" :key="log.id" class="risk-card">
            <div class="risk-card-header">
              <el-tag type="danger" size="small" effect="dark">
                {{ OperationTypeMap[log.operationType as keyof typeof OperationTypeMap] }}
              </el-tag>
              <span class="risk-card-time">{{ formatDate(log.createdAt) }}</span>
            </div>
            <div class="risk-card-body">
              <div v-for="(risk, idx) in log.validationResult?.risks" :key="idx" class="risk-detail">
                <el-icon><WarningFilled /></el-icon>
                <span>{{ risk.message }}</span>
              </div>
            </div>
            <div class="risk-card-footer">
              <span>处理结果：{{ log.remark || '已拦截' }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <el-empty description="暂无风险记录" :image-size="80" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  Refresh,
  Lock,
  Warning,
  Document,
  Edit,
  Check,
  TimeLine,
  ChatDotRound,
  EditPen,
  ArrowRight,
  TrendCharts,
  Monitor,
  Clock,
  Plus,
  CircleCheck,
  CircleClose,
  Upload,
  Delete,
  WarningFilled,
  User,
  Key
} from '@element-plus/icons-vue'
import { getVehicleAuditLogsApi } from '@/api/vehicle'
import {
  OperationTypeMap,
  OperationTypeColorMap,
  RiskLevelMap,
  AuditStatusMap,
  OperationLevelMap
} from '@/enums/vehicle'
import type { Vehicle, VehicleAuditLog } from '@/types/vehicle'

interface Props {
  vehicleId: number
  vehicle?: Vehicle
}

const props = defineProps<Props>()

const loading = ref(false)
const logs = ref<VehicleAuditLog[]>([])
const total = ref(0)

const filterForm = reactive({
  operationType: undefined as number | undefined,
  riskLevel: undefined as number | undefined,
  dateRange: [] as Date[]
})

const pagination = reactive({
  page: 1,
  pageSize: 10
})

const stats = computed(() => {
  const result = {
    total: 0,
    modifications: 0,
    approvals: 0,
    intercepts: 0
  }
  
  logs.value.forEach(log => {
    result.total++
    if (log.operationType === 2) result.modifications++
    if (log.operationType === 3) result.approvals++
    if (log.operationType >= 10 && log.operationType <= 12) result.intercepts++
  })
  
  return result
})

const riskLogs = computed(() => {
  return logs.value.filter(log => log.riskLevel === 3 || (log.operationType >= 10 && log.operationType <= 12))
})

const loadLogs = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    
    if (filterForm.operationType) {
      params.operationType = filterForm.operationType
    }
    if (filterForm.riskLevel !== undefined) {
      params.riskLevel = filterForm.riskLevel
    }
    if (filterForm.dateRange && filterForm.dateRange.length === 2) {
      params.startDate = filterForm.dateRange[0].toISOString().split('T')[0]
      params.endDate = filterForm.dateRange[1].toISOString().split('T')[0]
    }
    
    const res = await getVehicleAuditLogsApi(props.vehicleId, params)
    logs.value = res.data.list
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  filterForm.operationType = undefined
  filterForm.riskLevel = undefined
  filterForm.dateRange = []
  pagination.page = 1
  loadLogs()
}

const formatDate = (date: string) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const formatFullDate = (date: string) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

const getTimelineType = (log: VehicleAuditLog) => {
  if (log.riskLevel === 3) return 'danger'
  if (log.riskLevel === 2) return 'warning'
  if (log.operationType === 3 || log.operationType === 5) return 'success'
  if (log.operationType === 4 || log.operationType === 6) return 'info'
  return 'primary'
}

const getTimelineIcon = (log: VehicleAuditLog) => {
  if (log.riskLevel === 3) return Warning
  if (log.operationType === 3 || log.operationType === 5) return Check
  if (log.operationType === 4 || log.operationType === 6) return CircleClose
  if (log.operationType === 1) return Plus
  if (log.operationType === 2) return Edit
  return Document
}

const getOperationColor = (type: number) => {
  return OperationTypeColorMap[type as keyof typeof OperationTypeColorMap] || '#909399'
}

const getOperationIcon = (type: number) => {
  const iconMap: Record<number, any> = {
    1: Plus,
    2: Edit,
    3: CircleCheck,
    4: CircleClose,
    5: Check,
    6: Clock,
    7: Lock,
    8: Key,
    9: Upload,
    10: Warning,
    11: Delete,
    12: WarningFilled
  }
  return iconMap[type] || Document
}

const fieldLabelMap: Record<string, string> = {
  plateNumber: '车牌号',
  vin: '车架号',
  engineNo: '发动机号',
  brand: '品牌',
  model: '型号',
  color: '颜色',
  capacityType: '运力类型',
  vehicleType: '车辆类型',
  emissionStandard: '排放标准',
  city: '备案城市',
  ownerName: '所有人姓名',
  ownerIdCard: '所有人身份证',
  ownerPhone: '所有人手机号',
  drivingLicenseExpiry: '行驶证有效期',
  inspectionExpiry: '年检有效期',
  insuranceExpiry: '保险有效期',
  operationLevel: '运营等级',
  auditStatus: '审核状态',
  status: '运营状态',
  isLocked: '锁定状态',
  driverId: '绑定司机ID',
  driverName: '绑定司机姓名'
}

const formatChangedFields = (changedFields: Record<string, { old: any; new: any }>) => {
  return Object.entries(changedFields).map(([field, value]) => ({
    field,
    fieldLabel: fieldLabelMap[field] || field,
    oldValue: formatValue(field, value.old),
    newValue: formatValue(field, value.new)
  }))
}

const formatValue = (field: string, value: any) => {
  if (value === null || value === undefined) return '-'
  
  if (field === 'auditStatus') {
    return AuditStatusMap[value as keyof typeof AuditStatusMap] || value
  }
  if (field === 'operationLevel') {
    return OperationLevelMap[value as keyof typeof OperationLevelMap] || value
  }
  if (field === 'isLocked') {
    return value === 1 ? '已锁定' : '未锁定'
  }
  if (field === 'capacityType') {
    const map: Record<number, string> = { 1: '快车', 2: '专车', 3: '豪华车', 4: '拼车', 5: '出租车' }
    return map[value] || value
  }
  if (field === 'emissionStandard') {
    const map: Record<number, string> = { 1: '国一', 2: '国二', 3: '国三', 4: '国四', 5: '国五', 6: '国六' }
    return map[value] || value
  }
  
  return String(value)
}

onMounted(() => {
  loadLogs()
})
</script>

<style lang="scss" scoped>
.vehicle-operation-trace {
  padding: 20px;

  .trace-header {
    margin-bottom: 20px;

    .vehicle-info-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 24px;
      color: #fff;
      margin-bottom: 16px;
      position: relative;
      display: flex;
      gap: 32px;
      align-items: center;

      .info-main {
        .plate-number {
          font-size: 32px;
          font-weight: 700;
          letter-spacing: 4px;
          margin-bottom: 12px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .info-row {
          display: flex;
          gap: 10px;
          align-items: center;
        }
      }

      .info-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;

        .detail-item {
          font-size: 14px;
          opacity: 0.9;

          .label {
            opacity: 0.8;
            margin-right: 8px;
          }

          .value {
            font-weight: 500;
          }
        }
      }

      .risk-badge {
        position: absolute;
        top: 20px;
        right: 20px;
        background: #f56c6c;
        padding: 6px 16px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(245, 108, 108, 0.4);
      }
    }

    .filter-section {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
  }

  .stats-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;

    .stat-card {
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        color: #fff;
      }

      .stat-content {
        .stat-value {
          font-size: 28px;
          font-weight: 700;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 13px;
          color: #909399;
          margin-top: 4px;
        }
      }

      &.primary {
        .stat-icon {
          background: linear-gradient(135deg, #667eea, #764ba2);
        }
        .stat-value {
          color: #667eea;
        }
      }

      &.warning {
        .stat-icon {
          background: linear-gradient(135deg, #f093fb, #f5576c);
        }
        .stat-value {
          color: #f5576c;
        }
      }

      &.success {
        .stat-icon {
          background: linear-gradient(135deg, #4facfe, #00f2fe);
        }
        .stat-value {
          color: #4facfe;
        }
      }

      &.danger {
        .stat-icon {
          background: linear-gradient(135deg, #fa709a, #fee140);
        }
        .stat-value {
          color: #fa709a;
        }
      }
    }
  }

  .trace-content {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 24px;
  }

  .timeline-section,
  .risk-section {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid #ebeef5;

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }

  .log-card {
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    &.high-risk {
      border-left: 4px solid #f56c6c;
    }

    &.medium-risk {
      border-left: 4px solid #e6a23c;
    }

    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;

      .log-title {
        display: flex;
        align-items: center;
        gap: 8px;

        .title-icon {
          font-size: 18px;
        }

        .title-text {
          font-size: 15px;
          font-weight: 600;
          color: #303133;
        }

        .risk-tag {
          margin-left: 8px;
        }
      }

      .log-operator {
        font-size: 12px;
        color: #909399;

        .operator-role {
          opacity: 0.8;
        }
      }
    }

    .log-body {
      .log-remark {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        padding: 8px 12px;
        background: #f5f7fa;
        border-radius: 6px;
        font-size: 13px;
        color: #606266;
        margin-bottom: 12px;
      }

      .log-risks {
        margin-bottom: 12px;

        .risks-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #f56c6c;
          margin-bottom: 8px;
        }

        .risk-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 4px;
          margin-bottom: 4px;
          font-size: 12px;

          &.risk-high {
            background: #fef0f0;
            color: #f56c6c;
          }

          &.risk-medium {
            background: #fdf6ec;
            color: #e6a23c;
          }

          &.risk-low {
            background: #ecf5ff;
            color: #409eff;
          }

          .risk-message {
            flex: 1;
          }

          .risk-field {
            color: #909399;
          }
        }
      }

      .log-validation {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        padding: 12px;
        background: #fafafa;
        border-radius: 6px;
        margin-bottom: 12px;

        .validation-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;

          .label {
            color: #909399;
          }
        }
      }

      .log-changes {
        margin-bottom: 12px;

        .changes-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #e6a23c;
          margin-bottom: 8px;
        }

        .change-content {
          display: flex;
          align-items: center;
          gap: 8px;

          .old-value {
            color: #f56c6c;
            text-decoration: line-through;
          }

          .arrow-icon {
            color: #909399;
          }

          .new-value {
            color: #67c23a;
            font-weight: 500;
          }
        }

        .field-name {
          color: #606266;
          font-size: 12px;
        }
      }

      .log-level {
        padding: 16px;
        background: linear-gradient(135deg, #f0f7ff, #e8f4fd);
        border-radius: 8px;

        .level-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #409eff;
          margin-bottom: 12px;
        }

        .level-preview {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 16px;

          .level-badge {
            padding: 8px 20px;
            border-radius: 24px;
            font-size: 20px;
            font-weight: 700;
            color: #fff;

            &.level-S {
              background: linear-gradient(135deg, #ffd700, #ffb300);
              box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
            }

            &.level-A {
              background: linear-gradient(135deg, #409eff, #2b85e4);
              box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
            }

            &.level-B {
              background: linear-gradient(135deg, #67c23a, #529b2e);
              box-shadow: 0 4px 12px rgba(103, 194, 58, 0.4);
            }

            &.level-C {
              background: linear-gradient(135deg, #909399, #73767a);
              box-shadow: 0 4px 12px rgba(144, 147, 153, 0.4);
            }
          }

          .level-score {
            .score-value {
              font-size: 32px;
              font-weight: 700;
              color: #409eff;
            }

            .score-label {
              font-size: 14px;
              color: #909399;
              margin-left: 4px;
            }
          }
        }

        .level-privileges {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 16px;

          .privilege-item {
            text-align: center;
            padding: 8px;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 6px;

            .privilege-label {
              display: block;
              font-size: 12px;
              color: #909399;
              margin-bottom: 4px;
            }

            .privilege-value {
              font-size: 16px;
              font-weight: 600;
              color: #303133;
            }
          }
        }

        .level-breakdown {
          display: flex;
          flex-direction: column;
          gap: 8px;

          .breakdown-item {
            display: flex;
            align-items: center;
            gap: 12px;

            .breakdown-label {
              width: 100px;
              font-size: 12px;
              color: #606266;
            }

            .breakdown-bar {
              flex: 1;
              height: 8px;
              background: rgba(0, 0, 0, 0.1);
              border-radius: 4px;
              overflow: hidden;

              .bar-fill {
                height: 100%;
                background: linear-gradient(90deg, #409eff, #667eea);
                border-radius: 4px;
                transition: width 0.3s;
              }
            }

            .breakdown-score {
              width: 60px;
              text-align: right;
              font-size: 12px;
              font-weight: 600;
              color: #409eff;
            }
          }
        }
      }
    }

    .log-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #ebeef5;
      font-size: 12px;
      color: #909399;

      .log-ip,
      .log-time {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }

  .risk-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .risk-card {
    background: #fef0f0;
    border: 1px solid #fbc4c4;
    border-radius: 8px;
    overflow: hidden;

    .risk-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      background: rgba(245, 108, 108, 0.1);

      .risk-card-time {
        font-size: 12px;
        color: #f56c6c;
      }
    }

    .risk-card-body {
      padding: 12px 14px;

      .risk-detail {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        font-size: 13px;
        color: #606266;
        margin-bottom: 6px;

        &:last-child {
          margin-bottom: 0;
        }

        .el-icon {
          color: #f56c6c;
          margin-top: 2px;
          flex-shrink: 0;
        }
      }
    }

    .risk-card-footer {
      padding: 8px 14px;
      background: rgba(0, 0, 0, 0.02);
      font-size: 12px;
      color: #909399;
      border-top: 1px solid #fbc4c4;
    }
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }

  .empty-state {
    padding: 40px 0;
  }
}

.level-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;

  &.level-S {
    background: linear-gradient(135deg, #ffd700, #ffb300);
    color: #fff;
  }

  &.level-A {
    background: linear-gradient(135deg, #409eff, #2b85e4);
    color: #fff;
  }

  &.level-B {
    background: linear-gradient(135deg, #67c23a, #529b2e);
    color: #fff;
  }

  &.level-C {
    background: linear-gradient(135deg, #909399, #73767a);
    color: #fff;
  }
}

:deep(.el-timeline-item__node) {
  width: 16px;
  height: 16px;
}
</style>
