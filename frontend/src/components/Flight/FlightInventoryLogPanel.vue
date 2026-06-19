<template>
  <div class="flight-inventory-log-panel">
    <div class="panel-header sticky-header">
      <div class="header-title">
        <el-icon color="#722ed1"><DataLine /></el-icon>
        <span>库存操作日志</span>
      </div>
      <div class="header-filters">
        <el-select
          v-model="filterForm.operationType"
          placeholder="操作类型"
          clearable
          size="small"
          style="width: 140px"
          @change="loadLogs"
        >
          <el-option
            v-for="(item, key) in FlightInventoryLogTypeEnum"
            :key="key"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select
          v-model="filterForm.cabinClass"
          placeholder="舱位类型"
          clearable
          size="small"
          style="width: 120px"
          @change="loadLogs"
        >
          <el-option
            v-for="(item, key) in CabinClassEnum"
            :key="key"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-date-picker
          v-model="filterForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          size="small"
          style="width: 280px"
        />
        <el-button size="small" type="primary" @click="loadLogs">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button size="small" @click="resetFilter">重置</el-button>
      </div>
    </div>

    <div class="log-content">
      <div
        v-for="(group, groupKey) in groupedLogs"
        :key="groupKey"
        class="log-group"
      >
        <div class="group-header sticky-group-header">
          <div class="group-title">
            <el-icon :color="groupTypeInfo(groupKey)?.color">
              <component :is="groupTypeInfo(groupKey)?.icon" />
            </el-icon>
            <span>{{ groupTypeInfo(groupKey)?.label }}</span>
            <el-tag size="small" type="info" effect="plain">{{ group.length }}条</el-tag>
          </div>
        </div>

        <div class="log-items">
          <div
            v-for="log in group"
            :key="log.id"
            class="log-item"
            @mouseenter="hoveredLogId = log.id"
            @mouseleave="hoveredLogId = null"
          >
            <div class="log-dot" :style="{ backgroundColor: groupTypeInfo(groupKey)?.color }">
              <el-icon size="12">
                <component :is="groupTypeInfo(groupKey)?.icon" />
              </el-icon>
            </div>
            <div class="log-content-card">
              <div class="log-header-row">
                <span class="log-time">{{ formatDateTime(log.createdAt) }}</span>
                <span
                  class="log-operator"
                  v-tooltip="'操作角色: ' + (log.operatorRole || '-')"
                >
                  {{ log.operatorName || '系统' }}
                </span>
              </div>

              <div class="log-main">
                <div class="log-summary">
                  <span class="log-label">航班</span>
                  <span class="log-value highlight">{{ log.flightNo }}</span>
                  <span class="log-divider">·</span>
                  <span class="log-label">舱位</span>
                  <span class="log-value">{{ getCabinLabel(log.cabinClass) }}</span>
                  <span class="log-divider">·</span>
                  <span class="log-label">库存类型</span>
                  <span class="log-value">{{ getInventoryTypeLabel(log.inventoryType) }}</span>
                </div>

                <div class="log-stock-change">
                  <div class="stock-item">
                    <span class="stock-label">总库存</span>
                    <div class="stock-change">
                      <span class="stock-old">{{ log.beforeTotalStock }}</span>
                      <el-icon class="change-arrow" size="12"><Right /></el-icon>
                      <span
                        class="stock-new"
                        :class="{
                          'text-increase': log.afterTotalStock > log.beforeTotalStock,
                          'text-decrease': log.afterTotalStock < log.beforeTotalStock
                        }"
                      >
                        {{ log.afterTotalStock }}
                      </span>
                    </div>
                  </div>
                  <div class="stock-item">
                    <span class="stock-label">可售库存</span>
                    <div class="stock-change">
                      <span class="stock-old">{{ log.beforeAvailableStock }}</span>
                      <el-icon class="change-arrow" size="12"><Right /></el-icon>
                      <span
                        class="stock-new"
                        :class="{
                          'text-increase': log.afterAvailableStock > log.beforeAvailableStock,
                          'text-decrease': log.afterAvailableStock < log.beforeAvailableStock
                        }"
                      >
                        {{ log.afterAvailableStock }}
                      </span>
                    </div>
                  </div>
                  <div v-if="log.changeQuantity" class="stock-item change-quantity">
                    <span class="stock-label">变动数量</span>
                    <span
                      class="change-value"
                      :class="log.changeType === 'increase' ? 'text-increase' : 'text-decrease'"
                    >
                      {{ log.changeType === 'increase' ? '+' : '' }}{{ log.changeQuantity }} 张
                    </span>
                  </div>
                </div>

                <div v-if="log.operationRemark || log.operationReason" class="log-remark">
                  <span class="remark-label">备注：</span>
                  <span class="remark-text">{{ log.operationRemark || log.operationReason }}</span>
                </div>

                <div v-if="log.affectedInventoryCount > 1" class="log-effect-scope">
                  <el-tag size="small" type="warning" effect="light">
                    影响 {{ log.affectedInventoryCount }} 条库存
                  </el-tag>
                </div>
              </div>

              <div v-if="hoveredLogId === log.id" class="log-tooltip">
                <div class="tooltip-section">
                  <div class="tooltip-title">详细信息</div>
                  <div class="tooltip-grid">
                    <div class="tooltip-item">
                      <span class="tooltip-label">操作IP</span>
                      <span class="tooltip-value">{{ log.operationIp || '-' }}</span>
                    </div>
                    <div class="tooltip-item">
                      <span class="tooltip-label">操作状态</span>
                      <span class="tooltip-value">
                        <el-tag size="small" :type="log.operationStatus === 1 ? 'success' : 'danger'">
                          {{ log.operationStatus === 1 ? '成功' : '失败' }}
                        </el-tag>
                      </span>
                    </div>
                    <div class="tooltip-item">
                      <span class="tooltip-label">关联订单</span>
                      <span class="tooltip-value">{{ log.relatedOrderNo || '-' }}</span>
                    </div>
                    <div class="tooltip-item">
                      <span class="tooltip-label">生效范围</span>
                      <span class="tooltip-value">{{ log.effectScope || '单条' }}</span>
                    </div>
                    <div class="tooltip-item">
                      <span class="tooltip-label">预留库存</span>
                      <span class="tooltip-value">
                        {{ log.beforeReservedStock || 0 }} → {{ log.afterReservedStock || 0 }}
                      </span>
                    </div>
                    <div class="tooltip-item">
                      <span class="tooltip-label">锁定库存</span>
                      <span class="tooltip-value">
                        {{ log.beforeLockedStock || 0 }} → {{ log.afterLockedStock || 0 }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-if="log.failReason" class="tooltip-section">
                  <div class="tooltip-title fail">失败原因</div>
                  <div class="fail-reason-text">{{ log.failReason }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadLogs"
        @current-change="loadLogs"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  DataLine,
  Search,
  Right
} from '@element-plus/icons-vue'
import {
  getFlightInventoryLogs
} from '@/api/flight'
import {
  FlightInventoryLogTypeEnum,
  FlightInventoryTypeEnum,
  CabinClassEnum
} from '@/utils/enums'

const props = defineProps({
  inventoryId: {
    type: [Number, String],
    default: null
  },
  flightId: {
    type: [Number, String],
    default: null
  }
})

const loading = ref(false)
const tableData = ref([])
const hoveredLogId = ref(null)

const filterForm = reactive({
  operationType: null,
  cabinClass: null,
  dateRange: []
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const groupedLogs = computed(() => {
  const groups = {}
  tableData.value.forEach(log => {
    const type = log.operationType
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(log)
  })
  return groups
})

const groupTypeInfo = (type) => {
  const key = Object.keys(FlightInventoryLogTypeEnum).find(
    k => FlightInventoryLogTypeEnum[k].value === parseInt(type)
  )
  return FlightInventoryLogTypeEnum[key] || null
}

const getCabinLabel = (cabinClass) => {
  const key = Object.keys(CabinClassEnum).find(k => CabinClassEnum[k].value === cabinClass)
  return CabinClassEnum[key]?.label || cabinClass
}

const getInventoryTypeLabel = (type) => {
  const key = Object.keys(FlightInventoryTypeEnum).find(
    k => FlightInventoryTypeEnum[k].value === type
  )
  return FlightInventoryTypeEnum[key]?.label || type
}

const loadLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      inventoryId: props.inventoryId,
      flightId: props.flightId,
      operationType: filterForm.operationType,
      cabinClass: filterForm.cabinClass
    }
    if (filterForm.dateRange?.length === 2) {
      params.startDate = filterForm.dateRange[0]
      params.endDate = filterForm.dateRange[1]
    }
    const res = await getFlightInventoryLogs(params)
    tableData.value = res.items || []
    pagination.total = res.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.operationType = null
  filterForm.cabinClass = null
  filterForm.dateRange = []
  pagination.page = 1
  loadLogs()
}

const formatDateTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

watch(() => props.inventoryId, () => {
  pagination.page = 1
  loadLogs()
})

watch(() => props.flightId, () => {
  pagination.page = 1
  loadLogs()
})

onMounted(() => {
  loadLogs()
})
</script>

<style lang="scss" scoped>
.flight-inventory-log-panel {
  display: flex;
  flex-direction: column;
  max-height: 600px;

  .sticky-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: #fff;
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
    }

    .header-filters {
      display: flex;
      gap: 12px;
    }
  }

  .log-content {
    flex: 1;
    overflow-y: auto;
    padding: 0 20px 16px;
  }

  .log-group {
    margin-bottom: 24px;

    .sticky-group-header {
      position: sticky;
      top: 60px;
      z-index: 50;
      background: #fafafa;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 12px;
    }

    .group-header {
      .group-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        color: #606266;
      }
    }

    .log-items {
      position: relative;
      padding-left: 20px;

      &::before {
        content: '';
        position: absolute;
        left: 8px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: #ebeef5;
      }
    }

    .log-item {
      position: relative;
      margin-bottom: 16px;
      cursor: pointer;

      &:last-child {
        margin-bottom: 0;
      }

      .log-dot {
        position: absolute;
        left: -16px;
        top: 8px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        background: #fff;
        border: 2px solid;
        border-color: inherit;
        z-index: 1;
        transition: transform 0.2s ease;
      }

      &:hover .log-dot {
        transform: scale(1.2);
      }

      .log-content-card {
        position: relative;
        background: #fff;
        border: 1px solid #ebeef5;
        border-radius: 8px;
        padding: 12px 16px;
        transition: all 0.3s ease;

        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: #dcdfe6;
        }
      }

      .log-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .log-time {
          font-size: 12px;
          color: #909399;
          font-family: monospace;
        }

        .log-operator {
          font-size: 12px;
          color: #606266;
          font-weight: 500;
        }
      }

      .log-main {
        .log-summary {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px;
          margin-bottom: 8px;
          font-size: 13px;

          .log-label {
            color: #909399;
          }

          .log-value {
            color: #606266;
            font-weight: 500;

            &.highlight {
              color: #303133;
              font-weight: 600;
            }
          }

          .log-divider {
            color: #dcdfe6;
            margin: 0 4px;
          }
        }

        .log-stock-change {
          display: flex;
          gap: 24px;
          margin-bottom: 8px;

          .stock-item {
            display: flex;
            align-items: center;
            gap: 8px;

            .stock-label {
              font-size: 12px;
              color: #909399;
              flex-shrink: 0;
            }

            .stock-change {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 13px;

              .stock-old {
                color: #c0c4cc;
                text-decoration: line-through;
              }

              .change-arrow {
                color: #dcdfe6;
              }

              .stock-new {
                font-weight: 600;

                &.text-increase {
                  color: #52c41a;
                }

                &.text-decrease {
                  color: #ff4d4f;
                }
              }
            }

            &.change-quantity {
              .change-value {
                font-weight: 700;
                font-size: 14px;

                &.text-increase {
                  color: #52c41a;
                }

                &.text-decrease {
                  color: #ff4d4f;
                }
              }
            }
          }
        }

        .log-remark {
          font-size: 12px;
          color: #606266;
          margin-top: 6px;

          .remark-label {
            color: #909399;
          }

          .remark-text {
            color: #606266;
          }
        }

        .log-effect-scope {
          margin-top: 8px;
        }
      }

      .log-tooltip {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px dashed #ebeef5;
        animation: fadeInUp 0.2s ease;

        .tooltip-section {
          margin-bottom: 12px;

          &:last-child {
            margin-bottom: 0;
          }

          .tooltip-title {
            font-size: 12px;
            font-weight: 600;
            color: #606266;
            margin-bottom: 8px;

            &.fail {
              color: #ff4d4f;
            }
          }

          .tooltip-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px 16px;
          }

          .tooltip-item {
            display: flex;
            justify-content: space-between;
            font-size: 12px;

            .tooltip-label {
              color: #909399;
            }

            .tooltip-value {
              color: #606266;
              font-weight: 500;
            }
          }

          .fail-reason-text {
            font-size: 12px;
            color: #ff4d4f;
            background: #fff1f0;
            padding: 8px 12px;
            border-radius: 4px;
          }
        }
      }
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .pagination-container {
    display: flex;
    justify-content: center;
    padding: 16px 20px;
    border-top: 1px solid #ebeef5;
    background: #fff;
  }
}
</style>
