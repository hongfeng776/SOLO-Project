<template>
  <el-drawer
    v-model="drawerVisible"
    title="售后审核"
    size="600px"
    destroy-on-close
    @close="handleClose"
  >
    <div v-if="afterSaleInfo" class="after-sale-audit-panel">
      <div class="panel-section mb-20">
        <h4 class="section-title">
          <el-icon><Ticket /></el-icon>
          售后申请信息
        </h4>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="售后单号">
            <span class="highlight-text">{{ afterSaleInfo.afterSaleNo }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="订单号">
            {{ afterSaleInfo.orderNo }}
          </el-descriptions-item>
          <el-descriptions-item label="售后类型">
            <el-tag
              :style="{ background: getTypeColor(afterSaleInfo.afterSaleType), borderColor: getTypeColor(afterSaleInfo.afterSaleType) }"
              effect="dark"
              size="small"
            >
              {{ getTypeLabel(afterSaleInfo.afterSaleType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="申请状态">
            <el-tag
              :style="{ background: getStatusColor(afterSaleInfo.status), borderColor: getStatusColor(afterSaleInfo.status) }"
              effect="dark"
              size="small"
            >
              {{ getStatusLabel(afterSaleInfo.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="申请金额">
            ¥{{ formatAmount(afterSaleInfo.applyAmount) }}
          </el-descriptions-item>
          <el-descriptions-item label="违约金">
            <span class="penalty-text">-¥{{ formatAmount(afterSaleInfo.penaltyAmount) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="最终退款">
            <span class="final-refund-text">¥{{ formatAmount(afterSaleInfo.finalAmount) }}</span>
            <span v-if="isLarge(afterSaleInfo.finalAmount)" class="refund-large-tag ml-10">
              大额退款
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="申请时间" :span="2">
            {{ afterSaleInfo.createTime }}
          </el-descriptions-item>
          <el-descriptions-item label="退款原因" :span="2">
            {{ afterSaleInfo.reason }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="panel-section mb-20">
        <h4 class="section-title">
          <el-icon><Money /></el-icon>
          关联订单信息
        </h4>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="商品名称">
            {{ afterSaleInfo.productName }}
          </el-descriptions-item>
          <el-descriptions-item label="订单金额">
            ¥{{ formatAmount(afterSaleInfo.orderAmount) }}
          </el-descriptions-item>
          <el-descriptions-item label="购买人">
            {{ afterSaleInfo.buyer }}
          </el-descriptions-item>
          <el-descriptions-item label="手机号">
            {{ afterSaleInfo.phone }}
          </el-descriptions-item>
          <el-descriptions-item label="支付时间" :span="2">
            {{ afterSaleInfo.payTime || '--' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div v-if="afterSaleInfo.status === AfterSaleStatusEnum.PENDING.value" class="panel-section">
        <h4 class="section-title">
          <el-icon><Right /></el-icon>
          审核操作
        </h4>
        <el-form :model="auditForm" :rules="auditRules" ref="auditFormRef" label-width="100px">
          <el-form-item label="审核结果">
            <el-radio-group v-model="auditForm.action" :disabled="auditLoading">
              <el-radio value="approve">
                <el-icon style="vertical-align: middle; margin-right: 4px; color: #67c23a;">
                  <CircleCheckFilled />
                </el-icon>
                审核通过
              </el-radio>
              <el-radio value="reject">
                <el-icon style="vertical-align: middle; margin-right: 4px; color: #f56c6c;">
                  <CircleCloseFilled />
                </el-icon>
                审核驳回
              </el-radio>
              <el-radio value="postpone">
                <el-icon style="vertical-align: middle; margin-right: 4px; color: #e6a23c;">
                  <Timer />
                </el-icon>
                暂缓处理
              </el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item
            v-if="auditForm.action === 'reject'"
            label="驳回原因"
            prop="rejectReason"
          >
            <el-input
              v-model="auditForm.rejectReason"
              type="textarea"
              :rows="3"
              :disabled="auditLoading"
              placeholder="请输入驳回原因（必填）"
            />
          </el-form-item>
          <el-form-item
            v-if="auditForm.action === 'postpone'"
            label="暂缓备注"
            prop="postponeRemark"
          >
            <el-input
              v-model="auditForm.postponeRemark"
              type="textarea"
              :rows="3"
              :disabled="auditLoading"
              placeholder="请输入暂缓备注（必填）"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              :type="getAuditBtnType"
              :loading="auditLoading"
              @click="handleAuditSubmit"
            >
              确认审核
            </el-button>
            <el-button @click="handleClose" :disabled="auditLoading">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Ticket, Money, Right, Timer,
  CircleCheckFilled, CircleCloseFilled
} from '@element-plus/icons-vue'
import {
  approveAfterSale,
  rejectAfterSale,
  postponeAfterSale
} from '@/api/afterSale'
import {
  AfterSaleTypeEnum,
  AfterSaleStatusEnum,
  getEnumLabel,
  getEnumColor
} from '@/utils/enums'
import { formatAmount } from '@/utils/payment'
import { isLargeAmount } from '@/utils/refund'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  afterSaleInfo: {
    type: Object,
    default: () => null
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const drawerVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const auditLoading = ref(false)
const auditFormRef = ref(null)

const auditForm = reactive({
  action: 'approve',
  rejectReason: '',
  postponeRemark: ''
})

const auditRules = {
  rejectReason: [
    { required: true, message: '请输入驳回原因', trigger: 'blur' },
    { min: 5, message: '驳回原因至少5个字符', trigger: 'blur' }
  ],
  postponeRemark: [
    { required: true, message: '请输入暂缓备注', trigger: 'blur' },
    { min: 5, message: '暂缓备注至少5个字符', trigger: 'blur' }
  ]
}

const getTypeLabel = (val) => getEnumLabel(AfterSaleTypeEnum, val)
const getTypeColor = (val) => getEnumColor(AfterSaleTypeEnum, val)
const getStatusLabel = (val) => getEnumLabel(AfterSaleStatusEnum, val)
const getStatusColor = (val) => getEnumColor(AfterSaleStatusEnum, val)

const isLarge = (amount) => isLargeAmount(amount)

const getAuditBtnType = computed(() => {
  const typeMap = {
    approve: 'success',
    reject: 'danger',
    postpone: 'warning'
  }
  return typeMap[auditForm.action] || 'primary'
})

const handleAuditSubmit = async () => {
  if (!props.afterSaleInfo) return

  if (auditForm.action === 'reject' || auditForm.action === 'postpone') {
    try {
      await auditFormRef.value.validate()
    } catch {
      ElMessage.warning('请检查表单填写')
      return
    }
  }

  auditLoading.value = true
  try {
    let result
    const id = props.afterSaleInfo.id

    if (auditForm.action === 'approve') {
      result = await approveAfterSale(id, {})
    } else if (auditForm.action === 'reject') {
      result = await rejectAfterSale(id, { rejectReason: auditForm.rejectReason })
    } else if (auditForm.action === 'postpone') {
      result = await postponeAfterSale(id, { remark: auditForm.postponeRemark })
    }

    ElMessage.success('审核操作成功')
    emit('success', result)
    drawerVisible.value = false
  } catch (err) {
    ElMessage.error(err.message || '审核操作失败')
  } finally {
    auditLoading.value = false
  }
}

const resetForm = () => {
  auditForm.action = 'approve'
  auditForm.rejectReason = ''
  auditForm.postponeRemark = ''
}

const handleClose = () => {
  emit('update:modelValue', false)
}

watch(() => props.modelValue, (val) => {
  if (val) {
    resetForm()
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/afterSale.scss';

.after-sale-audit-panel {
  .panel-section {
    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 12px 0;
      padding-left: 8px;
      border-left: 3px solid #409eff;
    }

    .highlight-text {
      font-weight: 600;
      color: #409eff;
    }

    .penalty-text {
      color: #e6a23c;
      font-weight: 500;
    }

    .final-refund-text {
      color: #f56c6c;
      font-weight: 600;
      font-size: 15px;
    }
  }
}

.mb-20 {
  margin-bottom: 20px;
}

.ml-10 {
  margin-left: 10px;
}
</style>
