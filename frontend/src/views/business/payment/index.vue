<template>
  <div class="ccb-business-payment">
    <CcbPageHeader
      title="线上支付"
      description="线上渠道支付管控：扫码/快捷/网关/代扣"
      icon="Money"
    />

    <el-row :gutter="20" class="mb15">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-card-blue" @click="goBatch('today_count')">
          <div class="stat-label">今日订单数</div>
          <div class="stat-value">{{ stats.today_count }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-card-green">
          <div class="stat-label">今日成功金额</div>
          <div class="stat-value">{{ formatCurrency(stats.today_success_amount) }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-card-orange" @click="goBatch('abnormal')">
          <div class="stat-label">今日异常订单数
            <el-tag v-if="stats.today_abnormal_count > 0" type="danger" size="small" effect="dark" class="ml5">
              {{ stats.today_abnormal_count }}
            </el-tag>
          </div>
          <div class="stat-value">{{ stats.today_abnormal_count }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-card-red" @click="goBatch('pending_review')">
          <div class="stat-label">待复核订单数</div>
          <div class="stat-value">{{ stats.pending_review_count }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover" class="mb15">
      <el-form :model="searchForm" inline label-width="90px" size="default">
        <el-form-item label="订单号">
          <el-input v-model="searchForm.order_no" placeholder="请输入订单号" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="支付流水号">
          <el-input v-model="searchForm.payment_no" placeholder="请支付流水号" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="付款账号">
          <el-input v-model="searchForm.payer_account_no" placeholder="请输入付款账号" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="商户名">
          <el-input v-model="searchForm.merchant_name" placeholder="请输入商户名" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="付款渠道">
          <el-select v-model="searchForm.pay_channel" placeholder="请选择渠道" clearable style="width: 160px">
            <el-option v-for="item in PAYMENT_CHANNEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付场景">
          <el-select v-model="searchForm.pay_scene" placeholder="请选择场景" clearable style="width: 160px">
            <el-option v-for="item in PAYMENT_SCENE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 140px">
            <el-option v-for="item in PAYMENT_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 320px"
          />
        </el-form-item>
        <el-form-item>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>
      <div class="toolbar-extra">
        <el-button type="primary" :icon="Plus" @click="openCreate" v-permission="'business:payment:create'">
          新增支付
        </el-button>
        <el-button type="success" :icon="Download" @click="handleExport" v-permission="'business:payment:query'">
          导出Excel
        </el-button>
      </div>
    </el-card>

    <el-card shadow="hover">
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        border
        row-key="id"
        class="payment-table"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="payment_no" label="支付流水号" width="170" align="center">
          <template #default="{ row }">
            <span class="copy-text" @click="copyText(row.payment_no)">{{ row.payment_no }}</span>
            <el-button link type="primary" size="small" @click="copyText(row.payment_no)">复制</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="order_no" label="关联订单号" width="150" align="center" show-overflow-tooltip />
        <el-table-column label="付款账号/户名" width="160" align="center">
          <template #default="{ row }">
            <div class="two-line">
              <div class="line1">{{ row.payer_account_no }}</div>
              <div class="line2 text-muted">{{ row.payer_account_name }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="商户名(MCC)" width="140" align="center">
          <template #default="{ row }">
            <el-tooltip v-if="row.merchant_mcc" :content="`MCC: ${row.merchant_mcc}`" placement="top">
              <span>{{ row.merchant_name }}</span>
            </el-tooltip>
            <span v-else>{{ row.merchant_name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="渠道" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getChannelTagType(row.pay_channel)" effect="light" size="small">
              {{ row.pay_channel_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="pay_scene_text" label="场景" width="100" align="center" />
        <el-table-column label="金额(元)" width="120" align="right">
          <template #default="{ row }">
            <span class="amount-green">{{ formatCurrency(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="手续费(元)" width="90" align="right">
          <template #default="{ row }">
            <span class="text-gray">{{ formatThousands(row.fee) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="实付金额(元)" width="120" align="right">
          <template #default="{ row }">
            <span class="amount-deepgreen">{{ formatCurrency(row.actual_amount ?? (row.amount + row.fee)) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" effect="light" size="small" :dynamic-width="true">
              {{ row.status_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="风控" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getRiskTagType(row.risk_level || 0)" effect="light" size="small">
              {{ row.risk_level_text || '无风险' }}
              <el-badge v-if="row.risk_level && row.risk_level >= 3" :value="!" class="risk-badge" />
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="交易时间" width="170" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleDetail(row)">详情</el-button>
            <el-button
              v-if="row.status === 0"
              type="warning" link size="small"
              @click="handleReview(row, true)"
              v-permission="'business:payment:review'"
            >复核</el-button>
            <el-button
              v-if="row.status === 2"
              type="primary" link size="small"
              @click="handleRefund(row)"
            >退款</el-button>
            <el-button
              v-if="row.status === 0 || row.status === 1"
              type="danger" link size="small"
              @click="handleClose(row)"
            >关闭</el-button>
            <el-button
              v-if="row.status === 3"
              type="success" link size="small"
              @click="handleRetry(row)"
            >重试</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pageParams.page"
        v-model:page-size="pageParams.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        class="mt15"
        @current-change="handlePageChange"
        @size-change="handlePageChange"
      />
    </el-card>

    <el-dialog
      v-model="showCreate"
      title="新增线上支付"
      width="820px"
      class="payment-dialog"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-alert
        v-if="preCheckResult && preCheckResult.blocked && preCheckResult.block_reason"
        :title="preCheckResult.block_reason"
        type="error"
        show-icon
        class="mb15"
        :closable="false"
      />
      <el-alert
        v-if="preCheckResult && !preCheckResult.blocked && preCheckResult.warnings && preCheckResult.warnings.length > 0"
        :title="preCheckResult.warnings[0]"
        type="warning"
        show-icon
        class="mb15"
        :closable="false"
      />
      <el-alert
        v-if="preCheckResult && preCheckResult.passed && !preCheckResult.blocked"
        title="预校验通过，可以提交支付"
        type="success"
        show-icon
        class="mb15"
        :closable="false"
      />

      <el-form
        ref="paymentFormRef"
        :model="paymentForm"
        :rules="paymentRules"
        label-width="110px"
        class="ccb-form"
      >
        <el-divider content-position="left">基础信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="付款账号" prop="payer_account_no">
              <el-input
                v-model="paymentForm.payer_account_no"
                placeholder="请输入付款账号"
                @blur="runPreCheck"
                :class="{ 'shake-error': shakeAccount }"
              />
              <div v-if="preCheckResult" class="account-status">
                <el-tag v-if="preCheckResult.payer_not_frozen" type="success" effect="plain" size="small">
                  账号状态：{{ preCheckResult.payer_account_status_text }}
                </el-tag>
                <el-tag v-else type="danger" effect="plain" size="small">
                  账号状态：{{ preCheckResult.payer_account_status_text }}
                </el-tag>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="付款渠道" prop="pay_channel">
              <el-select
                v-model="paymentForm.pay_channel"
                placeholder="请选择付款渠道"
                style="width: 100%"
                @change="runPreCheck"
                :class="{ 'shake-error': shakeChannel }"
              >
                <el-option
                  v-for="item in PAYMENT_CHANNEL_OPTIONS"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="支付场景" prop="pay_scene">
              <el-select
                v-model="paymentForm.pay_scene"
                placeholder="请选择支付场景"
                style="width: 100%"
                @change="runPreCheck"
              >
                <el-option
                  v-for="item in PAYMENT_SCENE_OPTIONS"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商户" prop="merchant_id">
              <el-select
                v-model="paymentForm.merchant_id"
                placeholder="请输入商户名搜索"
                filterable
                remote
                :remote-method="remoteMerchantSearch"
                :loading="merchantLoading"
                style="width: 100%"
                @change="handleMerchantChange"
                :class="{ 'shake-error': shakeMerchant }"
              >
                <el-option
                  v-for="item in merchantOptions"
                  :key="item.merchant_id"
                  :label="item.merchant_name"
                  :value="item.merchant_id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">设备与安全</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备ID" prop="device_id">
              <el-input
                v-model="paymentForm.device_info.device_id"
                placeholder="请输入设备ID"
                :class="{ 'shake-error': shakeDevice }"
              >
                <template #append>
                  <el-button @click="generateDeviceId" :disabled="submitting">自动生成</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备指纹" prop="device_fingerprint">
              <el-input
                v-model="paymentForm.device_info.device_fingerprint"
                placeholder="请输入设备指纹"
              >
                <template #append>
                  <el-button @click="generateFingerprint" :disabled="submitting">生成</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="IP地址">
              <el-input v-model="paymentForm.device_info.ip_address" placeholder="自动读取客户端IP" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="交易密码" prop="trade_password">
              <el-input
                v-model="tradePassword"
                :type="showTradePwd ? 'text' : 'password'"
                placeholder="请输入交易密码"
                :class="{ 'shake-error': shakePassword }"
              >
                <template #append>
                  <el-button @click="showTradePwd = !showTradePwd">
                    {{ showTradePwd ? '隐藏' : '显示' }}
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="短信验证码" prop="sms_code">
              <el-input v-model="paymentForm.sms_code" placeholder="请输入验证码" :disabled="!canSendSms && smsCountdown <= 0">
                <template #append>
                  <el-button
                    @click="sendSmsCode"
                    :disabled="smsCountdown > 0 || !canSendSms"
                  >
                    {{ smsCountdown > 0 ? `${smsCountdown}秒后重发` : '发送验证码' }}
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">金额与订单</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="支付金额" prop="amount">
              <el-input-number
                v-model="paymentForm.amount"
                :step="0.01"
                :min="0.01"
                :max="maxAmount"
                :precision="2"
                style="width: 100%"
                @input="debounceRunPreCheck"
                :class="{ 'shake-error': shakeAmount }"
              />
              <div v-if="preCheckResult && preCheckResult.channel_limits" class="limit-info">
                <el-text type="info" size="small">
                  单笔限额: {{ formatThousands(ONLINE_LIMIT_CONFIG[paymentForm.pay_channel]?.single_limit || 0) }}
                  | 日剩余:
                  <el-text
                    :type="preCheckResult.channel_limits.daily_remaining >= paymentForm.amount ? 'success' : 'danger'"
                    size="small"
                  >
                    {{ formatThousands(preCheckResult.channel_limits.daily_remaining) }}
                  </el-text>
                </el-text>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="订单标题" prop="subject">
              <el-select
                v-model="paymentForm.subject"
                placeholder="请选择或输入订单标题"
                filterable
                allow-create
                default-first-option
                style="width: 100%"
                @change="runPreCheck"
              >
                <el-option
                  v-for="item in SUBJECT_OPTIONS"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="订单描述">
              <el-input
                v-model="paymentForm.body"
                type="textarea"
                :rows="2"
                placeholder="请输入订单描述信息（选填）"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">结果与手续费</el-divider>
        <el-row :gutter="20" v-if="preCheckResult">
          <el-col :span="6">
            <el-form-item label="手续费">
              <el-tag type="success" effect="light" size="large">
                ¥{{ formatThousands(preCheckResult.fee_calc?.fee || 0) }}
              </el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="应付合计">
              <el-tag type="primary" effect="dark" size="large">
                ¥{{ formatThousands((paymentForm.amount || 0) + (preCheckResult.fee_calc?.fee || 0)) }}
              </el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="风控结果">
              <el-tag
                v-if="preCheckResult.anti_fraud_info && preCheckResult.anti_fraud_info.risk_score <= 50"
                type="success" effect="light"
              >
                低风险 {{ preCheckResult.anti_fraud_info.risk_score }}分
              </el-tag>
              <el-tag
                v-else-if="preCheckResult.anti_fraud_info && preCheckResult.anti_fraud_info.risk_score <= 70"
                type="warning" effect="light"
              >
                中风险 {{ preCheckResult.anti_fraud_info.risk_score }}分
              </el-tag>
              <el-tag
                v-else-if="preCheckResult.anti_fraud_info"
                type="danger" effect="dark"
              >
                高风险 {{ preCheckResult.anti_fraud_info.risk_score }}分
              </el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="复核状态">
              <el-tag v-if="preCheckResult.anti_fraud_info?.need_review" type="warning" effect="light">
                需要人工复核
              </el-tag>
              <el-tag v-else type="success" effect="light">自动处理</el-tag>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="closeCreateDialog">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          {{ submitting ? '提交中...' : '确认提交' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetail" title="支付详情" width="680px" destroy-on-close>
      <el-descriptions :column="2" border v-if="currentDetail">
        <el-descriptions-item label="支付流水号">{{ currentDetail.payment_no }}</el-descriptions-item>
        <el-descriptions-item label="关联订单号">{{ currentDetail.order_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="付款账号">{{ currentDetail.payer_account_no }}</el-descriptions-item>
        <el-descriptions-item label="付款户名">{{ currentDetail.payer_account_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="商户名称">{{ currentDetail.merchant_name }}</el-descriptions-item>
        <el-descriptions-item label="商户MCC">{{ currentDetail.merchant_mcc || '-' }}</el-descriptions-item>
        <el-descriptions-item label="支付渠道">{{ currentDetail.pay_channel_text }}</el-descriptions-item>
        <el-descriptions-item label="支付场景">{{ currentDetail.pay_scene_text }}</el-descriptions-item>
        <el-descriptions-item label="支付金额">
          <span class="amount-green">{{ formatCurrency(currentDetail.amount) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="手续费">{{ formatThousands(currentDetail.fee) }} 元</el-descriptions-item>
        <el-descriptions-item label="实付金额">
          <span class="amount-deepgreen">{{ formatCurrency(currentDetail.actual_amount ?? (currentDetail.amount + currentDetail.fee)) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="订单标题">{{ currentDetail.subject }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTagType(currentDetail.status)" effect="light" size="small">
            {{ currentDetail.status_text }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="风控等级">
          <el-tag :type="getRiskTagType(currentDetail.risk_level || 0)" effect="light" size="small">
            {{ currentDetail.risk_level_text || '无风险' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="设备ID">{{ currentDetail.device_id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ currentDetail.ip_address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ formatDateTime(currentDetail.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="订单描述" :span="2">{{ currentDetail.body || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentDetail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="showRefundDialog" title="退款处理" width="480px" :close-on-click-modal="false">
      <el-form :model="refundForm" label-width="100px" ref="refundFormRef" :rules="refundRules">
        <el-form-item label="原支付金额">
          <el-input :value="formatCurrency(refundForm.original_amount)" disabled />
        </el-form-item>
        <el-form-item label="退款金额" prop="refund_amount">
          <el-input-number
            v-model="refundForm.refund_amount"
            :min="0.01"
            :max="refundForm.original_amount"
            :step="0.01"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="退款原因" prop="reason">
          <el-input
            v-model="refundForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入退款原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRefundDialog = false">取消</el-button>
        <el-button type="danger" :loading="refundLoading" :disabled="!refundForm.reason.trim()" @click="confirmRefund">
          {{ refundLoading ? '处理中...' : '确认退款' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showCloseDialog" title="关闭订单" width="480px" :close-on-click-modal="false">
      <el-form label-width="80px">
        <el-form-item label="关闭原因">
          <el-input
            v-model="closeReason"
            type="textarea"
            :rows="3"
            placeholder="请输入关闭原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCloseDialog = false">取消</el-button>
        <el-button type="danger" :disabled="!closeReason.trim()" @click="confirmClose">确认关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElNotification, type FormInstance, type FormRules } from 'element-plus'
import { Search, Plus, Download } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import {
  PaymentChannel,
  PaymentScene,
  PaymentStatus,
  RiskLevel,
  PAYMENT_CHANNEL_OPTIONS,
  PAYMENT_SCENE_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  MCC_OPTIONS,
  RISK_LEVEL_OPTIONS,
  SUBJECT_OPTIONS,
  BATCH_OPERATION_OPTIONS,
  type PaymentPreCheckRequest,
  type PaymentPreCheckResult,
  type PaymentVO,
  type PaymentQueryParams,
  type CreatePaymentRequest,
  type ReviewPaymentRequest,
  type RefundPaymentRequest,
  type MerchantInfo,
  type DeviceInfo,
  preCheckPaymentApi,
  createPaymentApi,
  getPaymentListApi,
  getPaymentDetailApi,
  reviewPaymentApi,
  refundPaymentApi,
  closePaymentApi,
  retryPaymentApi,
  exportPaymentListApi,
  formatCurrency,
  calculateFee,
  ONLINE_LIMIT_CONFIG
} from '@api/payment'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const submitDisabled = ref(false)
const loadingSubmit = ref(false)
const refundLoading = ref(false)

const shakeAmount = ref(false)
const shakeMerchant = ref(false)
const shakePassword = ref(false)
const shakeAccount = ref(false)
const shakeChannel = ref(false)
const shakeDevice = ref(false)

const showCreate = ref(false)
const showDetail = ref(false)
const showRefundDialog = ref(false)
const showCloseDialog = ref(false)

const preCheckResult = ref<PaymentPreCheckResult | null>(null)
const paymentFormRef = ref<FormInstance>()
const refundFormRef = ref<FormInstance>()
const currentDetail = ref<PaymentVO | null>(null)
const currentRow = ref<PaymentVO | null>(null)
const closeReason = ref('')

const tradePassword = ref('')
const showTradePwd = ref(false)
const smsCountdown = ref(0)
const canSendSms = computed(() => {
  if (!preCheckResult.value) return false
  return preCheckResult.value.need_sms_verify || false
})

const stats = reactive({
  today_count: 0,
  today_success_amount: 0,
  today_abnormal_count: 0,
  pending_review_count: 0
})

const tableData = ref<PaymentVO[]>([])
const total = ref(0)
const selection = ref<PaymentVO[]>([])

const merchantLoading = ref(false)
const merchantOptions = ref<MerchantInfo[]>([])

const searchForm = reactive<PaymentQueryParams & { timeRange?: string[] }>({
  page: 1,
  pageSize: 10,
  payment_no: '',
  order_no: '',
  payer_account_no: '',
  merchant_name: '',
  pay_channel: undefined,
  pay_scene: undefined,
  status: undefined,
  timeRange: undefined
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const selectedMerchant = ref<MerchantInfo | null>(null)

const paymentForm = reactive<{
  payer_account_no: string
  pay_channel: PaymentChannel | undefined
  pay_scene: PaymentScene | undefined
  merchant_id: string
  amount: number
  subject: string
  body: string
  sms_code: string
  request_id: string
  device_info: DeviceInfo
}>({
  payer_account_no: '',
  pay_channel: undefined,
  pay_scene: undefined,
  merchant_id: '',
  amount: 0,
  subject: '',
  body: '',
  sms_code: '',
  request_id: '',
  device_info: {
    device_id: '',
    device_fingerprint: '',
    device_type: 'web',
    ip_address: '',
    trust_level: 0
  }
})

const refundForm = reactive<RefundPaymentRequest & { original_amount: number }>({
  payment_no: '',
  refund_amount: 0,
  reason: '',
  original_amount: 0
})

const paymentRules: FormRules = {
  payer_account_no: [{ required: true, message: '请输入付款账号', trigger: 'blur' }],
  pay_channel: [{ required: true, message: '请选择付款渠道', trigger: 'change' }],
  pay_scene: [{ required: true, message: '请选择支付场景', trigger: 'change' }],
  merchant_id: [{ required: true, message: '请选择商户', trigger: 'change' }],
  amount: [
    { required: true, message: '请输入支付金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '支付金额必须大于0', trigger: 'blur' }
  ],
  subject: [{ required: true, message: '请选择或输入订单标题', trigger: 'change' }],
  'device_info.device_id': [{ required: true, message: '请输入设备ID', trigger: 'blur' }]
}

const refundRules: FormRules = {
  refund_amount: [{ required: true, message: '请输入退款金额', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入退款原因', trigger: 'blur' }]
}

const maxAmount = computed(() => {
  if (!paymentForm.pay_channel) return Infinity
  return ONLINE_LIMIT_CONFIG[paymentForm.pay_channel]?.single_limit || Infinity
})

const canSubmit = computed(() => {
  return (
    preCheckResult.value?.passed === true &&
    !submitting.value &&
    !submitDisabled.value &&
    !loadingSubmit.value
  )
})

const formatDateTime = (date: string | undefined) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const formatThousands = (num: number | undefined | null) => {
  if (num === null || num === undefined || isNaN(num)) return '-'
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: PaymentQueryParams = {
      ...searchForm,
      page: pageParams.page,
      pageSize: pageParams.pageSize
    }
    if (searchForm.timeRange && searchForm.timeRange.length === 2) {
      params.start_time = searchForm.timeRange[0]
      params.end_time = searchForm.timeRange[1]
    }
    const res = await getPaymentListApi(params)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (e) {
    console.error('Failed to fetch payment list:', e)
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    stats.today_count = tableData.value.length
    stats.today_success_amount = tableData.value
      .filter(r => r.status === 2)
      .reduce((s, r) => s + r.amount, 0)
    stats.today_abnormal_count = tableData.value.filter(r => r.is_risk).length
    stats.pending_review_count = tableData.value.filter(r => r.status === 0 && r.need_review).length
  } catch (e) {
    console.error('Failed to calc stats:', e)
  }
}

const handleSearch = () => {
  pageParams.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.payment_no = ''
  searchForm.order_no = ''
  searchForm.payer_account_no = ''
  searchForm.merchant_name = ''
  searchForm.pay_channel = undefined
  searchForm.pay_scene = undefined
  searchForm.status = undefined
  searchForm.timeRange = undefined
  pageParams.page = 1
  fetchData()
}

const handlePageChange = () => {
  fetchData()
}

const handleSelectionChange = (val: PaymentVO[]) => {
  selection.value = val
}

const copyText = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.warning('复制失败，请手动复制')
  })
}

const triggerShake = (shakeRef: { value: boolean }) => {
  shakeRef.value = true
  setTimeout(() => {
    shakeRef.value = false
  }, 400)
}

let preCheckTimer: ReturnType<typeof setTimeout> | null = null

const debounceRunPreCheck = () => {
  if (preCheckTimer) clearTimeout(preCheckTimer)
  preCheckTimer = setTimeout(() => {
    runPreCheck()
  }, 300)
}

const runPreCheck = async () => {
  if (
    !paymentForm.payer_account_no ||
    !paymentForm.pay_channel ||
    !paymentForm.pay_scene ||
    !paymentForm.merchant_id ||
    !selectedMerchant.value ||
    paymentForm.amount <= 0
  ) {
    preCheckResult.value = null
    return
  }
  try {
    const requestId = 'PRE_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
    const req: PaymentPreCheckRequest = {
      payer_account_no: paymentForm.payer_account_no,
      pay_channel: paymentForm.pay_channel,
      pay_scene: paymentForm.pay_scene,
      merchant: selectedMerchant.value,
      amount: paymentForm.amount,
      subject: paymentForm.subject,
      body: paymentForm.body,
      device_info: paymentForm.device_info,
      sms_code: paymentForm.sms_code,
      trade_password_hash: tradePassword.value ? btoa(tradePassword.value) : undefined,
      request_id: requestId
    }
    const res = await preCheckPaymentApi(req)
    preCheckResult.value = res.data
    if (!res.data.passed) {
      if (res.data.block_field === 'amount') triggerShake(shakeAmount)
      if (res.data.block_field === 'merchant') triggerShake(shakeMerchant)
      if (res.data.block_field === 'payer_account_no') triggerShake(shakeAccount)
      if (res.data.blocked && res.data.block_reason) {
        ElMessage.error(res.data.block_reason)
      }
    }
  } catch (e: any) {
    preCheckResult.value = {
      passed: false,
      blocked: true,
      block_reason: e?.message || '校验失败',
      warnings: [],
      payer_account_valid: false,
      payer_account_status: 0,
      payer_account_status_text: '未知',
      payer_not_frozen: false,
      payer_available_balance: 0,
      balance_sufficient: false,
      merchant_valid: false,
      merchant_status_normal: false,
      amount_valid: false,
      within_channel_limits: false,
      need_sms_verify: false,
      sms_verified: false,
      need_trade_password: false,
      trade_password_verified: false,
      need_second_auth: false,
      channel_limits: { single_remaining: 0, daily_remaining: 0, monthly_remaining: 0, yearly_remaining: 0 },
      fee_calc: { fee: 0, fee_calc_desc: '', min_fee: 0, max_fee: 0, rate: 0 },
      sms_info: { required: false, sent: false, threshold_amount: 0, code_length: 6, expire_minutes: 5, verified: false },
      anti_fraud_info: { risk_score: 0, risk_level: 0, risk_tags: [], need_review: false, need_second_auth: false }
    }
    triggerShake(shakeAmount)
    ElMessage.error(e?.message || '校验失败')
  }
}

const openCreate = () => {
  preCheckResult.value = null
  shakeAmount.value = false
  shakeMerchant.value = false
  shakePassword.value = false
  shakeAccount.value = false
  shakeChannel.value = false
  shakeDevice.value = false
  paymentForm.payer_account_no = ''
  paymentForm.pay_channel = undefined
  paymentForm.pay_scene = undefined
  paymentForm.merchant_id = ''
  paymentForm.amount = 0
  paymentForm.subject = ''
  paymentForm.body = ''
  paymentForm.sms_code = ''
  paymentForm.request_id = ''
  paymentForm.device_info = {
    device_id: '',
    device_fingerprint: '',
    device_type: 'web',
    ip_address: '127.0.0.1',
    trust_level: 0
  }
  tradePassword.value = ''
  selectedMerchant.value = null
  merchantOptions.value = []
  showCreate.value = true
}

const closeCreateDialog = () => {
  showCreate.value = false
  shakeAmount.value = false
  shakeMerchant.value = false
}

const generateDeviceId = () => {
  paymentForm.device_info.device_id = 'DEV_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10).toUpperCase()
}

const generateFingerprint = () => {
  paymentForm.device_info.device_fingerprint = 'FP_' + btoa(navigator.userAgent + Date.now()).slice(0, 32)
}

const remoteMerchantSearch = async (query: string) => {
  if (!query) {
    merchantOptions.value = []
    return
  }
  merchantLoading.value = true
  try {
    await new Promise(r => setTimeout(r, 300))
    merchantOptions.value = [
      { merchant_id: 'M001', merchant_name: query + '超市有限公司', mcc: '5411', risk_level: 0, status: 1 },
      { merchant_id: 'M002', merchant_name: query + '餐饮连锁', mcc: '5812', risk_level: 1, status: 1 },
      { merchant_id: 'M003', merchant_name: query + '科技公司', mcc: '5732', risk_level: 2, status: 1 }
    ]
  } finally {
    merchantLoading.value = false
  }
}

const handleMerchantChange = (val: string) => {
  const merchant = merchantOptions.value.find(m => m.merchant_id === val)
  if (merchant) {
    selectedMerchant.value = merchant
  }
  runPreCheck()
}

const sendSmsCode = async () => {
  try {
    ElMessage.success('验证码已发送，请查收')
    smsCountdown.value = 60
    const timer = setInterval(() => {
      smsCountdown.value--
      if (smsCountdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (e) {
    console.error(e)
  }
}

const handleSubmit = async () => {
  if (paymentFormRef.value) {
    const valid = await paymentFormRef.value.validate().catch(() => false)
    if (!valid) return
  }
  if (!preCheckResult.value?.passed) {
    ElMessage.error('前置校验未通过，无法提交')
    return
  }
  if (preCheckResult.value.blocked) {
    ElMessage.error(preCheckResult.value.block_reason || '存在拦截项，无法提交')
    return
  }
  if (!selectedMerchant.value) {
    ElMessage.error('请选择商户')
    return
  }

  submitDisabled.value = true
  submitting.value = true
  loadingSubmit.value = true

  try {
    const reqId = 'PAY_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
    const req: CreatePaymentRequest = {
      payer_account_no: paymentForm.payer_account_no,
      pay_channel: paymentForm.pay_channel!,
      pay_scene: paymentForm.pay_scene!,
      merchant: selectedMerchant.value,
      amount: paymentForm.amount,
      subject: paymentForm.subject,
      body: paymentForm.body,
      device_info: paymentForm.device_info,
      sms_code: paymentForm.sms_code || undefined,
      trade_password_hash: tradePassword.value ? btoa(tradePassword.value) : undefined,
      request_id: reqId
    }
    const res = await createPaymentApi(req)
    ElMessageBox.alert(
      `支付订单创建成功！\n支付流水号：${res.data.payment_no}`,
      '办理成功',
      { confirmButtonText: '确定', type: 'success' }
    )
    showCreate.value = false
    fetchData()
  } catch (e) {
    console.error('Failed to create payment:', e)
  } finally {
    submitting.value = false
    loadingSubmit.value = false
    setTimeout(() => {
      submitDisabled.value = false
    }, 300)
  }
}

const handleDetail = async (row: PaymentVO) => {
  try {
    const res = await getPaymentDetailApi(row.id)
    currentDetail.value = res.data
    showDetail.value = true
  } catch (e) {
    currentDetail.value = row
    showDetail.value = true
    console.error('Failed to fetch payment detail:', e)
  }
}

const handleReview = async (row: PaymentVO, approved: boolean) => {
  try {
    const actionText = approved ? '通过' : '拒绝'
    const { value: reviewReason } = await ElMessageBox.prompt(
      `请输入复核${actionText}原因：`,
      `复核${actionText}`,
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入复核原因',
        type: 'warning'
      }
    )
    const data: ReviewPaymentRequest = {
      payment_no: row.payment_no,
      approved,
      review_reason: reviewReason
    }
    await reviewPaymentApi(row.id, data)
    ElMessage.success(`复核${actionText}成功`)
    fetchData()
  } catch (e) {
    console.error('Failed to review payment:', e)
  }
}

const handleRefund = (row: PaymentVO) => {
  currentRow.value = row
  refundForm.payment_no = row.payment_no
  refundForm.original_amount = row.amount
  refundForm.refund_amount = row.amount
  refundForm.reason = ''
  showRefundDialog.value = true
}

const confirmRefund = async () => {
  if (!currentRow.value) return
  if (refundFormRef.value) {
    const valid = await refundFormRef.value.validate().catch(() => false)
    if (!valid) return
  }
  try {
    await ElMessageBox.confirm(
      `确认退款 ${formatCurrency(refundForm.refund_amount)} ？\n支付流水号：${refundForm.payment_no}`,
      '确认退款',
      { confirmButtonText: '确认退款', cancelButtonText: '取消', type: 'warning' }
    )
    refundLoading.value = true
    await refundPaymentApi(currentRow.value.id, {
      payment_no: refundForm.payment_no,
      refund_amount: refundForm.refund_amount,
      reason: refundForm.reason
    })
    ElMessage.success('退款申请已提交')
    showRefundDialog.value = false
    fetchData()
  } catch (e) {
    console.error('Failed to refund payment:', e)
  } finally {
    refundLoading.value = false
  }
}

const handleClose = (row: PaymentVO) => {
  currentRow.value = row
  closeReason.value = ''
  showCloseDialog.value = true
}

const confirmClose = async () => {
  if (!currentRow.value) return
  try {
    await ElMessageBox.confirm(
      `确认关闭该笔订单？\n流水号：${currentRow.value.payment_no}`,
      '确认关闭',
      { confirmButtonText: '确认关闭', cancelButtonText: '取消', type: 'warning' }
    )
    await closePaymentApi(currentRow.value.id, closeReason.value)
    ElMessage.success('订单已关闭')
    showCloseDialog.value = false
    fetchData()
  } catch (e) {
    console.error('Failed to close payment:', e)
  }
}

const handleRetry = async (row: PaymentVO) => {
  try {
    await ElMessageBox.confirm(
      `确认重试该笔支付？\n流水号：${row.payment_no}`,
      '确认重试',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    )
    const res = await retryPaymentApi(row.id)
    ElMessage.success(`重试已发起，新状态：${res.data.status_text}`)
    fetchData()
  } catch (e) {
    console.error('Failed to retry payment:', e)
  }
}

const handleExport = async () => {
  try {
    ElMessage.info('正在生成Excel文件，请稍候...')
    const params: PaymentQueryParams = { ...searchForm }
    if (searchForm.timeRange && searchForm.timeRange.length === 2) {
      params.start_time = searchForm.timeRange[0]
      params.end_time = searchForm.timeRange[1]
    }
    const blob = await exportPaymentListApi(params)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `线上支付列表_${dayjs().format('YYYYMMDDHHmmss')}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    ElNotification.success({ title: '导出成功', message: 'Excel文件已下载' })
  } catch (e) {
    console.error('Failed to export:', e)
  }
}

const goBatch = (filter?: string) => {
  router.push({
    path: '/business/payment/batch',
    query: filter ? { filter } : {}
  })
}

const getChannelTagType = (channel: PaymentChannel): 'success' | 'warning' | 'primary' | 'info' => {
  switch (channel) {
    case 1: return 'success'
    case 2: return 'warning'
    case 3: return 'primary'
    case 4: return 'info'
    default: return 'info'
  }
}

const getStatusTagType = (status: PaymentStatus | number) => {
  const opt = PAYMENT_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.type || ''
}

const getRiskTagType = (level: RiskLevel | number): 'success' | 'warning' | 'danger' | 'info' => {
  if (level <= 1) return 'success'
  if (level <= 3) return 'warning'
  if (level <= 5) return 'danger'
  return 'info'
}

onMounted(() => {
  fetchData()
  setTimeout(() => fetchStats(), 500)
})
</script>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  50% { transform: translateX(4px); }
  75% { transform: translateX(-2px); }
}

.shake-error {
  animation: shake 400ms ease-in-out;
  border: 1px solid #f56c6c !important;
  box-shadow: 0 0 0 2px rgba(245, 108, 108, .2) !important;
  border-radius: 4px;
}

.shake-error :deep(.el-input__wrapper) {
  animation: shake 400ms ease-in-out;
  border-color: #f56c6c !important;
  box-shadow: 0 0 0 1px #f56c6c inset !important;
}

.stat-card {
  padding: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-label {
  color: #909399;
  font-size: 13px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-top: 6px;
}

.stat-card-blue .stat-value { color: #409eff; }
.stat-card-green .stat-value { color: #67c23a; }
.stat-card-orange .stat-value { color: #e6a23c; }
.stat-card-red .stat-value { color: #f56c6c; }

.ml5 { margin-left: 5px; }
.mt15 { margin-top: 15px; }
.mb15 { margin-bottom: 15px; }

.toolbar-extra {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px dashed #ebeef5;
}

.two-line {
  text-align: left;
  line-height: 1.4;
}
.two-line .line1 { font-size: 13px; color: #303133; }
.two-line .line2 { font-size: 12px; margin-top: 2px; }

.text-muted { color: #909399; }
.text-gray { color: #909399; }

.amount-green {
  color: #67c23a;
  font-weight: bold;
}

.amount-deepgreen {
  color: #2f9b4f;
  font-weight: bold;
}

.copy-text {
  cursor: pointer;
  color: #409eff;
}

.risk-badge {
  margin-left: 2px;
}

.account-status {
  margin-top: 6px;
}

.limit-info {
  margin-top: 8px;
  line-height: 1.6;
}

.ccb-form :deep(.el-divider) {
  margin: 12px 0;
}

.ccb-form :deep(.el-divider__text) {
  font-weight: 600;
  color: #303133;
}

.payment-table :deep(.el-table__row:hover) {
  transform: scale(1.003);
  transition: transform 0.15s ease;
}
</style>
