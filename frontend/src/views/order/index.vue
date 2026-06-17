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
      @row-dblclick="handleRowDblClick"
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
          <el-form-item label="异常类型">
            <el-select
              v-model="searchForm.abnormalType"
              placeholder="全部异常"
              clearable
              @change="handleAbnormalTypeChange"
            >
              <el-option value="all" label="全部异常" />
              <el-option value="timeout_no_accept" label="超时未接单" />
              <el-option value="midway_lost" label="中途失联" />
              <el-option value="unsettled" label="未结算完成" />
            </el-select>
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
        <el-button
          v-if="userRole === 1"
          type="warning"
          @click="handleBatchAdjustPricing"
        >
          <el-icon><Money /></el-icon>
          批量调整溢价
        </el-button>
        <el-button
          v-if="userRole === 1 || userRole === 6"
          type="danger"
          @click="handleAfterSaleBatch"
        >
          <el-icon><Warning /></el-icon>
          售后批量处理
        </el-button>
        <el-button
          v-if="userRole === 2"
          type="info"
          @click="handleAfterSaleBatchNoPermission"
        >
          <el-icon><Warning /></el-icon>
          售后批量处理
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
              <el-dropdown-item divided disabled>
                异常操作
              </el-dropdown-item>
              <el-dropdown-item command="retry_dispatch">
                批量重试流转
              </el-dropdown-item>
              <el-dropdown-item command="mark_abnormal">
                批量标记异常
              </el-dropdown-item>
              <el-dropdown-item command="force_close">
                批量关闭订单
              </el-dropdown-item>
              <el-dropdown-item command="reset_status">
                批量重置状态
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

      <el-table-column type="expand">
        <template #default="{ row }">
          <div class="flow-expand-area">
            <div v-if="flowLoadingMap[row.id]" class="flow-loading">
              <el-icon class="is-loading"><Refresh /></el-icon>
              <span>加载流转详情中...</span>
            </div>
            <template v-else-if="flowDetailMap[row.id]">
              <el-collapse-transition>
                <div class="flow-detail-content">
                  <el-alert
                    v-if="flowDetailMap[row.id].violations?.length > 0"
                    type="error"
                    :closable="false"
                    class="mb-16"
                  >
                    <template #title>
                      检测到 {{ flowDetailMap[row.id].violations.length }} 条违规记录
                    </template>
                    <div
                      v-for="v in flowDetailMap[row.id].violations"
                      :key="v.id"
                      class="violation-item"
                    >
                      <el-tag type="danger" size="small">{{ v.violationType }}</el-tag>
                      <span class="violation-operator">操作人：{{ v.operatorName || '未知' }}</span>
                      <span class="violation-ip">IP：{{ v.operatorIP || '-' }}</span>
                      <span class="violation-detail">{{ v.detail }}</span>
                    </div>
                  </el-alert>
                  <el-timeline>
                    <el-timeline-item
                      v-for="log in flowDetailMap[row.id].statusLogs"
                      :key="log.id"
                      :timestamp="formatDate(log.createTime)"
                      placement="top"
                    >
                      <el-card shadow="never">
                        <h4>{{ OrderStatusMap[log.newStatus] || '未知状态' }}</h4>
                        <p>操作人：{{ log.operatorName || '系统' }}
                          <span v-if="log.operatorType">
                            ({{ log.operatorType === 1 ? '乘客' : log.operatorType === 2 ? '司机' : '系统' }})
                          </span>
                        </p>
                        <p v-if="log.operatorIP">操作IP：{{ log.operatorIP }}</p>
                        <p v-if="log.changeReason">流转原因：{{ log.changeReason }}</p>
                      </el-card>
                    </el-timeline-item>
                  </el-timeline>
                </div>
              </el-collapse-transition>
            </template>
            <el-empty v-else description="暂无流转详情" :image-size="60" />
          </div>
        </template>
      </el-table-column>
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
      <el-table-column prop="status" label="状态" width="140" align="center">
        <template #default="{ row }">
          <div class="status-cell">
            <StatusTag
              :status="row.status"
              :status-map="OrderStatusMap"
              :color-map="OrderStatusColorMap"
              class="status-tag-animate"
            />
            <el-tag
              v-if="row.abnormalType"
              type="danger"
              size="small"
              class="abnormal-tag"
            >
              {{ row.abnormalLabel || row.abnormalType }}
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170">
        <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" :width="userRole >= 2 ? 340 : 280" fixed="right" align="center">
        <template #default="{ row }">
          <transition-group name="fade" tag="div" class="action-buttons">
            <el-button
              v-if="userRole === 2"
              type="warning"
              link
              size="small"
              @click="handleSingleAdjustPricing(row)"
            >
              调整溢价
            </el-button>
            <el-button
              v-for="btn in getActionButtons(row)"
              :key="btn.key"
              :type="btn.type"
              link
              size="small"
              :loading="isTransitionLoading(row.id, btn.key)"
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
      v-model="cancelDialogVisible"
      title="取消订单"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="取消原因" required>
          <el-input
            v-model="cancelForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入取消原因"
          />
        </el-form-item>
        <el-form-item label="取消类型" required>
          <el-radio-group v-model="cancelForm.cancelType">
            <el-radio :value="1">用户主动取消</el-radio>
            <el-radio :value="2">司机主动取消</el-radio>
            <el-radio :value="3">系统超时取消</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="责任判定">
          <el-tag
            :type="cancelResponsibilityMap[cancelForm.cancelType]?.type as any"
            size="large"
          >
            {{ cancelResponsibilityMap[cancelForm.cancelType]?.label }}
          </el-tag>
        </el-form-item>
        <el-alert
          :title="cancelResponsibilityMap[cancelForm.cancelType]?.hint"
          :type="cancelForm.cancelType === 2 ? 'error' : cancelForm.cancelType === 1 ? 'warning' : 'info'"
          :closable="false"
          show-icon
          class="mb-16"
        />
      </el-form>
      <template #footer>
        <el-button @click="cancelDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="cancelLoading" @click="handleCancelSubmit">
          确认取消订单
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="prerequisiteDialogVisible"
      title="前置条件校验未通过"
      width="500px"
    >
      <el-alert
        type="warning"
        :closable="false"
        class="mb-16"
      >
        <template #title>以下条件未满足，无法执行此操作</template>
      </el-alert>
      <div class="prerequisite-list">
        <el-tag
          v-for="(item, index) in prerequisiteFailures"
          :key="index"
          type="danger"
          effect="dark"
          class="prerequisite-tag"
        >
          {{ item.message }}
        </el-tag>
      </div>
      <template #footer>
        <el-button type="primary" @click="prerequisiteDialogVisible = false">知道了</el-button>
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

    <el-dialog
      v-model="batchAdjustDialogVisible"
      title="批量调整溢价"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="batchAdjustForm" label-width="120px">
        <el-alert
          title="条件筛选"
          type="info"
          :closable="false"
          class="mb-16"
        />
        <el-form-item label="城市编码">
          <el-input
            v-model="batchAdjustForm.filter.cityCode"
            placeholder="请输入城市编码，如：010"
            clearable
          />
        </el-form-item>
        <el-form-item label="车型类型">
          <el-select
            v-model="batchAdjustForm.filter.capacityType"
            placeholder="请选择车型"
            clearable
            style="width: 100%"
          >
            <el-option :value="1" label="快车" />
            <el-option :value="2" label="专车" />
            <el-option :value="3" label="豪华车" />
            <el-option :value="4" label="拼车" />
            <el-option :value="5" label="出租车" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务时段">
          <el-select
            v-model="batchAdjustForm.filter.timePeriod"
            placeholder="请选择服务时段"
            clearable
            style="width: 100%"
          >
            <el-option value="daytime" label="日间(06:00-22:00)" />
            <el-option value="nighttime" label="夜间(22:00-06:00)" />
            <el-option value="peak" label="高峰(07:00-09:00,17:00-19:00)" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="batchAdjustDateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-divider />
        <el-alert
          title="调整参数"
          type="warning"
          :closable="false"
          class="mb-16"
        />
        <el-form-item label="溢价倍数">
          <el-input-number
            v-model="batchAdjustForm.adjustParams.surgeRatio"
            :min="1"
            :max="3"
            :precision="1"
            :step="0.1"
            style="width: 100%"
            placeholder="不调整请留空"
          />
          <span class="form-tip">设置为1表示取消溢价</span>
        </el-form-item>
        <el-form-item label="里程费调整">
          <el-input-number
            v-model="batchAdjustForm.adjustParams.perKmPriceAdjust"
            :precision="2"
            :step="0.1"
            style="width: 100%"
            placeholder="正数增加，负数减少，不调整请留空"
          />
        </el-form-item>
        <el-divider />
        <el-form-item v-if="batchAdjustPreviewResult">
          <div class="preview-result">
            <div class="preview-item">
              <span class="label">符合条件订单：</span>
              <span class="value">{{ batchAdjustPreviewResult.total }} 单</span>
            </div>
            <div class="preview-item">
              <span class="label">已排除订单：</span>
              <span class="value excluded">{{ batchAdjustPreviewResult.excludedCount }} 单</span>
            </div>
            <div v-if="batchAdjustPreviewResult.excludedOrders.length > 0" class="excluded-list">
              <div class="excluded-title">排除原因：</div>
              <div
                v-for="item in batchAdjustPreviewResult.excludedOrders.slice(0, 5)"
                :key="item.id"
                class="excluded-item"
              >
                <span>{{ item.orderNo }}</span>
                <span class="reason">{{ item.reason }}</span>
              </div>
              <div v-if="batchAdjustPreviewResult.excludedOrders.length > 5" class="excluded-more">
                还有 {{ batchAdjustPreviewResult.excludedOrders.length - 5 }} 条...
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchAdjustDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchAdjustPreviewLoading" @click="handleBatchAdjustPreview">
          预览
        </el-button>
        <el-button
          type="success"
          :loading="batchAdjustExecuting"
          :disabled="!batchAdjustPreviewResult || batchAdjustPreviewResult.total === 0"
          @click="handleBatchAdjustExecute"
        >
          执行调整
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="singleAdjustDialogVisible"
      title="调整订单溢价"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-alert
        v-if="singleAdjustOrder"
        :title="`订单号：${singleAdjustOrder.orderNo}`"
        type="info"
        :closable="false"
        class="mb-16"
      />
      <el-form :model="singleAdjustForm" label-width="120px">
        <el-form-item label="溢价倍数">
          <el-input-number
            v-model="singleAdjustForm.surgeRatio"
            :min="1"
            :max="3"
            :precision="1"
            :step="0.1"
            style="width: 100%"
          />
          <span class="form-tip">设置为1表示取消溢价</span>
        </el-form-item>
        <el-form-item label="里程费调整">
          <el-input-number
            v-model="singleAdjustForm.perKmPriceAdjust"
            :precision="2"
            :step="0.1"
            style="width: 100%"
            placeholder="正数增加，负数减少"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="singleAdjustDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="singleAdjustSubmitting" @click="handleSingleAdjustSubmit">
          确认调整
        </el-button>
      </template>
    </el-dialog>

    <transition name="slideDownFade">
      <el-dialog
        v-model="afterSaleBatchDialogVisible"
        title="售后批量处理"
        width="700px"
        :close-on-click-modal="false"
      >
        <el-alert
          v-if="userRole === 2"
          title="您只有查看权限，无法执行批量操作"
          type="warning"
          :closable="false"
          class="mb-16"
          show-icon
        />
        <el-form :model="batchFilterForm" label-width="100px" class="mb-16">
          <el-form-item label="工单类型">
            <el-select
              v-model="batchFilterForm.filterType"
              placeholder="请选择工单类型"
              clearable
              style="width: 100%"
            >
              <el-option value="overdue" label="超时未处理" />
              <el-option value="pending_review" label="待复核" />
              <el-option value="rejected" label="已驳回" />
            </el-select>
          </el-form-item>
          <el-form-item label="纠纷类型">
            <el-select
              v-model="batchFilterForm.disputeType"
              placeholder="请选择纠纷类型"
              clearable
              style="width: 100%"
            >
              <el-option :value="1" label="费用争议" />
              <el-option :value="2" label="服务投诉" />
              <el-option :value="3" label="物品遗失" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="batchDateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              :loading="batchPreviewLoading"
              @click="handleBatchPreview"
            >
              预览
            </el-button>
          </el-form-item>
        </el-form>

        <el-divider v-if="batchPreviewResult" />

        <div v-if="batchPreviewResult" class="batch-preview">
          <el-row :gutter="16" class="mb-16">
            <el-col :span="8">
              <el-card shadow="hover" class="stat-card">
                <div class="stat-label">符合条件</div>
                <div class="stat-value text-success">{{ batchPreviewResult.eligibleCount }}</div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover" class="stat-card">
                <div class="stat-label">已排除</div>
                <div class="stat-value text-warning">{{ batchPreviewResult.excludedCount }}</div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover" class="stat-card">
                <div class="stat-label">总计</div>
                <div class="stat-value">{{ batchPreviewResult.total }}</div>
              </el-card>
            </el-col>
          </el-row>

          <el-collapse>
            <el-collapse-item title="符合条件工单列表" :name="1">
              <el-table :data="batchPreviewResult.eligible" border size="small" max-height="200">
                <el-table-column prop="ticketNo" label="工单号" width="180" />
                <el-table-column label="纠纷类型" width="100">
                  <template #default="{ row }">
                    <el-tag :color="DisputeTypeColorMap[row.disputeType]" effect="dark" size="small">
                      {{ DisputeTypeMap[row.disputeType] }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="状态" width="80">
                  <template #default="{ row }">
                    <el-tag :color="TicketStatusColorMap[row.status]" effect="dark" size="small">
                      {{ TicketStatusMap[row.status] }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="passengerName" label="乘客" width="80" />
                <el-table-column prop="createTime" label="创建时间" width="170" />
                <el-table-column label="是否超时" width="80">
                  <template #default="{ row }">
                    <el-tag v-if="row.isOverdue === 1" type="danger" size="small">超时</el-tag>
                    <el-tag v-else type="success" size="small">正常</el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </el-collapse-item>
            <el-collapse-item title="已排除工单列表" :name="2">
              <el-table :data="batchPreviewResult.excluded" border size="small" max-height="200">
                <el-table-column prop="ticketNo" label="工单号" width="180" />
                <el-table-column prop="orderNo" label="订单号" width="180" />
                <el-table-column prop="reason" label="排除原因" />
              </el-table>
            </el-collapse-item>
          </el-collapse>

          <el-divider />

          <el-form label-width="100px">
            <el-form-item label="操作类型">
              <el-radio-group v-model="batchOperation">
                <el-radio value="urge">批量催办</el-radio>
                <el-radio value="review">批量复核</el-radio>
                <el-radio value="close">批量关闭无效工单</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>

          <el-progress
            v-if="batchExecuting"
            :percentage="batchExecuteProgress"
            :status="batchExecuteProgressStatus"
            class="mb-16"
          />

          <div v-if="batchExecuteResult" class="batch-result mb-16">
            <el-alert
              :title="`批量操作完成：成功 ${batchExecuteResult.success} 条，失败 ${batchExecuteResult.failed} 条`"
              :type="batchExecuteResult.failed === 0 ? 'success' : 'warning'"
              :closable="false"
              show-icon
            />
            <div v-if="batchExecuteResult.failedOrders?.length > 0" class="failed-list mt-16">
              <div class="failed-title">失败详情：</div>
              <div
                v-for="item in batchExecuteResult.failedOrders"
                :key="item.id"
                class="failed-item"
              >
                <span class="failed-id">ID: {{ item.id }}</span>
                <span class="failed-reason">{{ item.reason }}</span>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <el-button @click="afterSaleBatchDialogVisible = false">取消</el-button>
          <el-button
            v-if="userRole !== 2"
            type="primary"
            :disabled="!canExecuteBatch"
            :loading="batchExecuting"
            @click="handleBatchExecute"
          >
            执行操作
          </el-button>
        </template>
      </el-dialog>
    </transition>
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
  Warning,
  Money
} from '@element-plus/icons-vue'
import {
  getBatchPreviewApi,
  batchOperationApi
} from '@/api/after-sale'
import {
  DisputeTypeMap,
  DisputeTypeColorMap,
  TicketStatusMap,
  TicketStatusColorMap
} from '@/enums/after-sale'
import type {
  BatchOperationResult,
  BatchPreviewResult
} from '@/types/after-sale'
import CommonTable from '@/components/CommonTable/index.vue'
import StatusTag from '@/components/StatusTag/index.vue'
import DetailDialog from '@/components/DetailDialog/index.vue'
import { useUserStore } from '@/store/modules/user'
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
  cancelOrderApi,
  getTransitionPrerequisitesApi,
  getCancelStatisticsApi,
  getAbnormalOrdersApi,
  batchAbnormalOperationApi,
  getViolationLogsApi,
  getFlowDetailApi,
  updateOrderStatusApi
} from '@/api/order'
import {
  batchAdjustPricingApi,
  updateOrderBillingApi
} from '@/api/pricing'
import { OrderStatusMap, OrderStatusColorMap, OrderStatus } from '@/enums/order'
import { formatDate, formatPhone } from '@/utils/format'
import type {
  Order,
  OrderQueryParams,
  PriceValidateResult,
  OrderTraceData,
  BatchOpResult,
  PrerequisiteResult,
  CancelStatistics,
  ViolationLogItem,
  FlowDetailData
} from '@/types/order'
import type {
  BatchAdjustResult,
  BatchAdjustParams as BatchAdjustPricingParams
} from '@/types/pricing'

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

