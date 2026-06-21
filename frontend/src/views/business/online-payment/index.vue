<template>
  <div class="ccb-business-online-payment">
    <CcbPageHeader
      title="线上支付"
      description="线上支付订单管理与支付通道管控"
      icon="Wallet"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="支付单号" prop="payment_no">
        <el-input v-model="searchForm.payment_no" placeholder="请输入支付单号" clearable />
      </el-form-item>
      <el-form-item label="付款账号" prop="payer_account_no">
        <el-input v-model="searchForm.payer_account_no" placeholder="请输入付款账号" clearable />
      </el-form-item>
      <el-form-item label="收款账号" prop="payee_account_no">
        <el-input v-model="searchForm.payee_account_no" placeholder="请输入收款账号" clearable />
      </el-form-item>
      <el-form-item label="商户名称" prop="merchant_name">
        <el-input v-model="searchForm.merchant_name" placeholder="请输入商户名称" clearable />
      </el-form-item>
      <el-form-item label="渠道类型" prop="channel_type">
        <el-select v-model="searchForm.channel_type" placeholder="请选择渠道类型" clearable>
          <el-option v-for="item in CHANNEL_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="支付状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="请选择支付状态" clearable>
          <el-option v-for="item in PAYMENT_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="支付场景" prop="pay_scene">
        <el-select v-model="searchForm.pay_scene" placeholder="请选择支付场景" clearable>
          <el-option v-for="item in PAY_SCENE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间范围" prop="timeRange">
        <el-date-picker
          v-model="searchForm.timeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
    </CcbSearchForm>

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <el-button type="primary" :icon="Plus" @click="openCreate" v-permission="'business:online-payment:create'">
          <span class="ripple-btn">新增支付</span>
        </el-button>
        <el-button type="success" :icon="Files" @click="goBatch" v-permission="'business:online-payment:batch'">批量处理</el-button>
        <el-button type="info" :icon="Search" @click="goTrace" v-permission="'business:online-payment:trace'">支付溯源</el-button>
        <el-button :icon="Refresh" @click="handleRefresh">刷新</el-button>
      </div>
      <div class="ccb-table-toolbar-right">
        <el-text type="info">
          支付总数：<el-text type="primary" size="large">{{ total }}</el-text>
        </el-text>
      </div>
    </div>

    <CcbTable
      v-model:page="pageParams.page"
      v-model:pageSize="pageParams.pageSize"
      :loading="loading"
      :data="tableData"
      :total="total"
      :show-selection="true"
      :show-index="true"
      row-class-name="payment-row"
      @selection-change="handleSelectionChange"
      @change="handlePageChange"
    >
      <el-table-column prop="payment_no" label="支付单号" width="200" />
      <el-table-column label="付款账号/户名" width="180">
        <template #default="{ row }">
          <div class="account-cell">
            <div class="account-no">{{ row.payer_account_no || '-' }}</div>
            <div class="account-name">{{ row.payer_account_name || '-' }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="merchant_name" label="商户名称" width="140" show-overflow-tooltip />
      <el-table-column label="渠道类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getChannelTypeColor(row.channel_type)" effect="light" size="small">
            {{ row.channel_type_text || getChannelTypeLabel(row.channel_type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="pay_scene_text" label="支付场景" width="100" />
      <el-table-column prop="amount" label="金额(元)" width="130" align="right">
        <template #default="{ row }">
          <span class="amount-positive">{{ formatCurrency(row.amount) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="fee" label="手续费(元)" width="110" align="right">
        <template #default="{ row }">
          {{ formatCurrency(row.fee || 0) }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" effect="light" size="small">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="风险等级" width="100">
        <template #default="{ row }">
          <el-tag :type="getRiskTagType(row.risk_level)" effect="light" size="small">
            {{ getRiskLevelLabel(row.risk_level) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="设备信息" width="140">
        <template #default="{ row }">
          <div class="device-cell">
            <span>{{ row.device_type_text || '-' }}</span>
            <span class="device-id">{{ row.device_id_masked || '-' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="160" />
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleDetail(row)">详情</el-button>
          <el-button
            v-if="row.status === 0 || row.status === 1"
            type="success" link size="small"
            @click="handleConfirm(row)"
            v-permission="'business:online-payment:confirm'"
          >确认</el-button>
          <el-button
            v-if="row.status === 2"
            type="warning" link size="small"
            @click="handleRefund(row)"
            v-permission="'business:online-payment:refund'"
          >退款</el-button>
          <el-button
            v-if="row.status === 0"
            type="danger" link size="small"
            @click="handleClose(row)"
            v-permission="'business:online-payment:close'"
          >关闭</el-button>
          <el-button type="info" link size="small" @click="handleTrace(row)">溯源</el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <el-dialog
      v-model="showCreate"
      title="新增支付"
      width="780px"
      class="payment-dialog"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-alert
        v-if="preCheckResult && preCheckResult.passed"
        title="预校验通过，可以提交支付"
        type="success"
        show-icon
        class="mb15"
        :closable="false"
      />
      <el-alert
        v-if="preCheckResult && !preCheckResult.passed && preCheckResult.blocked"
        :title="preCheckResult.block_reason || '前置校验未通过'"
        type="error"
        show-icon
        class="mb15"
        :closable="false"
      />
      <el-alert
        v-if="preCheckResult && preCheckResult.warnings && preCheckResult.warnings.length > 0 && !preCheckResult.blocked"
        :title="preCheckResult.warnings[0]"
        type="warning"
        show-icon
        class="mb15"
        :closable="false"
      />

      <el-form
        ref="paymentFormRef"
        :model="paymentForm"
        :rules="paymentRules"
        label-width="120px"
        class="ccb-form"
      >
        <el-divider content-position="left">基础信息</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="渠道类型" prop="channel_type">
              <el-select
                v-model="paymentForm.channel_type"
                placeholder="请选择渠道类型"
                style="width: 100%"
                @change="handleChannelTypeChange"
                :class="{ 'shake-error': shakeError }"
              >
                <el-option
                  v-for="item in CHANNEL_TYPE_OPTIONS"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="支付场景" prop="pay_scene">
              <el-select
                v-model="paymentForm.pay_scene"
                placeholder="请选择支付场景"
                style="width: 100%"
                @change="handlePaySceneChange"
              >
                <el-option
                  v-for="item in PAY_SCENE_OPTIONS"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">付款信息</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="付款账号" prop="payer_account_no">
              <el-input
                v-model="paymentForm.payer_account_no"
                placeholder="请输入付款账号"
                @blur="runPreCheck"
                :class="{ 'shake-error': shakeError }"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="户名" prop="payer_account_name">
              <el-input
                v-model="paymentForm.payer_account_name"
                placeholder="请输入付款户名"
                @blur="runPreCheck"
                :class="{ 'shake-error': shakeError }"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">收款商户</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商户号" prop="merchant_no">
              <el-input
                v-model="paymentForm.merchant_no"
                placeholder="请输入商户号"
                @blur="handleMerchantBlur"
                :class="{ 'shake-error': shakeError }"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商户名称" prop="merchant_name">
              <el-input
                v-model="paymentForm.merchant_name"
                placeholder="商户名称"
                disabled
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="收款账号" prop="payee_account_no">
              <el-input
                v-model="paymentForm.payee_account_no"
                placeholder="请输入收款账号"
                @blur="runPreCheck"
              />
              <div v-if="preCheckResult" class="merchant-info">
                <el-text :type="preCheckResult.merchant_valid ? 'success' : 'danger'" size="small">
                  商户状态：{{ preCheckResult.merchant_status_text }}
                  |
                </el-text>
                <el-text :type="preCheckResult.merchant_not_frozen ? 'success' : 'danger'" size="small">
                  冻结状态：{{ preCheckResult.merchant_not_frozen ? '正常' : '已冻结' }}
                </el-text>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">金额与验证</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="支付金额" prop="amount">
              <el-input
                v-model.number="paymentForm.amount"
                placeholder="请输入支付金额"
                type="number"
                :min="0"
                @input="handleAmountInput"
                @blur="runPreCheck"
                :class="{ 'shake-error': shakeError }"
              >
                <template #append>元</template>
              </el-input>
              <div v-if="preCheckResult" class="balance-info">
                <el-text :type="preCheckResult.balance_sufficient ? 'success' : 'danger'" size="small">
                  可用余额: {{ formatCurrency(preCheckResult.available_balance) }} 元
                  ({{ preCheckResult.balance_sufficient ? '余额充足' : '余额不足' }})
                </el-text>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="验证方式" prop="verify_method">
              <el-select
                v-model="paymentForm.verify_method"
                placeholder="请选择验证方式"
                style="width: 100%"
                @change="runPreCheck"
              >
                <el-option
                  v-for="item in VERIFY_METHOD_OPTIONS"
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
            <el-form-item label="验证码/密码" prop="verify_code">
              <el-input
                v-model="paymentForm.verify_code"
                placeholder="请输入验证码或密码"
                type="password"
                show-password
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="订单号" prop="order_no">
              <el-input
                v-model="paymentForm.order_no"
                placeholder="请输入订单号"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="订单主题">
          <el-input
            v-model="paymentForm.order_subject"
            placeholder="请输入订单主题"
          />
        </el-form-item>

        <el-form-item label="订单描述">
          <el-input
            v-model="paymentForm.order_desc"
            type="textarea"
            :rows="2"
            placeholder="请输入订单描述（选填）"
          />
        </el-form-item>

        <el-row :gutter="20" v-if="preCheckResult">
          <el-col :span="12">
            <el-form-item label="手续费">
              <el-input
                :value="formatCurrency(preCheckResult.fee_calc.fee) + ' 元'"
                disabled
              />
              <div class="fee-desc">
                <el-text type="info" size="small">
                  {{ preCheckResult.fee_calc.fee_calc_desc }}
                </el-text>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="风控等级">
              <el-input
                :value="getRiskLevelLabel(preCheckResult.risk_check.risk_level)"
                disabled
              />
              <div class="risk-desc">
                <el-tag v-for="(tag, idx) in preCheckResult.risk_check.risk_tags.slice(0, 3)" :key="idx" type="warning" effect="plain" size="small" style="margin-right: 4px;">
                  {{ tag }}
                </el-tag>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-if="preCheckResult">
          <el-col :span="24">
            <el-alert
              v-if="preCheckResult.need_review"
              :title="'需要人工复核：' + (preCheckResult.review_reason || '大额支付需审核')"
              type="warning"
              show-icon
              :closable="false"
            />
            <el-alert
              v-else
              title="本笔支付符合自动结算条件，提交后直接处理"
              type="success"
              show-icon
              :closable="false"
            />
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          <i v-if="submitting" class="el-icon-loading"></i>
          {{ submitting ? '提交中...' : '确认提交' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showVerifyDialog"
      title="二次核验"
      width="480px"
      class="verify-dialog"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-alert
        title="非授信设备，请进行短信验证"
        type="warning"
        show-icon
        :closable="false"
        class="mb15"
      />
      <el-form :model="verifyForm" label-width="100px">
        <el-form-item label="手机号">
          <el-input v-model="verifyForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="验证码">
          <div class="verify-code-wrapper">
            <el-input v-model="verifyForm.code" placeholder="请输入验证码" />
            <el-button
              type="primary"
              :disabled="verifyCountdown > 0"
              @click="sendVerifyCode"
            >
              {{ verifyCountdown > 0 ? `${verifyCountdown}s后重试` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showVerifyDialog = false">取消</el-button>
        <el-button type="primary" :loading="verifying" @click="confirmVerify">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showSuccessDialog"
      title="支付成功"
      width="520px"
      class="success-dialog"
      :close-on-click-modal="false"
      destroy-on-close
      custom-class="zoom-dialog"
    >
      <div class="success-content">
        <div class="success-icon">
          <el-icon :size="64" color="#67c23a"><CircleCheckFilled /></el-icon>
        </div>
        <div class="success-title">支付提交成功</div>
        <div class="success-info">
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="支付单号">{{ successPayment?.payment_no }}</el-descriptions-item>
            <el-descriptions-item label="支付金额">
              <span class="amount-positive">{{ successPayment ? formatCurrency(successPayment.amount) : '' }} 元</span>
            </el-descriptions-item>
            <el-descriptions-item label="手续费">{{ successPayment ? formatCurrency(successPayment.fee || 0) : '' }} 元</el-descriptions-item>
            <el-descriptions-item label="渠道类型">{{ successPayment?.channel_type_text }}</el-descriptions-item>
            <el-descriptions-item label="商户名称">{{ successPayment?.merchant_name }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="showSuccessDialog = false">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetail" title="支付详情" width="680px" destroy-on-close>
      <el-descriptions :column="2" border v-if="currentDetail">
        <el-descriptions-item label="支付单号">{{ currentDetail.payment_no }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentDetail.status)" effect="light" size="small">
            {{ getStatusLabel(currentDetail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="渠道类型">{{ currentDetail.channel_type_text }}</el-descriptions-item>
        <el-descriptions-item label="支付场景">{{ currentDetail.pay_scene_text }}</el-descriptions-item>
        <el-descriptions-item label="付款账号">{{ currentDetail.payer_account_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="付款户名">{{ currentDetail.payer_account_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="商户号">{{ currentDetail.merchant_no }}</el-descriptions-item>
        <el-descriptions-item label="商户名称">{{ currentDetail.merchant_name }}</el-descriptions-item>
        <el-descriptions-item label="收款账号">{{ currentDetail.payee_account_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="支付金额">
          <span class="amount-positive">{{ formatCurrency(currentDetail.amount) }} 元</span>
        </el-descriptions-item>
        <el-descriptions-item label="手续费">{{ formatCurrency(currentDetail.fee || 0) }} 元</el-descriptions-item>
        <el-descriptions-item label="风险等级">
          <el-tag :type="getRiskTagType(currentDetail.risk_level)" effect="light" size="small">
            {{ getRiskLevelLabel(currentDetail.risk_level) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="设备类型">{{ currentDetail.device_type_text || '-' }}</el-descriptions-item>
        <el-descriptions-item label="设备ID">{{ currentDetail.device_id_masked || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订单号">{{ currentDetail.order_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订单主题">{{ currentDetail.order_subject || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ currentDetail.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="支付时间" :span="2">{{ currentDetail.pay_time || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订单描述" :span="2">{{ currentDetail.order_desc || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentDetail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog
      v-model="showRefundDialog"
      title="退款申请"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="退款金额">
          <el-input
            v-model.number="refundForm.refund_amount"
            placeholder="请输入退款金额"
            type="number"
            :min="0"
          >
            <template #append>元</template>
          </el-input>
        </el-form-item>
        <el-form-item label="退款原因">
          <el-input
            v-model="refundForm.refund_reason"
            type="textarea"
            :rows="3"
            placeholder="请输入退款原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRefundDialog = false">取消</el-button>
        <el-button type="primary" :disabled="!refundForm.refund_amount || refundForm.refund_amount <= 0" @click="confirmRefund">确认退款</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showCloseReason"
      title="关闭原因"
      width="480px"
      :close-on-click-modal="false"
    >
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
        <el-button @click="showCloseReason = false">取消</el-button>
        <el-button type="primary" :disabled="!closeReason.trim()" @click="confirmClose">确认关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Files, Search, Refresh, CircleCheckFilled } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import {
  CHANNEL_TYPE_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  PAY_SCENE_OPTIONS,
  VERIFY_METHOD_OPTIONS,
  RISK_LEVEL_OPTIONS,
  type ChannelType,
  type PayScene,
  type PaymentStatus,
  type RiskLevel,
  type VerifyMethod,
  type OnlinePaymentVO,
  type OnlinePaymentQueryParams,
  type OnlinePaymentPreCheckResult,
  type CreateOnlinePaymentRequest,
  getOnlinePaymentListApi,
  getOnlinePaymentDetailApi,
  preCheckOnlinePaymentApi,
  createOnlinePaymentApi,
  confirmPaymentApi,
  refundPaymentApi,
  closePaymentApi,
  getMerchantInfoApi,
  formatCurrency
} from '@api/online-payment'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const submitDisabled = ref(false)
const shakeError = ref(false)
const showCreate = ref(false)
const showDetail = ref(false)
const showRefundDialog = ref(false)
const showCloseReason = ref(false)
const showVerifyDialog = ref(false)
const showSuccessDialog = ref(false)
const verifying = ref(false)
const verifyCountdown = ref(0)

const preCheckResult = ref<OnlinePaymentPreCheckResult | null>(null)
const paymentFormRef = ref<FormInstance>()
const currentDetail = ref<OnlinePaymentVO | null>(null)
const currentRow = ref<OnlinePaymentVO | null>(null)
const successPayment = ref<OnlinePaymentVO | null>(null)
const closeReason = ref('')

const refundForm = reactive({
  refund_amount: 0,
  refund_reason: ''
})

const verifyForm = reactive({
  phone: '',
  code: ''
})

const tableData = ref<OnlinePaymentVO[]>([])
const total = ref(0)
const selection = ref<OnlinePaymentVO[]>([])

const searchForm = reactive<OnlinePaymentQueryParams & { timeRange?: string[] }>({
  page: 1,
  pageSize: 10,
  payment_no: '',
  payer_account_no: '',
  payee_account_no: '',
  merchant_name: '',
  channel_type: undefined,
  status: undefined,
  pay_scene: undefined
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const paymentForm = reactive<CreateOnlinePaymentRequest & { verify_code?: string; merchant_name?: string }>({
  channel_type: 1,
  pay_scene: 1,
  merchant_no: '',
  amount: 0,
  currency: 'CNY',
  order_no: '',
  order_subject: '',
  order_desc: '',
  payer_account_no: '',
  payer_account_name: '',
  payee_account_no: '',
  verify_method: 1,
  verify_code: '',
  device_id: '',
  remark: ''
})

const paymentRules: FormRules = {
  channel_type: [{ required: true, message: '请选择渠道类型', trigger: 'change' }],
  pay_scene: [{ required: true, message: '请选择支付场景', trigger: 'change' }],
  merchant_no: [{ required: true, message: '请输入商户号', trigger: 'blur' }],
  amount: [
    { required: true, message: '请输入支付金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '支付金额必须大于0', trigger: 'blur' }
  ],
  order_no: [{ required: true, message: '请输入订单号', trigger: 'blur' }],
  order_subject: [{ required: true, message: '请输入订单主题', trigger: 'blur' }],
  payer_account_no: [{ required: true, message: '请输入付款账号', trigger: 'blur' }]
}

const canSubmit = computed(() => {
  return preCheckResult.value?.passed === true && !submitting.value && !submitDisabled.value
})

const fetchData = async () => {
  loading.value = true
  try {
    const params: OnlinePaymentQueryParams = {
      ...searchForm,
      page: pageParams.page,
      pageSize: pageParams.pageSize
    }
    if (searchForm.timeRange && searchForm.timeRange.length === 2) {
      params.start_time = searchForm.timeRange[0]
      params.end_time = searchForm.timeRange[1]
    }
    const res = await getOnlinePaymentListApi(params)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (e) {
    console.error('Failed to fetch online payment list:', e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageParams.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.payment_no = ''
  searchForm.payer_account_no = ''
  searchForm.payee_account_no = ''
  searchForm.merchant_name = ''
  searchForm.channel_type = undefined
  searchForm.status = undefined
  searchForm.pay_scene = undefined
  searchForm.timeRange = undefined
  pageParams.page = 1
  fetchData()
}

const handleRefresh = () => {
  fetchData()
}

const handlePageChange = () => {
  fetchData()
}

const handleSelectionChange = (val: OnlinePaymentVO[]) => {
  selection.value = val
}

const openCreate = () => {
  preCheckResult.value = null
  shakeError.value = false
  paymentForm.channel_type = 1
  paymentForm.pay_scene = 1
  paymentForm.merchant_no = ''
  paymentForm.merchant_name = ''
  paymentForm.amount = 0
  paymentForm.order_no = ''
  paymentForm.order_subject = ''
  paymentForm.order_desc = ''
  paymentForm.payer_account_no = ''
  paymentForm.payer_account_name = ''
  paymentForm.payee_account_no = ''
  paymentForm.verify_method = 1
  paymentForm.verify_code = ''
  paymentForm.remark = ''
  showCreate.value = true
}

const handleChannelTypeChange = () => {
  runPreCheck()
}

const handlePaySceneChange = () => {
  runPreCheck()
}

const handleMerchantBlur = async () => {
  if (!paymentForm.merchant_no) {
    paymentForm.merchant_name = ''
    return
  }
  try {
    const res = await getMerchantInfoApi(paymentForm.merchant_no)
    paymentForm.merchant_name = res.data.merchant_name
    runPreCheck()
  } catch (e) {
    console.error('Failed to get merchant info:', e)
  }
}

const handleAmountInput = () => {
  if (paymentForm.amount < 0) {
    paymentForm.amount = 0
  }
  runPreCheck()
}

const triggerShake = () => {
  shakeError.value = true
  setTimeout(() => {
    shakeError.value = false
  }, 500)
}

const runPreCheck = async () => {
  if (!paymentForm.payer_account_no || !paymentForm.merchant_no || paymentForm.amount <= 0) {
    preCheckResult.value = null
    return
  }
  try {
    const res = await preCheckOnlinePaymentApi({
      channel_type: paymentForm.channel_type,
      pay_scene: paymentForm.pay_scene,
      merchant_no: paymentForm.merchant_no,
      amount: paymentForm.amount,
      currency: paymentForm.currency,
      order_no: paymentForm.order_no,
      order_subject: paymentForm.order_subject,
      order_desc: paymentForm.order_desc,
      payer_account_no: paymentForm.payer_account_no,
      payer_account_name: paymentForm.payer_account_name,
      payee_account_no: paymentForm.payee_account_no,
      verify_method: paymentForm.verify_method,
      device_id: paymentForm.device_id,
      remark: paymentForm.remark
    })
    preCheckResult.value = res.data
    if (!res.data.passed) {
      triggerShake()
      if (res.data.blocked && res.data.block_reason) {
        ElMessage.error(res.data.block_reason)
      }
    }
  } catch (e: any) {
    preCheckResult.value = {
      passed: false,
      blocked: true,
      block_reason: e?.message || '校验失败',
      block_field: undefined,
      warnings: [],
      merchant_valid: false,
      merchant_status: 0,
      merchant_status_text: '未知',
      merchant_not_frozen: false,
      device_valid: false,
      device_status: 0,
      device_status_text: '未知',
      amount_valid: false,
      balance_sufficient: false,
      available_balance: 0,
      fee_calc: {
        fee: 0,
        fee_calc_desc: '',
        min_fee: 0,
        max_fee: 0,
        rate: 0
      },
      need_review: false,
      suggested_audit_level: 0,
      risk_check: {
        risk_level: 0,
        risk_tags: [],
        risk_details: []
      }
    }
    triggerShake()
    ElMessage.error(e?.message || '校验失败')
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

  if (!preCheckResult.value.device_valid) {
    showVerifyDialog.value = true
    return
  }

  doSubmit()
}

const sendVerifyCode = () => {
  if (!verifyForm.phone) {
    ElMessage.warning('请输入手机号')
    return
  }
  verifyCountdown.value = 60
  const timer = setInterval(() => {
    verifyCountdown.value--
    if (verifyCountdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
  ElMessage.success('验证码已发送')
}

const confirmVerify = () => {
  if (!verifyForm.code) {
    ElMessage.warning('请输入验证码')
    return
  }
  showVerifyDialog.value = false
  doSubmit()
}

const doSubmit = async () => {
  submitDisabled.value = true
  submitting.value = true

  try {
    const res = await createOnlinePaymentApi(paymentForm)
    successPayment.value = res.data
    showCreate.value = false
    showSuccessDialog.value = true
    fetchData()
  } catch (e) {
    console.error('Failed to create online payment:', e)
  } finally {
    submitting.value = false
    setTimeout(() => {
      submitDisabled.value = false
    }, 300)
  }
}

const handleDetail = async (row: OnlinePaymentVO) => {
  try {
    const res = await getOnlinePaymentDetailApi(row.id)
    currentDetail.value = res.data
    showDetail.value = true
  } catch (e) {
    currentDetail.value = row
    showDetail.value = true
    console.error('Failed to fetch payment detail:', e)
  }
}

const handleConfirm = async (row: OnlinePaymentVO) => {
  try {
    await ElMessageBox.confirm(
      `确认该笔支付？支付单号：${row.payment_no}`,
      '确认支付',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const res = await confirmPaymentApi(row.id, {
      verify_method: row.verify_method,
      verify_code: ''
    })
    ElMessage.success('支付确认成功')
    fetchData()
  } catch (e) {
    console.error('Failed to confirm payment:', e)
  }
}

const handleRefund = (row: OnlinePaymentVO) => {
  currentRow.value = row
  refundForm.refund_amount = row.amount
  refundForm.refund_reason = ''
  showRefundDialog.value = true
}

const confirmRefund = async () => {
  if (!currentRow.value) return
  try {
    await ElMessageBox.confirm(
      `确认退款？退款金额：${refundForm.refund_amount} 元`,
      '确认退款',
      {
        confirmButtonText: '确认退款',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await refundPaymentApi(currentRow.value.id, {
      refund_amount: refundForm.refund_amount,
      refund_reason: refundForm.refund_reason
    })
    ElMessage.success('退款申请已提交')
    showRefundDialog.value = false
    fetchData()
  } catch (e) {
    console.error('Failed to refund payment:', e)
  }
}

const handleClose = (row: OnlinePaymentVO) => {
  currentRow.value = row
  closeReason.value = ''
  showCloseReason.value = true
}

const confirmClose = async () => {
  if (!currentRow.value) return
  try {
    await ElMessageBox.confirm(
      `确认关闭该笔支付？关闭后将无法恢复，支付单号：${currentRow.value.payment_no}`,
      '确认关闭',
      {
        confirmButtonText: '确认关闭',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await closePaymentApi(currentRow.value.id, closeReason.value)
    ElMessage.success('支付已关闭')
    showCloseReason.value = false
    fetchData()
  } catch (e) {
    console.error('Failed to close payment:', e)
  }
}

const handleTrace = (row: OnlinePaymentVO) => {
  router.push({
    path: '/online-payment/trace',
    query: { payment_no: row.payment_no }
  })
}

const goBatch = () => {
  router.push('/online-payment/batch')
}

const goTrace = () => {
  router.push('/online-payment/trace')
}

const getChannelTypeLabel = (type: ChannelType | number) => {
  const opt = CHANNEL_TYPE_OPTIONS.find(o => o.value === type)
  return opt?.label || '未知'
}

const getChannelTypeColor = (type: ChannelType | number) => {
  const colorMap: Record<number, string> = {
    1: 'primary',
    2: 'success',
    3: 'warning',
    4: 'info',
    5: '',
    6: 'danger'
  }
  return colorMap[type] || 'info'
}

const getStatusType = (status: PaymentStatus | number) => {
  const opt = PAYMENT_STATUS_OPTIONS.find(o => o.value === status)
  return (opt?.type as any) || ''
}

const getStatusLabel = (status: PaymentStatus | number) => {
  const opt = PAYMENT_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.label || '未知'
}

const getRiskLevelLabel = (level: RiskLevel | number) => {
  const opt = RISK_LEVEL_OPTIONS.find(o => o.value === level)
  return opt?.label || '未知'
}

const getRiskTagType = (level: RiskLevel | number) => {
  if (level <= 1) return 'success'
  if (level <= 3) return 'warning'
  return 'danger'
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.payment-row:hover {
  transform: scale(1.01);
  transition: transform 0.2s ease;
  cursor: pointer;
}

.amount-positive {
  color: #67c23a;
  font-weight: 600;
}

.shake-error {
  animation: shake 0.4s ease-in-out;
  border-color: #f56c6c !important;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

.account-cell {
  line-height: 1.4;
}

.account-no {
  font-size: 13px;
  color: #303133;
}

.account-name {
  font-size: 12px;
  color: #909399;
}

.device-cell {
  line-height: 1.4;
}

.device-id {
  display: block;
  font-size: 12px;
  color: #909399;
}

.merchant-info {
  margin-top: 8px;
  line-height: 1.6;
}

.balance-info {
  margin-top: 6px;
}

.fee-desc {
  margin-top: 6px;
}

.risk-desc {
  margin-top: 6px;
}

.ripple-btn {
  position: relative;
  overflow: hidden;
}

.mb15 {
  margin-bottom: 15px;
}

.ccb-form :deep(.el-divider) {
  margin: 12px 0;
}

.ccb-form :deep(.el-divider__text) {
  font-weight: 600;
  color: #303133;
}

.verify-code-wrapper {
  display: flex;
  gap: 10px;
  width: 100%;
}

.verify-code-wrapper :deep(.el-input) {
  flex: 1;
}

.success-content {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  margin-bottom: 20px;
}

.success-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

.success-info {
  text-align: left;
}

.zoom-dialog {
  animation: zoomIn 0.3s ease-out;
}

@keyframes zoomIn {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

:deep(.zoom-dialog .el-dialog) {
  animation: zoomIn 0.3s ease-out;
}
</style>
