<template>
  <div class="order-detail">
    <el-page-header @back="goBack" content="订单详情">
      <template #extra>
        <el-button v-if="orderInfo.status === 1" type="primary" @click="handleDispatch">
          <el-icon><Connection /></el-icon>
          派单
        </el-button>
        <el-button v-if="orderInfo.status < 5" type="danger" @click="handleCancel">
          <el-icon><Close /></el-icon>
          取消订单
        </el-button>
      </template>
    </el-page-header>

    <el-row :gutter="20" class="content">
      <el-col :span="16">
        <el-card class="info-card">
          <template #header>
            <span class="card-title">订单信息</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">{{ orderInfo.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <StatusTag
                :status="orderInfo.status"
                :status-map="OrderStatusMap"
                :color-map="OrderStatusColorMap"
              />
            </el-descriptions-item>
            <el-descriptions-item label="运力类型">
              <StatusTag
                :status="orderInfo.capacityType"
                :status-map="CapacityTypeMap"
                :color-map="CapacityTypeColorMap"
              />
            </el-descriptions-item>
            <el-descriptions-item label="距离">{{ orderInfo.distance }} 公里</el-descriptions-item>
            <el-descriptions-item label="预估时长">{{ orderInfo.duration }} 分钟</el-descriptions-item>
            <el-descriptions-item label="预估金额">¥{{ orderInfo.estimatedPrice }}</el-descriptions-item>
            <el-descriptions-item label="实际金额">
              <span class="actual-price">¥{{ orderInfo.actualPrice || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(orderInfo.createTime) }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="info-card">
          <template #header>
            <span class="card-title">行程信息</span>
          </template>
          <div class="route-info">
            <div class="route-item">
              <div class="point start">
                <span class="dot"></span>
                <span class="address">{{ orderInfo.startAddress }}</span>
              </div>
            </div>
            <div class="route-line">
              <span class="line"></span>
              <span class="distance">{{ orderInfo.distance }} km</span>
              <span class="line"></span>
            </div>
            <div class="route-item">
              <div class="point end">
                <span class="dot"></span>
                <span class="address">{{ orderInfo.endAddress }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="info-card">
          <template #header>
            <span class="card-title">时间轴</span>
          </template>
          <el-timeline>
            <el-timeline-item :timestamp="formatDate(orderInfo.createTime)" placement="top">
              订单创建
            </el-timeline-item>
            <el-timeline-item v-if="orderInfo.acceptTime" :timestamp="formatDate(orderInfo.acceptTime)" placement="top">
              司机接单
            </el-timeline-item>
            <el-timeline-item v-if="orderInfo.pickupTime" :timestamp="formatDate(orderInfo.pickupTime)" placement="top">
              开始行程
            </el-timeline-item>
            <el-timeline-item v-if="orderInfo.completeTime" :timestamp="formatDate(orderInfo.completeTime)" placement="top">
              行程结束
            </el-timeline-item>
            <el-timeline-item v-if="orderInfo.cancelTime" :timestamp="formatDate(orderInfo.cancelTime)" placement="top" type="danger">
              订单取消
              <div v-if="orderInfo.cancelReason" class="cancel-reason">
                取消原因：{{ orderInfo.cancelReason }}
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="info-card">
          <template #header>
            <span class="card-title">乘客信息</span>
          </template>
          <div class="user-info">
            <el-avatar :size="60" :src="orderInfo.passengerAvatar">
              {{ orderInfo.passengerName?.charAt(0) }}
            </el-avatar>
            <div class="info">
              <div class="name">{{ orderInfo.passengerName }}</div>
              <div class="phone">{{ formatPhone(orderInfo.passengerPhone) }}</div>
            </div>
          </div>
        </el-card>

        <el-card class="info-card">
          <template #header>
            <span class="card-title">司机信息</span>
          </template>
          <div v-if="orderInfo.driverName" class="user-info">
            <el-avatar :size="60" :src="orderInfo.driverAvatar">
              {{ orderInfo.driverName?.charAt(0) }}
            </el-avatar>
            <div class="info">
              <div class="name">{{ orderInfo.driverName }}</div>
              <div class="phone">{{ formatPhone(orderInfo.driverPhone) }}</div>
              <div class="vehicle" v-if="orderInfo.vehiclePlate">
                {{ orderInfo.vehiclePlate }}
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无司机" :image-size="80" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import StatusTag from '@/components/StatusTag/index.vue'
import { OrderStatusMap, OrderStatusColorMap } from '@/enums/order'
import { CapacityTypeMap, CapacityTypeColorMap } from '@/enums/capacity'
import { formatDate, formatPhone } from '@/utils/format'
import { getOrderDetailApi } from '@/api/order'

const route = useRoute()
const router = useRouter()

const orderInfo = reactive<any>({
  id: 0,
  orderNo: '',
  status: 1,
  capacityType: 1,
  startAddress: '',
  endAddress: '',
  distance: 0,
  duration: 0,
  estimatedPrice: 0,
  actualPrice: null,
  passengerName: '',
  passengerPhone: '',
  passengerAvatar: '',
  driverName: null,
  driverPhone: null,
  driverAvatar: null,
  vehiclePlate: null,
  createTime: '',
  acceptTime: null,
  pickupTime: null,
  completeTime: null,
  cancelTime: null,
  cancelReason: null
})

const goBack = () => {
  router.back()
}

const handleDispatch = () => {
  ElMessage.info('派单功能开发中')
}

const handleCancel = () => {
  ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
    type: 'warning',
    inputType: 'textarea',
    inputPlaceholder: '请输入取消原因'
  }).then(() => {
    ElMessage.success('订单已取消')
  })
}

const loadDetail = async () => {
  const id = route.params.id as string
  if (id) {
    try {
      const res = await getOrderDetailApi(Number(id))
      Object.assign(orderInfo, res.data)
    } catch (e: any) {
      ElMessage.error(e.message || '获取订单详情失败')
    }
  }
}

onMounted(() => {
  loadDetail()
})
</script>

<style lang="scss" scoped>
.order-detail {
  .content {
    margin-top: 20px;
  }

  .info-card {
    margin-bottom: 20px;

    .card-title {
      font-weight: 600;
      font-size: 15px;
    }
  }

  .actual-price {
    color: #f56c6c;
    font-weight: bold;
    font-size: 16px;
  }

  .route-info {
    padding: 20px 0;

    .route-item {
      .point {
        display: flex;
        align-items: center;
        gap: 10px;

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #67c23a;

          &.end {
            background: #f56c6c;
          }
        }

        .address {
          font-size: 14px;
          color: #303133;
        }
      }
    }

    .route-line {
      display: flex;
      align-items: center;
      padding: 10px 0 10px 5px;

      .line {
        flex: 1;
        height: 1px;
        background: #dcdfe6;
      }

      .distance {
        padding: 0 10px;
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .cancel-reason {
    font-size: 12px;
    color: #909399;
    margin-top: 5px;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 10px 0;

    .info {
      .name {
        font-size: 16px;
        font-weight: 500;
        color: #303133;
      }

      .phone {
        font-size: 13px;
        color: #909399;
        margin-top: 5px;
      }

      .vehicle {
        font-size: 13px;
        color: #409eff;
        margin-top: 5px;
      }
    }
  }
}
</style>
