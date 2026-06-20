<template>
  <div v-if="selectedCount > 0" class="batch-toolbar" v-ripple>
    <div class="toolbar-left">
      <span class="selected-count">已选中 {{ selectedCount }} 间客房</span>
      <el-tag v-if="suiteCount > 0" type="warning" effect="dark" class="suite-warn">
        含 {{ suiteCount }} 间高端套房，部分批量操作将被排除
      </el-tag>
    </div>
    <div class="toolbar-right">
      <template v-for="(op, key) in HotelRoomBatchOperationEnum" :key="key">
        <el-button
          :type="op.color === '#ff4d4f' ? 'danger' : op.color === '#52c41a' ? 'success' : 'primary'"
          v-ripple
          @click="openBatch(key, op)"
          :disabled="!op.allowSuite && suiteCount > 0 && suiteCount === selectedCount"
        >
          <el-icon style="margin-right:4px">
            <component :is="op.icon" />
          </el-icon>
          {{ op.label }}
        </el-button>
      </template>
      <el-button @click="$emit('clear-selection')">清空选择</el-button>
    </div>

    <el-dialog v-model="facilityDialog" title="批量更新设施标签" width="560px" destroy-on-close>
      <el-form label-width="90px">
        <el-form-item label="设施标签">
          <el-checkbox-group v-model="batchForm.facilities" style="display:flex;flex-wrap:wrap;gap:10px">
            <el-checkbox v-for="item in HotelRoomFacilityOptions" :key="item.value" :label="item.value" border>{{ item.label }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="展示文案">
          <el-input v-model="batchForm.facilityText" type="textarea" :rows="2" placeholder="前台展示设施汇总文案（可选）" />
        </el-form-item>
        <el-form-item label="操作原因" required>
          <el-input v-model="batchForm.reason" type="textarea" :rows="2" placeholder="请填写本次批量操作原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="facilityDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmBatch('update_facilities')">确认批量更新</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="displayDialog" title="批量调整展示状态" width="460px" destroy-on-close>
      <el-form label-width="100px">
        <el-form-item label="首页展示">
          <el-switch v-model="batchForm.displayOnHome" />
          <span style="margin-left:10px;color:#909399">是否在门店首页展示该房型</span>
        </el-form-item>
        <el-form-item label="展示排序">
          <el-input-number v-model="batchForm.displayOrder" :min="0" :max="9999" />
          <span style="margin-left:10px;color:#909399">数值越小靠前</span>
        </el-form-item>
        <el-form-item label="操作原因" required>
          <el-input v-model="batchForm.reason" type="textarea" :rows="2" placeholder="请填写操作原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="displayDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmBatch('adjust_display_status')">确认调整</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="infoDialog" title="批量更新公示信息" width="560px" destroy-on-close>
      <el-form label-width="100px">
        <el-form-item label="房型介绍">
          <el-input v-model="batchForm.description" type="textarea" :rows="3" placeholder="统一更新房型介绍（可选）" />
        </el-form-item>
        <el-form-item label="适配人群">
          <el-select v-model="batchForm.targetGuest" multiple collapse-tags style="width:100%">
            <el-option v-for="item in HotelRoomTargetGuestOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="早餐">
          <el-select v-model="batchForm.breakfast" clearable style="width:100%">
            <el-option v-for="(item, key) in HotelRoomBreakfastEnum" :key="key" :label="item.label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="取消政策">
          <el-select v-model="batchForm.cancelPolicy" clearable style="width:100%">
            <el-option v-for="(item, key) in HotelRoomCancelPolicyEnum" :key="key" :label="item.label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作原因" required>
          <el-input v-model="batchForm.reason" type="textarea" :rows="2" placeholder="请填写操作原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="infoDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmBatch('update_info')">确认更新</el-button>
      </template>
    </el-dialog>

    <div v-if="progressVisible" class="batch-progress-overlay" @click.self>
      <div class="progress-box">
        <div class="progress-title">批量操作执行中...</div>
        <el-progress
          :percentage="progressPercent"
          :stroke-width="14"
          :status="progressPercent === 100 ? 'success' : ''"
          status-icon
        />
        <div class="progress-value">{{ progressPercent }}%</div>
        <div class="progress-detail">
          <div>执行总数：<b>{{ totalCount }}</b></div>
          <div class="detail-success">成功：<b>{{ progressSuccess }}</b></div>
          <div class="detail-failed">失败：<b>{{ progressFailed }}</b></div>
          <div v-if="failures.length" style="margin-top:8px">
            失败明细：
            <div v-for="(f, i) in failures.slice(0, 5)" :key="i" style="color:#ff4d4f;line-height:1.8">
              {{ f.name }}：{{ f.message }}
            </div>
            <div v-if="failures.length > 5" style="color:#909399">... 其余 {{ failures.length - 5 }} 项失败</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Setting, View, Tools, Upload, Edit,
  HotelRoomBatchOperationEnum, HotelRoomFacilityOptions,
  HotelRoomTargetGuestOptions, HotelRoomBreakfastEnum, HotelRoomCancelPolicyEnum
} from '@/utils/enums'
import { batchHotelRoomOperation } from '@/api/hotel'

