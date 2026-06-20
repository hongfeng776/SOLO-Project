<template>
  <div class="vehicle-maintenance-trace" v-loading="loading">
    <!-- Stats cards -->
    <div class="stats-cards">
      <div class="stat-card" style="border-left: 4px solid #409eff">
        <div class="stat-icon" style="color: #409eff"><el-icon><Document /></el-icon></div>
        <div class="stat-content"><div class="stat-value">{{ stats.total }}</div><div class="stat-label">检修总次数</div></div>
      </div>
      <div class="stat-card" style="border-left: 4px solid #f56c6c">
        <div class="stat-icon" style="color: #f56c6c"><el-icon><WarningFilled /></el-icon></div>
        <div class="stat-content"><div class="stat-value">{{ stats.anomalyCount }}</div><div class="stat-label">异常记录数</div></div>
      </div>
      <div class="stat-card" style="border-left: 4px solid #e6a23c">
        <div class="stat-icon" style="color: #e6a23c"><el-icon><SetUp /></el-icon></div>
        <div class="stat-content"><div class="stat-value">{{ stats.urgentCount }}</div><div class="stat-label">紧急检修数</div></div>
      </div>
      <div class="stat-card" style="border-left: 4px solid #67c23a">
        <div class="stat-icon" style="color: #67c23a"><el-icon><CircleCheck /></el-icon></div>
        <div class="stat-content"><div class="stat-value">{{ stats.verifiedCount }}</div><div class="stat-label">已核验数</div></div>
      </div>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="检修时间线" name="timeline">
        <div class="filter-bar">
          <el-select v-model="filterForm.maintenanceType" placeholder="检修类型" clearable size="small" style="width: 120px">
            <el-option v-for="(label, value) in MaintenanceTypeMap" :key="value" :label="label" :value="Number(value)" />
          </el-select>
          <el-select v-model="filterForm.maintenanceStatus" placeholder="检修状态" clearable size="small" style="width: 120px">
            <el-option v-for="(label, value) in MaintenanceStatusMap" :key="value" :label="label" :value="Number(value)" />
          </el-select>
          <el-select v-model="filterForm.isAbnormal" placeholder="是否异常" clearable size="small" style="width: 100px">
            <el-option label="异常" :value="1" /><el-option label="正常" :value="0" />
          </el-select>
          <el-button size="small" type="primary" @click="loadRecords">查询</el-button>
        </div>

        <el-timeline>
          <el-timeline-item
            v-for="record in records"
            :key="record.id"
            :timestamp="formatDate(record.createTime)"
            :type="getTimelineType(record)"
            placement="top"
          >
            <div class="timeline-card" :class="{ 'is-abnormal': record.isAbnormal > 0 }">
              <div class="card-header">
                <div class="header-left">
                  <el-tag :color="MaintenancePriorityColorMap[record.priority as keyof typeof MaintenancePriorityColorMap]" effect="dark" size="small" style="color: #fff; border: none">
                    {{ MaintenancePriorityMap[record.priority as keyof typeof MaintenancePriorityMap] || '一般' }}
                  </el-tag>
                  <el-tag :type="record.maintenanceStatus === 2 ? 'success' : record.maintenanceStatus === 1 ? 'warning' : 'danger'" size="small">
                    {{ MaintenanceStatusMap[record.maintenanceStatus as keyof typeof MaintenanceStatusMap] }}
                  </el-tag>
                  <span class="type-tag">{{ MaintenanceTypeMap[record.maintenanceType as keyof typeof MaintenanceTypeMap] }}</span>
                </div>
                <div class="header-right">
                  <el-tag v-if="record.isAbnormal > 0" type="danger" size="small" effect="dark">
                    {{ MaintenanceAnomalyTypeMap[record.isAbnormal as keyof typeof MaintenanceAnomalyTypeMap] }}
                  </el-tag>
                  <el-tag v-if="record.isVerified === 1" type="success" size="small">已核验</el-tag>
                </div>
              </div>
              <div class="card-body">
                <div class="info-row" v-if="record.ledgerNo"><span class="label">台账编号：</span><span>{{ record.ledgerNo }}</span></div>
                <div class="info-row"><span class="label">检修站点：</span><span>{{ record.maintenanceStation || '-' }}</span></div>
                <div class="info-row"><span class="label">检修里程：</span><span>{{ Number(record.mileageAtMaintenance || 0).toLocaleString() }} km</span></div>
                <div class="info-row" v-if="record.faultCategory"><span class="label">故障分类：</span><span>{{ FaultCategoryMap[record.faultCategory as keyof typeof FaultCategoryMap] }}</span></div>
                <div class="info-row" v-if="record.faultDescription"><span class="label">故障描述：</span><span>{{ record.faultDescription }}</span></div>
                <div class="info-row" v-if="record.maintenanceCost"><span class="label">检修费用：</span><span class="cost">¥{{ Number(record.maintenanceCost).toFixed(2) }}</span></div>
                <div class="info-row" v-if="record.rectificationResult"><span class="label">整改结果：</span><span>{{ record.rectificationResult }}</span></div>
                <div class="info-row" v-if="record.abnormalDescription"><span class="label text-danger">异常说明：</span><span class="text-danger">{{ record.abnormalDescription }}</span></div>
                <div class="info-row" v-if="record.result"><span class="label">检修结果：</span><span>{{ record.result }}</span></div>
                <div class="info-row"><span class="label">操作人：</span><span>{{ record.operatorName || '-' }}</span></div>
                <div class="info-row" v-if="record.verifiedBy"><span class="label">核验人：</span><span>{{ record.verifiedBy }} {{ record.verifiedAt ? formatDate(record.verifiedAt) : '' }}</span></div>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>

        <div class="pagination-wrapper">
          <el-pagination v-model:current-page="query.page" v-model:page-size="query.pageSize" :total="total" :page-sizes="[20, 50, 100]" layout="total, sizes, prev, pager, next" @current-change="loadRecords" @size-change="loadRecords" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="故障分析" name="fault-analysis">
        <div class="fault-analysis">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="总故障次数">{{ faultStats.totalCount }} 次</el-descriptions-item>
            <el-descriptions-item label="最近6个月故障">{{ faultStats.recentCount }} 次</el-descriptions-item>
            <el-descriptions-item label="主要故障类型">{{ faultStats.topCategory }}</el-descriptions-item>
            <el-descriptions-item label="故障频率">{{ faultStats.frequency }}</el-descriptions-item>
          </el-descriptions>

          <div class="fault-distribution mt-16">
            <div class="section-title">故障分类分布</div>
            <div class="distribution-chart">
              <div v-for="(count, category) in faultStats.byCategory" :key="category" class="bar-item">
                <span class="bar-label">{{ FaultCategoryMap[Number(category) as keyof typeof FaultCategoryMap] }}</span>
                <div class="bar-track">
                  <div class="bar-fill" :style="{ width: `${Math.min(100, (count / Math.max(1, faultStats.totalCount)) * 100)}%` }"></div>
                </div>
                <span class="bar-value">{{ count }}次</span>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="费用分析" name="cost-analysis">
        <div class="cost-analysis">
          <div class="cost-summary">
            <div class="cost-card">
              <div class="cost-label">累计检修费用</div>
              <div class="cost-value">¥{{ costStats.totalCost.toFixed(2) }}</div>
            </div>
            <div class="cost-card">
              <div class="cost-label">平均单次费用</div>
              <div class="cost-value">¥{{ costStats.avgCost.toFixed(2) }}</div>
            </div>
          </div>
          <div class="cost-breakdown mt-16">
            <div class="section-title">费用类型构成</div>
            <div class="breakdown-items">
              <div v-for="(item, idx) in costStats.breakdown" :key="idx" class="breakdown-item">
                <span class="item-label">{{ item.label }}</span>
                <div class="item-bar-track">
                  <div class="item-bar-fill" :style="{ width: `${(item.cost / Math.max(1, costStats.totalCost)) * 100}%` }"></div>
                </div>
                <span class="item-value">¥{{ item.cost.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, WarningFilled, SetUp, CircleCheck } from '@element-plus/icons-vue'
import { getMaintenanceRecordsApi } from '@/api/vehicle'
import { MaintenanceTypeMap, MaintenanceStatusMap, MaintenancePriorityMap, MaintenancePriorityColorMap, FaultCategoryMap, MaintenanceAnomalyTypeMap } from '@/enums/vehicle'
import { formatDate } from '@/utils/format'
import type { Vehicle, VehicleMaintenanceRecord } from '@/types/vehicle'

const props = defineProps<{ vehicleId: number; vehicle: Vehicle | null }>()

const loading = ref(false)
const activeTab = ref('timeline')
const records = ref<VehicleMaintenanceRecord[]>([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 20 })
const filterForm = reactive({ maintenanceType: undefined as number | undefined, maintenanceStatus: undefined as number | undefined, isAbnormal: undefined as number | undefined })

const stats = computed(() => ({
  total: total.value,
  anomalyCount: records.value.filter(r => r.isAbnormal > 0).length,
  urgentCount: records.value.filter(r => r.priority === 1).length,
  verifiedCount: records.value.filter(r => r.isVerified === 1).length
}))

const faultStats = computed(() => {
  const byCategory: Record<number, number> = {}
  let totalCount = 0
  let recentCount = 0
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
  records.value.forEach(r => {
    if (r.faultCategory) {
      byCategory[r.faultCategory] = (byCategory[r.faultCategory] || 0) + 1
      totalCount++
      if (r.createTime && new Date(r.createTime) > sixMonthsAgo) recentCount++
    }
  })
  const topEntry = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]
  return {
    totalCount,
    recentCount,
    topCategory: topEntry ? FaultCategoryMap[Number(topEntry[0]) as keyof typeof FaultCategoryMap] : '-',
    frequency: records.value.length > 0 ? `${(totalCount / records.value.length * 100).toFixed(1)}%` : '0%',
    byCategory
  }
})

