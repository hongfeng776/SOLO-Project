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
      <el-button v-if="hasFinancePermission" type="warning" size="small" @click="handleBatchMarkReconcile">
        <el-icon><DocumentChecked /></el-icon> 批量标记对账
      </el-button>
      <el-button type="danger" size="small" @click="handleBatchMarkException">
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
        <el-table-column label="操作" width="260" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="handleView(row as Order)">详情</el-button>
            <el-button link type="primary" @click.stop="handleEdit(row as Order)" :disabled="(row as Order).status >= 2">编辑</el-button>
            <el-button link type="primary" @click.stop="handleTrace(row as Order)">溯源</el-button>
            <el-button link type="primary" @click.stop="handlePaymentTrace(row as Order)">支付溯源</el-button>
            <el-dropdown trigger="click" @command="(cmd) => handleAction(cmd, row as Order)">
              <el-button link type="primary">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="ship" v-if="row.status === 1">发货</el-dropdown-item>
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
      width="500px"
      class="dialog-center-zoom"
      destroy-on-close
    >
      <el-form :model="shipForm" label-width="100px" @submit.prevent>
        <el-form-item label="物流公司" required>
          <el-input v-model="shipForm.logisticsCompany" placeholder="请输入物流公司名称" />
        </el-form-item>
        <el-form-item label="物流单号" required>
          <el-input v-model="shipForm.logisticsNo" placeholder="请输入物流单号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipVisible = false">取消</el-button>
        <el-button type="primary" @click="handleShip">确认发货</el-button>
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
} from '@element-plus/icons-vue'
import {
  getOrderList,
  updateOrder,
  shipOrder,
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
import { OrderStatusMap, PayTypeMap, OrderStatus } from '@/types/business'
import { formatAmount } from '@/utils/amount'
import { formatOrderDateTime } from '@/utils/date'
import type { PageResult } from '@/types/api'
import { useUserStore } from '@/stores/user'

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
  isException: undefined as number | undefined,
})

const detailVisible = ref(false)
const editVisible = ref(false)
const traceVisible = ref(false)
const shipVisible = ref(false)
const payStatusVisible = ref(false)
const paymentTraceVisible = ref(false)
const activeTab = ref('basic')
const paymentTraceTab = ref('flow')

const currentOrder = ref<Order | null>(null)
const currentOrderItems = ref<any[]>([])
const traceData = ref<OrderTraceData | null>(null)
const validationReport = ref<OrderValidationReport | null>(null)
const paymentTraceData = ref<PaymentTraceData | null>(null)
const paymentValidationReport = ref<PaymentValidationReport | null>(null)
const saveBtnDisabled = ref(false)
const payBtnDisabled = ref(false)

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
  logisticsCompany: '',
  logisticsNo: '',
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
      shipForm.logisticsCompany = ''
      shipForm.logisticsNo = ''
      shipVisible.value = true
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

const handleShip = async () => {
  if (!shipForm.logisticsCompany || !shipForm.logisticsNo) {
    ElMessage.warning('请填写物流公司和物流单号')
    return
  }

  try {
    const res = await shipOrder(currentOrder.value!.id, shipForm)
    if (!res.data.success) {
      ElMessage.error(res.data.error || '发货失败')
      return
    }
    ElMessage.success('发货成功')
    shipVisible.value = false
    fetchOrderList()
  } catch (error) {
    ElMessage.error('发货失败')
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
</style>
