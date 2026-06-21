<template>
  <div v-if="selectedCount > 0" class="batch-toolbar">
    <div class="toolbar-left">
      <span class="selected-count">已选中 {{ selectedCount }} 个套餐</span>
      <el-tag v-if="exclusiveCount > 0" type="danger" effect="dark" style="margin-left:8px">
        含 {{ exclusiveCount }} 个专属特价套餐（将被排除）
      </el-tag>
    </div>
    <div class="toolbar-right">
      <el-button
        v-for="(op, key) in HotelPriceBatchOperationEnum"
        :key="key"
        :type="op.color === '#ff4d4f' ? 'danger' : op.color === '#fa8c16' ? 'warning' : 'primary'"
        class="batch-button package-card-hover-glow"
        @click="openBatch(key, op)"
        v-ripple
      >
        <el-icon style="margin-right:4px">
          <component :is="op.icon" />
        </el-icon>
        {{ op.label }}
      </el-button>
      <el-button @click="$emit('clear-selection')">清空选择</el-button>
    </div>

    <el-dialog v-model="adjustDialog" title="批量统一调价" width="560px" class="batch-dialog" destroy-on-close>
      <el-form label-width="120px">
        <el-form-item label="调价方式" required>
          <el-radio-group v-model="batchForm.adjustType" style="display:flex;gap:20px">
            <el-radio v-for="(item, key) in HotelPriceAdjustTypeEnum" :key="key" :value="key">{{ item.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="调整数值" required>
          <el-input-number
            v-model="batchForm.adjustValue"
            :step="batchForm.adjustType === 'percent' ? 1 : 10"
            :precision="batchForm.adjustType === 'fixed' ? 2 : 0"
            :min="batchForm.adjustType === 'decrease' || batchForm.adjustType === 'percent' ? -100 : 0"
            :max="batchForm.adjustType === 'percent' ? 500 : 999999"
            style="width:220px"
          />
          <span v-if="batchForm.adjustType === 'percent'" style="margin-left:8px">%</span>
          <span v-else style="margin-left:8px">元</span>
        </el-form-item>
        <el-form-item label="同步设置">
          <el-checkbox v-model="batchForm.applyOriginalPrice">同步设置原价</el-checkbox>
          <el-input-number v-if="batchForm.applyOriginalPrice" v-model="batchForm.originalPrice" :precision="2" style="width:180px;margin-left:10px" />
          <span v-if="batchForm.applyOriginalPrice" style="margin-left:6px">元</span>
        </el-form-item>
        <el-form-item label="同步折扣">
          <el-checkbox v-model="batchForm.applyDiscount">同步设置折扣比例</el-checkbox>
          <el-input-number v-if="batchForm.applyDiscount" v-model="batchForm.discountRatio" :min="3" :max="10" :step="0.1" :precision="1" style="width:140px;margin-left:10px" />
          <span v-if="batchForm.applyDiscount" style="margin-left:6px">折</span>
        </el-form-item>
        <div v-if="selectedRows.length" class="adjust-preview">
          <div class="preview-title" style="font-weight:600;color:#52c41a;margin-bottom:8px">调整预览（示例）</div>
          <div v-for="(row, i) in previewRows" :key="i" class="preview-item">
            <span class="preview-label">{{ row.name }}：</span>
            <span>
              ¥{{ formatPrice(row.oldPrice) }} → <span class="preview-value">¥{{ formatPrice(row.newPrice) }}</span>
            </span>
          </div>
          <div style="margin-top:8px;font-size:12px;color:#909399">
            * 专属特价套餐将不参与批量调整
          </div>
        </div>
        <el-form-item label="操作原因" required>
          <el-input v-model="batchForm.reason" type="textarea" :rows="2" placeholder="请填写本次批量操作原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmBatch('adjust_price')">确认批量调价</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="holidayDialog" title="批量启用节假日套餐" width="560px" class="batch-dialog" destroy-on-close>
      <el-form label-width="120px">
        <el-form-item label="生效日期" required>
          <el-date-picker
            v-model="batchForm.dateRange" type="daterange"
            start-placeholder="开始日期" end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width:100%"
          />
        </el-form-item>
        <div class="date-range-tip">
          <el-icon style="margin-right:4px;vertical-align:middle"><InfoFilled /></el-icon>
          选择的日期范围将覆盖所有选中套餐的原有生效日期
        </div>
        <el-form-item label="操作原因" required>
          <el-input v-model="batchForm.reason" type="textarea" :rows="2" placeholder="请填写操作原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="holidayDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmBatch('enable_holiday')">确认启用</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="expiredDialog" title="批量下架过期套餐" width="420px" class="batch-dialog" destroy-on-close>
      <div style="padding:10px 0 20px">
        <el-alert
          type="warning"
          title="即将下架所有已选择的套餐，专属特价套餐也将下架"
          show-icon
          :closable="false"
        />
      </div>
      <el-form label-width="120px">
        <el-form-item label="操作原因" required>
          <el-input v-model="batchForm.reason" type="textarea" :rows="2" placeholder="请填写下架原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="expiredDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmBatch('off_shelf_expired')">确认下架</el-button>
      </template>
    </el-dialog>

    <div v-if="progressVisible" class="batch-progress-overlay" @click.self>
      <div class="progress-box">
        <div class="progress-title">批量操作执行中...</div>
        <el-progress
          :percentage="progressPercent"
          :stroke-width="14"
          status-icon
          :status="progressPercent === 100 ? 'success' : ''"
        />
        <div class="progress-value">{{ progressPercent }}%</div>
        <div class="progress-detail">
          <div>执行总数：<b>{{ selectedCount }}</b></div>
          <div class="detail-success">成功：<b>{{ progressSuccess }}</b></div>
          <div class="detail-failed">失败：<b>{{ progressFailed }}</b></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import {
  Money, Calendar, Download,
  HotelPriceBatchOperationEnum, HotelPriceAdjustTypeEnum,
  formatPriceThousandth
} from '@/utils/enums'
import { batchHotelRoomPriceOperation } from '@/api/hotel'

const props = defineProps({
  selectedIds: { type: Array, default: () => [] },
  selectedRows: { type: Array, default: () => [] }
})
const emit = defineEmits(['success', 'clear-selection'])

const selectedCount = computed(() => props.selectedIds.length)
const exclusiveCount = computed(() => props.selectedRows.filter(r => r.isExclusive).length)

const formatPrice = (v) => formatPriceThousandth(v)

const previewRows = computed(() => {
  const nonExclusive = props.selectedRows.filter(r => !r.isExclusive).slice(0, 3)
  return nonExclusive.map(r => {
    let newPrice = parseFloat(r.basePrice)
    const { adjustType, adjustValue } = batchForm
    if (adjustType === 'fixed') newPrice = adjustValue
    else if (adjustType === 'increase') newPrice += adjustValue
    else if (adjustType === 'decrease') newPrice -= adjustValue
    else if (adjustType === 'percent') newPrice = newPrice * (1 + adjustValue / 100)
    return {
      name: r.packageName || `${r.hotel?.name || ''} - ${r.room?.roomName || ''}`,
      oldPrice: r.basePrice,
      newPrice: Math.max(0, Math.round(newPrice * 100) / 100)
    }
  })
})

const adjustDialog = ref(false)
const holidayDialog = ref(false)
const expiredDialog = ref(false)

const progressVisible = ref(false)
const progressPercent = ref(0)
const progressSuccess = ref(0)
const progressFailed = ref(0)

const batchForm = reactive({
  adjustType: 'increase',
  adjustValue: 20,
  applyOriginalPrice: false,
  originalPrice: 0,
  applyDiscount: false,
  discountRatio: 8.5,
  dateRange: [],
  reason: ''
})

const resetBatchForm = () => {
  batchForm.adjustType = 'increase'
  batchForm.adjustValue = 20
  batchForm.applyOriginalPrice = false
  batchForm.originalPrice = 0
  batchForm.applyDiscount = false
  batchForm.discountRatio = 8.5
  batchForm.dateRange = []
  batchForm.reason = ''
}

const openBatch = (key, op) => {
  resetBatchForm()
  if (key === 'adjust_price') adjustDialog.value = true
  else if (key === 'enable_holiday') holidayDialog.value = true
  else if (key === 'off_shelf_expired') expiredDialog.value = true
}

const confirmBatch = async (operation) => {
  if (!batchForm.reason?.trim()) {
    ElMessage.warning('请填写操作原因')
    return
  }
  if (operation === 'enable_holiday' && (!batchForm.dateRange?.length === 2)) {
    ElMessage.warning('请选择生效日期范围')
    return
  }

  adjustDialog.value = false
  holidayDialog.value = false
  expiredDialog.value = false

  progressVisible.value = true
  progressPercent.value = 0
  progressSuccess.value = 0
  progressFailed.value = 0

  const tick = () => {
    if (progressPercent.value < 88) progressPercent.value += Math.floor(Math.random() * 14) + 4
  }
  const timer = setInterval(tick, 320)

  try {
    const params = {
      operation,
      ids: props.selectedIds,
      ...batchForm
    }
    if (batchForm.dateRange?.length === 2) {
      params.startDate = batchForm.dateRange[0]
      params.endDate = batchForm.dateRange[1]
    }
    const res = await batchHotelRoomPriceOperation(params)
    clearInterval(timer)
    progressPercent.value = 100
    progressSuccess.value = res?.data?.success || 0
    progressFailed.value = res?.data?.failed || 0
    ElMessage.success(`批量操作完成：成功${progressSuccess.value}，失败${progressFailed.value}`)
    setTimeout(() => {
      progressVisible.value = false
      emit('success', res?.data)
    }, 900)
  } catch (e) {
    clearInterval(timer)
    progressPercent.value = 100
    progressFailed.value = props.selectedIds.length
    ElMessage.error(e.message || '批量操作失败')
    setTimeout(() => { progressVisible.value = false }, 1200)
  }
}
</script>

<script>
import ripple from '@/utils/ripple'
export default { directives: { ripple } }
</script>

<style lang="scss" scoped>
@import '@/styles/hotel-price.scss';
</style>