const userStore = useUserStore()

const userRole = computed(() => {
  const role = userStore.userInfo?.role
  if (role === '1' || role === 1) return 1
  if (role === '6' || role === 6) return 6
  if (role === '2' || role === 2) return 2
  return 0
})

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
  driverName: '',
  abnormalType: ''
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
  if (searchForm.abnormalType) {
    handleAbnormalTypeChange(searchForm.abnormalType)
  } else {
    getList()
  }
}

const handleFormReset = () => {
  searchForm.orderNo = ''
  searchForm.status = ''
  searchForm.payStatus = undefined
  searchForm.capacityType = undefined
  searchForm.orderSource = undefined
  searchForm.passengerName = ''
  searchForm.driverName = ''
  searchForm.abnormalType = ''
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

const isTransitionLoading = (orderId: number, btnKey: string) => {
  if (['dispatch', 'cancel', 'complete'].includes(btnKey)) {
    return !!transitionLoadingMap.value[orderId]
  }
  return false
}

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

const batchAdjustDialogVisible = ref(false)
const batchAdjustPreviewLoading = ref(false)
const batchAdjustExecuting = ref(false)
const batchAdjustPreviewResult = ref<BatchAdjustResult | null>(null)
const batchAdjustDateRange = ref<string[]>([])
const batchAdjustForm = reactive<BatchAdjustPricingParams>({
  filter: {
    cityCode: undefined,
    capacityType: undefined,
    timePeriod: undefined,
    startTime: undefined,
    endTime: undefined
  },
  adjustParams: {
    surgeRatio: undefined,
    perKmPriceAdjust: undefined
  }
})

watch(batchAdjustDateRange, (val) => {
  if (val && val.length === 2) {
    batchAdjustForm.filter.startTime = val[0]
    batchAdjustForm.filter.endTime = val[1]
  } else {
    batchAdjustForm.filter.startTime = undefined
    batchAdjustForm.filter.endTime = undefined
  }
})

const singleAdjustDialogVisible = ref(false)
const singleAdjustSubmitting = ref(false)
const singleAdjustOrder = ref<Order | null>(null)
const singleAdjustForm = reactive({
  surgeRatio: 1.0,
  perKmPriceAdjust: 0
})

const afterSaleBatchDialogVisible = ref(false)
const batchPreviewLoading = ref(false)
const batchExecuting = ref(false)
const batchPreviewResult = ref<BatchPreviewResult | null>(null)
const batchExecuteResult = ref<BatchOperationResult | null>(null)
const batchExecuteProgress = ref(0)
const batchExecuteProgressStatus = ref<'success' | 'warning' | 'danger' | ''>('')
const batchOperation = ref<'urge' | 'review' | 'close'>('urge')
const batchDateRange = ref<string[]>([])

const batchFilterForm = reactive({
  filterType: undefined as 'overdue' | 'pending_review' | 'rejected' | undefined,
  disputeType: undefined as number | undefined,
  startTime: undefined as string | undefined,
  endTime: undefined as string | undefined
})

watch(batchDateRange, (val) => {
  if (val && val.length === 2) {
    batchFilterForm.startTime = val[0]
    batchFilterForm.endTime = val[1]
  } else {
    batchFilterForm.startTime = undefined
    batchFilterForm.endTime = undefined
  }
})

const canExecuteBatch = computed(() => {
  if (!batchPreviewResult.value) return false
  if (batchPreviewResult.value.eligibleCount === 0) return false
  if (userRole.value !== 1 && userRole.value !== 6) return false
  return true
})
const prerequisiteFailures = ref<Array<{ field: string; message: string }>>([])
const transitionLoadingMap = ref<Record<number, boolean>>({})

const cancelDialogVisible = ref(false)
const cancelForm = reactive({
  orderId: 0,
  reason: '',
  cancelType: 1 as number
})
const cancelLoading = ref(false)
const cancelResponsibilityMap: Record<number, { label: string; type: string; hint: string }> = {
  1: { label: '乘客责任', type: 'warning', hint: '将记录乘客取消次数' },
  2: { label: '司机责任', type: 'danger', hint: '将扣减司机评分并记录' },
  3: { label: '平台责任', type: 'info', hint: '无惩罚措施' }
}

const abnormalType = ref('')
const abnormalStats = reactive({
  total: 0,
  timeout: 0,
  lost: 0,
  unsettled: 0
})

const expandedRowKeys = ref<Set<number>>(new Set())
const flowDetailMap = ref<Record<number, FlowDetailData>>({})
const flowLoadingMap = ref<Record<number, boolean>>({})

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

const handleDispatch = async (row: Order) => {
  transitionLoadingMap.value[row.id] = true
  try {
    const res = await getTransitionPrerequisitesApi(row.id, OrderStatus.DISPATCHED)
    if (!res.data.valid) {
      prerequisiteFailures.value = res.data.failures
      prerequisiteDialogVisible.value = true
      return
    }
    await new Promise(resolve => setTimeout(resolve, 300))
    ElMessage.info('派单功能开发中')
  } catch (error: any) {
    if (error?.status === 429) {
      ElMessage.warning('操作处理中，请勿重复提交')
    } else {
      ElMessage.error(error.message || '派单失败')
    }
  } finally {
    transitionLoadingMap.value[row.id] = false
  }
}

const handleCancel = async (row: Order) => {
  transitionLoadingMap.value[row.id] = true
  try {
    const res = await getTransitionPrerequisitesApi(row.id, OrderStatus.CANCELLED)
    if (!res.data.valid) {
      prerequisiteFailures.value = res.data.failures
      prerequisiteDialogVisible.value = true
      return
    }
    cancelForm.orderId = row.id
    cancelForm.reason = ''
    cancelForm.cancelType = 1
    cancelDialogVisible.value = true
  } catch (error: any) {
    if (error?.status === 429) {
      ElMessage.warning('操作处理中，请勿重复提交')
    } else {
      ElMessage.error(error.message || '取消校验失败')
    }
  } finally {
    transitionLoadingMap.value[row.id] = false
  }
}

const handleCancelSubmit = async () => {
  if (!cancelForm.reason.trim()) {
    ElMessage.warning('请输入取消原因')
    return
  }
  cancelLoading.value = true
  try {
    await cancelOrderApi(cancelForm.orderId, cancelForm.reason, cancelForm.cancelType)
    ElMessage.success('取消成功')
    cancelDialogVisible.value = false
    getList()
  } catch (error: any) {
    if (error?.status === 429) {
      ElMessage.warning('操作处理中，请勿重复提交')
    } else {
      ElMessage.error(error.message || '取消失败')
    }
  } finally {
    cancelLoading.value = false
  }
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

const handleComplete = async (row: Order) => {
  transitionLoadingMap.value[row.id] = true
  try {
    const res = await getTransitionPrerequisitesApi(row.id, OrderStatus.COMPLETED)
    if (!res.data.valid) {
      prerequisiteFailures.value = res.data.failures
      prerequisiteDialogVisible.value = true
      return
    }
    await new Promise(resolve => setTimeout(resolve, 300))
    ElMessage.info('完成订单功能开发中')
  } catch (error: any) {
    if (error?.status === 429) {
      ElMessage.warning('操作处理中，请勿重复提交')
    } else {
      ElMessage.error(error.message || '完成订单失败')
    }
  } finally {
    transitionLoadingMap.value[row.id] = false
  }
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

  if (['retry_dispatch', 'mark_abnormal', 'force_close', 'reset_status'].includes(command)) {
    await handleBatchAbnormalCommand(command)
    return
  }

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

const handleAbnormalTypeChange = async (type: string) => {
  if (!type) {
    getList()
    return
  }
  loading.value = true
  try {
    const res = await getAbnormalOrdersApi({ type })
    tableData.value = res.data.list || res.data
    total.value = res.data.total || tableData.value.length
  } catch (error: any) {
    ElMessage.error(error.message || '获取异常订单失败')
  } finally {
    loading.value = false
  }
}

const handleBatchAbnormalCommand = async (command: string) => {
  const orders = selectedRows.value
  if (orders.length === 0) return

  const commandLabelMap: Record<string, string> = {
    retry_dispatch: '批量重试流转',
    mark_abnormal: '批量标记异常',
    force_close: '批量关闭订单',
    reset_status: '批量重置状态'
  }

  if (command === 'retry_dispatch') {
    const hasNonTimeout = orders.some(o => o.abnormalType !== 'timeout_no_accept')
    if (hasNonTimeout) {
      ElMessage.warning('批量重试流转仅适用于"超时未接单"类型的异常订单')
      return
    }
  }

  await ElMessageBox.confirm(
    `确定要对选中的 ${orders.length} 条订单执行"${commandLabelMap[command]}"操作吗？`,
    '提示',
    { type: 'warning' }
  )

  const ids = orders.map(o => o.id)
  batchOpTitle.value = commandLabelMap[command]
  batchProgressVisible.value = true
  batchProgress.value = 0
  batchProgressStatus.value = ''
  batchStats.total = orders.length
  batchStats.success = 0
  batchStats.failed = 0
  batchFailedList.value = []

  try {
    const res = await batchAbnormalOperationApi(ids, command)
    batchStats.success = res.data.success
    batchStats.failed = res.data.failed
    if (res.data.failedOrders) {
      batchFailedList.value = res.data.failedOrders
    }
    batchProgress.value = 100
    batchProgressStatus.value = batchStats.failed === 0 ? 'success' : 'warning'
    ElMessage.success(`操作完成，成功${batchStats.success}条，失败${batchStats.failed}条`)
    getList()
    loadAbnormalStats()
  } catch (error: any) {
    batchProgressStatus.value = 'danger'
    batchProgress.value = 100
    ElMessage.error(error.message || '批量异常操作失败')
  }
}

const loadAbnormalStats = async () => {
  try {
    const res = await getAbnormalOrdersApi({ type: 'all' })
    const list = res.data.list || res.data
    abnormalStats.total = list.length
    abnormalStats.timeout = list.filter((o: Order) => o.abnormalType === 'timeout_no_accept').length
    abnormalStats.lost = list.filter((o: Order) => o.abnormalType === 'midway_lost').length
    abnormalStats.unsettled = list.filter((o: Order) => o.abnormalType === 'unsettled').length
  } catch {
    // ignore
  }
}

const handleRowDblClick = async (row: Order) => {
  const elTable = tableRef.value?.elTableRef
  if (!elTable) return

  const isExpanded = expandedRowKeys.value.has(row.id)
  if (isExpanded) {
    expandedRowKeys.value.delete(row.id)
    elTable.toggleRowExpansion(row, false)
    return
  }

  expandedRowKeys.value.add(row.id)
  elTable.toggleRowExpansion(row, true)

  if (flowDetailMap.value[row.id]) return

  flowLoadingMap.value[row.id] = true
  try {
    const res = await getFlowDetailApi(row.id)
    flowDetailMap.value[row.id] = res.data
  } catch (error: any) {
    ElMessage.error(error.message || '获取流转详情失败')
  } finally {
    flowLoadingMap.value[row.id] = false
  }
}

const handleBatchAdjustPricing = () => {
  if (userRole.value !== 1) {
    ElMessage.warning('您没有权限进行批量调整')
    return
  }
  batchAdjustForm.filter = {
    cityCode: undefined,
    capacityType: undefined,
    timePeriod: undefined,
    startTime: undefined,
    endTime: undefined
  }
  batchAdjustForm.adjustParams = {
    surgeRatio: undefined,
    perKmPriceAdjust: undefined
  }
  batchAdjustDateRange.value = []
  batchAdjustPreviewResult.value = null
  batchAdjustDialogVisible.value = true
}

const handleBatchAdjustPreview = async () => {
  if (batchAdjustForm.adjustParams.surgeRatio === undefined && batchAdjustForm.adjustParams.perKmPriceAdjust === undefined) {
    ElMessage.warning('请至少设置一个调整参数')
    return
  }
  batchAdjustPreviewLoading.value = true
  try {
    const res = await batchAdjustPricingApi(batchAdjustForm)
    batchAdjustPreviewResult.value = res.data
  } catch (error: any) {
    ElMessage.error(error.message || '预览失败')
  } finally {
    batchAdjustPreviewLoading.value = false
  }
}

const handleBatchAdjustExecute = async () => {
  if (!batchAdjustPreviewResult.value || batchAdjustPreviewResult.value.total === 0) {
    ElMessage.warning('没有符合条件的订单')
    return
  }
  await ElMessageBox.confirm(
    `确定要对 ${batchAdjustPreviewResult.value.total} 条订单执行调整吗？`,
    '提示',
    { type: 'warning' }
  )
  batchAdjustExecuting.value = true
  batchAdjustDialogVisible.value = false
  batchOpTitle.value = '批量调整溢价'
  batchProgressVisible.value = true
  batchProgress.value = 0
  batchProgressStatus.value = ''
  batchStats.total = batchAdjustPreviewResult.value.total
  batchStats.success = 0
  batchStats.failed = 0
  batchFailedList.value = []

  try {
    const total = batchAdjustPreviewResult.value.total
    const updateInterval = Math.max(1, Math.floor(total / 10))
    
    for (let i = 0; i < total; i += updateInterval) {
      await new Promise(resolve => setTimeout(resolve, 300))
      const progress = Math.min(100, Math.round(((i + updateInterval) / total) * 100))
      batchProgress.value = progress
    }

    const res = await batchAdjustPricingApi(batchAdjustForm)
    batchStats.success = res.data.success
    batchStats.failed = res.data.failed
    if (res.data.failedOrders) {
      batchFailedList.value = res.data.failedOrders
    }
    batchProgress.value = 100
    batchProgressStatus.value = batchStats.failed === 0 ? 'success' : 'warning'
    ElMessage.success(`批量调整完成，成功${batchStats.success}条，失败${batchStats.failed}条，排除${res.data.excludedCount}条`)
    getList()
  } catch (error: any) {
    batchProgressStatus.value = 'danger'
    batchProgress.value = 100
    ElMessage.error(error.message || '批量调整失败')
  } finally {
    batchAdjustExecuting.value = false
  }
}

const handleSingleAdjustPricing = (row: Order) => {
  if (userRole.value < 2) {
    ElMessage.warning('您没有权限调整溢价')
    return
  }
  singleAdjustOrder.value = row
  singleAdjustForm.surgeRatio = 1.0
  singleAdjustForm.perKmPriceAdjust = 0
  singleAdjustDialogVisible.value = true
}

const handleSingleAdjustSubmit = async () => {
  if (!singleAdjustOrder.value) return
  singleAdjustSubmitting.value = true
  try {
    await updateOrderBillingApi(singleAdjustOrder.value.id, {
      surgeRatio: singleAdjustForm.surgeRatio
    })
    ElMessage.success('调整成功')
    singleAdjustDialogVisible.value = false
    getList()
  } catch (error: any) {
    ElMessage.error(error.message || '调整失败')
  } finally {
    singleAdjustSubmitting.value = false
  }
}

const handleAfterSaleBatch = () => {
  if (userRole.value !== 1 && userRole.value !== 6) {
    ElMessage.warning('您没有权限执行售后批量操作')
    return
  }
  batchFilterForm.filterType = undefined
  batchFilterForm.disputeType = undefined
  batchDateRange.value = []
  batchPreviewResult.value = null
  batchExecuteResult.value = null
  batchOperation.value = 'urge'
  batchExecuteProgress.value = 0
  batchExecuteProgressStatus.value = ''
  afterSaleBatchDialogVisible.value = true
}

const handleAfterSaleBatchNoPermission = () => {
  ElMessage.warning('运营角色仅有查看权限，如需执行批量操作请联系售后管理员')
}

const handleBatchPreview = async () => {
  const params: any = {}
  if (batchFilterForm.filterType) {
    params.filterType = batchFilterForm.filterType
  }
  if (batchFilterForm.disputeType) {
    params.disputeType = batchFilterForm.disputeType
  }
  if (batchFilterForm.startTime) {
    params.startTime = batchFilterForm.startTime
  }
  if (batchFilterForm.endTime) {
    params.endTime = batchFilterForm.endTime
  }

  batchPreviewLoading.value = true
  batchExecuteResult.value = null
  try {
    const res = await getBatchPreviewApi(params)
    batchPreviewResult.value = res.data
  } catch (error: any) {
    ElMessage.error(error.message || '预览失败')
  } finally {
    batchPreviewLoading.value = false
  }
}

const handleBatchExecute = async () => {
  if (!batchPreviewResult.value || !canExecuteBatch.value) return
  if (userRole.value === 2) {
    ElMessage.warning('您没有权限执行批量操作')
    return
  }

  const ids = batchPreviewResult.value.eligible.map(item => item.id)
  if (ids.length === 0) {
    ElMessage.warning('没有可执行的工单')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要对选中的 ${ids.length} 条工单执行"${batchOperation.value === 'urge' ? '批量催办' : batchOperation.value === 'review' ? '批量复核' : '批量关闭无效工单'}"操作吗？`,
      '提示',
      { type: 'warning' }
    )
  } catch {
    return
  }

  batchExecuting.value = true
  batchExecuteProgress.value = 0
  batchExecuteProgressStatus.value = ''
  batchExecuteResult.value = null

  try {
    const total = ids.length
    const batchSize = Math.ceil(total / 10)

    let successCount = 0
    let failedCount = 0
    const failedOrders: Array<{ id: number; reason: string }> = []

    for (let i = 0; i < total; i += batchSize) {
      const batchIds = ids.slice(i, i + batchSize)
      try {
        const res = await batchOperationApi({
          ids: batchIds,
          operation: batchOperation.value
        })
        successCount += res.data.success
        failedCount += res.data.failed
        if (res.data.failedOrders) {
          failedOrders.push(...res.data.failedOrders)
        }
      } catch (error: any) {
        failedCount += batchIds.length
        batchIds.forEach(id => {
          failedOrders.push({ id, reason: error.message || '操作失败' })
        })
      }

      batchExecuteProgress.value = Math.min(100, Math.round(((i + batchSize) / total) * 100))
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    batchExecuteResult.value = {
      total,
      success: successCount,
      failed: failedCount,
      failedOrders
    }

    batchExecuteProgressStatus.value = failedCount === 0 ? 'success' : 'warning'
    ElMessage.success(`批量操作完成，成功${successCount}条，失败${failedCount}条`)

    await handleBatchPreview()
  } catch (error: any) {
    batchExecuteProgressStatus.value = 'danger'
    ElMessage.error(error.message || '批量操作失败')
  } finally {
    batchExecuting.value = false
  }
}

onMounted(() => {
  getList()
  loadAbnormalStats()
})

defineExpose({
  selectedRows
})
</script>

<style lang="scss" scoped>
.slideDownFade-enter-active,
.slideDownFade-leave-active {
  transition: all 0.3s ease;
}
.slideDownFade-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}
.slideDownFade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mb-16 {
  margin-bottom: 16px;
}

.mt-16 {
  margin-top: 16px;
}

.batch-preview {
  .stat-card {
    text-align: center;
    transition: all 0.3s ease;

    .stat-label {
      font-size: 13px;
      color: #909399;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 600;
      color: #303133;

      &.text-success {
        color: #67c23a;
      }

      &.text-warning {
        color: #e6a23c;
      }
    }
  }

  .failed-list {
    .failed-title {
      font-weight: 500;
      color: #f56c6c;
      margin-bottom: 8px;
    }

    .failed-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 12px;
      background: rgba(245, 108, 108, 0.05);
      border-radius: 4px;
      margin-bottom: 4px;

      .failed-id {
        font-size: 12px;
        color: #909399;
        min-width: 80px;
      }

      .failed-reason {
        flex: 1;
        font-size: 13px;
        color: #606266;
      }
    }
  }
}

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

  .status-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .status-tag-animate {
    animation: statusZoomIn 0.3s ease;
  }

  .abnormal-tag {
    font-size: 11px;
  }

  .flow-expand-area {
    padding: 16px 24px;
  }

  .flow-loading {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #909399;
    padding: 20px 0;
  }

  .flow-detail-content {
    .el-timeline {
      padding-left: 0;
    }

    .el-card {
      margin-bottom: 4px;

      h4 {
        margin: 0 0 8px;
        font-size: 14px;
      }

      p {
        margin: 4px 0;
        font-size: 13px;
        color: #606266;
      }
    }
  }

  .violation-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    font-size: 13px;
    flex-wrap: wrap;

    .violation-operator,
    .violation-ip {
      color: #909399;
    }

    .violation-detail {
      color: #606266;
    }
  }

  .prerequisite-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .prerequisite-tag {
    font-size: 13px;
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

  .mb-16 {
    margin-bottom: 16px;
  }

  .form-tip {
    display: block;
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }

  .preview-result {
    width: 100%;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;

    .preview-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;

      .label {
        color: #606266;
        font-size: 14px;
      }

      .value {
        font-weight: 600;
        font-size: 16px;
        color: #303133;

        &.excluded {
          color: #e6a23c;
        }
      }
    }

    .excluded-list {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e4e7ed;

      .excluded-title {
        font-size: 13px;
        font-weight: 500;
        color: #606266;
        margin-bottom: 8px;
      }

      .excluded-item {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        font-size: 13px;

        .reason {
          color: #909399;
        }
      }

      .excluded-more {
        font-size: 12px;
        color: #909399;
        text-align: center;
        padding: 4px 0;
      }
    }
  }
}

@keyframes statusZoomIn {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
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
