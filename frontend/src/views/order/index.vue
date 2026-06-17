<template>
  <div class="order-list">
    <CommonTable
      ref="tableRef"
      :loading="loading"
      :data="tableData"
      :total="total"
      :page="queryParams.page"
      :page-size="queryParams.pageSize"
      :show-search="true"
      :show-selection="true"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
      @selection-change="handleSelectionChange"
    >
      <template #search>
        <el-form :model="searchForm" :inline="true" @submit.prevent>
          <el-form-item label="订单号">
            <el-input
              v-model="searchForm.orderNo"
              placeholder="请输入订单号"
              clearable
              @keyup.enter="handleFormSearch"
            />
          </el-form-item>
          <el-form-item label="订单状态">
            <el-select
              v-model="searchForm.status"
              placeholder="请选择订单状态"
              clearable
            >
              <el-option value="1" label="待接单" />
              <el-option value="2" label="已派单" />
              <el-option value="3" label="接驾中" />
              <el-option value="4" label="行程中" />
              <el-option value="5" label="已完成" />
              <el-option value="6" label="已取消" />
              <el-option value="7" label="已过期" />
            </el-select>
          </el-form-item>
          <el-form-item label="支付状态">
            <el-select
              v-model="searchForm.payStatus"
              placeholder="请选择支付状态"
              clearable
            >
              <el-option :value="0" label="未支付" />
              <el-option :value="1" label="已支付" />
              <el-option :value="2" label="退款中" />
              <el-option :value="3" label="已退款" />
            </el-select>
          </el-form-item>
          <el-form-item label="服务类型">
            <el-select
              v-model="searchForm.capacityType"
              placeholder="请选择服务类型"
              clearable
            >
              <el-option :value="1" label="快车" />
              <el-option :value="2" label="专车" />
              <el-option :value="3" label="豪华车" />
              <el-option :value="4" label="拼车" />
              <el-option :value="5" label="出租车" />
            </el-select>
          </el-form-item>
          <el-form-item label="订单来源">
            <el-select
              v-model="searchForm.orderSource"
              placeholder="请选择订单来源"
              clearable
            >
              <el-option :value="1" label="APP下单" />
              <el-option :value="2" label="小程序" />
              <el-option :value="3" label="客服代下" />
              <el-option :value="4" label="企业用车" />
            </el-select>
          </el-form-item>
          <el-form-item label="乘客姓名">
            <el-input
              v-model="searchForm.passengerName"
              placeholder="请输入乘客姓名"
              clearable
              @keyup.enter="handleFormSearch"
            />
          </el-form-item>
          <el-form-item label="司机姓名">
            <el-input
              v-model="searchForm.driverName"
              placeholder="请输入司机姓名"
              clearable
              @keyup.enter="handleFormSearch"
            />
          </el-form-item>
          <el-form-item label="创建时间">
            <el-date-picker
              v-model="dateTimeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 360px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleFormSearch">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="handleFormReset">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </template>

      <template #toolbar>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增订单
        </el-button>
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
        <el-dropdown
          trigger="click"
          :disabled="selectedRows.length === 0"
          @command="handleBatchCommand"
        >
          <el-button type="primary" plain :disabled="selectedRows.length === 0">
            <el-icon><MoreFilled /></el-icon>
            批量操作
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                command="updatePriceRule"
                :disabled="!canBatchUpdatePriceRule"
              >
                批量修改计费规则
              </el-dropdown-item>
              <el-dropdown-item
                command="dispatch"
                :disabled="!canBatchDispatch"
              >
                批量派单
              </el-dropdown-item>
              <el-dropdown-item
                command="cancel"
                :disabled="!canBatchCancel"
              >
                批量取消
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>

      <template #toolbar-right>
        <el-button @click="getList">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </template>

      <el-table-column label="订单号" width="200">
        <template #default="{ row }">
          <el-tooltip
            placement="top-start"
            :show-after="300"
            popper-class="trace-tooltip"
          >
            <span class="order-no-text">{{ row.orderNo }}</span>
            <template #content>
              <div class="trace-quick">
                <div class="trace-title">快速溯源</div>
                <div class="trace-item">
                  <span class="trace-label">订单状态：</span>
                  <StatusTag
                    :status="row.status"
                    :status-map="OrderStatusMap"
                    :color-map="OrderStatusColorMap"
                  />
                </div>
                <div class="trace-item">
                  <span class="trace-label">乘客姓名：</span>
                  <span>{{ row.passengerName }}</span>
                </div>
                <div class="trace-item">
                  <span class="trace-label">司机姓名：</span>
                  <span>{{ row.driverName || '-' }}</span>
                </div>
                <div class="trace-item">
                  <span class="trace-label">金额：</span>
                  <span class="price">¥{{ row.actualPrice || row.estimatedPrice || 0 }}</span>
                </div>
                <div class="trace-item">
                  <span class="trace-label">创建时间：</span>
                  <span>{{ formatDate(row.createTime) }}</span>
                </div>
                <el-button
                  type="primary"
                  size="small"
                  class="trace-btn"
                  @click.stop="handleTrace(row)"
                >
                  查看完整溯源
                </el-button>
              </div>
            </template>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="乘客信息" width="160">
        <template #default="{ row }">
          <div>{{ row.passengerName }}</div>
          <div class="sub-text">{{ formatPhone(row.passengerPhone) }}</div>
        </template>
      </el-table-column>
      <el-table-column label="司机信息" width="160">
        <template #default="{ row }">
          <div>{{ row.driverName || '-' }}</div>
          <div class="sub-text">{{ row.driverPhone ? formatPhone(row.driverPhone) : '-' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="服务类型" width="100" align="center">
        <template #default="{ row }">
          {{ ServiceTypeMap[row.capacityType] || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="订单来源" width="100" align="center">
        <template #default="{ row }">
          {{ OrderSourceMap[row.orderSource || 0] || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="支付状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="PayStatusTagTypeMap[row.payStatus || 0]">
            {{ PayStatusMap[row.payStatus || 0] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="起点" show-overflow-tooltip>
        <template #default="{ row }">{{ row.startAddress }}</template>
      </el-table-column>
      <el-table-column label="终点" show-overflow-tooltip>
        <template #default="{ row }">{{ row.endAddress }}</template>
      </el-table-column>
      <el-table-column prop="actualPrice" label="金额" width="100" align="right">
        <template #default="{ row }">
          <span class="price">¥{{ row.actualPrice || row.estimatedPrice || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <StatusTag
            :status="row.status"
            :status-map="OrderStatusMap"
            :color-map="OrderStatusColorMap"
          />
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170">
        <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right" align="center">
        <template #default="{ row }">
          <transition-group name="fade" tag="div" class="action-buttons">
            <el-button
              v-for="btn in getActionButtons(row)"
              :key="btn.key"
              :type="btn.type"
              link
              size="small"
              @click="btn.handler(row)"
            >
              {{ btn.label }}
            </el-button>
          </transition-group>
        </template>
      </el-table-column>
    </CommonTable>

    <DetailDialog
      v-model="detailVisible"
      title="订单详情"
      :fields="detailFields"
      :detail-data="currentDetail"
      :loading="detailLoading"
    />

    <el-dialog
      v-model="editDialogVisible"
      title="编辑订单"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="100px"
      >
        <el-alert
          v-if="focusedField === 'startAddress' || focusedField === 'endAddress'"
          title="地址变更会影响预估费用，请确保地址准确"
          type="info"
          :closable="false"
          class="mb-16"
        />
        <el-alert
          v-if="focusedField === 'distance' || focusedField === 'duration'"
          title="里程和时长会直接影响费用计算"
          type="info"
          :closable="false"
          class="mb-16"
        />
        <el-form-item label="起点地址" prop="startAddress">
          <el-input
            v-model="editForm.startAddress"
            type="textarea"
            :rows="2"
            @focus="handleFieldFocus('startAddress')"
            @blur="handleFieldBlur"
          />
        </el-form-item>
        <el-form-item label="终点地址" prop="endAddress">
          <el-input
            v-model="editForm.endAddress"
            type="textarea"
            :rows="2"
            @focus="handleFieldFocus('endAddress')"
            @blur="handleFieldBlur"
          />
        </el-form-item>
        <el-form-item
          label="里程(公里)"
          prop="distance"
          :class="{ 'is-error': !priceValidateResult?.isValid }"
        >
          <el-input-number
            v-model="editForm.distance"
            :min="0"
            :precision="1"
            :step="0.5"
            style="width: 100%"
            @change="handleDistanceChange"
            @focus="handleFieldFocus('distance')"
            @blur="handleFieldBlur"
          />
          <div v-if="!priceValidateResult?.isValid" class="price-warning">
            <el-icon><Warning /></el-icon>
            <span>预估费用偏差超过{{ priceValidateResult?.threshold }}%，建议核对里程</span>
          </div>
        </el-form-item>
        <el-form-item label="预计时长(分钟)" prop="duration">
          <el-input-number
            v-model="editForm.duration"
            :min="0"
            :precision="0"
            :step="5"
            style="width: 100%"
            @focus="handleFieldFocus('duration')"
            @blur="handleFieldBlur"
          />
        </el-form-item>
        <el-form-item label="预估费用">
          <span class="estimated-price">¥{{ editForm.estimatedPrice || 0 }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSubmitting" @click="handleEditSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="traceDialogVisible"
      title="全链路溯源"
      width="800px"
      class="trace-dialog"
    >
      <div class="trace-search">
        <el-input
          v-model="traceSearchOrderNo"
          placeholder="请输入订单号查询溯源"
          clearable
          style="width: 300px"
          @keyup.enter="handleTraceSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleTraceSearch">查询</el-button>
      </div>
      <el-alert
        v-if="traceData?.isRepeated"
        :title="`您已在1小时内查询过该订单，这是第${traceData.repeatCount}次查询`"
        type="warning"
        :closable="false"
        class="mb-16"
      />
      <el-tabs v-if="traceData" v-model="traceActiveTab">
        <el-tab-pane label="订单信息" name="order">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">
              {{ traceData.order.orderNo }}
            </el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <StatusTag
                :status="traceData.order.status"
                :status-map="OrderStatusMap"
                :color-map="OrderStatusColorMap"
              />
            </el-descriptions-item>
            <el-descriptions-item label="服务类型">
              {{ ServiceTypeMap[traceData.order.capacityType] || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="订单来源">
              {{ OrderSourceMap[traceData.order.orderSource || 0] || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="起点地址" :span="2">
              {{ traceData.order.startAddress }}
            </el-descriptions-item>
            <el-descriptions-item label="终点地址" :span="2">
              {{ traceData.order.endAddress }}
            </el-descriptions-item>
            <el-descriptions-item label="里程">
              {{ traceData.order.distance }}公里
            </el-descriptions-item>
            <el-descriptions-item label="预计时长">
              {{ traceData.order.duration }}分钟
            </el-descriptions-item>
            <el-descriptions-item label="预估费用">
              ¥{{ traceData.order.estimatedPrice }}
            </el-descriptions-item>
            <el-descriptions-item label="实际费用">
              ¥{{ traceData.order.actualPrice || 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ formatDate(traceData.order.createTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="完成时间">
              {{ traceData.order.completeTime ? formatDate(traceData.order.completeTime) : '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        <el-tab-pane label="乘客信息" name="passenger">
          <el-descriptions :column="2" border v-if="traceData.passenger">
            <el-descriptions-item label="乘客姓名">
              {{ traceData.passenger.name || traceData.passenger.passengerName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="联系电话">
              {{ formatPhone(traceData.passenger.phone || traceData.passenger.passengerPhone || '') }}
            </el-descriptions-item>
            <el-descriptions-item label="总订单数">
              {{ traceData.passenger.totalOrders || 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="总消费">
              ¥{{ traceData.passenger.totalConsume || 0 }}
            </el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="暂无乘客信息" />
        </el-tab-pane>
        <el-tab-pane label="司机信息" name="driver">
          <el-descriptions :column="2" border v-if="traceData.driver">
            <el-descriptions-item label="司机姓名">
              {{ traceData.driver.name || traceData.driver.driverName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="联系电话">
              {{ formatPhone(traceData.driver.phone || traceData.driver.driverPhone || '') }}
            </el-descriptions-item>
            <el-descriptions-item label="评分">
              <el-rate
                :model-value="traceData.driver.rating || 0"
                disabled
                show-score
                text-color="#ff9900"
                score-template="{value}"
              />
            </el-descriptions-item>
            <el-descriptions-item label="车牌号">
              {{ traceData.vehicle?.plate || traceData.driver.vehiclePlate || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="车辆型号" :span="2">
              {{ traceData.vehicle?.model || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="车辆颜色">
              {{ traceData.vehicle?.color || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="座位数">
              {{ traceData.vehicle?.seats || '-' }}座
            </el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="暂无司机信息" />
        </el-tab-pane>
        <el-tab-pane label="支付记录" name="payment">
          <el-table :data="traceData.statements || []" border>
            <el-table-column prop="id" label="流水号" width="180" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                {{ row.type === 1 ? '支付' : row.type === 2 ? '退款' : '其他' }}
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="100">
              <template #default="{ row }">¥{{ row.amount }}</template>
            </el-table-column>
            <el-table-column prop="payMethod" label="支付方式" width="120">
              <template #default="{ row }">
                {{ row.payMethod === 1 ? '微信' : row.payMethod === 2 ? '支付宝' : '其他' }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                  {{ row.status === 1 ? '成功' : '处理中' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="时间" width="170">
              <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!traceData.statements?.length" description="暂无支付记录" />
        </el-tab-pane>
        <el-tab-pane label="状态日志" name="logs">
          <el-timeline>
            <el-timeline-item
              v-for="log in traceData.statusLogs"
              :key="log.id"
              :timestamp="formatDate(log.createTime)"
              placement="top"
            >
              <el-card>
                <h4>{{ OrderStatusMap[log.newStatus] || '未知状态' }}</h4>
                <p>
                  操作人：{{ log.operatorName || '系统' }}
                  <span v-if="log.operatorType">
                    ({{ log.operatorType === 1 ? '乘客' : log.operatorType === 2 ? '司机' : '系统' }})
                  </span>
                </p>
                <p v-if="log.changeReason">变更原因：{{ log.changeReason }}</p>
                <p v-if="log.remark">备注：{{ log.remark }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-if="!traceData.statusLogs?.length" description="暂无状态日志" />
        </el-tab-pane>
        <el-tab-pane label="数据完整性" name="integrity">
          <div class="integrity-card">
            <div class="integrity-score" :class="{ 'low': (traceData.integrity?.score || 0) < 80 }">
              <span class="score-number">{{ traceData.integrity?.score || 0 }}</span>
              <span class="score-label">分</span>
            </div>
            <div class="integrity-info">
              <p>
                总模块数：<b>{{ traceData.integrity?.totalModules || 0 }}</b>
              </p>
              <p>
                已完成：
                <span class="text-success">
                  <b>{{ traceData.integrity?.completeCount || 0 }}</b>
                </span>
              </p>
              <p>
                缺失：
                <span class="text-danger">
                  <b>{{ traceData.integrity?.missingCount || 0 }}</b>
                </span>
              </p>
            </div>
          </div>
          <el-alert
            v-if="(traceData.integrity?.score || 0) < 80"
            title="数据完整性低于80%，存在数据缺失风险"
            type="error"
            :closable="false"
            class="mb-16"
          />
          <el-divider>已完成模块</el-divider>
          <div class="module-list">
            <el-tag
              v-for="item in traceData.integrity?.complete || []"
              :key="item"
              type="success"
              effect="light"
              style="margin: 4px"
            >
              {{ item }}
            </el-tag>
          </div>
          <el-divider>缺失模块</el-divider>
          <div class="module-list">
            <el-tag
              v-for="item in traceData.integrity?.missing || []"
              :key="item"
              type="danger"
              effect="light"
              style="margin: 4px"
            >
              {{ item }}
            </el-tag>
          </div>
        </el-tab-pane>
      </el-tabs>
      <el-empty v-else-if="!traceLoading" description="请输入订单号查询溯源信息" />
    </el-dialog>

    <el-dialog
      v-model="batchProgressVisible"
      title="批量操作进度"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="batch-progress">
        <div class="progress-title">{{ batchOpTitle }}</div>
        <el-progress
          :percentage="batchProgress"
          :status="batchProgressStatus"
          :stroke-width="20"
        />
        <div class="progress-stats">
          <span>总数：{{ batchStats.total }}</span>
          <span class="success">成功：{{ batchStats.success }}</span>
          <span class="failed">失败：{{ batchStats.failed }}</span>
        </div>
        <div v-if="batchFailedList.length > 0" class="failed-list">
          <div class="failed-title">失败订单：</div>
          <div v-for="item in batchFailedList" :key="item.id" class="failed-item">
            <span>{{ item.orderNo || item.id }}</span>
            <span class="failed-reason">{{ item.reason }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button v-if="batchProgress >= 100" @click="batchProgressVisible = false">
          关闭
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules
} from 'element-plus'
import {
  Plus,
  Delete,
  Refresh,
  MoreFilled,
  ArrowDown,
  Search,
  Warning
} from '@element-plus/icons-vue'
import CommonTable from '@/components/CommonTable/index.vue'
import StatusTag from '@/components/StatusTag/index.vue'
import DetailDialog from '@/components/DetailDialog/index.vue'
import {
  getOrderListApi,
  deleteOrderApi,
  getOrderDetailApi,
  getEditConditionsApi,
  validatePriceApi,
  updateOrderBaseInfoApi,
  getOrderTraceApi,
  batchUpdatePriceRuleApi,
  batchDispatchApi,
  cancelOrderApi
} from '@/api/order'
import { OrderStatusMap, OrderStatusColorMap, OrderStatus } from '@/enums/order'
import { formatDate, formatPhone } from '@/utils/format'
import type {
  Order,
  OrderQueryParams,
  PriceValidateResult,
  OrderTraceData,
  BatchOpResult
} from '@/types/order'

const PayStatusMap: Record<number, string> = {
  0: '未支付',
  1: '已支付',
  2: '退款中',
  3: '已退款'
}

const PayStatusTagTypeMap: Record<number, string> = {
  0: 'info',
  1: 'success',
  2: 'warning',
  3: 'danger'
}

const ServiceTypeMap: Record<number, string> = {
  1: '快车',
  2: '专车',
  3: '豪华车',
  4: '拼车',
  5: '出租车'
}

const OrderSourceMap: Record<number, string> = {
  1: 'APP下单',
  2: '小程序',
  3: '客服代下',
  4: '企业用车'
}

const tableRef = ref()
const loading = ref(false)
const tableData = ref<Order[]>([])
const total = ref(0)
const selectedRows = ref<Order[]>([])

const queryParams = reactive<OrderQueryParams>({
  page: 1,
  pageSize: 10,
  orderNo: '',
  status: undefined,
  passengerName: '',
  driverName: '',
  payStatus: undefined,
  capacityType: undefined,
  orderSource: undefined,
  startTime: '',
  endTime: ''
})

const dateTimeRange = ref<string[]>([])

const searchForm = reactive({
  orderNo: '',
  status: '',
  payStatus: undefined as number | undefined,
  capacityType: undefined as number | undefined,
  orderSource: undefined as number | undefined,
  passengerName: '',
  driverName: ''
})

watch(dateTimeRange, (val) => {
  if (val && val.length === 2) {
    queryParams.startTime = val[0]
    queryParams.endTime = val[1]
  } else {
    queryParams.startTime = ''
    queryParams.endTime = ''
  }
})

const handleFormSearch = () => {
  queryParams.page = 1
  queryParams.orderNo = searchForm.orderNo
  queryParams.status = searchForm.status ? Number(searchForm.status) : undefined
  queryParams.payStatus = searchForm.payStatus
  queryParams.capacityType = searchForm.capacityType
  queryParams.orderSource = searchForm.orderSource
  queryParams.passengerName = searchForm.passengerName
  queryParams.driverName = searchForm.driverName
  getList()
}

const handleFormReset = () => {
  searchForm.orderNo = ''
  searchForm.status = ''
  searchForm.payStatus = undefined
  searchForm.capacityType = undefined
  searchForm.orderSource = undefined
  searchForm.passengerName = ''
  searchForm.driverName = ''
  dateTimeRange.value = []
  queryParams.page = 1
  queryParams.pageSize = 10
  queryParams.orderNo = ''
  queryParams.status = undefined
  queryParams.payStatus = undefined
  queryParams.capacityType = undefined
  queryParams.orderSource = undefined
  queryParams.passengerName = ''
  queryParams.driverName = ''
  queryParams.startTime = ''
  queryParams.endTime = ''
  getList()
}

const detailFields = [
  { prop: 'orderNo', label: '订单号' },
  { prop: 'status', label: '订单状态', type: 'status', statusMap: OrderStatusMap, colorMap: OrderStatusColorMap },
  { prop: 'passengerName', label: '乘客姓名' },
  { prop: 'passengerPhone', label: '乘客电话' },
  { prop: 'driverName', label: '司机姓名' },
  { prop: 'driverPhone', label: '司机电话' },
  { prop: 'startAddress', label: '起点地址' },
  { prop: 'endAddress', label: '终点地址' },
  { prop: 'distance', label: '距离(公里)' },
  { prop: 'duration', label: '预计时长(分钟)' },
  { prop: 'estimatedPrice', label: '预估金额', type: 'money' },
  { prop: 'actualPrice', label: '实际金额', type: 'money' },
  { prop: 'createTime', label: '创建时间', type: 'date' },
  { prop: 'acceptTime', label: '接单时间', type: 'date' },
  { prop: 'pickupTime', label: '接驾时间', type: 'date' },
  { prop: 'completeTime', label: '完成时间', type: 'date' }
]

const detailVisible = ref(false)
const detailLoading = ref(false)
const currentDetail = ref<any>({})

const canBatchUpdatePriceRule = computed(() => {
  if (selectedRows.value.length === 0) return false
  return selectedRows.value.every(row =>
    row.status === OrderStatus.PENDING ||
    row.status === OrderStatus.DISPATCHED
  )
})

const canBatchDispatch = computed(() => {
  if (selectedRows.value.length === 0) return false
  return selectedRows.value.every(row => row.status === OrderStatus.PENDING)
})

const canBatchCancel = computed(() => {
  if (selectedRows.value.length === 0) return false
  return selectedRows.value.every(row =>
    row.status === OrderStatus.IN_PROGRESS
  )
})

const getActionButtons = (row: Order) => {
  const status = row.status
  const buttons: Array<{ key: string; label: string; type: string; handler: (row: Order) => void }> = []

  switch (status) {
    case OrderStatus.PENDING:
      buttons.push(
        { key: 'dispatch', label: '派单', type: 'primary', handler: handleDispatch },
        { key: 'cancel', label: '取消', type: 'danger', handler: handleCancel },
        { key: 'view', label: '详情', type: 'primary', handler: handleView },
        { key: 'edit', label: '编辑', type: 'primary', handler: handleEdit }
      )
      break
    case OrderStatus.DISPATCHED:
      buttons.push(
        { key: 'pickup', label: '接驾', type: 'primary', handler: handlePickup },
        { key: 'reassign', label: '改派', type: 'primary', handler: handleReassign },
        { key: 'cancel', label: '取消', type: 'danger', handler: handleCancel },
        { key: 'view', label: '详情', type: 'primary', handler: handleView }
      )
      break
    case OrderStatus.PICKING_UP:
      buttons.push(
        { key: 'start', label: '开始行程', type: 'primary', handler: handleStartTrip },
        { key: 'cancel', label: '取消', type: 'danger', handler: handleCancel },
        { key: 'view', label: '详情', type: 'primary', handler: handleView }
      )
      break
    case OrderStatus.IN_PROGRESS:
      buttons.push(
        { key: 'complete', label: '完成', type: 'success', handler: handleComplete },
        { key: 'view', label: '详情', type: 'primary', handler: handleView },
        { key: 'edit', label: '编辑', type: 'primary', handler: handleEdit }
      )
      break
    case OrderStatus.COMPLETED:
      buttons.push(
        { key: 'settle', label: '对账', type: 'primary', handler: handleSettle },
        { key: 'trace', label: '溯源', type: 'primary', handler: handleTrace },
        { key: 'view', label: '详情', type: 'primary', handler: handleView }
      )
      break
    case OrderStatus.CANCELLED:
      buttons.push(
        { key: 'view', label: '详情', type: 'primary', handler: handleView },
        { key: 'refund', label: '退款', type: 'warning', handler: handleRefund },
        { key: 'trace', label: '溯源', type: 'primary', handler: handleTrace }
      )
      break
    case OrderStatus.EXPIRED:
      buttons.push(
        { key: 'view', label: '详情', type: 'primary', handler: handleView },
        { key: 'trace', label: '溯源', type: 'primary', handler: handleTrace }
      )
      break
    default:
      buttons.push(
        { key: 'view', label: '详情', type: 'primary', handler: handleView }
      )
  }

  return buttons
}

const editDialogVisible = ref(false)
const editFormRef = ref<FormInstance>()
const editSubmitting = ref(false)
const currentEditOrder = ref<Order | null>(null)
const priceValidateResult = ref<PriceValidateResult | null>(null)
const focusedField = ref('')

const editForm = reactive({
  startAddress: '',
  endAddress: '',
  distance: 0,
  duration: 0,
  estimatedPrice: 0
})

const editRules: FormRules = {
  startAddress: [{ required: true, message: '请输入起点地址', trigger: 'blur' }],
  endAddress: [{ required: true, message: '请输入终点地址', trigger: 'blur' }],
  distance: [{ required: true, message: '请输入里程', trigger: 'blur' }],
  duration: [{ required: true, message: '请输入预计时长', trigger: 'blur' }]
}

const traceDialogVisible = ref(false)
const traceLoading = ref(false)
const traceData = ref<OrderTraceData | null>(null)
const traceSearchOrderNo = ref('')
const traceActiveTab = ref('order')

const batchProgressVisible = ref(false)
const batchProgress = ref(0)
const batchProgressStatus = ref<'success' | 'warning' | 'danger' | ''>('')
const batchOpTitle = ref('')
const batchStats = reactive({
  total: 0,
  success: 0,
  failed: 0
})
const batchFailedList = ref<Array<{ id: number; orderNo?: string; reason: string }>>([])

const getList = async () => {
  loading.value = true
  try {
    const res = await getOrderListApi(queryParams)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取订单列表失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  queryParams.page = page
  getList()
}

const handleSizeChange = (size: number) => {
  queryParams.pageSize = size
  queryParams.page = 1
  getList()
}

const handleSelectionChange = (selection: Order[]) => {
  selectedRows.value = selection
}

const handleAdd = () => {
  ElMessage.info('新增订单功能开发中')
}

const handleView = async (row: Order) => {
  detailLoading.value = true
  detailVisible.value = true
  try {
    const res = await getOrderDetailApi(row.id)
    currentDetail.value = res.data
  } catch (error: any) {
    ElMessage.error(error.message || '获取订单详情失败')
  } finally {
    detailLoading.value = false
  }
}

const handleEdit = async (row: Order) => {
  try {
    const res = await getEditConditionsApi(row.id)
    if (!res.data.canEdit) {
      ElMessageBox.alert(
        `该订单不可编辑，原因：\n${res.data.reasons.join('\n')}`,
        '提示',
        { type: 'warning' }
      )
      return
    }
    currentEditOrder.value = row
    editForm.startAddress = row.startAddress
    editForm.endAddress = row.endAddress
    editForm.distance = row.distance
    editForm.duration = row.duration
    editForm.estimatedPrice = row.estimatedPrice
    priceValidateResult.value = null
    editDialogVisible.value = true
  } catch (error: any) {
    ElMessage.error(error.message || '获取编辑条件失败')
  }
}

const handleFieldFocus = (field: string) => {
  focusedField.value = field
}

const handleFieldBlur = () => {
  focusedField.value = ''
}

const handleDistanceChange = async () => {
  if (!currentEditOrder.value) return
  try {
    const res = await validatePriceApi({
      distance: editForm.distance,
      capacityType: currentEditOrder.value.capacityType,
      estimatedPrice: editForm.estimatedPrice
    })
    priceValidateResult.value = res.data
  } catch (error) {
    console.error('价格校验失败', error)
  }
}

const handleEditSubmit = async () => {
  if (!editFormRef.value || !currentEditOrder.value) return

  await editFormRef.value.validate(async (valid) => {
    if (!valid) return

    editSubmitting.value = true
    try {
      await updateOrderBaseInfoApi(currentEditOrder.value.id, {
        startAddress: editForm.startAddress,
        endAddress: editForm.endAddress,
        distance: editForm.distance,
        duration: editForm.duration
      })
      ElMessage.success('编辑成功')
      editDialogVisible.value = false
      getList()
    } catch (error: any) {
      ElMessage.error(error.message || '编辑失败')
    } finally {
      editSubmitting.value = false
    }
  })
}

const handleDelete = (row: Order) => {
  ElMessageBox.confirm('确定要删除该订单吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await deleteOrderApi(row.id)
      ElMessage.success('删除成功')
      getList()
    } catch (error: any) {
      ElMessage.error(error.message || '删除失败')
    }
  })
}

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条订单吗？`, '提示', {
    type: 'warning'
  }).then(() => {
    ElMessage.success('批量删除成功')
    getList()
  })
}

const handleDispatch = (row: Order) => {
  ElMessage.info('派单功能开发中')
}

const handleCancel = (row: Order) => {
  ElMessageBox.prompt('请输入取消原因', '取消订单', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async ({ value }) => {
    try {
      await cancelOrderApi(row.id, value)
      ElMessage.success('取消成功')
      getList()
    } catch (error: any) {
      ElMessage.error(error.message || '取消失败')
    }
  }).catch(() => {})
}

const handlePickup = (row: Order) => {
  ElMessage.info('接驾功能开发中')
}

const handleReassign = (row: Order) => {
  ElMessage.info('改派功能开发中')
}

const handleStartTrip = (row: Order) => {
  ElMessage.info('开始行程功能开发中')
}

const handleComplete = (row: Order) => {
  ElMessage.info('完成订单功能开发中')
}

const handleSettle = (row: Order) => {
  ElMessage.info('对账功能开发中')
}

const handleRefund = (row: Order) => {
  ElMessage.info('退款功能开发中')
}

const handleTrace = (row: Order) => {
  traceSearchOrderNo.value = row.orderNo
  traceDialogVisible.value = true
  traceActiveTab.value = 'order'
  handleTraceSearch()
}

const handleTraceSearch = async () => {
  if (!traceSearchOrderNo.value) {
    ElMessage.warning('请输入订单号')
    return
  }
  traceLoading.value = true
  traceData.value = null
  try {
    const res = await getOrderTraceApi(traceSearchOrderNo.value)
    traceData.value = res.data
  } catch (error: any) {
    ElMessage.error(error.message || '查询溯源信息失败')
  } finally {
    traceLoading.value = false
  }
}

const handleBatchCommand = async (command: string) => {
  const orders = selectedRows.value
  if (orders.length === 0) return

  switch (command) {
    case 'updatePriceRule':
      batchOpTitle.value = '批量修改计费规则'
      await runBatchOperation(
        orders,
        batchUpdatePriceRule,
        '批量修改计费规则'
      )
      break
    case 'dispatch':
      batchOpTitle.value = '批量派单'
      await runBatchOperation(
        orders,
        batchDispatch,
        '批量派单'
      )
      break
    case 'cancel':
      batchOpTitle.value = '批量取消'
      await runBatchOperation(
        orders,
        batchCancel,
        '批量取消'
      )
      break
  }
}

const batchUpdatePriceRule = async (orders: Order[]): Promise<BatchOpResult> => {
  const ids = orders.map(o => o.id)
  const res = await batchUpdatePriceRuleApi(ids, { basePrice: 10, perKmPrice: 2 })
  return res.data
}

const batchDispatch = async (orders: Order[]): Promise<BatchOpResult> => {
  const ids = orders.map(o => o.id)
  const res = await batchDispatchApi(ids)
  return res.data as any
}

const batchCancel = async (orders: Order[]): Promise<BatchOpResult> => {
  const results: Array<{ id: number; orderNo?: string; reason: string }> = []
  let success = 0
  let failed = 0

  for (const order of orders) {
    try {
      await cancelOrderApi(order.id, '批量取消')
      success++
    } catch (error: any) {
      failed++
      results.push({ id: order.id, orderNo: order.orderNo, reason: error.message || '取消失败' })
    }
  }

  return {
    success,
    failed,
    total: orders.length,
    failedOrders: results,
    progress: 100
  }
}

const runBatchOperation = async (
  orders: Order[],
  op: (orders: Order[]) => Promise<BatchOpResult>,
  title: string
) => {
  batchProgressVisible.value = true
  batchProgress.value = 0
  batchProgressStatus.value = ''
  batchStats.total = orders.length
  batchStats.success = 0
  batchStats.failed = 0
  batchFailedList.value = []

  const total = orders.length
  const batchSize = Math.ceil(total / 10)

  try {
    for (let i = 0; i < total; i += batchSize) {
      const batch = orders.slice(i, i + batchSize)
      const result = await op(batch)

      batchStats.success += result.success
      batchStats.failed += result.failed
      if (result.failedOrders) {
        batchFailedList.value.push(...result.failedOrders)
      }

      batchProgress.value = Math.min(100, Math.round(((i + batchSize) / total) * 100))

      await new Promise(resolve => setTimeout(resolve, 200))
    }

    batchProgressStatus.value = batchStats.failed === 0 ? 'success' : 'warning'
    ElMessage.success(`批量操作完成，成功${batchStats.success}条，失败${batchStats.failed}条`)
    getList()
  } catch (error: any) {
    batchProgressStatus.value = 'danger'
    ElMessage.error(error.message || '批量操作失败')
  }
}

onMounted(() => {
  getList()
})

defineExpose({
  selectedRows
})
</script>

<style lang="scss" scoped>
.order-list {
  .sub-text {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }

  .price {
    color: #f56c6c;
    font-weight: bold;
  }

  .order-no-text {
    color: #409eff;
    cursor: pointer;
  }

  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .price-warning {
    color: #f56c6c;
    font-size: 12px;
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .estimated-price {
    color: #f56c6c;
    font-size: 18px;
    font-weight: bold;
  }

  .mb-16 {
    margin-bottom: 16px;
  }

  .is-error {
    :deep(.el-form-item__label) {
      color: #f56c6c;
    }
  }

  .trace-dialog {
    :deep(.el-dialog__body) {
      padding-top: 10px;
    }
  }

  .trace-search {
    display: flex;
    gap: 10px;
    margin-bottom: 16px;
  }

  .integrity-card {
    display: flex;
    align-items: center;
    gap: 40px;
    padding: 30px;
    background: #f5f7fa;
    border-radius: 8px;
    margin-bottom: 20px;

    .integrity-score {
      display: flex;
      align-items: baseline;
      color: #67c23a;

      &.low {
        color: #f56c6c;
      }

      .score-number {
        font-size: 48px;
        font-weight: bold;
        line-height: 1;
      }

      .score-label {
        font-size: 18px;
        margin-left: 4px;
      }
    }

    .integrity-info {
      flex: 1;

      p {
        margin: 8px 0;
        font-size: 14px;
        color: #606266;
      }

      .text-success {
        color: #67c23a;
      }

      .text-danger {
        color: #f56c6c;
      }
    }
  }

  .module-list {
    padding: 10px 0;
  }

  .batch-progress {
    padding: 20px 0;

    .progress-title {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 20px;
      text-align: center;
    }

    .progress-stats {
      display: flex;
      justify-content: space-around;
      margin-top: 20px;
      font-size: 14px;

      .success {
        color: #67c23a;
      }

      .failed {
        color: #f56c6c;
      }
    }

    .failed-list {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ebeef5;

      .failed-title {
        font-weight: 500;
        margin-bottom: 10px;
        color: #f56c6c;
      }

      .failed-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        font-size: 13px;
        border-bottom: 1px dashed #ebeef5;

        .failed-reason {
          color: #909399;
        }
      }
    }
  }
}
</style>

<style lang="scss">
.trace-tooltip {
  max-width: 320px !important;

  .trace-quick {
    padding: 8px 0;

    .trace-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #ebeef5;
    }

    .trace-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      font-size: 13px;

      .trace-label {
        color: #909399;
        min-width: 70px;
      }
    }

    .price {
      color: #f56c6c;
      font-weight: 500;
    }

    .trace-btn {
      width: 100%;
      margin-top: 12px;
    }
  }
}
</style>