const costStats = computed(() => {
  let totalCost = 0
  const breakdownMap: Record<string, number> = {}
  records.value.forEach(r => {
    const cost = Number(r.maintenanceCost || 0)
    totalCost += cost
    const label = MaintenanceTypeMap[r.maintenanceType as keyof typeof MaintenanceTypeMap] || '其他'
    breakdownMap[label] = (breakdownMap[label] || 0) + cost
  })
  const breakdown = Object.entries(breakdownMap).map(([label, cost]) => ({ label, cost }))
  return { totalCost, avgCost: records.value.length > 0 ? totalCost / records.value.length : 0, breakdown }
})

const getTimelineType = (record: VehicleMaintenanceRecord) => {
  if (record.isAbnormal > 0) return 'danger'
  if (record.maintenanceStatus === 2) return 'success'
  if (record.maintenanceStatus === 1) return 'warning'
  return 'primary'
}

const loadRecords = async () => {
  if (!props.vehicleId) return
  loading.value = true
  try {
    const res = await getMaintenanceRecordsApi(props.vehicleId, { ...query, ...filterForm })
    records.value = res.data.list
    total.value = res.data.total
  } catch (error: any) { ElMessage.error(error.message || '获取检修记录失败') }
  finally { loading.value = false }
}

watch(() => props.vehicleId, (val) => { if (val) { query.page = 1; loadRecords() } })
onMounted(() => { if (props.vehicleId) loadRecords() })
</script>

