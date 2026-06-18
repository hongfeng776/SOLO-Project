<template>
  <div class="page-container">
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" @submit.prevent>
        <el-form-item label="订单编号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入订单编号" clearable />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="searchForm.payType" placeholder="全部" clearable style="width: 140px">
            <el-option label="微信支付" :value="1" />
            <el-option label="支付宝" :value="2" />
            <el-option label="银行卡" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="待支付" :value="0" />
            <el-option label="待发货" :value="1" />
            <el-option label="已发货" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="金额区间">
          <el-input-number v-model="searchForm.minAmount" :min="0" placeholder="最小" style="width: 120px" />
          <span style="margin: 0 8px">-</span>
          <el-input-number v-model="searchForm.maxAmount" :min="0" placeholder="最大" style="width: 120px" />
        </el-form-item>
        <el-form-item label="支付状态">
          <el-select v-model="searchForm.payStatus" placeholder="全部" clearable style="width: 140px">
            <el-option label="待支付" :value="0" />
            <el-option label="支付成功" :value="1" />
            <el-option label="支付失败" :value="2" />
            <el-option label="已退款" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="对账状态">
          <el-select v-model="searchForm.reconcileStatus" placeholder="全部" clearable style="width: 140px">
            <el-option label="待对账" :value="0" />
            <el-option label="对账中" :value="1" />
            <el-option label="对账通过" :value="2" />
            <el-option label="对账异常" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="风控标记">
          <el-select v-model="searchForm.riskFlag" placeholder="全部" clearable style="width: 140px">
            <el-option label="正常" :value="0" />
            <el-option label="低风险" :value="1" />
            <el-option label="中风险" :value="2" />
            <el-option label="高风险" :value="3" />
            <el-option label="已拦截" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="超时未付">
          <el-select v-model="searchForm.isOverdue" placeholder="全部" clearable style="width: 140px">
            <el-option label="是" :value="1" />
            <el-option label="否" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="物流状态">
          <el-select v-model="searchForm.logisticsStatus" placeholder="全部" clearable style="width: 140px">
            <el-option label="待发货" :value="0" />
            <el-option label="已揽收" :value="1" />
            <el-option label="运输中" :value="2" />
            <el-option label="派送中" :value="3" />
            <el-option label="已签收" :value="4" />
            <el-option label="签收异常" :value="5" />
            <el-option label="已退回" :value="6" />
          </el-select>
        </el-form-item>
        <el-form-item label="物流渠道">
          <el-select v-model="searchForm.logisticsProviderId" placeholder="全部" clearable style="width: 160px">
            <el-option
              v-for="provider in logisticsProviderList"
              :key="provider.id"
              :label="provider.providerName"
              :value="provider.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="异常物流">
          <el-select v-model="searchForm.isLogisticsAbnormal" placeholder="全部" clearable style="width: 140px">
            <el-option label="否" :value="0" />
            <el-option label="是" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="售后状态">
          <el-select v-model="searchForm.afterSaleStatus" placeholder="全部" clearable style="width: 140px">
            <el-option label="无售后" :value="0" />
            <el-option label="售后中" :value="1" />
            <el-option label="售后完成" :value="2" />
            <el-option label="售后拒绝" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="退款状态">
          <el-select v-model="searchForm.refundStatus" placeholder="全部" clearable style="width: 140px">
            <el-option label="无退款" :value="0" />
            <el-option label="退款中" :value="1" />
            <el-option label="已退款" :value="2" />
            <el-option label="退款拒绝" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="终止类型">
          <el-select v-model="searchForm.terminateType" placeholder="全部" clearable style="width: 140px">
            <el-option label="未终止" :value="0" />
            <el-option label="主动取消" :value="1" />
            <el-option label="超时取消" :value="2" />
            <el-option label="违规取消" :value="3" />
            <el-option label="售后终止" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="发货时间">
          <el-date-picker
            v-model="searchForm.shippedDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="异常状态">
          <el-select v-model="searchForm.isException" placeholder="全部" clearable style="width: 140px">
            <el-option label="正常订单" :value="0" />
            <el-option label="异常订单" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon> 重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="batch-operation-bar" v-if="selectedIds.length > 0">
      <span class="batch-info">已选择 {{ selectedIds.length }} 条订单</span>
      <el-button type="warning" size="small" @click="handleBatchRemind">
        <el-icon><Bell /></el-icon> 批量提醒支付
      </el-button>
      <el-button type="primary" size="small" @click="handleBatchVerifyPayment">
        <el-icon><Check /></el-icon> 批量核验支付
      </el-button>
      <el-button type="success" size="small" @click="handleBatchResetExpire">
        <el-icon><RefreshRight /></el-icon> 批量重置时效
      </el-button>
      <el-button v-if="hasFinancePermission" type="warning" size="small" @click="handleBatchMarkReconcile" class="btn-click-feedback">
        <el-icon><DocumentChecked /></el-icon> 批量标记对账
      </el-button>
      <el-button type="primary" size="small" @click="handleBatchShip" class="btn-click-feedback">
        <el-icon><Goods /></el-icon> 批量录入物流
      </el-button>
      <el-button type="warning" size="small" @click="handleBatchUpdateAbnormal" class="btn-click-feedback">
        <el-icon><Warning /></el-icon> 批量更新物流异常
      </el-button>
      <el-button type="success" size="small" @click="handleBatchResendNotification" class="btn-click-feedback">
        <el-icon><Bell /></el-icon> 批量补发物流通知
      </el-button>
      <el-button type="primary" size="small" @click="handleBatchAuditAfterSale" class="btn-click-feedback">
        <el-icon><Select /></el-icon> 批量审核售后
      </el-button>
      <el-button type="warning" size="small" @click="handleBatchCloseInvalid" class="btn-click-feedback">
        <el-icon><CircleClose /></el-icon> 批量关闭无效工单
      </el-button>
      <el-button type="info" size="small" @click="handleBatchArchiveTerminated" class="btn-click-feedback">
        <el-icon><FolderOpened /></el-icon> 批量归档终止订单
      </el-button>
      <el-button type="danger" size="small" @click="handleBatchMarkException" class="btn-click-feedback">
        <el-icon><Warning /></el-icon> 批量标记异常
      </el-button>
      <el-button type="info" size="small" @click="handleBatchArchive">
        <el-icon><FolderOpened /></el-icon> 批量归档
      </el-button>
      <el-button size="small" @click="selectedIds = []">取消选择</el-button>
    </div>

    <el-card class="order-table-card" shadow="never">
      <el-table
        ref="orderTable"
        v-loading="loading"
        :data="orderList"
        class="order-table"
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
        stripe
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="orderNo" label="订单编号" min-width="160">
          <template #default="{ row }">
            <div class="order-no-cell">
              <span :class="{ 'exception-field': row.isException === 1 && row.exceptionFields?.includes('orderNo') }">
                {{ row.orderNo }}
              </span>
              <el-tooltip v-if="row.isException === 1" placement="top">
                <template #content>
                  <div class="reason-tip">
                    <div style="font-weight: 600; margin-bottom: 4px">订单终止原因：</div>
                    <div>{{ row.exceptionReason }}</div>
                    <div style="margin-top: 4px; color: #909399">异常字段：{{ row.exceptionFields?.join('、') }}</div>
                  </div>
                </template>
                <span class="exception-badge">
                  <el-icon><WarningFilled /></el-icon>
                  异常
                </span>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="OrderStatusMap[row.status]?.type" effect="light">
              {{ OrderStatusMap[row.status]?.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payType" label="支付方式" width="100" align="center">
          <template #default="{ row }">
            {{ PayTypeMap[row.payType] || '未知' }}
          </template>
        </el-table-column>
        <el-table-column prop="payStatus" label="支付状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.payStatus === 1 ? 'success' : row.payStatus === 2 ? 'danger' : 'warning'" size="small">
              {{ PayStatusMap[row.payStatus] || '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payAmount" label="实付金额" width="120" align="right">
          <template #default="{ row }">
            <span class="amount-text" :class="{ 'shake-animation': row.payStatus === 2 }">
              {{ formatAmount(row.payAmount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="风控标记" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.riskFlag && row.riskFlag > 0" :type="row.riskFlag === 4 ? 'danger' : row.riskFlag === 3 ? 'warning' : 'info'" size="small">
              {{ RiskFlagMap[row.riskFlag] || '未知' }}
            </el-tag>
            <span v-else style="color: #909399">正常</span>
          </template>
        </el-table-column>
        <el-table-column label="对账状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.reconcileStatus === 2 ? 'success' : row.reconcileStatus === 3 ? 'danger' : row.reconcileStatus === 1 ? 'warning' : 'info'" size="small">
              {{ ReconcileStatusMap[row.reconcileStatus] || '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="物流状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="row.logisticsStatus !== undefined && row.logisticsStatus !== null"
              :type="row.logisticsStatus === 4 ? 'success' : row.logisticsStatus === 5 || row.logisticsStatus === 6 ? 'danger' : row.logisticsStatus === 0 ? 'info' : 'warning'"
              size="small"
            >
              {{ LogisticsStatusMap[row.logisticsStatus] || '待发货' }}
            </el-tag>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
        <el-table-column label="物流单号" width="150" align="center">
          <template #default="{ row }">
            <el-tooltip v-if="row.logisticsNo" content="点击复制" placement="top">
              <span
                class="logistics-no-text"
                @click.stop="handleCopyLogisticsNo(row.logisticsNo)"
              >
                {{ row.logisticsNo }}
              </span>
            </el-tooltip>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
        <el-table-column label="物流公司" width="120" align="center">
          <template #default="{ row }">
            <span>{{ row.logisticsCompany || row.logisticsProviderName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="发货时间" width="160" align="center">
          <template #default="{ row }">
            <span>{{ row.shippedAt ? formatOrderDateTime(row.shippedAt) : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="物流异常" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isLogisticsAbnormal === 1" type="danger" size="small">
              异常
            </el-tag>
            <span v-else style="color: #67c23a">正常</span>
          </template>
        </el-table-column>
        <el-table-column label="售后状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="row.afterSaleStatus !== undefined && row.afterSaleStatus !== null"
              :type="row.afterSaleStatus === 2 ? 'success' : row.afterSaleStatus === 3 ? 'danger' : row.afterSaleStatus === 1 ? 'warning' : 'info'"
              size="small"
            >
              {{ AfterSaleStatusMap[row.afterSaleStatus] || '无售后' }}
            </el-tag>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
        <el-table-column label="退款状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="row.refundStatus !== undefined && row.refundStatus !== null && row.refundStatus > 0"
              :type="row.refundStatus === 2 ? 'success' : row.refundStatus === 3 ? 'danger' : 'warning'"
              size="small"
            >
              {{ RefundStatusMap[row.refundStatus] || '未知' }}
            </el-tag>
            <span v-else style="color: #909399">无退款</span>
          </template>
        </el-table-column>
        <el-table-column label="终止类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="row.terminateType !== undefined && row.terminateType !== null && row.terminateType > 0"
              :type="row.terminateType === 4 ? 'danger' : row.terminateType === 3 ? 'danger' : 'warning'"
              size="small"
            >
              {{ TerminateTypeMap[row.terminateType] || '未知' }}
            </el-tag>
            <span v-else style="color: #909399">未终止</span>
          </template>
        </el-table-column>
        <el-table-column label="收货信息" min-width="200">
          <template #default="{ row }">
            <div class="receiver-info">
              <div>
                <span :class="{ 'exception-field': row.isException === 1 && row.exceptionFields?.includes('receiverName') }">
                  {{ row.receiverName }}
                </span>
                <span style="margin-left: 8px; color: #909399">
                  <span :class="{ 'exception-field': row.isException === 1 && row.exceptionFields?.includes('receiverPhone') }">
                    {{ row.receiverPhone }}
                  </span>
                </span>
              </div>
              <div class="order-full-address" style="color: #606266; font-size: 12px; margin-top: 2px">
                <span :class="{ 'exception-field': row.isException === 1 && (row.exceptionFields?.includes('receiverProvince') || row.exceptionFields?.includes('receiverCity') || row.exceptionFields?.includes('receiverDistrict') || row.exceptionFields?.includes('receiverAddress')) }">
                  {{ row.receiverProvince }} {{ row.receiverCity }} {{ row.receiverDistrict }} {{ row.receiverAddress }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="下单时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatOrderDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="340" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="handleView(row as Order)" class="btn-click-feedback">详情</el-button>
            <el-button link type="primary" @click.stop="handleEdit(row as Order)" :disabled="(row as Order).status >= 2" class="btn-click-feedback">编辑</el-button>
            <el-button link type="primary" @click.stop="handleTrace(row as Order)" class="btn-click-feedback">溯源</el-button>
            <el-button link type="primary" @click.stop="handlePaymentTrace(row as Order)" class="btn-click-feedback">支付溯源</el-button>
            <el-button link type="primary" @click.stop="handleLogisticsTrace(row as Order)" :disabled="!row.logisticsNo" class="btn-click-feedback">物流详情</el-button>
            <el-dropdown trigger="click" @command="(cmd) => handleAction(cmd, row as Order)">
              <el-button link type="primary" class="btn-click-feedback">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="ship" v-if="row.status === 1">发货</el-dropdown-item>
                  <el-dropdown-item command="updateLogistics" v-if="row.logisticsNo">更新物流</el-dropdown-item>
                  <el-dropdown-item command="applyAfterSale" v-if="row.status >= 1 && row.afterSaleStatus === 0">申请售后</el-dropdown-item>
                  <el-dropdown-item command="cancelOrder" v-if="row.status <= 1">取消订单</el-dropdown-item>
                  <el-dropdown-item command="complete" v-if="row.status === 2">完成</el-dropdown-item>
                  <el-dropdown-item command="cancel" v-if="row.status <= 1">取消</el-dropdown-item>
                  <el-dropdown-item command="updatePayStatus" v-if="row.status === 0">更新支付状态</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchOrderList"
          @current-change="fetchOrderList"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="detailVisible"
      title="订单详情"
      width="900px"
      class="dialog-center-zoom"
      destroy-on-close
    >
      <div v-if="currentOrder">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单编号">{{ currentOrder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="OrderStatusMap[currentOrder.status]?.type">
              {{ OrderStatusMap[currentOrder.status]?.label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ PayTypeMap[currentOrder.payType] || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="支付状态">
            <el-tag :type="currentOrder.payStatus === 1 ? 'success' : 'warning'">
              {{ currentOrder.payStatus === 1 ? '已支付' : '未支付' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="商品金额">
            <span class="amount-text">{{ formatAmount(currentOrder.totalAmount) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="运费">
            <span class="amount-text" style="color: #606266">{{ formatAmount(currentOrder.freightAmount) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="优惠金额">
            <span class="amount-text" style="color: #67c23a">-{{ formatAmount(currentOrder.discountAmount) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="实付金额">
            <span class="amount-text">{{ formatAmount(currentOrder.payAmount) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="收货人">
            <span :class="{ 'exception-field': currentOrder.isException === 1 && currentOrder.exceptionFields?.includes('receiverName') }">
              {{ currentOrder.receiverName }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            <span :class="{ 'exception-field': currentOrder.isException === 1 && currentOrder.exceptionFields?.includes('receiverPhone') }">
              {{ currentOrder.receiverPhone }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="2">
            <span :class="{ 'exception-field': currentOrder.isException === 1 && (currentOrder.exceptionFields?.includes('receiverProvince') || currentOrder.exceptionFields?.includes('receiverCity') || currentOrder.exceptionFields?.includes('receiverDistrict') || currentOrder.exceptionFields?.includes('receiverAddress')) }">
              {{ currentOrder.receiverProvince }} {{ currentOrder.receiverCity }} {{ currentOrder.receiverDistrict }} {{ currentOrder.receiverAddress }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="物流公司" v-if="currentOrder.logisticsCompany">
            {{ currentOrder.logisticsCompany }}
          </el-descriptions-item>
          <el-descriptions-item label="物流单号" v-if="currentOrder.logisticsNo">
            {{ currentOrder.logisticsNo }}
          </el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ formatOrderDateTime(currentOrder.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="支付时间" v-if="currentOrder.payTime">
            {{ formatOrderDateTime(currentOrder.payTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2" v-if="currentOrder.remark">
            {{ currentOrder.remark }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">异常信息</el-divider>
        <div v-if="currentOrder.isException === 1" class="validation-report-card failed">
          <div style="font-weight: 600; margin-bottom: 8px">
            <el-icon color="#f56c6c"><WarningFilled /></el-icon>
            订单异常
          </div>
          <div style="margin-bottom: 4px">异常原因：{{ currentOrder.exceptionReason }}</div>
          <div>异常字段：{{ currentOrder.exceptionFields?.join('、') }}</div>
        </div>
        <div v-else class="validation-report-card passed">
          <div style="font-weight: 600">
            <el-icon color="#67c23a"><CircleCheckFilled /></el-icon>
            订单正常
          </div>
        </div>

        <el-divider content-position="left">商品信息</el-divider>
        <el-table :data="currentOrderItems" stripe size="small">
          <el-table-column label="商品图片" width="70" align="center">
            <template #default="{ row }">
              <el-image :src="row.goodsImage" fit="cover" style="width: 48px; height: 48px; border-radius: 4px;" />
            </template>
          </el-table-column>
          <el-table-column prop="goodsName" label="商品名称" show-overflow-tooltip />
          <el-table-column prop="specInfo" label="规格" width="100" />
          <el-table-column label="单价" width="100" align="right">
            <template #default="{ row }">
              <span class="amount-text">{{ formatAmount(row.price) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="80" align="center" />
          <el-table-column label="小计" width="110" align="right">
            <template #default="{ row }">
              <span class="amount-text">{{ formatAmount(row.subtotal) }}</span>
            </template>
          </el-table-column>
        </el-table>

        <el-divider content-position="left">金额明细</el-divider>
        <div style="max-width: 300px; margin-left: auto;">
          <div class="amount-row">
            <span class="label">商品总价</span>
            <span class="value">{{ formatAmount(currentOrder.totalAmount) }}</span>
          </div>
          <div class="amount-row">
            <span class="label">运费</span>
            <span class="value">{{ formatAmount(currentOrder.freightAmount) }}</span>
          </div>
          <div class="amount-row">
            <span class="label">优惠金额</span>
            <span class="value negative">-{{ formatAmount(currentOrder.discountAmount) }}</span>
          </div>
          <div class="amount-row" style="border-top: 1px solid #ebeef5; padding-top: 8px; margin-top: 8px;">
            <span class="label" style="font-weight: 600">实付金额</span>
            <span class="value positive" style="font-size: 18px">{{ formatAmount(currentOrder.payAmount) }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEdit(currentOrder)" :disabled="(currentOrder?.status ?? 0) >= 2">
          编辑订单
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="editVisible"
      title="编辑订单"
      width="600px"
      class="dialog-center-zoom"
      destroy-on-close
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="100px"
        @submit.prevent
      >
        <el-alert
          v-if="(editForm.status ?? 0) >= 2"
          type="warning"
          :closable="false"
          style="margin-bottom: 16px"
        >
          <template #title>订单已发货，核心收货信息禁止修改</template>
        </el-alert>

        <el-form-item label="订单编号">
          <el-input v-model="editForm.orderNo" disabled />
        </el-form-item>

        <el-form-item label="订单状态">
          <el-tag :type="OrderStatusMap[editForm.status ?? 0]?.type">
            {{ OrderStatusMap[editForm.status ?? 0]?.label }}
          </el-tag>
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="editForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入订单备注"
            maxlength="500"
            show-word-limit
            :disabled="!canEditRemark"
          />
        </el-form-item>

        <el-divider>收货信息</el-divider>

        <el-form-item label="收货人" prop="receiverName">
          <el-input
            v-model="editForm.receiverName"
            placeholder="请输入收货人姓名"
            :disabled="!canEditShipping"
          />
        </el-form-item>

        <el-form-item label="联系电话" prop="receiverPhone">
          <el-input
            v-model="editForm.receiverPhone"
            placeholder="请输入联系电话"
            :disabled="!canEditShipping"
          />
        </el-form-item>

        <el-form-item label="省份" prop="receiverProvince">
          <el-input
            v-model="editForm.receiverProvince"
            placeholder="请输入省份"
            :disabled="!canEditShipping"
          />
        </el-form-item>

        <el-form-item label="城市" prop="receiverCity">
          <el-input
            v-model="editForm.receiverCity"
            placeholder="请输入城市"
            :disabled="!canEditShipping"
          />
        </el-form-item>

        <el-form-item label="区县" prop="receiverDistrict">
          <el-input
            v-model="editForm.receiverDistrict"
            placeholder="请输入区县"
            :disabled="!canEditShipping"
          />
        </el-form-item>

        <el-form-item label="详细地址" prop="receiverAddress">
          <el-input
            v-model="editForm.receiverAddress"
            type="textarea"
            :rows="2"
            placeholder="请输入详细地址"
            :disabled="!canEditShipping"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="saveBtnDisabled"
          @click="handleSaveEdit"
        >
          {{ saveBtnDisabled ? '保存中...' : '保存' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="traceVisible"
      title="订单数据溯源"
      width="1000px"
      class="trace-dialog dialog-center-zoom"
      destroy-on-close
    >
      <el-tabs v-model="activeTab">
        <el-tab-pane label="订单信息" name="basic">
          <div class="trace-tab-content">
            <el-descriptions :column="2" border size="small" v-if="traceData">
              <el-descriptions-item label="订单编号">{{ traceData.order.orderNo }}</el-descriptions-item>
              <el-descriptions-item label="订单状态">
                <el-tag :type="OrderStatusMap[traceData.order.status]?.type">
                  {{ OrderStatusMap[traceData.order.status]?.label }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="下单用户">{{ traceData.user.username }}</el-descriptions-item>
              <el-descriptions-item label="所属商家">{{ traceData.merchant.name }}</el-descriptions-item>
              <el-descriptions-item label="下单时间">{{ formatOrderDateTime(traceData.order.createdAt) }}</el-descriptions-item>
              <el-descriptions-item label="实付金额">
                <span class="amount-text">{{ formatAmount(traceData.order.payAmount) }}</span>
              </el-descriptions-item>
            </el-descriptions>

            <el-divider>数据校验报告</el-divider>
            <div v-if="validationReport">
              <div
                class="validation-report-card"
                :class="validationReport.overall.passed ? 'passed' : 'failed'"
              >
                <div style="font-weight: 600; margin-bottom: 12px">
                  总体校验结果：
                  <el-tag :type="validationReport.overall.passed ? 'success' : 'danger'" effect="dark">
                    {{ validationReport.overall.passed ? '通过' : '不通过' }}
                  </el-tag>
                  <span style="margin-left: 8px; font-size: 12px; color: #909399">
                    {{ validationReport.overall.passedChecks }}/{{ validationReport.overall.totalChecks }} 项校验通过
                  </span>
                </div>
                <div class="validate-result-item" :class="{ success: validationReport.duplicateCheck.passed }">
                  <div style="font-weight: 500">订单号唯一性校验</div>
                  <div style="font-size: 12px; color: #606266">{{ validationReport.duplicateCheck.message }}</div>
                </div>
                <div class="validate-result-item" :class="{ success: validationReport.amountCheck.passed }">
                  <div style="font-weight: 500">金额一致性校验</div>
                  <div style="font-size: 12px; color: #606266">{{ validationReport.amountCheck.message }}</div>
                </div>
                <div class="validate-result-item" :class="{ success: validationReport.fieldCheck.passed }">
                  <div style="font-weight: 500">字段合规性校验</div>
                  <div style="font-size: 12px; color: #606266">{{ validationReport.fieldCheck.message }}</div>
                  <div v-if="validationReport.fieldCheck.invalidFields.length > 0" style="font-size: 12px; color: #f56c6c; margin-top: 4px">
                    无效字段：{{ validationReport.fieldCheck.invalidFields.join('、') }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="商品快照" name="snapshots">
          <div class="trace-tab-content">
            <div v-if="traceData?.goodsSnapshots && traceData.goodsSnapshots.length > 0">
              <div v-for="snapshot in traceData!.goodsSnapshots" :key="snapshot.id" class="snapshot-card">
                <div class="snapshot-header">
                  <img :src="snapshot.coverImage" class="snapshot-image" />
                  <div style="flex: 1">
                    <div style="font-weight: 600">{{ snapshot.name }}</div>
                    <div style="font-size: 12px; color: #909399">
                      SKU：{{ snapshot.skuCode }} | 当时库存：{{ snapshot.stock }}
                    </div>
                  </div>
                  <div>
                    <span class="amount-text">{{ formatAmount(snapshot.price) }}</span>
                  </div>
                </div>
                <div style="font-size: 12px; color: #606266">
                  规格：{{ snapshot.specInfo || '默认' }}
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无商品快照" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="支付流水" name="payments">
          <div class="trace-tab-content">
            <div v-if="traceData?.paymentFlows && traceData.paymentFlows.length > 0">
              <div v-for="flow in traceData!.paymentFlows" :key="flow.id" class="payment-flow-item">
                <div>
                  <div style="font-weight: 500">{{ PayTypeMap[flow.payType] || '未知' }}</div>
                  <div style="font-size: 12px; color: #909399">
                    流水号：{{ flow.flowNo }} | {{ formatOrderDateTime(flow.createdAt) }}
                  </div>
                  <div v-if="flow.transactionId" style="font-size: 12px; color: #909399">
                    第三方交易号：{{ flow.transactionId }}
                  </div>
                </div>
                <div style="text-align: right">
                  <div class="amount-text">{{ formatAmount(flow.amount) }}</div>
                  <el-tag :type="flow.payStatus === 1 ? 'success' : flow.payStatus === 2 ? 'danger' : 'warning'" size="small">
                    {{ flow.payStatus === 1 ? '支付成功' : flow.payStatus === 2 ? '支付失败' : flow.payStatus === 3 ? '已退款' : '待支付' }}
                  </el-tag>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无支付流水" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="操作日志" name="logs">
          <div class="trace-tab-content">
            <div v-if="traceData?.orderLogs && traceData.orderLogs.length > 0">
              <div v-for="log in traceData!.orderLogs" :key="log.id" class="order-log-item">
                <div class="log-action">{{ log.action }}</div>
                <div v-if="log.remark" style="font-size: 13px; color: #606266; margin-bottom: 4px">
                  {{ log.remark }}
                </div>
                <div class="log-meta">
                  操作人：{{ log.operator }} | {{ formatOrderDateTime(log.createdAt) }}
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无操作日志" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="商家记录" name="merchant">
          <div class="trace-tab-content">
            <div v-if="traceData?.merchantRecords && traceData.merchantRecords.length > 0">
              <div v-for="record in traceData!.merchantRecords" :key="record.id" class="order-log-item" style="border-left-color: #e6a23c">
                <div class="log-action">
                  {{ record.action === 1 ? '接单' : record.action === 2 ? '拒单' : record.action === 3 ? '发货' : '取消' }}
                </div>
                <div v-if="record.reason" style="font-size: 13px; color: #606266; margin-bottom: 4px">
                  {{ record.reason }}
                </div>
                <div class="log-meta">
                  商家：{{ record.merchantName }} | 操作人：{{ record.operatorName }} | {{ formatOrderDateTime(record.createdAt) }}
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无商家操作记录" />
          </div>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="traceVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="shipVisible"
      title="订单发货"
      width="600px"
      class="dialog-center-zoom"
      destroy-on-close
    >
      <el-form :model="shipForm" label-width="110px" @submit.prevent>
        <el-form-item label="订单编号">
          <el-input :value="currentOrder?.orderNo" disabled />
        </el-form-item>
        <el-form-item label="物流服务商" required>
          <el-select
            v-model="shipForm.logisticsProviderId"
            placeholder="请选择物流服务商"
            style="width: 100%"
            @change="handleProviderChange"
          >
            <el-option
              v-for="provider in logisticsProviderList"
              :key="provider.id"
              :label="provider.providerName"
              :value="provider.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="物流公司">
          <el-input v-model="shipForm.logisticsCompany" placeholder="请输入物流公司名称" />
        </el-form-item>
        <el-form-item label="物流单号" required>
          <el-input
            v-model="shipForm.logisticsNo"
            placeholder="请输入物流单号"
            :class="{ 'logistics-no-error btn-shake': logisticsNoError }"
            @blur="handleLogisticsNoBlur"
          />
          <div v-if="logisticsNoError" style="color: #f56c6c; font-size: 12px; margin-top: 4px;">
            {{ logisticsNoError }}
          </div>
        </el-form-item>
        <el-form-item label="运费金额">
          <el-input-number v-model="shipForm.freightAmount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="包裹数量">
          <el-input-number v-model="shipForm.packageCount" :min="1" :precision="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="包裹重量">
          <el-input-number v-model="shipForm.packageWeight" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="保价金额">
          <el-input-number v-model="shipForm.insuranceAmount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="shipForm.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipVisible = false" class="btn-click-feedback">取消</el-button>
        <el-button type="primary" :disabled="shipBtnDisabled" @click="handleShip" class="btn-click-feedback">
          {{ shipBtnDisabled ? '发货中...' : '确认发货' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="logisticsTraceVisible"
      title="物流溯源"
      width="900px"
      class="dialog-center-zoom"
      destroy-on-close
    >
      <el-tabs v-model="logisticsTraceTab">
        <el-tab-pane label="发货记录" name="shipment">
          <div class="trace-tab-content">
            <el-descriptions :column="2" border size="small" v-if="logisticsTraceData?.shipmentRecord">
              <el-descriptions-item label="订单编号">
                {{ logisticsTraceData.shipmentRecord.orderNo }}
              </el-descriptions-item>
              <el-descriptions-item label="发货单号">
                {{ logisticsTraceData.shipmentRecord.shipmentNo }}
              </el-descriptions-item>
              <el-descriptions-item label="物流服务商">
                {{ logisticsTraceData.shipmentRecord.logisticsProviderName }}
              </el-descriptions-item>
              <el-descriptions-item label="物流单号">
                {{ logisticsTraceData.shipmentRecord.logisticsNo }}
              </el-descriptions-item>
              <el-descriptions-item label="收货人">
                {{ logisticsTraceData.shipmentRecord.receiverName }}
              </el-descriptions-item>
              <el-descriptions-item label="联系电话">
                {{ logisticsTraceData.shipmentRecord.receiverPhone }}
              </el-descriptions-item>
              <el-descriptions-item label="收货地址" :span="2">
                {{ logisticsTraceData.shipmentRecord.receiverProvince }}
                {{ logisticsTraceData.shipmentRecord.receiverCity }}
                {{ logisticsTraceData.shipmentRecord.receiverDistrict }}
                {{ logisticsTraceData.shipmentRecord.receiverAddress }}
              </el-descriptions-item>
              <el-descriptions-item label="包裹数量">
                {{ logisticsTraceData.shipmentRecord.packageCount || 1 }}
              </el-descriptions-item>
              <el-descriptions-item label="包裹重量">
                {{ logisticsTraceData.shipmentRecord.packageWeight ? logisticsTraceData.shipmentRecord.packageWeight + ' kg' : '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="运费">
                {{ logisticsTraceData.shipmentRecord.freightAmount ? formatAmount(logisticsTraceData.shipmentRecord.freightAmount) : '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="保价">
                {{ logisticsTraceData.shipmentRecord.insuranceAmount ? formatAmount(logisticsTraceData.shipmentRecord.insuranceAmount) : '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="发货时间">
                {{ logisticsTraceData.shipmentRecord.shippedAt ? formatOrderDateTime(logisticsTraceData.shipmentRecord.shippedAt) : '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="签收时间">
                {{ logisticsTraceData.shipmentRecord.signedAt ? formatOrderDateTime(logisticsTraceData.shipmentRecord.signedAt) : '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="操作人">
                {{ logisticsTraceData.shipmentRecord.operatorName || '系统' }}
              </el-descriptions-item>
              <el-descriptions-item label="备注" :span="2" v-if="logisticsTraceData.shipmentRecord.remark">
                {{ logisticsTraceData.shipmentRecord.remark }}
              </el-descriptions-item>
            </el-descriptions>
            <el-empty v-else description="暂无发货记录" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="物流轨迹" name="tracks">
          <div class="trace-tab-content">
            <div v-if="logisticsTraceData?.logisticsTracks && logisticsTraceData.logisticsTracks.length > 0" class="logistics-timeline">
              <div
                v-for="(track, index) in logisticsTraceData.logisticsTracks"
                :key="track.id"
                class="track-item"
                :class="track.isAbnormal === 1 ? 'track-item-abnormal' : 'track-item-normal'"
              >
                <div class="timeline-dot"></div>
                <div v-if="index < logisticsTraceData.logisticsTracks.length - 1" class="timeline-line"></div>
                <div class="track-content">
                  <div class="track-header">
                    <span class="track-status">{{ TrackStatusMap[track.trackStatus] || '未知' }}</span>
                    <span class="track-time">{{ formatOrderDateTime(track.trackTime) }}</span>
                  </div>
                  <div class="track-description">{{ track.description }}</div>
                  <div v-if="track.location" class="track-location">
                    <el-icon><Location /></el-icon>
                    {{ track.province || '' }}{{ track.city || '' }}{{ track.district || '' }} {{ track.location }}
                  </div>
                  <div v-if="track.isAbnormal === 1" class="track-abnormal">
                    <el-icon color="#f56c6c"><WarningFilled /></el-icon>
                    {{ track.abnormalDesc || '物流异常' }}
                  </div>
                  <div v-if="track.operator" class="track-operator">
                    操作人：{{ track.operator }}{{ track.operatorPhone ? '（' + track.operatorPhone + '）' : '' }}
                  </div>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无物流轨迹" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="异常处理日志" name="abnormalLogs">
          <div class="trace-tab-content">
            <div v-if="logisticsTraceData?.abnormalLogs && logisticsTraceData.abnormalLogs.length > 0">
              <el-table :data="logisticsTraceData.abnormalLogs" stripe size="small">
                <el-table-column prop="logNo" label="日志编号" width="160" />
                <el-table-column label="异常类型" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag :type="row.abnormalLevel === 3 ? 'danger' : row.abnormalLevel === 2 ? 'warning' : 'info'" size="small">
                      {{ AbnormalLogisticsTypeMap[row.abnormalType] || '未知' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="异常等级" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag :type="row.abnormalLevel === 3 ? 'danger' : row.abnormalLevel === 2 ? 'warning' : 'info'" size="small">
                      {{ AbnormalLevelMap[row.abnormalLevel] || '未知' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="abnormalDesc" label="异常描述" show-overflow-tooltip />
                <el-table-column label="处理状态" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 2 ? 'success' : row.status === 3 ? 'info' : row.status === 1 ? 'warning' : 'danger'" size="small">
                      {{ AbnormalHandleStatusMap[row.status] || '未知' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="处理结果" show-overflow-tooltip>
                  <template #default="{ row }">
                    {{ row.handleResult || '-' }}
                  </template>
                </el-table-column>
                <el-table-column prop="operatorName" label="处理人" width="100" align="center" />
                <el-table-column label="上报时间" width="160" align="center">
                  <template #default="{ row }">
                    {{ row.reportedAt ? formatOrderDateTime(row.reportedAt) : '-' }}
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <el-empty v-else description="暂无异常处理记录" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="数据校验报告" name="validationReport">
          <div class="trace-tab-content">
            <div v-if="logisticsValidationReport">
              <div
                class="validation-report-card"
                :class="logisticsValidationReport.overallScore >= 80 ? 'passed' : 'failed'"
              >
                <div style="font-weight: 600; margin-bottom: 12px">
                  总体校验结果：
                  <el-tag :type="logisticsValidationReport.overallScore >= 80 ? 'success' : 'danger'" effect="dark">
                    {{ logisticsValidationReport.overallScore >= 80 ? '通过' : '不通过' }}
                  </el-tag>
                  <span style="margin-left: 8px; font-size: 12px; color: #909399">
                    综合得分：{{ logisticsValidationReport.overallScore }}分
                  </span>
                </div>
                <div class="validate-result-item" :class="{ success: logisticsValidationReport.orderMatch }">
                  <div style="font-weight: 500">订单信息匹配校验</div>
                  <div style="font-size: 12px; color: #606266">{{ logisticsValidationReport.orderMatch ? '订单号与发货记录匹配' : '订单信息不匹配' }}</div>
                </div>
                <div class="validate-result-item" :class="{ success: logisticsValidationReport.logisticsNoValid }">
                  <div style="font-weight: 500">物流单号格式校验</div>
                  <div style="font-size: 12px; color: #606266">{{ logisticsValidationReport.logisticsNoValid ? '物流单号格式正确' : '物流单号格式异常' }}</div>
                </div>
                <div class="validate-result-item" :class="{ success: logisticsValidationReport.providerValid }">
                  <div style="font-weight: 500">物流服务商校验</div>
                  <div style="font-size: 12px; color: #606266">{{ logisticsValidationReport.providerValid ? '物流服务商有效' : '物流服务商信息异常' }}</div>
                </div>
                <div class="validate-result-item" :class="{ success: logisticsValidationReport.trackContinuity }">
                  <div style="font-weight: 500">轨迹连续性校验</div>
                  <div style="font-size: 12px; color: #606266">{{ logisticsValidationReport.trackContinuity ? '物流轨迹连续完整' : '物流轨迹存在断点' }}</div>
                </div>
                <div class="validate-result-item" :class="{ success: logisticsValidationReport.noDuplicate }">
                  <div style="font-weight: 500">重复单号校验</div>
                  <div style="font-size: 12px; color: #606266">{{ logisticsValidationReport.noDuplicate ? '无重复物流单号' : '存在重复物流单号' }}</div>
                </div>
                <div class="validate-result-item" :class="{ success: logisticsValidationReport.addressMatch }">
                  <div style="font-weight: 500">收货地址匹配校验</div>
                  <div style="font-size: 12px; color: #606266">{{ logisticsValidationReport.addressMatch ? '收货地址一致' : '收货地址不一致' }}</div>
                </div>
                <div v-if="logisticsValidationReport.issues.length > 0" style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #ebeef5">
                  <div style="font-weight: 500; color: #f56c6c; margin-bottom: 4px">存在问题：</div>
                  <div v-for="(issue, idx) in logisticsValidationReport.issues" :key="idx" style="font-size: 12px; color: #f56c6c; margin-left: 12px">
                    • {{ issue }}
                  </div>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无校验报告" />
          </div>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="logisticsTraceVisible = false" class="btn-click-feedback">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchShipVisible"
      title="批量发货"
      width="700px"
      class="dialog-center-zoom"
      destroy-on-close
    >
      <el-form label-width="110px" @submit.prevent>
        <el-form-item label="物流服务商" required>
          <el-select
            v-model="batchShipForm.logisticsProviderId"
            placeholder="请选择物流服务商"
            style="width: 100%"
          >
            <el-option
              v-for="provider in logisticsProviderList"
              :key="provider.id"
              :label="provider.providerName"
              :value="provider.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="数据导入" required>
          <el-upload
            class="batch-upload"
            drag
            :auto-upload="false"
            :on-change="handleBatchFileChange"
            accept=".xlsx,.xls,.csv"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">
                支持Excel格式，模板列：订单编号、物流单号、物流公司（可选）
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="粘贴数据">
          <el-input
            v-model="batchShipForm.pasteData"
            type="textarea"
            :rows="5"
            placeholder="粘贴数据格式：订单编号&#9;物流单号（每行一条，Tab分隔）"
          />
        </el-form-item>
        <el-form-item v-if="batchShipProgress > 0" label="导入进度">
          <el-progress :percentage="batchShipProgress" :status="batchShipProgress === 100 ? 'success' : undefined" class="batch-import-progress" />
        </el-form-item>
        <el-form-item v-if="batchShipErrors.length > 0" label="错误明细">
          <div style="width: 100%; max-height: 150px; overflow-y: auto; padding: 8px; background: #fef0f0; border-radius: 4px;">
            <div v-for="(err, idx) in batchShipErrors" :key="idx" style="font-size: 12px; color: #f56c6c; padding: 2px 0;">
              第{{ err.row }}行 - {{ err.reason }}
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchShipVisible = false" class="btn-click-feedback">取消</el-button>
        <el-button type="primary" :disabled="batchShipBtnDisabled" @click="handleBatchShipConfirm" class="btn-click-feedback">
          {{ batchShipBtnDisabled ? '发货中...' : '确认批量发货' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="payStatusVisible"
      title="更新支付状态"
      width="500px"
      class="dialog-slide-down"
      destroy-on-close
      @closed="handlePayStatusDialogClose"
    >
      <el-form :model="payStatusForm" label-width="100px" @submit.prevent>
        <el-form-item label="订单编号">
          <el-input :value="currentOrder?.orderNo" disabled />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="payStatusForm.payType" style="width: 100%">
            <el-option label="微信支付" :value="1" />
            <el-option label="支付宝" :value="2" />
            <el-option label="银行卡" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付金额" required>
          <el-input-number v-model="payStatusForm.payAmount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="支付状态" required>
          <el-select v-model="payStatusForm.payStatus" style="width: 100%">
            <el-option label="支付成功" :value="1" />
            <el-option label="支付失败" :value="2" />
            <el-option label="已退款" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付场景">
          <el-select v-model="payStatusForm.payScenario" style="width: 100%">
            <el-option label="全额支付" :value="1" />
            <el-option label="部分支付" :value="2" />
            <el-option label="退款后支付" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="第三方交易号">
          <el-input v-model="payStatusForm.transactionId" placeholder="请输入第三方交易号" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="payStatusForm.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="payStatusVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="payBtnDisabled"
          @click="handleUpdatePayStatus"
        >
          {{ payBtnDisabled ? '保存中...' : '确认' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="paymentTraceVisible"
      title="支付全链路溯源"
      width="1100px"
      class="dialog-center-zoom"
      destroy-on-close
    >
      <el-tabs v-model="paymentTraceTab">
        <el-tab-pane label="支付流水" name="flow">
          <div class="trace-tab-content">
            <el-descriptions :column="2" border size="small" v-if="paymentTraceData?.paymentFlow">
              <el-descriptions-item label="流水号">
                {{ paymentTraceData.paymentFlow.flowNo }}
              </el-descriptions-item>
              <el-descriptions-item label="订单号">
                {{ paymentTraceData.paymentFlow.orderNo }}
              </el-descriptions-item>
              <el-descriptions-item label="支付方式">
                {{ PayTypeMap[paymentTraceData.paymentFlow.payType] || '未知' }}
              </el-descriptions-item>
              <el-descriptions-item label="支付场景">
                {{ PayScenarioMap[paymentTraceData.paymentFlow.payScenario] || '未知' }}
              </el-descriptions-item>
              <el-descriptions-item label="支付金额">
                <span class="amount-text">{{ formatAmount(paymentTraceData.paymentFlow.amount) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="订单金额">
                <span class="amount-text">{{ formatAmount(paymentTraceData.paymentFlow.orderAmount) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="支付状态">
                <el-tag :type="paymentTraceData.paymentFlow.payStatus === 1 ? 'success' : paymentTraceData.paymentFlow.payStatus === 2 ? 'danger' : 'warning'">
                  {{ PayStatusMap[paymentTraceData.paymentFlow.payStatus] || '未知' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="对账状态">
                <el-tag :type="paymentTraceData.paymentFlow.reconcileStatus === 2 ? 'success' : paymentTraceData.paymentFlow.reconcileStatus === 3 ? 'danger' : 'warning'">
                  {{ ReconcileStatusMap[paymentTraceData.paymentFlow.reconcileStatus] || '未知' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="风控标记">
                <el-tag v-if="paymentTraceData.paymentFlow.riskFlag && paymentTraceData.paymentFlow.riskFlag > 0"
                  :type="paymentTraceData.paymentFlow.riskFlag === 4 ? 'danger' : paymentTraceData.paymentFlow.riskFlag === 3 ? 'warning' : 'info'">
                  {{ RiskFlagMap[paymentTraceData.paymentFlow.riskFlag] || '未知' }}
                </el-tag>
                <span v-else style="color: #909399">正常</span>
              </el-descriptions-item>
              <el-descriptions-item label="结算状态">
                <el-tag :type="paymentTraceData.paymentFlow.settleStatus === 1 ? 'success' : paymentTraceData.paymentFlow.settleStatus === 2 ? 'danger' : 'warning'">
                  {{ SettleStatusMap[paymentTraceData.paymentFlow.settleStatus] || '未知' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">
                {{ formatOrderDateTime(paymentTraceData.paymentFlow.createdAt) }}
              </el-descriptions-item>
              <el-descriptions-item label="支付时间" v-if="paymentTraceData.paymentFlow.payTime">
                {{ formatOrderDateTime(paymentTraceData.paymentFlow.payTime) }}
              </el-descriptions-item>
              <el-descriptions-item label="第三方交易号" v-if="paymentTraceData.paymentFlow.transactionId">
                {{ paymentTraceData.paymentFlow.transactionId }}
              </el-descriptions-item>
              <el-descriptions-item label="风控原因" v-if="paymentTraceData.paymentFlow.riskReason">
                {{ paymentTraceData.paymentFlow.riskReason }}
              </el-descriptions-item>
              <el-descriptions-item label="备注" :span="2" v-if="paymentTraceData.paymentFlow.remark">
                <el-tooltip v-if="paymentTraceData.paymentFlow.remark.length > 50" placement="top">
                  <template #content>
                    <div style="max-width: 400px; white-space: pre-wrap;">{{ paymentTraceData.paymentFlow.remark }}</div>
                  </template>
                  <div style="cursor: help;">{{ paymentTraceData.paymentFlow.remark.substring(0, 50) }}...</div>
                </el-tooltip>
                <span v-else>{{ paymentTraceData.paymentFlow.remark }}</span>
              </el-descriptions-item>
            </el-descriptions>

            <el-divider>数据校验报告</el-divider>
            <div v-if="paymentValidationReport">
              <div
                class="validation-report-card"
                :class="paymentValidationReport.overallScore >= 80 ? 'passed' : 'failed'"
              >
                <div style="font-weight: 600; margin-bottom: 12px">
                  总体校验结果：
                  <el-tag :type="paymentValidationReport.overallScore >= 80 ? 'success' : 'danger'" effect="dark">
                    {{ paymentValidationReport.overallScore >= 80 ? '通过' : '不通过' }}
                  </el-tag>
                  <span style="margin-left: 8px; font-size: 12px; color: #909399">
                    综合得分：{{ paymentValidationReport.overallScore }}分
                  </span>
                </div>
                <div class="validate-result-item" :class="{ success: paymentValidationReport.flowMatch }">
                  <div style="font-weight: 500">订单信息匹配校验</div>
                  <div style="font-size: 12px; color: #606266">{{ paymentValidationReport.flowMatch ? '订单号、用户ID匹配' : '订单信息不匹配' }}</div>
                </div>
                <div class="validate-result-item" :class="{ success: paymentValidationReport.amountMatch }">
                  <div style="font-weight: 500">金额一致性校验</div>
                  <div style="font-size: 12px; color: #606266">{{ paymentValidationReport.amountMatch ? '支付金额与订单金额一致' : '金额不匹配' }}</div>
                </div>
                <div class="validate-result-item" :class="{ success: paymentValidationReport.timeMatch }">
                  <div style="font-weight: 500">时间逻辑校验</div>
                  <div style="font-size: 12px; color: #606266">{{ paymentValidationReport.timeMatch ? '支付时间晚于下单时间' : '支付时间异常' }}</div>
                </div>
                <div class="validate-result-item" :class="{ success: paymentValidationReport.noDuplicate }">
                  <div style="font-weight: 500">重复支付校验</div>
                  <div style="font-size: 12px; color: #606266">{{ paymentValidationReport.noDuplicate ? '无重复支付流水' : '存在重复支付' }}</div>
                </div>
                <div class="validate-result-item" :class="{ success: paymentValidationReport.noFake }">
                  <div style="font-weight: 500">虚假支付校验</div>
                  <div style="font-size: 12px; color: #606266">{{ paymentValidationReport.noFake ? '支付金额正常' : '疑似虚假支付' }}</div>
                </div>
                <div v-if="paymentValidationReport.issues.length > 0" style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #ebeef5">
                  <div style="font-weight: 500; color: #f56c6c; margin-bottom: 4px">存在问题：</div>
                  <div v-for="(issue, idx) in paymentValidationReport.issues" :key="idx" style="font-size: 12px; color: #f56c6c; margin-left: 12px">
                    • {{ issue }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="对账记录" name="reconciles">
          <div class="trace-tab-content">
            <div v-if="paymentTraceData?.reconciles && paymentTraceData.reconciles.length > 0">
              <div v-for="reconcile in paymentTraceData.reconciles" :key="reconcile.id" class="order-log-item">
                <div class="log-action">{{ ReconcileStatusMap[reconcile.status] || '未知' }}</div>
                <div style="font-size: 13px; color: #606266; margin-bottom: 4px">
                  订单金额：{{ formatAmount(reconcile.orderAmount) }} | 支付金额：{{ formatAmount(reconcile.payAmount) }}
                  <span v-if="reconcile.diffAmount > 0" style="color: #f56c6c"> | 差异：{{ formatAmount(reconcile.diffAmount) }}</span>
                </div>
                <div v-if="reconcile.remark" style="font-size: 12px; color: #909399; margin-bottom: 4px">
                  备注：{{ reconcile.remark }}
                </div>
                <div v-if="reconcile.exceptionRemark" style="font-size: 12px; color: #f56c6c; margin-bottom: 4px">
                  异常说明：{{ reconcile.exceptionRemark }}
                </div>
                <div class="log-meta">
                  对账人：{{ reconcile.reconcileName || '系统' }} | {{ formatOrderDateTime(reconcile.createdAt) }}
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无对账记录" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="结算记录" name="settlements">
          <div class="trace-tab-content">
            <div v-if="paymentTraceData?.settlements && paymentTraceData.settlements.length > 0">
              <div v-for="settle in paymentTraceData.settlements" :key="settle.id" class="order-log-item" style="border-left-color: #67c23a">
                <div class="log-action">{{ SettleStatusMap[settle.status] || '未知' }}</div>
                <div style="font-size: 13px; color: #606266; margin-bottom: 4px">
                  商家：{{ settle.merchantName }} | 支付金额：{{ formatAmount(settle.payAmount) }}
                </div>
                <div style="font-size: 12px; color: #909399; margin-bottom: 4px">
                  平台手续费：{{ formatAmount(settle.platformFee) }} | 结算金额：<span class="amount-text">{{ formatAmount(settle.settleAmount) }}</span>
                </div>
                <div v-if="settle.remark" style="font-size: 12px; color: #909399; margin-bottom: 4px">
                  备注：{{ settle.remark }}
                </div>
                <div class="log-meta">
                  操作人：{{ settle.operatorName || '系统' }} | {{ formatOrderDateTime(settle.createdAt) }}
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无结算记录" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="风控预警" name="risks">
          <div class="trace-tab-content">
            <div v-if="paymentTraceData?.riskAlerts && paymentTraceData.riskAlerts.length > 0">
              <div v-for="alert in paymentTraceData.riskAlerts" :key="alert.id" class="order-log-item" style="border-left-color: #f56c6c">
                <div class="log-action">
                  <el-tag :type="alert.level === 3 ? 'danger' : alert.level === 2 ? 'warning' : 'info'" size="small">
                    {{ alert.level === 3 ? '高风险' : alert.level === 2 ? '中风险' : '低风险' }}
                  </el-tag>
                </div>
                <div style="font-size: 13px; color: #606266; margin-bottom: 4px">{{ alert.content }}</div>
                <div class="log-meta">
                  状态：{{ alert.status === 1 ? '已处理' : '未处理' }} | {{ formatOrderDateTime(alert.createdAt) }}
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无风控预警记录" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="操作日志" name="logs">
          <div class="trace-tab-content">
            <div v-if="paymentTraceData?.orderLogs && paymentTraceData.orderLogs.length > 0">
              <div v-for="log in paymentTraceData.orderLogs" :key="log.id" class="order-log-item">
                <div class="log-action">{{ log.action }}</div>
                <div v-if="log.remark" style="font-size: 13px; color: #606266; margin-bottom: 4px">
                  {{ log.remark }}
                </div>
                <div class="log-meta">
                  操作人：{{ log.operatorName || log.operator || '系统' }} | {{ formatOrderDateTime(log.createdAt) }}
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无操作日志" />
          </div>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="paymentTraceVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="afterSaleApplyVisible"
      title="申请售后"
      width="600px"
      class="dialog-center-zoom"
      destroy-on-close
    >
      <el-form :model="afterSaleApplyForm" label-width="100px" @submit.prevent>
        <el-form-item label="订单编号">
          <el-input v-model="afterSaleApplyForm.orderId" disabled />
        </el-form-item>
        <el-form-item label="售后类型" required>
          <el-select v-model="afterSaleApplyForm.type" placeholder="请选择售后类型" style="width: 100%">
            <el-option label="退款" :value="1" />
            <el-option label="退货退款" :value="2" />
            <el-option label="换货" :value="3" />
            <el-option label="维修" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="退款金额">
          <el-input-number v-model="afterSaleApplyForm.amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="申请原因">
          <el-input v-model="afterSaleApplyForm.reason" type="textarea" :rows="4" placeholder="请输入申请原因" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item v-if="afterSaleValidateResults.length > 0" label="校验结果">
          <div class="after-sale-restriction">
            <div v-for="(result, idx) in afterSaleValidateResults" :key="idx" style="margin-bottom: 8px">
              <div v-if="!result.valid" style="color: #f56c6c; font-weight: 500">
                <el-icon><WarningFilled /></el-icon> {{ result.errorMessage }}
              </div>
              <div v-if="result.restrictionRules && result.restrictionRules.length > 0" style="margin-top: 4px">
                <div v-for="(rule, rIdx) in result.restrictionRules" :key="rIdx" style="font-size: 12px; color: #f56c6c; padding-left: 12px">
                  • {{ rule }}
                </div>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="afterSaleApplyVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="afterSaleApplyDisabled"
          @click="handleAfterSaleApplyConfirm"
          :class="{ 'validate-disabled-btn': afterSaleApplyDisabled }"
        >
          确认申请
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="afterSaleTraceVisible"
      title="售后溯源"
      width="1000px"
      class="dialog-center-zoom"
      destroy-on-close
    >
      <div class="after-sale-trace-swiper">
        <el-button
          :disabled="afterSaleTraceIndex <= 0"
          @click="handleAfterSaleTracePrev"
          circle
          size="small"
          class="slide-left"
        >
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <div style="flex: 1; overflow: hidden">
          <el-tabs v-model="afterSaleTraceTab">
            <el-tab-pane label="售后信息" name="afterSale">
              <div class="trace-tab-content">
                <el-descriptions :column="2" border size="small" v-if="afterSaleTraceData?.afterSale">
                  <el-descriptions-item label="售后单号">{{ afterSaleTraceData.afterSale.afterSaleNo }}</el-descriptions-item>
                  <el-descriptions-item label="订单编号">{{ afterSaleTraceData.afterSale.orderNo }}</el-descriptions-item>
                  <el-descriptions-item label="售后类型">{{ AfterSaleTypeMap[afterSaleTraceData.afterSale.type] || '未知' }}</el-descriptions-item>
                  <el-descriptions-item label="售后状态">
                    <el-tag :type="afterSaleTraceData.afterSale.status === 3 ? 'success' : afterSaleTraceData.afterSale.status === 4 ? 'danger' : 'warning'" size="small">
                      {{ AfterSaleStatusMap[afterSaleTraceData.afterSale.status] || '未知' }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="退款金额">
                    <span class="amount-text">{{ formatAmount(afterSaleTraceData.afterSale.amount ?? 0) }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="申请原因">{{ afterSaleTraceData.afterSale.reason || '-' }}</el-descriptions-item>
                  <el-descriptions-item label="创建时间">{{ formatOrderDateTime(afterSaleTraceData.afterSale.createdAt) }}</el-descriptions-item>
                  <el-descriptions-item label="更新时间">{{ formatOrderDateTime(afterSaleTraceData.afterSale.updatedAt) }}</el-descriptions-item>
                  <el-descriptions-item label="处理备注" :span="2" v-if="afterSaleTraceData.afterSale.handleRemark">
                    {{ afterSaleTraceData.afterSale.handleRemark }}
                  </el-descriptions-item>
                </el-descriptions>
                <el-empty v-else description="暂无售后信息" />
              </div>
            </el-tab-pane>

            <el-tab-pane label="操作日志" name="operationLogs">
              <div class="trace-tab-content">
                <div v-if="afterSaleTraceData?.operationLogs && afterSaleTraceData.operationLogs.length > 0">
                  <div v-for="log in afterSaleTraceData.operationLogs" :key="log.id" class="order-log-item">
                    <div class="log-action">{{ log.actionDesc || log.action }}</div>
                    <div style="font-size: 13px; color: #606266; margin-bottom: 4px">
                      {{ log.remark || '-' }}
                    </div>
                    <div v-if="log.fundChange" style="font-size: 12px; color: #e6a23c; margin-bottom: 4px">
                      资金变动：{{ log.fundChange }}
                    </div>
                    <div v-if="log.stockChange" style="font-size: 12px; color: #409eff; margin-bottom: 4px">
                      库存变动：{{ log.stockChange }}
                    </div>
                    <div class="log-meta">
                      操作人：{{ log.operatorName || '系统' }} | {{ formatOrderDateTime(log.createdAt) }}
                    </div>
                  </div>
                </div>
                <el-empty v-else description="暂无操作日志" />
              </div>
            </el-tab-pane>

            <el-tab-pane label="售后台账" name="ledger">
              <div class="trace-tab-content">
                <el-descriptions :column="2" border size="small" v-if="afterSaleTraceData?.ledger">
                  <el-descriptions-item label="台账编号">{{ afterSaleTraceData.ledger.ledgerNo }}</el-descriptions-item>
                  <el-descriptions-item label="售后单号">{{ afterSaleTraceData.ledger.afterSaleNo }}</el-descriptions-item>
                  <el-descriptions-item label="订单编号">{{ afterSaleTraceData.ledger.orderNo }}</el-descriptions-item>
                  <el-descriptions-item label="售后类型">{{ AfterSaleTypeMap[afterSaleTraceData.ledger.afterSaleType] || '未知' }}</el-descriptions-item>
                  <el-descriptions-item label="退款金额">
                    <span class="amount-text">{{ formatAmount(afterSaleTraceData.ledger.refundAmount) }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="库存回退状态">
                    <el-tag :type="afterSaleTraceData.ledger.stockRollbackStatus === 1 ? 'success' : afterSaleTraceData.ledger.stockRollbackStatus === 2 ? 'danger' : 'info'" size="small">
                      {{ afterSaleTraceData.ledger.stockRollbackStatus === 1 ? '已回退' : afterSaleTraceData.ledger.stockRollbackStatus === 2 ? '回退失败' : '未回退' }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="结算扣款">
                    <span class="amount-text">{{ formatAmount(afterSaleTraceData.ledger.settleDeductAmount) }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="积分回退">{{ afterSaleTraceData.ledger.pointsRollback }}</el-descriptions-item>
                  <el-descriptions-item label="创建时间">{{ formatOrderDateTime(afterSaleTraceData.ledger.createdAt) }}</el-descriptions-item>
                  <el-descriptions-item label="备注" v-if="afterSaleTraceData.ledger.remark">
                    {{ afterSaleTraceData.ledger.remark }}
                  </el-descriptions-item>
                </el-descriptions>
                <el-empty v-else description="暂无台账信息" />
              </div>
            </el-tab-pane>

            <el-tab-pane label="数据校验报告" name="validationReport">
              <div class="trace-tab-content">
                <div v-if="afterSaleValidationReport">
                  <div
                    class="validation-report-card"
                    :class="afterSaleValidationReport.overallScore >= 80 ? 'passed' : 'failed'"
                  >
                    <div style="font-weight: 600; margin-bottom: 12px">
                      总体校验结果：
                      <el-tag :type="afterSaleValidationReport.overallScore >= 80 ? 'success' : 'danger'" effect="dark">
                        {{ afterSaleValidationReport.overallScore >= 80 ? '通过' : '不通过' }}
                      </el-tag>
                      <span style="margin-left: 8px; font-size: 12px; color: #909399">
                        综合得分：{{ afterSaleValidationReport.overallScore }}分
                      </span>
                    </div>
                    <div class="validate-result-item" :class="{ success: afterSaleValidationReport.processCompliance }">
                      <div style="font-weight: 500">流程合规性校验</div>
                      <div style="font-size: 12px; color: #606266">{{ afterSaleValidationReport.processCompliance ? '流程合规' : '流程不合规' }}</div>
                    </div>
                    <div class="validate-result-item" :class="{ success: afterSaleValidationReport.dataConsistency }">
                      <div style="font-weight: 500">数据一致性校验</div>
                      <div style="font-size: 12px; color: #606266">{{ afterSaleValidationReport.dataConsistency ? '数据一致' : '数据不一致' }}</div>
                    </div>
                    <div class="validate-result-item" :class="{ success: afterSaleValidationReport.noDuplicate }">
                      <div style="font-weight: 500">重复售后校验</div>
                      <div style="font-size: 12px; color: #606266">{{ afterSaleValidationReport.noDuplicate ? '无重复售后' : '存在重复售后' }}</div>
                    </div>
                    <div class="validate-result-item" :class="{ success: afterSaleValidationReport.fundMatch }">
                      <div style="font-weight: 500">资金匹配校验</div>
                      <div style="font-size: 12px; color: #606266">{{ afterSaleValidationReport.fundMatch ? '资金匹配' : '资金不匹配' }}</div>
                    </div>
                    <div class="validate-result-item" :class="{ success: afterSaleValidationReport.stockMatch }">
                      <div style="font-weight: 500">库存匹配校验</div>
                      <div style="font-size: 12px; color: #606266">{{ afterSaleValidationReport.stockMatch ? '库存匹配' : '库存不匹配' }}</div>
                    </div>
                    <div class="validate-result-item" :class="{ success: afterSaleValidationReport.statusConsistency }">
                      <div style="font-weight: 500">状态一致性校验</div>
                      <div style="font-size: 12px; color: #606266">{{ afterSaleValidationReport.statusConsistency ? '状态一致' : '状态不一致' }}</div>
                    </div>
                    <div v-if="afterSaleValidationReport.issues.length > 0" style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #ebeef5">
                      <div style="font-weight: 500; color: #f56c6c; margin-bottom: 4px">存在问题：</div>
                      <div v-for="(issue, idx) in afterSaleValidationReport.issues" :key="idx" style="font-size: 12px; color: #f56c6c; margin-left: 12px">
                        • {{ issue }}
                      </div>
                    </div>
                  </div>
                </div>
                <el-empty v-else description="暂无校验报告" />
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
        <el-button
          :disabled="afterSaleTraceIndex >= afterSaleTraceList.length - 1"
          @click="handleAfterSaleTraceNext"
          circle
          size="small"
          class="slide-right"
        >
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div style="text-align: center; font-size: 12px; color: #909399; margin-top: 8px">
        {{ afterSaleTraceList.length > 0 ? `${afterSaleTraceIndex + 1} / ${afterSaleTraceList.length}` : '' }}
      </div>
      <template #footer>
        <el-button @click="afterSaleTraceVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="cancelOrderVisible"
      title="取消订单"
      width="600px"
      class="dialog-center-zoom"
      destroy-on-close
    >
      <el-form :model="cancelOrderForm" label-width="100px" @submit.prevent>
        <el-form-item label="订单编号">
          <el-input v-model="cancelOrderForm.orderId" disabled />
        </el-form-item>
        <el-form-item label="取消场景" required>
          <el-select v-model="cancelOrderForm.cancelScene" placeholder="请选择取消场景" style="width: 100%">
            <el-option label="主动取消" :value="1" />
            <el-option label="超时取消" :value="2" />
            <el-option label="违规取消" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="取消原因">
          <el-input v-model="cancelOrderForm.reason" type="textarea" :rows="4" placeholder="请输入取消原因" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item v-if="cancelOrderValidateResults.length > 0" label="校验结果">
          <div class="after-sale-restriction">
            <div v-for="(result, idx) in cancelOrderValidateResults" :key="idx" style="margin-bottom: 8px">
              <div v-if="!result.valid" style="color: #f56c6c; font-weight: 500">
                <el-icon><WarningFilled /></el-icon> {{ result.errorMessage }}
              </div>
              <div v-if="result.restrictionRules && result.restrictionRules.length > 0" style="margin-top: 4px">
                <div v-for="(rule, rIdx) in result.restrictionRules" :key="rIdx" style="font-size: 12px; color: #f56c6c; padding-left: 12px">
                  • {{ rule }}
                </div>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelOrderVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="cancelOrderDisabled"
          @click="handleCancelOrderConfirm"
          :class="{ 'validate-disabled-btn': cancelOrderDisabled }"
        >
          确认取消
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Search,
  Refresh,
  Bell,
  Warning,
  FolderOpened,
  ArrowDown,
  WarningFilled,
  CircleCheckFilled,
  Check,
  RefreshRight,
  DocumentChecked,
  Goods,
  Van,
  Location,
  UploadFilled,
  Select,
  CircleClose,
  ArrowLeft,
  ArrowRight,
} from '@element-plus/icons-vue'
import {
  getOrderList,
  updateOrder,
  completeOrder,
  cancelOrder,
  getOrderDetailWithItems,
  getOrderTrace,
  validateOrderData,
  batchRemind,
  batchMarkException,
  batchArchive,
  type Order,
  type OrderUpdateData,
  type OrderTraceData,
  type OrderValidationReport,
} from '@/api/order'
import {
  verifyPayment,
  syncPaymentStatus,
  batchVerifyPayment,
  batchResetExpireTime,
  batchMarkReconcile,
  getPaymentTraceByOrderId,
  validatePaymentData,
  type PaymentTraceData,
  type PaymentVerifyData,
  type PaymentQueryParams,
  type PaymentValidationReport,
  PayStatusMap,
  ReconcileStatusMap,
  RiskFlagMap,
  PayScenarioMap,
  SettleStatusMap,
} from '@/api/payment'
import {
  verifyShipping,
  validateLogisticsNoFormat,
  shipOrder,
  updateLogisticsStatus,
  getLogisticsProviderList,
  batchShipOrder,
  batchUpdateAbnormalStatus,
  batchResendLogisticsNotification,
  getLogisticsTraceByOrderId,
  validateLogisticsData,
  type LogisticsProvider,
  type LogisticsTraceData,
  type LogisticsValidationReport,
  type ShipOrderData,
  LogisticsStatusMap,
  ShippingAbnormalMap,
  TrackStatusMap,
  AbnormalLogisticsTypeMap,
  AbnormalLevelMap,
  AbnormalHandleStatusMap,
} from '@/api/shipping'
import { OrderStatusMap, PayTypeMap, OrderStatus } from '@/types/business'
import { formatAmount } from '@/utils/amount'
import { formatOrderDateTime } from '@/utils/date'
import type { PageResult } from '@/types/api'
import { useUserStore } from '@/stores/user'
import {
  applyAfterSale,
  verifyAfterSaleApply,
  verifyOrderTerminate,
  cancelOrderApi,
  processAfterSale,
  getAfterSaleTraceByOrderId,
  validateAfterSaleData,
  batchAuditAfterSale,
  batchCloseInvalidAfterSale,
  batchArchiveTerminated,
  type AfterSaleApplyData,
  type AfterSaleTraceData,
  type AfterSaleValidationReport,
  type AfterSaleValidateResult,
  AfterSaleTypeMap,
  AfterSaleStatusMap,
  CancelSceneMap,
  TerminateTypeMap,
  RefundStatusMap,
} from '@/api/aftersale'

const loading = ref(false)
const orderList = ref<Order[]>([])
const selectedIds = ref<number[]>([])

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

const userStore = useUserStore()

const searchForm = reactive({
  orderNo: '',
  payType: undefined as number | undefined,
  status: undefined as number | undefined,
  dateRange: [] as string[],
  minAmount: undefined as number | undefined,
  maxAmount: undefined as number | undefined,
  payStatus: undefined as number | undefined,
  reconcileStatus: undefined as number | undefined,
  riskFlag: undefined as number | undefined,
  isOverdue: undefined as number | undefined,
  logisticsStatus: undefined as number | undefined,
  logisticsProviderId: undefined as number | undefined,
  isLogisticsAbnormal: undefined as number | undefined,
  shippedDateRange: [] as string[],
  afterSaleStatus: undefined as number | undefined,
  refundStatus: undefined as number | undefined,
  terminateType: undefined as number | undefined,
  isException: undefined as number | undefined,
})

const detailVisible = ref(false)
const editVisible = ref(false)
const traceVisible = ref(false)
const shipVisible = ref(false)
const payStatusVisible = ref(false)
const paymentTraceVisible = ref(false)
const logisticsTraceVisible = ref(false)
const batchShipVisible = ref(false)
const afterSaleApplyVisible = ref(false)
const afterSaleTraceVisible = ref(false)
const cancelOrderVisible = ref(false)
const activeTab = ref('basic')
const paymentTraceTab = ref('flow')
const logisticsTraceTab = ref('shipment')
const afterSaleTraceTab = ref('afterSale')

const logisticsProviderList = ref<LogisticsProvider[]>([])
const currentOrder = ref<Order | null>(null)
const currentOrderItems = ref<any[]>([])
const traceData = ref<OrderTraceData | null>(null)
const validationReport = ref<OrderValidationReport | null>(null)
const paymentTraceData = ref<PaymentTraceData | null>(null)
const paymentValidationReport = ref<PaymentValidationReport | null>(null)
const logisticsTraceData = ref<LogisticsTraceData | null>(null)
const logisticsValidationReport = ref<LogisticsValidationReport | null>(null)
const afterSaleTraceData = ref<AfterSaleTraceData | null>(null)
const afterSaleValidationReport = ref<AfterSaleValidationReport | null>(null)
const afterSaleTraceList = ref<AfterSaleTraceData[]>([])
const afterSaleTraceIndex = ref(0)
const afterSaleValidateResults = ref<AfterSaleValidateResult[]>([])
const cancelOrderValidateResults = ref<AfterSaleValidateResult[]>([])
const afterSaleApplyDisabled = ref(false)
const cancelOrderDisabled = ref(false)
const saveBtnDisabled = ref(false)
const payBtnDisabled = ref(false)
const shipBtnDisabled = ref(false)
const logisticsNoError = ref('')
const batchShipProgress = ref(0)
const batchShipErrors = ref<Array<{ row: number; reason: string }>>([])
const batchShipBtnDisabled = ref(false)

const hasFinancePermission = computed(() => {
  const role = userStore.userInfo?.role
  return role === '1' || role === '2'
})

const editFormRef = ref<FormInstance>()
const editForm = reactive<Partial<Order>>({
  id: 0,
  orderNo: '',
  status: 0,
  remark: '',
  receiverName: '',
  receiverPhone: '',
  receiverProvince: '',
  receiverCity: '',
  receiverDistrict: '',
  receiverAddress: '',
})

const editRules: FormRules = {
  receiverName: [{ required: true, message: '请输入收货人姓名', trigger: 'blur' }],
  receiverPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  receiverProvince: [{ required: true, message: '请输入省份', trigger: 'blur' }],
  receiverCity: [{ required: true, message: '请输入城市', trigger: 'blur' }],
  receiverDistrict: [{ required: true, message: '请输入区县', trigger: 'blur' }],
  receiverAddress: [{ required: true, message: '请输入详细地址', trigger: 'blur' }],
}

const shipForm = reactive({
  logisticsProviderId: undefined as number | undefined,
  logisticsProviderName: '',
  logisticsCompany: '',
  logisticsNo: '',
  freightAmount: undefined as number | undefined,
  packageCount: 1,
  packageWeight: undefined as number | undefined,
  insuranceAmount: undefined as number | undefined,
  remark: '',
})

const batchShipForm = reactive({
  logisticsProviderId: undefined as number | undefined,
  pasteData: '',
})

const afterSaleApplyForm = reactive({
  orderId: '',
  type: undefined as number | undefined,
  amount: undefined as number | undefined,
  reason: '',
})

const cancelOrderForm = reactive({
  orderId: '',
  cancelScene: undefined as number | undefined,
  reason: '',
})

const payStatusForm = reactive<{
  orderId: number
  flowId: number
  payType: number
  payAmount: number
  payStatus: number
  payScenario: number
  transactionId: string
  remark: string
}>({
  orderId: 0,
  flowId: 0,
  payType: 1,
  payAmount: 0,
  payStatus: 1,
  payScenario: 1,
  transactionId: '',
  remark: '',
})

const canEditShipping = computed(() => (editForm.status || 0) < OrderStatus.SHIPPED)
const canEditRemark = computed(() => {
  const status = editForm.status || 0
  return status !== OrderStatus.COMPLETED && status !== OrderStatus.CANCELLED
})

const fetchOrderList = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      orderNo: searchForm.orderNo || undefined,
      payType: searchForm.payType,
      status: searchForm.status,
      startTime: searchForm.dateRange?.[0],
      endTime: searchForm.dateRange?.[1],
      minAmount: searchForm.minAmount,
      maxAmount: searchForm.maxAmount,
      payStatus: searchForm.payStatus,
      reconcileStatus: searchForm.reconcileStatus,
      riskFlag: searchForm.riskFlag,
      isOverdue: searchForm.isOverdue,
      logisticsStatus: searchForm.logisticsStatus,
      logisticsProviderId: searchForm.logisticsProviderId,
      isLogisticsAbnormal: searchForm.isLogisticsAbnormal,
      startShippedAt: searchForm.shippedDateRange?.[0],
      endShippedAt: searchForm.shippedDateRange?.[1],
      afterSaleStatus: searchForm.afterSaleStatus,
      refundStatus: searchForm.refundStatus,
      terminateType: searchForm.terminateType,
      isException: searchForm.isException,
    }

    const res = await getOrderList(params)
    const data = res.data as unknown as PageResult<Order>
    orderList.value = data.list
    pagination.total = data.total
  } catch (error) {
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  fetchOrderList()
}

const handleReset = () => {
  searchForm.orderNo = ''
  searchForm.payType = undefined
  searchForm.status = undefined
  searchForm.dateRange = []
  searchForm.minAmount = undefined
  searchForm.maxAmount = undefined
  searchForm.payStatus = undefined
  searchForm.reconcileStatus = undefined
  searchForm.riskFlag = undefined
  searchForm.isOverdue = undefined
  searchForm.logisticsStatus = undefined
  searchForm.logisticsProviderId = undefined
  searchForm.isLogisticsAbnormal = undefined
  searchForm.shippedDateRange = []
  searchForm.afterSaleStatus = undefined
  searchForm.refundStatus = undefined
  searchForm.terminateType = undefined
  searchForm.isException = undefined
  pagination.pageNum = 1
  fetchOrderList()
}

const handleSelectionChange = (selection: Order[]) => {
  selectedIds.value = selection.map(item => item.id)
}

const handleRowClick = (row: Order) => {
  handleView(row)
}

const handleView = async (row: Order) => {
  try {
    const res = await getOrderDetailWithItems(row.id)
    currentOrder.value = res.data.order
    currentOrderItems.value = res.data.items
    detailVisible.value = true
  } catch (error) {
    ElMessage.error('获取订单详情失败')
  }
}

const handleEdit = (row: Order | null) => {
  if (!row) return
  if (row.status >= OrderStatus.SHIPPED) {
    ElMessage.warning('订单已发货及后续状态禁止修改核心收货信息')
  }
  editForm.id = row.id
  editForm.orderNo = row.orderNo
  editForm.status = row.status
  editForm.remark = row.remark || ''
  editForm.receiverName = row.receiverName
  editForm.receiverPhone = row.receiverPhone
  editForm.receiverProvince = row.receiverProvince
  editForm.receiverCity = row.receiverCity
  editForm.receiverDistrict = row.receiverDistrict
  editForm.receiverAddress = row.receiverAddress
  detailVisible.value = false
  editVisible.value = true
}

const handleSaveEdit = async () => {
  if (!editFormRef.value) return

  await editFormRef.value.validate(async (valid) => {
    if (!valid) return

    saveBtnDisabled.value = true
    try {
      const updateData: OrderUpdateData = {
        remark: editForm.remark,
        receiverName: editForm.receiverName,
        receiverPhone: editForm.receiverPhone,
        receiverProvince: editForm.receiverProvince,
        receiverCity: editForm.receiverCity,
        receiverDistrict: editForm.receiverDistrict,
        receiverAddress: editForm.receiverAddress,
      }

      const res = await updateOrder(editForm.id!, updateData)

      if (!res.data.success) {
        ElMessage.error(res.data.error || '保存失败')
        return
      }

      ElMessage.success('保存成功')
      editVisible.value = false
      fetchOrderList()
    } catch (error) {
      ElMessage.error('保存失败')
    } finally {
      setTimeout(() => {
        saveBtnDisabled.value = false
      }, 300)
    }
  })
}

const handleTrace = async (row: Order) => {
  try {
    const [traceRes, validateRes] = await Promise.all([
      getOrderTrace(row.id),
      validateOrderData(row.id),
    ])
    traceData.value = traceRes.data
    validationReport.value = validateRes.data
    activeTab.value = 'basic'
    traceVisible.value = true
  } catch (error) {
    ElMessage.error('获取溯源信息失败')
  }
}

const handleAction = (cmd: string, row: Order) => {
  switch (cmd) {
    case 'ship':
      currentOrder.value = row
      shipForm.logisticsProviderId = undefined
      shipForm.logisticsProviderName = ''
      shipForm.logisticsCompany = ''
      shipForm.logisticsNo = ''
      shipForm.freightAmount = undefined
      shipForm.packageCount = 1
      shipForm.packageWeight = undefined
      shipForm.insuranceAmount = undefined
      shipForm.remark = ''
      logisticsNoError.value = ''
      shipVisible.value = true
      break
    case 'updateLogistics':
      handleLogisticsStatusUpdate(row)
      break
    case 'applyAfterSale':
      handleApplyAfterSale(row)
      break
    case 'cancelOrder':
      handleCancelOrder(row)
      break
    case 'complete':
      handleComplete(row)
      break
    case 'cancel':
      handleCancel(row)
      break
    case 'updatePayStatus':
      handleUpdatePayStatusDialog(row)
      break
  }
}

const loadLogisticsProviders = async () => {
  try {
    const res = await getLogisticsProviderList()
    logisticsProviderList.value = res.data
  } catch (error) {
    ElMessage.error('获取物流服务商列表失败')
  }
}

const handleProviderChange = (providerId: number) => {
  const provider = logisticsProviderList.value.find(p => p.id === providerId)
  if (provider) {
    shipForm.logisticsProviderName = provider.providerName
    if (!shipForm.logisticsCompany) {
      shipForm.logisticsCompany = provider.providerName
    }
  }
}

const handleLogisticsNoBlur = async () => {
  if (!shipForm.logisticsNo) {
    logisticsNoError.value = ''
    return
  }
  try {
    const res = await validateLogisticsNoFormat({
      logisticsNo: shipForm.logisticsNo,
      providerId: shipForm.logisticsProviderId,
    })
    if (!res.data.valid) {
      logisticsNoError.value = res.data.errorMessage || '物流单号格式不正确'
    } else {
      logisticsNoError.value = ''
    }
  } catch (error) {
    logisticsNoError.value = ''
  }
}

const handleCopyLogisticsNo = async (logisticsNo: string) => {
  try {
    await navigator.clipboard.writeText(logisticsNo)
    ElMessage.success('物流单号已复制')
  } catch (error) {
    ElMessage.warning('复制失败，请手动复制')
  }
}

const handleShip = async () => {
  if (!shipForm.logisticsProviderId) {
    ElMessage.warning('请选择物流服务商')
    return
  }
  if (!shipForm.logisticsNo) {
    ElMessage.warning('请填写物流单号')
    return
  }
  if (logisticsNoError.value) {
    ElMessage.warning('物流单号格式不正确，请检查')
    return
  }

  shipBtnDisabled.value = true
  try {
    const verifyData = {
      orderId: currentOrder.value!.id,
      logisticsProviderId: shipForm.logisticsProviderId,
      logisticsNo: shipForm.logisticsNo,
      logisticsCompany: shipForm.logisticsCompany,
      receiverName: currentOrder.value?.receiverName,
      receiverPhone: currentOrder.value?.receiverPhone,
      receiverProvince: currentOrder.value?.receiverProvince,
      receiverCity: currentOrder.value?.receiverCity,
      receiverDistrict: currentOrder.value?.receiverDistrict,
      receiverAddress: currentOrder.value?.receiverAddress,
    }
    const verifyRes = await verifyShipping(verifyData)
    const errors = verifyRes.data.filter((r: any) => !r.valid)
    if (errors.length > 0) {
      ElMessage.warning(`发货核验不通过：${errors.map((e: any) => e.errorMessage).join('；')}`)
      return
    }

    const shipData: ShipOrderData = {
      orderId: currentOrder.value!.id,
      logisticsProviderId: shipForm.logisticsProviderId,
      logisticsProviderName: shipForm.logisticsProviderName,
      logisticsNo: shipForm.logisticsNo,
      logisticsCompany: shipForm.logisticsCompany || shipForm.logisticsProviderName,
      freightAmount: shipForm.freightAmount,
      packageCount: shipForm.packageCount,
      packageWeight: shipForm.packageWeight,
      insuranceAmount: shipForm.insuranceAmount,
      remark: shipForm.remark,
      operatorId: userStore.userInfo?.id,
      operatorName: userStore.userInfo?.username,
    }
    const res = await shipOrder(shipData)
    if (!res.data.success) {
      ElMessage.error(res.data.errorMessage || '发货失败')
      return
    }
    ElMessage.success('发货成功')
    shipVisible.value = false
    fetchOrderList()
  } catch (error) {
    ElMessage.error('发货失败')
  } finally {
    setTimeout(() => {
      shipBtnDisabled.value = false
    }, 300)
  }
}

const handleLogisticsTrace = async (row: Order) => {
  try {
    const [traceRes, validateRes] = await Promise.all([
      getLogisticsTraceByOrderId(row.id),
      validateLogisticsData(row.id),
    ])
    logisticsTraceData.value = traceRes.data
    logisticsValidationReport.value = validateRes.data
    logisticsTraceTab.value = 'shipment'
    logisticsTraceVisible.value = true
  } catch (error) {
    ElMessage.error('获取物流溯源信息失败')
  }
}

const handleLogisticsStatusUpdate = async (row: Order) => {
  try {
    const { value: status } = await ElMessageBox.prompt(
      `请输入物流状态（0-待发货 1-已揽收 2-运输中 3-派送中 4-已签收 5-签收异常 6-已退回）`,
      '更新物流状态',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputValidator: (value) => {
          const num = parseInt(value)
          if (isNaN(num) || num < 0 || num > 6) {
            return '请输入0-6之间的数字'
          }
          return true
        },
        type: 'warning',
      }
    )
    let description: string | undefined
    try {
      const descRes = await ElMessageBox.prompt(
        '请输入轨迹描述（可选）',
        '轨迹描述',
        {
          confirmButtonText: '确认',
          cancelButtonText: '跳过',
          inputPattern: /.*/,
          type: 'info',
        }
      )
      description = (descRes as any).value
    } catch (e) {
      description = undefined
    }

    const res = await updateLogisticsStatus({
      orderId: row.id,
      logisticsStatus: parseInt(status),
      description: description as string | undefined,
      operatorId: userStore.userInfo?.id,
      operatorName: userStore.userInfo?.username,
    })
    if (!res.data.success) {
      ElMessage.error(res.data.errorMessage || '更新失败')
      return
    }
    ElMessage.success('物流状态更新成功')
    fetchOrderList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('更新失败')
    }
  }
}

const handleBatchShip = () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择订单')
    return
  }
  batchShipForm.logisticsProviderId = undefined
  batchShipForm.pasteData = ''
  batchShipProgress.value = 0
  batchShipErrors.value = []
  batchShipVisible.value = true
}

const handleBatchFileChange = (file: any) => {
  batchShipProgress.value = 30
  setTimeout(() => {
    batchShipProgress.value = 60
  }, 500)
  setTimeout(() => {
    batchShipProgress.value = 100
    ElMessage.info('文件解析完成，请点击确认批量发货')
  }, 1000)
}

const handleBatchShipConfirm = async () => {
  if (!batchShipForm.logisticsProviderId) {
    ElMessage.warning('请选择物流服务商')
    return
  }
  const provider = logisticsProviderList.value.find(p => p.id === batchShipForm.logisticsProviderId)
  if (!provider) {
    ElMessage.warning('物流服务商不存在')
    return
  }

  batchShipBtnDisabled.value = true
  try {
    let items: any[] = []
    if (batchShipForm.pasteData) {
      const lines = batchShipForm.pasteData.trim().split('\n')
      lines.forEach((line, index) => {
        const parts = line.split('\t').map((s: string) => s.trim())
        if (parts.length >= 2 && parts[0] && parts[1]) {
          const order = orderList.value.find(o => o.orderNo === parts[0])
          if (order) {
            items.push({
              orderId: order.id,
              logisticsProviderId: batchShipForm.logisticsProviderId,
              logisticsNo: parts[1],
              logisticsCompany: parts[2] || provider.providerName,
            })
          } else {
            batchShipErrors.value.push({ row: index + 1, reason: `订单编号${parts[0]}不存在` })
          }
        }
      })
    }

    if (items.length === 0 && selectedIds.value.length > 0) {
      items = selectedIds.value.map(id => ({
        orderId: id,
        logisticsProviderId: batchShipForm.logisticsProviderId,
        logisticsNo: '',
        logisticsCompany: provider.providerName,
      }))
    }

    if (items.length === 0) {
      ElMessage.warning('没有有效的发货数据')
      return
    }

    const res = await batchShipOrder(items)
    const resData = res.data as any
    if (resData.errors && resData.errors.length > 0) {
      batchShipErrors.value = resData.errors
    }
    ElMessage.success(`批量发货完成，成功 ${res.data.successCount} 条，失败 ${res.data.failCount} 条`)
    if (res.data.successCount > 0) {
      batchShipVisible.value = false
      selectedIds.value = []
      fetchOrderList()
    }
  } catch (error) {
    ElMessage.error('批量发货失败')
  } finally {
    setTimeout(() => {
      batchShipBtnDisabled.value = false
    }, 300)
  }
}

const handleBatchUpdateAbnormal = async () => {
  if (selectedIds.value.length === 0) return
  try {
    const { value: flag } = await ElMessageBox.prompt(
      `请输入异常状态（0-正常 1-异常）`,
      '批量更新物流异常',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputValidator: (value) => {
          const num = parseInt(value)
          if (isNaN(num) || (num !== 0 && num !== 1)) {
            return '请输入0或1'
          }
          return true
        },
        type: 'warning',
      }
    )
    const params: any = {
      ids: selectedIds.value,
      pageNum: 1,
      pageSize: 9999,
      abnormalFlag: parseInt(flag),
    }
    const res = await batchUpdateAbnormalStatus(params)
    ElMessage.success(`批量更新完成，成功 ${res.data.successCount} 条，失败 ${res.data.failCount} 条`)
    selectedIds.value = []
    fetchOrderList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量更新失败')
    }
  }
}

const handleBatchResendNotification = async () => {
  if (selectedIds.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确定要向选中的 ${selectedIds.value.length} 条订单补发物流通知吗？`,
      '批量补发通知',
      { type: 'warning' }
    )
    const params: any = {
      ids: selectedIds.value,
      pageNum: 1,
      pageSize: 9999,
    }
    const res = await batchResendLogisticsNotification(params)
    ElMessage.success(`批量补发完成，成功 ${res.data.successCount} 条，失败 ${res.data.failCount} 条`)
    selectedIds.value = []
    fetchOrderList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量补发失败')
    }
  }
}

const handleComplete = async (row: Order) => {
  try {
    await ElMessageBox.confirm('确定要将此订单标记为已完成吗？', '确认完成', {
      type: 'warning',
    })
    const res = await completeOrder(row.id)
    if (!res.data.success) {
      ElMessage.error(res.data.error || '操作失败')
      return
    }
    ElMessage.success('订单已完成')
    fetchOrderList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const handleCancel = async (row: Order) => {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入取消原因', '取消订单', {
      confirmButtonText: '确认取消',
      cancelButtonText: '返回',
      inputPlaceholder: '请输入取消原因',
      type: 'warning',
    })
    const res = await cancelOrder(row.id, reason)
    if (!res.data.success) {
      ElMessage.error(res.data.error || '取消失败')
      return
    }
    ElMessage.success('订单已取消')
    fetchOrderList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消失败')
    }
  }
}

const handleBatchRemind = async () => {
  if (selectedIds.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确定要向选中的 ${selectedIds.value.length} 条订单发送支付提醒吗？`,
      '批量提醒',
      { type: 'warning' }
    )
    const res = await batchRemind(selectedIds.value)
    ElMessage.success(`批量提醒完成，成功 ${res.data.success} 条，失败 ${res.data.failed} 条`)
    selectedIds.value = []
    fetchOrderList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量提醒失败')
    }
  }
}

const handleBatchMarkException = async () => {
  if (selectedIds.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确定要将选中的 ${selectedIds.value.length} 条订单标记为异常吗？`,
      '批量标记',
      { type: 'warning' }
    )
    const res = await batchMarkException(selectedIds.value)
    ElMessage.success(`批量标记完成，成功 ${res.data.success} 条，失败 ${res.data.failed} 条`)
    selectedIds.value = []
    fetchOrderList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量标记失败')
    }
  }
}

const handleBatchArchive = async () => {
  if (selectedIds.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确定要归档选中的 ${selectedIds.value.length} 条订单吗？归档后订单将从默认列表中隐藏。`,
      '批量归档',
      { type: 'warning' }
    )
    const res = await batchArchive(selectedIds.value)
    ElMessage.success(`批量归档完成，成功 ${res.data.success} 条，失败 ${res.data.failed} 条`)
    selectedIds.value = []
    fetchOrderList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量归档失败')
    }
  }
}

const handleUpdatePayStatusDialog = (row: Order) => {
  currentOrder.value = row
  payStatusForm.orderId = row.id
  payStatusForm.flowId = (row as any).paymentFlow?.id || 0
  payStatusForm.payType = row.payType || 1
  payStatusForm.payAmount = row.payAmount || (row as any).orderAmount || 0
  payStatusForm.payStatus = 1
  payStatusForm.payScenario = 1
  payStatusForm.transactionId = ''
  payStatusForm.remark = ''
  payStatusVisible.value = true
}

const handlePayStatusDialogClose = () => {
  payBtnDisabled.value = false
}

const handleUpdatePayStatus = async () => {
  if (!payStatusForm.orderId) return
  try {
    const verifyData: PaymentVerifyData = {
      flowNo: (currentOrder.value as any).paymentFlow?.flowNo || '',
      orderId: payStatusForm.orderId,
      orderNo: currentOrder.value?.orderNo || '',
      userId: userStore.userInfo?.id || 0,
      payAmount: payStatusForm.payAmount,
      payType: payStatusForm.payType,
      transactionId: payStatusForm.transactionId || undefined,
      payScenario: payStatusForm.payScenario as any,
    }
    const verifyRes = await verifyPayment(verifyData)
    if (!verifyRes.data.valid) {
      ElMessage.warning(`支付核验不通过：${verifyRes.data.errorMessage}`)
      return
    }

    payBtnDisabled.value = true
    const syncRes = await syncPaymentStatus(payStatusForm.flowId, {
      payStatus: payStatusForm.payStatus,
      payScenario: payStatusForm.payScenario,
    })
    if (!syncRes.data.success) {
      ElMessage.error(syncRes.data.errorMessage || '支付状态更新失败')
      return
    }
    ElMessage.success('支付状态更新成功')
    payStatusVisible.value = false
    fetchOrderList()
  } catch (error) {
    ElMessage.error('支付状态更新失败')
  } finally {
    setTimeout(() => {
      payBtnDisabled.value = false
    }, 300)
  }
}

const handlePaymentTrace = async (row: Order) => {
  try {
    const [traceRes, validateRes] = await Promise.all([
      getPaymentTraceByOrderId(row.id),
      validatePaymentData(row.id),
    ])
    paymentTraceData.value = traceRes.data
    paymentValidationReport.value = validateRes.data
    paymentTraceTab.value = 'flow'
    paymentTraceVisible.value = true
  } catch (error) {
    ElMessage.error('获取支付溯源信息失败')
  }
}

const handleApplyAfterSale = async (row: Order) => {
  currentOrder.value = row
  afterSaleApplyForm.orderId = row.orderNo
  afterSaleApplyForm.type = undefined
  afterSaleApplyForm.amount = row.payAmount
  afterSaleApplyForm.reason = ''
  afterSaleValidateResults.value = []
  afterSaleApplyDisabled.value = false

  try {
    const verifyData: AfterSaleApplyData = {
      orderId: row.id,
      userId: (row as any).userId,
      type: 1,
      amount: row.payAmount,
    }
    const verifyRes = await verifyAfterSaleApply(verifyData)
    const results = verifyRes.data
    afterSaleValidateResults.value = results
    const hasInvalid = results.some((r: AfterSaleValidateResult) => !r.valid)
    afterSaleApplyDisabled.value = hasInvalid
  } catch (error) {
    afterSaleValidateResults.value = []
    afterSaleApplyDisabled.value = false
  }

  afterSaleApplyVisible.value = true
}

const handleAfterSaleApplyConfirm = async () => {
  if (!afterSaleApplyForm.type) {
    ElMessage.warning('请选择售后类型')
    return
  }
  try {
    const data: AfterSaleApplyData = {
      orderId: currentOrder.value!.id,
      userId: (currentOrder.value as any).userId,
      type: afterSaleApplyForm.type,
      amount: afterSaleApplyForm.amount,
      reason: afterSaleApplyForm.reason,
    }
    const res = await applyAfterSale(data)
    if (!res.data) {
      ElMessage.error('申请售后失败')
      return
    }
    ElMessage.success('售后申请已提交')
    afterSaleApplyVisible.value = false
    fetchOrderList()
  } catch (error) {
    ElMessage.error('申请售后失败')
  }
}

const handleCancelOrder = async (row: Order) => {
  currentOrder.value = row
  cancelOrderForm.orderId = row.orderNo
  cancelOrderForm.cancelScene = undefined
  cancelOrderForm.reason = ''
  cancelOrderValidateResults.value = []
  cancelOrderDisabled.value = false

  try {
    const verifyData = {
      orderId: row.id,
      cancelScene: 1,
    }
    const verifyRes = await verifyOrderTerminate(verifyData)
    const results = verifyRes.data
    cancelOrderValidateResults.value = results
    const hasInvalid = results.some((r: AfterSaleValidateResult) => !r.valid)
    cancelOrderDisabled.value = hasInvalid
  } catch (error) {
    cancelOrderValidateResults.value = []
    cancelOrderDisabled.value = false
  }

  cancelOrderVisible.value = true
}

const handleCancelOrderConfirm = async () => {
  if (!cancelOrderForm.cancelScene) {
    ElMessage.warning('请选择取消场景')
    return
  }
  try {
    const res = await cancelOrderApi({
      orderId: currentOrder.value!.id,
      cancelScene: cancelOrderForm.cancelScene,
      reason: cancelOrderForm.reason,
    })
    if (!res.data?.success) {
      ElMessage.error(res.data?.error || '取消订单失败')
      return
    }
    ElMessage.success('订单已取消')
    cancelOrderVisible.value = false
    fetchOrderList()
  } catch (error) {
    ElMessage.error('取消订单失败')
  }
}

const handleAfterSaleTrace = async (row: Order) => {
  try {
    const traceRes = await getAfterSaleTraceByOrderId(row.id)
    const traceDataItem = traceRes.data
    afterSaleTraceList.value = traceDataItem ? [traceDataItem] : []
    afterSaleTraceIndex.value = 0
    afterSaleTraceData.value = traceDataItem

    if (traceDataItem?.afterSale) {
      try {
        const validateRes = await validateAfterSaleData(traceDataItem.afterSale.id)
        afterSaleValidationReport.value = validateRes.data
      } catch {
        afterSaleValidationReport.value = null
      }
    } else {
      afterSaleValidationReport.value = null
    }

    afterSaleTraceTab.value = 'afterSale'
    afterSaleTraceVisible.value = true
  } catch (error) {
    ElMessage.error('获取售后溯源信息失败')
  }
}

const handleAfterSaleTracePrev = () => {
  if (afterSaleTraceIndex.value > 0) {
    afterSaleTraceIndex.value--
    afterSaleTraceData.value = afterSaleTraceList.value[afterSaleTraceIndex.value]
  }
}

const handleAfterSaleTraceNext = () => {
  if (afterSaleTraceIndex.value < afterSaleTraceList.value.length - 1) {
    afterSaleTraceIndex.value++
    afterSaleTraceData.value = afterSaleTraceList.value[afterSaleTraceIndex.value]
  }
}

const handleBatchAuditAfterSale = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择订单')
    return
  }
  try {
    const { value: status } = await ElMessageBox.prompt(
      '请输入审核状态（1-审核通过 4-审核拒绝）',
      '批量审核售后',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputValidator: (value) => {
          const num = parseInt(value)
          if (isNaN(num) || (num !== 1 && num !== 4)) {
            return '请输入1或4'
          }
          return true
        },
        type: 'warning',
      }
    )
    await ElMessageBox.confirm(
      `确定要对选中的 ${selectedIds.value.length} 条订单进行售后审核吗？`,
      '批量审核',
      { type: 'warning' }
    )
    const res = await batchAuditAfterSale({
      ids: selectedIds.value,
      pageNum: 1,
      pageSize: 9999,
      status: parseInt(status),
    })
    ElMessage.success(`批量审核完成，成功 ${res.data.successCount} 条，失败 ${res.data.failCount} 条`)
    selectedIds.value = []
    fetchOrderList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量审核失败')
    }
  }
}

const handleBatchCloseInvalid = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择订单')
    return
  }
  try {
    const { value: reason } = await ElMessageBox.prompt(
      '请输入关闭原因',
      '批量关闭无效工单',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入关闭原因',
        type: 'warning',
      }
    )
    const res = await batchCloseInvalidAfterSale({
      ids: selectedIds.value,
      reason,
    })
    ElMessage.success(`批量关闭完成，成功 ${res.data.successCount} 条，失败 ${res.data.failCount} 条`)
    selectedIds.value = []
    fetchOrderList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量关闭失败')
    }
  }
}

const handleBatchArchiveTerminated = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择订单')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定要归档选中的 ${selectedIds.value.length} 条终止订单吗？`,
      '批量归档终止订单',
      { type: 'warning' }
    )
    const res = await batchArchiveTerminated({
      ids: selectedIds.value,
      pageNum: 1,
      pageSize: 9999,
    })
    ElMessage.success(`批量归档完成，成功 ${res.data.successCount} 条，失败 ${res.data.failCount} 条`)
    selectedIds.value = []
    fetchOrderList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量归档失败')
    }
  }
}

const handleBatchVerifyPayment = async () => {
  if (selectedIds.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确定要对选中的 ${selectedIds.value.length} 条订单发起支付核验吗？`,
      '批量核验',
      { type: 'warning' }
    )
    const params = {
      ids: selectedIds.value,
      pageNum: 1,
      pageSize: 9999,
    } as PaymentQueryParams
    const res = await batchVerifyPayment(params)
    ElMessage.success(`批量核验完成，成功 ${res.data.successCount} 条，失败 ${res.data.failCount} 条`)
    selectedIds.value = []
    fetchOrderList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量核验失败')
    }
  }
}

const handleBatchResetExpire = async () => {
  if (selectedIds.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确定要重置选中的 ${selectedIds.value.length} 条订单的支付时效吗？`,
      '批量重置时效',
      { type: 'warning' }
    )
    const params = {
      ids: selectedIds.value,
      pageNum: 1,
      pageSize: 9999,
    } as PaymentQueryParams
    const res = await batchResetExpireTime(params)
    ElMessage.success(`批量重置完成，成功 ${res.data.successCount} 条，失败 ${res.data.failCount} 条`)
    selectedIds.value = []
    fetchOrderList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量重置失败')
    }
  }
}

const handleBatchMarkReconcile = async () => {
  if (selectedIds.value.length === 0) return
  try {
    const { value: status } = await ElMessageBox.prompt(
      `请输入对账状态（0-待对账 1-对账中 2-对账通过 3-对账异常）`,
      '批量标记对账',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputValidator: (value) => {
          const num = parseInt(value)
          if (isNaN(num) || num < 0 || num > 3) {
            return '请输入0-3之间的数字'
          }
          return true
        },
        type: 'warning',
      }
    )
    const params = {
      ids: selectedIds.value,
      pageNum: 1,
      pageSize: 9999,
      reconcileStatus: parseInt(status),
    } as PaymentQueryParams & { reconcileStatus: number }
    const res = await batchMarkReconcile(params)
    ElMessage.success(`批量标记完成，成功 ${res.data.successCount} 条，失败 ${res.data.failCount} 条`)
    selectedIds.value = []
    fetchOrderList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量标记失败')
    }
  }
}

onMounted(() => {
  fetchOrderList()
  loadLogisticsProviders()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.page-container {
  padding: $spacing-base;
}

.search-bar {
  background: #fff;
  padding: $spacing-base;
  border-radius: $radius-base;
  margin-bottom: $spacing-base;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.order-table-card {
  border-radius: $radius-base;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: $spacing-base 0;
}

.order-no-cell {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.receiver-info {
  line-height: 1.5;
}

.shake-animation {
  animation: shake 0.5s ease-in-out;
  color: #f56c6c !important;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.dialog-slide-down {
  .el-dialog {
    animation: slideDownIn 0.3s ease-out;
  }

  .el-dialog.is-dialog-draggable {
    animation: slideDownIn 0.3s ease-out;
  }

  &.v-modal {
    animation: fadeIn 0.3s ease-out;
  }
}

@keyframes slideDownIn {
  0% {
    transform: translateY(-100%);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.dialog-slide-down.v-leave-active {
  .el-dialog {
    animation: slideDownOut 0.3s ease-in;
  }

  &.v-modal {
    animation: fadeOut 0.3s ease-in;
  }
}

@keyframes slideDownOut {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(100%);
    opacity: 0;
  }
}

@keyframes fadeOut {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.trace-tab-content {
  padding: 16px 0;
  max-height: 500px;
  overflow-y: auto;
}

.validation-report-card {
  padding: 16px;
  border-radius: 8px;
  border: 1px solid;

  &.passed {
    background: #f0f9eb;
    border-color: #e1f3d8;
  }

  &.failed {
    background: #fef0f0;
    border-color: #fde2e2;
  }
}

.validate-result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-top: 8px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
  border-left: 3px solid #909399;

  &.success {
    border-left-color: #67c23a;
  }

  &:not(.success) {
    border-left-color: #f56c6c;
  }
}

.logistics-no-text {
  cursor: pointer;
  color: #409eff;
  text-decoration: underline;

  &:hover {
    color: #66b1ff;
  }
}

.logistics-no-error {
  :deep(.el-input__wrapper) {
    border: 1px solid #f56c6c !important;
    box-shadow: 0 0 0 1px #f56c6c inset !important;
  }
}

.btn-click-feedback {
  transition: all 0.1s ease;

  &:active {
    transform: translateY(2px);
    filter: brightness(0.95);
  }
}

.btn-shake {
  animation: btnShake 0.4s ease-in-out;
}

@keyframes btnShake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
  20%, 40%, 60%, 80% { transform: translateX(3px); }
}

.logistics-timeline {
  position: relative;
  padding-left: 8px;
}

.track-item {
  position: relative;
  padding-left: 28px;
  padding-bottom: 20px;

  &:last-child {
    padding-bottom: 0;

    .timeline-line {
      display: none;
    }
  }
}

.timeline-dot {
  position: absolute;
  left: 0;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #dcdfe6;
  border: 2px solid #fff;
  z-index: 1;
}

.timeline-line {
  position: absolute;
  left: 5px;
  top: 16px;
  bottom: 0;
  width: 2px;
  background: #ebeef5;
}

.track-content {
  padding: 4px 0;
}

.track-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.track-status {
  font-weight: 600;
  font-size: 14px;
}

.track-time {
  font-size: 12px;
  color: #909399;
}

.track-description {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.track-location {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.track-abnormal {
  font-size: 12px;
  color: #f56c6c;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.track-operator {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.track-item-normal {
  .timeline-dot {
    background: #67c23a;
    box-shadow: 0 0 0 2px #e1f3d8;
  }

  .track-status {
    color: #67c23a;
  }
}

.track-item-abnormal {
  .timeline-dot {
    background: #f56c6c;
    box-shadow: 0 0 0 2px #fde2e2;
  }

  .track-status {
    color: #f56c6c;
  }

  .timeline-line {
    background: #fde2e2;
  }
}

.batch-import-progress {
  width: 100%;

  :deep(.el-progress-bar__outer) {
    border-radius: 10px;
    height: 14px;
    background-color: #f0f2f5;
  }

  :deep(.el-progress-bar__inner) {
    border-radius: 10px;
    background: linear-gradient(90deg, #409eff, #67c23a);
  }
}

.batch-upload {
  width: 100%;

  :deep(.el-upload-dragger) {
    width: 100%;
    padding: 20px;
  }
}

.after-sale-restriction {
  padding: 12px;
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 6px;
}

.after-sale-trace-swiper {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.validate-disabled-btn {
  opacity: 0.5;
  cursor: not-allowed;
}

.slide-left {
  animation: slideLeft 0.3s ease;
}

.slide-right {
  animation: slideRight 0.3s ease;
}

@keyframes slideLeft {
  0% { transform: translateX(20px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

@keyframes slideRight {
  0% { transform: translateX(-20px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}
</style>
