<template>
  <div class="order-entry-page">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">交易委托受理</h2>
        <div class="trading-session" :class="{ 'in-session': tradingSession.inSession }">
          <span class="session-dot"></span>
          <span class="session-text">{{ tradingSession.currentPeriod }}</span>
          <span v-if="!tradingSession.inSession" class="session-next">
            下一交易时段：{{ tradingSession.nextSessionAt }}
          </span>
        </div>
      </div>
      <div class="header-right">
        <FinButton perm="trade:batch" type="primary" plain @click="showBatchPanel = !showBatchPanel">
          <el-icon><DocumentAdd /></el-icon>
          批量委托
        </FinButton>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="main-content">
      <div class="order-panel">
        <div class="order-card glow-card" :class="{ 'shake': shakeForm }">
          <div class="card-header">
            <h3 class="card-title">委托下单</h3>
            <div class="order-type-tabs">
              <div
                class="order-tab"
                :class="{ active: orderForm.direction === 'buy' }"
                @click="switchOrderType('buy')"
              >
                买入
              </div>
              <div
                class="order-tab"
                :class="{ active: orderForm.direction === 'sell' }"
                @click="switchOrderType('sell')"
              >
                卖出
              </div>
              <div
                class="order-tab cancel-tab"
                :class="{ active: activeTab === 'cancel' }"
                @click="switchOrderType('cancel')"
              >
                撤单
              </div>
            </div>
          </div>

          <div class="card-body" v-show="activeTab !== 'cancel'">
            <el-form
              ref="orderFormRef"
              :model="orderForm"
              :rules="orderFormRules"
              label-width="90px"
              class="order-form"
            >
              <el-form-item label="客户" prop="customerId">
                <el-select
                  v-model="orderForm.customerId"
                  placeholder="请选择客户"
                  filterable
                  style="width: 100%"
                  @change="handleCustomerChange"
                >
                  <el-option
                    v-for="customer in customerList"
                    :key="customer.id"
                    :label="`${customer.customerName} (${customer.riskLevel || 'R1'})`"
                    :value="customer.id"
                  >
                    <span class="customer-option">
                      <span>{{ customer.customerName }}</span>
                      <el-tag size="small" :type="getRiskTagType(customer.riskLevel)">
                        {{ customer.riskLevel || 'R1' }}
                      </el-tag>
                    </span>
                  </el-option>
                </el-select>
              </el-form-item>

              <el-form-item label="股票" prop="stockId">
                <el-select
                  v-model="orderForm.stockId"
                  placeholder="请选择股票"
                  filterable
                  style="width: 100%"
                  @change="handleStockChange"
                >
                  <el-option
                    v-for="stock in stockList"
                    :key="stock.id"
                    :label="`${stock.stockCode} ${stock.stockName}`"
                    :value="stock.id"
                  >
                    <span class="stock-option">
                      <span class="stock-code">{{ stock.stockCode }}</span>
                      <span class="stock-name">{{ stock.stockName }}</span>
                      <span class="stock-price" :class="{ up: stock.changeRate > 0, down: stock.changeRate < 0 }">
                        {{ stock.currentPrice }}
                      </span>
                    </span>
                  </el-option>
                </el-select>
              </el-form-item>

              <el-form-item label="委托价格" prop="price">
                <div class="price-input-group">
                  <el-input-number
                    v-model="orderForm.price"
                    :min="0.01"
                    :precision="2"
                    :step="0.01"
                    :controls="false"
                    style="width: 100%"
                    @change="handlePriceChange"
                  />
                  <div class="price-quick">
                    <span class="quick-btn" @click="setPrice('down10')">-10%</span>
                    <span class="quick-btn" @click="setPrice('down5')">-5%</span>
                    <span class="quick-btn" @click="setPrice('current')">现价</span>
                    <span class="quick-btn" @click="setPrice('up5')">+5%</span>
                    <span class="quick-btn" @click="setPrice('up10')">+10%</span>
                  </div>
                </div>
              </el-form-item>

              <el-form-item label="委托数量" prop="quantity">
                <div class="quantity-input-group">
                  <el-input-number
                    v-model="orderForm.quantity"
                    :min="100"
                    :step="100"
                    :controls="false"
                    style="width: 100%"
                    @change="handleQuantityChange"
                  />
                  <div class="quantity-quick">
                    <span class="quick-btn" @click="setQuantity(100)">100股</span>
                    <span class="quick-btn" @click="setQuantity(1000)">1000股</span>
                    <span class="quick-btn" @click="setQuantity(10000)">1万股</span>
                    <span class="quick-btn" @click="setQuantity('all')">全仓</span>
                  </div>
                </div>
                <div class="form-tip" v-if="orderForm.quantity && orderForm.quantity % 100 !== 0">
                  <el-icon><Warning /></el-icon>
                  委托数量必须为100股的整数倍
                </div>
              </el-form-item>

              <el-form-item label="备注" prop="remark">
                <el-input
                  v-model="orderForm.remark"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入备注（选填）"
                  maxlength="200"
                  show-word-limit
                />
              </el-form-item>
            </el-form>

            <div class="validation-panel" v-if="validationResult">
              <div class="validation-title">
                <el-icon><CircleCheck v-if="validationResult.valid" /><CircleClose v-else /></el-icon>
                委托校验
              </div>
              <div class="validation-content">
                <div v-if="validationResult.errors.length > 0" class="error-list">
                  <div v-for="(error, index) in validationResult.errors" :key="index" class="error-item">
                    <el-icon><Close /></el-icon>
                    {{ error }}
                  </div>
                </div>
                <div v-if="validationResult.warnings.length > 0" class="warning-list">
                  <div v-for="(warning, index) in validationResult.warnings" :key="index" class="warning-item">
                    <el-icon><Warning /></el-icon>
                    {{ warning }}
                  </div>
                </div>
                <div v-if="validationResult.valid" class="valid-message">
                  <el-icon><Check /></el-icon>
                  校验通过，可以提交委托
                </div>
              </div>
            </div>

            <div class="fee-calculation">
              <div class="fee-title">费用计算</div>
              <div class="fee-grid">
                <div class="fee-item">
                  <span class="fee-label">委托金额</span>
                  <span class="fee-value">{{ formatMoney(tradeCalcResult.tradeAmount) }}</span>
                </div>
                <div class="fee-item">
                  <span class="fee-label">佣金(0.03%)</span>
                  <span class="fee-value">{{ formatMoney(tradeCalcResult.commission) }}</span>
                </div>
                <div class="fee-item">
                  <span class="fee-label">印花税(0.1%)</span>
                  <span class="fee-value">{{ formatMoney(tradeCalcResult.stampTax) }}</span>
                </div>
                <div class="fee-item total">
                  <span class="fee-label">总金额</span>
                  <span class="fee-value">{{ formatMoney(tradeCalcResult.totalAmount) }}</span>
                </div>
              </div>
            </div>

            <div class="order-actions">
              <button
                class="submit-btn ripple-btn"
                :class="[orderForm.direction, { disabled: !canSubmit }]"
                :disabled="!canSubmit || submitting"
                @click="handleSubmitOrder"
              >
                <span v-if="submitting" class="btn-loading"></span>
                <span v-else>{{ orderForm.direction === 'buy' ? '确认买入' : '确认卖出' }}</span>
              </button>
              <button class="reset-btn ripple-btn" @click="resetForm">
                重置
              </button>
            </div>
          </div>

          <div class="card-body" v-show="activeTab === 'cancel'">
            <div class="cancel-panel">
              <div class="cancel-search">
                <el-input
                  v-model="cancelSearch"
                  placeholder="请输入交易单号或股票代码搜索"
                  clearable
                  style="width: 300px"
                  @keyup.enter="searchCancelOrders"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
                <el-button type="primary" @click="searchCancelOrders">搜索</el-button>
              </div>

              <div class="cancel-table-wrapper">
                <el-table
                  ref="cancelTableRef"
                  :data="cancelOrderList"
                  style="width: 100%"
                  @selection-change="handleCancelSelectionChange"
                  :row-class-name="getTableRowClassName"
                  highlight-current-row
                >
                  <el-table-column type="selection" width="50" />
                  <el-table-column prop="tradeNo" label="委托单号" width="160" />
                  <el-table-column prop="stockCode" label="股票代码" width="100" />
                  <el-table-column prop="stockName" label="股票名称" width="120" />
                  <el-table-column prop="direction" label="方向" width="70" align="center">
                    <template #default="{ row }">
                      <el-tag :type="row.direction === 'buy' ? 'danger' : 'success'" size="small" effect="dark">
                        {{ row.direction === 'buy' ? '买入' : '卖出' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="price" label="委托价" width="100" align="right">
                    <template #default="{ row }">
                      {{ formatMoney(row.price) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="quantity" label="委托量" width="100" align="right">
                    <template #default="{ row }">
                      {{ row.quantity?.toLocaleString() }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="tradeStatus" label="状态" width="100" align="center">
                    <template #default="{ row }">
                      <el-tag :type="getTradeStatusColor(row.tradeStatus)" size="small">
                        {{ getTradeStatusLabel(row.tradeStatus) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="createdAt" label="委托时间" width="160" />
                  <el-table-column label="操作" width="100" align="center" fixed="right">
                    <template #default="{ row }">
                      <el-button
                        type="warning"
                        link
                        size="small"
                        :disabled="!canCancel(row)"
                        @click="handleSingleCancel(row)"
                      >
                        撤单
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>

              <div class="cancel-actions" v-if="selectedCancelOrders.length > 0">
                <span class="selected-count">已选择 {{ selectedCancelOrders.length }} 笔委托</span>
                <button class="batch-cancel-btn ripple-btn" @click="handleBatchCancel">
                  批量撤单
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="trace-card glow-card" v-if="currentTrace">
          <div class="card-header">
            <h3 class="card-title">委托溯源</h3>
            <el-tag :type="getTradeStatusColor(currentTrace.status)" size="small">
              {{ getTradeStatusLabel(currentTrace.status) }}
            </el-tag>
          </div>
          <div class="card-body">
            <div class="trace-info">
              <div class="trace-row">
                <span class="trace-label">委托单号</span>
                <span class="trace-value">{{ currentTrace.tradeNo }}</span>
              </div>
              <div class="trace-row">
                <span class="trace-label">客户</span>
                <span class="trace-value">{{ currentTrace.customerName }}</span>
              </div>
              <div class="trace-row">
                <span class="trace-label">股票</span>
                <span class="trace-value">{{ currentTrace.stockName }}</span>
              </div>
              <div class="trace-row">
                <span class="trace-label">委托方向</span>
                <span class="trace-value">
                  {{ currentTrace.tradeType === 'buy' ? '买入' : '卖出' }}
                </span>
              </div>
              <div class="trace-row">
                <span class="trace-label">委托价格</span>
                <span class="trace-value">{{ formatMoney(currentTrace.price) }}</span>
              </div>
              <div class="trace-row">
                <span class="trace-label">委托数量</span>
                <span class="trace-value">{{ currentTrace.quantity?.toLocaleString() }} 股</span>
              </div>
              <div class="trace-row">
                <span class="trace-label">委托金额</span>
                <span class="trace-value amount">{{ formatMoney(currentTrace.amount) }}</span>
              </div>
              <div class="trace-row">
                <span class="trace-label">提交时间</span>
                <span class="trace-value">{{ currentTrace.submitAt }}</span>
              </div>
            </div>

            <div class="trace-timeline">
              <div class="timeline-title">校验节点</div>
              <el-timeline>
                <el-timeline-item
                  v-for="(point, index) in currentTrace.checkPoints"
                  :key="index"
                  :type="point.passed ? 'success' : 'danger'"
                  :timestamp="point.time"
                  placement="top"
                >
                  <div class="timeline-content">
                    <el-icon v-if="point.passed"><CircleCheck /></el-icon>
                    <el-icon v-else><CircleClose /></el-icon>
                    <span class="point-name">{{ point.name }}</span>
                    <span class="point-message">{{ point.message }}</span>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>
          </div>
        </div>
      </div>

      <div class="batch-panel" v-show="showBatchPanel">
        <div class="order-card glow-card">
          <div class="card-header">
            <h3 class="card-title">批量委托</h3>
            <el-tag type="warning" size="small" v-if="!hasBatchPerm">权限不足</el-tag>
          </div>
          <div class="card-body">
            <div class="batch-toolbar">
              <FinButton
                perm="trade:batch"
                type="primary"
                @click="showBatchImport = true"
              >
                <el-icon><Plus /></el-icon>
                添加委托
              </FinButton>
              <el-button
                :disabled="batchOrders.length === 0 || !hasBatchPerm"
                @click="clearBatchOrders"
              >
                清空
              </el-button>
              <div class="batch-stats">
                <span>共 <strong>{{ batchOrders.length }}</strong> 条</span>
              </div>
            </div>

            <div class="batch-table-wrapper">
              <el-table
                :data="batchOrders"
                style="width: 100%"
                :row-class-name="getBatchRowClassName"
                highlight-current-row
              >
                <el-table-column type="index" label="序号" width="60" />
                <el-table-column prop="customerName" label="客户" min-width="120" />
                <el-table-column prop="stockCode" label="股票代码" width="100" />
                <el-table-column prop="stockName" label="股票名称" width="120" />
                <el-table-column prop="direction" label="方向" width="70" align="center">
                  <template #default="{ row }">
                    <el-tag :type="row.direction === 'buy' ? 'danger' : 'success'" size="small" effect="dark">
                      {{ row.direction === 'buy' ? '买入' : '卖出' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="price" label="委托价" width="90" align="right">
                  <template #default="{ row }">
                    {{ formatMoney(row.price) }}
                  </template>
                </el-table-column>
                <el-table-column prop="quantity" label="数量" width="90" align="right">
                  <template #default="{ row }">
                    {{ row.quantity?.toLocaleString() }}
                  </template>
                </el-table-column>
                <el-table-column prop="riskLevel" label="风险等级" width="90" align="center">
                  <template #default="{ row }">
                    <el-tag :type="getRiskTagType(row.riskLevel)" size="small">
                      {{ row.riskLevel || 'R1' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag v-if="row.submitStatus === 'success'" type="success" size="small">成功</el-tag>
                    <el-tag v-else-if="row.submitStatus === 'failed'" type="danger" size="small">失败</el-tag>
                    <el-tag v-else-if="row.submitStatus === 'auditing'" type="warning" size="small">待审核</el-tag>
                    <el-tag v-else type="info" size="small">待提交</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="100" align="center" fixed="right">
                  <template #default="{ $index }">
                    <el-button type="danger" link size="small" @click="removeBatchOrder($index)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <div class="batch-actions">
              <button
                class="batch-submit-btn ripple-btn"
                :class="{ disabled: !canBatchSubmit }"
                :disabled="!canBatchSubmit || batchSubmitting"
                @click="handleBatchSubmit"
              >
                <span v-if="batchSubmitting" class="btn-loading"></span>
                <span v-else>批量提交委托</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="orders-panel">
        <div class="order-card glow-card">
          <div class="card-header">
            <h3 class="card-title">待处理委托</h3>
            <el-tabs v-model="pendingTab" class="pending-tabs">
              <el-tab-pane label="全部" name="all" />
              <el-tab-pane label="待撮合" name="pending" />
              <el-tab-pane label="待审核" name="auditing" />
            </el-tabs>
          </div>
          <div class="card-body">
            <el-table
              :data="pendingOrders"
              style="width: 100%"
              v-loading="pendingLoading"
              :row-class-name="getPendingRowClassName"
              highlight-current-row
              @row-click="handleRowClick"
            >
              <el-table-column prop="tradeNo" label="委托单号" width="160" />
              <el-table-column prop="customerName" label="客户" min-width="100" />
              <el-table-column prop="stockCode" label="股票代码" width="100" />
              <el-table-column prop="stockName" label="股票名称" width="100" />
              <el-table-column prop="direction" label="方向" width="70" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.direction === 'buy' ? 'danger' : 'success'" size="small" effect="dark">
                    {{ row.direction === 'buy' ? '买入' : '卖出' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="price" label="委托价" width="90" align="right">
                <template #default="{ row }">
                  {{ formatMoney(row.price) }}
                </template>
              </el-table-column>
              <el-table-column prop="quantity" label="数量" width="90" align="right">
                <template #default="{ row }">
                  {{ row.quantity?.toLocaleString() }}
                </template>
              </el-table-column>
              <el-table-column prop="needAudit" label="风险" width="70" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.needAudit" type="danger" size="small">高</el-tag>
                  <el-tag v-else type="success" size="small">低</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="tradeStatus" label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="getTradeStatusColor(row.tradeStatus)" size="small">
                    {{ getTradeStatusLabel(row.tradeStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createdAt" label="委托时间" width="160" />
            </el-table>
          </div>
        </div>
      </div>
    </div>

    <FinDialog
      v-model:visible="confirmDialogVisible"
      :title="confirmDialogTitle"
      width="480px"
      :loading="confirmLoading"
      @confirm="handleConfirmAction"
    >
      <div class="confirm-content" v-if="confirmOrder">
        <el-descriptions :column="1" border size="default">
          <el-descriptions-item label="委托单号">
            {{ confirmOrder.tradeNo || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="客户">
            {{ confirmOrder.customerName }}
          </el-descriptions-item>
          <el-descriptions-item label="股票">
            {{ confirmOrder.stockCode }} {{ confirmOrder.stockName }}
          </el-descriptions-item>
          <el-descriptions-item label="方向">
            <el-tag :type="confirmOrder.direction === 'buy' ? 'danger' : 'success'" size="small" effect="dark">
              {{ confirmOrder.direction === 'buy' ? '买入' : '卖出' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="委托价格">
            {{ formatMoney(confirmOrder.price) }}
          </el-descriptions-item>
          <el-descriptions-item label="委托数量">
            {{ confirmOrder.quantity?.toLocaleString() }} 股
          </el-descriptions-item>
          <el-descriptions-item label="委托金额" class="amount-row">
            <span class="amount-text">{{ formatMoney(confirmOrder.amount || confirmOrder.price * confirmOrder.quantity) }}</span>
          </el-descriptions-item>
        </el-descriptions>
        <div class="confirm-tip" v-if="confirmType === 'submit'">
          <el-icon><InfoFilled /></el-icon>
          <span>委托提交后将进入待撮合队列，请确认无误后提交。</span>
        </div>
        <div class="confirm-tip warning" v-if="confirmType === 'cancel'">
          <el-icon><Warning /></el-icon>
          <span>撤单后将解冻冻结的资金或持仓，是否确认撤销？</span>
        </div>
      </div>
    </FinDialog>

    <FinDialog
      v-model:visible="batchImportVisible"
      title="添加批量委托"
      width="600px"
      :loading="batchImportLoading"
      @confirm="handleBatchImportConfirm"
    >
      <el-form :model="batchImportForm" label-width="90px">
        <el-form-item label="客户" prop="customerId">
          <el-select
            v-model="batchImportForm.customerId"
            placeholder="请选择客户"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="customer in customerList"
              :key="customer.id"
              :label="`${customer.customerName} (${customer.riskLevel || 'R1'})`"
              :value="customer.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="股票" prop="stockId">
          <el-select
            v-model="batchImportForm.stockId"
            placeholder="请选择股票"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="stock in stockList"
              :key="stock.id"
              :label="`${stock.stockCode} ${stock.stockName}`"
              :value="stock.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="委托方向" prop="direction">
          <el-radio-group v-model="batchImportForm.direction">
            <el-radio value="buy">买入</el-radio>
            <el-radio value="sell">卖出</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="委托价格" prop="price">
          <el-input-number
            v-model="batchImportForm.price"
            :min="0.01"
            :precision="2"
            :step="0.01"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="委托数量" prop="quantity">
          <el-input-number
            v-model="batchImportForm.quantity"
            :min="100"
            :step="100"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
    </FinDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Plus,
  Refresh,
  Warning,
  Search,
  CircleCheck,
  CircleClose,
  Check,
  Close,
  InfoFilled,
  DocumentAdd
} from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import FinButton from '@/components/common/FinButton.vue'
import { usePermission } from '@/hooks/usePermission'
import { formatMoney } from '@/utils/format'
import {
  TRADE_STATUS_LABELS,
  TRADE_STATUS_COLORS,
  RISK_LEVEL_COLORS
} from '@/constants/dictionaries'
import { TradeType, TradeStatus, RiskLevel } from '@/enums'
import * as tradeApi from '@/api/trade'
import type {
  ITradingSession,
  IOrderValidationResult,
  IOrderTraceInfo,
  ITrade
} from '@/api/trade'

const { hasPermission } = usePermission()

const tradingSession = reactive<ITradingSession>({
  inSession: false,
  currentPeriod: '加载中...',
  nextSessionAt: ''
})

const activeTab = ref<'buy' | 'sell' | 'cancel'>('buy')
const showBatchPanel = ref(false)
const shakeForm = ref(false)
const submitting = ref(false)
const batchSubmitting = ref(false)
const pendingLoading = ref(false)
const confirmLoading = ref(false)
const batchImportLoading = ref(false)

const orderFormRef = ref<FormInstance>()
const cancelTableRef = ref()
const confirmDialogVisible = ref(false)
const confirmType = ref<'submit' | 'cancel'>('submit')
const confirmOrder = ref<any>(null)
const confirmDialogTitle = computed(() => {
  if (confirmType.value === 'submit') {
    return orderForm.value.direction === 'buy' ? '确认买入委托' : '确认卖出委托'
  }
  return '确认撤单'
})

const batchImportVisible = ref(false)
const showBatchImport = ref(false)
const batchImportForm = reactive({
  customerId: null as number | null,
  stockId: null as number | null,
  direction: 'buy',
  price: 0,
  quantity: 0
})

const orderForm = reactive({
  customerId: null as number | null,
  stockId: null as number | null,
  direction: 'buy',
  price: 0,
  quantity: 0,
  remark: ''
})

const orderFormRules: FormRules = {
  customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  stockId: [{ required: true, message: '请选择股票', trigger: 'change' }],
  price: [
    { required: true, message: '请输入委托价格', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value <= 0) {
          callback(new Error('委托价格必须大于0'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  quantity: [
    { required: true, message: '请输入委托数量', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value <= 0) {
          callback(new Error('委托数量必须大于0'))
        } else if (value % 100 !== 0) {
          callback(new Error('委托数量必须为100股的整数倍'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const validationResult = ref<IOrderValidationResult | null>(null)
const currentTrace = ref<IOrderTraceInfo | null>(null)

const customerList = ref<any[]>([])
const stockList = ref<any[]>([])

const cancelSearch = ref('')
const cancelOrderList = ref<ITrade[]>([])
const selectedCancelOrders = ref<ITrade[]>([])

const batchOrders = ref<any[]>([])

const pendingTab = ref('all')
const pendingOrders = ref<ITrade[]>([])

const hasBatchPerm = computed(() => hasPermission('trade:batch'))

const tradeCalcResult = computed(() => {
  const price = orderForm.price || 0
  const quantity = orderForm.quantity || 0
  const tradeAmount = price * quantity
  const commission = Math.max(tradeAmount * 0.0003, 5)
  const stampTax = orderForm.direction === 'sell' ? tradeAmount * 0.001 : 0
  const totalAmount = tradeAmount + commission + stampTax
  return {
    tradeAmount,
    commission,
    stampTax,
    totalAmount
  }
})

const canSubmit = computed(() => {
  return (
    orderForm.customerId &&
    orderForm.stockId &&
    orderForm.price > 0 &&
    orderForm.quantity > 0 &&
    orderForm.quantity % 100 === 0 &&
    validationResult.value?.valid
  )
})

const canBatchSubmit = computed(() => {
  return (
    hasBatchPerm.value &&
    batchOrders.value.length > 0 &&
    batchOrders.value.filter(o => !o.submitStatus || o.submitStatus === 'failed').length > 0
  )
})

function getRiskTagType(riskLevel: string) {
  const map: Record<string, string> = {
    R1: 'success',
    R2: '',
    R3: 'warning',
    R4: 'danger',
    R5: 'danger'
  }
  return map[riskLevel] || 'info'
}

function getTradeStatusLabel(status: string): string {
  return TRADE_STATUS_LABELS[status as TradeStatus] || status
}

function getTradeStatusColor(status: string): string {
  return TRADE_STATUS_COLORS[status as TradeStatus] || 'info'
}

function switchOrderType(type: 'buy' | 'sell' | 'cancel') {
  if (type === 'cancel') {
    activeTab.value = 'cancel'
    fetchCancelOrders()
  } else {
    activeTab.value = type
    orderForm.direction = type
    validationResult.value = null
  }
}

function handleCustomerChange() {
  validateOrder()
}

function handleStockChange() {
  const stock = stockList.value.find(s => s.id === orderForm.stockId)
  if (stock && stock.currentPrice) {
    orderForm.price = Number(stock.currentPrice)
  }
  validateOrder()
}

function handlePriceChange() {
  validateOrder()
}

function handleQuantityChange() {
  validateOrder()
}

function setPrice(type: string) {
  const stock = stockList.value.find(s => s.id === orderForm.stockId)
  if (!stock || !stock.currentPrice) return
  const current = Number(stock.currentPrice)
  switch (type) {
    case 'down10':
      orderForm.price = Number((current * 0.9).toFixed(2))
      break
    case 'down5':
      orderForm.price = Number((current * 0.95).toFixed(2))
      break
    case 'current':
      orderForm.price = current
      break
    case 'up5':
      orderForm.price = Number((current * 1.05).toFixed(2))
      break
    case 'up10':
      orderForm.price = Number((current * 1.1).toFixed(2))
      break
  }
}

function setQuantity(value: number | string) {
  if (value === 'all') {
    const stock = stockList.value.find(s => s.id === orderForm.stockId)
    const customer = customerList.value.find(c => c.id === orderForm.customerId)
    if (orderForm.direction === 'buy' && customer && stock && stock.currentPrice) {
      const available = Number(customer.availableAmount || customer.available_amount || 0)
      const price = orderForm.price || Number(stock.currentPrice)
      const maxQty = Math.floor(available / price / 100) * 100
      orderForm.quantity = Math.max(100, maxQty)
    } else if (orderForm.direction === 'sell') {
      orderForm.quantity = 10000
    }
  } else {
    orderForm.quantity = value as number
  }
}

async function validateOrder() {
  if (!orderForm.customerId || !orderForm.stockId || !orderForm.price || !orderForm.quantity) {
    validationResult.value = null
    return
  }

  try {
    const res = await tradeApi.validateOrder({
      customerId: orderForm.customerId,
      stockId: orderForm.stockId,
      direction: orderForm.direction,
      price: orderForm.price,
      quantity: orderForm.quantity
    })
    if (res.code === 0) {
      validationResult.value = res.data
      if (!res.data.valid && res.data.errors.length > 0) {
        triggerShake()
      }
    }
  } catch (error) {
    // ignore
  }
}

function triggerShake() {
  shakeForm.value = true
  setTimeout(() => {
    shakeForm.value = false
  }, 500)
}

function resetForm() {
  orderForm.customerId = null
  orderForm.stockId = null
  orderForm.price = 0
  orderForm.quantity = 0
  orderForm.remark = ''
  validationResult.value = null
  currentTrace.value = null
  orderFormRef.value?.resetFields()
}

async function handleSubmitOrder() {
  if (!canSubmit.value || submitting.value) return

  const stock = stockList.value.find(s => s.id === orderForm.stockId)
  const customer = customerList.value.find(c => c.id === orderForm.customerId)

  confirmOrder.value = {
    customerName: customer?.customerName,
    stockCode: stock?.stockCode,
    stockName: stock?.stockName,
    direction: orderForm.direction,
    price: orderForm.price,
    quantity: orderForm.quantity,
    amount: tradeCalcResult.value.totalAmount
  }
  confirmType.value = 'submit'
  confirmDialogVisible.value = true
}

async function handleConfirmAction() {
  if (confirmType.value === 'submit') {
    await submitOrder()
  } else if (confirmType.value === 'cancel') {
    await cancelOrder()
  }
}

async function submitOrder() {
  if (!orderForm.customerId || !orderForm.stockId) return

  confirmLoading.value = true
  try {
    const res = await tradeApi.submitOrder({
      customerId: orderForm.customerId,
      stockId: orderForm.stockId,
      tradeType: orderForm.direction,
      direction: orderForm.direction,
      price: orderForm.price,
      quantity: orderForm.quantity,
      remark: orderForm.remark
    })

    if (res.code === 0) {
      confirmDialogVisible.value = false
      ElMessage.success({
        message: res.data.needAudit
          ? '委托已提交，进入人工审核队列'
          : '委托提交成功，进入待撮合队列',
        duration: 3000
      })

      if (res.data.trade?.id) {
        await loadOrderTrace(res.data.trade.id)
      }

      fetchPendingOrders()
      resetForm()
    } else {
      ElMessage.error(res.message)
      triggerShake()
    }
  } catch (error: any) {
    ElMessage.error(error.message || '提交失败')
    triggerShake()
  } finally {
    confirmLoading.value = false
  }
}

async function loadOrderTrace(id: number) {
  try {
    const res = await tradeApi.getOrderTrace(id)
    if (res.code === 0) {
      currentTrace.value = res.data
    }
  } catch (error) {
    // ignore
  }
}

function canCancel(row: any): boolean {
  return row.tradeStatus === TradeStatus.PENDING || row.tradeStatus === TradeStatus.AUDITING
}

function handleCancelSelectionChange(selection: ITrade[]) {
  selectedCancelOrders.value = selection
}

function handleSingleCancel(row: ITrade) {
  confirmOrder.value = row
  confirmType.value = 'cancel'
  confirmDialogVisible.value = true
}

async function cancelOrder() {
  if (!confirmOrder.value?.id) return

  confirmLoading.value = true
  try {
    const res = await tradeApi.cancelTrade(confirmOrder.value.id)
    if (res.code === 0) {
      confirmDialogVisible.value = false
      ElMessage.success('撤单成功，资金/持仓已解冻')
      fetchCancelOrders()
      fetchPendingOrders()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error: any) {
    ElMessage.error(error.message || '撤单失败')
  } finally {
    confirmLoading.value = false
  }
}

async function handleBatchCancel() {
  if (selectedCancelOrders.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要撤销选中的 ${selectedCancelOrders.value.length} 笔委托吗？`,
      '批量撤单确认',
      { type: 'warning' }
    )

    let successCount = 0
    let failCount = 0

    for (const order of selectedCancelOrders.value) {
      try {
        await tradeApi.cancelTrade(order.id)
        successCount++
      } catch {
        failCount++
      }
    }

    ElMessage.success(`批量撤单完成：成功 ${successCount} 笔，失败 ${failCount} 笔`)
    fetchCancelOrders()
    fetchPendingOrders()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量撤单失败')
    }
  }
}

async function searchCancelOrders() {
  fetchCancelOrders()
}

async function fetchCancelOrders() {
  try {
    const res = await tradeApi.getPendingOrders({
      page: 1,
      pageSize: 50
    })
    if (res.code === 0) {
      cancelOrderList.value = res.data.list as any
    }
  } catch (error) {
    ElMessage.error('获取待撤单列表失败')
  }
}

function getTableRowClassName({ row }: { row: any }) {
  if (selectedCancelOrders.value.some(s => s.id === row.id)) {
    return 'row-selected'
  }
  return ''
}

function getBatchRowClassName({ row }: { row: any }) {
  if (row.submitStatus === 'success') return 'row-success'
  if (row.submitStatus === 'failed') return 'row-failed'
  if (row.submitStatus === 'auditing') return 'row-warning'
  return ''
}

function getPendingRowClassName({ row }: { row: any }) {
  if (row.needAudit) return 'row-high-risk'
  return ''
}

function handleRowClick(row: ITrade) {
  if (row.id) {
    loadOrderTrace(row.id)
  }
}

function clearBatchOrders() {
  batchOrders.value = []
}

function removeBatchOrder(index: number) {
  batchOrders.value.splice(index, 1)
}

function handleBatchImportConfirm() {
  if (!batchImportForm.customerId || !batchImportForm.stockId || !batchImportForm.price || !batchImportForm.quantity) {
    ElMessage.warning('请填写完整的委托信息')
    return
  }

  const customer = customerList.value.find(c => c.id === batchImportForm.customerId)
  const stock = stockList.value.find(s => s.id === batchImportForm.stockId)

  batchOrders.value.push({
    customerId: batchImportForm.customerId,
    customerName: customer?.customerName,
    stockId: batchImportForm.stockId,
    stockCode: stock?.stockCode,
    stockName: stock?.stockName,
    direction: batchImportForm.direction,
    price: batchImportForm.price,
    quantity: batchImportForm.quantity,
    riskLevel: customer?.riskLevel || 'R1',
    submitStatus: ''
  })

  batchImportVisible.value = false
  showBatchImport.value = false
  batchImportForm.customerId = null
  batchImportForm.stockId = null
  batchImportForm.price = 0
  batchImportForm.quantity = 0
}

async function handleBatchSubmit() {
  if (!canBatchSubmit.value || batchSubmitting.value) return

  batchSubmitting.value = true
  try {
    const orders = batchOrders.value
      .filter(o => !o.submitStatus || o.submitStatus === 'failed')
      .map(o => ({
        customerId: o.customerId,
        stockId: o.stockId,
        tradeType: o.direction,
        direction: o.direction,
        price: o.price,
        quantity: o.quantity,
        remark: ''
      }))

    const res = await tradeApi.batchSubmitOrders(orders)

    if (res.code === 0) {
      let orderIdx = 0
      for (let i = 0; i < batchOrders.value.length; i++) {
        const order = batchOrders.value[i]
        if (!order.submitStatus || order.submitStatus === 'failed') {
          const result = res.data.results[orderIdx]
          if (result.success) {
            order.submitStatus = result.needAudit ? 'auditing' : 'success'
            order.tradeId = result.order?.id
            order.tradeNo = result.order?.tradeNo
          } else {
            order.submitStatus = 'failed'
            order.errorMsg = result.error
          }
          orderIdx++
        }
      }

      ElMessage.success(
        `批量提交完成：成功 ${res.data.successCount} 笔，失败 ${res.data.failedCount} 笔，待审核 ${res.data.auditCount} 笔`
      )

      fetchPendingOrders()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error: any) {
    ElMessage.error(error.message || '批量提交失败')
  } finally {
    batchSubmitting.value = false
  }
}

async function fetchTradingSession() {
  try {
    const res = await tradeApi.getTradingSession()
    if (res.code === 0) {
      Object.assign(tradingSession, res.data)
    }
  } catch (error) {
    // ignore
  }
}

async function fetchCustomerList() {
  try {
    const res = await tradeApi.getCustomerList()
    if (res.code === 0) {
      customerList.value = res.data
    }
  } catch (error) {
    ElMessage.error('获取客户列表失败')
  }
}

async function fetchStockList() {
  try {
    const res = await tradeApi.getStockList()
    if (res.code === 0) {
      stockList.value = res.data
    }
  } catch (error) {
    ElMessage.error('获取股票列表失败')
  }
}

async function fetchPendingOrders() {
  pendingLoading.value = true
  try {
    const res = await tradeApi.getPendingOrders({
      page: 1,
      pageSize: 20
    })
    if (res.code === 0) {
      pendingOrders.value = res.data.list as any
    }
  } catch (error) {
    ElMessage.error('获取待处理委托失败')
  } finally {
    pendingLoading.value = false
  }
}

function refreshData() {
  fetchTradingSession()
  fetchPendingOrders()
  if (activeTab.value === 'cancel') {
    fetchCancelOrders()
  }
}

watch(showBatchImport, (val) => {
  batchImportVisible.value = val
})

watch(batchImportVisible, (val) => {
  if (!val) {
    showBatchImport.value = false
  }
})

watch(pendingTab, () => {
  fetchPendingOrders()
})

onMounted(() => {
  fetchTradingSession()
  fetchCustomerList()
  fetchStockList()
  fetchPendingOrders()
})
</script>

<style lang="scss" scoped>
.order-entry-page {
  padding: 16px;
  height: 100%;
  overflow: auto;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 20px;

      .page-title {
        font-size: 20px;
        font-weight: 600;
        color: var(--fin-text-primary);
        margin: 0;
      }
    }

    .header-right {
      display: flex;
      gap: 8px;
    }
  }

  .trading-session {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: #f5f7fa;
    border-radius: 4px;
    font-size: 13px;
    color: var(--fin-text-secondary);

    &.in-session {
      background: #f0f9eb;
      color: #67c23a;
    }

    .session-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #909399;

      .in-session & {
        background: #67c23a;
        animation: pulse 2s infinite;
      }
    }

    .session-text {
      font-weight: 500;
    }

    .session-next {
      color: var(--fin-text-secondary);
      font-size: 12px;
    }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .main-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .order-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .orders-panel {
    grid-column: span 1;
  }

  .batch-panel {
    grid-column: span 2;
  }
}

.order-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid var(--fin-border);
  overflow: hidden;
  transition: box-shadow 0.3s ease, border-color 0.3s ease;

  &.glow-card {
    position: relative;

    &:hover {
      border-color: var(--fin-primary-light);
      box-shadow: 0 0 20px rgba(26, 58, 92, 0.15);
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--fin-border);
    background: linear-gradient(135deg, #f8fafc 0%, #fff 100%);

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--fin-text-primary);
      margin: 0;
    }
  }

  .card-body {
    padding: 20px;
  }
}

.shake {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.order-type-tabs {
  display: flex;
  gap: 4px;
  background: #f5f7fa;
  border-radius: 6px;
  padding: 3px;

  .order-tab {
    padding: 6px 20px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--fin-text-regular);

    &.active {
      background: #fff;
      color: var(--fin-primary);
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    &.cancel-tab.active {
      color: #e6a23c;
    }
  }
}

.order-form {
  .customer-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .stock-option {
    display: flex;
    align-items: center;
    gap: 12px;

    .stock-code {
      font-weight: 500;
      color: var(--fin-text-primary);
      min-width: 70px;
    }

    .stock-name {
      color: var(--fin-text-regular);
      flex: 1;
    }

    .stock-price {
      font-weight: 600;
      color: var(--fin-text-primary);

      &.up { color: #f56c6c; }
      &.down { color: #67c23a; }
    }
  }

  .price-input-group,
  .quantity-input-group {
    width: 100%;
  }

  .price-quick,
  .quantity-quick {
    display: flex;
    gap: 4px;
    margin-top: 8px;

    .quick-btn {
      flex: 1;
      padding: 4px 0;
      text-align: center;
      font-size: 12px;
      background: #f5f7fa;
      border-radius: 4px;
      cursor: pointer;
      color: var(--fin-text-regular);
      transition: all 0.2s ease;

      &:hover {
        background: var(--fin-primary-light);
        color: #fff;
      }
    }
  }

  .form-tip {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 6px;
    font-size: 12px;
    color: #f56c6c;
  }
}

.validation-panel {
  margin-top: 16px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;

  .validation-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    color: var(--fin-text-primary);
    margin-bottom: 8px;
  }

  .error-list {
    .error-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 0;
      font-size: 13px;
      color: #f56c6c;
    }
  }

  .warning-list {
    .warning-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 0;
      font-size: 13px;
      color: #e6a23c;
    }
  }

  .valid-message {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #67c23a;
  }
}

.fee-calculation {
  margin-top: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f0f5ff 0%, #e8f4ff 100%);
  border-radius: 6px;

  .fee-title {
    font-weight: 600;
    color: var(--fin-text-primary);
    margin-bottom: 12px;
  }

  .fee-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;

    .fee-item {
      display: flex;
      justify-content: space-between;
      font-size: 13px;

      .fee-label {
        color: var(--fin-text-secondary);
      }

      .fee-value {
        color: var(--fin-text-regular);
        font-weight: 500;
      }

      &.total {
        grid-column: span 2;
        padding-top: 8px;
        border-top: 1px dashed var(--fin-border);

        .fee-label {
          font-weight: 600;
          color: var(--fin-text-primary);
        }

        .fee-value {
          font-size: 18px;
          font-weight: 700;
          color: var(--fin-primary);
        }
      }
    }
  }
}

.order-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.ripple-btn {
  position: relative;
  overflow: hidden;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.4s ease, height 0.4s ease, opacity 0.4s ease;
  }

  &:active::after {
    width: 200px;
    height: 200px;
    opacity: 0;
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.submit-btn {
  flex: 1;
  padding: 12px 0;
  color: #fff;

  &.buy {
    background: linear-gradient(135deg, #f56c6c 0%, #d93025 100%);

    &:hover:not(.disabled) {
      background: linear-gradient(135deg, #f78989 0%, #e74d3c 100%);
      box-shadow: 0 4px 12px rgba(245, 108, 108, 0.4);
    }
  }

  &.sell {
    background: linear-gradient(135deg, #67c23a 0%, #0f9b58 100%);

    &:hover:not(.disabled) {
      background: linear-gradient(135deg, #85ce61 0%, #2db672 100%);
      box-shadow: 0 4px 12px rgba(103, 194, 58, 0.4);
    }
  }
}

.reset-btn {
  padding: 12px 32px;
  background: #fff;
  color: var(--fin-text-regular);
  border: 1px solid var(--fin-border) !important;

  &:hover {
    color: var(--fin-primary);
    border-color: var(--fin-primary) !important;
  }
}

.btn-loading {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.cancel-panel {
  .cancel-search {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }

  .cancel-table-wrapper {
    max-height: 400px;
    overflow: auto;
  }

  .cancel-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--fin-border);

    .selected-count {
      font-size: 13px;
      color: var(--fin-text-regular);
    }
  }

  .batch-cancel-btn {
    padding: 10px 24px;
    background: linear-gradient(135deg, #e6a23c 0%, #d48806 100%);
    color: #fff;

    &:hover {
      background: linear-gradient(135deg, #ebb563 0%, #e29213 100%);
      box-shadow: 0 4px 12px rgba(230, 162, 60, 0.4);
    }
  }
}

:deep(.el-table .row-selected) {
  background-color: #ecf5ff !important;

  td {
    background-color: transparent !important;
  }
}

:deep(.el-table .row-success) {
  background-color: #f0f9eb !important;
}

:deep(.el-table .row-failed) {
  background-color: #fef0f0 !important;
}

:deep(.el-table .row-warning) {
  background-color: #fdf6ec !important;
}

:deep(.el-table .row-high-risk) {
  background-color: #fef0f0 !important;
}

.trace-card {
  .trace-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 20px;

    .trace-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 6px 0;
      border-bottom: 1px dashed var(--fin-border);

      .trace-label {
        color: var(--fin-text-secondary);
      }

      .trace-value {
        color: var(--fin-text-primary);
        font-weight: 500;

        &.amount {
          font-size: 16px;
          font-weight: 700;
          color: var(--fin-primary);
        }
      }
    }
  }

  .trace-timeline {
    .timeline-title {
      font-weight: 600;
      color: var(--fin-text-primary);
      margin-bottom: 12px;
    }

    .timeline-content {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;

      .point-name {
        font-weight: 500;
        color: var(--fin-text-primary);
      }

      .point-message {
        color: var(--fin-text-secondary);
        margin-left: auto;
      }
    }
  }
}

.batch-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;

  .batch-stats {
    margin-left: auto;
    font-size: 13px;
    color: var(--fin-text-regular);

    strong {
      color: var(--fin-primary);
      font-size: 16px;
    }
  }
}

.batch-table-wrapper {
  max-height: 300px;
  overflow: auto;
}

.batch-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--fin-border);

  .batch-submit-btn {
    padding: 10px 32px;
    background: linear-gradient(135deg, var(--fin-primary) 0%, var(--fin-primary-light) 100%);
    color: #fff;

    &:hover:not(.disabled) {
      box-shadow: 0 4px 12px rgba(26, 58, 92, 0.4);
    }
  }
}

.pending-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }

  :deep(.el-tabs__item) {
    font-size: 13px;
    height: 36px;
    line-height: 36px;
  }
}

.confirm-content {
  .amount-row {
    :deep(.el-descriptions-item__content) {
      font-size: 18px;
      font-weight: 700;
      color: var(--fin-primary);
    }
  }

  .amount-text {
    font-size: 18px;
    font-weight: 700;
    color: var(--fin-primary);
  }

  .confirm-tip {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 16px;
    padding: 12px;
    background: #ecf5ff;
    border-radius: 6px;
    font-size: 13px;
    color: var(--fin-primary);

    &.warning {
      background: #fdf6ec;
      color: #e6a23c;
    }
  }
}