<style lang="scss" scoped>
.vehicle-maintenance-trace {
  .stats-cards {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px;
    .stat-card {
      display: flex; align-items: center; padding: 16px; border-radius: 8px; background: #fff; border: 1px solid #ebeef5;
      .stat-icon { font-size: 28px; margin-right: 12px; }
      .stat-content {
        .stat-value { font-size: 22px; font-weight: 700; color: #303133; }
        .stat-label { font-size: 12px; color: #909399; margin-top: 2px; }
      }
    }
  }
  .filter-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
  .timeline-card {
    background: #fafafa; border: 1px solid #ebeef5; border-radius: 8px; padding: 12px 16px;
    &.is-abnormal { background: #fef0f0; border-color: #fab6b6; }
    .card-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
      .header-left, .header-right { display: flex; align-items: center; gap: 6px; }
      .type-tag { font-size: 13px; color: #606266; font-weight: 500; }
    }
    .card-body {
      .info-row { font-size: 13px; margin-bottom: 4px; .label { color: #909399; margin-right: 4px; } .cost { font-weight: 600; color: #f56c6c; } }
    }
  }
  .pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
  .fault-analysis {
    .fault-distribution {
      .section-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
      .bar-item {
        display: flex; align-items: center; margin-bottom: 8px;
        .bar-label { min-width: 80px; font-size: 13px; color: #606266; }
        .bar-track { flex: 1; height: 16px; background: #f0f0f0; border-radius: 8px; overflow: hidden; margin: 0 12px;
          .bar-fill { height: 100%; background: linear-gradient(90deg, #409eff, #67c23a); border-radius: 8px; transition: width 0.3s; }
        }
        .bar-value { min-width: 50px; font-size: 13px; color: #303133; font-weight: 500; }
      }
    }
  }
  .cost-analysis {
    .cost-summary {
      display: flex; gap: 24px;
      .cost-card {
        flex: 1; padding: 20px; background: #f5f7fa; border-radius: 8px; text-align: center;
        .cost-label { font-size: 13px; color: #909399; margin-bottom: 8px; }
        .cost-value { font-size: 24px; font-weight: 700; color: #f56c6c; }
      }
    }
    .cost-breakdown {
      .section-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
      .breakdown-item {
        display: flex; align-items: center; margin-bottom: 8px;
        .item-label { min-width: 100px; font-size: 13px; color: #606266; }
        .item-bar-track { flex: 1; height: 14px; background: #f0f0f0; border-radius: 7px; overflow: hidden; margin: 0 12px;
          .item-bar-fill { height: 100%; background: #409eff; border-radius: 7px; transition: width 0.3s; }
        }
        .item-value { min-width: 100px; font-size: 13px; color: #303133; font-weight: 500; text-align: right; }
      }
    }
  }
  .mt-16 { margin-top: 16px; }
  .text-danger { color: #f56c6c; }
}
</style>
