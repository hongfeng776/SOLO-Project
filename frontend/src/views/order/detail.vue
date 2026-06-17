<template>
  <div class="order-detail">
    <el-page-header @back="goBack" content="订单详情">
      <template #extra>
        <transition name="fade" mode="out-in">
          <div :key="orderInfo.status" class="action-buttons">
            <template v-for="btn in actionButtons" :key="btn.key">
              <el-button :type="btn.type" :loading="transitionLoading[btn.key] || false" @click="btn.handler">
                <el-icon v-if="btn.icon && !transitionLoading[btn.key]"><component :is="btn.icon" /></el-icon>
                {{ btn.label }}
              </el-button>
            </template>
          </div>
        </transition>
      </template>
    </el-page-header>

    <transition name="fade">
      <el-row
        v-if="orderInfo.status === OrderStatus.CANCELLED && cancelStatisticsData"
        :gutter="20"
        class="cancel-statistics-row"
      >
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <el-statistic title="今日取消率" :value="cancelStatisticsData.cancelRate" :precision="1" suffix="%" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <el-statistic title="用户取消次数" :value="cancelStatisticsData.byCancelType[1] || 0" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <el-statistic title="司机取消次数" :value="cancelStatisticsData.byCancelType[2] || 0" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <el-statistic title="系统超时次数" :value="cancelStatisticsData.byCancelType[3] || 0" />
          </el-card>
        </el-col>
      </el-row>
    </transition>

    <el-row :gutter="20" class="content">
      <el-col :span="16">
        <el-card class="info-card" :class="{ 'is-editing': isEditing }">
          <template #header>
            <span class="card-title">订单信息</span>
            <div v-if="isEditing" class="edit-actions">
              <el-button type="primary" size="small" :loading="editSubmitting" @click="handleEditSave">
                保存
              </el-button>
              <el-button size="small" @click="handleEditCancel">取消</el-button>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">{{ orderInfo.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <div class="status-with-tags">
                <div :key="orderInfo.status" class="status-zoom-in">
                  <StatusTag
                    :status="orderInfo.status"
                    :status-map="OrderStatusMap"
                    :color-map="OrderStatusColorMap"
                  />
                </div>
                <el-tag
                  v-if="afterSaleTicketCount > 0"
                  type="danger"
                  size="small"
                  effect="dark"
                  class="after-sale-tag"
                >
                  有售后
                </el-tag>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="运力类型">
              <StatusTag
                :status="orderInfo.capacityType"
                :status-map="CapacityTypeMap"
                :color-map="CapacityTypeColorMap"
              />
            </el-descriptions-item>
            <el-descriptions-item label="距离">
              <template v-if="isEditing">
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
              </template>
              <template v-else>
                {{ orderInfo.distance }} 公里
              </template>
            </el-descriptions-item>
            <el-descriptions-item label="预估时长">
              <template v-if="isEditing">
                <el-input-number
                  v-model="editForm.duration"
                  :min="0"
                  :precision="0"
                  :step="5"
                  style="width: 100%"
                  @focus="handleFieldFocus('duration')"
                  @blur="handleFieldBlur"
                />
              </template>
              <template v-else>
                {{ orderInfo.duration }} 分钟
              </template>
            </el-descriptions-item>
            <el-descriptions-item
              label="预估金额"
              :class="{ 'price-highlight': priceHighlighted }"
            >
              <span class="estimated-price">¥{{ editForm.estimatedPrice || orderInfo.estimatedPrice }}</span>
              <div v-if="isEditing && priceValidateResult" class="price-validate-tip" :class="priceValidateResult.isValid ? 'success' : 'error'">
                <el-icon v-if="priceValidateResult.isValid"><CircleCheck /></el-icon>
                <el-icon v-else><Warning /></el-icon>
                <span>{{ priceValidateResult.isValid ? '费用匹配正常' : '预估费用偏差超过' + priceValidateResult.threshold + '%，建议核对里程' }}</span>
              </div>
            </el-descriptions-item>
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
                <template v-if="isEditing">
                  <el-input
                    v-model="editForm.startAddress"
                    type="textarea"
                    :rows="2"
                    class="edit-address"
                    @focus="handleFieldFocus('startAddress')"
                    @blur="handleFieldBlur"
                  />
                </template>
                <span v-else class="address">{{ orderInfo.startAddress }}</span>
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
                <template v-if="isEditing">
                  <el-input
                    v-model="editForm.endAddress"
                    type="textarea"
                    :rows="2"
                    class="edit-address"
                    @focus="handleFieldFocus('endAddress')"
                    @blur="handleFieldBlur"
                  />
                </template>
                <span v-else class="address">{{ orderInfo.endAddress }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="info-card billing-scenario-card" v-if="billingDetailData">
          <template #header>
            <span class="card-title">场景适配</span>
          </template>
          <el-row :gutter="16" class="scenario-row">
            <el-col :span="6" v-for="scenario in scenarios" :key="scenario.key">
              <div
                class="scenario-card"
                :class="{ active: activeScenario === scenario.key }"
                @click="handleScenarioChange(scenario.key)"
              >
                <div class="scenario-name">{{ scenario.name }}</div>
                <div class="scenario-value">{{ getCurrentScenarioValue(scenario.key) }}</div>
                <div class="scenario-surge" :class="{ 'has-surge': getScenarioSurge(scenario.key) > 1 }">
                  溢价 {{ getScenarioSurge(scenario.key).toFixed(1) }}x
                </div>
              </div>
            </el-col>
          </el-row>
          <el-divider />
          <div class="billing-table-wrapper">
            <el-table
              :data="billingDetailData.billingItems"
              border
              :row-class-name="billingTableRowClassName"
              class="billing-detail-table"
            >
              <el-table-column prop="ruleName" label="规则名称" min-width="120" resizable />
              <el-table-column label="类型" width="100" resizable>
                <template #default="{ row }">
                  <el-tag :type="getRuleTypeTagType(row.ruleType)" size="small">
                    {{ RuleTypeMap[row.ruleType] }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="basePrice" label="基础价" width="100" resizable>
                <template #default="{ row }">¥{{ row.basePrice || 0 }}</template>
              </el-table-column>
              <el-table-column prop="perKmPrice" label="里程费" width="100" resizable>
                <template #default="{ row }">¥{{ row.perKmPrice || 0 }}/km</template>
              </el-table-column>
              <el-table-column prop="perMinPrice" label="时长费" width="100" resizable>
                <template #default="{ row }">¥{{ row.perMinPrice || 0 }}/min</template>
              </el-table-column>
              <el-table-column prop="surgeRatio" label="溢价倍数" width="100" resizable>
                <template #default="{ row }">{{ row.surgeRatio.toFixed(1) }}x</template>
              </el-table-column>
              <el-table-column prop="itemTotal" label="小计" width="120" resizable align="right">
                <template #default="{ row }">
                  <span class="item-total">¥{{ row.itemTotal?.toFixed(2) || '0.00' }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <el-divider />
          <div class="billing-summary">
            <div class="summary-item">
              <span class="label">基础价：</span>
              <span class="value">¥{{ billingDetailData.basePrice.toFixed(2) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">里程费：</span>
              <span class="value">¥{{ billingDetailData.totalDistanceFee.toFixed(2) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">时长费：</span>
              <span class="value">¥{{ billingDetailData.totalDurationFee.toFixed(2) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">溢价：</span>
              <span class="value surge">¥{{ billingDetailData.totalSurgeAmount.toFixed(2) }}</span>
            </div>
            <div class="summary-item total">
              <span class="label">预估总价：</span>
              <span class="value">¥{{ billingDetailData.estimatedTotal.toFixed(2) }}</span>
            </div>
          </div>
          <el-divider />
          <div class="change-logs-section">
            <div class="section-title">变更日志</div>
            <el-timeline v-if="pricingChangeLogs.length > 0">
              <el-timeline-item
                v-for="log in pricingChangeLogs"
                :key="log.id"
                :timestamp="formatDate(log.createTime)"
                placement="top"
              >
                <el-card shadow="never" class="log-card">
                  <div class="log-header">
                    <el-tag
                      :color="PricingChangeTypeColorMap[log.changeType] || '#909399'"
                      size="small"
                      effect="dark"
                    >
                      {{ PricingChangeTypeMap[log.changeType] || log.changeType }}
                    </el-tag>
                    <span class="log-operator">操作人：{{ log.operatorName || '系统' }}</span>
                  </div>
                  <div v-if="log.priceDiff !== 0" class="log-price-diff" :class="{ 'price-up': log.priceDiff > 0, 'price-down': log.priceDiff < 0 }">
                    价格变动：{{ log.priceDiff > 0 ? '+' : '' }}{{ log.priceDiff.toFixed(2) }}元
                  </div>
                  <div v-if="log.remark" class="log-remark">备注：{{ log.remark }}</div>
                  <div v-if="log.hasException === 1" class="log-exception">
                    <el-icon><Warning /></el-icon>
                    <span>{{ log.exceptionType }}：{{ log.exceptionDetail }}</span>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无变更日志" :image-size="60" />
          </div>
        </el-card>

        <el-card class="info-card billing-section">
          <template #header>
            <span class="card-title">计费信息</span>
            <div class="billing-actions">
              <el-button
                type="primary"
                size="small"
                :disabled="!canEditBilling || userRole < 2"
                @click="handleEditBilling"
              >
                <el-icon><Edit /></el-icon>
                修改计费
              </el-button>
              <el-tooltip
                v-if="!canEditBilling"
                placement="top"
                :show-after="500"
              >
                <template #content>
                  <div v-if="billingEditConditions">
                    <div v-if="billingEditConditions.hasSettled">订单已结算</div>
                    <div v-if="billingEditConditions.hasTicket">存在售后工单</div>
                    <div v-if="billingEditConditions.hasArrears">存在欠费</div>
                  </div>
                </template>
                <el-icon class="warning-icon"><Warning /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div v-if="billingDetailData" class="billing-info">
            <div class="billing-row">
              <div class="billing-label">基础价</div>
              <div class="billing-value">¥{{ billingDetailData.basePrice.toFixed(2) }}</div>
            </div>
            <div class="billing-row">
              <div class="billing-label">里程费</div>
              <div class="billing-value">¥{{ billingDetailData.perKmPrice.toFixed(2) }}/公里 × {{ billingDetailData.distance }}公里 = ¥{{ billingDetailData.totalDistanceFee.toFixed(2) }}</div>
            </div>
            <div class="billing-row">
              <div class="billing-label">时长费</div>
              <div class="billing-value">¥{{ billingDetailData.perMinPrice.toFixed(2) }}/分钟 × {{ billingDetailData.duration }}分钟 = ¥{{ billingDetailData.totalDurationFee.toFixed(2) }}</div>
            </div>
            <div class="billing-row" v-if="billingDetailData.totalSurgeAmount > 0">
              <div class="billing-label">溢价金额</div>
              <div class="billing-value surge">¥{{ billingDetailData.totalSurgeAmount.toFixed(2) }}</div>
            </div>
            <el-divider />
            <div class="billing-row total">
              <div class="billing-label">预估总价</div>
              <div class="billing-value">¥{{ billingDetailData.estimatedTotal.toFixed(2) }}</div>
            </div>
          </div>
          <el-empty v-else description="加载计费信息中..." :image-size="60" />
        </el-card>

        <el-card class="info-card after-sale-card">
          <template #header>
            <span class="card-title">售后纠纷</span>
            <div class="after-sale-actions">
              <el-button
                v-if="hasActiveTicket"
                type="warning"
                size="small"
                @click="handleViewExistingTicket"
              >
                <el-icon><Warning /></el-icon>
                已有售后工单
              </el-button>
              <el-button
                v-else
                type="primary"
                size="small"
                :disabled="!canInitiateAfterSale"
                @click="handleInitiateAfterSale"
              >
                <el-icon><Plus /></el-icon>
                发起售后
              </el-button>
            </div>
          </template>
          <el-table :data="afterSaleTickets" border v-if="afterSaleTickets.length > 0">
            <el-table-column prop="ticketNo" label="工单号" width="180" />
            <el-table-column label="纠纷类型" width="120">
              <template #default="{ row }">
                <el-tag :color="DisputeTypeColorMap[row.disputeType]" effect="dark" size="small">
                  {{ DisputeTypeMap[row.disputeType] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :color="TicketStatusColorMap[row.status]" effect="dark" size="small">
                  {{ TicketStatusMap[row.status] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="问题描述" show-overflow-tooltip>
              <template #default="{ row }">
                <el-tooltip :content="row.content" placement="top" :show-after="500">
                  <span class="text-ellipsis">{{ row.content }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="refundAmount" label="申请退款" width="100">
              <template #default="{ row }">
                <span v-if="row.refundAmount > 0">¥{{ row.refundAmount.toFixed(2) }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="170">
              <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right" align="center">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === TicketStatus.PENDING_REVIEW && canProcessTicket"
                  type="primary"
                  size="small"
                  link
                  @click="handleProcessTicket(row)"
                >
                  审核
                </el-button>
                <el-button
                  type="primary"
                  size="small"
                  link
                  @click="handleViewTicketTrace(row)"
                >
                  溯源
                </el-button>
                <el-button
                  v-if="row.status === TicketStatus.PENDING_REVIEW || row.status === TicketStatus.REVIEWING"
                  type="info"
                  size="small"
                  link
                  @click="handleViewAuditLogs(row)"
                >
                  日志
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无售后工单" :image-size="60" />
        </el-card>

        <el-card class="info-card" ref="timelineCardRef">
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

        <el-card class="info-card log-card" ref="logCardRef" :class="{ 'highlight': logHighlighted }">
          <template #header>
            <span class="card-title">订单日志</span>
          </template>
          <el-alert
            v-if="flowDetailData && flowDetailData.violations.length > 0"
            type="error"
            :closable="false"
            class="violation-alert"
          >
            <template #title>发现 {{ flowDetailData.violations.length }} 条违规记录</template>
            <div v-for="v in flowDetailData.violations" :key="v.id" class="violation-item">
              <span>{{ v.violationType }} - {{ v.detail || '无详情' }}</span>
              <span class="violation-time">{{ formatDate(v.createTime) }}</span>
            </div>
          </el-alert>
          <el-timeline>
            <el-timeline-item
              v-for="log in flowDetailLogs"
              :key="log.id"
              :timestamp="formatDate(log.createTime)"
              placement="top"
            >
              <div class="log-item">
                <div class="log-status">
                  <StatusTag
                    v-if="log.oldStatus !== null"
                    :status="log.oldStatus"
                    :status-map="OrderStatusMap"
                    :color-map="OrderStatusColorMap"
                  />
                  <el-icon v-if="log.oldStatus !== null" class="arrow"><ArrowRight /></el-icon>
                  <StatusTag
                    :status="log.newStatus"
                    :status-map="OrderStatusMap"
                    :color-map="OrderStatusColorMap"
                  />
                </div>
                <div class="log-info">
                  <span>操作人：{{ log.operatorName || '系统' }}</span>
                  <span v-if="log.operatorType">
                    ({{ log.operatorType === 1 ? '乘客' : log.operatorType === 2 ? '司机' : '系统' }})
                  </span>
                  <el-text v-if="log.operatorIP" size="small" type="info" class="log-ip">IP: {{ log.operatorIP }}</el-text>
                </div>
                <div v-if="log.changeReason" class="log-reason">
                  流转原因：{{ log.changeReason }}
                </div>
                <div v-if="log.cancelType !== null" class="log-cancel-info">
                  <el-tag :type="cancelTypeTagMap[log.cancelType]" size="small">
                    {{ cancelTypeNameMap[log.cancelType] || '未知' }}
                  </el-tag>
                  <el-tag
                    v-if="log.responsibility"
                    :type="responsibilityTagMap[log.responsibility] || 'info'"
                    size="small"
                    class="responsibility-tag"
                  >
                    {{ log.responsibility }}
                  </el-tag>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-if="flowDetailLogs.length === 0" description="暂无状态变更日志" :image-size="80" />
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
          <el-divider v-if="passengerReputationScore !== null" />
          <div v-if="passengerReputationScore !== null" class="reputation-info">
            <div class="reputation-label">信誉分</div>
            <div class="reputation-score" :class="{ 'low': passengerReputationScore < 80 }">
              {{ passengerReputationScore }}
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

    <transition name="slideDownFade">
      <el-dialog
        v-model="afterSaleSubmitDialogVisible"
        title="发起售后"
        width="600px"
        :close-on-click-modal="false"
      >
        <el-form :model="afterSaleForm" label-width="100px">
          <el-alert
            :title="getDisputeFlowTip()"
            :type="afterSaleForm.disputeType ? 'info' : 'warning'"
            :closable="false"
            class="mb-16"
            show-icon
          />
          <el-form-item
            label="纠纷类型"
            :class="{ 'has-error': !afterSaleForm.disputeType && submitValidationError }"
          >
            <el-radio-group v-model="afterSaleForm.disputeType">
              <el-radio :value="DisputeType.FEE_DISPUTE">
                <el-icon><Wallet /></el-icon>
                费用争议
              </el-radio>
              <el-radio :value="DisputeType.SERVICE_COMPLAINT">
                <el-icon><Warning /></el-icon>
                服务投诉
              </el-radio>
              <el-radio :value="DisputeType.LOST_ITEM">
                <el-icon><Goods /></el-icon>
                物品遗失
              </el-radio>
            </el-radio-group>
            <div v-if="!afterSaleForm.disputeType && submitValidationError" class="field-error">
              <el-icon><Warning /></el-icon>
              <span>请选择纠纷类型</span>
            </div>
          </el-form-item>
          <el-form-item
            label="问题描述"
            :class="{ 'has-error': afterSaleForm.disputeType && !afterSaleForm.content.trim() && submitValidationError }"
          >
            <el-input
              v-model="afterSaleForm.content"
              type="textarea"
              :rows="5"
              placeholder="请详细描述您遇到的问题..."
              @input="handleSubmitValidation"
            />
            <div v-if="afterSaleForm.disputeType && !afterSaleForm.content.trim() && submitValidationError" class="field-error">
              <el-icon><Warning /></el-icon>
              <span>请填写问题描述</span>
            </div>
          </el-form-item>
          <el-form-item
            label="凭证上传"
            :class="{ 'has-error': afterSaleForm.disputeType === DisputeType.FEE_DISPUTE && afterSaleForm.evidences.length === 0 && submitValidationError }"
          >
            <el-upload
              v-model:file-list="afterSaleFileList"
              :action="uploadUrl"
              :limit="9"
              list-type="picture-card"
              :on-success="handleUploadSuccess"
              :on-remove="handleUploadRemove"
              :before-upload="handleBeforeUpload"
              accept="image/*"
            >
              <el-icon><Plus /></el-icon>
            </el-upload>
            <div v-if="afterSaleForm.disputeType === DisputeType.FEE_DISPUTE && afterSaleForm.evidences.length === 0 && submitValidationError" class="field-error">
              <el-icon><Warning /></el-icon>
              <span>费用争议必须至少上传1张凭证</span>
            </div>
            <div v-if="afterSaleForm.disputeType === DisputeType.FEE_DISPUTE" class="form-tip">
              费用争议需提供凭证，最多上传9张图片
            </div>
          </el-form-item>
          <el-form-item
            v-if="afterSaleForm.disputeType === DisputeType.FEE_DISPUTE"
            label="退款金额"
          >
            <el-input-number
              v-model="afterSaleForm.refundAmount"
              :min="0"
              :max="orderInfo.actualPrice || orderInfo.estimatedPrice || 500"
              :precision="2"
              :step="1"
              style="width: 100%"
            />
            <div class="form-tip">
              最高可申请退款 ¥{{ (orderInfo.actualPrice || orderInfo.estimatedPrice || 500).toFixed(2) }}
            </div>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="afterSaleSubmitDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :disabled="!canSubmitAfterSale"
            :loading="afterSaleSubmitting"
            @click="handleSubmitAfterSale"
          >
            提交售后
          </el-button>
        </template>
      </el-dialog>
    </transition>

    <transition name="slideDownFade">
      <el-dialog
        v-model="afterSaleProcessDialogVisible"
        title="处理售后工单"
        width="560px"
        :close-on-click-modal="false"
      >
        <el-descriptions :column="2" border class="mb-16" v-if="currentProcessTicket">
          <el-descriptions-item label="工单号">{{ currentProcessTicket.ticketNo }}</el-descriptions-item>
          <el-descriptions-item label="纠纷类型">
            <el-tag :color="DisputeTypeColorMap[currentProcessTicket.disputeType]" effect="dark" size="small">
              {{ DisputeTypeMap[currentProcessTicket.disputeType] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="申请退款" :span="2">
            ¥{{ currentProcessTicket.refundAmount?.toFixed(2) || '0.00' }}
          </el-descriptions-item>
          <el-descriptions-item label="问题描述" :span="2">
            <el-tooltip :content="currentProcessTicket.content" placement="top" :show-after="500">
              <span class="text-ellipsis" style="display: block; max-width: 400px;">
                {{ currentProcessTicket.content }}
              </span>
            </el-tooltip>
          </el-descriptions-item>
        </el-descriptions>
        <el-form :model="processForm" label-width="120px">
          <el-form-item label="处理结果" required>
            <el-input
              v-model="processForm.handleResult"
              type="textarea"
              :rows="4"
              placeholder="请填写处理结果..."
            />
          </el-form-item>
          <el-form-item
            v-if="currentProcessTicket?.disputeType === DisputeType.FEE_DISPUTE"
            label="实际退款金额"
            required
          >
            <el-input-number
              v-model="processForm.actualRefundAmount"
              :min="0"
              :max="(currentProcessTicket?.refundAmount || 0) * REFUND_OVER_LIMIT_RATIO"
              :precision="2"
              :step="1"
              style="width: 100%"
            />
            <div v-if="processForm.actualRefundAmount > (currentProcessTicket?.refundAmount || 0)" class="field-error">
              <el-icon><Warning /></el-icon>
              <span>退款金额超过申请金额，将标记异常</span>
            </div>
          </el-form-item>
          <el-form-item
            v-if="processAction === 'reject'"
            label="驳回原因"
            required
          >
            <el-input
              v-model="processForm.rejectReason"
              type="textarea"
              :rows="3"
              placeholder="请填写驳回原因..."
            />
          </el-form-item>
          <el-form-item label="备注">
            <el-input
              v-model="processForm.remark"
              type="textarea"
              :rows="2"
              placeholder="选填"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="afterSaleProcessDialogVisible = false">取消</el-button>
          <el-button type="danger" :loading="afterSaleProcessing" @click="handleRejectTicket">
            驳回
          </el-button>
          <el-button type="success" :loading="afterSaleProcessing" @click="handleResolveTicket">
            解决
          </el-button>
        </template>
      </el-dialog>
    </transition>

    <transition name="slideDownFade">
      <el-dialog
        v-model="auditLogsDialogVisible"
        title="审核日志"
        width="700px"
      >
        <el-timeline v-if="auditLogs.length > 0">
          <el-timeline-item
            v-for="log in auditLogs"
            :key="log.id"
            :timestamp="formatDate(log.createTime)"
            placement="top"
            :type="log.hasException === 1 ? 'danger' : 'primary'"
          >
            <el-card
              shadow="never"
              class="audit-log-card"
              :class="{ 'has-exception': log.hasException === 1 }"
            >
              <div class="log-header">
                <el-tag
                  :color="OperationTypeColorMap[log.operationType] || '#909399'"
                  effect="dark"
                  size="small"
                >
                  {{ OperationTypeMap[log.operationType] || log.operationType }}
                </el-tag>
                <span class="log-operator">
                  操作人：{{ log.operatorName || '系统' }}
                  <span v-if="log.operatorRole">({{ log.operatorRole }})</span>
                </span>
                <span v-if="log.operatorIP" class="log-ip">IP：{{ log.operatorIP }}</span>
              </div>
              <div v-if="log.oldStatus !== null && log.newStatus !== null" class="log-status">
                <StatusTag :status="log.oldStatus" :status-map="TicketStatusMap" :color-map="TicketStatusColorMap" />
                <el-icon class="arrow"><ArrowRight /></el-icon>
                <StatusTag :status="log.newStatus" :status-map="TicketStatusMap" :color-map="TicketStatusColorMap" />
              </div>
              <div v-if="log.content" class="log-content">
                <el-tooltip :content="log.content" placement="top" :show-after="500">
                  <span class="text-ellipsis" style="display: block; max-width: 500px;">
                    {{ log.content }}
                  </span>
                </el-tooltip>
              </div>
              <div v-if="log.rejectReason" class="log-reject">
                驳回原因：{{ log.rejectReason }}
              </div>
              <div v-if="log.refundAmount > 0" class="log-refund">
                退款金额：¥{{ log.refundAmount.toFixed(2) }}
              </div>
              <div v-if="log.reputationImpact !== 0" class="log-reputation">
                信誉分：{{ log.reputationImpact > 0 ? '+' : '' }}{{ log.reputationImpact }}
              </div>
              <div v-if="log.hasException === 1" class="log-exception">
                <el-icon><Warning /></el-icon>
                <span>{{ log.exceptionType }}：{{ log.exceptionDetail }}</span>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无审核日志" :image-size="60" />
      </el-dialog>
    </transition>

    <TraceDialog v-model="traceDialogVisible" :order-no="orderInfo.orderNo" :ticket-id="currentTraceTicketId" />

    <el-dialog v-model="prerequisiteDialogVisible" title="流转条件校验" width="450px">
      <el-alert type="warning" :closable="false">
        <template #title>以下条件不满足，无法执行操作</template>
      </el-alert>
      <div class="prerequisite-failures">
        <div v-for="(f, i) in prerequisiteFailures" :key="i" class="failure-item">
          <el-icon><Warning /></el-icon>
          <span>{{ f.message }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="prerequisiteDialogVisible = false">知道了</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="cancelDialogVisible" title="取消订单" width="520px">
      <el-form label-width="100px">
        <el-form-item label="取消类型">
          <el-radio-group v-model="cancelForm.cancelType">
            <el-radio :value="1">用户主动取消</el-radio>
            <el-radio :value="2">司机主动取消</el-radio>
            <el-radio :value="3">系统超时取消</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="责任判定">
          <el-tag :type="cancelResponsibilityType" size="large">{{ cancelResponsibilityLabel }}</el-tag>
        </el-form-item>
        <el-form-item label="后置逻辑">
          <el-text type="info">{{ cancelPostLogic }}</el-text>
        </el-form-item>
        <el-form-item label="取消原因">
          <el-input
            v-model="cancelForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入取消原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="cancelSubmitting" @click="confirmCancel">确认取消</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="billingEditDialogVisible"
      title="修改计费参数"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-alert
        v-if="!canEditBilling"
        type="warning"
        :closable="false"
        class="mb-16"
      >
        <template #title>该订单不允许修改计费</template>
        <div v-if="billingEditConditions">
          <div v-if="billingEditConditions.hasSettled">订单已结算</div>
          <div v-if="billingEditConditions.hasTicket">存在售后工单</div>
          <div v-if="billingEditConditions.hasArrears">存在欠费</div>
        </div>
      </el-alert>
      <el-form :model="billingEditForm" label-width="120px">
        <el-form-item label="基础价(元)">
          <el-input-number
            v-model="billingEditForm.basePrice"
            :min="0"
            :precision="2"
            :step="1"
            style="width: 100%"
            :class="{ 'shake': shakeFields.basePrice }"
            @change="handleBillingFieldChange('basePrice')"
          />
        </el-form-item>
        <el-form-item label="里程费(元/公里)">
          <el-input-number
            v-model="billingEditForm.perKmPrice"
            :min="0"
            :precision="2"
            :step="0.1"
            style="width: 100%"
            :class="{ 'shake': shakeFields.perKmPrice }"
            @change="handleBillingFieldChange('perKmPrice')"
          />
        </el-form-item>
        <el-form-item label="时长费(元/分钟)">
          <el-input-number
            v-model="billingEditForm.perMinPrice"
            :min="0"
            :precision="2"
            :step="0.1"
            style="width: 100%"
            :class="{ 'shake': shakeFields.perMinPrice }"
            @change="handleBillingFieldChange('perMinPrice')"
          />
        </el-form-item>
        <el-form-item label="夜间溢价(元)">
          <el-input-number
            v-model="billingEditForm.nightSurcharge"
            :min="0"
            :precision="2"
            :step="1"
            style="width: 100%"
            :class="{ 'shake': shakeFields.nightSurcharge }"
            @change="handleBillingFieldChange('nightSurcharge')"
          />
        </el-form-item>
        <el-form-item
          label="溢价倍数"
          :class="{ 'has-error': billingValidationResult && billingValidationResult.estimatedTotal > billingValidationResult.industryThreshold }"
        >
          <el-input-number
            v-model="billingEditForm.surgeRatio"
            :min="1"
            :max="10"
            :precision="1"
            :step="0.1"
            style="width: 100%"
            :class="{ 'shake': shakeFields.surgeRatio }"
            @change="handleBillingFieldChange('surgeRatio')"
          />
          <div v-if="billingValidationResult && billingEditForm.surgeRatio > billingValidationResult.surgeLimit" class="field-error">
            <el-icon><Warning /></el-icon>
            <span>溢价倍数超过行业限制 {{ billingValidationResult.surgeLimit }}x</span>
          </div>
        </el-form-item>
        <el-divider />
        <el-form-item label="预估总价">
          <span
            class="estimated-total"
            :class="{ 'price-high': billingValidationResult && billingValidationResult.estimatedTotal > billingValidationResult.industryThreshold }"
          >
            ¥{{ billingValidationResult?.estimatedTotal.toFixed(2) || '0.00' }}
          </span>
          <div v-if="billingValidationResult && billingValidationResult.estimatedTotal > billingValidationResult.industryThreshold" class="field-error">
            <el-icon><Warning /></el-icon>
            <span>总价超过行业阈值 ¥{{ billingValidationResult.industryThreshold }}</span>
          </div>
        </el-form-item>
        <el-form-item v-if="billingValidationResult && !billingValidationResult.validation.isValid" label="校验结果">
          <div class="validation-errors">
            <div v-for="(e, i) in billingValidationResult.validation.exceptions" :key="i" class="validation-error">
              <el-tag type="danger" size="small">{{ e.field }}</el-tag>
              <span>{{ e.message }}</span>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="billingEditDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="billingEditSubmitting"
          :disabled="!canSubmitBillingEdit"
          @click="handleBillingEditSubmit"
        >
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules
} from 'element-plus'
import {
  Connection,
  Close,
  Edit,
  Search,
  Warning,
  CircleCheck,
  ArrowRight,
  Money,
  Refresh,
  Document,
  Wallet,
  View,
  Plus,
  Goods
} from '@element-plus/icons-vue'
import {
  getAfterSaleListApi,
  getSubmitPrerequisitesApi,
  submitAfterSaleApi,
  resolveTicketApi,
  rejectTicketApi,
  getTicketAuditLogsApi,
  getReputationRecordsApi
} from '@/api/after-sale'
import {
  DisputeType,
  DisputeTypeMap,
  DisputeTypeColorMap,
  TicketStatus,
  TicketStatusMap,
  TicketStatusColorMap,
  OperationTypeMap,
  OperationTypeColorMap,
  REFUND_OVER_LIMIT_RATIO,
  MAX_EVIDENCE_COUNT
} from '@/enums/after-sale'
import type {
  AfterSaleTicket,
  TicketAuditLogItem,
  SubmitPrerequisiteResult
} from '@/types/after-sale'
import StatusTag from '@/components/StatusTag/index.vue'
import TraceDialog from '@/components/TraceDialog/index.vue'
import { OrderStatusMap, OrderStatusColorMap, OrderStatus } from '@/enums/order'
import { CapacityTypeMap, CapacityTypeColorMap } from '@/enums/capacity'
import {
  RuleTypeMap,
  PricingChangeTypeMap,
  PricingChangeTypeColorMap,
  INDUSTRY_PRICE_THRESHOLD,
  SURGE_RATIO_LIMIT
} from '@/enums/pricing'
import { formatDate, formatPhone } from '@/utils/format'
import { useUserStore } from '@/store/modules/user'
import {
  getOrderDetailApi,
  getEditConditionsApi,
  validatePriceApi,
  updateOrderBaseInfoApi,
  getOrderStatusLogsApi,
  cancelOrderApi,
  completeOrderApi,
  getTransitionPrerequisitesApi,
  getCancelStatisticsApi,
  getFlowDetailApi
} from '@/api/order'
import {
  calculateBillingApi,
  updateOrderBillingApi,
  getPricingChangeLogsApi,
  validatePricingEditApi,
  getApplicableScenariosApi
} from '@/api/pricing'
import type { Order, PriceValidateResult, StatusLogItem, PrerequisiteResult, CancelStatistics, FlowDetailData } from '@/types/order'
import type {
  BillingDetailData,
  PricingChangeLogItem,
  PricingValidationResult,
  BillingScenario,
  BillingItem,
  EditConditionResult
} from '@/types/pricing'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const userRole = computed(() => {
  const role = userStore.userInfo?.role
  if (role === '1' || role === 1) return 1
  if (role === '6' || role === 6) return 6
  if (role === '2' || role === 2) return 2
  return 0
})

const orderInfo = reactive<Order>({
  id: 0,
  orderNo: '',
  passengerId: 0,
  passengerName: '',
  passengerPhone: '',
  passengerAvatar: '',
  driverId: null,
  driverName: null,
  driverPhone: null,
  driverAvatar: null,
  vehicleId: null,
  vehiclePlate: null,
  capacityType: 1,
  startAddress: '',
  startLng: 0,
  startLat: 0,
  endAddress: '',
  endLng: 0,
  endLat: 0,
  distance: 0,
  duration: 0,
  estimatedPrice: 0,
  actualPrice: null,
  status: 1,
  payStatus: 0,
  orderSource: 1,
  createTime: '',
  acceptTime: null,
  pickupTime: null,
  completeTime: null,
  cancelTime: null,
  cancelReason: null,
  availableActions: []
})

const statusLogs = ref<StatusLogItem[]>([])
const traceDialogVisible = ref(false)

const afterSaleTickets = ref<AfterSaleTicket[]>([])
const afterSaleTicketCount = ref(0)
const passengerReputationScore = ref<number | null>(null)
const afterSaleSubmitDialogVisible = ref(false)
const afterSaleProcessDialogVisible = ref(false)
const auditLogsDialogVisible = ref(false)
const afterSaleSubmitting = ref(false)
const afterSaleProcessing = ref(false)
const submitValidationError = ref(false)
const uploadUrl = '/api/upload'
const currentProcessTicket = ref<AfterSaleTicket | null>(null)
const currentTraceTicketId = ref<number | null>(null)
const processAction = ref<'resolve' | 'reject'>('resolve')
const auditLogs = ref<TicketAuditLogItem[]>([])
const prerequisitesResult = ref<SubmitPrerequisiteResult | null>(null)

const afterSaleForm = reactive({
  disputeType: null as DisputeType | null,
  content: '',
  refundAmount: 0,
  evidences: [] as string[]
})

const afterSaleFileList = ref<any[]>([])

const processForm = reactive({
  handleResult: '',
  actualRefundAmount: 0,
  rejectReason: '',
  remark: ''
})

const canInitiateAfterSale = computed(() => {
  return orderInfo.status === 5
})

const hasActiveTicket = computed(() => {
  return afterSaleTickets.value.some(
    t => t.status === TicketStatus.PENDING_REVIEW || t.status === TicketStatus.REVIEWING
  )
})

const canProcessTicket = computed(() => {
  return userRole.value === 1 || userRole.value === 6 || userRole.value === 2
})

const canSubmitAfterSale = computed(() => {
  if (!afterSaleForm.disputeType) return false
  if (!afterSaleForm.content.trim()) return false
  if (afterSaleForm.disputeType === DisputeType.FEE_DISPUTE && afterSaleForm.evidences.length === 0) return false
  return true
})
const isEditing = ref(false)
const editSubmitting = ref(false)
const priceValidateResult = ref<PriceValidateResult | null>(null)
const priceHighlighted = ref(false)
const logHighlighted = ref(false)
const logCardRef = ref()
const timelineCardRef = ref()

const transitionLoading = reactive<Record<string, boolean>>({})
const prerequisiteDialogVisible = ref(false)
const prerequisiteFailures = ref<PrerequisiteResult['failures']>([])
const cancelDialogVisible = ref(false)
const cancelSubmitting = ref(false)
const cancelForm = reactive({
  cancelType: 1,
  reason: ''
})
const flowDetailData = ref<FlowDetailData | null>(null)
const cancelStatisticsData = ref<CancelStatistics | null>(null)

const billingDetailData = ref<BillingDetailData | null>(null)
const billingEditDialogVisible = ref(false)
const billingEditSubmitting = ref(false)
const billingEditConditions = ref<EditConditionResult | null>(null)
const billingValidationResult = ref<PricingValidationResult | null>(null)
const pricingChangeLogs = ref<PricingChangeLogItem[]>([])
const scenarios = ref<BillingScenario[]>([])
const activeScenario = ref('time')
const shakeFields = reactive<Record<string, boolean>>({})

const billingEditForm = reactive({
  basePrice: 0,
  perKmPrice: 0,
  perMinPrice: 0,
  nightSurcharge: 0,
  surgeRatio: 1.0
})

const canEditBilling = computed(() => {
  if (!billingEditConditions) return false
  return !billingEditConditions.hasSettled && !billingEditConditions.hasTicket && !billingEditConditions.hasArrears
})

const canSubmitBillingEdit = computed(() => {
  if (!canEditBilling.value) return false
  if (!billingValidationResult.value) return false
  if (billingValidationResult.value.estimatedTotal > billingValidationResult.value.industryThreshold) return false
  if (billingEditForm.surgeRatio > billingValidationResult.value.surgeLimit) return false
  return true
})

const cancelTypeNameMap: Record<number, string> = {
  1: '用户主动取消',
  2: '司机主动取消',
  3: '系统超时取消'
}

const cancelTypeTagMap: Record<number, string> = {
  1: 'warning',
  2: 'danger',
  3: 'info'
}

const cancelResponsibilityMap: Record<number, { label: string; tagType: string }> = {
  1: { label: '乘客责任', tagType: 'warning' },
  2: { label: '司机责任', tagType: 'danger' },
  3: { label: '平台责任', tagType: 'info' }
}

const cancelPostLogicMap: Record<number, string> = {
  1: '用户主动取消订单，费用将按取消规则退还，可能产生取消费用',
  2: '司机主动取消订单，将记录司机责任，影响司机评分和服务分',
  3: '系统超时自动取消，平台将自动处理退款，不产生取消费用'
}

const responsibilityTagMap: Record<string, string> = {
  '乘客责任': 'warning',
  '司机责任': 'danger',
  '平台责任': 'info'
}

const cancelResponsibilityLabel = computed(() => cancelResponsibilityMap[cancelForm.cancelType]?.label || '')
const cancelResponsibilityType = computed(() => cancelResponsibilityMap[cancelForm.cancelType]?.tagType || 'info')
const cancelPostLogic = computed(() => cancelPostLogicMap[cancelForm.cancelType] || '')

const flowDetailLogs = computed(() => {
  if (flowDetailData.value) {
    return flowDetailData.value.statusLogs
  }
  return statusLogs.value
})

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

const actionButtons = computed(() => {
  const status = orderInfo.status
  const buttons: Array<{ key: string; label: string; type: string; icon?: any; handler: () => void }> = []

  switch (status) {
    case OrderStatus.PENDING:
      buttons.push(
        { key: 'dispatch', label: '派单', type: 'primary', icon: Connection, handler: handleDispatch },
        { key: 'cancel', label: '取消订单', type: 'danger', icon: Close, handler: handleCancel },
        { key: 'edit', label: '编辑订单', type: 'primary', icon: Edit, handler: handleEdit },
        { key: 'trace', label: '溯源', type: 'info', icon: Search, handler: handleTrace }
      )
      break
    case OrderStatus.DISPATCHED:
      buttons.push(
        { key: 'pickup', label: '确认接驾', type: 'success', handler: handlePickup },
        { key: 'reassign', label: '改派司机', type: 'primary', handler: handleReassign },
        { key: 'cancel', label: '取消', type: 'danger', icon: Close, handler: handleCancel },
        { key: 'edit', label: '编辑', type: 'primary', icon: Edit, handler: handleEdit },
        { key: 'trace', label: '溯源', type: 'info', icon: Search, handler: handleTrace }
      )
      break
    case OrderStatus.PICKING_UP:
      buttons.push(
        { key: 'start', label: '开始行程', type: 'success', handler: handleStartTrip },
        { key: 'cancel', label: '取消', type: 'danger', icon: Close, handler: handleCancel },
        { key: 'edit', label: '编辑', type: 'primary', icon: Edit, handler: handleEdit },
        { key: 'trace', label: '溯源', type: 'info', icon: Search, handler: handleTrace }
      )
      break
    case OrderStatus.IN_PROGRESS:
      buttons.push(
        { key: 'complete', label: '完成订单', type: 'success', handler: handleComplete },
        { key: 'edit', label: '编辑', type: 'primary', icon: Edit, handler: handleEdit },
        { key: 'trace', label: '溯源', type: 'info', icon: Search, handler: handleTrace }
      )
      break
    case OrderStatus.COMPLETED:
      buttons.push(
        { key: 'settle', label: '财务对账', type: 'primary', icon: Money, handler: handleSettle },
        { key: 'resettle', label: '重新结算', type: 'warning', icon: Refresh, handler: handleResettle },
        { key: 'trace', label: '溯源', type: 'info', icon: Search, handler: handleTrace },
        { key: 'log', label: '查看日志', type: 'primary', icon: Document, handler: handleViewLog }
      )
      break
    case OrderStatus.CANCELLED:
      buttons.push(
        { key: 'refund', label: '申请退款', type: 'warning', icon: Wallet, handler: handleRefund },
        { key: 'trace', label: '溯源', type: 'info', icon: Search, handler: handleTrace },
        { key: 'log', label: '查看日志', type: 'primary', icon: Document, handler: handleViewLog }
      )
      break
    case OrderStatus.EXPIRED:
      buttons.push(
        { key: 'trace', label: '溯源', type: 'info', icon: Search, handler: handleTrace },
        { key: 'log', label: '查看日志', type: 'primary', icon: Document, handler: handleViewLog }
      )
      break
    default:
      buttons.push(
        { key: 'trace', label: '溯源', type: 'info', icon: Search, handler: handleTrace }
      )
  }

  return buttons
})

const getRuleTypeTagType = (ruleType: number) => {
  const map: Record<number, string> = {
    1: '',
    2: 'warning',
    3: 'success',
    4: 'danger',
    5: 'info'
  }
  return map[ruleType] || ''
}

const getCurrentScenarioValue = (key: string) => {
  if (!billingDetailData.value) return '-'
  const map: Record<string, string> = {
    time: billingDetailData.value.timeInfo?.period || '-',
    weather: billingDetailData.value.weatherCondition || '-',
    holiday: billingDetailData.value.holidayType || '-',
    vehicle: CapacityTypeMap[orderInfo.capacityType] || '-'
  }
  return map[key] || '-'
}

const getScenarioSurge = (key: string) => {
  if (!billingDetailData.value) return 1.0
  const items = billingDetailData.value.billingItems
  const typeMap: Record<string, number> = {
    time: 2,
    weather: 3,
    holiday: 4,
    vehicle: 5
  }
  const item = items.find(i => i.ruleType === typeMap[key])
  return item?.surgeRatio || 1.0
}

const billingTableRowClassName = ({ row }: { row: BillingItem }) => {
  if (!billingDetailData.value?.validation) return ''
  const hasError = billingDetailData.value.validation.exceptions.some(
    e => e.field === row.ruleName || e.field.includes(String(row.ruleId))
  )
  return hasError ? 'billing-row-error' : ''
}

const goBack = () => {
  router.back()
}

const executeTransition = async (btnKey: string, targetStatus: number, action: () => Promise<void>) => {
  if (transitionLoading[btnKey]) return
  transitionLoading[btnKey] = true
  const startTime = Date.now()

  try {
    const res = await getTransitionPrerequisitesApi(orderInfo.id, targetStatus)
    if (!res.data.valid) {
      prerequisiteFailures.value = res.data.failures
      prerequisiteDialogVisible.value = true
      return
    }
    await action()
  } catch (error: any) {
    if (error?.response?.status === 429 || error?.status === 429) {
      ElMessage.warning('操作处理中，请勿重复提交')
    } else {
      ElMessage.error(error.message || '操作失败')
    }
  } finally {
    const elapsed = Date.now() - startTime
    const remaining = Math.max(0, 300 - elapsed)
    setTimeout(() => {
      transitionLoading[btnKey] = false
    }, remaining)
  }
}

const handleDispatch = () => {
  executeTransition('dispatch', OrderStatus.DISPATCHED, async () => {
    ElMessage.info('派单功能开发中')
  })
}

const handleCancel = () => {
  executeTransition('cancel', OrderStatus.CANCELLED, async () => {
    cancelForm.cancelType = 1
    cancelForm.reason = ''
    cancelDialogVisible.value = true
  })
}

const confirmCancel = async () => {
  if (!cancelForm.reason.trim()) {
    ElMessage.warning('请输入取消原因')
    return
  }
  cancelSubmitting.value = true
  try {
    await cancelOrderApi(orderInfo.id, cancelForm.reason, cancelForm.cancelType)
    ElMessage.success('订单已取消')
    cancelDialogVisible.value = false
    loadDetail()
    loadStatusLogs()
    loadFlowDetail()
    loadCancelStatistics()
  } catch (error: any) {
    ElMessage.error(error.message || '取消失败')
  } finally {
    cancelSubmitting.value = false
  }
}

const handlePickup = () => {
  executeTransition('pickup', OrderStatus.PICKING_UP, async () => {
    ElMessage.info('确认接驾功能开发中')
  })
}

const handleReassign = () => {
  ElMessage.info('改派司机功能开发中')
}

const handleStartTrip = () => {
  executeTransition('start', OrderStatus.IN_PROGRESS, async () => {
    ElMessage.info('开始行程功能开发中')
  })
}

const handleComplete = () => {
  executeTransition('complete', OrderStatus.COMPLETED, async () => {
    await completeOrderApi(orderInfo.id)
    ElMessage.success('订单已完成')
    loadDetail()
    loadStatusLogs()
    loadFlowDetail()
  })
}

const handleSettle = () => {
  ElMessage.info('财务对账功能开发中')
}

const handleResettle = () => {
  ElMessage.info('重新结算功能开发中')
}

const handleRefund = () => {
  ElMessage.info('申请退款功能开发中')
}

const getDisputeFlowTip = () => {
  if (!afterSaleForm.disputeType) {
    return '请选择纠纷类型，不同类型对应不同审核流程'
  }
  const flowMap: Record<number, string> = {
    [DisputeType.FEE_DISPUTE]: '费用争议 → 财务审核，终审',
    [DisputeType.SERVICE_COMPLAINT]: '服务投诉 → 客服审核，复核',
    [DisputeType.LOST_ITEM]: '物品遗失 → 物流审核，复核'
  }
  return flowMap[afterSaleForm.disputeType] || ''
}

const handleSubmitValidation = () => {
  submitValidationError.value = false
}

const handleBeforeUpload = (file: any) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  return true
}

const handleUploadSuccess = (response: any, file: any) => {
  if (response?.url) {
    afterSaleForm.evidences.push(response.url)
  } else if (file?.url) {
    afterSaleForm.evidences.push(file.url)
  }
}

const handleUploadRemove = (file: any) => {
  const url = file?.url || file?.response?.url
  const index = afterSaleForm.evidences.indexOf(url)
  if (index > -1) {
    afterSaleForm.evidences.splice(index, 1)
  }
}

const loadAfterSaleTickets = async () => {
  if (!orderInfo.id) return
  try {
    const res = await getAfterSaleListApi({
      page: 1,
      pageSize: 100,
      orderNo: orderInfo.orderNo
    })
    afterSaleTickets.value = res.data.list || []
    afterSaleTicketCount.value = afterSaleTickets.value.length
  } catch (e: any) {
    console.error('加载售后工单失败', e)
  }
}

const loadReputationScore = async () => {
  if (!orderInfo.passengerId) return
  try {
    const res = await getReputationRecordsApi(orderInfo.passengerId, { page: 1, pageSize: 1 })
    const records = res.data.list || []
    if (records.length > 0) {
      passengerReputationScore.value = records[0].afterScore
    }
  } catch (e: any) {
    console.error('加载信誉分失败', e)
  }
}

const handleInitiateAfterSale = async () => {
  if (!orderInfo.id || !orderInfo.passengerId) return
  
  try {
    const res = await getSubmitPrerequisitesApi(orderInfo.id, orderInfo.passengerId)
    prerequisitesResult.value = res.data
    
    if (!res.data.orderCompleted) {
      ElMessage.warning('订单未完成无法发起售后')
      return
    }
    if (!res.data.withinValidPeriod) {
      ElMessage.warning('售后时效已过期（需在30天内发起）')
      return
    }
    if (res.data.hasDuplicateTicket) {
      ElMessage.warning('该订单已有进行中的售后工单')
      return
    }
    
    afterSaleForm.disputeType = null
    afterSaleForm.content = ''
    afterSaleForm.refundAmount = 0
    afterSaleForm.evidences = []
    afterSaleFileList.value = []
    submitValidationError.value = false
    afterSaleSubmitDialogVisible.value = true
  } catch (error: any) {
    ElMessage.error(error.message || '前置校验失败')
  }
}

const handleViewExistingTicket = () => {
  const activeTicket = afterSaleTickets.value.find(
    t => t.status === TicketStatus.PENDING_REVIEW || t.status === TicketStatus.REVIEWING
  )
  if (activeTicket) {
    handleViewTicketTrace(activeTicket)
  }
}

const handleSubmitAfterSale = async () => {
  submitValidationError.value = true
  
  if (!afterSaleForm.disputeType) {
    ElMessage.warning('请选择纠纷类型')
    return
  }
  if (!afterSaleForm.content.trim()) {
    ElMessage.warning('请填写问题描述')
    return
  }
  if (afterSaleForm.disputeType === DisputeType.FEE_DISPUTE && afterSaleForm.evidences.length === 0) {
    ElMessage.warning('请上传凭证')
    return
  }
  
  const startTime = Date.now()
  afterSaleSubmitting.value = true
  
  try {
    await submitAfterSaleApi(orderInfo.id, {
      disputeType: afterSaleForm.disputeType,
      content: afterSaleForm.content,
      refundAmount: afterSaleForm.disputeType === DisputeType.FEE_DISPUTE ? afterSaleForm.refundAmount : undefined,
      evidences: afterSaleForm.evidences,
      passengerId: orderInfo.passengerId,
      passengerName: orderInfo.passengerName,
      passengerPhone: orderInfo.passengerPhone
    })
    
    ElMessage.success('售后提交成功')
    afterSaleSubmitDialogVisible.value = false
    loadAfterSaleTickets()
    loadReputationScore()
  } catch (error: any) {
    ElMessage.error(error.message || '提交失败')
  } finally {
    const elapsed = Date.now() - startTime
    const remaining = Math.max(0, 300 - elapsed)
    setTimeout(() => {
      afterSaleSubmitting.value = false
    }, remaining)
  }
}

const handleProcessTicket = (ticket: AfterSaleTicket) => {
  if (userRole.value !== 1 && userRole.value !== 6 && userRole.value !== 2) {
    ElMessage.warning('您没有权限处理售后工单')
    return
  }
  
  currentProcessTicket.value = ticket
  processForm.handleResult = ''
  processForm.actualRefundAmount = ticket.refundAmount || 0
  processForm.rejectReason = ''
  processForm.remark = ''
  processAction.value = 'resolve'
  afterSaleProcessDialogVisible.value = true
}

const handleResolveTicket = async () => {
  if (!currentProcessTicket.value) return
  
  if (!processForm.handleResult.trim()) {
    ElMessage.warning('请填写处理结果')
    return
  }
  if (currentProcessTicket.value.disputeType === DisputeType.FEE_DISPUTE && processForm.actualRefundAmount < 0) {
    ElMessage.warning('请填写实际退款金额')
    return
  }
  
  processAction.value = 'resolve'
  afterSaleProcessing.value = true
  
  try {
    const data: any = {
      handleResult: processForm.handleResult,
      remark: processForm.remark
    }
    if (currentProcessTicket.value.disputeType === DisputeType.FEE_DISPUTE) {
      data.actualRefundAmount = processForm.actualRefundAmount
    }
    
    await resolveTicketApi(currentProcessTicket.value.id, data)
    ElMessage.success('工单已解决')
    afterSaleProcessDialogVisible.value = false
    loadAfterSaleTickets()
    loadReputationScore()
  } catch (error: any) {
    ElMessage.error(error.message || '处理失败')
  } finally {
    afterSaleProcessing.value = false
  }
}

const handleRejectTicket = async () => {
  if (!currentProcessTicket.value) return
  
  if (!processForm.handleResult.trim()) {
    ElMessage.warning('请填写处理结果')
    return
  }
  if (!processForm.rejectReason.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }
  
  processAction.value = 'reject'
  afterSaleProcessing.value = true
  
  try {
    await rejectTicketApi(currentProcessTicket.value.id, {
      rejectReason: processForm.rejectReason,
      remark: processForm.remark
    })
    ElMessage.success('工单已驳回')
    afterSaleProcessDialogVisible.value = false
    loadAfterSaleTickets()
    loadReputationScore()
  } catch (error: any) {
    ElMessage.error(error.message || '处理失败')
  } finally {
    afterSaleProcessing.value = false
  }
}

const handleViewAuditLogs = async (ticket: AfterSaleTicket) => {
  auditLogs.value = []
  auditLogsDialogVisible.value = true
  try {
    const res = await getTicketAuditLogsApi(ticket.id, { page: 1, pageSize: 50 })
    auditLogs.value = res.data.list || []
  } catch (error: any) {
    ElMessage.error(error.message || '加载审核日志失败')
  }
}

const handleViewTicketTrace = (ticket: AfterSaleTicket) => {
  currentTraceTicketId.value = ticket.id
  traceDialogVisible.value = true
}

const handleTrace = () => {
  traceDialogVisible.value = true
}

const handleViewLog = async () => {
  if (logCardRef.value) {
    logCardRef.value.$el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    logHighlighted.value = true
    setTimeout(() => {
      logHighlighted.value = false
    }, 2000)
  }
}

const handleEdit = async () => {
  try {
    const res = await getEditConditionsApi(orderInfo.id)
    if (!res.data.canEdit) {
      ElMessageBox.alert(
        `该订单不可编辑，原因：\n${res.data.reasons.join('\n')}`,
        '提示',
        { type: 'warning' }
      )
      return
    }
    editForm.startAddress = orderInfo.startAddress
    editForm.endAddress = orderInfo.endAddress
    editForm.distance = orderInfo.distance
    editForm.duration = orderInfo.duration
    editForm.estimatedPrice = orderInfo.estimatedPrice
    priceValidateResult.value = null
    isEditing.value = true
  } catch (error: any) {
    ElMessage.error(error.message || '获取编辑条件失败')
  }
}

const handleEditCancel = () => {
  isEditing.value = false
  priceValidateResult.value = null
  priceHighlighted.value = false
}

const handleFieldFocus = (field: string) => {
  if (field === 'distance' || field === 'duration') {
    priceHighlighted.value = true
  }
}

const handleFieldBlur = () => {
  priceHighlighted.value = false
}

const handleDistanceChange = async () => {
  try {
    const res = await validatePriceApi({
      distance: editForm.distance,
      capacityType: orderInfo.capacityType,
      estimatedPrice: editForm.estimatedPrice
    })
    priceValidateResult.value = res.data
  } catch (error) {
    console.error('价格校验失败', error)
  }
}

const handleEditSave = async () => {
  if (!editForm.startAddress || !editForm.endAddress || !editForm.distance || !editForm.duration) {
    ElMessage.warning('请填写完整的编辑信息')
    return
  }

  editSubmitting.value = true
  try {
    const res = await getEditConditionsApi(orderInfo.id)
    if (!res.data.canEdit) {
      ElMessageBox.alert(
        `该订单不可编辑，原因：\n${res.data.reasons.join('\n')}`,
        '提示',
        { type: 'warning' }
      )
      return
    }

    await updateOrderBaseInfoApi(orderInfo.id, {
      startAddress: editForm.startAddress,
      endAddress: editForm.endAddress,
      distance: editForm.distance,
      duration: editForm.duration
    })
    ElMessage.success('编辑成功')
    isEditing.value = false
    loadDetail()
    loadStatusLogs()
  } catch (error: any) {
    ElMessage.error(error.message || '编辑失败')
  } finally {
    editSubmitting.value = false
  }
}

const loadBillingDetail = async (params?: { weather?: string; date?: string }) => {
  const id = route.params.id as string
  if (!id) return
  try {
    const res = await calculateBillingApi(Number(id), params)
    billingDetailData.value = res.data
  } catch (e: any) {
    console.error('获取计费明细失败', e)
  }
}

const loadBillingEditConditions = async () => {
  const id = route.params.id as string
  if (!id) return
  try {
    const res = await getEditConditionsApi(Number(id))
    billingEditConditions.value = res.data
  } catch (e: any) {
    console.error('获取计费编辑条件失败', e)
  }
}

const loadPricingChangeLogs = async () => {
  const id = route.params.id as string
  if (!id) return
  try {
    const res = await getPricingChangeLogsApi(Number(id), { page: 1, pageSize: 20 })
    pricingChangeLogs.value = res.data.list || []
  } catch (e: any) {
    console.error('获取计费变更日志失败', e)
  }
}

const loadScenarios = async () => {
  try {
    const res = await getApplicableScenariosApi()
    scenarios.value = res.data
  } catch (e: any) {
    console.error('获取适用场景失败', e)
    scenarios.value = [
      { key: 'time', name: '时段', items: [] },
      { key: 'weather', name: '天气', items: [] },
      { key: 'holiday', name: '节假日', items: [] },
      { key: 'vehicle', name: '车型', items: [] }
    ]
  }
}

const handleEditBilling = async () => {
  if (userRole.value < 2) {
    ElMessage.warning('您没有权限修改计费')
    return
  }
  await loadBillingEditConditions()
  if (!canEditBilling.value) {
    ElMessage.warning('该订单不允许修改计费')
    return
  }
  billingEditForm.basePrice = billingDetailData.value?.basePrice || 0
  billingEditForm.perKmPrice = billingDetailData.value?.perKmPrice || 0
  billingEditForm.perMinPrice = billingDetailData.value?.perMinPrice || 0
  billingEditForm.nightSurcharge = 0
  billingEditForm.surgeRatio = 1.0
  billingValidationResult.value = null
  Object.keys(shakeFields).forEach(key => { shakeFields[key] = false })
  billingEditDialogVisible.value = true
  await validateBillingEdit()
}

const triggerShake = (field: string) => {
  shakeFields[field] = true
  setTimeout(() => {
    shakeFields[field] = false
  }, 500)
}

const handleBillingFieldChange = (field: string) => {
  const value = billingEditForm[field as keyof typeof billingEditForm]
  if (value < 0 || (field === 'surgeRatio' && value > 10)) {
    triggerShake(field)
    if (value < 0) {
      billingEditForm[field as keyof typeof billingEditForm] = 0 as any
    }
    if (field === 'surgeRatio' && value > 10) {
      billingEditForm.surgeRatio = 10
    }
  }
  validateBillingEdit()
}

const validateBillingEdit = async () => {
  try {
    const res = await validatePricingEditApi({
      basePrice: billingEditForm.basePrice,
      perKmPrice: billingEditForm.perKmPrice,
      perMinPrice: billingEditForm.perMinPrice,
      surgeRatio: billingEditForm.surgeRatio,
      distance: orderInfo.distance,
      duration: orderInfo.duration
    })
    billingValidationResult.value = res.data
  } catch (e: any) {
    console.error('实时校验失败', e)
  }
}

const handleBillingEditSubmit = async () => {
  if (!canSubmitBillingEdit.value) return
  const id = route.params.id as string
  if (!id) return

  billingEditSubmitting.value = true
  try {
    await updateOrderBillingApi(Number(id), {
      basePrice: billingEditForm.basePrice,
      perKmPrice: billingEditForm.perKmPrice,
      perMinPrice: billingEditForm.perMinPrice,
      nightSurcharge: billingEditForm.nightSurcharge,
      surgeRatio: billingEditForm.surgeRatio
    })
    ElMessage.success('计费修改成功')
    billingEditDialogVisible.value = false
    loadBillingDetail()
    loadPricingChangeLogs()
  } catch (error: any) {
    ElMessage.error(error.message || '修改失败')
  } finally {
    billingEditSubmitting.value = false
  }
}

const handleScenarioChange = async (key: string) => {
  activeScenario.value = key
  const params: { weather?: string; date?: string } = {}
  if (key === 'weather') {
    params.weather = billingDetailData.value?.weatherCondition
  }
  if (key === 'holiday') {
    params.date = orderInfo.createTime?.split(' ')[0]
  }
  await loadBillingDetail(params)
  await loadPricingChangeLogs()
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

const loadStatusLogs = async () => {
  const id = route.params.id as string
  if (id) {
    try {
      const res = await getOrderStatusLogsApi(Number(id), { page: 1, pageSize: 50 })
      statusLogs.value = res.data.list || []
    } catch (e: any) {
      console.error('获取状态日志失败', e)
    }
  }
}

const loadFlowDetail = async () => {
  const id = route.params.id as string
  if (id) {
    try {
      const res = await getFlowDetailApi(Number(id))
      flowDetailData.value = res.data
    } catch (e: any) {
      console.error('获取流转详情失败', e)
    }
  }
}

const loadCancelStatistics = async () => {
  try {
    const res = await getCancelStatisticsApi()
    cancelStatisticsData.value = res.data
  } catch (e: any) {
    console.error('获取取消统计失败', e)
  }
}

onMounted(() => {
  loadDetail().then(() => {
    loadAfterSaleTickets()
    loadReputationScore()
  })
  loadStatusLogs()
  loadFlowDetail()
  loadCancelStatistics()
  loadBillingDetail()
  loadBillingEditConditions()
  loadPricingChangeLogs()
  loadScenarios()
})
</script>

<style lang="scss" scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-8px); }
  40%, 80% { transform: translateX(8px); }
}

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

.field-error {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #f56c6c;
  margin-top: 4px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.status-with-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.after-sale-tag {
  animation: pulse 2s infinite;
}

.after-sale-actions {
  float: right;
}

.after-sale-card {
  .has-exception {
    background: rgba(245, 108, 108, 0.1) !important;
  }
}

.reputation-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;

  .reputation-label {
    font-size: 14px;
    color: #606266;
  }

  .reputation-score {
    font-size: 24px;
    font-weight: bold;
    color: #67c23a;

    &.low {
      color: #f56c6c;
    }
  }
}

.audit-log-card {
  margin-bottom: 8px;
  transition: all 0.3s ease;

  &.has-exception {
    background: rgba(245, 108, 108, 0.1) !important;
    border-left: 4px solid #f56c6c;
  }

  .log-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
    flex-wrap: wrap;

    .log-operator,
    .log-ip {
      font-size: 12px;
      color: #909399;
    }
  }

  .log-status {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;

    .arrow {
      color: #909399;
      font-size: 12px;
    }
  }

  .log-content,
  .log-reject,
  .log-refund,
  .log-reputation {
    font-size: 13px;
    color: #606266;
    margin-bottom: 4px;
  }

  .log-reject {
    color: #f56c6c;
  }

  .log-refund {
    color: #e6a23c;
  }

  .log-reputation {
    color: #67c23a;
  }

  .log-exception {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #f56c6c;
    margin-top: 8px;
  }
}

.has-error {
  :deep(.el-form-item__label) {
    color: #f56c6c;
  }
}

.order-detail {
  .content {
    margin-top: 20px;
  }

  .action-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .cancel-statistics-row {
    margin-top: 16px;

    .stat-card {
      text-align: center;

      :deep(.el-statistic__head) {
        font-size: 13px;
        color: #909399;
      }

      :deep(.el-statistic__content) {
        font-size: 22px;
        font-weight: 600;
      }
    }
  }

  .info-card {
    margin-bottom: 20px;
    transition: box-shadow 0.3s ease;

    .card-title {
      font-weight: 600;
      font-size: 15px;
    }

    &.is-editing {
      :deep(.el-descriptions__body) {
        .el-descriptions-item__content {
          padding: 8px 10px;
        }
      }
    }

    &.highlight {
      box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.3);
      animation: pulse 1.5s ease-in-out;
    }
  }

  .status-zoom-in {
    animation: statusZoomIn 0.3s ease;
  }

  @keyframes statusZoomIn {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.3);
    }
    50% {
      box-shadow: 0 0 0 6px rgba(64, 158, 255, 0.1);
    }
  }

  .edit-actions {
    float: right;
  }

  .actual-price {
    color: #f56c6c;
    font-weight: bold;
    font-size: 16px;
  }

  .estimated-price {
    color: #f56c6c;
    font-size: 18px;
    font-weight: bold;
  }

  .price-highlight {
    :deep(.el-descriptions-item__content) {
      transition: all 0.3s ease;
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.5);
      border-radius: 4px;
      padding: 4px 8px;
      background: rgba(64, 158, 255, 0.05);
    }
  }

  .price-validate-tip {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    margin-top: 4px;

    &.success {
      color: #67c23a;
    }

    &.error {
      color: #f56c6c;
    }
  }

  .route-info {
    padding: 20px 0;

    .route-item {
      .point {
        display: flex;
        align-items: flex-start;
        gap: 10px;

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #67c23a;
          margin-top: 4px;
          flex-shrink: 0;

          &.end {
            background: #f56c6c;
          }
        }

        .address {
          font-size: 14px;
          color: #303133;
          flex: 1;
        }

        .edit-address {
          flex: 1;
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

  .log-item {
    .log-status {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;

      .arrow {
        color: #909399;
        font-size: 12px;
      }
    }

    .log-info {
      font-size: 13px;
      color: #606266;
      margin-bottom: 4px;

      .log-ip {
        margin-left: 8px;
      }
    }

    .log-reason {
      font-size: 12px;
      color: #909399;
    }

    .log-cancel-info {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 6px;

      .responsibility-tag {
        margin-left: 4px;
      }
    }
  }

  .violation-alert {
    margin-bottom: 16px;

    .violation-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      font-size: 13px;

      .violation-time {
        color: #909399;
        font-size: 12px;
      }
    }
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

  .billing-section {
    .billing-actions {
      float: right;
      display: flex;
      align-items: center;
      gap: 8px;

      .warning-icon {
        color: #e6a23c;
        cursor: help;
      }
    }

    .billing-info {
      .billing-row {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;
        transition: background-color 0.3s ease;

        &:last-child {
          border-bottom: none;
        }

        &.total {
          font-weight: bold;

          .billing-value {
            font-size: 20px;
            color: #f56c6c;
          }
        }

        .billing-label {
          color: #606266;
        }

        .billing-value {
          color: #303133;
          font-weight: 500;

          &.surge {
            color: #e6a23c;
          }
        }
      }
    }
  }

  .billing-scenario-card {
    .scenario-row {
      margin-bottom: 8px;

      .scenario-card {
        padding: 16px;
        border: 2px solid #e4e7ed;
        border-radius: 8px;
        cursor: pointer;
        text-align: center;
        transition: all 0.3s ease;

        &:hover {
          border-color: #409eff;
          transform: translateY(-2px);
        }

        &.active {
          border-color: #409eff;
          background: rgba(64, 158, 255, 0.05);
        }

        .scenario-name {
          font-size: 13px;
          color: #909399;
          margin-bottom: 8px;
        }

        .scenario-value {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 8px;
        }

        .scenario-surge {
          font-size: 12px;
          color: #67c23a;

          &.has-surge {
            color: #e6a23c;
          }
        }
      }
    }

    .billing-table-wrapper {
      :deep(.billing-detail-table) {
        .billing-row-error {
          background-color: rgba(245, 108, 108, 0.1);

          td {
            background-color: transparent;
          }
        }

        .el-table__column-resize-proxy {
          transition: none;
        }

        .item-total {
          font-weight: 600;
          color: #303133;
        }

        th, td {
          transition: background-color 0.3s ease;
        }
      }
    }

    .billing-summary {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      padding: 16px 0;

      .summary-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .label {
          color: #606266;
          font-size: 14px;
        }

        .value {
          color: #303133;
          font-weight: 600;
          font-size: 16px;

          &.surge {
            color: #e6a23c;
          }
        }

        &.total {
          margin-left: auto;

          .label {
            font-size: 16px;
            font-weight: 600;
          }

          .value {
            color: #f56c6c;
            font-size: 20px;
          }
        }
      }
    }

    .change-logs-section {
      .section-title {
        font-weight: 600;
        font-size: 15px;
        margin-bottom: 16px;
        color: #303133;
      }

      .log-card {
        margin-bottom: 0;

        .log-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;

          .log-operator {
            font-size: 13px;
            color: #909399;
          }
        }

        .log-price-diff {
          font-size: 14px;
          margin-bottom: 4px;

          &.price-up {
            color: #f56c6c;
          }

          &.price-down {
            color: #67c23a;
          }
        }

        .log-remark {
          font-size: 13px;
          color: #606266;
          margin-bottom: 4px;
        }

        .log-exception {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: #f56c6c;
        }
      }
    }
  }

  .mb-16 {
    margin-bottom: 16px;
  }

  .shake {
    animation: shake 0.5s ease;
  }

  .estimated-total {
    font-size: 24px;
    font-weight: bold;
    color: #303133;

    &.price-high {
      color: #f56c6c;
    }
  }

  .field-error {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #f56c6c;
    margin-top: 4px;
  }

  .has-error {
    :deep(.el-form-item__label) {
      color: #f56c6c;
    }
  }

  .validation-errors {
    .validation-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 0;
      font-size: 13px;
      color: #606266;
    }
  }
}

.prerequisite-failures {
  margin-top: 16px;

  .failure-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    font-size: 14px;
    color: #606266;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .el-icon {
      color: #e6a23c;
      flex-shrink: 0;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-leave-active {
  position: absolute;
}
</style>