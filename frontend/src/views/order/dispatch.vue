<template>
  <div class="order-dispatch">
    <el-row :gutter="20">
      <el-col :span="18">
        <el-card class="map-card">
          <template #header>
            <div class="card-header">
              <span>实时调度地图</span>
              <div class="legend">
                <span class="legend-item">
                  <span class="dot online"></span>
                  空闲司机
                </span>
                <span class="legend-item">
                  <span class="dot in-order"></span>
                  接单中
                </span>
                <span class="legend-item">
                  <span class="dot pending"></span>
                  待派单
                </span>
              </div>
            </div>
          </template>
          <div class="map-container">
            <div class="map-placeholder">
              <el-icon size="80" color="#dcdfe6"><Picture /></el-icon>
              <p>地图组件占位</p>
              <p class="sub-text">接入地图API后展示实时运力分布</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="pending-card">
          <template #header>
            <div class="card-header">
              <span>待派单列表</span>
              <el-badge :value="pendingOrders.length" class="item" />
            </div>
          </template>
          <div class="pending-list">
            <div
              v-for="order in pendingOrders"
              :key="order.id"
              class="pending-item"
              :class="{ active: selectedOrder?.id === order.id }"
              @click="selectOrder(order)"
            >
              <div class="order-no">{{ order.orderNo }}</div>
              <div class="order-route">
                <div class="point start">{{ order.startAddress }}</div>
                <div class="point end">{{ order.endAddress }}</div>
              </div>
              <div class="order-info">
                <span>{{ order.distance }}km</span>
                <span>¥{{ order.estimatedPrice }}</span>
                <StatusTag
                  :status="order.capacityType"
                  :status-map="CapacityTypeMap"
                  :color-map="CapacityTypeColorMap"
                />
              </div>
            </div>
            <el-empty v-if="pendingOrders.length === 0" description="暂无待派单" :image-size="60" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card v-if="selectedOrder" class="dispatch-card">
      <template #header>
        <div class="card-header">
          <span>订单派单</span>
          <span class="order-no">订单号：{{ selectedOrder.orderNo }}</span>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="order-summary">
            <div class="title">订单信息</div>
            <div class="item"><span>起&nbsp;&nbsp;&nbsp;点：</span>{{ selectedOrder.startAddress }}</div>
            <div class="item"><span>终&nbsp;&nbsp;&nbsp;点：</span>{{ selectedOrder.endAddress }}</div>
            <div class="item"><span>距&nbsp;&nbsp;&nbsp;离：</span>{{ selectedOrder.distance }}公里</div>
            <div class="item"><span>预估价格：</span>¥{{ selectedOrder.estimatedPrice }}</div>
            <div class="item"><span>运力类型：</span>
              <StatusTag
                :status="selectedOrder.capacityType"
                :status-map="CapacityTypeMap"
                :color-map="CapacityTypeColorMap"
              />
            </div>
          </div>
        </el-col>
        <el-col :span="16">
          <div class="driver-list-title">
            <span>推荐司机</span>
            <el-button type="primary" size="small" @click="refreshDrivers">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
          <el-table :data="recommendDrivers" size="small" max-height="300">
            <el-table-column label="司机" width="180">
              <template #default="{ row }">
                <div class="driver-info">
                  <el-avatar :size="32" :src="row.avatar">
                    {{ row.name?.charAt(0) }}
                  </el-avatar>
                  <div class="info">
                    <div class="name">{{ row.name }}</div>
                    <div class="sub">{{ row.vehiclePlate }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="distance" label="距离" width="100" align="right">
              <template #default="{ row }">{{ row.distance }}km</template>
            </el-table-column>
            <el-table-column prop="rating" label="评分" width="120" align="center">
              <template #default="{ row }">
                <el-rate v-model="row.rating" disabled size="small" />
              </template>
            </el-table-column>
            <el-table-column prop="orderCount" label="今日订单" width="100" align="right" />
            <el-table-column label="操作" width="100" align="center">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="handleDispatch(row)">派单</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import StatusTag from '@/components/StatusTag/index.vue'
import { CapacityTypeMap, CapacityTypeColorMap } from '@/enums/capacity'

const pendingOrders = ref([
  { id: 1, orderNo: 'DD202401010001', startAddress: '北京市朝阳区望京SOHO', endAddress: '北京市海淀区中关村', distance: 15.2, estimatedPrice: 45.5, capacityType: 1 },
  { id: 2, orderNo: 'DD202401010002', startAddress: '北京市东城区王府井', endAddress: '北京市西城区金融街', distance: 5.8, estimatedPrice: 18.2, capacityType: 1 },
  { id: 3, orderNo: 'DD202401010003', startAddress: '北京市丰台区丽泽', endAddress: '北京市朝阳区国贸', distance: 12.5, estimatedPrice: 38.8, capacityType: 2 }
])

const selectedOrder = ref<any>(null)

const recommendDrivers = ref([
  { id: 1, name: '张师傅', phone: '13800138001', avatar: '', vehiclePlate: '京A12345', distance: 0.8, rating: 4.9, orderCount: 25 },
  { id: 2, name: '李师傅', phone: '13800138002', avatar: '', vehiclePlate: '京B23456', distance: 1.2, rating: 4.8, orderCount: 18 },
  { id: 3, name: '王师傅', phone: '13800138003', avatar: '', vehiclePlate: '京C34567', distance: 1.5, rating: 4.7, orderCount: 32 }
])

const selectOrder = (order: any) => {
  selectedOrder.value = order
}

const refreshDrivers = () => {
  ElMessage.success('已刷新推荐司机列表')
}

const handleDispatch = (driver: any) => {
  ElMessage.success(`已派单给 ${driver.name}`)
  if (selectedOrder.value) {
    pendingOrders.value = pendingOrders.value.filter(o => o.id !== selectedOrder.value.id)
    selectedOrder.value = null
  }
}

onMounted(() => {
  if (pendingOrders.value.length > 0) {
    selectedOrder.value = pendingOrders.value[0]
  }
})
</script>

<style lang="scss" scoped>
.order-dispatch {
  .map-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .legend {
        display: flex;
        gap: 20px;

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #606266;

          .dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;

            &.online {
              background: #67c23a;
            }

            &.in-order {
              background: #409eff;
            }

            &.pending {
              background: #e6a23c;
            }
          }
        }
      }
    }
  }

  .map-container {
    height: 400px;
    background: #f5f7fa;
    border-radius: 4px;

    .map-placeholder {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #c0c4cc;

      p {
        margin-top: 10px;
        font-size: 14px;

        &.sub-text {
          font-size: 12px;
          color: #dcdfe6;
          margin-top: 5px;
        }
      }
    }
  }

  .pending-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .order-no {
        font-size: 12px;
      }
    }

    .pending-list {
      max-height: 380px;
      overflow-y: auto;

      .pending-item {
        padding: 12px;
        border: 1px solid #ebeef5;
        border-radius: 4px;
        margin-bottom: 10px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover, &.active {
          border-color: #409eff;
          background: #ecf5ff;
        }

        .order-no {
          font-size: 13px;
          font-weight: 500;
          color: #303133;
          margin-bottom: 8px;
        }

        .order-route {
          .point {
            font-size: 12px;
            color: #606266;
            padding: 2px 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;

            &.start::before {
              content: '';
              display: inline-block;
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background: #67c23a;
              margin-right: 6px;
            }

            &.end::before {
              content: '';
              display: inline-block;
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background: #f56c6c;
              margin-right: 6px;
            }
          }
        }

        .order-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .dispatch-card {
    margin-top: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .order-no {
        font-size: 13px;
        color: #606266;
      }
    }

    .order-summary {
      .title {
        font-weight: 500;
        color: #303133;
        margin-bottom: 15px;
      }

      .item {
        font-size: 13px;
        color: #606266;
        padding: 6px 0;

        span {
          color: #909399;
        }
      }
    }

    .driver-list-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      font-weight: 500;
      color: #303133;
    }

    .driver-info {
      display: flex;
      align-items: center;
      gap: 8px;

      .info {
        .name {
          font-size: 13px;
          font-weight: 500;
        }

        .sub {
          font-size: 11px;
          color: #909399;
        }
      }
    }
  }
}
</style>
