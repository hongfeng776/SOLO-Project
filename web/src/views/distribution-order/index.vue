<template>
  <div class="distribution-order-page page-container">
    <transition name="fade-slide" mode="out-in">
      <div key="main">
        <el-card shadow="never" class="statistics-card">
          <div class="statistics-grid">
            <div
              v-for="item in statCards"
              :key="item.key"
              class="stat-card"
              :class="{ active: activeStatTab === item.key }"
              @click="handleStatTabClick(item.key)"
            >
              <div class="stat-card__label">{{ item.label }}</div>
              <div class="stat-card__value" :style="{ color: item.color }">
                {{ item.formatter ? item.formatter(item.value) : item.value }}
              </div>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" style="margin-top: 16px">
          <div class="status-tabs">
            <el-tag
              v-for="tab in statusTabs"
              :key="tab.value"
              :type="tab.type as any || 'info'"
              :effect="activeTab === tab.value ? 'dark' : 'plain'"
              class="status-tab"
              :class="{ active: activeTab === tab.value }"
              @click="handleTabClick(tab.value)"
            >
              {{ tab.label }}
              <span v-if="getTabCount(tab.value) !== undefined" class="tab-count">
                {{ getTabCount(tab.value) }}
              </span>
            </el-tag>
          </div>

          <el-form
            :inline="true"
            :model="queryParams"
            class="search-form"
            @submit.prevent="handleSearch"
          >
            <el-form-item label="订单号">
              <el-input
                v-model="queryParams.orderNo"
                placeholder="请输入订单号"
                clearable
                style="width: 200px"
                maxlength="50"
                show-word-limit
                @input="handleParamChange"
              />
            </el-form-item>
            <el-form-item label="推客ID">
              <el-input
                v-model="queryParams.promoterId"
                placeholder="请输入推客ID"
                clearable
                style="width: 160px"
                @input="handleParamChange"
              />
            </el-form-item>
            <el-form-item label="渠道">
              <el-select
                v-model="queryParams.channelId"
                placeholder="请选择渠道"
                clearable
                filterable
                style="width: 150px"
                @change="handleParamChange"
              >
                <el-option
                  v-for="item in channelOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="商品ID">
              <el-input
                v-model="queryParams.productId"
                placeholder="请输入商品ID/SKU"
                clearable
                style="width: 160px"
                maxlength="100"
                @input="handleParamChange"
              />
            </el-form-item>
            <el-form-item label="订单状态">
              <el-select
                v-model="queryParams.status"
                placeholder="请选择状态"
                clearable
                style="width: 150px"
                @change="handleParamChange"
              >
                <el-option
                  v-for="item in ORDER_STATUS_OPTIONS"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="下单时间">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                :shortcuts="dateShortcuts"
                @change="handleDateChange"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" :loading="loading" @click="handleSearch">
                搜索
              </el-button>
              <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" style="margin-top: 16px">
          <BaseBatchOperation
            :selected-count="selectedIds.length"
            @clear="handleClearSelection"
          >
            <el-button
              type="primary"
              size="small"
              :icon="Edit"
              :disabled="selectedIds.length === 0"
              @click="handleBatchMark"
            >
              批量标记
            </el-button>
            <el-button
              type="warning"
              size="small"
              :icon="DataAnalysis"
              :disabled="selectedIds.length === 0"
              @click="showBatchStatistics"
            >
              统计明细
            </el-button>
            <el-button
              type="info"
              size="small"
              :icon="Checked"
              :disabled="selectedIds.length === 0"
              @click="handleBatchVerify"
            >
              批量核对
            </el-button>
            <el-button
              type="danger"
              size="small"
              :icon="Warning"
              :disabled="selectedIds.length === 0"
              @click="handleBatchConfirmAbnormal"
            >
              批量确认异常
            </el-button>
            <el-button
              type="success"
              size="small"
              :icon="Download"
              :disabled="selectedIds.length === 0"
              @click="handleBatchExport"
            >
              批量导出
            </el-button>
          </BaseBatchOperation>

          <div class="table-toolbar" style="margin-bottom: 12px">
            <div class="table-toolbar__left">
              <el-radio-group v-model="quickFilterType" size="small" @change="(val: any) => handleQuickFilter(val as string)">
                <el-radio-button
                  v-for="opt in DISTRIBUTION_ORDER_ORDER_TYPE_OPTIONS"
                  :key="opt.value"
                  :label="opt.value"
                >
                  {{ opt.label }}
                </el-radio-button>
              </el-radio-group>
            </div>
            <div class="table-toolbar__right">
              <el-button size="small" :icon="Download" @click="handleExportDialog">
                导出数据
              </el-button>
              <el-button size="small" :icon="Refresh" @click="fetchData">刷新</el-button>
            </div>
          </div>

          <div v-loading="loading" class="table-wrapper">
            <el-table
              ref="tableRef"
              :data="dataList"
              border
              stripe
              row-key="id"
              height="600"
              @selection-change="handleSelectionChange"
              :row-class-name="getRowClassName"
              @header-dragend="handleHeaderDragEnd"
            >
              <el-table-column
                type="selection"
                width="50"
                align="center"
                reserve-selection
              />
              <el-table-column type="index" label="序号" width="60" align="center" fixed="left" />
              <el-table-column
                prop="orderNo"
                label="订单号"
                :width="columnWidths.orderNo"
                min-width="160"
                fixed="left"
              >
                <template #default="{ row }">
                  <span class="order-no" @click="copyOrderNo(row.orderNo)">
                    {{ row.orderNo }}
                    <el-icon class="copy-icon"><DocumentCopy /></el-icon>
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="商品信息" :width="columnWidths.productInfo" min-width="220">
                <template #default="{ row }">
                  <div class="product-info">
                    <el-image
                      v-if="row.productImage"
                      :src="row.productImage"
                      fit="cover"
                      style="width: 48px; height: 48px; border-radius: 4px; flex-shrink: 0"
                    />
                    <div class="product-detail">
                      <div class="product-name">{{ row.productName }}</div>
                      <div class="product-sku" v-if="row.productSku">
                        SKU: {{ row.productSku }}
                      </div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column
                prop="quantity"
                label="数量"
                :width="columnWidths.quantity"
                align="center"
              />
              <el-table-column
                prop="payAmount"
                label="实付金额"
                :width="columnWidths.payAmount"
                align="right"
              >
                <template #default="{ row }">
                  <span class="amount">¥{{ formatMoney(row.payAmount) }}</span>
                </template>
              </el-table-column>
              <el-table-column
                prop="commissionAmount"
                label="佣金"
                :width="columnWidths.commission"
                align="right"
              >
                <template #default="{ row }">
                  <span class="commission">¥{{ formatMoney(row.commissionAmount) }}</span>
                </template>
              </el-table-column>
              <el-table-column
                prop="channelName"
                label="渠道"
                :width="columnWidths.channel"
                show-overflow-tooltip
              />
              <el-table-column
                label="推客"
                :width="columnWidths.promoter"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  <div class="promoter-info">
                    <span>{{ row.promoterName || '-' }}</span>
                    <span v-if="row.promoterCode" class="promoter-code">
                      ({{ row.promoterCode }})
                    </span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column
                label="订单状态"
                :width="columnWidths.status"
                align="center"
              >
                <template #default="{ row }">
                  <el-tag
                    :type="ORDER_STATUS_MAP[row.status]?.type || 'info'"
                    effect="light"
                  >
                    {{ ORDER_STATUS_MAP[row.status]?.label || row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column
                label="标记"
                :width="columnWidths.tags"
                align="center"
              >
                <template #default="{ row }">
                  <div class="tag-group">
                    <el-tag
                      v-if="row.isAbnormal"
                      type="danger"
                      size="small"
                      effect="dark"
                      class="order-tag"
                      @click="filterByTag('abnormal')"
                    >
                      异常
                    </el-tag>
                    <el-tag
                      v-if="row.isPendingReview"
                      type="warning"
                      size="small"
                      effect="dark"
                      class="order-tag"
                      @click="filterByTag('pendingReview')"
                    >
                      待复核
                    </el-tag>
                    <el-tag
                      v-if="row.isUnsettled"
                      type="primary"
                      size="small"
                      effect="dark"
                      class="order-tag"
                      @click="filterByTag('unsettled')"
                    >
                      未结算
                    </el-tag>
                    <span v-if="!row.isAbnormal && !row.isPendingReview && !row.isUnsettled">-</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column
                prop="remark"
                label="备注"
                :width="columnWidths.remark"
                min-width="160"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  <el-tooltip
                    v-if="row.remark && row.remark.length > 20"
                    :content="row.remark"
                    placement="top"
                  >
                    <span class="remark-text">{{ truncateText(row.remark, 20) }}</span>
                  </el-tooltip>
                  <span v-else>{{ row.remark || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column
                prop="createdAt"
                label="下单时间"
                :width="columnWidths.createdAt"
                min-width="160"
              >
                <template #default="{ row }">
                  {{ formatDateTime(row.createdAt) }}
                </template>
              </el-table-column>
              <el-table-column
                label="操作"
                :width="columnWidths.action"
                fixed="right"
                align="center"
              >
                <template #default="{ row }">
                  <el-button type="primary" link :icon="View" @click="handleDetail(row as DistributionOrderItem)">
                    详情
                  </el-button>
                  <el-button
                    v-if="ORDER_STATUS_TRANSITIONS[row.status]?.length"
                    type="warning"
                    link
                    :icon="Switch"
                    @click="handleStatusChange(row as DistributionOrderItem)"
                  >
                    变更
                  </el-button>
                </template>
              </el-table-column>

              <template #empty>
                <BaseEmpty description="暂无订单数据" />
              </template>
            </el-table>
          </div>

          <div class="table-footer" v-if="!loading">
            <el-button
              class="refresh-btn"
              type="primary"
              plain
              link
              :icon="Refresh"
              @click="fetchData"
            >
              刷新
            </el-button>
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[...PAGE_SIZE_OPTIONS]"
              :total="total"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </el-card>
      </div>
    </transition>

    <BaseDialog
      v-model="exportVisible"
      title="导出订单数据"
      width="600px"
      @confirm="handleExportConfirm"
    >
      <el-form :model="exportForm" label-width="100px">
        <el-form-item label="导出字段">
          <el-checkbox-group v-model="exportForm.fields">
            <el-checkbox
              v-for="opt in DISTRIBUTION_ORDER_EXPORT_FIELD_OPTIONS"
              :key="opt.value"
              :label="opt.value"
            >
              {{ opt.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="排序字段">
          <el-select v-model="exportForm.sortField" placeholder="请选择" style="width: 200px">
            <el-option
              v-for="opt in DISTRIBUTION_ORDER_SORT_FIELD_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="排序方式">
          <el-radio-group v-model="exportForm.sortOrder">
            <el-radio label="DESC">降序</el-radio>
            <el-radio label="ASC">升序</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </BaseDialog>

    <BaseDialog
      v-model="batchMarkVisible"
      title="批量标记订单"
      width="500px"
      @confirm="handleBatchMarkConfirm"
    >
      <el-form :model="batchMarkForm" label-width="100px">
        <el-form-item label="标记备注">
          <el-input
            v-model="batchMarkForm.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入备注信息"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item>
          <div class="batch-info">
            <el-alert
              type="info"
              :closable="false"
              show-icon
              :title="`已选择 ${selectedIds.length} 条订单进行标记`"
            />
          </div>
        </el-form-item>
      </el-form>
    </BaseDialog>

    <BaseDialog
      v-model="batchStatsVisible"
      title="批量统计明细"
      width="700px"
      :show-footer="false"
    >
      <div v-if="batchStatistics" class="batch-stats">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单总数">{{ batchStatistics.totalCount }}</el-descriptions-item>
          <el-descriptions-item label="订单总金额">
            ¥{{ formatMoney(batchStatistics.totalAmount) }}
          </el-descriptions-item>
          <el-descriptions-item label="佣金总额">
            <span class="text-success">¥{{ formatMoney(batchStatistics.totalCommission) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="异常订单数">
            <span class="text-danger">{{ batchStatistics.abnormalCount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="未结算订单数">
            <span class="text-warning">{{ batchStatistics.unsettledCount }}</span>
          </el-descriptions-item>
        </el-descriptions>
        <div class="status-breakdown" style="margin-top: 20px">
          <h4>按状态分布</h4>
          <div class="status-bar-list">
            <div
              v-for="item in batchStatistics.statusBreakdown"
              :key="item.status"
              class="status-bar-item"
            >
              <span class="status-label">
                {{ ORDER_STATUS_MAP[item.status]?.label || item.status }}
              </span>
              <div class="status-bar-wrapper">
                <div
                  class="status-bar"
                  :style="{
                    width: `${(item.count / batchStatistics.totalCount) * 100}%`,
                  }"
                />
              </div>
              <span class="status-count">{{ item.count }} 单</span>
            </div>
          </div>
        </div>
      </div>
    </BaseDialog>

    <BaseDialog
      v-model="detailVisible"
      title="订单详情"
      width="700px"
      :show-footer="false"
    >
      <el-descriptions v-if="detailData" :column="2" border size="small">
        <el-descriptions-item label="订单号" :span="2">
          <span class="copy-text" @click="copyOrderNo(detailData.orderNo)">
            {{ detailData.orderNo }}
            <el-icon class="ml-1"><DocumentCopy /></el-icon>
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="商品名称">{{ detailData.productName }}</el-descriptions-item>
        <el-descriptions-item label="商品SKU">{{ detailData.productSku || '-' }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ detailData.quantity }}</el-descriptions-item>
        <el-descriptions-item label="单价">¥{{ formatMoney(detailData.unitPrice) }}</el-descriptions-item>
        <el-descriptions-item label="商品总价">¥{{ formatMoney(detailData.totalAmount) }}</el-descriptions-item>
        <el-descriptions-item label="实付金额">¥{{ formatMoney(detailData.payAmount) }}</el-descriptions-item>
        <el-descriptions-item label="佣金比例">
          {{ detailData.commissionRate ? (detailData.commissionRate * 100).toFixed(2) + '%' : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="佣金金额">
          <span class="text-success">¥{{ formatMoney(detailData.commissionAmount || 0) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="渠道">{{ detailData.channelName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="推客">
          {{ detailData.promoterName || '-' }}
          <span v-if="detailData.promoterCode" class="promoter-code">
            ({{ detailData.promoterCode }})
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="ORDER_STATUS_MAP[detailData.status]?.type || 'info'">
            {{ ORDER_STATUS_MAP[detailData.status]?.label || detailData.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ formatDateTime(detailData.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ formatDateTime(detailData.payTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发货时间">{{ formatDateTime(detailData.shipTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ formatDateTime(detailData.completeTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="取消时间">{{ formatDateTime(detailData.cancelTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货人">
          {{ detailData.receiverName || '-' }} {{ detailData.receiverPhone || '' }}
        </el-descriptions-item>
        <el-descriptions-item label="收货地址" :span="2">
          {{ detailData.receiverAddress || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="订单备注" :span="2">{{ detailData.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订单标记" :span="2">
          <el-tag v-if="detailData.isAbnormal" type="danger" style="margin-right: 8px">异常</el-tag>
          <el-tag v-if="detailData.isPendingReview" type="warning" style="margin-right: 8px">待复核</el-tag>
          <el-tag v-if="detailData.isUnsettled" type="primary">未结算</el-tag>
          <span v-if="!detailData.isAbnormal && !detailData.isPendingReview && !detailData.isUnsettled">无</span>
        </el-descriptions-item>
        <el-descriptions-item label="状态变更" :span="2">
          <el-button type="primary" link size="small" @click="handleViewChangeLog(detailData)">
            查看变更记录
          </el-button>
        </el-descriptions-item>
      </el-descriptions>
    </BaseDialog>

    <BaseDialog
      v-model="statusChangeVisible"
      title="变更订单状态"
      width="560px"
      @confirm="handleStatusChangeConfirm"
    >
      <el-form :model="statusChangeForm" label-width="100px" v-if="statusChangeForm.order">
        <el-form-item label="当前状态">
          <el-tag :type="ORDER_STATUS_MAP[statusChangeForm.order.status]?.type || 'info'">
            {{ ORDER_STATUS_MAP[statusChangeForm.order.status]?.label || statusChangeForm.order.status }}
          </el-tag>
        </el-form-item>
        <el-form-item label="目标状态" required>
          <el-select v-model="statusChangeForm.toStatus" placeholder="请选择目标状态" style="width: 240px">
            <el-option
              v-for="opt in ORDER_STATUS_TRANSITIONS[statusChangeForm.order.status] || []"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="变更原因" :required="statusChangeRequiresReason">
          <el-select
            v-model="statusChangeForm.reasonType"
            placeholder="请选择原因"
            style="width: 240px; margin-bottom: 8px"
          >
            <el-option
              v-for="opt in ORDER_STATUS_CHANGE_REASON_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-input
            v-model="statusChangeForm.reasonDetail"
            type="textarea"
            :rows="3"
            placeholder="请详细说明变更原因"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item v-if="transitionWarnings.length > 0">
          <div class="transition-warnings">
            <el-alert
              v-for="(warning, index) in transitionWarnings"
              :key="index"
              type="warning"
              :closable="false"
              show-icon
              :title="warning"
              style="margin-bottom: 8px"
            />
          </div>
        </el-form-item>
        <el-form-item v-if="transitionCommissionImpact">
          <el-alert
            type="error"
            :closable="false"
            show-icon
          >
            <template #title>
              <span>此操作将影响佣金结算数据，佣金金额：¥{{ formatMoney(statusChangeForm.order.commissionAmount || 0) }}</span>
            </template>
          </el-alert>
        </el-form-item>
      </el-form>
    </BaseDialog>

    <BaseDialog
      v-model="statusResultVisible"
      title="状态变更结果"
      width="560px"
      :show-footer="false"
    >
      <transition name="result-fade" appear>
        <div v-if="statusChangeResult" class="status-result">
          <el-result
            :icon="statusChangeResult.success ? 'success' : 'error'"
            :title="statusChangeResult.success ? '状态变更成功' : '状态变更失败'"
            :sub-title="statusChangeResult.message"
          >
            <template #extra>
              <div class="result-details" v-if="statusChangeResult.success">
                <el-descriptions :column="1" border size="small">
                  <el-descriptions-item label="原状态">
                    <el-tag :type="ORDER_STATUS_MAP[statusChangeResult.fromStatus]?.type || 'info'" size="small">
                      {{ ORDER_STATUS_MAP[statusChangeResult.fromStatus]?.label }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="新状态">
                    <el-tag :type="ORDER_STATUS_MAP[statusChangeResult.toStatus]?.type || 'info'" size="small">
                      {{ ORDER_STATUS_MAP[statusChangeResult.toStatus]?.label }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="佣金影响" v-if="statusChangeResult.commissionAffected">
                    <span class="text-danger">已影响，变动金额：¥{{ formatMoney(statusChangeResult.commissionChangeAmount) }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="推客数据" v-if="statusChangeResult.promoterSynced">
                    <span class="text-success">已同步更新</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="渠道数据" v-if="statusChangeResult.channelSynced">
                    <span class="text-success">已同步更新</span>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
              <el-button type="primary" @click="statusResultVisible = false" style="margin-top: 16px">确定</el-button>
            </template>
          </el-result>
        </div>
      </transition>
    </BaseDialog>

    <BaseDialog
      v-model="batchVerifyVisible"
      title="批量核对订单状态"
      width="700px"
      :show-footer="false"
    >
      <div v-if="batchVerifyResult" class="batch-verify">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="选择总数">{{ batchVerifyResult.totalCount }}</el-descriptions-item>
          <el-descriptions-item label="异常订单">
            <span class="text-danger">{{ batchVerifyResult.abnormalCount }} 条</span>
          </el-descriptions-item>
          <el-descriptions-item label="待复核订单">
            <span class="text-warning">{{ batchVerifyResult.pendingReviewCount }} 条</span>
          </el-descriptions-item>
          <el-descriptions-item label="正常履约订单">
            <span class="text-success">{{ batchVerifyResult.normalFulfillmentCount }} 条</span>
          </el-descriptions-item>
        </el-descriptions>
        <el-alert
          v-if="batchVerifyResult.filterReason"
          type="info"
          :closable="false"
          show-icon
          :title="batchVerifyResult.filterReason"
          style="margin-top: 16px"
        />
        <div style="margin-top: 16px; text-align: right">
          <el-button @click="batchVerifyVisible = false">关闭</el-button>
        </div>
      </div>
    </BaseDialog>

    <BaseDialog
      v-model="batchConfirmVisible"
      title="批量确认异常订单"
      width="500px"
      @confirm="handleBatchConfirmSubmit"
    >
      <el-form :model="batchConfirmForm" label-width="100px">
        <el-form-item label="确认原因" required>
          <el-input
            v-model="batchConfirmForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入批量确认原因"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item>
          <el-alert
            type="warning"
            :closable="false"
            show-icon
            title="仅对异常和待复核订单生效，正常履约订单将被自动过滤"
          />
        </el-form-item>
      </el-form>
    </BaseDialog>

    <BaseDialog
      v-model="changeLogVisible"
      title="状态变更记录"
      width="800px"
      :show-footer="false"
    >
      <el-table :data="changeLogList" border size="small" max-height="400">
        <el-table-column prop="createdAt" label="变更时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="变更节点" width="180">
          <template #default="{ row }">
            <el-tag :type="ORDER_STATUS_MAP[row.fromStatus]?.type || 'info'" size="small">
              {{ ORDER_STATUS_MAP[row.fromStatus]?.label }}
            </el-tag>
            <span style="margin: 0 4px">→</span>
            <el-tag :type="ORDER_STATUS_MAP[row.toStatus]?.type || 'info'" size="small">
              {{ ORDER_STATUS_MAP[row.toStatus]?.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operatorName" label="操作人" width="100" />
        <el-table-column prop="reason" label="变更原因" min-width="140" show-overflow-tooltip />
        <el-table-column label="佣金影响" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.commissionAffected" class="text-danger">
              -¥{{ formatMoney(row.commissionChangeAmount || 0) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="关联变动" min-width="120">
          <template #default="{ row }">
            <template v-if="row.relatedDataChanges">
              <el-tag v-if="row.relatedDataChanges.commission" type="danger" size="small" style="margin-right: 4px">佣金</el-tag>
              <el-tag v-if="row.relatedDataChanges.promoter" type="success" size="small" style="margin-right: 4px">推客</el-tag>
              <el-tag v-if="row.relatedDataChanges.channel" type="primary" size="small">渠道</el-tag>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top: 12px; text-align: right">
        <el-button @click="changeLogVisible = false">关闭</el-button>
      </div>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  RefreshRight,
  Download,
  View,
  Edit,
  DocumentCopy,
  Refresh,
  DataAnalysis,
  Switch,
  Checked,
  Warning,
} from '@element-plus/icons-vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import BaseBatchOperation from '@/components/common/BaseBatchOperation.vue'
import BaseEmpty from '@/components/common/BaseEmpty.vue'
import { useTable } from '@/composables/useTable'
import {
  ORDER_STATUS_OPTIONS,
  ORDER_STATUS_MAP,
  PAGE_SIZE_OPTIONS,
  DISTRIBUTION_ORDER_EXPORT_FIELD_OPTIONS,
  DISTRIBUTION_ORDER_SORT_FIELD_OPTIONS,
  DISTRIBUTION_ORDER_ORDER_TYPE_OPTIONS,
  DISTRIBUTION_ORDER_TAB_OPTIONS,
  DISTRIBUTION_ORDER_COLUMN_DEFAULT_WIDTHS,
  ORDER_STATUS_TRANSITIONS,
  ORDER_STATUS_CHANGE_REASON_REQUIRED,
  ORDER_STATUS_CHANGE_REASON_OPTIONS,
} from '@/constants'
import { formatDateTime } from '@/utils/date'
import { formatMoney } from '@/utils/money'
import { getChannelList } from '@/api/channel'
import { getPromoterList } from '@/api/promoter'
import { getOrder } from '@/api/order'
import {
  getDistributionOrderList,
  validateDistributionOrderQuery,
  getDistributionOrderStatistics,
  checkExportPermission,
  exportDistributionOrders,
  batchMarkOrders,
  getBatchStatistics,
  validateStatusTransition,
  changeOrderStatus,
  batchVerifyStatus,
  batchConfirmAbnormal,
  getStatusChangeLog,
  type DistributionOrderItem,
  type DistributionOrderQueryParams,
  type DistributionOrderStatistics,
  type BatchStatistics,
  type StatusTransitionResult,
  type BatchStatusCheckResult,
  type StatusChangeLogItem,
} from '@/api/distribution-order'

const channelOptions = ref<Array<{ id: number | string; name: string }>>([])
const promoterOptions = ref<Array<{ id: number | string; name: string }>>([])
const dateRange = ref<string[]>([])

async function fetchChannelOptions() {
  try {
    const res = await getChannelList({ page: 1, pageSize: 999, status: 1 as any })
    channelOptions.value = res.list.map((item) => ({ id: item.id, name: item.name }))
  } catch (error) {
    console.error('Fetch channels error:', error)
  }
}

async function fetchPromoterOptions() {
  try {
    const res = await getPromoterList({ page: 1, pageSize: 999, status: 1 as any })
    promoterOptions.value = res.list.map((item) => ({ id: item.id, name: item.name }))
  } catch (error) {
    console.error('Fetch promoters error:', error)
  }
}

onMounted(() => {
  fetchChannelOptions()
  fetchPromoterOptions()
})

const activeTab = ref<string | number>('all')
const activeStatTab = ref('total')
const quickFilterType = ref('all')
const columnWidths = reactive<Record<string, number>>({ ...DISTRIBUTION_ORDER_COLUMN_DEFAULT_WIDTHS })

const dateShortcuts = [
  {
    text: '今天',
    value: () => {
      const date = new Date()
      return [date, date]
    },
  },
  {
    text: '昨天',
    value: () => {
      const date = new Date()
      date.setTime(date.getTime() - 3600 * 1000 * 24)
      return [date, date]
    },
  },
  {
    text: '最近7天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    },
  },
  {
    text: '最近30天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    },
  },
  {
    text: '本月',
    value: () => {
      const end = new Date()
      const start = new Date(end.getFullYear(), end.getMonth(), 1)
      return [start, end]
    },
  },
]

const {
  loading,
  dataList,
  total,
  selectedIds,
  pagination,
  queryParams,
  handlePageChange,
  handleSizeChange,
  handleSelectionChange,
  fetchData,
} = useTable<DistributionOrderItem, DistributionOrderQueryParams>({
  fetchApi: getDistributionOrderList,
})

const statistics = ref<DistributionOrderStatistics | null>(null)

const statusTabs = DISTRIBUTION_ORDER_TAB_OPTIONS

const statCards = computed(() => {
  if (!statistics.value) {
    return [
      { key: 'total', label: '订单总数', value: 0, color: '#303133' },
      { key: 'totalAmount', label: '订单总金额', value: 0, color: '#409eff', formatter: (v: number) => `¥${formatMoney(v)}` },
      { key: 'totalCommission', label: '佣金总额', value: 0, color: '#67c23a', formatter: (v: number) => `¥${formatMoney(v)}` },
      { key: 'abnormal', label: '异常订单', value: 0, color: '#f56c6c' },
      { key: 'pendingReview', label: '待复核', value: 0, color: '#e6a23c' },
      { key: 'unsettled', label: '未结算', value: 0, color: '#409eff' },
    ]
  }
  return [
    { key: 'total', label: '订单总数', value: statistics.value.total, color: '#303133' },
    {
      key: 'totalAmount',
      label: '订单总金额',
      value: statistics.value.totalAmount,
      color: '#409eff',
      formatter: (v: number) => `¥${formatMoney(v)}`,
    },
    {
      key: 'totalCommission',
      label: '佣金总额',
      value: statistics.value.totalCommission,
      color: '#67c23a',
      formatter: (v: number) => `¥${formatMoney(v)}`,
    },
    { key: 'abnormal', label: '异常订单', value: statistics.value.abnormalCount, color: '#f56c6c' },
    {
      key: 'pendingReview',
      label: '待复核',
      value: statistics.value.pendingReviewCount,
      color: '#e6a23c',
    },
    { key: 'unsettled', label: '未结算', value: statistics.value.unsettledCount, color: '#409eff' },
  ]
})

async function fetchStatistics() {
  try {
    const params = { ...queryParams }
    if (dateRange.value?.length === 2) {
      params.startTime = dateRange.value[0]
      params.endTime = dateRange.value[1]
    }
    statistics.value = await getDistributionOrderStatistics(params)
  } catch (error) {
    console.error('Fetch statistics error:', error)
  }
}

function getTabCount(tabValue: string | number): number | undefined {
  if (!statistics.value) return undefined
  if (tabValue === 'all') return statistics.value.total
  if (tabValue === 'abnormal') return statistics.value.abnormalCount
  if (tabValue === 'pendingReview') return statistics.value.pendingReviewCount
  if (tabValue === 'unsettled') return statistics.value.unsettledCount
  const item = statistics.value.statusBreakdown.find((s) => s.status === tabValue)
  return item?.count
}

async function handleParamChange() {
  const params = { ...queryParams }
  if (dateRange.value?.length === 2) {
    params.startTime = dateRange.value[0]
    params.endTime = dateRange.value[1]
  }
  try {
    const validation = await validateDistributionOrderQuery(params)
    if (!validation.valid) {
      ElMessage.warning(validation.message)
    }
  } catch (error) {
    console.error('Validation error:', error)
  }
}

async function handleDateChange() {
  if (dateRange.value?.length === 2) {
    const start = new Date(dateRange.value[0])
    const end = new Date(dateRange.value[1])
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays > 90) {
      try {
        await ElMessageBox.confirm(
          `查询时间跨度为${diffDays}天，超过90天可能导致查询缓慢，是否继续？`,
          '查询时间提示',
          {
            confirmButtonText: '继续查询',
            cancelButtonText: '重新选择',
            type: 'warning',
          }
        )
      } catch {
        dateRange.value = []
        queryParams.startTime = undefined
        queryParams.endTime = undefined
        return
      }
    }
  }
  handleParamChange()
}

async function handleSearch() {
  const params = { ...queryParams }
  if (dateRange.value?.length === 2) {
    params.startTime = dateRange.value[0]
    params.endTime = dateRange.value[1]
  }

  try {
    const validation = await validateDistributionOrderQuery(params)
    if (!validation.valid) {
      ElMessage.error(validation.message || '参数校验失败')
      return
    }
  } catch (error) {
    console.error('Validation error:', error)
  }

  pagination.page = 1
  await fetchData()
  await fetchStatistics()
}

function handleReset() {
  Object.keys(queryParams).forEach((key) => {
    if (key !== 'page' && key !== 'pageSize') {
      ;(queryParams as any)[key] = undefined
    }
  })
  dateRange.value = []
  activeTab.value = 'all'
  quickFilterType.value = 'all'
  handleSearch()
}

function handleClearSelection() {
  selectedIds.value = []
}

function handleTabClick(tabValue: string | number) {
  activeTab.value = tabValue
  queryParams.status = undefined
  queryParams.isAbnormal = false
  queryParams.isPendingReview = false
  queryParams.isUnsettled = false

  if (tabValue === 'all') {
    // no special filter
  } else if (tabValue === 'abnormal') {
    queryParams.isAbnormal = true
  } else if (tabValue === 'pendingReview') {
    queryParams.isPendingReview = true
  } else if (tabValue === 'unsettled') {
    queryParams.isUnsettled = true
  } else {
    queryParams.status = tabValue as any
  }

  handleSearch()
}

function handleStatTabClick(key: string) {
  activeStatTab.value = key
  if (key === 'abnormal') {
    activeTab.value = 'abnormal'
    queryParams.isAbnormal = true
    queryParams.isPendingReview = false
    queryParams.isUnsettled = false
  } else if (key === 'pendingReview') {
    activeTab.value = 'pendingReview'
    queryParams.isPendingReview = true
    queryParams.isAbnormal = false
    queryParams.isUnsettled = false
  } else if (key === 'unsettled') {
    activeTab.value = 'unsettled'
    queryParams.isUnsettled = true
    queryParams.isAbnormal = false
    queryParams.isPendingReview = false
  } else {
    activeTab.value = 'all'
    queryParams.isAbnormal = false
    queryParams.isPendingReview = false
    queryParams.isUnsettled = false
  }
  handleSearch()
}

function handleQuickFilter(value: string) {
  queryParams.isAbnormal = false
  queryParams.isPendingReview = false
  queryParams.isUnsettled = false

  if (value === 'abnormal') {
    queryParams.isAbnormal = true
  } else if (value === 'pendingReview') {
    queryParams.isPendingReview = true
  } else if (value === 'unsettled') {
    queryParams.isUnsettled = true
  }
  handleSearch()
}

function filterByTag(tag: string) {
  quickFilterType.value = tag
  handleQuickFilter(tag)
}

function getRowClassName({ row }: { row: DistributionOrderItem }) {
  if (row.isAbnormal) return 'row-abnormal'
  if (row.isPendingReview) return 'row-pending-review'
  if (row.isUnsettled) return 'row-unsettled'
  return ''
}

function handleHeaderDragEnd(newWidth: number, _oldWidth: number, column: any) {
  if (column.property && columnWidths[column.property] !== undefined) {
    columnWidths[column.property] = newWidth
  } else if (column.label) {
    const labelToKey: Record<string, string> = {
      '订单号': 'orderNo',
      '商品信息': 'productInfo',
      '数量': 'quantity',
      '实付金额': 'payAmount',
      '佣金': 'commission',
      '渠道': 'channel',
      '推客': 'promoter',
      '订单状态': 'status',
      '标记': 'tags',
      '备注': 'remark',
      '下单时间': 'createdAt',
      '操作': 'action',
    }
    const key = labelToKey[column.label]
    if (key) {
      columnWidths[key] = newWidth
    }
  }
}

function copyOrderNo(orderNo: string) {
  navigator.clipboard?.writeText(orderNo)
  ElMessage.success('订单号已复制')
}

function truncateText(text: string, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const detailVisible = ref(false)
const detailData = ref<DistributionOrderItem | null>(null)

async function handleDetail(row: DistributionOrderItem) {
  try {
    detailData.value = (await getOrder(row.id)) as unknown as DistributionOrderItem
    detailVisible.value = true
  } catch (error) {
    console.error(error)
  }
}

const exportVisible = ref(false)
const hasExportPermission = ref(true)
const exportForm = reactive({
  fields: DISTRIBUTION_ORDER_EXPORT_FIELD_OPTIONS.map((o) => o.value),
  sortField: 'createdAt',
  sortOrder: 'DESC' as 'ASC' | 'DESC',
})

async function handleExportDialog() {
  try {
    const res = await checkExportPermission()
    hasExportPermission.value = res.hasPermission
  } catch (error) {
    console.error('Check export permission error:', error)
  }
  if (!hasExportPermission.value) {
    ElMessage.error('您没有导出权限，请联系管理员')
    return
  }
  exportVisible.value = true
}

async function handleExportConfirm() {
  try {
    const params: any = { ...queryParams }
    if (dateRange.value?.length === 2) {
      params.startTime = dateRange.value[0]
      params.endTime = dateRange.value[1]
    }
    params.fields = exportForm.fields.join(',')
    params.sortField = exportForm.sortField
    params.sortOrder = exportForm.sortOrder
    params.page = 1
    params.pageSize = 99999

    ElMessage.info('正在导出数据，请稍候...')
    const data = await exportDistributionOrders(params)
    ElMessage.success(`导出成功，共${data.length}条数据`)
    exportVisible.value = false
  } catch (error: any) {
    ElMessage.error(error.message || '导出失败')
  }
  return true
}

async function handleBatchExport() {
  try {
    const res = await checkExportPermission()
    hasExportPermission.value = res.hasPermission
  } catch (error) {
    console.error('Check export permission error:', error)
  }
  if (!hasExportPermission.value) {
    ElMessage.error('您没有导出权限，请联系管理员')
    return
  }
  exportVisible.value = true
}

const batchMarkVisible = ref(false)
const batchMarkForm = reactive({ remark: '' })

function handleBatchMark() {
  if (selectedIds.value.length === 0) return
  batchMarkForm.remark = ''
  batchMarkVisible.value = true
}

async function handleBatchMarkConfirm() {
  try {
    await batchMarkOrders({
      ids: selectedIds.value,
      remark: batchMarkForm.remark || undefined,
    })
    ElMessage.success('批量标记成功')
    batchMarkVisible.value = false
    selectedIds.value = []
    fetchData()
    fetchStatistics()
  } catch (error: any) {
    ElMessage.error(error.message || '批量标记失败')
  }
  return true
}

const batchStatsVisible = ref(false)
const batchStatistics = ref<BatchStatistics | null>(null)

async function showBatchStatistics() {
  if (selectedIds.value.length === 0) return
  try {
    batchStatistics.value = await getBatchStatistics(selectedIds.value)
    batchStatsVisible.value = true
  } catch (error) {
    console.error('Get batch statistics error:', error)
  }
}

const statusChangeVisible = ref(false)
const statusChangeForm = reactive<{
  order: DistributionOrderItem | null
  toStatus: number | undefined
  reasonType: string
  reasonDetail: string
}>({
  order: null,
  toStatus: undefined,
  reasonType: '',
  reasonDetail: '',
})
const transitionWarnings = ref<string[]>([])
const transitionCommissionImpact = ref(false)
const statusChangeRequiresReason = computed(() => {
  return statusChangeForm.toStatus !== undefined && ORDER_STATUS_CHANGE_REASON_REQUIRED.includes(statusChangeForm.toStatus)
})

async function handleStatusChange(row: DistributionOrderItem) {
  statusChangeForm.order = row
  statusChangeForm.toStatus = undefined
  statusChangeForm.reasonType = ''
  statusChangeForm.reasonDetail = ''
  transitionWarnings.value = []
  transitionCommissionImpact.value = false
  statusChangeVisible.value = true
}

watch(() => statusChangeForm.toStatus, async (newVal) => {
  if (newVal !== undefined && statusChangeForm.order) {
    try {
      const validation = await validateStatusTransition({
        orderId: String(statusChangeForm.order.id),
        fromStatus: statusChangeForm.order.status,
        toStatus: newVal,
      })
      transitionWarnings.value = validation.warnings || []
      transitionCommissionImpact.value = validation.commissionImpact
      if (!validation.valid) {
        ElMessage.warning(validation.message || '状态流转校验失败')
      }
    } catch (error) {
      console.error('Validate transition error:', error)
    }
  } else {
    transitionWarnings.value = []
    transitionCommissionImpact.value = false
  }
})

const statusResultVisible = ref(false)
const statusChangeResult = ref<StatusTransitionResult | null>(null)

async function handleStatusChangeConfirm() {
  if (!statusChangeForm.order || statusChangeForm.toStatus === undefined) {
    ElMessage.warning('请选择目标状态')
    return false
  }

  if (statusChangeRequiresReason.value && !statusChangeForm.reasonType && !statusChangeForm.reasonDetail) {
    ElMessage.warning('该状态变更必须填写原因')
    return false
  }

  const reason = [statusChangeForm.reasonType, statusChangeForm.reasonDetail].filter(Boolean).join(' - ')

  try {
    statusChangeResult.value = await changeOrderStatus({
      orderId: String(statusChangeForm.order.id),
      toStatus: statusChangeForm.toStatus,
      reason: reason || undefined,
    })
    statusChangeVisible.value = false
    statusResultVisible.value = true
    fetchData()
    fetchStatistics()
  } catch (error: any) {
    ElMessage.error(error.message || '状态变更失败')
  }
  return true
}

const batchVerifyVisible = ref(false)
const batchVerifyResult = ref<BatchStatusCheckResult | null>(null)

async function handleBatchVerify() {
  if (selectedIds.value.length === 0) return
  try {
    batchVerifyResult.value = await batchVerifyStatus(selectedIds.value as string[])
    batchVerifyVisible.value = true
  } catch (error: any) {
    ElMessage.error(error.message || '批量核对失败')
  }
}

const batchConfirmVisible = ref(false)
const batchConfirmForm = reactive({ reason: '' })

function handleBatchConfirmAbnormal() {
  if (selectedIds.value.length === 0) return
  batchConfirmForm.reason = ''
  batchConfirmVisible.value = true
}

async function handleBatchConfirmSubmit() {
  if (!batchConfirmForm.reason) {
    ElMessage.warning('请输入确认原因')
    return false
  }

  try {
    const result = await batchConfirmAbnormal({
      ids: selectedIds.value as string[],
      reason: batchConfirmForm.reason,
    })
    const { summary } = result
    ElMessage.success(`批量确认完成：成功${summary.successCount}条，失败${summary.failCount}条`)
    batchConfirmVisible.value = false
    selectedIds.value = []
    fetchData()
    fetchStatistics()
  } catch (error: any) {
    ElMessage.error(error.message || '批量确认失败')
  }
  return true
}

const changeLogVisible = ref(false)
const changeLogList = ref<StatusChangeLogItem[]>([])

async function handleViewChangeLog(order: DistributionOrderItem) {
  try {
    const res = await getStatusChangeLog({
      orderId: String(order.id),
      page: 1,
      pageSize: 50,
    })
    changeLogList.value = res.list
    changeLogVisible.value = true
  } catch (error) {
    console.error('Get status change log error:', error)
  }
}

watch(
  () => queryParams,
  () => {
    nextTick(() => {
      fetchStatistics()
    })
  },
  { deep: true }
)
</script>

<style scoped lang="scss">
.distribution-order-page {
  .statistics-card {
    .statistics-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 16px;

      @media (max-width: 1200px) {
        grid-template-columns: repeat(3, 1fr);
      }

      @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .stat-card {
      padding: 16px;
      border-radius: 8px;
      background: #fafafa;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;

      &:hover,
      &.active {
        background: #fff;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-color: var(--el-color-primary);
      }

      &__label {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin-bottom: 8px;
      }

      &__value {
        font-size: 24px;
        font-weight: 600;
        line-height: 1.2;
      }
    }
  }

  .status-tabs {
    margin-bottom: 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .status-tab {
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-1px);
      }

      &.active {
        transform: scale(1.05);
      }

      .tab-count {
        margin-left: 4px;
        font-weight: 600;
      }
    }
  }

  .search-form {
    margin-bottom: 0;
  }

  .table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;

    &__right {
      display: flex;
      gap: 8px;
    }
  }

  .table-wrapper {
    min-height: 400px;
  }

  .order-no {
    color: var(--el-color-primary);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;

    &:hover {
      text-decoration: underline;
    }

    .copy-icon {
      font-size: 12px;
      opacity: 0.6;
    }
  }

  .product-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .product-detail {
      flex: 1;
      min-width: 0;

      .product-name {
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .product-sku {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-top: 4px;
      }
    }
  }

  .amount {
    font-weight: 500;
  }

  .commission {
    color: var(--el-color-success);
    font-weight: 600;
  }

  .promoter-info {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;

    .promoter-code {
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }
  }

  .tag-group {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: center;

    .order-tag {
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        opacity: 0.8;
      }
    }
  }

  .remark-text {
    cursor: help;
  }

  .table-footer {
    margin-top: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;

    .refresh-btn {
      margin-right: auto;
    }
  }

  .batch-info {
    width: 100%;
  }

  .batch-stats {
    .status-breakdown {
      h4 {
        margin-bottom: 12px;
        font-size: 14px;
      }

      .status-bar-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .status-bar-item {
        display: flex;
        align-items: center;
        gap: 12px;

        .status-label {
          width: 80px;
          font-size: 13px;
          flex-shrink: 0;
        }

        .status-bar-wrapper {
          flex: 1;
          height: 20px;
          background: #f0f0f0;
          border-radius: 10px;
          overflow: hidden;

          .status-bar {
            height: 100%;
            background: linear-gradient(90deg, #409eff, #67c23a);
            border-radius: 10px;
            transition: width 0.5s ease;
          }
        }

        .status-count {
          width: 60px;
          text-align: right;
          font-size: 13px;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }

  .transition-warnings {
    width: 100%;
  }

  .status-result {
    .result-details {
      text-align: left;
      max-width: 400px;
      margin: 0 auto;
    }
  }

  .text-success {
    color: var(--el-color-success);
    font-weight: 600;
  }

  .text-danger {
    color: var(--el-color-danger);
    font-weight: 600;
  }

  .text-warning {
    color: var(--el-color-warning);
    font-weight: 600;
  }

  .copy-text {
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    color: var(--el-color-primary);

    &:hover {
      text-decoration: underline;
    }
  }

  .ml-1 {
    margin-left: 4px;
  }

  :deep(.row-abnormal) {
    --el-table-tr-bg-color: #fef0f0;
  }

  :deep(.row-pending-review) {
    --el-table-tr-bg-color: #fdf6ec;
  }

  :deep(.row-unsettled) {
    --el-table-tr-bg-color: #ecf5ff;
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.result-fade-enter-active {
  transition: all 0.4s ease;
}

.result-fade-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.result-fade-enter-to {
  opacity: 1;
  transform: scale(1);
}
</style>