const props = defineProps({
  selectedIds: { type: Array, default: () => [] },
  selectedRows: { type: Array, default: () => [] },
  hotelId: { type: [Number, String], default: null }
})
const emit = defineEmits(['success', 'clear-selection'])

const selectedCount = computed(() => props.selectedIds.length)
const suiteCount = computed(() => props.selectedRows.filter(r => r.roomType === 'suite').length)
const totalCount = computed(() => props.selectedIds.length)

const facilityDialog = ref(false)
const displayDialog = ref(false)
const infoDialog = ref(false)
const progressVisible = ref(false)
const progressPercent = ref(0)
const progressSuccess = ref(0)
const progressFailed = ref(0)
const failures = ref([])

const batchForm = reactive({
  facilities: [],
  facilityText: '',
  displayOnHome: true,
  displayOrder: 0,
  description: '',
  targetGuest: [],
  breakfast: '',
  cancelPolicy: '',
  reason: ''
})

const resetBatchForm = () => {
  batchForm.facilities = []
  batchForm.facilityText = ''
  batchForm.displayOnHome = true
  batchForm.displayOrder = 0
  batchForm.description = ''
  batchForm.targetGuest = []
  batchForm.breakfast = ''
  batchForm.cancelPolicy = ''
  batchForm.reason = ''
}

const openBatch = (key, op) => {
  if (!props.hotelId) {
    ElMessage.warning('请先选择所属门店（单门店范围内批量）')
    return
  }
  if (key === 'update_facilities') {
    resetBatchForm()
    facilityDialog.value = true
  } else if (key === 'adjust_display_status') {
    resetBatchForm()
    displayDialog.value = true
  } else if (key === 'update_info') {
    resetBatchForm()
    infoDialog.value = true
  } else if (key === 'off_shelf_maintenance' || key === 'on_shelf_batch') {
    ElMessageBox.prompt(`请输入${op.label}的原因`, '批量操作确认', {
      confirmButtonText: '确认执行',
      cancelButtonText: '取消',
      inputPlaceholder: '请填写操作原因',
      inputValidator: (v) => !!v?.trim() || '请填写操作原因'
    }).then(async ({ value }) => {
      await executeBatch(key, { reason: value })
    }).catch(() => {})
  }
}

const confirmBatch = async (operation) => {
  if (!batchForm.reason?.trim()) {
    ElMessage.warning('请填写操作原因')
    return
  }
  const params = { ...batchForm }
  if (params.targetGuest?.length) params.targetGuest = params.targetGuest.join(',')
  facilityDialog.value = false
  displayDialog.value = false
  infoDialog.value = false
  await executeBatch(operation, params)
}

const executeBatch = async (operation, extraParams = {}) => {
  progressVisible.value = true
  progressPercent.value = 0
  progressSuccess.value = 0
  progressFailed.value = 0
  failures.value = []

  const tick = () => {
    if (progressPercent.value < 88) progressPercent.value += Math.floor(Math.random() * 14) + 4
  }
  const timer = setInterval(tick, 320)
  try {
    const payload = {
      operation,
      ids: props.selectedIds,
      hotelId: props.hotelId,
      ...extraParams
    }
    const res = await batchHotelRoomOperation(payload)
    clearInterval(timer)
    progressPercent.value = 100
    progressSuccess.value = res?.data?.success || 0
    progressFailed.value = res?.data?.failed || 0
    failures.value = res?.data?.failures || []
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
@import '@/styles/hotel-room.scss';
</style>
